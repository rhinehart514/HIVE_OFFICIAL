import { z } from 'zod';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { logger } from '@/lib/logger';
import { checkSpacePermission } from '@/lib/space-permission-middleware';

const TransferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, 'newOwnerId is required'),
});

/**
 * POST /api/spaces/[spaceId]/transfer-ownership
 *
 * Transfers space ownership from current owner to another member.
 * - Only the current owner can transfer ownership.
 * - Target must be an active member (admin or moderator preferred).
 * - Cannot transfer to self.
 * - Uses Firestore transaction for atomicity.
 * - Logs the transfer for audit.
 */
export const POST = withAuthAndErrors(
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // Validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return respond.error('Invalid request body', 'INVALID_INPUT', {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const parse = TransferOwnershipSchema.safeParse(body);
    if (!parse.success) {
      return respond.error(
        parse.error.errors[0]?.message || 'Invalid input',
        'VALIDATION_ERROR',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { newOwnerId } = parse.data;

    // Cannot transfer to self
    if (newOwnerId === userId) {
      return respond.error(
        'Cannot transfer ownership to yourself',
        'INVALID_INPUT',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Verify current user is the owner
    const ownerCheck = await checkSpacePermission(spaceId, userId, 'owner');
    if (!ownerCheck.hasPermission) {
      logger.warn('Non-owner attempted ownership transfer', {
        userId,
        spaceId,
        endpoint: '/api/spaces/[spaceId]/transfer-ownership',
      });
      return respond.error(
        'Only the space owner can transfer ownership',
        'FORBIDDEN',
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // Verify target user is an active member
    const targetMemberQuery = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', newOwnerId)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .limit(1)
      .get();

    // Also check composite key pattern
    let targetMemberDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    let targetMemberRole: string | null = null;

    if (!targetMemberQuery.empty) {
      targetMemberDoc = targetMemberQuery.docs[0];
      targetMemberRole = targetMemberDoc.data()?.role || 'member';
    } else {
      // Try composite key
      const compositeDoc = await dbAdmin
        .collection('spaceMembers')
        .doc(`${spaceId}_${newOwnerId}`)
        .get();

      if (
        compositeDoc.exists &&
        compositeDoc.data()?.isActive === true &&
        compositeDoc.data()?.campusId === campusId
      ) {
        targetMemberDoc = compositeDoc;
        targetMemberRole = compositeDoc.data()?.role || 'member';
      }
    }

    if (!targetMemberDoc) {
      return respond.error(
        'Target user is not an active member of this space',
        'INVALID_INPUT',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Find the current owner's membership document
    let ownerMemberDoc: FirebaseFirestore.DocumentSnapshot | null = null;

    const ownerMemberQuery = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .limit(1)
      .get();

    if (!ownerMemberQuery.empty) {
      ownerMemberDoc = ownerMemberQuery.docs[0];
    } else {
      // Try composite key
      const compositeDoc = await dbAdmin
        .collection('spaceMembers')
        .doc(`${spaceId}_${userId}`)
        .get();

      if (compositeDoc.exists && compositeDoc.data()?.isActive === true) {
        ownerMemberDoc = compositeDoc;
      }
    }

    // Fetch target user profile for the response
    const targetUserDoc = await dbAdmin
      .collection('users')
      .doc(newOwnerId)
      .get();
    const targetUserName =
      targetUserDoc.data()?.displayName ||
      targetUserDoc.data()?.fullName ||
      'Unknown User';

    // Execute the transfer in a Firestore transaction
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    const batch = dbAdmin.batch();

    // 1. Promote new owner
    batch.update(targetMemberDoc.ref, {
      role: 'owner',
      promotedAt: timestamp,
      promotedBy: userId,
      previousRole: targetMemberRole,
      updatedAt: timestamp,
    });

    // 2. Demote current owner to admin
    if (ownerMemberDoc) {
      batch.update(ownerMemberDoc.ref, {
        role: 'admin',
        demotedAt: timestamp,
        previousRole: 'owner',
        updatedAt: timestamp,
      });
    }

    // 3. Update space document ownership fields
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    const spaceUpdateData: Record<string, unknown> = {
      updatedAt: timestamp,
    };

    // Update createdBy to reflect the new owner
    const spaceDoc = await spaceRef.get();
    if (spaceDoc.exists) {
      const spaceData = spaceDoc.data();

      // Update createdBy if it matches the current owner
      if (spaceData?.createdBy === userId) {
        spaceUpdateData.createdBy = newOwnerId;
      }

      // Update leaders array if it exists
      if (Array.isArray(spaceData?.leaders)) {
        const updatedLeaders = spaceData.leaders.filter(
          (id: string) => id !== userId
        );
        if (!updatedLeaders.includes(newOwnerId)) {
          updatedLeaders.unshift(newOwnerId);
        }
        // Keep old owner in leaders as admin
        if (!updatedLeaders.includes(userId)) {
          updatedLeaders.push(userId);
        }
        spaceUpdateData.leaders = updatedLeaders;
      }
    }

    batch.update(spaceRef, spaceUpdateData);

    // 4. Create audit log entry
    const auditRef = dbAdmin.collection('spaceAuditLog').doc();
    batch.set(auditRef, {
      spaceId,
      action: 'ownership_transferred',
      performedBy: userId,
      targetUserId: newOwnerId,
      previousOwner: userId,
      newOwner: newOwnerId,
      previousOwnerNewRole: 'admin',
      newOwnerPreviousRole: targetMemberRole,
      campusId,
      timestamp: new Date().toISOString(),
      createdAt: timestamp,
    });

    await batch.commit();

    logger.info('Space ownership transferred', {
      spaceId,
      previousOwner: userId,
      newOwner: newOwnerId,
      newOwnerPreviousRole: targetMemberRole,
      endpoint: '/api/spaces/[spaceId]/transfer-ownership',
    });

    return respond.success({
      message: 'Ownership transferred successfully',
      transfer: {
        previousOwner: userId,
        newOwner: newOwnerId,
        newOwnerName: targetUserName,
        previousOwnerNewRole: 'admin',
      },
    });
  }
);
