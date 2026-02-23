/**
 * Admin Moderation Queue API
 *
 * GET: Fetch pending content reports requiring review
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

const QueueQuerySchema = z.object({
  priority: z.enum(['all', 'high', 'medium', 'low']).optional().default('all'),
  type: z.enum(['all', 'spam', 'harassment', 'inappropriate', 'other']).optional().default('all'),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

/**
 * GET /api/admin/moderation/queue
 * Fetch pending reports requiring review
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = QueueQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Build Firestore query for pending reports
    const reportsQuery = dbAdmin
      .collection('contentReports')
      .where('status', '==', 'pending')
      .orderBy('priority', 'asc') // high priority first (alphabetically 'high' < 'low' < 'medium')
      .orderBy('createdAt', 'desc');

    // Note: Complex queries with multiple inequality filters need composite indexes
    // For now, we'll filter priority and type in memory after fetching

    const snapshot = await reportsQuery.limit(100).get();

    let reports = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        contentType: data.contentType,
        contentId: data.contentId,
        contentPreview: data.contentPreview || '',
        reportType: data.reportType,
        reportedBy: data.reportedBy,
        reportedByName: data.reportedByName,
        targetUserId: data.targetUserId,
        targetUserName: data.targetUserName,
        spaceId: data.spaceId,
        spaceName: data.spaceName,
        reason: data.reason,
        status: data.status,
        priority: data.priority || 'medium',
        aiScore: data.aiScore,
        aiFlags: data.aiFlags || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Apply in-memory filters
    if (query.priority !== 'all') {
      reports = reports.filter(r => r.priority === query.priority);
    }

    if (query.type !== 'all') {
      reports = reports.filter(r => r.reportType === query.type);
    }

    // Sort by priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    reports.sort((a, b) => {
      const pA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
      const pB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
      if (pA !== pB) return pA - pB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    const total = reports.length;
    reports = reports.slice(query.offset, query.offset + query.limit);

    // Get summary stats
    const allPendingSnapshot = await dbAdmin
      .collection('contentReports')
      .where('status', '==', 'pending')
      .get();

    const stats = {
      total: allPendingSnapshot.size,
      highPriority: allPendingSnapshot.docs.filter(d => d.data().priority === 'high').length,
      today: allPendingSnapshot.docs.filter(d => {
        const created = d.data().createdAt?.toDate?.();
        if (!created) return false;
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length,
    };

    logger.info('Moderation queue fetched', {
      total,
      filters: { priority: query.priority, type: query.type },
    });

    return respond.success({
      reports,
      stats,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + reports.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch moderation queue', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch moderation queue', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
