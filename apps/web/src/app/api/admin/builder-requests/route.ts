import { z } from 'zod';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { CURRENT_CAMPUS_ID, addSecureCampusMetadata } from '@/lib/secure-firebase-queries';
import { HttpStatus } from '@/lib/api-response-types';
// SECURITY: Use centralized admin auth
import { isAdmin, getAdminRecord, hasAdminRole } from '@/lib/admin-auth';
import { notifyBuilderApproved, notifyBuilderRejected } from '@/lib/notification-service';

const ReviewRequestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

// GET: List all pending builder requests
export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  // Check admin permission
  if (!(await isAdmin(userId))) {
    return respond.error('Admin access required', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    const requestsSnapshot = await dbAdmin
      .collection('builderRequests')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .where('status', '==', status)
      .orderBy('submittedAt', 'desc')
      .limit(limit)
      .get();

    const requests = requestsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        spaceId: data.spaceId,
        spaceName: data.spaceName,
        spaceType: data.spaceType,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        motivation: data.motivation,
        experience: data.experience,
        plans: data.plans,
        timeCommitment: data.timeCommitment,
        status: data.status,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() ?? null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() ?? null,
        reviewedBy: data.reviewedBy ?? null,
        reviewNotes: data.reviewNotes ?? null,
      };
    });

    // Get counts
    const pendingCount = (
      await dbAdmin
        .collection('builderRequests')
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .where('status', '==', 'pending')
        .count()
        .get()
    ).data().count;

    return respond.success({
      requests,
      summary: {
        pending: pendingCount,
        showing: requests.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch builder requests', {
      error: { error: error instanceof Error ? error.message : String(error) },
      userId,
    });
    return respond.error('Failed to fetch requests', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

// POST: Approve or reject a request
export const POST = withAuthValidationAndErrors(
  ReviewRequestSchema,
  async (
    request,
    _context,
    body: z.infer<typeof ReviewRequestSchema>,
    respond
  ) => {
    const adminId = getUserId(request as AuthenticatedRequest);

    // Check admin permission
    if (!(await isAdmin(adminId))) {
      return respond.error('Admin access required', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    const { requestId, action, notes } = body;

    try {
      const requestRef = dbAdmin.collection('builderRequests').doc(requestId);
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        return respond.error('Request not found', 'RESOURCE_NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const requestData = requestDoc.data()!;

      if (requestData.status !== 'pending') {
        return respond.error('Request already processed', 'CONFLICT', {
          status: HttpStatus.CONFLICT,
        });
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const batch = dbAdmin.batch();

      // Update request status
      batch.update(requestRef, {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: now,
        reviewedBy: adminId,
        reviewNotes: notes || null,
      });

      if (action === 'approve') {
        // Update or create membership with admin role
        const existingMembership = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', requestData.spaceId)
          .where('userId', '==', requestData.userId)
          .where('campusId', '==', CURRENT_CAMPUS_ID)
          .limit(1)
          .get();

        if (!existingMembership.empty) {
          // Update existing membership to admin
          batch.update(existingMembership.docs[0].ref, {
            role: 'admin',
            roleChangedAt: now,
            roleChangedBy: adminId,
            updatedAt: now,
          });
        } else {
          // Create new membership as admin
          const memberRef = dbAdmin.collection('spaceMembers').doc();
          batch.set(
            memberRef,
            addSecureCampusMetadata({
              spaceId: requestData.spaceId,
              userId: requestData.userId,
              role: 'admin',
              joinedAt: now,
              lastActive: now,
              isActive: true,
              isOnline: false,
              approvedBy: adminId,
              joinMethod: 'builder_request',
            })
          );

          // Increment member count
          batch.update(dbAdmin.collection('spaces').doc(requestData.spaceId), {
            'metrics.memberCount': admin.firestore.FieldValue.increment(1),
            updatedAt: now,
          });
        }

        // Update user's builder status
        batch.update(dbAdmin.collection('users').doc(requestData.userId), {
          isBuilder: true,
          builderOptIn: true,
          builderApprovedAt: now,
          builderApprovedBy: adminId,
          updatedAt: now,
        });
      }

      await batch.commit();

      // Get admin name for notification
      const adminDoc = await dbAdmin.collection('users').doc(adminId).get();
      const adminName = adminDoc.data()?.fullName || 'Admin';

      // Send notification to the user
      try {
        if (action === 'approve') {
          await notifyBuilderApproved({
            userId: requestData.userId,
            adminId,
            adminName,
            spaceId: requestData.spaceId,
            spaceName: requestData.spaceName,
          });
        } else {
          await notifyBuilderRejected({
            userId: requestData.userId,
            adminId,
            adminName,
            spaceId: requestData.spaceId,
            spaceName: requestData.spaceName,
            reason: notes,
          });
        }
      } catch (notifyError) {
        // Don't fail the action if notification fails
        logger.warn('Failed to send builder request notification', {
          error: notifyError instanceof Error ? notifyError.message : String(notifyError),
          requestId,
          action,
        });
      }

      logger.info(`Builder request ${action}d`, {
        requestId,
        spaceId: requestData.spaceId,
        userId: requestData.userId,
        adminId,
      });

      return respond.success({
        message: `Request ${action}d successfully`,
        requestId,
        action,
      });
    } catch (error) {
      logger.error('Failed to process builder request', {
        error: { error: error instanceof Error ? error.message : String(error) },
        requestId,
        action,
        adminId,
      });
      return respond.error('Failed to process request', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);
