/**
 * Admin Space Moderation API
 *
 * GET: Fetch moderation queue for a specific space
 *
 * This is a P0 cross-slice integration endpoint that connects Admin with Spaces.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { dbAdmin } from '@/lib/firebase-admin';

type RouteContext = { params: Promise<{ spaceId: string }> };

const ModerationQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'resolved', 'dismissed']).optional().default('pending'),
  type: z.enum(['all', 'message', 'profile', 'tool']).optional().default('all'),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

interface SpaceModerationItem {
  id: string;
  type: 'message' | 'profile' | 'tool';
  contentId: string;
  contentPreview: string;
  reportType: string;
  reportedBy: string;
  reportedByName?: string;
  targetUserId?: string;
  targetUserName?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  priority: 'high' | 'medium' | 'low';
  aiScore?: number;
  aiFlags?: string[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

/**
 * GET /api/admin/spaces/[spaceId]/moderation
 * Fetch moderation queue for a specific space
 */
export const GET = withAdminAuthAndErrors(async (request, context: RouteContext, respond) => {
  const { spaceId } = await context.params;
  const { searchParams } = new URL(request.url);
  const queryResult = ModerationQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Verify space exists
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return respond.error('Space not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const spaceData = spaceDoc.data();

    // Build query for reports in this space
    let reportsQuery = dbAdmin
      .collection('contentReports')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .where('spaceId', '==', spaceId)
      .orderBy('createdAt', 'desc');

    if (query.status !== 'all') {
      reportsQuery = reportsQuery.where('status', '==', query.status);
    }

    const reportsSnapshot = await reportsQuery.limit(100).get();

    let items: SpaceModerationItem[] = reportsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.contentType as 'message' | 'profile' | 'tool',
        contentId: data.contentId,
        contentPreview: data.contentPreview || '',
        reportType: data.reportType,
        reportedBy: data.reportedBy,
        reportedByName: data.reportedByName,
        targetUserId: data.targetUserId,
        targetUserName: data.targetUserName,
        reason: data.reason,
        status: data.status,
        priority: data.priority || 'medium',
        aiScore: data.aiScore,
        aiFlags: data.aiFlags,
        resolution: data.resolution,
        resolvedBy: data.resolvedBy,
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Apply type filter
    if (query.type !== 'all') {
      items = items.filter(i => i.type === query.type);
    }

    // Calculate stats
    const allItems = reportsSnapshot.docs.map(d => d.data());
    const stats = {
      total: allItems.length,
      pending: allItems.filter(i => i.status === 'pending').length,
      resolved: allItems.filter(i => i.status === 'resolved').length,
      dismissed: allItems.filter(i => i.status === 'dismissed').length,
      highPriority: allItems.filter(i => i.priority === 'high').length,
      byType: {
        message: allItems.filter(i => i.contentType === 'message').length,
        profile: allItems.filter(i => i.contentType === 'profile').length,
        tool: allItems.filter(i => i.contentType === 'tool').length,
      },
    };

    // Apply pagination
    const total = items.length;
    const paginatedItems = items.slice(query.offset, query.offset + query.limit);

    logger.info('Space moderation queue fetched', {
      spaceId,
      total,
    });

    return respond.success({
      space: {
        id: spaceId,
        name: spaceData?.name,
        handle: spaceData?.handle,
      },
      items: paginatedItems,
      stats,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + paginatedItems.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch space moderation queue', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
    });
    return respond.error('Failed to fetch space moderation queue', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
