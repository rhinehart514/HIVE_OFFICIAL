"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { getServerSpaceRepository } from "@hive/core/server";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { HttpStatus } from "@/lib/api-response-types";
import { SecurityScanner } from "@/lib/secure-input-validation";
import {
  isContentHidden,
  isContentFlagged,
  getModerationStatus,
  buildModerationUpdate,
  type ModerationAction,
  type ModerableContentType,
} from "@/lib/content-moderation";
import { withCache } from '../../../../../lib/cache-headers';

const GetModerationQueueSchema = z.object({
  contentType: z.enum(["post", "comment", "event", "all"]).default("all"),
  status: z.enum(["flagged", "hidden", "all"]).default("flagged"),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const ModerationActionSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(["post", "comment", "event"]),
  action: z.enum(["hide", "unhide", "remove", "restore", "flag", "unflag", "approve"]),
  reason: z.string().max(500).optional(),
});

const BulkModerationSchema = z.object({
  items: z.array(z.object({
    contentId: z.string(),
    contentType: z.enum(["post", "comment", "event"]),
  })).min(1).max(50),
  action: z.enum(["hide", "unhide", "remove", "approve"]),
  reason: z.string().max(500).optional(),
});

/**
 * Validate space and check moderator permissions
 */
async function validateSpaceAndModeratorPermission(spaceId: string, userId: string, campusId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
  }

  const membership = membershipSnapshot.docs[0].data();
  const role = membership.role;

  // Only moderators, admins, and owners can moderate
  if (!["owner", "admin", "moderator"].includes(role)) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Moderation permissions required" };
  }

  return { ok: true as const, space, membership, role };
}

/**
 * Get content document reference based on type
 * Uses flat collections for posts and events (for cross-space queries)
 */
function getContentRef(spaceId: string, contentType: ModerableContentType, contentId: string, parentId?: string) {
  switch (contentType) {
    case 'post':
      // Use flat /posts collection
      return dbAdmin.collection('posts').doc(contentId);
    case 'comment':
      if (!parentId) throw new Error('Parent post ID required for comments');
      // Comments are nested under posts
      return dbAdmin.collection('posts').doc(parentId).collection('comments').doc(contentId);
    case 'event':
      // Use flat /events collection
      return dbAdmin.collection('events').doc(contentId);
    default:
      throw new Error(`Unsupported content type: ${contentType}`);
  }
}

/**
 * GET /api/spaces/[spaceId]/moderation
 *
 * Get moderation queue for the space - flagged and hidden content
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  const validation = await validateSpaceAndModeratorPermission(spaceId, userId, campusId);
  if (!validation.ok) {
    const code = validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    return respond.error(validation.message, code, { status: validation.status });
  }

  const queryParams = GetModerationQueueSchema.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  // Build intermediate queue without author data (collected author IDs for batch fetch)
  const queueItems: Array<{
    id: string;
    type: string;
    content: Record<string, unknown>;
    authorId: string | null;
    status: string;
    flagCount?: number;
    flaggedAt?: string;
    hiddenAt?: string;
    reason?: string;
  }> = [];
  const authorIdsToFetch = new Set<string>();

  // Fetch posts - use flat /posts collection filtered by spaceId
  if (queryParams.contentType === 'all' || queryParams.contentType === 'post') {
    const postsSnapshot = await dbAdmin
      .collection('posts')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .get();

    for (const doc of postsSnapshot.docs) {
      const data = doc.data();

      // Filter based on status
      if (queryParams.status === 'flagged' && !isContentFlagged(data)) continue;
      if (queryParams.status === 'hidden' && !isContentHidden(data)) continue;
      if (queryParams.status === 'all' && !isContentHidden(data) && !isContentFlagged(data)) continue;

      if (data.authorId) authorIdsToFetch.add(data.authorId);

      queueItems.push({
        id: doc.id,
        type: 'post',
        content: {
          title: data.title,
          text: data.content?.substring(0, 200),
          type: data.type,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        },
        authorId: data.authorId || null,
        status: getModerationStatus(data),
        flagCount: data.flagCount,
        flaggedAt: data.flaggedAt,
        hiddenAt: data.hiddenAt,
        reason: data.moderationReason,
      });
    }
  }

  // Fetch events - use flat /events collection filtered by spaceId
  if (queryParams.contentType === 'all' || queryParams.contentType === 'event') {
    const eventsSnapshot = await dbAdmin
      .collection('events')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .get();

    for (const doc of eventsSnapshot.docs) {
      const data = doc.data();

      if (queryParams.status === 'flagged' && !isContentFlagged(data)) continue;
      if (queryParams.status === 'hidden' && !isContentHidden(data)) continue;
      if (queryParams.status === 'all' && !isContentHidden(data) && !isContentFlagged(data)) continue;

      if (data.organizerId) authorIdsToFetch.add(data.organizerId);

      queueItems.push({
        id: doc.id,
        type: 'event',
        content: {
          title: data.title,
          description: data.description?.substring(0, 200),
          startDate: data.startDate?.toDate?.()?.toISOString(),
          type: data.type,
        },
        authorId: data.organizerId || null,
        status: getModerationStatus(data),
        flagCount: data.flagCount,
        flaggedAt: data.flaggedAt,
        hiddenAt: data.hiddenAt,
        reason: data.moderationReason,
      });
    }
  }

  // Batch fetch all authors (Firestore 'in' query supports up to 30 items per query)
  const authorsMap = new Map<string, { id: string; name: string; avatar?: string }>();
  const authorIds = Array.from(authorIdsToFetch);

  if (authorIds.length > 0) {
    const BATCH_SIZE = 30;
    for (let i = 0; i < authorIds.length; i += BATCH_SIZE) {
      const batch = authorIds.slice(i, i + BATCH_SIZE);
      try {
        const authorsSnapshot = await dbAdmin
          .collection('users')
          .where('__name__', 'in', batch)
          .get();

        for (const doc of authorsSnapshot.docs) {
          const data = doc.data();
          authorsMap.set(doc.id, {
            id: doc.id,
            name: data.fullName || 'Unknown',
            avatar: data.photoURL,
          });
        }
      } catch (error) {
        logger.warn('Failed to batch fetch authors', { error, spaceId, batchSize: batch.length });
      }
    }
  }

  // Build final queue with author data
  const queue = queueItems.map(item => ({
    id: item.id,
    type: item.type,
    content: item.content,
    author: item.authorId ? authorsMap.get(item.authorId) || null : null,
    status: item.status,
    flagCount: item.flagCount,
    flaggedAt: item.flaggedAt,
    hiddenAt: item.hiddenAt,
    reason: item.reason,
  }));

  // Sort by flaggedAt or hiddenAt (most recent first)
  queue.sort((a, b) => {
    const aDate = a.flaggedAt || a.hiddenAt || '';
    const bDate = b.flaggedAt || b.hiddenAt || '';
    return bDate.localeCompare(aDate);
  });

  // Apply pagination
  const paginatedQueue = queue.slice(queryParams.offset, queryParams.offset + queryParams.limit);

  logger.info('Moderation queue fetched', {
    spaceId,
    userId,
    contentType: queryParams.contentType,
    status: queryParams.status,
    totalItems: queue.length,
    endpoint: '/api/spaces/[spaceId]/moderation'
  });

  return respond.success({
    items: paginatedQueue,
    total: queue.length,
    pagination: {
      limit: queryParams.limit,
      offset: queryParams.offset,
      hasMore: queue.length > queryParams.offset + queryParams.limit,
    },
    summary: {
      flagged: queue.filter(i => i.status === 'flagged').length,
      hidden: queue.filter(i => i.status === 'hidden').length,
      removed: queue.filter(i => i.status === 'removed').length,
    },
  });
});

/**
 * POST /api/spaces/[spaceId]/moderation
 *
 * Perform a moderation action on content
 */
export const POST = withAuthValidationAndErrors(
  ModerationActionSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId } = await params;

    const validation = await validateSpaceAndModeratorPermission(spaceId, userId, campusId);
    if (!validation.ok) {
      const code = validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    // SECURITY: Scan moderation reason for XSS if provided
    // SecurityScanner.scanInput returns { level, threats, sanitized } - check level for dangerous content
    if (body.reason) {
      const scan = SecurityScanner.scanInput(body.reason);
      if (scan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in moderation reason", { userId, spaceId, threats: scan.threats });
        return respond.error("Moderation reason contains invalid content", "INVALID_INPUT", { status: HttpStatus.BAD_REQUEST });
      }
    }

    // For comments, we need the parent post ID
    // The contentId format for comments should be: postId:commentId
    let contentRef;

    if (body.contentType === 'comment') {
      const [postId, commentId] = body.contentId.split(':');
      if (!postId || !commentId) {
        return respond.error(
          "Comment contentId must be in format 'postId:commentId'",
          "INVALID_INPUT",
          { status: HttpStatus.BAD_REQUEST }
        );
      }
      contentRef = getContentRef(spaceId, 'comment', commentId, postId);
    } else {
      contentRef = getContentRef(spaceId, body.contentType as ModerableContentType, body.contentId);
    }

    // Check content exists
    const contentDoc = await contentRef.get();
    if (!contentDoc.exists) {
      return respond.error("Content not found", "RESOURCE_NOT_FOUND", { status: HttpStatus.NOT_FOUND });
    }

    const contentData = contentDoc.data();
    if (!contentData) {
      return respond.error("Content data missing", "RESOURCE_NOT_FOUND", { status: HttpStatus.NOT_FOUND });
    }

    const previousStatus = getModerationStatus(contentData);
    const updateData = buildModerationUpdate(body.action as ModerationAction, userId, body.reason);

    await contentRef.update(updateData);

    // Log moderation action
    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('moderationLog')
      .add({
        contentId: body.contentId,
        contentType: body.contentType,
        action: body.action,
        previousStatus,
        newStatus: getModerationStatus({ ...contentData, ...updateData }),
        moderatorId: userId,
        reason: body.reason,
        timestamp: new Date(),
        campusId: campusId,
      });

    logger.info('Moderation action performed', {
      spaceId,
      userId,
      contentId: body.contentId,
      contentType: body.contentType,
      action: body.action,
      endpoint: '/api/spaces/[spaceId]/moderation'
    });

    return respond.success({
      success: true,
      contentId: body.contentId,
      contentType: body.contentType,
      action: body.action,
      previousStatus,
      newStatus: getModerationStatus({ ...contentData, ...updateData }),
    });
  }
);

/**
 * PUT /api/spaces/[spaceId]/moderation
 *
 * Bulk moderation actions
 */
export const PUT = withAuthValidationAndErrors(
  BulkModerationSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId } = await params;

    const validation = await validateSpaceAndModeratorPermission(spaceId, userId, campusId);
    if (!validation.ok) {
      const code = validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    // SECURITY: Scan bulk moderation reason for XSS if provided
    // SecurityScanner.scanInput returns { level, threats, sanitized } - check level for dangerous content
    if (body.reason) {
      const scan = SecurityScanner.scanInput(body.reason);
      if (scan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in bulk moderation reason", { userId, spaceId, threats: scan.threats });
        return respond.error("Moderation reason contains invalid content", "INVALID_INPUT", { status: HttpStatus.BAD_REQUEST });
      }
    }

    const results: Array<{
      contentId: string;
      contentType: string;
      success: boolean;
      error?: string;
    }> = [];

    const updateData = buildModerationUpdate(body.action as ModerationAction, userId, body.reason);

    for (const item of body.items) {
      try {
        let contentRef;
        if (item.contentType === 'comment') {
          const [postId, commentId] = item.contentId.split(':');
          if (!postId || !commentId) {
            results.push({
              contentId: item.contentId,
              contentType: item.contentType,
              success: false,
              error: "Invalid comment ID format",
            });
            continue;
          }
          contentRef = getContentRef(spaceId, 'comment', commentId, postId);
        } else {
          contentRef = getContentRef(spaceId, item.contentType as ModerableContentType, item.contentId);
        }

        const contentDoc = await contentRef.get();
        if (!contentDoc.exists) {
          results.push({
            contentId: item.contentId,
            contentType: item.contentType,
            success: false,
            error: "Content not found",
          });
          continue;
        }

        await contentRef.update(updateData);

        // Log moderation action
        await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('moderationLog')
          .add({
            contentId: item.contentId,
            contentType: item.contentType,
            action: body.action,
            moderatorId: userId,
            reason: body.reason,
            timestamp: new Date(),
            campusId: campusId,
            isBulkAction: true,
          });

        results.push({
          contentId: item.contentId,
          contentType: item.contentType,
          success: true,
        });
      } catch (error) {
        results.push({
          contentId: item.contentId,
          contentType: item.contentType,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Bulk moderation action performed', {
      spaceId,
      userId,
      action: body.action,
      successCount,
      failureCount,
      endpoint: '/api/spaces/[spaceId]/moderation'
    });

    return respond.success({
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  }
);

export const GET = withCache(_GET, 'SHORT');
