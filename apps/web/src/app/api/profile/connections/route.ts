import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/profile/connections
 * Returns the authenticated user's connections list from the `connections` collection.
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  // Query connections using canonical schema (profileId1/profileId2, isActive)
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

  // Process connections (canonical profileId1/profileId2 schema)
  // Canonical schema has `type` ('following'|'friend'), not `status`.
  // Since we query isActive:true, all results are active. Map to status for API response.
  for (const doc of connAsProfile1.docs) {
    const data = doc.data();
    const otherId = data.profileId2 as string;
    const connType = (data.type as string) || 'following';
    if (otherId && !connectionsMap.has(otherId)) {
      connectionsMap.set(otherId, {
        id: doc.id,
        userId: otherId,
        status: 'accepted', // isActive:true means accepted
        type: connType,
        source: 'connections',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ||
          (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
      });
    }
  }

  for (const doc of connAsProfile2.docs) {
    const data = doc.data();
    const otherId = data.profileId1 as string;
    const connType = (data.type as string) || 'following';
    if (otherId && !connectionsMap.has(otherId)) {
      connectionsMap.set(otherId, {
        id: doc.id,
        userId: otherId,
        status: 'accepted', // isActive:true means accepted
        type: connType,
        source: 'connections',
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
