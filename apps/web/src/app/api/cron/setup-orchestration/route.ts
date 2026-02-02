/**
 * Setup Orchestration Time-Based Triggers Cron Endpoint
 *
 * Called by Vercel Cron every 5 minutes to process:
 * - time_relative orchestration triggers (X minutes before/after timestamp)
 *
 * POST /api/cron/setup-orchestration
 *
 * Requires CRON_SECRET header for security.
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { createBulkNotifications } from '@/lib/notification-service';

const CRON_SECRET = process.env.CRON_SECRET;

interface OrchestrationResult {
  deploymentId: string;
  ruleId: string;
  triggerType: 'time_relative' | 'data_condition';
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: OrchestrationResult[] = [];
  const now = new Date();

  try {
    // Get all active setup deployments
    const deploymentsSnapshot = await dbAdmin
      .collection('setupDeployments')
      .where('status', '==', 'active')
      .get();

    for (const deploymentDoc of deploymentsSnapshot.docs) {
      const deploymentId = deploymentDoc.id;
      const deployment = deploymentDoc.data();
      const orchestrationRules = deployment.orchestrationRules || [];
      const orchestrationState = deployment.orchestrationState || {};
      const executedRules = orchestrationState.executedRules || [];
      const sharedData = deployment.sharedData || {};

      // Find time_relative rules that haven't been executed (or can run multiple times)
      for (const rule of orchestrationRules) {
        if (rule.trigger?.type !== 'time_relative') continue;
        if (rule.runOnce && executedRules.includes(rule.id)) continue;

        const trigger = rule.trigger;
        const referenceField = trigger.referenceField; // e.g., 'eventDate'
        const offsetMinutes = trigger.offsetMinutes || 0; // e.g., -60 for 1 hour before

        // Get the reference timestamp from shared data
        const referenceValue = getNestedValue(sharedData, referenceField);
        if (!referenceValue) continue;

        // Ensure the reference value is a valid date string or number
        if (typeof referenceValue !== 'string' && typeof referenceValue !== 'number') continue;

        const referenceTime = new Date(referenceValue);
        if (isNaN(referenceTime.getTime())) continue;

        // Calculate trigger time
        const triggerTime = new Date(referenceTime.getTime() + offsetMinutes * 60 * 1000);

        // Check if we're within the trigger window (within 5 minutes)
        const timeDiff = Math.abs(now.getTime() - triggerTime.getTime());
        if (timeDiff > 5 * 60 * 1000) continue;

        // Check cooldown - don't re-trigger within 1 hour
        const lastTriggered = orchestrationState.lastTriggered?.[rule.id];
        if (lastTriggered) {
          const lastTriggerTime = new Date(lastTriggered);
          const hoursSinceLastTrigger = (now.getTime() - lastTriggerTime.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastTrigger < 1) continue;
        }

        try {
          // Execute the rule's actions
          for (const action of rule.actions || []) {
            await executeOrchestrationAction(
              action,
              deploymentId,
              deployment,
              sharedData
            );
          }

          // Mark rule as executed
          const updates: Record<string, unknown> = {
            [`orchestrationState.lastTriggered.${rule.id}`]: now.toISOString(),
          };

          if (rule.runOnce) {
            updates[`orchestrationState.executedRules`] = FieldValue.arrayUnion(rule.id);
          }

          // Add log entry
          const logEntry = {
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now.toISOString(),
            triggerType: 'time_relative',
            success: true,
            actionsExecuted: (rule.actions || []).map((a: { type: string }) => a.type),
          };
          updates[`orchestrationState.executionLog`] = FieldValue.arrayUnion(logEntry);

          await deploymentDoc.ref.update(updates);

          results.push({
            deploymentId,
            ruleId: rule.id,
            triggerType: 'time_relative',
            success: true,
          });

          logger.info('Setup orchestration time trigger executed', {
            deploymentId,
            ruleId: rule.id,
            ruleName: rule.name,
            referenceField,
            offsetMinutes,
          });
        } catch (error) {
          // Log failure
          const logEntry = {
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now.toISOString(),
            triggerType: 'time_relative',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };

          await deploymentDoc.ref.update({
            [`orchestrationState.executionLog`]: FieldValue.arrayUnion(logEntry),
          });

          results.push({
            deploymentId,
            ruleId: rule.id,
            triggerType: 'time_relative',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });

          logger.error('Setup orchestration time trigger failed', {
            deploymentId,
            ruleId: rule.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Process data_condition triggers
      for (const rule of orchestrationRules) {
        if (rule.trigger?.type !== 'data_condition') continue;
        if (rule.runOnce && executedRules.includes(rule.id)) continue;

        const trigger = rule.trigger;
        const dataPath = trigger.dataPath as string;
        const operator = trigger.operator as string;
        const targetValue = trigger.value;

        // Get actual value from shared data
        const actualValue = getNestedValue(sharedData, dataPath);
        if (actualValue === undefined) continue;

        // Evaluate condition
        let conditionMet = false;
        switch (operator) {
          case 'eq':
            conditionMet = actualValue === targetValue;
            break;
          case 'neq':
            conditionMet = actualValue !== targetValue;
            break;
          case 'gt':
            conditionMet = typeof actualValue === 'number' && actualValue > (targetValue as number);
            break;
          case 'gte':
            conditionMet = typeof actualValue === 'number' && actualValue >= (targetValue as number);
            break;
          case 'lt':
            conditionMet = typeof actualValue === 'number' && actualValue < (targetValue as number);
            break;
          case 'lte':
            conditionMet = typeof actualValue === 'number' && actualValue <= (targetValue as number);
            break;
          case 'contains':
            if (Array.isArray(actualValue)) {
              conditionMet = actualValue.includes(targetValue);
            } else if (typeof actualValue === 'string') {
              conditionMet = actualValue.includes(targetValue as string);
            }
            break;
          case 'exists':
            conditionMet = actualValue !== undefined && actualValue !== null;
            break;
        }

        if (!conditionMet) continue;

        // Check cooldown - don't re-trigger within 1 hour
        const lastTriggered = orchestrationState.lastTriggered?.[rule.id];
        if (lastTriggered) {
          const lastTriggerTime = new Date(lastTriggered);
          const hoursSinceLastTrigger = (now.getTime() - lastTriggerTime.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastTrigger < 1) continue;
        }

        try {
          // Execute the rule's actions
          for (const action of rule.actions || []) {
            await executeOrchestrationAction(
              action,
              deploymentId,
              deployment,
              sharedData
            );
          }

          // Mark rule as executed
          const updates: Record<string, unknown> = {
            [`orchestrationState.lastTriggered.${rule.id}`]: now.toISOString(),
          };

          if (rule.runOnce) {
            updates[`orchestrationState.executedRules`] = FieldValue.arrayUnion(rule.id);
          }

          // Add log entry
          const logEntry = {
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now.toISOString(),
            triggerType: 'data_condition',
            success: true,
            actionsExecuted: (rule.actions || []).map((a: { type: string }) => a.type),
            conditionMet: { dataPath, operator, targetValue, actualValue },
          };
          updates[`orchestrationState.executionLog`] = FieldValue.arrayUnion(logEntry);

          await deploymentDoc.ref.update(updates);

          results.push({
            deploymentId,
            ruleId: rule.id,
            triggerType: 'data_condition',
            success: true,
          });

          logger.info('Setup orchestration data condition executed', {
            deploymentId,
            ruleId: rule.id,
            ruleName: rule.name,
            dataPath,
            operator,
            targetValue,
            actualValue,
          });
        } catch (error) {
          // Log failure
          const logEntry = {
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: now.toISOString(),
            triggerType: 'data_condition',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };

          await deploymentDoc.ref.update({
            [`orchestrationState.executionLog`]: FieldValue.arrayUnion(logEntry),
          });

          results.push({
            deploymentId,
            ruleId: rule.id,
            triggerType: 'data_condition',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });

          logger.error('Setup orchestration data condition failed', {
            deploymentId,
            ruleId: rule.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logger.info('Setup orchestration cron processed', {
      total: results.length,
      success: successCount,
      failed: failCount,
    });

    return NextResponse.json({
      processed: results.length,
      success: successCount,
      failed: failCount,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('Setup orchestration cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Execute a single orchestration action
 */
async function executeOrchestrationAction(
  action: { type: string; [key: string]: unknown },
  deploymentId: string,
  deployment: Record<string, unknown>,
  sharedData: Record<string, unknown>
): Promise<void> {
  const spaceId = deployment.spaceId as string;
  const tools = deployment.tools as Array<{ slotId: string; toolId: string; deploymentId: string }> || [];

  if (action.type === 'visibility') {
    // Update tool visibility
    const targetSlotId = action.targetSlotId as string;
    const visible = action.visible as boolean;

    const tool = tools.find(t => t.slotId === targetSlotId);
    if (tool?.deploymentId) {
      await dbAdmin
        .collection('placedTools')
        .doc(tool.deploymentId)
        .update({
          visible,
          updatedAt: FieldValue.serverTimestamp(),
        });
    }
  } else if (action.type === 'config') {
    // Update tool config
    const targetSlotId = action.targetSlotId as string;
    const configUpdates = action.config as Record<string, unknown>;

    const tool = tools.find(t => t.slotId === targetSlotId);
    if (tool?.deploymentId && configUpdates) {
      const updates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      for (const [key, value] of Object.entries(configUpdates)) {
        updates[`config.${key}`] = value;
      }
      await dbAdmin
        .collection('placedTools')
        .doc(tool.deploymentId)
        .update(updates);
    }
  } else if (action.type === 'notification') {
    // Send notifications
    const recipients = action.recipients as string || 'all';
    const title = action.title as string || 'Setup Notification';
    const body = action.body as string || '';

    let userIds: string[] = [];

    if (recipients === 'all' && spaceId) {
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('isActive', '==', true)
        .get();
      userIds = membersSnapshot.docs.map(d => d.data().userId);
    } else if (recipients === 'leaders' && spaceId) {
      const leadersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('role', 'in', ['owner', 'admin', 'moderator', 'leader'])
        .where('isActive', '==', true)
        .get();
      userIds = leadersSnapshot.docs.map(d => d.data().userId);
    }

    if (userIds.length > 0) {
      // Interpolate variables in title and body
      const interpolatedTitle = interpolateTemplate(title, sharedData);
      const interpolatedBody = interpolateTemplate(body, sharedData);

      await createBulkNotifications(userIds, {
        type: 'system',
        category: 'tools',
        title: interpolatedTitle,
        body: interpolatedBody,
        actionUrl: spaceId ? `/s/${spaceId}` : undefined,
        metadata: {
          deploymentId,
          templateId: deployment.templateId,
          orchestrationType: 'time_relative',
        },
      });
    }
  } else if (action.type === 'data_flow') {
    // Move data between shared data fields
    const sourceField = action.sourceField as string;
    const targetField = action.targetField as string;

    if (sourceField && targetField) {
      const sourceValue = getNestedValue(sharedData, sourceField);
      if (sourceValue !== undefined) {
        await dbAdmin
          .collection('setupDeployments')
          .doc(deploymentId)
          .update({
            [`sharedData.${targetField}`]: sourceValue,
            updatedAt: FieldValue.serverTimestamp(),
          });
      }
    }
  } else if (action.type === 'state') {
    // Update shared state
    const updates = action.updates as Record<string, unknown>;
    if (updates) {
      const stateUpdates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      for (const [key, value] of Object.entries(updates)) {
        stateUpdates[`sharedData.${key}`] = value;
      }
      await dbAdmin
        .collection('setupDeployments')
        .doc(deploymentId)
        .update(stateUpdates);
    }
  }
}

/**
 * Interpolate template variables like {eventName} with shared data values
 */
function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = getNestedValue(data, key);
    return value !== undefined ? String(value) : match;
  });
}

// Also support GET for Vercel Cron
export async function GET(request: Request) {
  return POST(request);
}
