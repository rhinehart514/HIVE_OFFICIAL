/**
 * Admin Claims Queue API
 *
 * Manages pending space claims from leaders.
 * When approved, verifies the claim and can optionally take the space live.
 *
 * Different from builder-requests:
 * - Claims are for unclaimed pre-seeded spaces
 * - Approval verifies the claim and updates space status
 * - Can optionally take space live immediately
 */
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { isAdmin } from '@/lib/admin-auth';
import { getServerSpaceRepository } from '@hive/core/server';
import { ProfileId } from '@hive/core';

const ReviewClaimSchema = z.object({
  claimId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  goLive: z.boolean().optional(), // When approving, also take space live (defaults to true)
});

/**
 * GET: List pending claim requests
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    // Query claim requests specifically (type: 'claim')
    const claimsSnapshot = await dbAdmin
      .collection('builderRequests')
      .where('campusId', '==', campusId)
      .where('type', '==', 'claim')
      .where('status', '==', status)
      .orderBy('submittedAt', 'desc')
      .limit(limit)
      .get();

    const claims = claimsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'claim',
        spaceId: data.spaceId,
        spaceName: data.spaceName,
        spaceCategory: data.spaceCategory,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        role: data.role,
        proofType: data.proofType,
        proofUrl: data.proofUrl,
        provisionalAccessGranted: data.provisionalAccessGranted,
        status: data.status,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() ?? null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() ?? null,
        reviewedBy: data.reviewedBy ?? null,
        reviewNotes: data.reviewNotes ?? null,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    // Get counts
    const pendingCount = (
      await dbAdmin
        .collection('builderRequests')
        .where('campusId', '==', campusId)
        .where('type', '==', 'claim')
        .where('status', '==', 'pending')
        .count()
        .get()
    ).data().count;

    // Calculate average verification time for approved claims
    const approvedSnapshot = await dbAdmin
      .collection('builderRequests')
      .where('campusId', '==', campusId)
      .where('type', '==', 'claim')
      .where('status', '==', 'approved')
      .orderBy('reviewedAt', 'desc')
      .limit(20)
      .get();

    let avgVerificationTimeHours = 0;
    if (!approvedSnapshot.empty) {
      const times = approvedSnapshot.docs
        .filter(doc => doc.data().submittedAt && doc.data().reviewedAt)
        .map(doc => {
          const submitted = doc.data().submittedAt.toDate().getTime();
          const reviewed = doc.data().reviewedAt.toDate().getTime();
          return (reviewed - submitted) / (1000 * 60 * 60); // hours
        });
      if (times.length > 0) {
        avgVerificationTimeHours = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
    }

    return respond.success({
      claims,
      summary: {
        pending: pendingCount,
        showing: claims.length,
        avgVerificationTimeHours,
      },
    });
  } catch (error) {
    logger.error('[admin/claims] Failed to fetch claims', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return respond.error('Failed to fetch claims', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * POST: Approve or reject a claim
 */
export const POST = withAuthValidationAndErrors(
  ReviewClaimSchema,
  async (request, _context, body: z.infer<typeof ReviewClaimSchema>, respond) => {
    const adminId = getUserId(request as AuthenticatedRequest);

    // Verify admin permissions
    if (!(await isAdmin(adminId))) {
      return respond.error('Admin access required', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    const { claimId, action, notes, goLive = true } = body;

    try {
      const claimRef = dbAdmin.collection('builderRequests').doc(claimId);
      const claimDoc = await claimRef.get();

      if (!claimDoc.exists) {
        return respond.error('Claim not found', 'RESOURCE_NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const claimData = claimDoc.data()!;

      if (claimData.type !== 'claim') {
        return respond.error('This is not a claim request', 'VALIDATION_ERROR', {
          status: HttpStatus.BAD_REQUEST,
        });
      }

      if (claimData.status !== 'pending') {
        return respond.error('Claim already processed', 'CONFLICT', {
          status: HttpStatus.CONFLICT,
        });
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const spaceRepo = getServerSpaceRepository();

      // Load the space
      const spaceResult = await spaceRepo.findById(claimData.spaceId);
      if (spaceResult.isFailure) {
        return respond.error('Space not found', 'RESOURCE_NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const space = spaceResult.getValue();

      if (action === 'approve') {
        // Verify the claim in domain model
        const verifyResult = space.verifyClaimRequest(
          ProfileId.create(claimData.userId).getValue(),
          ProfileId.create(adminId).getValue()
        );

        if (verifyResult.isFailure) {
          return respond.error(
            verifyResult.error || 'Failed to verify claim',
            'VALIDATION_ERROR',
            { status: HttpStatus.BAD_REQUEST }
          );
        }

        // Optionally take the space live
        if (goLive) {
          const goLiveResult = space.goLive(ProfileId.create(adminId).getValue());
          if (goLiveResult.isFailure) {
            logger.warn('[admin/claims] Failed to take space live', {
              spaceId: claimData.spaceId,
              error: goLiveResult.error,
            });
            // Don't fail the approval, just note it
          }
        }

        // Save the space
        const saveResult = await spaceRepo.save(space);
        if (saveResult.isFailure) {
          logger.error('[admin/claims] Failed to save space', {
            spaceId: claimData.spaceId,
            error: saveResult.error,
          });
          return respond.error('Failed to save space', 'INTERNAL_ERROR', {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
          });
        }

        // Update the claim record
        await claimRef.update({
          status: 'approved',
          reviewedAt: now,
          reviewedBy: adminId,
          reviewNotes: notes || null,
        });

        // Update the membership to remove provisional flag
        const memberRef = dbAdmin.collection('spaceMembers').doc(`${claimData.spaceId}_${claimData.userId}`);
        await memberRef.update({
          isProvisional: false,
          verifiedAt: now,
          verifiedBy: adminId,
        });

        // Update user's builder status
        await dbAdmin.collection('users').doc(claimData.userId).update({
          isBuilder: true,
          builderApprovedAt: now,
          builderApprovedBy: adminId,
          updatedAt: now,
        });

        logger.info('[admin/claims] Claim approved', {
          claimId,
          spaceId: claimData.spaceId,
          userId: claimData.userId,
          adminId,
          goLive,
        });

        return respond.success({
          message: `Claim approved${goLive ? ' and space is now live' : ''}`,
          claimId,
          spaceId: claimData.spaceId,
          spaceStatus: space.status,
          publishStatus: space.publishStatus,
        });
      } else {
        // Reject the claim
        await claimRef.update({
          status: 'rejected',
          reviewedAt: now,
          reviewedBy: adminId,
          reviewNotes: notes || null,
        });

        // Remove the provisional membership
        const memberRef = dbAdmin.collection('spaceMembers').doc(`${claimData.spaceId}_${claimData.userId}`);
        await memberRef.delete();

        // Reset the space back to unclaimed
        space.resetToStealth(
          ProfileId.create(adminId).getValue(),
          `Claim rejected: ${notes || 'No reason provided'}`
        );

        // Note: Would need to add a method to reset space to unclaimed
        // For now, just save the space as-is
        await spaceRepo.save(space);

        logger.info('[admin/claims] Claim rejected', {
          claimId,
          spaceId: claimData.spaceId,
          userId: claimData.userId,
          adminId,
          reason: notes,
        });

        return respond.success({
          message: 'Claim rejected',
          claimId,
          spaceId: claimData.spaceId,
        });
      }
    } catch (error) {
      logger.error('[admin/claims] Failed to process claim', {
        error: error instanceof Error ? error.message : String(error),
        claimId,
        action,
        adminId,
      });
      return respond.error('Failed to process claim', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);
