import { FieldValue } from 'firebase-admin/firestore';
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin as db } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';
import { createNotification } from '@/lib/notification-service';

/**
 * POST /api/profile/[userId]/follow
 * Follow a user
 */
export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ userId: string }> },
  respond
) => {
  const currentUserId = getUserId(request as AuthenticatedRequest);
  const { userId: targetUserId } = await params;

  // Can't follow yourself
  if (targetUserId === currentUserId) {
    return respond.error('Cannot follow yourself', 'CANNOT_FOLLOW_SELF', { status: 400 });
  }

  // Check if target user exists
  const targetUserDoc = await db.collection('users').doc(targetUserId).get();
  if (!targetUserDoc.exists) {
    return respond.error('User not found', 'USER_NOT_FOUND', { status: 404 });
  }

  // Create ordered connection ID for consistency
  const [id1, id2] = [currentUserId, targetUserId].sort();
  const connectionId = `conn_${id1}_${id2}`;

  // Check for existing connection
  const connectionDoc = await db.collection('connections').doc(connectionId).get();

  if (connectionDoc.exists) {
    const connectionData = connectionDoc.data();

    // Already following
    if (connectionData?.type === 'following' && connectionData?.requestedBy === currentUserId) {
      return respond.error('Already following this user', 'ALREADY_FOLLOWING', { status: 400 });
    }

    // If they follow us, upgrade to mutual (friend)
    if (connectionData?.type === 'following' && connectionData?.requestedBy === targetUserId) {
      await db.collection('connections').doc(connectionId).update({
        type: 'friend',
        acceptedBy: currentUserId,
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update both users' counts
      const batch = db.batch();
      batch.update(db.collection('users').doc(currentUserId), {
        followingCount: FieldValue.increment(1),
        connectionCount: FieldValue.increment(1),
      });
      batch.update(db.collection('users').doc(targetUserId), {
        followerCount: FieldValue.increment(1),
        connectionCount: FieldValue.increment(1),
      });
      await batch.commit();

      // Notify both users about the mutual connection
      const currentUserDoc = await db.collection('users').doc(currentUserId).get();
      const currentUserData = currentUserDoc.data();
      const currentHandle = currentUserData?.handle || currentUserData?.fullName || 'Someone';
      const targetUserData = targetUserDoc.data();
      const targetHandle = targetUserData?.handle || targetUserData?.fullName || 'Someone';

      createNotification({
        userId: targetUserId,
        type: 'connection_new',
        category: 'connections',
        title: `${currentHandle} followed you back`,
        body: 'You\'re now mutual friends!',
        actionUrl: `/u/${currentHandle}`,
        metadata: { actorId: currentUserId, actorName: currentHandle },
      }).catch(() => {});

      createNotification({
        userId: currentUserId,
        type: 'connection_new',
        category: 'connections',
        title: `You and ${targetHandle} are now mutual friends!`,
        actionUrl: `/u/${targetHandle}`,
        metadata: { actorId: targetUserId, actorName: targetHandle },
      }).catch(() => {});

      return respond.success({
        type: 'friend',
        message: 'You are now mutual friends!',
      });
    }

    // Already friends or other connection type
    if (connectionData?.type === 'friend') {
      return respond.error('Already connected with this user', 'ALREADY_CONNECTED', { status: 400 });
    }

    // Blocked
    if (connectionData?.type === 'blocked') {
      return respond.error('Cannot follow this user', 'USER_BLOCKED', { status: 403 });
    }
  }

  // Create new following connection
  await db.collection('connections').doc(connectionId).set({
    connectionId,
    profileId1: id1,
    profileId2: id2,
    type: 'following',
    source: 'profile',
    requestedBy: currentUserId,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    mutualSpaces: [],
    interactionCount: 0,
  });

  // Update follower/following counts
  const batch = db.batch();
  batch.update(db.collection('users').doc(currentUserId), {
    followingCount: FieldValue.increment(1),
  });
  batch.update(db.collection('users').doc(targetUserId), {
    followerCount: FieldValue.increment(1),
  });
  await batch.commit();

  // Notify the target user about the new follow
  const currentUserDoc = await db.collection('users').doc(currentUserId).get();
  const currentUserData = currentUserDoc.data();
  const currentHandle = currentUserData?.handle || currentUserData?.fullName || 'Someone';

  createNotification({
    userId: targetUserId,
    type: 'connection_new',
    category: 'connections',
    title: `${currentHandle} started following you`,
    actionUrl: `/u/${currentHandle}`,
    metadata: { actorId: currentUserId, actorName: currentHandle },
  }).catch(() => {});

  return respond.success({
    type: 'following',
    message: 'Now following this user',
  });
});

/**
 * DELETE /api/profile/[userId]/follow
 * Unfollow a user
 */
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ userId: string }> },
  respond
) => {
  const currentUserId = getUserId(request as AuthenticatedRequest);
  const { userId: targetUserId } = await params;

  // Create ordered connection ID
  const [id1, id2] = [currentUserId, targetUserId].sort();
  const connectionId = `conn_${id1}_${id2}`;

  const connectionDoc = await db.collection('connections').doc(connectionId).get();

  if (!connectionDoc.exists) {
    return respond.error('Not following this user', 'NOT_FOLLOWING', { status: 400 });
  }

  const connectionData = connectionDoc.data();

  // Handle mutual connection (friend) - downgrade to follower
  if (connectionData?.type === 'friend') {
    await db.collection('connections').doc(connectionId).update({
      type: 'following',
      requestedBy: targetUserId, // They are now following us
      acceptedBy: null,
      acceptedAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Update counts
    const batch = db.batch();
    batch.update(db.collection('users').doc(currentUserId), {
      followingCount: FieldValue.increment(-1),
      connectionCount: FieldValue.increment(-1),
    });
    batch.update(db.collection('users').doc(targetUserId), {
      followerCount: FieldValue.increment(-1),
      connectionCount: FieldValue.increment(-1),
    });
    await batch.commit();

    return respond.success({
      message: 'Unfollowed user',
    });
  }

  // Handle one-way follow
  if (connectionData?.type === 'following' && connectionData?.requestedBy === currentUserId) {
    await db.collection('connections').doc(connectionId).delete();

    // Update counts
    const batch = db.batch();
    batch.update(db.collection('users').doc(currentUserId), {
      followingCount: FieldValue.increment(-1),
    });
    batch.update(db.collection('users').doc(targetUserId), {
      followerCount: FieldValue.increment(-1),
    });
    await batch.commit();

    return respond.success({
      message: 'Unfollowed user',
    });
  }

  return respond.error('Not following this user', 'NOT_FOLLOWING', { status: 400 });
});

/**
 * GET /api/profile/[userId]/follow
 * Check follow status
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ userId: string }> },
  respond
) => {
  const currentUserId = getUserId(request as AuthenticatedRequest);
  const { userId: targetUserId } = await params;

  if (targetUserId === currentUserId) {
    return respond.success({
      isFollowing: false,
      isFollower: false,
      isMutual: false,
      isSelf: true,
    });
  }

  const [id1, id2] = [currentUserId, targetUserId].sort();
  const connectionId = `conn_${id1}_${id2}`;

  const connectionDoc = await db.collection('connections').doc(connectionId).get();

  if (!connectionDoc.exists) {
    return respond.success({
      isFollowing: false,
      isFollower: false,
      isMutual: false,
      isSelf: false,
    });
  }

  const data = connectionDoc.data();
  const isFollowing =
    (data?.type === 'following' && data?.requestedBy === currentUserId) ||
    data?.type === 'friend';
  const isFollower =
    (data?.type === 'following' && data?.requestedBy === targetUserId) ||
    data?.type === 'friend';

  return respond.success({
    isFollowing,
    isFollower,
    isMutual: data?.type === 'friend',
    isSelf: false,
    connectionType: data?.type,
  });
});

export const GET = withCache(_GET, 'SHORT');
