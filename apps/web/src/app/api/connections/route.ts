import { dbAdmin as db } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId } from '@/lib/middleware';

interface ConnectionData {
  connectionId: string;
  profileId1: string;
  profileId2: string;
  type: 'friend' | 'following' | 'follower' | 'pending' | 'blocked';
  source: string;
  requestedBy?: string;
  acceptedBy?: string;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  mutualSpaces?: string[];
  interactionCount?: number;
}

interface ProfileData {
  id: string;
  handle?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  bio?: string;
  major?: string;
  graduationYear?: number;
}

/**
 * GET /api/connections
 * Get current user's connections with optional filters
 *
 * Query params:
 * - type: 'all' | 'friends' | 'following' | 'followers' | 'pending'
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  // Get all connections where user is involved (both directions)
  const [asId1Snapshot, asId2Snapshot] = await Promise.all([
    db.collection('connections')
      .where('profileId1', '==', userId)
      .where('isActive', '==', true)
      .get(),
    db.collection('connections')
      .where('profileId2', '==', userId)
      .where('isActive', '==', true)
      .get(),
  ]);

  // Combine and deduplicate connections
  const connectionsMap = new Map<string, ConnectionData>();

  asId1Snapshot.docs.forEach(doc => {
    const data = doc.data() as ConnectionData;
    connectionsMap.set(doc.id, data);
  });

  asId2Snapshot.docs.forEach(doc => {
    const data = doc.data() as ConnectionData;
    connectionsMap.set(doc.id, data);
  });

  let connections = Array.from(connectionsMap.values());

  // Filter by type
  if (type === 'friends') {
    connections = connections.filter(c => c.type === 'friend');
  } else if (type === 'following') {
    connections = connections.filter(c =>
      c.type === 'following' && c.requestedBy === userId
    );
  } else if (type === 'followers') {
    connections = connections.filter(c =>
      c.type === 'following' && c.requestedBy !== userId
    );
  } else if (type === 'pending') {
    connections = connections.filter(c => c.type === 'pending');
  }

  // Get unique profile IDs to fetch
  const profileIds = new Set<string>();
  connections.forEach(conn => {
    const otherId = conn.profileId1 === userId ? conn.profileId2 : conn.profileId1;
    profileIds.add(otherId);
  });

  // Fetch profile data for connections
  const profiles = new Map<string, ProfileData>();
  const profileIdsArray = Array.from(profileIds);

  // Batch fetch profiles (Firestore limit is 10 for 'in' queries)
  for (let i = 0; i < profileIdsArray.length; i += 10) {
    const batch = profileIdsArray.slice(i, i + 10);
    if (batch.length > 0) {
      const profilesSnapshot = await db.collection('users')
        .where('__name__', 'in', batch)
        .get();

      profilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        profiles.set(doc.id, {
          id: doc.id,
          handle: data.handle,
          firstName: data.firstName,
          lastName: data.lastName,
          profilePhoto: data.profilePhoto,
          bio: data.bio,
          major: data.major,
          graduationYear: data.graduationYear,
        });
      });
    }
  }

  // Build response with profile data
  const result = connections
    .map(conn => {
      const otherId = conn.profileId1 === userId ? conn.profileId2 : conn.profileId1;
      const profile = profiles.get(otherId);

      // Determine relationship type from current user's perspective
      let relationship: 'friend' | 'following' | 'follower' | 'pending' = 'following';
      if (conn.type === 'friend') {
        relationship = 'friend';
      } else if (conn.type === 'following') {
        relationship = conn.requestedBy === userId ? 'following' : 'follower';
      } else if (conn.type === 'pending') {
        relationship = 'pending';
      }

      return {
        connectionId: conn.connectionId,
        relationship,
        profile,
        source: conn.source,
        mutualSpaces: conn.mutualSpaces || [],
        interactionCount: conn.interactionCount || 0,
        createdAt: conn.createdAt?.toDate?.()?.toISOString() || null,
      };
    })
    .filter(c => c.profile) // Only include connections with valid profiles
    .sort((a, b) => {
      // Sort friends first, then by creation date
      if (a.relationship === 'friend' && b.relationship !== 'friend') return -1;
      if (b.relationship === 'friend' && a.relationship !== 'friend') return 1;
      return 0;
    })
    .slice(offset, offset + limit);

  // Calculate stats
  const allConnections = Array.from(connectionsMap.values());
  const stats = {
    totalConnections: allConnections.length,
    friends: allConnections.filter(c => c.type === 'friend').length,
    following: allConnections.filter(c => c.type === 'following' && c.requestedBy === userId).length,
    followers: allConnections.filter(c => c.type === 'following' && c.requestedBy !== userId).length,
    pending: allConnections.filter(c => c.type === 'pending').length,
  };

  return respond.success({
    data: result,
    stats,
    pagination: {
      total: connections.length,
      limit,
      offset,
      hasMore: offset + limit < connections.length,
    },
  });
});
