/**
 * Admin Report Resolution API
 *
 * POST: Resolve a content report with action
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';

interface RouteContext {
  params: Promise<{ reportId: string }>;
}

const ResolveSchema = z.object({
  action: z.enum(['remove_content', 'warn_user', 'suspend_user', 'ban_user', 'dismiss']),
  resolution: z.string().min(1).max(1000),
  suspendDuration: z.enum(['1d', '7d', '30d', 'permanent']).optional(),
  notifyReporter: z.boolean().optional().default(true),
  notifyTarget: z.boolean().optional().default(true),
});

/**
 * POST /api/admin/moderation/reports/[reportId]/resolve
 * Resolve a content report with specified action
 */
export const POST = withAdminAuthAndErrors<RouteContext>(async (request, context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { reportId } = await context.params;

  if (!reportId) {
    return respond.error('Report ID is required', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  try {
    const body = await request.json();
    const parseResult = ResolveSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const { action, resolution, suspendDuration, notifyReporter, notifyTarget } = parseResult.data;

    // Fetch the report
    const reportRef = dbAdmin.collection('contentReports').doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return respond.error('Report not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const reportData = reportDoc.data();

    if (reportData?.status === 'resolved' || reportData?.status === 'dismissed') {
      return respond.error('Report already resolved', 'CONFLICT', {
        status: HttpStatus.CONFLICT,
      });
    }

    // Execute the action
    const batch = dbAdmin.batch();
    const actionResults: Record<string, unknown> = {};

    switch (action) {
      case 'remove_content':
        // Mark content as removed/hidden
        if (reportData?.contentType === 'message' && reportData?.contentId) {
          const messageRef = dbAdmin.collection('messages').doc(reportData.contentId);
          batch.update(messageRef, {
            status: 'removed',
            removedAt: new Date(),
            removedBy: adminId,
            removedReason: resolution,
          });
          actionResults.contentRemoved = true;
        }
        break;

      case 'warn_user':
        // Create a warning record
        if (reportData?.targetUserId) {
          const warningRef = dbAdmin.collection('userWarnings').doc();
          batch.set(warningRef, {
            userId: reportData.targetUserId,
            type: 'content_violation',
            reason: resolution,
            reportId: reportId,
            issuedBy: adminId,
            createdAt: new Date(),
          });
          actionResults.warningIssued = true;
        }
        break;

      case 'suspend_user':
        // Suspend the target user
        if (reportData?.targetUserId) {
          const userRef = dbAdmin.collection('profiles').doc(reportData.targetUserId);
          let suspendedUntil: Date | null = null;

          if (suspendDuration && suspendDuration !== 'permanent') {
            const days = suspendDuration === '1d' ? 1 : suspendDuration === '7d' ? 7 : 30;
            suspendedUntil = new Date();
            suspendedUntil.setDate(suspendedUntil.getDate() + days);
          }

          batch.update(userRef, {
            status: 'suspended',
            suspendedAt: new Date(),
            suspendedBy: adminId,
            suspendedReason: resolution,
            suspendedUntil,
            updatedAt: new Date(),
          });
          actionResults.userSuspended = true;
          actionResults.suspendedUntil = suspendedUntil?.toISOString() || 'permanent';
        }
        break;

      case 'ban_user':
        // Permanently ban the target user
        if (reportData?.targetUserId) {
          const userRef = dbAdmin.collection('profiles').doc(reportData.targetUserId);
          batch.update(userRef, {
            status: 'banned',
            bannedAt: new Date(),
            bannedBy: adminId,
            bannedReason: resolution,
            updatedAt: new Date(),
          });
          actionResults.userBanned = true;
        }
        break;

      case 'dismiss':
        // No action needed, just mark as dismissed
        actionResults.dismissed = true;
        break;
    }

    // Update the report status
    batch.update(reportRef, {
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      resolution,
      resolvedBy: adminId,
      resolvedAt: new Date(),
      actionTaken: action,
      updatedAt: new Date(),
    });

    // Commit all changes
    await batch.commit();

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: `report_${action === 'dismiss' ? 'dismissed' : 'resolved'}`,
      targetType: 'content',
      targetId: reportId,
      details: {
        action,
        resolution,
        contentType: reportData?.contentType,
        targetUserId: reportData?.targetUserId,
        ...actionResults,
      },
    });

    // TODO: Send notifications if notifyReporter or notifyTarget is true

    logger.info('Report resolved', {
      adminId,
      reportId,
      action,
      results: actionResults,
    });

    return respond.success({
      message: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`,
      reportId,
      action,
      results: actionResults,
    });
  } catch (error) {
    logger.error('Failed to resolve report', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      reportId,
    });
    return respond.error('Failed to resolve report', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
