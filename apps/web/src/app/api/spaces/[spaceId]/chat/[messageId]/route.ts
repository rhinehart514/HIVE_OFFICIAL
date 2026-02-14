import { z } from "zod";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import { SecurityScanner } from "@/lib/secure-input-validation";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { withCache } from '../../../../../../lib/cache-headers';
import { enforceSpaceRules } from "@/lib/space-rules-middleware";

/**
 * Single Message Operations API
 *
 * GET    /api/spaces/[spaceId]/chat/[messageId] - Get message details
 * PATCH  /api/spaces/[spaceId]/chat/[messageId] - Edit message (author only)
 * DELETE /api/spaces/[spaceId]/chat/[messageId] - Delete message (author or leader)
 */

const EditMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  boardId: z.string().min(1),
});

/**
 * Create permission check callback for SpaceChatService
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
      if (requiredRole === 'member') {
        const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
        if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
          return { allowed: true, role: 'guest' };
        }
      }
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

async function getMessageAuthorId(
  spaceId: string,
  boardId: string,
  messageId: string,
): Promise<string | null> {
  const messageDoc = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('boards')
    .doc(boardId)
    .collection('messages')
    .doc(messageId)
    .get();

  if (!messageDoc.exists) {
    return null;
  }

  const data = messageDoc.data();
  return (data?.authorId as string | undefined) || null;
}

/**
 * GET /api/spaces/[spaceId]/chat/[messageId] - Get message details
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; messageId: string }> },
  respond
) => {
  const { spaceId, messageId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const url = new URL(request.url);
  const boardId = url.searchParams.get('boardId');

  if (!spaceId || !messageId) {
    return respond.error("Space ID and Message ID are required", "INVALID_INPUT", { status: 400 });
  }

  if (!boardId) {
    return respond.error("Board ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Check member permission
  const permCheck = await checkSpacePermission(spaceId, userId, 'member');
  if (!permCheck.hasPermission) {
    const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
    if (!guestCheck.hasPermission || !guestCheck.space?.isPublic) {
      return respond.error(permCheck.error ?? "Permission denied", permCheck.code ?? "FORBIDDEN", { status: 403 });
    }
  }

  try {
    const messageDoc = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(boardId)
      .collection('messages')
      .doc(messageId)
      .get();

    if (!messageDoc.exists) {
      return respond.error("Message not found", "NOT_FOUND", { status: 404 });
    }

    const data = messageDoc.data()!;

    return respond.success({
      message: {
        id: messageDoc.id,
        boardId: data.boardId,
        type: data.type || 'text',
        authorId: data.authorId,
        authorName: data.authorName,
        authorAvatarUrl: data.authorAvatarUrl,
        authorRole: data.authorRole,
        content: data.content,
        componentData: data.componentData,
        timestamp: data.timestamp,
        editedAt: data.editedAt,
        isDeleted: data.isDeleted || false,
        isPinned: data.isPinned || false,
        reactions: (data.reactions || []).map((r: { emoji: string; count: number; userIds: string[] }) => ({
          emoji: r.emoji,
          count: r.count,
          hasReacted: r.userIds?.includes(userId) || false,
        })),
        replyToId: data.replyToId,
        replyToPreview: data.replyToPreview,
        threadCount: data.threadCount || 0,
      }
    });
  } catch (error) {
    logger.error('Failed to fetch message', { error, spaceId, messageId });
    return respond.error("Failed to fetch message", "FETCH_FAILED", { status: 500 });
  }
});

/**
 * PATCH /api/spaces/[spaceId]/chat/[messageId] - Edit message (author only)
 */
type EditMessageData = z.output<typeof EditMessageSchema>;

export const PATCH = withAuthValidationAndErrors(
  EditMessageSchema as z.ZodType<EditMessageData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; messageId: string }> },
    data: EditMessageData,
    respond
  ) => {
    const { spaceId, messageId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId || !messageId) {
      return respond.error("Space ID and Message ID are required", "INVALID_INPUT", { status: 400 });
    }

    const messageAuthorId = await getMessageAuthorId(spaceId, data.boardId, messageId);
    if (!messageAuthorId) {
      return respond.error("Message not found", "NOT_FOUND", { status: 404 });
    }

    const editAny = await enforceSpaceRules(spaceId, userId, 'messages:edit_any');
    if (!editAny.allowed) {
      const editOwn = await enforceSpaceRules(spaceId, userId, 'messages:edit_own');
      if (!editOwn.allowed) {
        return respond.error(editOwn.reason || "Permission denied", "FORBIDDEN", { status: 403 });
      }
      if (messageAuthorId !== userId) {
        return respond.error("You can only edit your own messages", "FORBIDDEN", { status: 403 });
      }
    }

    // SECURITY: Scan message content for XSS/injection attacks
    const securityScan = SecurityScanner.scanInput(data.content);
    if (securityScan.level === 'dangerous') {
      logger.warn("XSS attempt blocked in message edit", {
        userId,
        spaceId,
        messageId,
        boardId: data.boardId,
        threats: securityScan.threats,
      });
      return respond.error("Message contains potentially harmful content", "INVALID_INPUT", { status: 400 });
    }

    // Create the chat service
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    const result = await chatService.editMessage(
      userId,
      spaceId,
      data.boardId,
      messageId,
      data.content
    );

    if (result.isFailure) {
      const errorMsg = result.error ?? "Failed to edit message";
      if (errorMsg.includes('author')) {
        return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
      }
      if (errorMsg.includes('not found')) {
        return respond.error(errorMsg, "NOT_FOUND", { status: 404 });
      }
      return respond.error(errorMsg, "UPDATE_FAILED", { status: 500 });
    }

    logger.info(`Message edited: ${messageId} in space ${spaceId}`, {
      spaceId,
      messageId,
      userId,
    });

    return respond.success({ message: "Message edited successfully" });
  }
);

/**
 * DELETE /api/spaces/[spaceId]/chat/[messageId] - Delete message
 */
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; messageId: string }> },
  respond
) => {
  const { spaceId, messageId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const url = new URL(request.url);
  const boardId = url.searchParams.get('boardId');

  if (!spaceId || !messageId) {
    return respond.error("Space ID and Message ID are required", "INVALID_INPUT", { status: 400 });
  }

  if (!boardId) {
    return respond.error("Board ID is required", "INVALID_INPUT", { status: 400 });
  }

  const messageAuthorId = await getMessageAuthorId(spaceId, boardId, messageId);
  if (!messageAuthorId) {
    return respond.error("Message not found", "NOT_FOUND", { status: 404 });
  }

  const deleteAny = await enforceSpaceRules(spaceId, userId, 'messages:delete_any');
  if (!deleteAny.allowed) {
    const deleteOwn = await enforceSpaceRules(spaceId, userId, 'messages:delete_own');
    if (!deleteOwn.allowed) {
      return respond.error(deleteOwn.reason || "Permission denied", "FORBIDDEN", { status: 403 });
    }
    if (messageAuthorId !== userId) {
      return respond.error("You can only delete your own messages", "FORBIDDEN", { status: 403 });
    }
  }

  // Create the chat service
  const chatService = createServerSpaceChatService(
    { userId, campusId },
    {
      checkPermission: createPermissionChecker(),
      getUserProfile: createProfileGetter(),
    }
  );

  const result = await chatService.deleteMessage(
    userId,
    spaceId,
    boardId,
    messageId
  );

  if (result.isFailure) {
    const errorMsg = result.error ?? "Failed to delete message";
    if (errorMsg.includes('author') || errorMsg.includes('leaders')) {
      return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
    }
    if (errorMsg.includes('not found')) {
      return respond.error(errorMsg, "NOT_FOUND", { status: 404 });
    }
    return respond.error(errorMsg, "DELETE_FAILED", { status: 500 });
  }

  logger.info(`Message deleted: ${messageId} in space ${spaceId}`, {
    spaceId,
    messageId,
    userId,
  });

  return respond.success({ message: "Message deleted successfully" });
});

export const GET = withCache(_GET, 'PRIVATE');
