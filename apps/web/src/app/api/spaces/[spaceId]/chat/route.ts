import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
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
import { withCache } from '../../../../../lib/cache-headers';

/**
 * Chat Messages API - Real-time messaging for space boards
 *
 * Uses SpaceChatService for DDD-compliant operations.
 *
 * GET  /api/spaces/[spaceId]/chat - List messages with pagination
 * POST /api/spaces/[spaceId]/chat - Send a new message
 */

const AttachmentSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
});

const SendMessageSchema = z.object({
  boardId: z.string().min(1).default('main'),
  content: z.string().max(4000),
  replyToId: z.string().optional(),
  componentData: z.object({
    elementType: z.string(),
    deploymentId: z.string(),
    toolId: z.string(),
    state: z.record(z.unknown()).optional(),
    isActive: z.boolean().default(true),
  }).optional(),
  attachments: z.array(AttachmentSchema).max(5).optional(),
}).refine(
  (data) => data.content.trim().length > 0 || (data.attachments && data.attachments.length > 0),
  { message: 'Message must have content or attachments' }
);

/**
 * Create permission check callback for SpaceChatService
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'admin' | 'owner' | 'read') => {
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
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const url = new URL(request.url);

  const boardId = url.searchParams.get('boardId') || 'main';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const before = url.searchParams.get('before');
  const after = url.searchParams.get('after');

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
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

  // Fetch lastReadAt for "Since you left" feature
  let lastReadAt: number | null = null;
  let unreadCount = 0;
  try {
    const readReceiptDoc = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(boardId)
      .collection('read_receipts')
      .doc(userId)
      .get();

    if (readReceiptDoc.exists) {
      const data = readReceiptDoc.data();
      lastReadAt = data?.lastReadTimestamp || null;
    }

    // Count messages newer than lastReadAt (excluding user's own)
    if (lastReadAt) {
      unreadCount = messages.filter(msg => {
        const dto = msg.toDTO();
        const timestamp = dto.timestamp as number;
        return timestamp > lastReadAt! && dto.authorId !== userId;
      }).length;
    }
  } catch (error) {
    // Non-critical - continue without lastReadAt
    logger.warn('Failed to fetch read receipt', { error, spaceId, boardId, userId });
  }

  // Fetch inline components for these messages
  const messageIds = messages.map(msg => msg.id);
  const componentsMap = new Map<string, unknown>();

  if (messageIds.length > 0) {
    try {
      const componentsSnapshot = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .doc(boardId)
        .collection('inline_components')
        .where('messageId', 'in', messageIds.slice(0, 10)) // Firestore 'in' limit is 10
        .get();

      for (const doc of componentsSnapshot.docs) {
        const data = doc.data();
        if (data.messageId) {
          // Fetch user's participation record
          let userVote: string[] | undefined;
          let userResponse: 'yes' | 'no' | 'maybe' | undefined;

          try {
            const participantDoc = await doc.ref
              .collection('participants')
              .doc(userId)
              .get();

            if (participantDoc.exists) {
              const participantData = participantDoc.data();
              userVote = participantData?.selectedOptions;
              userResponse = participantData?.response;
            }
          } catch {
            logger.warn('Failed to fetch participant data', { componentId: doc.id, userId });
          }

          componentsMap.set(data.messageId as string, {
            id: doc.id,
            type: data.componentType,
            config: data.config,
            sharedState: data.sharedState || { totalResponses: 0 },
            userVote,
            userResponse,
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch inline components', { error, spaceId, boardId });
    }
  }

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
      authorHandle: dto.authorHandle || 'unknown',
      authorAvatarUrl: dto.authorAvatarUrl,
      authorRole: dto.authorRole,
      content: dto.content,
      componentData: dto.componentData,
      systemAction: dto.systemAction,
      timestamp: dto.timestamp,
      isEdited: dto.editedAt !== undefined,
      editedAt: dto.editedAt ? new Date(dto.editedAt as number).toISOString() : undefined,
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
      // Inline component data (poll, countdown, RSVP)
      inlineComponent: componentsMap.get(msg.id) || undefined,
    };
  });

  return respond.success({
    messages: apiMessages,
    hasMore,
    boardId,
    // "Since you left" data
    lastReadAt,
    unreadCount,
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
      attachments: data.attachments,
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

    // Notify space members about new chat message (non-blocking)
    notifySpaceChatMessage(spaceId, messageId, data.content, userId, data.boardId).catch(err => {
      logger.warn('Chat notification failed', {
        error: err instanceof Error ? err.message : String(err),
        spaceId,
        messageId,
      });
    });

    return respond.success({
      message: "Message sent",
      messageId,
      timestamp,
    }, { status: 201 });
  }
);

/**
 * Notify space members about a new chat message.
 * - @mentioned users get a "mention" notification (highlighted)
 * - Other active members get a "chat_message" notification
 * Only notifies users who are members of the space and not the sender.
 */
async function notifySpaceChatMessage(
  spaceId: string,
  messageId: string,
  content: string,
  senderId: string,
  boardId: string
): Promise<void> {
  const { createNotification, createBulkNotifications } = await import('@/lib/notification-service');

  // Look up sender profile for notification text
  const senderDoc = await dbAdmin.collection('profiles').doc(senderId).get();
  const senderName = senderDoc.exists
    ? (senderDoc.data()?.displayName || 'Someone')
    : 'Someone';

  // Look up space info for notification metadata
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  const spaceData = spaceDoc.exists ? spaceDoc.data() : null;
  const spaceName = spaceData?.name || 'a space';
  const spaceHandle = spaceData?.handle || spaceId;

  // Get all active space member user IDs
  const membersSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('isActive', '==', true)
    .get();

  const memberUserIds = new Set(membersSnapshot.docs.map(d => d.data().userId));
  // Remove sender
  memberUserIds.delete(senderId);

  // Extract @mentions
  const mentionRegex = /@(\w+)/g;
  const handles = new Set<string>();
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    handles.add(match[1].toLowerCase());
  }

  // Resolve mentioned user IDs
  const mentionedUserIds = new Set<string>();
  for (const handle of handles) {
    try {
      const userQuery = await dbAdmin
        .collection('profiles')
        .where('handle', '==', handle)
        .limit(1)
        .get();

      if (userQuery.empty) continue;

      const mentionedUserId = userQuery.docs[0].id;
      if (mentionedUserId !== senderId && memberUserIds.has(mentionedUserId)) {
        mentionedUserIds.add(mentionedUserId);
      }
    } catch (error) {
      logger.warn('Failed to resolve mention handle', {
        handle,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const actionUrl = `/s/${spaceHandle}`;
  const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');

  // Send @mention notifications (higher priority, different type)
  for (const mentionedUserId of mentionedUserIds) {
    try {
      await createNotification({
        userId: mentionedUserId,
        type: 'mention',
        category: 'social',
        title: `${senderName} mentioned you in ${spaceName}`,
        body: preview,
        actionUrl,
        metadata: {
          spaceId,
          spaceName,
          actorId: senderId,
          actorName: senderName,
          messageId,
          boardId,
          isMention: true,
        },
      });
    } catch (error) {
      logger.warn('Failed to send mention notification', {
        mentionedUserId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Send general chat notifications to remaining members (not mentioned)
  const nonMentionedMembers = [...memberUserIds].filter(id => !mentionedUserIds.has(id));
  if (nonMentionedMembers.length > 0) {
    try {
      await createBulkNotifications(nonMentionedMembers, {
        type: 'mention', // reuse 'mention' type since there's no 'chat_message' type
        category: 'social',
        title: `${senderName} in ${spaceName}`,
        body: preview,
        actionUrl,
        metadata: {
          spaceId,
          spaceName,
          actorId: senderId,
          actorName: senderName,
          messageId,
          boardId,
          isMention: false,
        },
      });
    } catch (error) {
      logger.warn('Failed to send bulk chat notifications', {
        error: error instanceof Error ? error.message : String(error),
        spaceId,
        messageId,
        recipientCount: nonMentionedMembers.length,
      });
    }
  }
}

export const GET = withCache(_GET, 'PRIVATE');
