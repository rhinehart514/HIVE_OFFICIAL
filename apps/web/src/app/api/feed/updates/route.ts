import { z } from 'zod';
import { logger } from "@/lib/logger";
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId } from "@/lib/middleware";

// =============================================================================
// Inlined Feed Functions (previously from @/lib/real-time-feed)
// =============================================================================

interface FeedUpdate {
  hasNewPosts: boolean;
  newPostCount: number;
  lastPostAt: string | null;
  lastCheckedAt: string;
}

/**
 * Get feed updates for a user
 */
async function getFeedUpdates(userId: string, campusId: string): Promise<FeedUpdate | null> {
  try {
    // Get user's spaces
    const membershipsSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .where('campusId', '==', campusId)
      .get();

    if (membershipsSnapshot.empty) {
      return null;
    }

    const spaceIds = membershipsSnapshot.docs.map(doc => doc.data().spaceId);

    // Get user's last viewed timestamp
    const userFeedStateDoc = await dbAdmin
      .collection('userFeedState')
      .doc(userId)
      .get();

    const lastViewedAt = userFeedStateDoc.exists
      ? (userFeedStateDoc.data()?.lastViewedAt || new Date(0).toISOString())
      : new Date(0).toISOString();

    // Count new posts since last viewed
    let newPostCount = 0;
    let lastPostAt: string | null = null;

    // Query posts in batches (Firestore 'in' query limit is 10)
    const batches: string[][] = [];
    for (let i = 0; i < spaceIds.length; i += 10) {
      batches.push(spaceIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      const postsSnapshot = await dbAdmin
        .collection('posts')
        .where('spaceId', 'in', batch)
        .where('createdAt', '>', lastViewedAt)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      newPostCount += postsSnapshot.size;

      if (postsSnapshot.docs.length > 0 && !lastPostAt) {
        lastPostAt = postsSnapshot.docs[0].data().createdAt;
      }
    }

    return {
      hasNewPosts: newPostCount > 0,
      newPostCount,
      lastPostAt,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error getting feed updates', { userId, error });
    return null;
  }
}

/**
 * Mark feed items as viewed
 */
async function markFeedAsViewed(userId: string, itemIds: string[]): Promise<void> {
  const batch = dbAdmin.batch();

  // Update user's last viewed timestamp
  const userFeedStateRef = dbAdmin.collection('userFeedState').doc(userId);
  batch.set(
    userFeedStateRef,
    {
      lastViewedAt: new Date().toISOString(),
      lastViewedItemIds: itemIds.slice(0, 20), // Keep last 20
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // Mark individual items as viewed
  for (const itemId of itemIds.slice(0, 50)) {
    const viewedRef = dbAdmin
      .collection('userFeedViews')
      .doc(`${userId}_${itemId}`);
    batch.set(viewedRef, {
      userId,
      itemId,
      viewedAt: new Date().toISOString(),
    });
  }

  await batch.commit();
}

/**
 * Force refresh feed cache for a user
 */
async function refreshFeedCache(userId: string, campusId: string): Promise<FeedUpdate | null> {
  try {
    // Clear any cached state and re-fetch
    await dbAdmin.collection('userFeedState').doc(userId).delete();
    return await getFeedUpdates(userId, campusId);
  } catch (error) {
    logger.error('Error refreshing feed cache', { userId, error });
    return null;
  }
}

// Real-time feed update schema
const FeedUpdateQuerySchema = z.object({
  action: z.enum(['check', 'mark_viewed', 'force_refresh']).default('check'),
  itemIds: z.string().optional(), // Comma-separated for mark_viewed
});

/**
 * Real-time Feed Updates API
 *
 * GET ?action=check - Check for new feed updates
 * GET ?action=force_refresh - Force refresh feed cache
 */
export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const { action } = FeedUpdateQuerySchema.parse(queryParams);

  logger.info('Feed update request', { action, userId, endpoint: '/api/feed/updates' });

  switch (action) {
    case 'check': {
      const updates = await getFeedUpdates(userId, campusId);

      return respond.success({
        hasUpdates: updates !== null,
        update: updates,
        timestamp: new Date().toISOString()
      });
    }

    case 'force_refresh': {
      const refreshResult = await refreshFeedCache(userId, campusId);

      return respond.success({
        update: refreshResult,
        message: 'Feed cache refreshed',
        timestamp: new Date().toISOString()
      });
    }

    default:
      return respond.error("Invalid action for GET request", "INVALID_INPUT", { status: 400 });
  }
});

/**
 * POST ?action=mark_viewed - Mark items as viewed
 * POST ?action=force_refresh - Force refresh feed cache
 */
export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const { action, itemIds } = FeedUpdateQuerySchema.parse(queryParams);

  logger.info('Feed POST request', { action, userId, endpoint: '/api/feed/updates' });

  switch (action) {
    case 'mark_viewed': {
      if (!itemIds) {
        return respond.error("itemIds parameter required for mark_viewed action", "INVALID_INPUT", { status: 400 });
      }

      const itemIdArray = itemIds.split(',').map(id => id.trim()).filter(Boolean);

      if (itemIdArray.length === 0) {
        return respond.error("At least one valid itemId required", "INVALID_INPUT", { status: 400 });
      }

      await markFeedAsViewed(userId, itemIdArray);

      return respond.success({
        message: `Marked ${itemIdArray.length} items as viewed`,
        itemIds: itemIdArray,
        timestamp: new Date().toISOString()
      });
    }

    case 'force_refresh': {
      const refreshResult = await refreshFeedCache(userId, campusId);

      return respond.success({
        update: refreshResult,
        message: 'Feed cache refreshed',
        timestamp: new Date().toISOString()
      });
    }

    default:
      return respond.error("Invalid action for POST request", "INVALID_INPUT", { status: 400 });
  }
});
