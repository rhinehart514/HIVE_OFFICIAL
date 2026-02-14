import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { createBulkNotifications, createNotification } from '@/lib/notification-service';

export type ToolNotificationType =
  | 'tool.forked'
  | 'tool.deployed'
  | 'tool.milestone'
  | 'tool.updated';

export interface ToolLifecycleNotificationPayload {
  type: ToolNotificationType;
  title: string;
  body: string;
  toolId: string;
  actionUrl: string;
  timestamp: string;
}

export const TOOL_MILESTONE_THRESHOLDS = [10, 50, 100, 500, 1000] as const;

function buildPayload(
  type: ToolNotificationType,
  params: {
    title: string;
    body: string;
    toolId: string;
    actionUrl: string;
  }
): ToolLifecycleNotificationPayload {
  return {
    type,
    title: params.title,
    body: params.body,
    toolId: params.toolId,
    actionUrl: params.actionUrl,
    timestamp: new Date().toISOString(),
  };
}

export async function notifyToolForked(params: {
  originalCreatorId: string;
  forkedByUserId: string;
  forkedByName?: string;
  toolId: string;
  toolName: string;
  newToolId: string;
}): Promise<string | null> {
  const actorName = params.forkedByName || 'Someone';
  const payload = buildPayload('tool.forked', {
    title: `Someone forked your ${params.toolName}`,
    body: `${actorName} forked your tool.`,
    toolId: params.toolId,
    actionUrl: `/lab/${params.toolId}`,
  });

  return createNotification({
    userId: params.originalCreatorId,
    type: payload.type,
    category: 'tools',
    title: payload.title,
    body: payload.body,
    actionUrl: payload.actionUrl,
    metadata: {
      actorId: params.forkedByUserId,
      actorName,
      toolId: payload.toolId,
      sourceToolId: params.toolId,
      forkedToolId: params.newToolId,
      timestamp: payload.timestamp,
    },
  });
}

export async function notifyToolDeployed(params: {
  memberIds: string[];
  deployedByUserId: string;
  deployedByName?: string;
  toolId: string;
  toolName: string;
  spaceId: string;
  spaceName: string;
}): Promise<number> {
  const actorName = params.deployedByName || 'Someone';
  const payload = buildPayload('tool.deployed', {
    title: `${params.toolName} was added to ${params.spaceName}`,
    body: `${actorName} deployed this tool in ${params.spaceName}.`,
    toolId: params.toolId,
    actionUrl: `/s/${params.spaceId}?tool=${params.toolId}`,
  });

  const recipientIds = params.memberIds.filter(
    (memberId) => memberId && memberId !== params.deployedByUserId
  );

  if (recipientIds.length === 0) {
    return 0;
  }

  return createBulkNotifications(recipientIds, {
    type: payload.type,
    category: 'tools',
    title: payload.title,
    body: payload.body,
    actionUrl: payload.actionUrl,
    metadata: {
      actorId: params.deployedByUserId,
      actorName,
      toolId: payload.toolId,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
      timestamp: payload.timestamp,
    },
  });
}

export async function notifyToolMilestone(params: {
  creatorId: string;
  toolId: string;
  toolName: string;
  milestone: number;
}): Promise<string | null> {
  const payload = buildPayload('tool.milestone', {
    title: `Your ${params.toolName} hit ${params.milestone} uses!`,
    body: `${params.toolName} just crossed ${params.milestone} total uses.`,
    toolId: params.toolId,
    actionUrl: `/lab/${params.toolId}/analytics`,
  });

  return createNotification({
    userId: params.creatorId,
    type: payload.type,
    category: 'tools',
    title: payload.title,
    body: payload.body,
    actionUrl: payload.actionUrl,
    metadata: {
      actorId: `${params.toolId}:${params.milestone}`,
      toolId: payload.toolId,
      milestone: params.milestone,
      timestamp: payload.timestamp,
    },
  });
}

async function findForkRecipientIds(toolId: string, campusId?: string): Promise<string[]> {
  const snapshots = await Promise.allSettled([
    dbAdmin.collection('tools').where('forkedFrom.toolId', '==', toolId).get(),
    dbAdmin.collection('tools').where('provenance.forkedFrom', '==', toolId).get(),
    dbAdmin.collection('tools').where('remixedFrom.toolId', '==', toolId).get(),
    dbAdmin.collection('tools').where('metadata.clonedFrom', '==', toolId).get(),
  ]);

  const recipients = new Set<string>();

  for (const result of snapshots) {
    if (result.status !== 'fulfilled') {
      continue;
    }

    for (const doc of result.value.docs) {
      const data = doc.data();
      if (campusId && data?.campusId && data.campusId !== campusId) {
        continue;
      }

      const recipientId =
        (data?.ownerId as string | undefined) ||
        (data?.creatorId as string | undefined) ||
        (data?.createdBy as string | undefined);

      if (recipientId) {
        recipients.add(recipientId);
      }
    }
  }

  return Array.from(recipients);
}

export async function notifyToolUpdated(params: {
  toolId: string;
  toolName: string;
  updatedByUserId: string;
  updatedByName?: string;
  campusId?: string;
  recipientIds?: string[];
}): Promise<number> {
  const actorName = params.updatedByName || 'A creator';
  const payload = buildPayload('tool.updated', {
    title: `${params.toolName} was updated`,
    body: `${actorName} published updates to a tool you forked.`,
    toolId: params.toolId,
    actionUrl: `/t/${params.toolId}`,
  });

  const recipients =
    params.recipientIds && params.recipientIds.length > 0
      ? params.recipientIds
      : await findForkRecipientIds(params.toolId, params.campusId);

  const uniqueRecipients = Array.from(
    new Set(
      recipients.filter(
        (recipientId) => recipientId && recipientId !== params.updatedByUserId
      )
    )
  );

  if (uniqueRecipients.length === 0) {
    return 0;
  }

  try {
    return await createBulkNotifications(uniqueRecipients, {
      type: payload.type,
      category: 'tools',
      title: payload.title,
      body: payload.body,
      actionUrl: payload.actionUrl,
      metadata: {
        actorId: params.updatedByUserId,
        actorName,
        toolId: payload.toolId,
        timestamp: payload.timestamp,
      },
    });
  } catch (error) {
    logger.warn('Failed to send tool.updated notifications', {
      toolId: params.toolId,
      updatedByUserId: params.updatedByUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
