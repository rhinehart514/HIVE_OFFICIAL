/**
 * Inngest Functions
 *
 * Durable, event-driven functions for HiveLab automations.
 * Each function handles a specific automation trigger type.
 */

import { inngest } from './client';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

// ============================================================================
// Tool Action Event Handler
// ============================================================================

/**
 * When a tool action is executed, check if any automations should fire.
 * This is the core event-trigger automation handler.
 */
export const handleToolAction = inngest.createFunction(
  {
    id: 'handle-tool-action',
    name: 'Handle Tool Action',
    throttle: { limit: 10, period: '1m', key: 'event.data.deploymentId' },
  },
  { event: 'tool/action.executed' },
  async ({ event, step }) => {
    const { toolId, deploymentId, elementId, action, userId, spaceId, campusId } = event.data;

    // Find automations for this deployment that match this event
    const automations = await step.run('fetch-automations', async () => {
      const snapshot = await dbAdmin
        .collection('tool_automations')
        .where('deploymentId', '==', deploymentId)
        .where('enabled', '==', true)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });

    if (automations.length === 0) return { triggered: 0 };

    let triggered = 0;

    for (const automation of automations) {
      const auto = automation as Record<string, unknown>;
      const trigger = auto.trigger as Record<string, unknown> | undefined;

      // Match event triggers
      if (trigger?.type !== 'event') continue;
      if (trigger.elementId && trigger.elementId !== elementId) continue;
      if (trigger.eventName && trigger.eventName !== action) continue;

      // Check rate limits
      const canRun = await step.run(`check-rate-limit-${automation.id}`, async () => {
        const runHistory = auto.runHistory as Array<{ timestamp: string }> | undefined;
        const maxRunsPerDay = (auto.maxRunsPerDay as number) || 100;
        const cooldownSeconds = (auto.cooldownSeconds as number) || 60;

        const now = Date.now();
        const oneDayAgo = now - 86400000;
        const recentRuns = (runHistory || []).filter(
          r => new Date(r.timestamp).getTime() > oneDayAgo
        );

        if (recentRuns.length >= maxRunsPerDay) return false;

        const lastRun = recentRuns[recentRuns.length - 1];
        if (lastRun && now - new Date(lastRun.timestamp).getTime() < cooldownSeconds * 1000) {
          return false;
        }

        return true;
      });

      if (!canRun) continue;

      // Evaluate conditions
      const conditions = (auto.conditions as Array<Record<string, unknown>>) || [];
      if (conditions.length > 0) {
        const conditionsMet = await step.run(`eval-conditions-${automation.id}`, async () => {
          const sharedDoc = await dbAdmin
            .collection('tool_states')
            .doc(`${toolId}_${deploymentId}_shared`)
            .get();
          const state = sharedDoc.data() || {};

          return conditions.every(cond => {
            const value = getNestedValue(state, cond.path as string);
            return evaluateCondition(value, cond.operator as string, cond.value);
          });
        });

        if (!conditionsMet) continue;
      }

      // Execute actions
      const actions = (auto.actions as Array<Record<string, unknown>>) || [];
      for (const actionDef of actions) {
        await step.run(`execute-action-${automation.id}-${actionDef.type}`, async () => {
          await executeAutomationAction(actionDef, {
            toolId,
            deploymentId,
            elementId,
            userId,
            spaceId,
            campusId,
          });
        });
      }

      // Record run in subcollection + update stats
      await step.run(`record-run-${automation.id}`, async () => {
        const now = new Date().toISOString();
        const docRef = dbAdmin.collection('tool_automations').doc(automation.id as string);

        // Write run record to subcollection for history
        await docRef.collection('runs').add({
          timestamp: now,
          triggerType: 'event',
          elementId,
          action,
          userId,
          status: 'success',
          duration: 0,
        });

        await docRef.update({
          lastRunAt: now,
          runCount: (auto.runCount as number || 0) + 1,
        });
      });

      triggered++;
    }

    return { triggered };
  }
);

// ============================================================================
// Notification Delivery (Durable)
// ============================================================================

/**
 * Durably deliver a notification with retries.
 * Replaces the fire-and-forget pattern in notification-service.ts.
 */
export const deliverNotification = inngest.createFunction(
  {
    id: 'deliver-notification',
    name: 'Deliver Notification',
    retries: 3,
    throttle: { limit: 50, period: '1m', key: 'event.data.userId' },
  },
  { event: 'notification/deliver' },
  async ({ event, step }) => {
    const { notificationId, userId } = event.data;

    // Dynamically import to avoid circular deps
    const { deliverNotification: deliver } = await import('@/lib/notification-delivery-service');

    const notificationDoc = await step.run('fetch-notification', async () => {
      const doc = await dbAdmin.collection('notifications').doc(notificationId).get();
      return doc.exists ? doc.data() : null;
    });

    if (!notificationDoc) {
      logger.warn('Notification not found for delivery', {
        component: 'inngest',
        notificationId,
      });
      return { delivered: false, reason: 'not_found' };
    }

    await step.run('deliver', async () => {
      await deliver(notificationId, notificationDoc as Parameters<typeof deliver>[1], userId);
    });

    return { delivered: true };
  }
);

// ============================================================================
// Tool Deployment Notifications
// ============================================================================

/**
 * When a tool is deployed, notify all space members.
 * Batched to avoid overwhelming the notification system.
 */
export const handleToolDeployed = inngest.createFunction(
  {
    id: 'handle-tool-deployed',
    name: 'Handle Tool Deployed',
  },
  { event: 'tool/deployed' },
  async ({ event, step }) => {
    const { toolId, toolName, spaceId, spaceName, deployedByUserId, deployedByName, memberIds } = event.data;

    const { notifyToolDeployed } = await import('@/lib/tool-notifications');

    const count = await step.run('notify-members', async () => {
      return notifyToolDeployed({
        memberIds,
        deployedByUserId,
        deployedByName,
        toolId,
        toolName,
        spaceId,
        spaceName,
      });
    });

    return { notified: count };
  }
);

// ============================================================================
// Helpers
// ============================================================================

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluateCondition(value: unknown, operator: string, target: unknown): boolean {
  switch (operator) {
    case 'equals':
    case '==':
      return value === target;
    case 'notEquals':
    case '!=':
      return value !== target;
    case 'greaterThan':
    case '>':
      return Number(value) > Number(target);
    case 'lessThan':
    case '<':
      return Number(value) < Number(target);
    case 'greaterOrEqual':
    case '>=':
      return Number(value) >= Number(target);
    case 'lessOrEqual':
    case '<=':
      return Number(value) <= Number(target);
    case 'contains':
      return String(value).includes(String(target));
    case 'notContains':
      return !String(value).includes(String(target));
    case 'isEmpty':
      return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    case 'isNotEmpty':
      return value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
    default:
      return false;
  }
}

async function executeAutomationAction(
  actionDef: Record<string, unknown>,
  context: {
    toolId: string;
    deploymentId: string;
    elementId: string;
    userId: string;
    spaceId?: string;
    campusId: string;
  }
): Promise<void> {
  const type = actionDef.type as string;

  switch (type) {
    case 'notify': {
      const { createNotification } = await import('@/lib/notification-service');
      const recipients = actionDef.recipients as string[] | string;
      const title = interpolate(actionDef.title as string || 'Automation triggered', context);
      const body = interpolate(actionDef.body as string || '', context);

      if (recipients === 'all' && context.spaceId) {
        const members = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', context.spaceId)
          .where('status', '==', 'active')
          .get();

        for (const member of members.docs) {
          const memberId = member.data().userId;
          if (memberId !== context.userId) {
            await createNotification({
              userId: memberId,
              type: 'system',
              category: 'tools',
              title,
              body,
              actionUrl: `/s/${context.spaceId}?tool=${context.toolId}`,
              metadata: { automationTriggered: true },
            });
          }
        }
      } else if (Array.isArray(recipients)) {
        for (const recipientId of recipients) {
          await createNotification({
            userId: recipientId,
            type: 'system',
            category: 'tools',
            title,
            body,
            actionUrl: `/s/${context.spaceId}?tool=${context.toolId}`,
            metadata: { automationTriggered: true },
          });
        }
      }
      break;
    }

    case 'mutate': {
      const elementId = actionDef.elementId as string;
      const mutation = actionDef.mutation as Record<string, unknown>;
      if (!elementId || !mutation) return;

      const sharedRef = dbAdmin
        .collection('tool_states')
        .doc(`${context.toolId}_${context.deploymentId}_shared`);

      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(mutation)) {
        updates[`counters.${elementId}:${key}`] = value;
      }
      updates['lastModified'] = new Date().toISOString();

      await sharedRef.set(updates, { merge: true });
      break;
    }

    case 'triggerTool': {
      const targetDeploymentId = actionDef.deploymentId as string;
      const eventName = actionDef.eventName as string;
      if (!targetDeploymentId || !eventName) return;

      // Fire another tool action event (recursive automation)
      const { inngest: client } = await import('./client');
      await client.send({
        name: 'tool/action.executed',
        data: {
          toolId: context.toolId,
          deploymentId: targetDeploymentId,
          elementId: context.elementId,
          action: eventName,
          userId: 'system',
          campusId: context.campusId,
        },
      });
      break;
    }

    default:
      logger.warn('Unknown automation action type', { component: 'inngest', type });
  }
}

function interpolate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(context[key] || ''));
}
