import { logger } from "@/lib/logger";
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId } from "@/lib/middleware";

// Feed caching interfaces
interface FeedCache {
  id: string;
  userId: string;
  campusId: string;
  cacheKey: string;
  feedType: 'personal' | 'campus' | 'trending' | 'space_specific';
  content: unknown[];
  metadata: {
    totalItems: number;
    averageQuality: number;
    diversityScore: number;
    toolContentPercentage: number;
    generationTime: number;
    algorithmVersion: string;
  };
  parameters: {
    spaceIds: string[];
    contentTypes: string[];
    timeRange: string;
    qualityThreshold: number;
  };
  createdAt: string;
  expiresAt: string;
  lastAccessed: string;
  accessCount: number;
  isValid: boolean;
}

interface CacheStats {
  hitRate: number;
  averageGenerationTime: number;
  totalCacheSize: number;
  activeCaches: number;
  expiredCaches: number;
  userCacheCount: number;
}

interface _CacheConfig {
  ttl: number; // Time to live in minutes
  maxCacheSize: number; // Maximum items per cache
  enableCompression: boolean;
  enablePrefetching: boolean;
  invalidationStrategy: 'time_based' | 'content_based' | 'hybrid';
  prefetchTriggers: string[];
}

// POST - Get cached feed or generate new cache
export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  const body = await request.json();
  const {
    feedType = 'personal',
    spaceIds = [],
    contentTypes = ['tool_generated', 'tool_enhanced'],
    timeRange = '24h',
    qualityThreshold = 70,
    forceRefresh = false,
    enableCaching = true
  } = body;

  // Generate cache key
  const cacheKey = generateCacheKey({
    userId,
    campusId,
    feedType,
    spaceIds,
    contentTypes,
    timeRange,
    qualityThreshold
  });

  const startTime = Date.now();

  // Try to get cached feed if not forcing refresh
  if (!forceRefresh && enableCaching) {
    const cachedFeed = await getCachedFeed(cacheKey, userId, campusId);
    if (cachedFeed) {
      // Update access stats
      await updateCacheAccess(cachedFeed.id);

      return respond.success({
        content: cachedFeed.content,
        metadata: {
          ...cachedFeed.metadata,
          cached: true,
          cacheAge: Date.now() - new Date(cachedFeed.createdAt).getTime(),
          accessCount: cachedFeed.accessCount + 1
        }
      });
    }
  }

  // Generate new feed content (this would call the aggregation and algorithm APIs)
  const feedContent = await generateFeedContent({
    userId,
    campusId,
    feedType,
    spaceIds,
    contentTypes,
    timeRange,
    qualityThreshold
  });

  const generationTime = Date.now() - startTime;

  // Cache the result if caching is enabled
  if (enableCaching) {
    await cacheFeedContent({
      userId,
      campusId,
      cacheKey,
      feedType,
      content: feedContent.items,
      metadata: {
        ...feedContent.metadata,
        generationTime,
        algorithmVersion: '2.0'
      },
      parameters: {
        spaceIds,
        contentTypes,
        timeRange,
        qualityThreshold
      }
    });
  }

  return respond.success({
    content: feedContent.items,
    metadata: {
      ...feedContent.metadata,
      cached: false,
      generationTime,
      cacheKey: enableCaching ? cacheKey : null
    }
  });
});

// GET - Get cache statistics and management info
export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';
  const cacheKey = searchParams.get('cacheKey');

  switch (action) {
    case 'stats': {
      const stats = await getCacheStats(userId, campusId);
      return respond.success({ stats });
    }

    case 'list': {
      const userCaches = await getUserCaches(userId, campusId);
      return respond.success({ caches: userCaches });
    }

    case 'get': {
      if (!cacheKey) {
        return respond.error("Cache key required", "INVALID_INPUT", { status: 400 });
      }
      const cache = await getCachedFeed(cacheKey, userId, campusId);
      return respond.success({ cache });
    }

    default:
      return respond.error("Invalid action", "INVALID_INPUT", { status: 400 });
  }
});

// DELETE - Clear cache or specific cached items
export const DELETE = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  const { searchParams } = new URL(request.url);
  const cacheKey = searchParams.get('cacheKey');
  const clearAll = searchParams.get('clearAll') === 'true';

  if (clearAll) {
    // Clear all caches for user
    const cleared = await clearUserCaches(userId, campusId);
    return respond.success({
      message: `Cleared ${cleared} cache entries`
    });
  } else if (cacheKey) {
    // Clear specific cache
    const success = await clearSpecificCache(cacheKey, userId, campusId);
    return respond.success({
      cleared: success,
      message: success ? 'Cache cleared' : 'Cache not found or not owned by user'
    });
  } else {
    return respond.error("Cache key or clearAll parameter required", "INVALID_INPUT", { status: 400 });
  }
});

// Helper function to generate cache key
function generateCacheKey(params: {
  userId: string;
  campusId: string;
  feedType: string;
  spaceIds: string[];
  contentTypes: string[];
  timeRange: string;
  qualityThreshold: number;
}): string {
  const { userId, campusId, feedType, spaceIds, contentTypes, timeRange, qualityThreshold } = params;

  const keyData = {
    userId,
    campusId,
    feedType,
    spaceIds: spaceIds.sort(), // Sort for consistent cache keys
    contentTypes: contentTypes.sort(),
    timeRange,
    qualityThreshold
  };

  // Create a hash-like key (simplified for demo)
  const keyString = JSON.stringify(keyData);
  const hash = keyString.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  return `feed_${Math.abs(hash)}_${Date.now().toString(36)}`;
}

// Helper function to get cached feed
async function getCachedFeed(cacheKey: string, userId: string, campusId: string): Promise<FeedCache | null> {
  try {
    const cacheDoc = await dbAdmin.collection('feedCaches').doc(cacheKey).get();

    if (!cacheDoc.exists) {
      return null;
    }

    const cache = { id: cacheDoc.id, ...cacheDoc.data() } as FeedCache;

    // Check if cache belongs to user and campus
    if (cache.userId !== userId || cache.campusId !== campusId) {
      return null;
    }

    // Check if cache is expired
    const now = new Date();
    const expiresAt = new Date(cache.expiresAt);

    if (now > expiresAt || !cache.isValid) {
      // Remove expired cache
      await dbAdmin.collection('feedCaches').doc(cacheKey).delete();
      return null;
    }

    return cache;
  } catch (error) {
    logger.error(
      `Error getting cached feed at /api/feed/cache`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return null;
  }
}

// Helper function to cache feed content
async function cacheFeedContent(params: {
  userId: string;
  campusId: string;
  cacheKey: string;
  feedType: string;
  content: unknown[];
  metadata: Record<string, unknown>;
  parameters: Record<string, unknown>;
}): Promise<void> {
  try {
    const { userId, campusId, cacheKey, feedType, content, metadata, parameters } = params;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes TTL

    const cache: FeedCache = {
      id: cacheKey,
      userId,
      campusId,
      cacheKey,
      feedType: feedType as FeedCache['feedType'],
      content,
      metadata: metadata as FeedCache['metadata'],
      parameters: parameters as FeedCache['parameters'],
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastAccessed: now.toISOString(),
      accessCount: 0,
      isValid: true
    };

    await dbAdmin.collection('feedCaches').doc(cacheKey).set(cache);
  } catch (error) {
    logger.error(
      `Error caching feed content at /api/feed/cache`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Helper function to update cache access
async function updateCacheAccess(cacheId: string): Promise<void> {
  try {
    await dbAdmin.collection('feedCaches').doc(cacheId).update({
      lastAccessed: new Date().toISOString(),
      accessCount: (await dbAdmin.collection('feedCaches').doc(cacheId).get()).data()?.accessCount || 0 + 1
    });
  } catch (error) {
    logger.error(
      `Error updating cache access at /api/feed/cache`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Helper function to generate feed content
// TODO: Wire up FeedAggregationEngine from @/lib/feed-aggregation when feed system is prioritized
async function generateFeedContent(_params: {
  userId: string;
  campusId: string;
  feedType: string;
  spaceIds: string[];
  contentTypes: string[];
  timeRange: string;
  qualityThreshold: number;
}): Promise<{ items: unknown[]; metadata: Record<string, unknown> }> {
  // Return empty feed - real implementation deferred for post-launch
  // See: FeedAggregationEngine in @/lib/feed-aggregation.ts for future integration
  const items: unknown[] = [];

  const metadata = {
    totalItems: 0,
    averageQuality: 0,
    diversityScore: 0,
    toolContentPercentage: 0,
    algorithmVersion: '2.0',
    status: 'feed_deferred'
  };

  return { items, metadata };
}

// Helper function to get cache statistics
async function getCacheStats(userId: string, campusId: string): Promise<CacheStats> {
  try {
    const userCachesSnapshot = await dbAdmin.collection('feedCaches')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .get();
    const userCaches = userCachesSnapshot.docs.map(doc => doc.data() as FeedCache);

    const now = new Date();
    const activeCaches = userCaches.filter(cache =>
      new Date(cache.expiresAt) > now && cache.isValid
    );
    const expiredCaches = userCaches.filter(cache =>
      new Date(cache.expiresAt) <= now || !cache.isValid
    );

    // Calculate hit rate (simplified)
    const totalAccesses = userCaches.reduce((sum, cache) => sum + cache.accessCount, 0);
    const hitRate = userCaches.length > 0 ? (totalAccesses / userCaches.length) : 0;

    // Calculate average generation time
    const avgGenerationTime = userCaches.reduce((sum, cache) =>
      sum + (cache.metadata.generationTime || 0), 0
    ) / (userCaches.length || 1);

    // Calculate total cache size
    const totalCacheSize = userCaches.reduce((sum, cache) =>
      sum + cache.content.length, 0
    );

    return {
      hitRate,
      averageGenerationTime: avgGenerationTime,
      totalCacheSize,
      activeCaches: activeCaches.length,
      expiredCaches: expiredCaches.length,
      userCacheCount: userCaches.length
    };
  } catch (error) {
    logger.error(
      `Error getting cache stats at /api/feed/cache`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return {
      hitRate: 0,
      averageGenerationTime: 0,
      totalCacheSize: 0,
      activeCaches: 0,
      expiredCaches: 0,
      userCacheCount: 0
    };
  }
}

// Helper function to get user caches
async function getUserCaches(userId: string, campusId: string): Promise<FeedCache[]> {
  try {
    const userCachesSnapshot = await dbAdmin.collection('feedCaches')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    return userCachesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FeedCache[];
  } catch (error) {
    logger.error(
      `Error getting user caches at /api/feed/cache`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return [];
  }
}

// Helper function to clear user caches
async function clearUserCaches(userId: string, campusId: string): Promise<number> {
  try {
    const userCachesSnapshot = await dbAdmin.collection('feedCaches')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .get();
    let cleared = 0;

    for (const cacheDoc of userCachesSnapshot.docs) {
      await cacheDoc.ref.delete();
      cleared++;
    }

    return cleared;
  } catch (error) {
    logger.error(
      `Error clearing user caches at /api/feed/cache`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return 0;
  }
}

// Helper function to clear specific cache
async function clearSpecificCache(cacheKey: string, userId: string, campusId: string): Promise<boolean> {
  try {
    const cacheDoc = await dbAdmin.collection('feedCaches').doc(cacheKey).get();

    if (!cacheDoc.exists) {
      return false;
    }

    const cache = cacheDoc.data() as FeedCache;

    // Check ownership and campus isolation
    if (cache.userId !== userId || cache.campusId !== campusId) {
      return false;
    }

    await dbAdmin.collection('feedCaches').doc(cacheKey).delete();
    return true;
  } catch (error) {
    logger.error(
      `Error clearing specific cache at /api/feed/cache`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return false;
  }
}

// Background cleanup function (would be called by a scheduled job)
async function _cleanupExpiredCaches(): Promise<number> {
  try {
    const now = new Date();
    const expiredCachesSnapshot = await dbAdmin.collection('feedCaches')
      .where('expiresAt', '<', now.toISOString())
      .get();
    let cleaned = 0;

    for (const cacheDoc of expiredCachesSnapshot.docs) {
      await cacheDoc.ref.delete();
      cleaned++;
    }

    return cleaned;
  } catch (error) {
    logger.error(
      `Error cleaning up expired caches at /api/feed/cache`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return 0;
  }
}
