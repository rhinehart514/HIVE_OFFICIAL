import { z } from "zod";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";

/**
 * Message Reaction API
 *
 * POST /api/spaces/[spaceId]/chat/[messageId]/react - Add/toggle reaction
 */

const ReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
  boardId: z.string().min(1),
});

/**
 * Create permission check callback
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'admin' | 'owner' | 'read') => {
    if (requiredRole === 'read') {
      const memberCheck = await checkSpacePermission(spaceId, userId, 'member');
      if (memberCheck.hasPermission) {
        return { allowed: true, role: memberCheck.role };
      }
      const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
      if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
        return { allowed: true, role: 'guest' };
      }
      return { allowed: false };
    }
    const permCheck = await checkSpacePermission(spaceId, userId, requiredRole);
    if (!permCheck.hasPermission) {
      return { allowed: false };
    }
    return { allowed: true, role: permCheck.role };
  };
}

/**
 * Create user profile getter callback
 */
function createProfileGetter(): GetUserProfileFn {
  return async (userId: string) => {
    const userDoc = await dbAdmin.collection('profiles').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    const data = userDoc.data()!;
    return {
      displayName: data.displayName || data.name || 'Member',
      avatarUrl: data.avatarUrl || data.photoURL,
    };
  };
}

/**
 * POST /api/spaces/[spaceId]/chat/[messageId]/react - Add/toggle reaction
 *
 * If user already reacted with this emoji, it removes the reaction.
 * If user hasn't reacted, it adds the reaction.
 */
type ReactionData = z.output<typeof ReactionSchema>;

export const POST = withAuthValidationAndErrors(
  ReactionSchema as z.ZodType<ReactionData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; messageId: string }> },
    data: ReactionData,
    respond
  ) => {
    const { spaceId, messageId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId || !messageId) {
      return respond.error("Space ID and Message ID are required", "INVALID_INPUT", { status: 400 });
    }

    // Create the chat service
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    // First, check if user already has this reaction to determine toggle behavior
    const messageRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(data.boardId)
      .collection('messages')
      .doc(messageId);

    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
      return respond.error("Message not found", "NOT_FOUND", { status: 404 });
    }

    const messageData = messageDoc.data()!;
    const reactions = messageData.reactions || [];
    const existingReaction = reactions.find((r: { emoji: string; userIds: string[] }) => r.emoji === data.emoji);
    const hasReacted = existingReaction?.userIds?.includes(userId) || false;

    // Toggle: remove if exists, add if not
    let result;
    if (hasReacted) {
      result = await chatService.removeReaction(userId, {
        spaceId,
        boardId: data.boardId,
        messageId,
        emoji: data.emoji,
      });
    } else {
      result = await chatService.addReaction(userId, {
        spaceId,
        boardId: data.boardId,
        messageId,
        emoji: data.emoji,
      });
    }

    if (result.isFailure) {
      const errorMsg = result.error ?? "Failed to update reaction";
      if (errorMsg.includes('member')) {
        return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
      }
      if (errorMsg.includes('not found')) {
        return respond.error(errorMsg, "NOT_FOUND", { status: 404 });
      }
      return respond.error(errorMsg, "UPDATE_FAILED", { status: 500 });
    }

    logger.info(`Reaction ${hasReacted ? 'removed' : 'added'}: ${data.emoji} on message ${messageId}`, {
      spaceId,
      messageId,
      emoji: data.emoji,
      userId,
      action: hasReacted ? 'removed' : 'added',
    });

    // Trigger reaction threshold automations (non-blocking, only on add)
    if (!hasReacted) {
      triggerReactionThresholdAutomations(
        spaceId,
        messageId,
        data.boardId,
        data.emoji,
        messageData.authorId
      ).catch(err => {
        logger.warn('Reaction threshold automation failed', {
          error: err instanceof Error ? err.message : String(err),
          spaceId,
          messageId,
        });
      });
    }

    return respond.success({
      message: hasReacted ? "Reaction removed" : "Reaction added",
      action: hasReacted ? "removed" : "added",
      emoji: data.emoji,
    });
  }
);

/**
 * Trigger reaction threshold automations
 * Non-blocking - runs in background
 */
async function triggerReactionThresholdAutomations(
  spaceId: string,
  messageId: string,
  boardId: string,
  emoji: string,
  messageAuthorId: string
): Promise<void> {
  const { FieldValue } = await import('firebase-admin/firestore');

  // Get reaction threshold automations
  const automationsSnapshot = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('automations')
    .where('trigger.type', '==', 'reaction_threshold')
    .where('enabled', '==', true)
    .get();

  if (automationsSnapshot.empty) return;

  // Get current message to check reaction counts
  const messageDoc = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('boards')
    .doc(boardId)
    .collection('messages')
    .doc(messageId)
    .get();

  if (!messageDoc.exists) return;

  const messageData = messageDoc.data()!;
  const reactions: Array<{ emoji: string; count: number; userIds: string[] }> = messageData.reactions || [];

  for (const doc of automationsSnapshot.docs) {
    const automation = doc.data();
    const trigger = automation.trigger || {};
    const targetEmoji = trigger.emoji || '👍';
    const threshold = trigger.threshold || 5;

    // Find matching reaction
    const reaction = reactions.find(r => r.emoji === targetEmoji);
    const currentCount = reaction?.count || 0;

    // Check if threshold is reached (and wasn't already triggered for this message)
    if (currentCount < threshold) continue;

    // Check if already triggered for this message
    const triggeredKey = `triggered_${messageId}`;
    if (automation[triggeredKey]) continue;

    try {
      const action = automation.action;
      if (!action) continue;

      if (action.type === 'notify') {
        const { createBulkNotifications } = await import('@/lib/notification-service');

        // Get recipients based on config
        const recipients = action.config?.recipients || 'leaders';
        let userIds: string[] = [];

        if (recipients === 'leaders') {
          const leadersSnapshot = await dbAdmin
            .collection('spaceMembers')
            .where('spaceId', '==', spaceId)
            .where('role', 'in', ['owner', 'admin', 'moderator', 'leader'])
            .where('isActive', '==', true)
            .get();
          userIds = leadersSnapshot.docs.map(d => d.data().userId);
        } else if (recipients === 'author') {
          userIds = [messageAuthorId];
        }

        if (userIds.length > 0) {
          let title = action.config?.title || 'Popular Message';
          let body = action.config?.body || `A message reached ${threshold} ${targetEmoji} reactions`;

          await createBulkNotifications(userIds, {
            type: 'system',
            category: 'spaces',
            title,
            body,
            actionUrl: `/s/${spaceId}`,
            metadata: {
              spaceId,
              messageId,
              automationId: doc.id,
              emoji: targetEmoji,
              reactionCount: currentCount,
            },
          });
        }
      } else if (action.type === 'send_message') {
        const config = action.config || {};
        let content = config.content || `🎉 This message is popular! ${threshold}+ ${targetEmoji} reactions`;

        await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('boards')
          .doc(boardId)
          .collection('messages')
          .add({
            content,
            authorId: 'system',
            authorName: 'HIVE Bot',
            authorAvatarUrl: null,
            authorRole: 'system',
            type: 'system',
            timestamp: Date.now(),
            isDeleted: false,
            isPinned: false,
            reactions: [],
            replyToId: messageId,
            threadCount: 0,
            metadata: {
              automationId: doc.id,
              automationName: automation.name,
              triggeredBy: 'reaction_threshold',
              emoji: targetEmoji,
              threshold,
            },
          });
      }

      // Mark as triggered for this message and update stats
      await doc.ref.update({
        [triggeredKey]: true,
        'stats.timesTriggered': FieldValue.increment(1),
        'stats.successCount': FieldValue.increment(1),
        'stats.lastTriggered': new Date(),
      });

      logger.info('Reaction threshold automation triggered', {
        automationId: doc.id,
        automationName: automation.name,
        spaceId,
        messageId,
        emoji: targetEmoji,
        threshold,
        currentCount,
      });
    } catch (error) {
      await doc.ref.update({
        'stats.timesTriggered': FieldValue.increment(1),
        'stats.failureCount': FieldValue.increment(1),
        'stats.lastTriggered': new Date(),
      });

      logger.error('Reaction threshold automation failed', {
        automationId: doc.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
