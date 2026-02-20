import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/profile/connections
 * Returns the authenticated user's connections/friends list.
 * Checks both `connections` and `friends` collections.
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  // Query connections collection (both directions)
  const [connAsUser, connAsConnected, friendsAsUser, friendsAsFriend] = await Promise.all([
    dbAdmin.collection('connections')
      .where('userId', '==', userId)
      .get(),
    dbAdmin.collection('connections')
      .where('connectedUserId', '==', userId)
      .get(),
    dbAdmin.collection('friends')
      .where('userId', '==', userId)
      .get(),
    dbAdmin.collection('friends')
      .where('friendId', '==', userId)
      .get(),
  ]);

  // Also check the profileId1/profileId2 pattern used elsewhere
  const [connAsProfile1, connAsProfile2] = await Promise.all([
    dbAdmin.collection('connections')
      .where('profileId1', '==', userId)
      .where('isActive', '==', true)
      .get(),
    dbAdmin.collection('connections')
      .where('profileId2', '==', userId)
      .where('isActive', '==', true)
      .get(),
  ]);

  interface ConnectionItem {
    id: string;
    userId: string;
    status: string;
    type: string;
    source: string;
    createdAt: string;
  }

  const connectionsMap = new Map<string, ConnectionItem>();

  // Process connections (userId/connectedUserId pattern)
  for (const doc of connAsUser.docs) {
    const data = doc.data();
    const otherId = data.connectedUserId as string;
    if (otherId && !connectionsMap.has(otherId)) {
      connectionsMap.set(otherId, {
        id: doc.id,
        userId: otherId,
        status: (data.status as string) || 'accepted',
        type: (data.type as string) || 'connection',
        source: 'connections',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ||
          (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      });
    }
  }

  for (const doc of connAsConnected.docs) {
    const data = doc.data();
    const otherId = data.userId as string;
    if (otherId && !connectionsMap.has(otherId)) {
      connectionsMap.set(otherId, {
        id: doc.id,
        userId: otherId,
        status: (data.status as string) || 'accepted',
        type: (data.type as string) || 'connection',
        source: 'connections',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ||
          (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      });
    }
  }

  // Process connections (profileId1/profileId2 pattern)
  for (const doc of connAsProfile1.docs) {
    const data = doc.data();
    const otherId = data.profileId2 as string;
    if (otherId && !connectionsMap.has(otherId)) {
      connectionsMap.set(otherId, {
        id: doc.id,
        userId: otherId,
        status: (data.status as string) || 'accepted',
        type: (data.type as string) || 'friend',
        source: 'connections',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ||
          (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      });
    }
  }

  for (const doc of connAsProfile2.docs) {
    const data = doc.data();
    const otherId = data.profileId1 as string;
    if (otherId && !connectionsMap.has(otherId)) {
      connectionsMap.set(otherId, {
        id: doc.id,
        userId: otherId,
        status: (data.status as string) || 'accepted',
        type: (data.type as string) || 'friend',
        source: 'connections',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ||
          (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      });
    }
  }

  // Process friends collection
  for (const doc of friendsAsUser.docs) {
    const data = doc.data();
    const otherId = data.friendId as string;
    if (otherId && !connectionsMap.has(otherId)) {
      connectionsMap.set(otherId, {
        id: doc.id,
        userId: otherId,
        status: (data.status as string) || 'accepted',
        type: 'friend',
        source: 'friends',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ||
          (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      });
    }
  }

  for (const doc of friendsAsFriend.docs) {
    const data = doc.data();
    const otherId = data.userId as string;
    if (otherId && !connectionsMap.has(otherId)) {
      connectionsMap.set(otherId, {
        id: doc.id,
        userId: otherId,
        status: (data.status as string) || 'accepted',
        type: 'friend',
        source: 'friends',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ||
          (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      });
    }
  }

  const connections = Array.from(connectionsMap.values());
  const accepted = connections.filter(c => c.status === 'accepted');
  const pending = connections.filter(c => c.status === 'pending');

  return respond.success({
    connections,
    accepted,
    pending,
    totalCount: connections.length,
    acceptedCount: accepted.length,
    pendingCount: pending.length,
  });
});

export const GET = withCache(_GET, 'SHORT');
