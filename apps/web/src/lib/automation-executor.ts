/**
 * Automation Action Executor
 *
 * Shared logic for executing automation actions outside of Inngest context.
 * Used by manual trigger and cron routes.
 */

import { dbAdmin } from '@/lib/firebase-admin';

interface ActionContext {
  toolId: string;
  deploymentId: string;
  elementId: string;
  userId: string;
  spaceId?: string;
  campusId: string;
}

interface ActionDef {
  type: string;
  title?: string;
  body?: string;
  recipients?: string | string[];
  elementId?: string;
  mutation?: Record<string, unknown>;
  deploymentId?: string;
  eventName?: string;
}

function interpolate(template: string, context: ActionContext): string {
  const map: Record<string, string> = {
    toolId: context.toolId,
    deploymentId: context.deploymentId,
    elementId: context.elementId,
    userId: context.userId,
    spaceId: context.spaceId || '',
    campusId: context.campusId,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => map[key] || '');
}

export async function executeAutomationActions(
  actions: ActionDef[],
  context: ActionContext
): Promise<void> {
  for (const actionDef of actions) {
    switch (actionDef.type) {
      case 'notify': {
        const { createNotification } = await import('@/lib/notification-service');
        const recipients = actionDef.recipients;
        const title = interpolate(actionDef.title || 'Automation triggered', context);
        const body = interpolate(actionDef.body || '', context);

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
              actionUrl: context.spaceId
                ? `/s/${context.spaceId}?tool=${context.toolId}`
                : `/t/${context.toolId}`,
              metadata: { automationTriggered: true },
            });
          }
        }
        break;
      }

      case 'mutate': {
        const elId = actionDef.elementId;
        const mutation = actionDef.mutation;
        if (!elId || !mutation) break;

        const sharedRef = dbAdmin
          .collection('tool_states')
          .doc(`${context.toolId}_${context.deploymentId}_shared`);

        const updates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(mutation)) {
          updates[`counters.${elId}:${key}`] = value;
        }
        updates['lastModified'] = new Date().toISOString();

        await sharedRef.set(updates, { merge: true });
        break;
      }

      case 'triggerTool': {
        const targetDeploymentId = actionDef.deploymentId;
        const eventName = actionDef.eventName;
        if (!targetDeploymentId || !eventName) break;

        try {
          const { inngest } = await import('@/lib/inngest/client');
          await inngest.send({
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
        } catch (err) {
          console.warn(
            `[automation-executor] triggerTool failed for deployment ${targetDeploymentId} event ${eventName}:`,
            err instanceof Error ? err.message : 'Inngest unavailable'
          );
        }
        break;
      }
    }
  }
}
