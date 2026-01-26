import { z } from "zod";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { logger } from "@/lib/structured-logger";
import { dbAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
  type InlineComponentType,
} from "@hive/core/server";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { createBulkNotifications } from "@/lib/notification-service";

/**
 * Automation Trigger API
 *
 * POST /api/spaces/[spaceId]/automations/trigger
 *
 * Triggers automations for a specific event type. Called internally
 * when events like member_join occur.
 *
 * This is the "execution engine" for automations.
 */

const TriggerAutomationSchema = z.object({
  triggerType: z.enum(['member_join', 'event_reminder', 'keyword', 'reaction_threshold']),
  data: z.object({
    // member_join
    memberId: z.string().optional(),
    memberName: z.string().optional(),
    // event_reminder
    eventId: z.string().optional(),
    eventTitle: z.string().optional(),
    // keyword
    messageId: z.string().optional(),
    messageContent: z.string().optional(),
    authorId: z.string().optional(),
    boardId: z.string().optional(),
  }),
});

type TriggerData = z.output<typeof TriggerAutomationSchema>;

/**
 * POST /api/spaces/[spaceId]/automations/trigger - Execute matching automations
 */
export const POST = withAuthValidationAndErrors(
  TriggerAutomationSchema as z.ZodType<TriggerData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: TriggerData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Find matching automations for this trigger type
    const automationsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .where('trigger.type', '==', data.triggerType)
      .where('enabled', '==', true)
      .get();

    if (automationsSnapshot.empty) {
      return respond.success({
        triggered: 0,
        message: 'No active automations for this trigger',
      });
    }

    const results: Array<{
      automationId: string;
      automationName: string;
      success: boolean;
      error?: string;
      output?: Record<string, unknown>;
    }> = [];

    // Execute each automation
    for (const doc of automationsSnapshot.docs) {
      const automation = doc.data();
      const automationId = doc.id;

      try {
        const output = await executeAction(
          automation.action,
          spaceId,
          campusId,
          userId,
          data.data
        );

        // Record success
        await doc.ref.update({
          'stats.timesTriggered': FieldValue.increment(1),
          'stats.successCount': FieldValue.increment(1),
          'stats.lastTriggered': new Date(),
        });

        results.push({
          automationId,
          automationName: automation.name,
          success: true,
          output,
        });

        logger.info('Automation executed successfully', {
          automationId,
          automationName: automation.name,
          spaceId,
          triggerType: data.triggerType,
        });
      } catch (error) {
        // Record failure
        await doc.ref.update({
          'stats.timesTriggered': FieldValue.increment(1),
          'stats.failureCount': FieldValue.increment(1),
          'stats.lastTriggered': new Date(),
        });

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          automationId,
          automationName: automation.name,
          success: false,
          error: errorMessage,
        });

        logger.error('Automation execution failed', {
          automationId,
          automationName: automation.name,
          spaceId,
          triggerType: data.triggerType,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return respond.success({
      triggered: results.length,
      success: successCount,
      failed: failureCount,
      results,
    });
  }
);

/**
 * Execute an automation action
 */
async function executeAction(
  action: { type: string; config: Record<string, unknown> },
  spaceId: string,
  campusId: string,
  userId: string,
  triggerData: TriggerData['data']
): Promise<Record<string, unknown>> {
  switch (action.type) {
    case 'send_message':
      return executeSendMessage(action.config, spaceId, campusId, userId, triggerData);

    case 'create_component':
      return executeCreateComponent(action.config, spaceId, campusId, userId, triggerData);

    case 'notify':
      return executeNotify(action.config, spaceId, campusId, triggerData);

    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}

/**
 * Execute send_message action
 */
async function executeSendMessage(
  config: Record<string, unknown>,
  spaceId: string,
  campusId: string,
  userId: string,
  triggerData: TriggerData['data']
): Promise<Record<string, unknown>> {
  const boardId = (config.boardId as string) || 'general';
  let content = config.content as string;

  // Interpolate variables
  content = content
    .replace(/\{member\}/g, triggerData.memberName || 'Member')
    .replace(/\{member\.name\}/g, triggerData.memberName || 'Member')
    .replace(/\{event\}/g, triggerData.eventTitle || 'Event')
    .replace(/\{event\.title\}/g, triggerData.eventTitle || 'Event');

  // Create permission check callback
  const checkPermission: CheckPermissionFn = async (uid: string, sid: string) => {
    const permCheck = await checkSpacePermission(sid, uid, 'member');
    if (!permCheck.hasPermission) {
      return { allowed: false };
    }
    return { allowed: true, role: permCheck.role };
  };

  // Create user profile getter callback
  const getUserProfile: GetUserProfileFn = async (uid: string) => {
    const userDoc = await dbAdmin.collection('profiles').doc(uid).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data()!;
    return {
      displayName: data.displayName || data.name || 'HIVE Bot',
      avatarUrl: data.avatarUrl || data.photoURL,
    };
  };

  // Find or create the general board
  const boardsRef = dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('boards');

  let targetBoardId = boardId;

  if (boardId === 'general') {
    // Find the general board
    const generalBoard = await boardsRef
      .where('name', '==', 'General')
      .limit(1)
      .get();

    if (!generalBoard.empty) {
      targetBoardId = generalBoard.docs[0].id;
    } else {
      // Create general board if it doesn't exist
      const newBoardRef = boardsRef.doc();
      await newBoardRef.set({
        id: newBoardRef.id,
        spaceId,
        name: 'General',
        type: 'chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        isLocked: false,
        campusId,
      });
      targetBoardId = newBoardRef.id;
    }
  }

  // Use the chat service to send the message
  const chatService = createServerSpaceChatService(
    { userId, campusId },
    { checkPermission, getUserProfile }
  );

  // Send as a system message from the automation
  // Note: metadata field is not part of SendMessageInput, automation info is tracked separately
  const result = await chatService.sendMessage(userId, {
    spaceId,
    boardId: targetBoardId,
    content,
  });

  if (result.isFailure) {
    throw new Error(result.error || 'Failed to send message');
  }

  return {
    messageId: result.getValue().data.messageId,
    boardId: targetBoardId,
  };
}

/**
 * Execute create_component action
 * Creates inline components (polls, countdowns, RSVPs) in chat
 */
async function executeCreateComponent(
  config: Record<string, unknown>,
  spaceId: string,
  campusId: string,
  userId: string,
  triggerData: TriggerData['data']
): Promise<Record<string, unknown>> {
  const componentType = (config.componentType as string) || 'poll';
  const boardId = (config.boardId as string) || 'general';

  // Create permission check callback
  const checkPermission: CheckPermissionFn = async (uid: string, sid: string) => {
    const permCheck = await checkSpacePermission(sid, uid, 'member');
    if (!permCheck.hasPermission) {
      return { allowed: false };
    }
    return { allowed: true, role: permCheck.role };
  };

  // Create user profile getter callback
  const getUserProfile: GetUserProfileFn = async (uid: string) => {
    const userDoc = await dbAdmin.collection('profiles').doc(uid).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data()!;
    return {
      displayName: data.displayName || data.name || 'HIVE Bot',
      avatarUrl: data.avatarUrl || data.photoURL,
    };
  };

  // Find the target board
  const boardsRef = dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('boards');

  let targetBoardId = boardId;

  if (boardId === 'general') {
    const generalBoard = await boardsRef
      .where('name', '==', 'General')
      .limit(1)
      .get();

    if (!generalBoard.empty) {
      targetBoardId = generalBoard.docs[0].id;
    } else {
      const anyBoard = await boardsRef.limit(1).get();
      if (!anyBoard.empty) {
        targetBoardId = anyBoard.docs[0].id;
      } else {
        throw new Error('No board found for component');
      }
    }
  }

  // Build component config based on type
  let componentConfig: Record<string, unknown> = {};
  let content = '';

  if (componentType === 'poll') {
    componentConfig = {
      question: (config.question as string) || 'What do you think?',
      options: (config.options as string[]) || ['Option A', 'Option B'],
      allowMultiple: config.allowMultiple ?? false,
      showResults: 'after_vote',
    };
    content = `📊 ${componentConfig.question}`;
  } else if (componentType === 'countdown') {
    // Interpolate event title if available
    let title = (config.title as string) || 'Upcoming Event';
    if (triggerData.eventTitle) {
      title = title.replace(/\{event\}/g, triggerData.eventTitle)
        .replace(/\{event\.title\}/g, triggerData.eventTitle);
    }
    componentConfig = {
      title,
      targetDate: config.targetDate ? new Date(config.targetDate as string) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    content = `⏱️ Countdown to: ${title}`;
  } else if (componentType === 'rsvp') {
    componentConfig = {
      eventId: triggerData.eventId || config.eventId,
      eventTitle: triggerData.eventTitle || (config.eventTitle as string) || 'Event',
      eventDate: config.eventDate ? new Date(config.eventDate as string) : undefined,
      maxCapacity: config.maxCapacity,
      allowMaybe: config.allowMaybe ?? true,
    };
    content = `📅 RSVP for: ${componentConfig.eventTitle}`;
  }

  // Create the chat service
  const chatService = createServerSpaceChatService(
    { userId, campusId },
    { checkPermission, getUserProfile }
  );

  const result = await chatService.createInlineComponent(userId, {
    spaceId,
    boardId: targetBoardId,
    content,
    componentType: componentType as InlineComponentType,
    componentConfig: componentConfig as {
      question?: string;
      options?: string[];
      allowMultiple?: boolean;
      showResults?: 'always' | 'after_vote' | 'after_close';
      closesAt?: Date;
      title?: string;
      targetDate?: Date;
      eventId?: string;
      eventTitle?: string;
      eventDate?: Date;
      maxCapacity?: number;
      allowMaybe?: boolean;
    },
  });

  if (result.isFailure) {
    throw new Error(result.error || 'Failed to create component');
  }

  const componentResult = result.getValue().data;

  logger.info('Component created via automation', {
    spaceId,
    boardId: targetBoardId,
    componentType,
    messageId: componentResult.messageId,
    componentId: componentResult.componentId,
  });

  return {
    componentType,
    messageId: componentResult.messageId,
    componentId: componentResult.componentId,
    status: 'created',
  };
}

/**
 * Execute notify action
 * Sends in-app notifications to space leaders or specific recipients
 */
async function executeNotify(
  config: Record<string, unknown>,
  spaceId: string,
  campusId: string,
  triggerData: TriggerData['data']
): Promise<Record<string, unknown>> {
  const recipients = (config.recipients as string) || 'leaders';
  let title = (config.title as string) || 'Automation Alert';
  let body = (config.body as string) || '';

  // Interpolate variables
  title = title
    .replace(/\{member\}/g, triggerData.memberName || 'Member')
    .replace(/\{member\.name\}/g, triggerData.memberName || 'Member')
    .replace(/\{event\}/g, triggerData.eventTitle || 'Event')
    .replace(/\{event\.title\}/g, triggerData.eventTitle || 'Event');

  body = body
    .replace(/\{member\}/g, triggerData.memberName || 'Member')
    .replace(/\{member\.name\}/g, triggerData.memberName || 'Member')
    .replace(/\{event\}/g, triggerData.eventTitle || 'Event')
    .replace(/\{event\.title\}/g, triggerData.eventTitle || 'Event')
    .replace(/\{message\}/g, triggerData.messageContent || '');

  // Get recipient user IDs
  let userIds: string[] = [];

  if (recipients === 'leaders') {
    // Notify space leaders (owners, admins, moderators)
    const leadersSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .where('role', 'in', ['owner', 'admin', 'moderator', 'leader'])
      .where('isActive', '==', true)
      .get();

    userIds = leadersSnapshot.docs.map(doc => doc.data().userId);
  } else if (recipients === 'all') {
    // Notify all space members
    const membersSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .get();

    userIds = membersSnapshot.docs.map(doc => doc.data().userId);
  } else if (recipients.startsWith('user:')) {
    // Notify specific user
    userIds = [recipients.replace('user:', '')];
  }

  if (userIds.length === 0) {
    logger.warn('No recipients found for notify action', {
      spaceId,
      recipients,
    });
    return {
      notified: 0,
      status: 'no_recipients',
    };
  }

  // Get space name for notification context
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  const spaceName = spaceDoc.data()?.name || 'Space';

  // Create notifications
  const notifiedCount = await createBulkNotifications(userIds, {
    type: 'system',
    category: 'spaces',
    title,
    body,
    actionUrl: `/spaces/${spaceId}`,
    metadata: {
      spaceId,
      spaceName,
      isAutomation: true,
      triggerMemberId: triggerData.memberId,
      triggerEventId: triggerData.eventId,
    },
  });

  logger.info('Notify action executed', {
    spaceId,
    recipients,
    userCount: userIds.length,
    notifiedCount,
  });

  return {
    notified: notifiedCount,
    recipientType: recipients,
    status: 'sent',
  };
}
