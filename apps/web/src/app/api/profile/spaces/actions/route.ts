import { type NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { logger } from "@/lib/logger";
import { addSecureCampusMetadata } from "@/lib/secure-firebase-queries";
import { getServerProfileRepository } from '@hive/core/server';
import { withCache } from '../../../../../lib/cache-headers';

// Space quick actions for profile
interface SpaceQuickAction {
  type: 'favorite' | 'mute' | 'pin' | 'archive' | 'leave' | 'request_builder';
  spaceId: string;
  value?: unknown;
  metadata?: Record<string, unknown>;
}

// POST - Perform quick action on space
export const POST = withAuthAndErrors(async (request: NextRequest, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  const body = await request.json();
  const { type, spaceId, value, metadata } = body;

  if (!type || !spaceId) {
    return respond.error("Missing required fields", "INVALID_INPUT", { status: 400 });
  }

  // Validate action type
  const validActions = ['favorite', 'mute', 'pin', 'archive', 'leave', 'request_builder'];
  if (!validActions.includes(type)) {
    return respond.error("Invalid action type", "INVALID_INPUT", { status: 400 });
  }

  // Verify user is a member of the space
  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('spaceId', '==', spaceId)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();
  if (membershipSnapshot.empty) {
    return respond.error("Not a member of this space", "FORBIDDEN", { status: 403 });
  }

  const membershipDoc = membershipSnapshot.docs[0];
  const membershipData = membershipDoc.data();

  // Enforce campus isolation for space actions
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  if (!spaceDoc.exists || (spaceDoc.data()?.campusId !== campusId)) {
    return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
  }

  // Perform the action
  const result = await performSpaceAction(
    userId,
    spaceId,
    campusId,
    type as SpaceQuickAction['type'],
    value,
    metadata,
    membershipDoc.ref,
    membershipData
  );

  return respond.success({
    success: true,
    action: type,
    spaceId,
    result
  });
});

// Helper function to perform space actions
async function performSpaceAction(
  userId: string,
  spaceId: string,
  campusId: string,
  type: SpaceQuickAction['type'],
  value: unknown,
  metadata: Record<string, unknown> | undefined,
  membershipRef: admin.firestore.DocumentReference,
  membershipData: Record<string, unknown>
) {
  const firestoreNow = admin.firestore.FieldValue.serverTimestamp();
  const isoNow = new Date().toISOString();

  switch (type) {
    case 'favorite': {
      // Toggle favorite status
      const isFavorite = value !== undefined ? value : !membershipData.isFavorite;
      await membershipRef.update({
        isFavorite,
        updatedAt: firestoreNow
      });

      // Update user's profile preferences
      await updateUserSpacePreferences(userId, spaceId, 'favorite', isFavorite);

      return { isFavorite };
    }

    case 'mute': {
      // Toggle mute status
      const isMuted = value !== undefined ? value : !membershipData.isMuted;
      const duration = typeof metadata?.duration === 'number' ? metadata.duration : 0;
      await membershipRef.update({
        isMuted,
        muteUntil: isMuted && duration > 0
          ? new Date(Date.now() + duration * 60000).toISOString()
          : null,
        updatedAt: firestoreNow
      });

      return {
        isMuted,
        muteUntil: isMuted && duration > 0
          ? new Date(Date.now() + duration * 60000).toISOString()
          : null,
      };
    }

    case 'pin': {
      // Toggle pin status
      const isPinned = value !== undefined ? value : !membershipData.isPinned;
      await membershipRef.update({
        isPinned,
        pinnedAt: isPinned ? isoNow : null,
        updatedAt: firestoreNow
      });

      return { isPinned };
    }

    case 'archive': {
      // Archive/unarchive space membership
      const isArchived = value !== undefined ? value : !membershipData.isArchived;
      await membershipRef.update({
        isArchived,
        archivedAt: isArchived ? isoNow : null,
        status: isArchived ? 'archived' : 'active',
        updatedAt: firestoreNow
      });

      return { isArchived };
    }

    case 'leave': {
      // Leave space
      await membershipRef.update({
        isActive: false,
        status: 'inactive',
        leftAt: firestoreNow,
        updatedAt: firestoreNow
      });

      // Update space member count
      await updateSpaceMemberCount(spaceId, -1);

      // Sync with DDD profile aggregate
      try {
        const profileRepository = getServerProfileRepository();
        const profileResult = await profileRepository.findById(userId);
        if (profileResult.isSuccess) {
          const profile = profileResult.getValue();
          profile.leaveSpace(spaceId);
          await profileRepository.save(profile);
          logger.debug('DDD profile synced after leaving space', { userId, spaceId });
        }
      } catch (dddError) {
        // Non-fatal: log but don't fail the action
        logger.warn('Failed to sync DDD profile after leaving space', {
          userId,
          spaceId,
          error: dddError instanceof Error ? dddError.message : String(dddError)
        });
      }

      return { hasLeft: true };
    }

    case 'request_builder': {
      // Request builder status
      const requestData = {
        userId,
        spaceId,
        campusId,
        requestType: 'builder',
        reason: metadata?.reason || '',
        experience: metadata?.experience || '',
        status: 'pending',
        requestedAt: isoNow
      };

      const requestRef = await dbAdmin
        .collection('builderRequests')
        .add(addSecureCampusMetadata(requestData));

      // Update membership with pending request
      await membershipRef.update({
        hasBuilderRequest: true,
        builderRequestId: requestRef.id,
        updatedAt: firestoreNow
      });

      return {
        requestId: requestRef.id,
        requestStatus: 'pending'
      };
    }

    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

// Helper function to update user space preferences
async function updateUserSpacePreferences(userId: string, spaceId: string, preferenceType: string, value: unknown) {
  try {
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    if (!userData) {
      throw new Error('User data not found');
    }
    const spacePreferences = userData.spacePreferences || {};

    if (!spacePreferences[spaceId]) {
      spacePreferences[spaceId] = {};
    }

    spacePreferences[spaceId][preferenceType] = value;
    spacePreferences[spaceId].updatedAt = new Date().toISOString();

    await dbAdmin.collection('users').doc(userId).update({
      spacePreferences,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    logger.error(
      `Error updating user space preferences at /api/profile/spaces/actions`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Helper function to update space member count
async function updateSpaceMemberCount(spaceId: string, change: number) {
  try {
    await dbAdmin.collection('spaces').doc(spaceId).update({
      'metrics.memberCount': admin.firestore.FieldValue.increment(change),
      'metrics.activeMembers': admin.firestore.FieldValue.increment(change),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error(
      `Error updating space member count at /api/profile/spaces/actions`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// GET - Get space action status
const _GET = withAuthAndErrors(async (request: NextRequest, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Get membership data
  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('spaceId', '==', spaceId)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();
  if (membershipSnapshot.empty) {
    return respond.error("Not a member of this space", "FORBIDDEN", { status: 403 });
  }

  const membershipData = membershipSnapshot.docs[0].data();
  if (!membershipData) {
    return respond.error("Membership data not found", "INTERNAL_ERROR", { status: 500 });
  }

  // Enforce campus isolation for space
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  if (!spaceDoc.exists || (spaceDoc.data()?.campusId !== campusId)) {
    return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
  }

  // Get builder request status if exists
  let builderRequestStatus = null;
  if (membershipData.hasBuilderRequest) {
    const requestDoc = await dbAdmin.collection('builderRequests').doc(membershipData.builderRequestId).get();
    if (requestDoc.exists) {
      const requestData = requestDoc.data();
      builderRequestStatus = requestData?.status || null;
    }
  }

  // Get DDD profile data for space context
  let dddProfileData: {
    totalSpaces: number;
    isSpaceInProfile: boolean;
  } | null = null;

  try {
    const profileRepository = getServerProfileRepository();
    const profileResult = await profileRepository.findById(userId);
    if (profileResult.isSuccess) {
      const profile = profileResult.getValue();
      dddProfileData = {
        totalSpaces: profile.spaces.length,
        isSpaceInProfile: profile.spaces.includes(spaceId),
      };
    }
  } catch {
    // Non-fatal: continue without DDD data
  }

  return respond.success({
    spaceId,
    actions: {
      isFavorite: membershipData.isFavorite || false,
      isMuted: membershipData.isMuted || false,
      isPinned: membershipData.isPinned || false,
      isArchived: membershipData.isArchived || false,
      hasBuilderRequest: membershipData.hasBuilderRequest || false,
      builderRequestStatus,
      muteUntil: membershipData.muteUntil || null,
    },
    membership: {
      role: membershipData.role,
      status: membershipData.isActive === false ? 'inactive' : 'active',
      joinedAt:
        membershipData.joinedAt?.toDate?.()?.toISOString() ||
        membershipData.joinedAt ||
        null,
      lastActivity:
        membershipData.lastActive?.toDate?.()?.toISOString() ||
        membershipData.lastActive ||
        null,
    },
    profile: dddProfileData,
  });
});

export const GET = withCache(_GET, 'PRIVATE');
