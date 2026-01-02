/**
 * Admin Tool Approval API
 *
 * POST: Approve a tool for deployment
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

const ApproveSchema = z.object({
  requestId: z.string().min(1),
  feedback: z.string().max(1000).optional(),
  promoteToTemplate: z.boolean().optional().default(false),
  templateCategory: z.string().optional(),
});

/**
 * POST /api/admin/tools/[toolId]/approve
 * Approve a tool for deployment
 */
export const POST = withAdminAuthAndErrors(async (request, context: RouteContext, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { toolId } = await context.params;

  try {
    const body = await request.json();
    const parseResult = ApproveSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const { requestId, feedback, promoteToTemplate, templateCategory } = parseResult.data;

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
    batch.update(requestRef, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewFeedback: feedback,
      updatedAt: new Date(),
    });

    // Update the tool status
    const toolRef = dbAdmin.collection('tools').doc(toolId);
    const toolDoc = await toolRef.get();

    if (toolDoc.exists) {
      batch.update(toolRef, {
        publishStatus: 'published',
        publishedAt: new Date(),
        publishedBy: adminId,
        isTemplate: promoteToTemplate,
        templateCategory: promoteToTemplate ? templateCategory : null,
        updatedAt: new Date(),
      });
    }

    // If deploying to a space, update the placement
    if (requestData?.targetSpaceId) {
      const placementRef = dbAdmin
        .collection('spaces')
        .doc(requestData.targetSpaceId)
        .collection('placedTools')
        .doc(toolId);

      batch.set(placementRef, {
        toolId,
        placedBy: requestData.userId,
        placedAt: new Date(),
        approvedBy: adminId,
        approvedAt: new Date(),
        isActive: true,
        position: requestData.position || { x: 0, y: 0 },
      }, { merge: true });
    }

    await batch.commit();

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: 'tool_approved',
      targetType: 'tool',
      targetId: toolId,
      details: {
        requestId,
        creatorId: requestData?.userId,
        targetSpaceId: requestData?.targetSpaceId,
        promoteToTemplate,
        templateCategory,
        feedback,
      },
    });

    logger.info('Tool approved', {
      adminId,
      toolId,
      requestId,
      promoteToTemplate,
    });

    return respond.success({
      message: 'Tool approved successfully',
      toolId,
      requestId,
      promoteToTemplate,
    });
  } catch (error) {
    logger.error('Failed to approve tool', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      toolId,
    });
    return respond.error('Failed to approve tool', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
