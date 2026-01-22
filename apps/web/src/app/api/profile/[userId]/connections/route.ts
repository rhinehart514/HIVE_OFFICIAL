import type { NextRequest } from 'next/server';
import { withOptionalAuth, getUser } from '@/lib/middleware';
import { dbAdmin as db } from '@/lib/firebase-admin';

/**
 * GET /api/profile/[userId]/connections
 * Get a user's connections with mutual connections calculation
 *
 * Query params:
 * - type: 'all' | 'friends' | 'mutual' (default: 'all')
 * - limit: number (default 20)
 */
export const GET = withOptionalAuth(async (
  request,
  { params }: { params: Promise<{ userId: string }> },
  respond
) => {
  const user = getUser(request as NextRequest);
  const currentUserId = user?.uid;
  const { userId: targetUserId } = await params;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  // Get target user's connections
  const [targetAsId1, targetAsId2] = await Promise.all([
    db.collection('connections')
      .where('profileId1', '==', targetUserId)
      .where('type', 'in', ['friend', 'following'])
      .where('isActive', '==', true)
      .get(),
    db.collection('connections')
      .where('profileId2', '==', targetUserId)
      .where('type', 'in', ['friend', 'following'])
      .where('isActive', '==', true)
      .get(),
  ]);

  // Extract target user's friend IDs
  const targetFriendIds = new Set<string>();
  [...targetAsId1.docs, ...targetAsId2.docs].forEach(doc => {
    const data = doc.data();
    // Only count friends and people they're following
    if (data.type === 'friend' ||
        (data.type === 'following' && data.requestedBy === targetUserId)) {
      const friendId = data.profileId1 === targetUserId ? data.profileId2 : data.profileId1;
      targetFriendIds.add(friendId);
    }
  });

  let mutualCount = 0;
  let mutualIds: string[] = [];

  // If logged in, calculate mutual connections
  if (currentUserId && currentUserId !== targetUserId) {
    const [currentAsId1, currentAsId2] = await Promise.all([
      db.collection('connections')
        .where('profileId1', '==', currentUserId)
        .where('type', 'in', ['friend', 'following'])
        .where('isActive', '==', true)
        .get(),
      db.collection('connections')
        .where('profileId2', '==', currentUserId)
        .where('type', 'in', ['friend', 'following'])
        .where('isActive', '==', true)
        .get(),
    ]);

    // Extract current user's friend IDs
    const currentFriendIds = new Set<string>();
    [...currentAsId1.docs, ...currentAsId2.docs].forEach(doc => {
      const data = doc.data();
      if (data.type === 'friend' ||
          (data.type === 'following' && data.requestedBy === currentUserId)) {
        const friendId = data.profileId1 === currentUserId ? data.profileId2 : data.profileId1;
        currentFriendIds.add(friendId);
      }
    });

    // Find intersection (mutual connections)
    mutualIds = Array.from(targetFriendIds).filter(id => currentFriendIds.has(id));
    mutualCount = mutualIds.length;
  }

  // If requesting mutual connections only
  if (type === 'mutual' && currentUserId) {
    // Fetch mutual profiles
    const mutualProfiles: {
      id: string;
      handle: string;
      firstName: string;
      lastName: string;
      profilePhoto: string;
      bio: string;
    }[] = [];

    for (let i = 0; i < Math.min(mutualIds.length, limit); i += 10) {
      const batch = mutualIds.slice(i, i + 10);
      if (batch.length > 0) {
        const profilesSnapshot = await db.collection('users')
          .where('__name__', 'in', batch)
          .get();

        profilesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          mutualProfiles.push({
            id: doc.id,
            handle: data.handle,
            firstName: data.firstName,
            lastName: data.lastName,
            profilePhoto: data.profilePhoto,
            bio: data.bio,
          });
        });
      }
    }

    return respond.success({
      mutualConnections: mutualProfiles,
      mutualCount,
      totalConnections: targetFriendIds.size,
    });
  }

  // Return general connection stats
  const friendConnections = [...targetAsId1.docs, ...targetAsId2.docs]
    .filter(doc => doc.data().type === 'friend');

  return respond.success({
    connectionCount: targetFriendIds.size,
    friendCount: friendConnections.length / 2, // Divided by 2 since we query both directions
    mutualCount,
    mutualConnectionIds: mutualIds.slice(0, 5), // First 5 for preview
  });
});
