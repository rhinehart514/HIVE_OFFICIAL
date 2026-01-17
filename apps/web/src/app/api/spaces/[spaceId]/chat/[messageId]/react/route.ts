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
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'leader' | 'owner' | 'read') => {
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

    return respond.success({
      message: hasReacted ? "Reaction removed" : "Reaction added",
      action: hasReacted ? "removed" : "added",
      emoji: data.emoji,
    });
  }
);
