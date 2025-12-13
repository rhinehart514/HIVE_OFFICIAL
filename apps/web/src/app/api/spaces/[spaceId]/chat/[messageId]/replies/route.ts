import { z } from "zod";
import {
  withAuthAndErrors,
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
import type { ChatMessageReaction } from "@hive/core";

/**
 * Thread Replies API - Get replies to a parent message
 *
 * GET /api/spaces/[spaceId]/chat/[messageId]/replies - List thread replies
 */

/**
 * Create permission check callback for SpaceChatService
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'leader' | 'owner') => {
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

/**
 * GET /api/spaces/[spaceId]/chat/[messageId]/replies - List thread replies
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; messageId: string }> },
  respond
) => {
  const { spaceId, messageId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const url = new URL(request.url);

  const boardId = url.searchParams.get('boardId');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const before = url.searchParams.get('before');

  if (!spaceId || !messageId) {
    return respond.error("Space ID and Message ID are required", "INVALID_INPUT", { status: 400 });
  }

  if (!boardId) {
    return respond.error("Board ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Create the chat service
  const chatService = createServerSpaceChatService(
    { userId, campusId },
    {
      checkPermission: createPermissionChecker(),
      getUserProfile: createProfileGetter(),
    }
  );

  const result = await chatService.listThreadReplies(userId, {
    spaceId,
    boardId,
    parentMessageId: messageId,
    limit,
    before: before ? parseInt(before, 10) : undefined,
  });

  if (result.isFailure) {
    logger.error('Failed to fetch thread replies', { error: result.error, spaceId, messageId });
    return respond.error(result.error ?? "Failed to fetch thread replies", "FETCH_FAILED", { status: 500 });
  }

  const serviceResult = result.getValue();
  const { messages, hasMore } = serviceResult.data;

  // Transform messages to API response format
  const apiMessages = messages.map(msg => {
    const dto = msg.toDTO();
    const reactions = dto.reactions as ChatMessageReaction[];
    return {
      id: msg.id,
      boardId: dto.boardId,
      type: dto.type,
      authorId: dto.authorId,
      authorName: dto.authorName,
      authorAvatarUrl: dto.authorAvatarUrl,
      authorRole: dto.authorRole,
      content: dto.content,
      componentData: dto.componentData,
      systemAction: dto.systemAction,
      timestamp: dto.timestamp,
      editedAt: dto.editedAt,
      isDeleted: dto.isDeleted,
      isPinned: dto.isPinned,
      reactions: reactions.map(r => ({
        emoji: r.emoji,
        count: r.count,
        hasReacted: r.userIds.includes(userId),
      })),
      replyToId: dto.replyToId,
      replyToPreview: dto.replyToPreview,
      threadCount: dto.threadCount,
    };
  });

  return respond.success({
    parentMessageId: messageId,
    replies: apiMessages,
    hasMore,
    boardId,
  });
});
