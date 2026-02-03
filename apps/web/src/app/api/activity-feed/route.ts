import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

// ============================================
// TYPES
// ============================================

interface ActivityItem {
  id: string;
  type: 'new_messages' | 'member_joined' | 'event_created' | 'tool_deployed';
  spaceId: string;
  spaceName: string;
  spaceHandle: string;
  actorId?: string;
  actorName?: string;
  count?: number;
  title?: string;
  timestamp: string;
}

// ============================================
// SCHEMA
// ============================================

const ActivityFeedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  since: z.string().optional(),
});

// ============================================
// HANDLER
// ============================================

/**
 * GET /api/activity-feed
 *
 * Returns recent activity across the user's spaces:
 * - New messages (grouped by space, last 24h)
 * - New members who joined
 * - New events created
 * - New tools deployed
 *
 * Activity is sorted by timestamp descending and grouped by time period.
 */
export const GET = withAuthAndErrors(async (
  request: AuthenticatedRequest,
  _context: unknown,
  respond,
) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);
  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const { limit, since } = ActivityFeedQuerySchema.parse(queryParams);

  // Default: activity from last 7 days
  const sinceDate = since
    ? new Date(since)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sinceISO = sinceDate.toISOString();

  // Step 1: Get user's space memberships
  const membershipsSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('campusId', '==', campusId)
    .where('isActive', '==', true)
    .get();

  if (membershipsSnapshot.empty) {
    return respond.success({
      activity: [],
      hasMore: false,
      since: sinceISO,
    });
  }

  const spaceIds = membershipsSnapshot.docs.map(doc => doc.data().spaceId).filter(Boolean);

  if (spaceIds.length === 0) {
    return respond.success({
      activity: [],
      hasMore: false,
      since: sinceISO,
    });
  }

  // Step 2: Fetch space details for names/handles
  const spaceDocsPromises = spaceIds.map(id =>
    dbAdmin.collection('spaces').doc(id).get()
  );
  const spaceDocs = await Promise.all(spaceDocsPromises);
  const spaceMap = new Map<string, { name: string; handle: string }>();
  for (const doc of spaceDocs) {
    if (doc.exists) {
      const data = doc.data()!;
      spaceMap.set(doc.id, {
        name: data.name || 'Unknown Space',
        handle: data.slug || data.handle || doc.id,
      });
    }
  }

  // Step 3: Gather activity in parallel across all spaces
  // Firestore 'in' queries limited to 30 values
  const batches: string[][] = [];
  for (let i = 0; i < spaceIds.length; i += 30) {
    batches.push(spaceIds.slice(i, i + 30));
  }

  const activityItems: ActivityItem[] = [];
  const userCache = new Map<string, string>();

  // Helper: resolve user display name
  const resolveUserName = async (uid: string): Promise<string> => {
    if (userCache.has(uid)) return userCache.get(uid)!;
    try {
      const userDoc = await dbAdmin.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data()!;
        const name = data.displayName || data.fullName || 'Someone';
        userCache.set(uid, name);
        return name;
      }
    } catch {
      // Ignore lookup failures
    }
    userCache.set(uid, 'Someone');
    return 'Someone';
  };

  // 3a: New members who joined spaces
  const memberJoinPromises = batches.map(async (batch) => {
    const snapshot = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', 'in', batch)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .where('joinedAt', '>', sinceISO)
      .orderBy('joinedAt', 'desc')
      .limit(50)
      .get();

    const items: ActivityItem[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Skip the current user's own joins
      if (data.userId === userId) continue;
      const spaceInfo = spaceMap.get(data.spaceId);
      if (!spaceInfo) continue;

      const actorName = await resolveUserName(data.userId);
      const joinedAt = typeof data.joinedAt === 'string'
        ? data.joinedAt
        : data.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString();

      items.push({
        id: `member_${doc.id}`,
        type: 'member_joined',
        spaceId: data.spaceId,
        spaceName: spaceInfo.name,
        spaceHandle: spaceInfo.handle,
        actorId: data.userId,
        actorName,
        timestamp: joinedAt,
      });
    }
    return items;
  });

  // 3b: New events created in spaces
  const eventPromises = batches.map(async (batch) => {
    try {
      const snapshot = await dbAdmin
        .collection('events')
        .where('spaceId', 'in', batch)
        .where('createdAt', '>', sinceISO)
        .orderBy('createdAt', 'desc')
        .limit(30)
        .get();

      const items: ActivityItem[] = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const spaceInfo = spaceMap.get(data.spaceId);
        if (!spaceInfo) continue;

        const creatorName = data.createdBy
          ? await resolveUserName(data.createdBy)
          : undefined;

        const createdAt = typeof data.createdAt === 'string'
          ? data.createdAt
          : data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();

        items.push({
          id: `event_${doc.id}`,
          type: 'event_created',
          spaceId: data.spaceId,
          spaceName: spaceInfo.name,
          spaceHandle: spaceInfo.handle,
          actorId: data.createdBy,
          actorName: creatorName,
          title: data.title,
          timestamp: createdAt,
        });
      }
      return items;
    } catch {
      // Index may not exist yet
      return [];
    }
  });

  // 3c: New messages/posts in spaces (grouped by space)
  const messagePromises = batches.map(async (batch) => {
    const items: ActivityItem[] = [];
    // Check each space individually for recent posts
    for (const spaceId of batch) {
      const spaceInfo = spaceMap.get(spaceId);
      if (!spaceInfo) continue;

      try {
        // Check subcollection posts
        const postsSnapshot = await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('posts')
          .where('createdAt', '>', sinceISO)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        if (!postsSnapshot.empty) {
          // Count total new posts
          const countSnapshot = await dbAdmin
            .collection('spaces')
            .doc(spaceId)
            .collection('posts')
            .where('createdAt', '>', sinceISO)
            .select()
            .get();

          const count = countSnapshot.size;
          if (count > 0) {
            const latestPost = postsSnapshot.docs[0].data();
            const postTimestamp = typeof latestPost.createdAt === 'string'
              ? latestPost.createdAt
              : latestPost.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();

            items.push({
              id: `messages_${spaceId}`,
              type: 'new_messages',
              spaceId,
              spaceName: spaceInfo.name,
              spaceHandle: spaceInfo.handle,
              count,
              timestamp: postTimestamp,
            });
          }
        }
      } catch {
        // Subcollection may not exist
      }
    }
    return items;
  });

  // 3d: Tools deployed to spaces
  const toolPromises = batches.map(async (batch) => {
    const items: ActivityItem[] = [];
    for (const spaceId of batch) {
      const spaceInfo = spaceMap.get(spaceId);
      if (!spaceInfo) continue;

      try {
        // Check space activity subcollection for tool_deployed events
        const activitySnapshot = await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('activity')
          .where('type', '==', 'tool_deployed')
          .where('timestamp', '>', new Date(sinceISO))
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();

        for (const doc of activitySnapshot.docs) {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate?.()?.toISOString()
            || (data.timestamp instanceof Date ? data.timestamp.toISOString() : String(data.timestamp));

          const actorName = data.performedBy
            ? await resolveUserName(data.performedBy)
            : undefined;

          items.push({
            id: `tool_${doc.id}`,
            type: 'tool_deployed',
            spaceId,
            spaceName: spaceInfo.name,
            spaceHandle: spaceInfo.handle,
            actorId: data.performedBy,
            actorName,
            title: data.details?.toolName || data.details?.name || 'a tool',
            timestamp,
          });
        }
      } catch {
        // Activity subcollection may not exist
      }
    }
    return items;
  });

  // Execute all queries in parallel
  const [memberResults, eventResults, messageResults, toolResults] = await Promise.all([
    Promise.all(memberJoinPromises),
    Promise.all(eventPromises),
    Promise.all(messagePromises),
    Promise.all(toolPromises),
  ]);

  activityItems.push(
    ...memberResults.flat(),
    ...eventResults.flat(),
    ...messageResults.flat(),
    ...toolResults.flat(),
  );

  // Sort by timestamp descending
  activityItems.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply limit
  const limited = activityItems.slice(0, limit);
  const hasMore = activityItems.length > limit;

  logger.info('Activity feed fetched', {
    userId,
    totalItems: activityItems.length,
    returnedItems: limited.length,
    endpoint: '/api/activity-feed',
  });

  return respond.success({
    activity: limited,
    hasMore,
    since: sinceISO,
    totalCount: activityItems.length,
  });
});
