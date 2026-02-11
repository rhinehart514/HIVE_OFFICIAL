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
import { chatRateLimit } from "@/lib/rate-limit-simple";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";
import type { ChatMessageReaction } from "@hive/core";
import { withCache } from '../../../../../../../lib/cache-headers';

/**
 * Thread Replies API - Manage replies to a parent message
 *
 * GET  /api/spaces/[spaceId]/chat/[messageId]/replies - List thread replies
 * POST /api/spaces/[spaceId]/chat/[messageId]/replies - Send a thread reply
 */

const SendReplySchema = z.object({
  content: z.string().min(1).max(4000),
  boardId: z.string().optional(), // Optional - will be inferred from parent message
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

/**
 * GET /api/spaces/[spaceId]/chat/[messageId]/replies - List thread replies
 */
const _GET = withAuthAndErrors(async (
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

/**
 * POST /api/spaces/[spaceId]/chat/[messageId]/replies - Send a thread reply
 */
type SendReplyData = z.output<typeof SendReplySchema>;

export const POST = withAuthValidationAndErrors(
  SendReplySchema as z.ZodType<SendReplyData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; messageId: string }> },
    data: SendReplyData,
    respond
  ) => {
    const { spaceId, messageId: parentMessageId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId || !parentMessageId) {
      return respond.error("Space ID and Message ID are required", "INVALID_INPUT", { status: 400 });
    }

    // RATE LIMITING: Prevent message spam (20 messages per minute per user)
    const rateLimitResult = chatRateLimit.check(userId);
    if (!rateLimitResult.success) {
      logger.warn("Chat rate limit exceeded for thread reply", {
        userId,
        spaceId,
        parentMessageId,
        remaining: rateLimitResult.remaining,
        retryAfter: rateLimitResult.retryAfter,
      });
      return respond.error(
        `Too many messages. Please wait ${rateLimitResult.retryAfter} seconds.`,
        "RATE_LIMITED",
        {
          status: 429,
          details: {
            retryAfter: rateLimitResult.retryAfter,
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          }
        }
      );
    }

    // SECURITY: Scan message content for XSS/injection attacks
    const securityScan = SecurityScanner.scanInput(data.content);
    if (securityScan.level === 'dangerous') {
      logger.warn("XSS attempt blocked in thread reply", {
        userId,
        spaceId,
        parentMessageId,
        threats: securityScan.threats,
      });
      return respond.error("Message contains potentially harmful content", "INVALID_INPUT", { status: 400 });
    }

    // Get boardId from parent message if not provided
    let boardId = data.boardId;
    if (!boardId) {
      // Find the parent message to get its boardId
      const boardsSnapshot = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .get();

      for (const boardDoc of boardsSnapshot.docs) {
        const msgDoc = await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('boards')
          .doc(boardDoc.id)
          .collection('messages')
          .doc(parentMessageId)
          .get();

        if (msgDoc.exists) {
          boardId = boardDoc.id;
          break;
        }
      }

      if (!boardId) {
        return respond.error("Parent message not found", "NOT_FOUND", { status: 404 });
      }
    }

    // Create the chat service with DDD repositories
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    // Send the reply (using main sendMessage with replyToId)
    const result = await chatService.sendMessage(userId, {
      spaceId,
      boardId,
      content: data.content,
      replyToId: parentMessageId,
    });

    if (result.isFailure) {
      logger.error('Failed to send thread reply', { error: result.error, spaceId, parentMessageId });
      return respond.error(result.error ?? "Failed to send reply", "SEND_FAILED", { status: 500 });
    }

    const serviceResult = result.getValue();
    const { messageId, timestamp } = serviceResult.data;

    // Get the created message to return full data
    const profile = await createProfileGetter()(userId);

    logger.info(`Thread reply sent in space ${spaceId}`, {
      spaceId,
      boardId,
      parentMessageId,
      messageId,
      userId,
    });

    return respond.success({
      message: {
        id: messageId,
        boardId,
        type: 'text',
        authorId: userId,
        authorName: profile?.displayName || 'Member',
        authorAvatarUrl: profile?.avatarUrl,
        content: data.content,
        timestamp,
        replyToId: parentMessageId,
      },
    });
  }
);

export const GET = withCache(_GET, 'PRIVATE');
