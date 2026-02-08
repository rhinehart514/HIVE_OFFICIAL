import { type NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';

/**
 * /api/spaces/live
 *
 * Returns spaces with active presence across all user's memberships.
 * Used by HQ dashboard to show "Live Now" section.
 *
 * Aggregates presence data to show:
 * - Which spaces have active users right now
 * - How many people are online
 * - What event/activity is happening (if any)
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

// Presence timeout - users are considered "online" if seen within this window
const PRESENCE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        ApiResponseHelper.error('Unauthorized', 'UNAUTHORIZED'),
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    // Get user's space memberships
    const membershipsSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', user.uid)
      .where('isActive', '==', true)
      .get();

    if (membershipsSnapshot.empty) {
      return NextResponse.json({
        spaces: [],
        count: 0,
      });
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

      // Skip the current user
      if (presence.userId === user.uid) continue;

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

    // Also check userPresence collection for users who have context.spaceId set
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
      if (presence.userId === user.uid) continue;

      // Check privacy settings
      if (presence.settings?.invisibleMode || !presence.settings?.showOnlineStatus) continue;

      if (!spacePresenceMap.has(spaceId)) {
        spacePresenceMap.set(spaceId, { users: [], lastActivity: new Date(0) });
      }

      const spaceData = spacePresenceMap.get(spaceId)!;

      // Avoid duplicates
      if (spaceData.users.some(u => u.userId === presence.userId)) continue;

      spaceData.users.push({
        userId: presence.userId,
        userName: presence.userName || 'Unknown',
        avatarUrl: undefined, // Could fetch from profiles if needed
      });

      const lastSeen = new Date(presence.metadata?.lastActivityUpdate || presence.lastSeen);
      if (lastSeen > spaceData.lastActivity) {
        spaceData.lastActivity = lastSeen;
      }
    }

    // Check for active events in these spaces
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
      // Only use first active event per space
      if (!spaceEventMap.has(event.spaceId)) {
        spaceEventMap.set(event.spaceId, event.title);
      }
    });

    // Build live spaces array
    const liveSpaces: LiveSpace[] = [];

    for (const [spaceId, presenceData] of spacePresenceMap) {
      // Only include spaces with at least 1 other person online
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
        activeUsers: presenceData.users.slice(0, 5), // Show up to 5 avatars
        lastActivity: presenceData.lastActivity.toISOString(),
      });
    }

    // Sort by participant count (most active first)
    liveSpaces.sort((a, b) => b.participantCount - a.participantCount);

    return NextResponse.json({
      spaces: liveSpaces.slice(0, 10), // Cap at 10 live spaces
      count: liveSpaces.length,
    });
  } catch (error) {
    logger.error('Error fetching live spaces', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      ApiResponseHelper.error('Failed to fetch live spaces', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
