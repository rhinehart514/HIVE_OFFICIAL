/**
 * Admin Tool Rejection API
 *
 * POST: Reject a tool deployment or request changes
 *
 * This is a P1 cross-slice integration endpoint connecting Admin with HiveLab.
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

type RouteContext = { params: Promise<{ toolId: string }> };

const RejectSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['reject', 'request_changes']),
  reason: z.string().min(10).max(1000),
  suggestedFixes: z.array(z.string()).optional(),
});

/**
 * POST /api/admin/tools/[toolId]/reject
 * Reject a tool or request changes
 */
export const POST = withAdminAuthAndErrors(async (request, context: RouteContext, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { toolId } = await context.params;

  try {
    const body = await request.json();
    const parseResult = RejectSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const { requestId, action, reason, suggestedFixes } = parseResult.data;

    // Verify the request exists
    const requestRef = dbAdmin.collection('toolPublishRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return respond.error('Publish request not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const requestData = requestDoc.data();

    if (requestData?.toolId !== toolId) {
      return respond.error('Tool ID mismatch', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    if (requestData?.status !== 'pending' && requestData?.status !== 'in_review') {
      return respond.error('Request already processed', 'CONFLICT', {
        status: HttpStatus.CONFLICT,
      });
    }

    const batch = dbAdmin.batch();

    // Update the request status
    const newStatus = action === 'reject' ? 'rejected' : 'changes_requested';
    batch.update(requestRef, {
      status: newStatus,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: reason,
      suggestedFixes: suggestedFixes || [],
      updatedAt: new Date(),
    });

    // Update the tool status if rejected
    const toolRef = dbAdmin.collection('tools').doc(toolId);
    const toolDoc = await toolRef.get();

    if (toolDoc.exists) {
      batch.update(toolRef, {
        publishStatus: action === 'reject' ? 'rejected' : 'needs_revision',
        lastReviewedAt: new Date(),
        lastReviewedBy: adminId,
        updatedAt: new Date(),
      });
    }

    await batch.commit();

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: action === 'reject' ? 'tool_rejected' : 'tool_changes_requested',
      targetType: 'tool',
      targetId: toolId,
      details: {
        requestId,
        creatorId: requestData?.userId,
        reason,
        suggestedFixes,
      },
    });

    logger.info(`Tool ${action === 'reject' ? 'rejected' : 'changes requested'}`, {
      adminId,
      toolId,
      requestId,
      action,
    });

    return respond.success({
      message: action === 'reject'
        ? 'Tool rejected'
        : 'Changes requested from creator',
      toolId,
      requestId,
      status: newStatus,
    });
  } catch (error) {
    logger.error('Failed to reject tool', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      toolId,
    });
    return respond.error('Failed to process rejection', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
