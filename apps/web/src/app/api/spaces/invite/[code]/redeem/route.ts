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
import { notifySpaceJoin } from '@/lib/notification-service';

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

    // Notify space leaders about new member (non-blocking)
    notifySpaceLeadersOfJoin(spaceId, campusId, userId).catch(err => {
      logger.warn('Failed to send space join notifications from invite redeem', {
        error: err instanceof Error ? err.message : String(err),
        spaceId,
        userId,
      });
    });

    // Trigger member_join automations (non-blocking)
    triggerMemberJoinAutomations(spaceId, campusId, userId).catch(err => {
      logger.warn('Failed to trigger member_join automations', {
        error: err instanceof Error ? err.message : String(err),
        spaceId,
        userId,
      });
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

/**
 * Trigger member_join automations for the new member
 * Non-blocking - runs in background
 */
async function triggerMemberJoinAutomations(
  spaceId: string,
  campusId: string,
  userId: string
): Promise<void> {
  // Get user info for interpolation
  const userDoc = await dbAdmin.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const memberName = userData?.fullName || userData?.displayName || 'Member';

  // Find member_join automations
  const automationsSnapshot = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('automations')
    .where('trigger.type', '==', 'member_join')
    .where('enabled', '==', true)
    .get();

  if (automationsSnapshot.empty) return;

  logger.info('Triggering member_join automations from invite redeem', {
    spaceId,
    userId,
    automationCount: automationsSnapshot.size,
  });

  for (const doc of automationsSnapshot.docs) {
    const automation = doc.data();
    try {
      await executeWelcomeAutomation(automation, doc.id, spaceId, campusId, userId, memberName);

      await doc.ref.update({
        'stats.timesTriggered': admin.firestore.FieldValue.increment(1),
        'stats.successCount': admin.firestore.FieldValue.increment(1),
        'stats.lastTriggered': admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('Welcome automation executed from invite', {
        automationId: doc.id,
        automationName: automation.name,
        spaceId,
        newMemberId: userId,
      });
    } catch (error) {
      await doc.ref.update({
        'stats.timesTriggered': admin.firestore.FieldValue.increment(1),
        'stats.failureCount': admin.firestore.FieldValue.increment(1),
        'stats.lastTriggered': admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.error('Welcome automation failed', {
        automationId: doc.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Execute a welcome message automation
 */
async function executeWelcomeAutomation(
  automation: admin.firestore.DocumentData,
  automationId: string,
  spaceId: string,
  campusId: string,
  newMemberId: string,
  memberName: string
): Promise<void> {
  const action = automation.action;

  if (action?.type !== 'send_message') {
    return;
  }

  const config = action.config || {};
  let boardId = config.boardId || 'general';
  let content = config.content || 'Welcome to our space!';

  // Interpolate member variables
  content = content
    .replace(/\{member\}/g, memberName)
    .replace(/\{member\.name\}/g, memberName)
    .replace(/\{member\.id\}/g, newMemberId);

  // Find the target board
  const boardsRef = dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('boards');

  if (boardId === 'general') {
    const generalBoard = await boardsRef
      .where('name', '==', 'General')
      .limit(1)
      .get();

    if (!generalBoard.empty) {
      boardId = generalBoard.docs[0].id;
    } else {
      const anyBoard = await boardsRef.limit(1).get();
      if (!anyBoard.empty) {
        boardId = anyBoard.docs[0].id;
      } else {
        return;
      }
    }
  }

  // Create the welcome message
  const messageRef = boardsRef.doc(boardId).collection('messages').doc();

  await messageRef.set({
    id: messageRef.id,
    spaceId,
    boardId,
    content,
    authorId: 'system',
    authorName: '🤖 HIVE Bot',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    type: 'system',
    metadata: {
      isAutomation: true,
      automationId,
      automationName: automation.name,
      triggerType: 'member_join',
      triggeredBy: newMemberId,
    },
    campusId,
  });
}

/**
 * Notify space leaders when a new member joins via invite code
 */
async function notifySpaceLeadersOfJoin(
  spaceId: string,
  campusId: string,
  userId: string
): Promise<void> {
  // Get user's display name
  const userDoc = await dbAdmin.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const userName = userData?.fullName || userData?.displayName || 'Someone';

  // Get space name
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  const spaceName = spaceDoc.data()?.name || 'a space';

  // Find space leaders/admins to notify
  const leadersSnapshot = await dbAdmin.collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('campusId', '==', campusId)
    .where('role', 'in', ['owner', 'admin', 'leader'])
    .where('isActive', '==', true)
    .get();

  if (leadersSnapshot.empty) return;

  // Notify each leader (notifySpaceJoin already filters out the joining user)
  const notifyPromises = leadersSnapshot.docs.map(doc => {
    const leaderUserId = doc.data().userId;
    return notifySpaceJoin({
      leaderUserId,
      newMemberId: userId,
      newMemberName: userName,
      spaceId,
      spaceName,
    });
  });

  await Promise.all(notifyPromises);

  logger.info('Space leaders notified of invite join', {
    spaceId,
    userId,
    leaderCount: leadersSnapshot.size,
  });
}
