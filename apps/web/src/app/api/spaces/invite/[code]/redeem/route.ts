/**
 * Redeem Space Invite Code
 *
 * POST /api/spaces/invite/[code]/redeem
 *
 * Redeems an invite code to join a space.
 * Requires authentication.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';

export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ code: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { code } = await params;

  if (!code) {
    return respond.error('Invite code is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  try {
    // Look up invite by code
    const invitesSnapshot = await dbAdmin
      .collection('spaceInvites')
      .where('code', '==', code)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (invitesSnapshot.empty) {
      return respond.error('Invalid or expired invite code', 'INVALID_INPUT', { status: HttpStatus.NOT_FOUND });
    }

    const inviteDoc = invitesSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    // Verify campus matches
    if (inviteData.campusId !== campusId) {
      return respond.error('This invite is for a different campus', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
    }

    // Check expiration
    if (inviteData.expiresAt) {
      const expiresAt = inviteData.expiresAt.toDate?.() || new Date(inviteData.expiresAt);
      if (expiresAt < new Date()) {
        await inviteDoc.ref.update({ isActive: false });
        return respond.error('This invite link has expired', 'EXPIRED', { status: HttpStatus.GONE });
      }
    }

    // Check max uses
    if (inviteData.maxUses && inviteData.uses >= inviteData.maxUses) {
      await inviteDoc.ref.update({ isActive: false });
      return respond.error('This invite link has reached its maximum uses', 'LIMIT_EXCEEDED', { status: HttpStatus.GONE });
    }

    const spaceId = inviteData.spaceId;

    // Check if already a member
    const existingMembershipSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingMembershipSnapshot.empty) {
      const membership = existingMembershipSnapshot.docs[0].data();
      if (membership.isActive) {
        return respond.success({
          success: true,
          message: 'You are already a member of this space',
          spaceId,
          alreadyMember: true,
        });
      } else {
        // Reactivate membership
        await existingMembershipSnapshot.docs[0].ref.update({
          isActive: true,
          rejoinedAt: admin.firestore.FieldValue.serverTimestamp(),
          joinedViaInvite: inviteDoc.id,
        });
      }
    } else {
      // Get user info for membership
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      const userData = userDoc.data();

      // Create new membership
      await dbAdmin.collection('spaceMembers').add({
        spaceId,
        userId,
        campusId,
        role: 'member',
        isActive: true,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        joinedViaInvite: inviteDoc.id,
        inviteCode: code,
        notifications: true,
        fullName: userData?.fullName || userData?.displayName,
        photoURL: userData?.photoURL,
      });

      // Increment space member count
      await dbAdmin.collection('spaces').doc(spaceId).update({
        memberCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Increment invite uses
    await inviteDoc.ref.update({
      uses: admin.firestore.FieldValue.increment(1),
    });

    // Log activity
    await dbAdmin.collection('spaces').doc(spaceId).collection('activity').add({
      type: 'member_joined_via_invite',
      performedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        inviteId: inviteDoc.id,
        inviteCode: code,
      },
    });

    logger.info('Invite code redeemed', {
      code,
      spaceId,
      userId,
      inviteId: inviteDoc.id,
      endpoint: '/api/spaces/invite/[code]/redeem',
    });

    return respond.success({
      success: true,
      message: 'Successfully joined the space',
      spaceId,
    });
  } catch (error) {
    logger.error('Failed to redeem invite code', {
      error: error instanceof Error ? error.message : String(error),
      code,
      userId,
      endpoint: '/api/spaces/invite/[code]/redeem',
    });
    return respond.error('Failed to join space', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});
