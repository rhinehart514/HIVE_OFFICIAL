/**
 * Campus Tool Review by Deployment ID
 *
 * POST /api/campus/tools/review/[deploymentId] — Approve or reject a campus tool submission
 *
 * Requires campus admin role.
 */

import { z } from 'zod';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

const ReviewActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

export const POST = withAuthValidationAndErrors(
  ReviewActionSchema,
  async (
    request,
    { params }: { params: Promise<{ deploymentId: string }> },
    validatedData,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    if (!campusId) {
      return respond.error('Campus context required', 'INVALID_INPUT', { status: 400 });
    }

    const { deploymentId } = await params;
    const { action, reason } = validatedData;

    // Verify campus admin role
    const memberDoc = await dbAdmin
      .collection('campusMembers')
      .where('campusId', '==', campusId)
      .where('userId', '==', userId)
      .where('role', 'in', ['admin', 'owner', 'moderator'])
      .limit(1)
      .get();

    if (memberDoc.empty) {
      return respond.error('Campus admin role required', 'FORBIDDEN', { status: 403 });
    }

    // Fetch the deployment
    const toolRef = dbAdmin
      .collection('campuses')
      .doc(campusId)
      .collection('campus_tools')
      .doc(deploymentId);

    const toolDoc = await toolRef.get();
    if (!toolDoc.exists) {
      return respond.error('Submission not found', 'RESOURCE_NOT_FOUND', { status: 404 });
    }

    const toolData = toolDoc.data()!;

    // Only review pending tools
    if (toolData.status !== 'pending_review') {
      return respond.error(
        `Tool is already ${toolData.status}`,
        'INVALID_INPUT',
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: userId,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (action === 'approve') {
      updates.status = 'active';
    } else {
      updates.status = 'rejected';
      updates.isActive = false;
      if (reason) updates.rejectionReason = reason;
    }

    await toolRef.update(updates);

    // Notify tool owner
    const ownerId = toolData.placedBy as string;
    if (ownerId) {
      try {
        const { createNotification } = await import('@/lib/notification-service');
        const toolName = (toolData.toolName as string) || 'your tool';

        await createNotification({
          userId: ownerId,
          type: 'system',
          category: 'tools',
          title: action === 'approve'
            ? `${toolName} approved for campus`
            : `${toolName} not approved`,
          body: action === 'approve'
            ? 'Your tool is now live in the campus directory.'
            : reason || 'Your campus tool submission was not approved. You can edit and resubmit.',
          actionUrl: action === 'approve'
            ? `/campus/tools/${toolData.slug}`
            : `/lab?toolId=${toolData.toolId}`,
          metadata: {
            campusToolReviewed: true,
            action,
            reason,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return respond.success({
      deploymentId,
      action,
      status: updates.status,
    });
  }
);
