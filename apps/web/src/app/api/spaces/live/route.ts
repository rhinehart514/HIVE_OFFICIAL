import { type NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { withCache } from '../../../../lib/cache-headers';

/**
 * /api/spaces/live
 *
 * Returns spaces with active presence across all user's memberships.
 * Used by HQ dashboard to show "Live Now" section.
 */

interface LiveSpace {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  eventName?: string;
  participantCount: number;
  activeUsers: {
    userId: string;
    userName: string;
    avatarUrl?: string;
  }[];
  lastActivity: string;
}

const PRESENCE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const _GET = withAuthAndErrors(async (request: AuthenticatedRequest, _context, respond) => {
  const userId = getUserId(request);

  // Get user's space memberships
  const membershipsSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();

  if (membershipsSnapshot.empty) {
    return respond.success({ spaces: [], count: 0 });
  }

  const spaceIds = membershipsSnapshot.docs.map(doc => doc.data().spaceId);

  // Get space details
  const spacesSnapshot = await dbAdmin
    .collection('spaces')
    .where('__name__', 'in', spaceIds.slice(0, 10))
    .get();

  const spaceMap = new Map<string, { name: string; handle?: string; avatarUrl?: string }>();
  spacesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    spaceMap.set(doc.id, {
      name: data.name,
      handle: data.handle,
      avatarUrl: data.avatarUrl,
    });
  });

  // Get presence data for these spaces
  const presenceThreshold = new Date(Date.now() - PRESENCE_TIMEOUT_MS);

  const presenceSnapshot = await dbAdmin
    .collection('spacePresence')
    .where('spaceId', 'in', spaceIds.slice(0, 10))
    .where('lastSeen', '>=', presenceThreshold)
    .get();

  // Aggregate presence by space
  const spacePresenceMap = new Map<string, {
    users: { userId: string; userName: string; avatarUrl?: string }[];
    lastActivity: Date;
  }>();

  for (const doc of presenceSnapshot.docs) {
    const presence = doc.data();
    const spaceId = presence.spaceId;
    if (presence.userId === userId) continue;

    if (!spacePresenceMap.has(spaceId)) {
      spacePresenceMap.set(spaceId, { users: [], lastActivity: new Date(0) });
    }

    const spaceData = spacePresenceMap.get(spaceId)!;
    spaceData.users.push({
      userId: presence.userId,
      userName: presence.userName || 'Unknown',
      avatarUrl: presence.userAvatarUrl,
    });

    const lastSeen = presence.lastSeen?.toDate?.() || new Date(presence.lastSeen);
    if (lastSeen > spaceData.lastActivity) {
      spaceData.lastActivity = lastSeen;
    }
  }

  // Also check userPresence collection
  const userPresenceSnapshot = await dbAdmin
    .collection('userPresence')
    .where('status', 'in', ['online', 'away', 'busy'])
    .where('metadata.lastActivityUpdate', '>=', presenceThreshold.toISOString())
    .limit(100)
    .get();

  for (const doc of userPresenceSnapshot.docs) {
    const presence = doc.data();
    const spaceId = presence.currentActivity?.context?.spaceId;

    if (!spaceId || !spaceIds.includes(spaceId)) continue;
    if (presence.userId === userId) continue;
    if (presence.settings?.invisibleMode || !presence.settings?.showOnlineStatus) continue;

    if (!spacePresenceMap.has(spaceId)) {
      spacePresenceMap.set(spaceId, { users: [], lastActivity: new Date(0) });
    }

    const spaceData = spacePresenceMap.get(spaceId)!;
    if (spaceData.users.some(u => u.userId === presence.userId)) continue;

    spaceData.users.push({
      userId: presence.userId,
      userName: presence.userName || 'Unknown',
      avatarUrl: undefined,
    });

    const lastSeen = new Date(presence.metadata?.lastActivityUpdate || presence.lastSeen);
    if (lastSeen > spaceData.lastActivity) {
      spaceData.lastActivity = lastSeen;
    }
  }

  // Check for active events
  const now = new Date();
  const activeEventsSnapshot = await dbAdmin
    .collection('events')
    .where('spaceId', 'in', spaceIds.slice(0, 10))
    .where('startDate', '<=', now)
    .where('endDate', '>=', now)
    .limit(20)
    .get();

  const spaceEventMap = new Map<string, string>();
  activeEventsSnapshot.docs.forEach(doc => {
    const event = doc.data();
    if (!spaceEventMap.has(event.spaceId)) {
      spaceEventMap.set(event.spaceId, event.title);
    }
  });

  // Build live spaces array
  const liveSpaces: LiveSpace[] = [];

  for (const [spaceId, presenceData] of spacePresenceMap) {
    if (presenceData.users.length === 0) continue;

    const spaceInfo = spaceMap.get(spaceId);
    if (!spaceInfo) continue;

    liveSpaces.push({
      id: spaceId,
      name: spaceInfo.name,
      handle: spaceInfo.handle,
      avatarUrl: spaceInfo.avatarUrl,
      eventName: spaceEventMap.get(spaceId),
      participantCount: presenceData.users.length,
      activeUsers: presenceData.users.slice(0, 5),
      lastActivity: presenceData.lastActivity.toISOString(),
    });
  }

  liveSpaces.sort((a, b) => b.participantCount - a.participantCount);

  return respond.success({
    spaces: liveSpaces.slice(0, 10),
    count: liveSpaces.length,
  });
});

export const GET = withCache(_GET as (req: NextRequest, ctx: unknown) => Promise<Response>, 'SHORT');
