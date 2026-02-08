/**
 * Admin Appeals API
 *
 * GET: Fetch user appeals
 * POST: Submit an appeal decision
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';

const AppealsQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'approved', 'denied']).optional().default('all'),
  type: z.enum(['all', 'suspension', 'ban', 'content_removal']).optional().default('all'),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

const AppealDecisionSchema = z.object({
  appealId: z.string().min(1),
  decision: z.enum(['approve', 'deny']),
  reason: z.string().min(1).max(1000),
  restoreContent: z.boolean().optional().default(false),
  liftSuspension: z.boolean().optional().default(false),
});

/**
 * GET /api/admin/moderation/appeals
 * Fetch user appeals
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = AppealsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Build query
    let appealsQuery = dbAdmin
      .collection('appeals')
      .where('campusId', '==', campusId)
      .orderBy('createdAt', 'desc');

    if (query.status !== 'all') {
      appealsQuery = appealsQuery.where('status', '==', query.status);
    }

    const snapshot = await appealsQuery.limit(100).get();

    let appeals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userHandle: data.userHandle,
        type: data.type,
        violationId: data.violationId,
        originalReason: data.originalReason,
        appealReason: data.appealReason,
        status: data.status,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString(),
        reviewNote: data.reviewNote,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Apply type filter
    if (query.type !== 'all') {
      appeals = appeals.filter(a => a.type === query.type);
    }

    // Apply pagination
    const total = appeals.length;
    appeals = appeals.slice(query.offset, query.offset + query.limit);

    // Get summary stats
    const allAppealsSnapshot = await dbAdmin
      .collection('appeals')
      .where('campusId', '==', campusId)
      .get();

    const allAppeals = allAppealsSnapshot.docs.map(d => d.data());
    const stats = {
      total: allAppeals.length,
      pending: allAppeals.filter(a => a.status === 'pending').length,
      approved: allAppeals.filter(a => a.status === 'approved').length,
      denied: allAppeals.filter(a => a.status === 'denied').length,
    };

    logger.info('Appeals fetched', {
      total,
      filters: query,
    });

    return respond.success({
      appeals,
      stats,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + appeals.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch appeals', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch appeals', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * POST /api/admin/moderation/appeals
 * Submit an appeal decision
 */
export const POST = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);

  try {
    const body = await request.json();
    const parseResult = AppealDecisionSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const { appealId, decision, reason, restoreContent, liftSuspension } = parseResult.data;

    // Fetch the appeal
    const appealRef = dbAdmin.collection('appeals').doc(appealId);
    const appealDoc = await appealRef.get();

    if (!appealDoc.exists) {
      return respond.error('Appeal not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const appealData = appealDoc.data();

    if (appealData?.status !== 'pending') {
      return respond.error('Appeal already reviewed', 'CONFLICT', {
        status: HttpStatus.CONFLICT,
      });
    }

    const batch = dbAdmin.batch();
    const actionResults: Record<string, unknown> = {};

    // If approved, take action
    if (decision === 'approve') {
      if (liftSuspension && appealData?.userId) {
        const userRef = dbAdmin.collection('profiles').doc(appealData.userId);
        batch.update(userRef, {
          status: 'active',
          suspendedAt: null,
          suspendedBy: null,
          suspendedReason: null,
          suspendedUntil: null,
          restoredAt: new Date(),
          restoredBy: adminId,
          restoredReason: reason,
          updatedAt: new Date(),
        });
        actionResults.suspensionLifted = true;
      }

      if (restoreContent && appealData?.violationId) {
        // Try to restore content if it was a content removal
        const reportRef = dbAdmin.collection('contentReports').doc(appealData.violationId);
        const reportDoc = await reportRef.get();

        if (reportDoc.exists) {
          const reportData = reportDoc.data();
          if (reportData?.contentType === 'message' && reportData?.contentId) {
            const messageRef = dbAdmin.collection('messages').doc(reportData.contentId);
            batch.update(messageRef, {
              status: 'active',
              restoredAt: new Date(),
              restoredBy: adminId,
            });
            actionResults.contentRestored = true;
          }
        }
      }
    }

    // Update appeal status
    batch.update(appealRef, {
      status: decision === 'approve' ? 'approved' : 'denied',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNote: reason,
      updatedAt: new Date(),
    });

    await batch.commit();

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: `appeal_${decision}d`,
      targetType: 'user',
      targetId: appealData?.userId || appealId,
      details: {
        appealId,
        decision,
        reason,
        type: appealData?.type,
        ...actionResults,
      },
    });

    logger.info('Appeal decision made', {
      adminId,
      appealId,
      decision,
      results: actionResults,
    });

    return respond.success({
      message: `Appeal ${decision}d successfully`,
      appealId,
      decision,
      results: actionResults,
    });
  } catch (error) {
    logger.error('Failed to process appeal decision', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
    });
    return respond.error('Failed to process appeal decision', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
