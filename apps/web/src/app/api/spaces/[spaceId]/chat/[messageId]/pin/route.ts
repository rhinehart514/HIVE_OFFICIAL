import { z } from "zod";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/logger";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";

/**
 * Message Pin API
 *
 * POST /api/spaces/[spaceId]/chat/[messageId]/pin - Toggle pin status (leaders only)
 */

const PinSchema = z.object({
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
 * POST /api/spaces/[spaceId]/chat/[messageId]/pin - Toggle pin status
 *
 * Leaders only. Toggles the pin status of a message.
 */
type PinData = z.output<typeof PinSchema>;

export const POST = withAuthValidationAndErrors(
  PinSchema as z.ZodType<PinData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; messageId: string }> },
    data: PinData,
    respond
  ) => {
    const { spaceId, messageId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId || !messageId) {
      return respond.error("Space ID and Message ID are required", "INVALID_INPUT", { status: 400 });
    }

    // Check leader permission first
    const permCheck = await checkSpacePermission(spaceId, userId, 'admin');
    if (!permCheck.hasPermission) {
      return respond.error("Only space leaders can pin messages", "FORBIDDEN", { status: 403 });
    }

    // Get current pin status
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
    const wasPinned = messageData.isPinned || false;

    // Create the chat service for pin operation
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    // Pin uses the same method - it toggles in the entity
    const result = await chatService.pinMessage(
      userId,
      spaceId,
      data.boardId,
      messageId
    );

    if (result.isFailure) {
      const errorMsg = result.error ?? "Failed to update pin status";
      if (errorMsg.includes('leader')) {
        return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
      }
      if (errorMsg.includes('not found')) {
        return respond.error(errorMsg, "NOT_FOUND", { status: 404 });
      }
      return respond.error(errorMsg, "UPDATE_FAILED", { status: 500 });
    }

    const isPinned = !wasPinned; // Toggled

    logger.info(`Message ${isPinned ? 'pinned' : 'unpinned'}: ${messageId} in space ${spaceId}`, {
      spaceId,
      messageId,
      boardId: data.boardId,
      userId,
      isPinned,
    });

    return respond.success({
      message: isPinned ? "Message pinned" : "Message unpinned",
      isPinned,
    });
  }
);
