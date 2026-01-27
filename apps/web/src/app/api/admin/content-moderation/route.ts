/**
 * Admin Content Moderation API
 *
 * GET: Fetch flagged content for moderation queue
 */

import { z } from 'zod';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';

const QuerySchema = z.object({
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
  status: z.enum(['pending', 'reviewed', 'resolved', 'all']).optional().default('pending'),
  type: z.enum(['post', 'comment', 'space', 'profile', 'all']).optional().default('all'),
  severity: z.enum(['low', 'medium', 'high', 'critical', 'all']).optional().default('all'),
});

interface FlaggedContent {
  id: string;
  contentType: 'post' | 'comment' | 'space' | 'profile';
  contentId: string;
  reason: string;
  reporterId: string;
  reporterName?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  resolution?: string;
  contentPreview?: string;
}

/**
 * GET /api/admin/content-moderation
 * Fetch flagged content for the moderation queue
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = QuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const { limit, offset, status, type, severity } = queryResult.data;

  try {
    // Query flagged content from Firestore
    let query = dbAdmin
      .collection('flaggedContent')
      .where('campusId', '==', campusId);

    // Apply status filter
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Apply type filter
    if (type !== 'all') {
      query = query.where('contentType', '==', type);
    }

    // Apply severity filter
    if (severity !== 'all') {
      query = query.where('severity', '==', severity);
    }

    // Order by creation date and apply pagination
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(limit)
      .get();

    const flaggedContent: FlaggedContent[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        contentType: data.contentType,
        contentId: data.contentId,
        reason: data.reason || 'No reason provided',
        reporterId: data.reporterId,
        reporterName: data.reporterName,
        status: data.status || 'pending',
        severity: data.severity || 'medium',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString(),
        reviewedBy: data.reviewedBy,
        resolution: data.resolution,
        contentPreview: data.contentPreview,
      };
    });

    // Get counts by status for stats
    const [pendingSnap, reviewedSnap, resolvedSnap] = await Promise.all([
      dbAdmin.collection('flaggedContent')
        .where('campusId', '==', campusId)
        .where('status', '==', 'pending')
        .count()
        .get(),
      dbAdmin.collection('flaggedContent')
        .where('campusId', '==', campusId)
        .where('status', '==', 'reviewed')
        .count()
        .get(),
      dbAdmin.collection('flaggedContent')
        .where('campusId', '==', campusId)
        .where('status', '==', 'resolved')
        .count()
        .get(),
    ]);

    return respond.success({
      flaggedContent,
      pagination: {
        limit,
        offset,
        total: snapshot.size,
        hasMore: snapshot.size === limit,
      },
      stats: {
        pending: pendingSnap.data().count,
        reviewed: reviewedSnap.data().count,
        resolved: resolvedSnap.data().count,
      },
    });
  } catch (error) {
    // If the collection doesn't exist or there's an index issue, return empty results
    if ((error as { code?: number }).code === 9 || (error as { message?: string }).message?.includes('index')) {
      return respond.success({
        flaggedContent: [],
        pagination: {
          limit,
          offset,
          total: 0,
          hasMore: false,
        },
        stats: {
          pending: 0,
          reviewed: 0,
          resolved: 0,
        },
      });
    }

    throw error;
  }
});
