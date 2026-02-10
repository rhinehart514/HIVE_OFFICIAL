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
export const GET = withAuthAndErrors(async (
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
          } catch (err) {
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

    // Trigger keyword automations (non-blocking)
    triggerKeywordAutomations(spaceId, messageId, data.content, userId, data.boardId).catch(err => {
      logger.warn('Keyword automation trigger failed', {
        error: err instanceof Error ? err.message : String(err),
        spaceId,
        messageId,
      });
    });

    // Detect @mentions and create notifications (non-blocking)
    processMentions(spaceId, messageId, data.content, userId, data.boardId).catch(err => {
      logger.warn('Mention processing failed', {
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
 * Parse @mentions from message text and create notifications for mentioned users.
 * Only notifies users who are members of the space and not the sender.
 */
async function processMentions(
  spaceId: string,
  messageId: string,
  content: string,
  senderId: string,
  boardId: string
): Promise<void> {
  // Extract unique handles from @mentions
  const mentionRegex = /@(\w+)/g;
  const handles = new Set<string>();
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    handles.add(match[1].toLowerCase());
  }

  if (handles.size === 0) return;

  const { createNotification } = await import('@/lib/notification-service');

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

  // Get all space member user IDs for membership checks
  const membersSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('isActive', '==', true)
    .get();

  const memberUserIds = new Set(membersSnapshot.docs.map(d => d.data().userId));

  // For each handle, look up the user and create a notification
  for (const handle of handles) {
    try {
      // Find user by handle
      const userQuery = await dbAdmin
        .collection('profiles')
        .where('handle', '==', handle)
        .limit(1)
        .get();

      if (userQuery.empty) continue;

      const mentionedUserId = userQuery.docs[0].id;

      // Skip self-mentions
      if (mentionedUserId === senderId) continue;

      // Skip if not a member of the space
      if (!memberUserIds.has(mentionedUserId)) continue;

      await createNotification({
        userId: mentionedUserId,
        type: 'mention',
        category: 'social',
        title: `${senderName} mentioned you`,
        body: content.substring(0, 100),
        actionUrl: `/s/${spaceHandle}`,
        metadata: {
          spaceId,
          spaceName,
          actorId: senderId,
          actorName: senderName,
          messageId,
          boardId,
        },
      });

      logger.info('Mention notification created', {
        mentionedUserId,
        senderId,
        spaceId,
        messageId,
        handle,
      });
    } catch (error) {
      logger.warn('Failed to process mention', {
        handle,
        error: error instanceof Error ? error.message : String(error),
        spaceId,
        messageId,
      });
    }
  }
}

/**
 * Trigger keyword-based automations for a message
 * Non-blocking - runs in background
 */
async function triggerKeywordAutomations(
  spaceId: string,
  messageId: string,
  content: string,
  authorId: string,
  boardId: string
): Promise<void> {
  const { FieldValue } = await import('firebase-admin/firestore');

  // Get keyword automations for this space
  const automationsSnapshot = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('automations')
    .where('trigger.type', '==', 'keyword')
    .where('enabled', '==', true)
    .get();

  if (automationsSnapshot.empty) return;

  const contentLower = content.toLowerCase();

  for (const doc of automationsSnapshot.docs) {
    const automation = doc.data();
    const keywords: string[] = automation.trigger?.keywords || [];

    // Check if any keyword matches
    const matchedKeyword = keywords.find((kw: string) =>
      contentLower.includes(kw.toLowerCase())
    );

    if (!matchedKeyword) continue;

    try {
      // Execute the automation action based on type
      const action = automation.action;
      if (!action) continue;

      if (action.type === 'send_message') {
        // Send a response message
        const config = action.config || {};
        let responseContent = config.content || '';

        // Interpolate variables
        responseContent = responseContent
          .replace(/\{keyword\}/g, matchedKeyword)
          .replace(/\{author\}/g, `<@${authorId}>`)
          .replace(/\{message\}/g, content.slice(0, 100));

        // Create system message in response
        await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('boards')
          .doc(boardId)
          .collection('messages')
          .add({
            content: responseContent,
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
            replyToPreview: content.slice(0, 100),
            threadCount: 0,
            metadata: {
              automationId: doc.id,
              automationName: automation.name,
              triggeredBy: 'keyword',
              matchedKeyword,
            },
          });
      } else if (action.type === 'notify') {
        // Send notification to leaders
        const { createBulkNotifications } = await import('@/lib/notification-service');

        const leadersSnapshot = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('role', 'in', ['owner', 'admin', 'moderator', 'leader'])
          .where('isActive', '==', true)
          .get();

        const leaderIds = leadersSnapshot.docs.map(d => d.data().userId);

        if (leaderIds.length > 0) {
          let title = action.config?.title || 'Keyword Alert';
          let body = action.config?.body || `Keyword "${matchedKeyword}" detected`;

          title = title.replace(/\{keyword\}/g, matchedKeyword);
          body = body.replace(/\{keyword\}/g, matchedKeyword)
            .replace(/\{message\}/g, content.slice(0, 100));

          await createBulkNotifications(leaderIds, {
            type: 'system',
            category: 'spaces',
            title,
            body,
            actionUrl: `/s/${spaceId}`,
            metadata: {
              spaceId,
              automationId: doc.id,
              matchedKeyword,
              messageId,
            },
          });
        }
      }

      // Update stats
      await doc.ref.update({
        'stats.timesTriggered': FieldValue.increment(1),
        'stats.successCount': FieldValue.increment(1),
        'stats.lastTriggered': new Date(),
      });

      logger.info('Keyword automation triggered', {
        automationId: doc.id,
        automationName: automation.name,
        matchedKeyword,
        spaceId,
        messageId,
      });
    } catch (error) {
      const { FieldValue: FV } = await import('firebase-admin/firestore');
      await doc.ref.update({
        'stats.timesTriggered': FV.increment(1),
        'stats.failureCount': FV.increment(1),
        'stats.lastTriggered': new Date(),
      });

      logger.error('Keyword automation failed', {
        automationId: doc.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
