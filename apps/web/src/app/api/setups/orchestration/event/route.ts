/**
 * Setup Orchestration Event API
 *
 * POST /api/setups/orchestration/event - Handle tool events for orchestration
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getServerSetupDeploymentRepository,
  toSetupDeploymentDetailDTO,
  dbAdmin,
} from '@hive/core/server';
import type {
  OrchestrationRule,
  ToolEventTriggerConfig,
  OrchestrationLogEntry,
} from '@hive/core';

// ============================================================================
// Request Validation
// ============================================================================

const ToolEventSchema = z.object({
  deploymentId: z.string().min(1, 'Deployment ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
  eventType: z.string().min(1, 'Event type is required'),
  payload: z.record(z.unknown()).optional(),
});

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// POST /api/setups/orchestration/event
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return errorResponse('Not authenticated', 401);
    }

    // Parse session
    let session: { userId: string };
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return errorResponse('Invalid session', 401);
    }

    const { userId } = session;

    // Parse request body
    const body = await request.json();
    const parseResult = ToolEventSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(parseResult.error.errors[0].message, 400);
    }

    const { deploymentId, slotId, eventType, payload } = parseResult.data;

    // Get repository
    const repo = getServerSetupDeploymentRepository();

    // Find deployment
    const deploymentResult = await repo.findById(deploymentId);

    if (deploymentResult.isFailure) {
      return errorResponse('Deployment not found', 404);
    }

    const deployment = deploymentResult.getValue();

    // Check if deployment is active
    if (deployment.status !== 'active') {
      return errorResponse('Deployment is not active', 400);
    }

    // Find matching rules
    const matchingRules = deployment.orchestrationRules.filter(rule => {
      if (!rule.enabled) return false;
      if (rule.trigger.type !== 'tool_event') return false;

      const config = rule.trigger as ToolEventTriggerConfig;
      return config.sourceSlotId === slotId && config.eventType === eventType;
    });

    if (matchingRules.length === 0) {
      return jsonResponse({
        executed: [],
        message: 'No matching rules found',
      });
    }

    // Execute matching rules
    const executedRules: string[] = [];
    const logEntries: OrchestrationLogEntry[] = [];

    for (const rule of matchingRules) {
      // Check if runOnce rule has already been executed
      if (rule.runOnce && deployment.hasRuleExecuted(rule.id)) {
        continue;
      }

      // Execute actions
      const actionsExecuted: Array<{
        actionType: string;
        targetSlotId?: string;
        success: boolean;
        error?: string;
      }> = [];

      for (const action of rule.actions) {
        try {
          await executeAction(deployment, action, payload);
          actionsExecuted.push({
            actionType: action.type,
            targetSlotId: 'targetSlotId' in action ? action.targetSlotId : undefined,
            success: true,
          });
        } catch (error) {
          actionsExecuted.push({
            actionType: action.type,
            targetSlotId: 'targetSlotId' in action ? action.targetSlotId : undefined,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log the execution
      const logEntry: Omit<OrchestrationLogEntry, 'id'> = {
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt: new Date(),
        triggerType: 'tool_event',
        triggerDetails: { slotId, eventType, payload },
        actionsExecuted,
        triggeredBy: userId,
        success: actionsExecuted.every(a => a.success),
      };

      logEntries.push({ ...logEntry, id: `log_${Date.now()}` });
      deployment.addLogEntry(logEntry);

      // Mark rule as executed
      deployment.markRuleExecuted(rule.id);
      executedRules.push(rule.id);
    }

    // Save updated deployment
    await repo.save(deployment);

    // Return results
    const dto = toSetupDeploymentDetailDTO(deployment);

    return jsonResponse({
      executed: executedRules,
      logs: logEntries,
      deployment: dto,
    });
  } catch (error) {
    console.error('[API] Error handling orchestration event:', error);
    return errorResponse('Failed to handle orchestration event', 500);
  }
}

// ============================================================================
// Action Executor
// ============================================================================

async function executeAction(
  deployment: ReturnType<typeof import('@hive/core').SetupDeployment.reconstitute>,
  action: OrchestrationRule['actions'][0],
  eventPayload?: Record<string, unknown>,
): Promise<void> {
  switch (action.type) {
    case 'visibility': {
      const { targetSlotId, visible } = action;
      deployment.setToolVisibility(targetSlotId, visible);

      // Also update the placed_tool document
      const tool = deployment.getTool(targetSlotId);
      if (tool) {
        await dbAdmin
          .collection('spaces')
          .doc(deployment.spaceId)
          .collection('placed_tools')
          .doc(tool.deploymentId)
          .update({
            isActive: visible,
            updatedAt: new Date().toISOString(),
          });
      }
      break;
    }

    case 'config': {
      const { targetSlotId, updates } = action;
      deployment.updateToolConfig(targetSlotId, updates);

      // Also update the placed_tool document
      const tool = deployment.getTool(targetSlotId);
      if (tool) {
        const configUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
          configUpdates[`config.${key}`] = value;
        }
        configUpdates.updatedAt = new Date().toISOString();

        await dbAdmin
          .collection('spaces')
          .doc(deployment.spaceId)
          .collection('placed_tools')
          .doc(tool.deploymentId)
          .update(configUpdates);
      }
      break;
    }

    case 'data_flow': {
      const { sourceSlotId, sourceOutput, targetSlotId, targetInput } = action;

      // Get data from event payload or shared state
      let sourceData: unknown;

      if (eventPayload && sourceOutput in eventPayload) {
        sourceData = eventPayload[sourceOutput];
      } else {
        sourceData = deployment.getSharedDataValue(`${sourceSlotId}.${sourceOutput}`);
      }

      // Update target
      if (targetSlotId === '_shared') {
        deployment.setSharedDataValue(targetInput, sourceData);
      } else {
        deployment.setSharedDataValue(`${targetSlotId}.${targetInput}`, sourceData);

        // Also update the placed_tool config
        const tool = deployment.getTool(targetSlotId);
        if (tool) {
          await dbAdmin
            .collection('spaces')
            .doc(deployment.spaceId)
            .collection('placed_tools')
            .doc(tool.deploymentId)
            .update({
              [`config.${targetInput}`]: sourceData,
              updatedAt: new Date().toISOString(),
            });
        }
      }
      break;
    }

    case 'state': {
      const { targetSlotId, updates, merge } = action;

      if (targetSlotId === '_shared') {
        if (merge) {
          deployment.updateSharedData(updates);
        } else {
          // Replace (not typically recommended)
          for (const [key, value] of Object.entries(updates)) {
            deployment.setSharedDataValue(key, value);
          }
        }
      } else {
        for (const [key, value] of Object.entries(updates)) {
          deployment.setSharedDataValue(`${targetSlotId}.${key}`, value);
        }
      }
      break;
    }

    case 'notification': {
      const { recipients, title, body, actionUrl } = action;

      // TODO: Integrate with notification system
      // For now, just log that a notification would be sent
      console.log('[Orchestration] Would send notification:', {
        recipients,
        title,
        body,
        actionUrl,
        spaceId: deployment.spaceId,
      });
      break;
    }

    default:
      console.warn('[Orchestration] Unknown action type:', (action as { type: string }).type);
  }
}
