import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';
import { dbAdmin as db } from '@/lib/firebase-admin';

interface RouteParams {
  params: { userId: string };
}

/**
 * POST /api/profile/[userId]/follow
 * Follow a user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.userId;
    const currentUserId = session.userId;

    // Can't follow yourself
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
        return NextResponse.json(
          { error: 'Already following this user' },
          { status: 400 }
        );
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

        return NextResponse.json({
          success: true,
          type: 'friend',
          message: 'You are now mutual friends!',
        });
      }

      // Already friends or other connection type
      if (connectionData?.type === 'friend') {
        return NextResponse.json(
          { error: 'Already connected with this user' },
          { status: 400 }
        );
      }

      // Blocked
      if (connectionData?.type === 'blocked') {
        return NextResponse.json(
          { error: 'Cannot follow this user' },
          { status: 403 }
        );
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

    return NextResponse.json({
      success: true,
      type: 'following',
      message: 'Now following this user',
    });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/[userId]/follow
 * Unfollow a user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.userId;
    const currentUserId = session.userId;

    // Create ordered connection ID
    const [id1, id2] = [currentUserId, targetUserId].sort();
    const connectionId = `conn_${id1}_${id2}`;

    const connectionDoc = await db.collection('connections').doc(connectionId).get();

    if (!connectionDoc.exists) {
      return NextResponse.json(
        { error: 'Not following this user' },
        { status: 400 }
      );
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

      return NextResponse.json({
        success: true,
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

      return NextResponse.json({
        success: true,
        message: 'Unfollowed user',
      });
    }

    return NextResponse.json(
      { error: 'Not following this user' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/[userId]/follow
 * Check follow status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.userId;
    const currentUserId = session.userId;

    if (targetUserId === currentUserId) {
      return NextResponse.json({
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
      return NextResponse.json({
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

    return NextResponse.json({
      isFollowing,
      isFollower,
      isMutual: data?.type === 'friend',
      isSelf: false,
      connectionType: data?.type,
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
