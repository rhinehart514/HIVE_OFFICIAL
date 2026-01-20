import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';
import { dbAdmin as db } from '@/lib/firebase-admin';

/**
 * GET /api/friends
 * Get current user's friends (mutual connections)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const includeRequests = searchParams.get('include_requests') === 'true';

    // Get friend connections (mutual)
    const [asId1Snapshot, asId2Snapshot] = await Promise.all([
      db.collection('connections')
        .where('profileId1', '==', userId)
        .where('type', '==', 'friend')
        .where('isActive', '==', true)
        .get(),
      db.collection('connections')
        .where('profileId2', '==', userId)
        .where('type', '==', 'friend')
        .where('isActive', '==', true)
        .get(),
    ]);

    // Combine friends
    const friendIds = new Set<string>();
    const friendConnections: any[] = [];

    [...asId1Snapshot.docs, ...asId2Snapshot.docs].forEach(doc => {
      const data = doc.data();
      const friendId = data.profileId1 === userId ? data.profileId2 : data.profileId1;
      if (!friendIds.has(friendId)) {
        friendIds.add(friendId);
        friendConnections.push({ ...data, friendId });
      }
    });

    // Fetch friend profiles
    const friendProfiles: any[] = [];
    const friendIdsArray = Array.from(friendIds);

    for (let i = 0; i < friendIdsArray.length; i += 10) {
      const batch = friendIdsArray.slice(i, i + 10);
      if (batch.length > 0) {
        const profilesSnapshot = await db.collection('users')
          .where('__name__', 'in', batch)
          .get();

        profilesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const connData = friendConnections.find(c => c.friendId === doc.id);
          friendProfiles.push({
            id: doc.id,
            handle: data.handle,
            firstName: data.firstName,
            lastName: data.lastName,
            profilePhoto: data.profilePhoto,
            bio: data.bio,
            major: data.major,
            connectionDate: connData?.acceptedAt?.toDate?.()?.toISOString() || null,
            mutualSpaces: connData?.mutualSpaces || [],
          });
        });
      }
    }

    const response: any = {
      success: true,
      friends: friendProfiles,
      count: friendProfiles.length,
    };

    // Optionally include pending requests
    if (includeRequests) {
      const [receivedSnapshot, sentSnapshot] = await Promise.all([
        db.collection('connections')
          .where('profileId2', '==', userId)
          .where('type', '==', 'pending')
          .where('isActive', '==', true)
          .get(),
        db.collection('connections')
          .where('profileId1', '==', userId)
          .where('type', '==', 'pending')
          .where('requestedBy', '==', userId)
          .where('isActive', '==', true)
          .get(),
      ]);

      // Also check the reverse direction for received
      const receivedSnapshot2 = await db.collection('connections')
        .where('profileId1', '==', userId)
        .where('type', '==', 'pending')
        .where('requestedBy', '!=', userId)
        .where('isActive', '==', true)
        .get();

      const receivedRequests: any[] = [];
      const sentRequests: any[] = [];

      // Process received requests
      const receivedIds = new Set<string>();
      [...receivedSnapshot.docs, ...receivedSnapshot2.docs].forEach(doc => {
        const data = doc.data();
        const fromId = data.requestedBy;
        if (fromId !== userId && !receivedIds.has(fromId)) {
          receivedIds.add(fromId);
          receivedRequests.push({
            requestId: doc.id,
            fromUserId: fromId,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            message: data.requestMessage || null,
          });
        }
      });

      // Process sent requests
      sentSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const toId = data.profileId1 === userId ? data.profileId2 : data.profileId1;
        sentRequests.push({
          requestId: doc.id,
          toUserId: toId,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          message: data.requestMessage || null,
        });
      });

      response.receivedRequests = receivedRequests;
      response.sentRequests = sentRequests;
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/friends
 * Send a friend request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, message } = body;

    if (!toUserId) {
      return NextResponse.json(
        { error: 'toUserId is required' },
        { status: 400 }
      );
    }

    const currentUserId = session.userId;

    if (toUserId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(toUserId).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create ordered connection ID
    const [id1, id2] = [currentUserId, toUserId].sort();
    const connectionId = `conn_${id1}_${id2}`;

    // Check for existing connection
    const connectionDoc = await db.collection('connections').doc(connectionId).get();

    if (connectionDoc.exists) {
      const data = connectionDoc.data();

      if (data?.type === 'friend') {
        return NextResponse.json(
          { error: 'Already friends with this user' },
          { status: 400 }
        );
      }

      if (data?.type === 'pending') {
        // If they sent us a request, accept it
        if (data?.requestedBy === toUserId) {
          await db.collection('connections').doc(connectionId).update({
            type: 'friend',
            acceptedBy: currentUserId,
            acceptedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Update connection counts
          const batch = db.batch();
          batch.update(db.collection('users').doc(currentUserId), {
            connectionCount: FieldValue.increment(1),
          });
          batch.update(db.collection('users').doc(toUserId), {
            connectionCount: FieldValue.increment(1),
          });
          await batch.commit();

          return NextResponse.json({
            success: true,
            type: 'accepted',
            message: 'Friend request accepted! You are now friends.',
          });
        }

        return NextResponse.json(
          { error: 'Friend request already pending' },
          { status: 400 }
        );
      }

      if (data?.type === 'blocked') {
        return NextResponse.json(
          { error: 'Cannot send friend request to this user' },
          { status: 403 }
        );
      }

      // Upgrade from following to pending friend request
      if (data?.type === 'following') {
        await db.collection('connections').doc(connectionId).update({
          type: 'pending',
          requestedBy: currentUserId,
          requestMessage: message || null,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          type: 'pending',
          message: 'Friend request sent!',
          requestId: connectionId,
        });
      }
    }

    // Create new pending friend request
    await db.collection('connections').doc(connectionId).set({
      connectionId,
      profileId1: id1,
      profileId2: id2,
      type: 'pending',
      source: 'friend_request',
      requestedBy: currentUserId,
      requestMessage: message || null,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      mutualSpaces: [],
      interactionCount: 0,
    });

    return NextResponse.json({
      success: true,
      type: 'pending',
      message: 'Friend request sent!',
      requestId: connectionId,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/friends
 * Accept or reject a friend request
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "reject"' },
        { status: 400 }
      );
    }

    const currentUserId = session.userId;
    const connectionDoc = await db.collection('connections').doc(requestId).get();

    if (!connectionDoc.exists) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    const data = connectionDoc.data();

    if (data?.type !== 'pending') {
      return NextResponse.json(
        { error: 'This is not a pending friend request' },
        { status: 400 }
      );
    }

    // Verify the current user is the recipient (not the sender)
    const isRecipient = data.requestedBy !== currentUserId &&
      (data.profileId1 === currentUserId || data.profileId2 === currentUserId);

    if (!isRecipient) {
      return NextResponse.json(
        { error: 'You cannot respond to this friend request' },
        { status: 403 }
      );
    }

    const senderId = data.requestedBy;

    if (action === 'accept') {
      await db.collection('connections').doc(requestId).update({
        type: 'friend',
        acceptedBy: currentUserId,
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update connection counts
      const batch = db.batch();
      batch.update(db.collection('users').doc(currentUserId), {
        connectionCount: FieldValue.increment(1),
      });
      batch.update(db.collection('users').doc(senderId), {
        connectionCount: FieldValue.increment(1),
      });
      await batch.commit();

      return NextResponse.json({
        success: true,
        message: 'Friend request accepted!',
      });
    } else {
      // Reject - just delete the connection
      await db.collection('connections').doc(requestId).delete();

      return NextResponse.json({
        success: true,
        message: 'Friend request declined',
      });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to respond to friend request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/friends
 * Unfriend a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json(
        { error: 'friendId is required' },
        { status: 400 }
      );
    }

    const currentUserId = session.userId;
    const [id1, id2] = [currentUserId, friendId].sort();
    const connectionId = `conn_${id1}_${id2}`;

    const connectionDoc = await db.collection('connections').doc(connectionId).get();

    if (!connectionDoc.exists) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const data = connectionDoc.data();

    if (data?.type !== 'friend') {
      return NextResponse.json(
        { error: 'You are not friends with this user' },
        { status: 400 }
      );
    }

    // Delete the connection
    await db.collection('connections').doc(connectionId).delete();

    // Update connection counts
    const batch = db.batch();
    batch.update(db.collection('users').doc(currentUserId), {
      connectionCount: FieldValue.increment(-1),
    });
    batch.update(db.collection('users').doc(friendId), {
      connectionCount: FieldValue.increment(-1),
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Unfriended successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to unfriend user' },
      { status: 500 }
    );
  }
}
