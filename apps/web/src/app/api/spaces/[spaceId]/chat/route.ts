import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { SecurityScanner } from "@/lib/secure-input-validation";
import { chatRateLimit } from "@/lib/rate-limit-simple";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from "@hive/core/server";
import type { ChatMessageReaction } from "@hive/core";

/**
 * Chat Messages API - Real-time messaging for space boards
 *
 * Uses SpaceChatService for DDD-compliant operations.
 *
 * GET  /api/spaces/[spaceId]/chat - List messages with pagination
 * POST /api/spaces/[spaceId]/chat - Send a new message
 */

const SendMessageSchema = z.object({
  boardId: z.string().min(1),
  content: z.string().min(1).max(4000),
  replyToId: z.string().optional(),
  componentData: z.object({
    elementType: z.string(),
    deploymentId: z.string(),
    toolId: z.string(),
    state: z.record(z.unknown()).optional(),
    isActive: z.boolean().default(true),
  }).optional(),
});

/**
 * Create permission check callback for SpaceChatService
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'leader' | 'owner' | 'read') => {
    // 'read' permission allows non-members to view public spaces
    if (requiredRole === 'read') {
      // First check if user is a member (any level)
      const memberCheck = await checkSpacePermission(spaceId, userId, 'member');
      if (memberCheck.hasPermission) {
        return { allowed: true, role: memberCheck.role };
      }
      // If not a member, check if space is public (allow guest access)
      const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
      if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
        return { allowed: true, role: 'guest' };
      }
      return { allowed: false };
    }

    // For other roles, use standard permission check
    const permCheck = await checkSpacePermission(spaceId, userId, requiredRole);
    if (!permCheck.hasPermission) {
      // Check guest access for public spaces (fallback for 'member' role)
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
 * Create user profile getter callback for SpaceChatService
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
 * GET /api/spaces/[spaceId]/chat - List messages for a board
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const url = new URL(request.url);

  const boardId = url.searchParams.get('boardId');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const before = url.searchParams.get('before');
  const after = url.searchParams.get('after');

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  if (!boardId) {
    return respond.error("Board ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Create the chat service with DDD repositories
  const chatService = createServerSpaceChatService(
    { userId, campusId },
    {
      checkPermission: createPermissionChecker(),
      getUserProfile: createProfileGetter(),
    }
  );

  const result = await chatService.listMessages(userId, {
    spaceId,
    boardId,
    limit,
    before: before ? parseInt(before, 10) : undefined,
    after: after ? parseInt(after, 10) : undefined,
  });

  if (result.isFailure) {
    logger.error('Failed to fetch messages', { error: result.error, spaceId, boardId });
    return respond.error(result.error ?? "Failed to fetch messages", "FETCH_FAILED", { status: 500 });
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
    messages: apiMessages,
    hasMore,
    boardId,
  });
});

/**
 * POST /api/spaces/[spaceId]/chat - Send a new message
 */
type SendMessageData = z.output<typeof SendMessageSchema>;

export const POST = withAuthValidationAndErrors(
  SendMessageSchema as z.ZodType<SendMessageData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: SendMessageData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // RATE LIMITING: Prevent message spam (20 messages per minute per user)
    const rateLimitResult = chatRateLimit.check(userId);
    if (!rateLimitResult.success) {
      logger.warn("Chat rate limit exceeded", {
        userId,
        spaceId,
        boardId: data.boardId,
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
    // SecurityScanner.scanInput returns { level, threats, sanitized } - check level for dangerous content
    const securityScan = SecurityScanner.scanInput(data.content);
    if (securityScan.level === 'dangerous') {
      logger.warn("XSS attempt blocked in chat message", {
        userId,
        spaceId,
        boardId: data.boardId,
        threats: securityScan.threats,
      });
      return respond.error("Message contains potentially harmful content", "INVALID_INPUT", { status: 400 });
    }

    // Create the chat service with DDD repositories
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    const result = await chatService.sendMessage(userId, {
      spaceId,
      boardId: data.boardId,
      content: data.content,
      componentData: data.componentData,
      replyToId: data.replyToId,
    });

    if (result.isFailure) {
      logger.error('Failed to send message', { error: result.error, spaceId, boardId: data.boardId });
      return respond.error(result.error ?? "Failed to send message", "SEND_FAILED", { status: 500 });
    }

    const serviceResult = result.getValue();
    const { messageId, timestamp } = serviceResult.data;

    logger.info(`Message sent in space ${spaceId} board ${data.boardId}`, {
      spaceId,
      boardId: data.boardId,
      messageId,
      userId,
    });

    return respond.success({
      message: "Message sent",
      messageId,
      timestamp,
    }, { status: 201 });
  }
);
