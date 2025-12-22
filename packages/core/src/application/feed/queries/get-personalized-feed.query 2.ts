/**
 * Get Personalized Feed Query Handler
 *
 * Fetches and ranks feed content using the 8-factor algorithm.
 * This is the primary feed retrieval mechanism that replaces
 * the chronological-only approach.
 *
 * @see FeedRankingService for algorithm details
 */

import { Result } from '../../../domain/shared/base/Result';
import { FeedItem } from '../../../domain/feed/feed-item';
import {
  FeedRankingService,
  RankingCandidate,
  RankedItem,
  UserRankingContext,
  FeedRankingConfig
} from '../../../domain/feed/services/feed-ranking.service';
import { IFeedRepository, IProfileRepository, ISpaceRepository } from '../../../infrastructure/repositories/interfaces';
import { getFeedRepository, getProfileRepository, getSpaceRepository } from '../../../infrastructure/repositories/firebase';

/**
 * Query input for personalized feed
 */
export interface GetPersonalizedFeedQuery {
  userId: string;
  campusId: string;
  limit?: number;
  offset?: number;
  filters?: {
    spaceIds?: string[];
    contentTypes?: ('tool_generated' | 'tool_enhanced' | 'space_event' | 'builder_announcement' | 'rss_import' | 'user_post')[];
    minQualityScore?: number;
    includeConnections?: boolean;
    includeTrending?: boolean;
  };
  rankingOverrides?: Partial<FeedRankingConfig>;
}

/**
 * Personalized feed result with ranking metadata
 */
export interface PersonalizedFeedResult {
  items: RankedItem[];
  hasMore: boolean;
  nextOffset: number;
  totalCount: number;
  metadata: {
    averageRelevanceScore: number;
    diversityScore: number;
    toolContentPercentage: number;
    fetchTimeMs: number;
    rankTimeMs: number;
  };
}

/**
 * User engagement data for ranking context
 */
interface UserEngagementData {
  spaceEngagementScores: Map<string, number>;
  preferredSpaceIds: string[];
  preferredContentTypes: string[];
  optimalPostingHours: number[];
}

/**
 * GetPersonalizedFeedQueryHandler
 *
 * Orchestrates feed retrieval and ranking:
 * 1. Loads user context (spaces, connections, engagement history)
 * 2. Fetches candidate content from multiple sources
 * 3. Applies the 8-factor ranking algorithm
 * 4. Returns personalized, ranked feed items
 */
export class GetPersonalizedFeedQueryHandler {
  private readonly feedRepository: IFeedRepository;
  private readonly profileRepository: IProfileRepository;
  private readonly spaceRepository: ISpaceRepository;
  private readonly rankingService: FeedRankingService;

  constructor(
    feedRepository?: IFeedRepository,
    profileRepository?: IProfileRepository,
    spaceRepository?: ISpaceRepository,
    rankingConfig?: Partial<FeedRankingConfig>
  ) {
    this.feedRepository = feedRepository || getFeedRepository();
    this.profileRepository = profileRepository || getProfileRepository();
    this.spaceRepository = spaceRepository || getSpaceRepository();
    this.rankingService = new FeedRankingService(rankingConfig);
  }

  /**
   * Execute the personalized feed query
   */
  async execute(query: GetPersonalizedFeedQuery): Promise<Result<PersonalizedFeedResult>> {
    const startTime = Date.now();

    try {
      // Step 1: Build user ranking context
      const contextResult = await this.buildUserContext(query.userId, query.campusId);
      if (contextResult.isFailure) {
        return Result.fail(contextResult.error!);
      }
      const userContext = contextResult.getValue();

      // Step 2: Fetch candidate content
      const fetchStart = Date.now();
      const candidatesResult = await this.fetchCandidates(query, userContext);
      if (candidatesResult.isFailure) {
        return Result.fail(candidatesResult.error!);
      }
      const candidates = candidatesResult.getValue();
      const fetchTimeMs = Date.now() - fetchStart;

      // Step 3: Rank candidates
      const rankStart = Date.now();
      const rankedResult = this.rankingService.rankItems(candidates, userContext);
      if (rankedResult.isFailure) {
        return Result.fail(rankedResult.error!);
      }
      let rankedItems = rankedResult.getValue();
      const rankTimeMs = Date.now() - rankStart;

      // Step 4: Apply content type filter if specified
      if (query.filters?.contentTypes?.length) {
        rankedItems = rankedItems.filter(item =>
          query.filters!.contentTypes!.includes(item.contentType)
        );
      }

      // Step 5: Apply quality threshold if specified
      if (query.filters?.minQualityScore !== undefined) {
        rankedItems = rankedItems.filter(item =>
          item.qualityScore >= query.filters!.minQualityScore!
        );
      }

      // Step 6: Apply pagination
      const limit = query.limit || 20;
      const offset = query.offset || 0;
      const totalCount = rankedItems.length;
      const paginatedItems = rankedItems.slice(offset, offset + limit);

      // Step 7: Calculate metadata
      const avgScore = paginatedItems.length > 0
        ? paginatedItems.reduce((sum, item) => sum + item.relevanceScore, 0) / paginatedItems.length
        : 0;
      const diversityScore = this.rankingService.calculateDiversityScore(paginatedItems);
      const toolContentPercentage = this.rankingService.calculateToolContentPercentage(paginatedItems);

      return Result.ok({
        items: paginatedItems,
        hasMore: offset + limit < totalCount,
        nextOffset: offset + limit,
        totalCount,
        metadata: {
          averageRelevanceScore: Math.round(avgScore * 100) / 100,
          diversityScore: Math.round(diversityScore * 100) / 100,
          toolContentPercentage: Math.round(toolContentPercentage * 100) / 100,
          fetchTimeMs,
          rankTimeMs
        }
      });

    } catch (error) {
      return Result.fail(`Failed to get personalized feed: ${error}`);
    }
  }

  /**
   * Build user context for ranking
   */
  private async buildUserContext(userId: string, campusId: string): Promise<Result<UserRankingContext>> {
    try {
      // Get user's engagement data
      const engagementData = await this.loadUserEngagementData(userId);

      // Get user's spaces
      const spacesResult = await this.spaceRepository.findByMember(userId);
      const preferredSpaceIds = spacesResult.isSuccess
        ? spacesResult.getValue().map(s => s.spaceId?.value || '')
        : [];

      // Get user profile for preferences
      const profileResult = await this.profileRepository.findById(userId);
      const preferredContentTypes: string[] = [];
      if (profileResult.isSuccess) {
        const profile = profileResult.getValue();
        // User interests could inform content type preferences
        // For now, give moderate preference to tool-generated content
        preferredContentTypes.push('tool_generated', 'space_event');
      }

      return Result.ok({
        userId,
        spaceEngagementScores: engagementData.spaceEngagementScores,
        preferredSpaceIds,
        preferredContentTypes,
        optimalPostingHours: engagementData.optimalPostingHours
      });

    } catch (error) {
      return Result.fail(`Failed to build user context: ${error}`);
    }
  }

  /**
   * Load user engagement data from interactions
   */
  private async loadUserEngagementData(userId: string): Promise<UserEngagementData> {
    // In a full implementation, this would query the interactions collection
    // to calculate per-space engagement scores based on:
    // - Views, likes, comments, shares
    // - Time spent reading
    // - Click-through rates
    // - Recency of interactions
    //
    // For now, return reasonable defaults that enable the algorithm to work

    const spaceEngagementScores = new Map<string, number>();

    // Default engagement score for new users
    // This will be refined as we collect interaction data
    const defaultScore = 50;

    return {
      spaceEngagementScores,
      preferredSpaceIds: [],
      preferredContentTypes: ['user_post', 'space_event'],
      optimalPostingHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] // Daytime hours
    };
  }

  /**
   * Fetch candidate content from all sources
   */
  private async fetchCandidates(
    query: GetPersonalizedFeedQuery,
    context: UserRankingContext
  ): Promise<Result<RankingCandidate[]>> {
    try {
      const candidates: RankingCandidate[] = [];
      const baseLimit = (query.limit || 20) * 3; // Fetch more than needed for ranking

      // Get user's spaces for content filtering
      const userSpaceIds = context.preferredSpaceIds;
      if (query.filters?.spaceIds?.length) {
        userSpaceIds.push(...query.filters.spaceIds);
      }

      // 1. Get content from user's spaces
      const spaceContentResult = await this.feedRepository.getFeedContent(
        query.userId,
        [...new Set(userSpaceIds)], // Dedupe
        [], // Connections handled separately
        baseLimit
      );

      if (spaceContentResult.isSuccess) {
        const spaceContent = spaceContentResult.getValue();
        candidates.push(...this.mapToRankingCandidates(spaceContent, 'space'));
      }

      // 2. Get content from connections if enabled
      if (query.filters?.includeConnections !== false) {
        const connectionsResult = await this.profileRepository.findConnectionsOf(query.userId);
        if (connectionsResult.isSuccess) {
          const connectionIds = connectionsResult.getValue().map(p => p.profileId?.value || '');
          if (connectionIds.length > 0) {
            const connectionContentResult = await this.feedRepository.getFeedContent(
              query.userId,
              [],
              connectionIds.slice(0, 10), // Limit for Firestore 'in' query
              Math.floor(baseLimit / 2)
            );

            if (connectionContentResult.isSuccess) {
              const connectionContent = connectionContentResult.getValue();
              candidates.push(...this.mapToRankingCandidates(connectionContent, 'connection'));
            }
          }
        }
      }

      // 3. Get trending content if enabled
      if (query.filters?.includeTrending !== false) {
        const trendingResult = await this.feedRepository.getTrendingContent(
          query.campusId,
          Math.floor(baseLimit / 3)
        );

        if (trendingResult.isSuccess) {
          const trendingContent = trendingResult.getValue();
          candidates.push(...this.mapToRankingCandidates(trendingContent, 'trending'));
        }
      }

      // 4. Get upcoming events
      const eventResult = await this.feedRepository.getEventContent(
        query.campusId,
        10
      );

      if (eventResult.isSuccess) {
        const eventContent = eventResult.getValue();
        candidates.push(...this.mapToRankingCandidates(eventContent, 'event'));
      }

      // Deduplicate by ID
      const seen = new Set<string>();
      const dedupedCandidates = candidates.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      return Result.ok(dedupedCandidates);

    } catch (error) {
      return Result.fail(`Failed to fetch candidates: ${error}`);
    }
  }

  /**
   * Map raw content to ranking candidates
   */
  private mapToRankingCandidates(items: any[], source: string): RankingCandidate[] {
    return items.map(item => ({
      id: item.id || item._id || '',
      spaceId: item.spaceId || item.source?.spaceId || '',
      authorId: item.authorId || item.content?.authorId || '',
      createdAt: item.createdAt instanceof Date
        ? item.createdAt
        : item.createdAt?.toDate?.()
          || new Date(item.createdAt || Date.now()),
      contentType: this.inferContentType(item, source),
      toolId: item.toolId || item.source?.toolId,
      content: item.content?.text || item.text || item.description || '',
      title: item.title || item.content?.title,
      hasMetadata: !!(item.metadata || item.tags?.length),
      engagement: {
        likes: item.likes || item.engagement?.likes || 0,
        comments: item.comments?.length || item.engagement?.comments || 0,
        shares: item.shares || item.engagement?.shares || 0,
        views: item.views || item.engagement?.views || 0
      },
      authorRole: item.authorRole as RankingCandidate['authorRole'],
      authorPostCount: item.authorPostCount,
      eventDate: item.eventDate instanceof Date
        ? item.eventDate
        : item.eventDate?.toDate?.()
          || (item.startTime instanceof Date ? item.startTime : item.startTime?.toDate?.()),
      hasDeadline: !!item.deadline || !!item.dueDate
    }));
  }

  /**
   * Infer content type from item data
   */
  private inferContentType(
    item: any,
    source: string
  ): RankingCandidate['contentType'] {
    // Explicit type takes precedence
    if (item.contentType) {
      const type = item.contentType as RankingCandidate['contentType'];
      if (['tool_generated', 'tool_enhanced', 'space_event', 'builder_announcement', 'rss_import', 'user_post'].includes(type)) {
        return type;
      }
    }

    // Infer from item properties
    if (item.toolId || item.source?.toolId) {
      return item.isEnhanced ? 'tool_enhanced' : 'tool_generated';
    }

    if (item.type === 'event' || source === 'event' || item.startTime) {
      return 'space_event';
    }

    if (item.type === 'announcement' || item.isAnnouncement) {
      return 'builder_announcement';
    }

    if (item.source?.type === 'rss' || item.isRssImport) {
      return 'rss_import';
    }

    return 'user_post';
  }
}

/**
 * Factory function for creating the handler with default dependencies
 */
export function createPersonalizedFeedHandler(
  rankingConfig?: Partial<FeedRankingConfig>
): GetPersonalizedFeedQueryHandler {
  return new GetPersonalizedFeedQueryHandler(
    undefined,
    undefined,
    undefined,
    rankingConfig
  );
}
