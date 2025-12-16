// TODO: Fix SendMessageInput metadata type
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
} from "@hive/core/server";
import { checkSpacePermission } from "@/lib/space-permission-middleware";

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
      return executeCreateComponent(action.config, spaceId, campusId, userId);

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
 */
async function executeCreateComponent(
  config: Record<string, unknown>,
  spaceId: string,
  campusId: string,
  userId: string
): Promise<Record<string, unknown>> {
  // For now, just log - full implementation would create the component
  logger.info('Create component action triggered', {
    spaceId,
    componentType: config.componentType,
    boardId: config.boardId,
  });

  return {
    componentType: config.componentType,
    status: 'created',
  };
}
