import {
  withAuthAndErrors,
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
import type { ChatMessageReaction } from "@hive/core";

/**
 * Chat Search API - Search messages within a space
 *
 * GET /api/spaces/[spaceId]/chat/search - Search messages
 */

/**
 * Create permission check callback for SpaceChatService
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
 * GET /api/spaces/[spaceId]/chat/search - Search messages in a space
 *
 * Query params:
 * - q: search query (required, min 2 chars)
 * - boardId: optional board filter
 * - authorId: optional author filter
 * - limit: max results (default 50, max 100)
 * - offset: pagination offset (default 0)
 * - startDate: ISO date string for range start
 * - endDate: ISO date string for range end
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

  // Parse query parameters
  const query = url.searchParams.get('q');
  const boardId = url.searchParams.get('boardId');
  const authorId = url.searchParams.get('authorId');
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');
  const startDateParam = url.searchParams.get('startDate');
  const endDateParam = url.searchParams.get('endDate');

  // Validate required query
  if (!query || query.trim().length < 2) {
    return respond.error("Search query must be at least 2 characters", "INVALID_INPUT", { status: 400 });
  }

  // SECURITY: Scan search query for injection attacks
  const securityScan = SecurityScanner.scanInput(query);
  if (securityScan.level === 'dangerous') {
    logger.warn("Injection attempt blocked in chat search", {
      userId,
      spaceId,
      query,
      threats: securityScan.threats,
    });
    return respond.error("Search query contains invalid content", "INVALID_INPUT", { status: 400 });
  }

  // Parse pagination
  const limit = Math.min(parseInt(limitParam || '50', 10), 100);
  const offset = parseInt(offsetParam || '0', 10);

  // Parse dates
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateParam) {
    const parsed = new Date(startDateParam);
    if (!isNaN(parsed.getTime())) {
      startDate = parsed;
    }
  }

  if (endDateParam) {
    const parsed = new Date(endDateParam);
    if (!isNaN(parsed.getTime())) {
      endDate = parsed;
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

  // Execute search
  const result = await chatService.searchMessages(userId, spaceId, {
    query: query.trim(),
    boardId: boardId ?? undefined,
    authorId: authorId ?? undefined,
    limit,
    offset,
    startDate,
    endDate,
  });

  if (result.isFailure) {
    logger.error('Failed to search messages', { error: result.error, spaceId, query });
    return respond.error(result.error ?? "Search failed", "SEARCH_FAILED", { status: 500 });
  }

  const serviceResult = result.getValue();
  const { messages, totalCount, hasMore } = serviceResult.data;

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
    totalCount,
    hasMore,
    query: query.trim(),
  });
});
