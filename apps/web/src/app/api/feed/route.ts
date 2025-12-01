/**
 * Feed API Route - DDD Implementation with 8-Factor Ranking Algorithm
 *
 * Provides personalized feed using the FeedRankingService:
 * 1. Space Engagement (25%) - User's engagement level in source space
 * 2. Content Recency (15%) - How recent the content is
 * 3. Content Quality (20%) - Quality based on content type and completeness
 * 4. Tool Interaction Value (15%) - Value of tool-generated content
 * 5. Social Signals (10%) - Likes, comments, shares
 * 6. Creator Influence (5%) - Creator's role and activity level
 * 7. Diversity Factor (5%) - Bonus for content type variety
 * 8. Temporal Relevance (5%) - Time-sensitive content (events, deadlines)
 *
 * Supports both ranked (algorithm) and chronological (recent) sorting.
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { withSecureAuth } from '@/lib/api-auth-secure';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getDefaultCampusId } from '@/lib/campus-context';
// Import ranking service directly since Next.js transpiles workspace packages
import {
  FeedRankingService,
  DEFAULT_RANKING_CONFIG,
  type RankingCandidate,
  type UserRankingContext
} from '@hive/core/domain/feed/services/feed-ranking.service';

// Feed query schema - handles null values from searchParams.get()
const FeedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  cursor: z.string().nullish(),
  type: z.enum(['all', 'spaces', 'events', 'posts', 'tools']).nullable().transform(v => v ?? 'all'),
  spaceId: z.string().nullish(),
  sortBy: z.enum(['algorithm', 'recent', 'engagement']).nullable().transform(v => v ?? 'algorithm')
});

// Initialize the ranking service
const rankingService = new FeedRankingService();

/**
 * Build user ranking context from their engagement data
 */
async function buildUserContext(
  userId: string,
  campusId: string
): Promise<UserRankingContext> {
  const spaceEngagementScores = new Map<string, number>();
  const preferredSpaceIds: string[] = [];

  try {
    // Get user's space memberships
    const membershipsSnap = await dbAdmin
      .collection('space_members')
      .where('userId', '==', userId)
      .get();

    membershipsSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const spaceId = data.spaceId;
      if (spaceId) {
        preferredSpaceIds.push(spaceId);
        // Calculate engagement score based on role and activity
        let score = 50; // Base score
        if (data.role === 'owner') score += 40;
        else if (data.role === 'admin') score += 30;
        else if (data.role === 'moderator') score += 20;
        else if (data.role === 'member') score += 10;
        spaceEngagementScores.set(spaceId, Math.min(100, score));
      }
    });

    // Get recent interactions to boost engagement scores
    const recentInteractionsSnap = await dbAdmin
      .collection('interactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    recentInteractionsSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      if (data.spaceId) {
        const currentScore = spaceEngagementScores.get(data.spaceId) || 50;
        // Boost score for recent interactions
        spaceEngagementScores.set(data.spaceId, Math.min(100, currentScore + 5));
      }
    });
  } catch (error) {
    // If we can't load engagement data, continue with defaults
    logger.warn('Failed to load user engagement data', { userId, error: String(error) });
  }

  return {
    userId,
    spaceEngagementScores,
    preferredSpaceIds,
    preferredContentTypes: ['tool_generated', 'space_event', 'user_post'],
    optimalPostingHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  };
}

/**
 * Fetch raw posts and convert to ranking candidates
 */
async function fetchCandidates(
  campusId: string,
  userId: string,
  type: string,
  spaceId?: string,
  limit: number = 100
): Promise<RankingCandidate[]> {
  try {
    let postsQuery = dbAdmin.collection('posts').where('campusId', '==', campusId);

    // Apply type filter
    if (type === 'events') {
      postsQuery = postsQuery.where('contentType', '==', 'space_event');
    } else if (type === 'tools') {
      postsQuery = postsQuery.where('contentType', 'in', ['tool_generated', 'tool_enhanced']);
    } else if (type === 'spaces' && spaceId) {
      postsQuery = postsQuery.where('spaceId', '==', spaceId);
    }

    const snapshot = await postsQuery.limit(limit * 3).get(); // Fetch more for ranking

    const candidates = snapshot.docs
    .map((doc: FirebaseFirestore.QueryDocumentSnapshot): RankingCandidate | null => {
      const data = doc.data();

      // SECURITY: Skip hidden/moderated content
      if (data.isHidden === true || data.status === 'hidden' || data.status === 'removed') {
        return null;
      }

      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now());

      return {
        id: doc.id,
        spaceId: data.spaceId || '',
        authorId: data.authorId || data.userId || '',
        createdAt,
        contentType: mapContentType(data.contentType || data.type),
        toolId: data.toolId,
        content: data.content?.text || data.text || data.description || '',
        title: data.title || data.content?.title,
        hasMetadata: !!(data.metadata || data.tags?.length),
        engagement: {
          likes: data.likes || data.engagement?.likes || 0,
          comments: Array.isArray(data.comments) ? data.comments.length : (data.engagement?.comments || 0),
          shares: data.shares || data.engagement?.shares || 0,
          views: data.views || data.engagement?.views || 0
        },
        authorRole: data.authorRole as RankingCandidate['authorRole'],
        authorPostCount: data.authorPostCount,
        eventDate: data.eventDate?.toDate?.() || data.startTime?.toDate?.(),
        hasDeadline: !!data.deadline || !!data.dueDate
      };
    })
    .filter((item): item is RankingCandidate => item !== null);

    return candidates;
  } catch (error) {
    // Handle Firestore index errors gracefully - return empty array
    logger.warn('Failed to fetch feed candidates', {
      campusId,
      type,
      spaceId,
      error: String(error)
    });
    return [];
  }
}

/**
 * Map various content type strings to valid RankingCandidate types
 */
function mapContentType(type: string | undefined): RankingCandidate['contentType'] {
  switch (type) {
    case 'tool_generated':
    case 'tool-generated':
      return 'tool_generated';
    case 'tool_enhanced':
    case 'tool-enhanced':
      return 'tool_enhanced';
    case 'space_event':
    case 'event':
      return 'space_event';
    case 'builder_announcement':
    case 'announcement':
      return 'builder_announcement';
    case 'rss_import':
    case 'rss':
      return 'rss_import';
    default:
      return 'user_post';
  }
}

/**
 * Legacy chronological feed fetcher (for sortBy=recent)
 */
async function getChronologicalFeed(
  campusId: string,
  limit: number,
  type: string,
  spaceId?: string,
  cursor?: string
) {
  let postsQuery = dbAdmin.collection('posts').where('campusId', '==', campusId);

  if (type === 'events') {
    postsQuery = postsQuery.where('contentType', '==', 'space_event');
  } else if (type === 'spaces' && spaceId) {
    postsQuery = postsQuery.where('spaceId', '==', spaceId);
  }

  const snapshot = await postsQuery.limit(100).get();

  let posts = snapshot.docs
    .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();

      // SECURITY: Skip hidden/moderated content
      if (data.isHidden === true || data.status === 'hidden' || data.status === 'removed') {
        return null;
      }

      const createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date(0);
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date()
      };
    })
    .filter((post): post is NonNullable<typeof post> => post !== null);

  // Sort by createdAt descending
  posts.sort((a: { createdAt: Date | string }, b: { createdAt: Date | string }) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

  const hasMore = posts.length > limit;
  posts = posts.slice(0, limit);
  const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].id : undefined;

  return {
    posts,
    pagination: {
      limit,
      cursor,
      nextCursor,
      hasMore
    }
  };
}

export const GET = withSecureAuth(
  async (request: Request, token: { uid: string }) => {
    try {
      const { searchParams } = new URL(request.url);
      const params = FeedQuerySchema.parse({
        limit: searchParams.get('limit'),
        offset: searchParams.get('offset'),
        cursor: searchParams.get('cursor'),
        type: searchParams.get('type'),
        spaceId: searchParams.get('spaceId'),
        sortBy: searchParams.get('sortBy')
      });

      const campusId = getDefaultCampusId();
      const userId = token.uid;

      // Use chronological sort if requested
      if (params.sortBy === 'recent') {
        const result = await getChronologicalFeed(
          campusId,
          params.limit,
          params.type,
          params.spaceId ?? undefined,
          params.cursor ?? undefined
        );

        logger.info('Chronological feed fetched', {
          userId,
          count: result.posts.length,
          type: params.type
        });

        return NextResponse.json({
          success: true,
          ...result,
          metadata: {
            sortBy: 'recent',
            algorithm: 'chronological'
          }
        });
      }

      // Use 8-factor ranking algorithm
      const [userContext, candidates] = await Promise.all([
        buildUserContext(userId, campusId),
        fetchCandidates(campusId, userId, params.type, params.spaceId ?? undefined, params.limit)
      ]);

      // Rank the candidates
      const rankResult = rankingService.rankItems(candidates, userContext);

      if (rankResult.isFailure) {
        logger.error('Ranking failed', { error: rankResult.error });
        // Fall back to chronological
        const fallbackResult = await getChronologicalFeed(
          campusId,
          params.limit,
          params.type,
          params.spaceId ?? undefined,
          params.cursor ?? undefined
        );
        return NextResponse.json({
          success: true,
          ...fallbackResult,
          metadata: { sortBy: 'recent', algorithm: 'fallback' }
        });
      }

      const rankedItems = rankResult.getValue();

      // Apply pagination
      const offset = params.offset;
      const paginatedItems = rankedItems.slice(offset, offset + params.limit);
      const hasMore = offset + params.limit < rankedItems.length;

      // Calculate feed quality metrics
      const avgRelevanceScore = paginatedItems.length > 0
        ? paginatedItems.reduce((sum, item) => sum + item.relevanceScore, 0) / paginatedItems.length
        : 0;
      const diversityScore = rankingService.calculateDiversityScore(paginatedItems);
      const toolContentPercentage = rankingService.calculateToolContentPercentage(paginatedItems);

      // Format posts for response (include ranking data)
      const posts = paginatedItems.map(item => ({
        id: item.id,
        spaceId: item.spaceId,
        authorId: item.authorId,
        createdAt: item.createdAt,
        contentType: item.contentType,
        toolId: item.toolId,
        content: item.content,
        title: item.title,
        hasMetadata: item.hasMetadata,
        engagement: item.engagement,
        authorRole: item.authorRole,
        // Ranking metadata
        relevanceScore: Math.round(item.relevanceScore * 100) / 100,
        qualityScore: Math.round(item.qualityScore * 100) / 100,
        factors: {
          spaceEngagement: Math.round(item.factors.spaceEngagement),
          contentRecency: Math.round(item.factors.contentRecency),
          contentQuality: Math.round(item.factors.contentQuality),
          toolInteractionValue: Math.round(item.factors.toolInteractionValue),
          socialSignals: Math.round(item.factors.socialSignals),
          creatorInfluence: Math.round(item.factors.creatorInfluence),
          diversityFactor: Math.round(item.factors.diversityFactor),
          temporalRelevance: Math.round(item.factors.temporalRelevance)
        }
      }));

      logger.info('Ranked feed fetched', {
        userId,
        count: posts.length,
        type: params.type,
        avgScore: avgRelevanceScore.toFixed(2),
        diversityScore: diversityScore.toFixed(2)
      });

      return NextResponse.json({
        success: true,
        posts,
        pagination: {
          limit: params.limit,
          offset,
          nextOffset: hasMore ? offset + params.limit : undefined,
          hasMore,
          totalCount: rankedItems.length
        },
        metadata: {
          sortBy: 'algorithm',
          algorithm: '8-factor-ranking',
          config: {
            weights: DEFAULT_RANKING_CONFIG.weights,
            diversityMode: DEFAULT_RANKING_CONFIG.diversityMode
          },
          quality: {
            averageRelevanceScore: Math.round(avgRelevanceScore * 100) / 100,
            diversityScore: Math.round(diversityScore * 100) / 100,
            toolContentPercentage: Math.round(toolContentPercentage * 100) / 100
          }
        }
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      logger.error('Feed fetch error', {
        error: { message: errMsg, stack: errStack },
        campusId: getDefaultCampusId()
      });
      console.error('Feed fetch error full:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch feed', details: errMsg },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' }
  }
);
