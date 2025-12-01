/**
 * FeedRankingService
 *
 * Domain service for calculating feed item relevance scores.
 * Extracted from the orphaned /api/feed/algorithm route to enable proper DDD integration.
 *
 * The algorithm considers 8 factors with configurable weights:
 * 1. Space Engagement (25%) - How engaged the user is with the source space
 * 2. Content Recency (15%) - How recent the content is
 * 3. Content Quality (20%) - Quality based on content type and completeness
 * 4. Tool Interaction Value (15%) - Value of any tool that generated the content
 * 5. Social Signals (10%) - Likes, comments, shares
 * 6. Creator Influence (5%) - Creator's role and activity level
 * 7. Diversity Factor (5%) - Bonus for content type variety
 * 8. Temporal Relevance (5%) - Time-sensitive content (events, deadlines)
 */

import { Result } from '../../shared/base/Result';

/**
 * Relevance factors used in ranking calculation
 */
export interface RelevanceFactors {
  spaceEngagement: number;      // 0-100: User's engagement level in this space
  contentRecency: number;       // 0-100: How recent the content is
  contentQuality: number;       // 0-100: Content validation score
  toolInteractionValue: number; // 0-100: Value of tool that generated content
  socialSignals: number;        // 0-100: Likes, comments, shares
  creatorInfluence: number;     // 0-100: Creator's influence in space
  diversityFactor: number;      // 0-100: Content type diversity bonus
  temporalRelevance: number;    // 0-100: Time-based relevance (events, deadlines)
}

/**
 * Default weights for each factor (must sum to 1.0)
 */
export interface RankingWeights {
  spaceEngagement: number;
  contentRecency: number;
  contentQuality: number;
  toolInteractionValue: number;
  socialSignals: number;
  creatorInfluence: number;
  diversityFactor: number;
  temporalRelevance: number;
}

/**
 * Configuration for the ranking algorithm
 */
export interface FeedRankingConfig {
  weights: RankingWeights;
  maxContentAgeHours: number;      // Max age for content inclusion
  minRelevanceThreshold: number;   // Minimum score to include in feed
  qualityThreshold: number;        // Minimum quality score
  toolContentBonus: number;        // Extra weight for tool-generated content
  diversityMode: 'strict' | 'balanced' | 'relaxed';
}

/**
 * User context for personalized ranking
 */
export interface UserRankingContext {
  userId: string;
  spaceEngagementScores: Map<string, number>; // spaceId -> engagement score
  preferredSpaceIds: string[];
  preferredContentTypes: string[];
  optimalPostingHours: number[];
}

/**
 * Feed candidate item for ranking
 */
export interface RankingCandidate {
  id: string;
  spaceId: string;
  authorId: string;
  createdAt: Date;
  contentType: 'tool_generated' | 'tool_enhanced' | 'space_event' | 'builder_announcement' | 'rss_import' | 'user_post';
  toolId?: string;
  content: string;
  title?: string;
  hasMetadata: boolean;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  authorRole?: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  authorPostCount?: number;
  eventDate?: Date;
  hasDeadline?: boolean;
}

/**
 * Ranked item with calculated scores
 */
export interface RankedItem extends RankingCandidate {
  relevanceScore: number;
  qualityScore: number;
  factors: RelevanceFactors;
}

/**
 * Default ranking configuration
 */
export const DEFAULT_RANKING_CONFIG: FeedRankingConfig = {
  weights: {
    spaceEngagement: 0.25,
    contentRecency: 0.15,
    contentQuality: 0.20,
    toolInteractionValue: 0.15,
    socialSignals: 0.10,
    creatorInfluence: 0.05,
    diversityFactor: 0.05,
    temporalRelevance: 0.05
  },
  maxContentAgeHours: 48,
  minRelevanceThreshold: 25,
  qualityThreshold: 30,
  toolContentBonus: 30,
  diversityMode: 'balanced'
};

/**
 * FeedRankingService
 *
 * Calculates relevance scores for feed items based on multiple factors.
 * This is a pure domain service with no external dependencies.
 */
export class FeedRankingService {
  private readonly config: FeedRankingConfig;

  constructor(config: Partial<FeedRankingConfig> = {}) {
    this.config = {
      ...DEFAULT_RANKING_CONFIG,
      ...config,
      weights: {
        ...DEFAULT_RANKING_CONFIG.weights,
        ...config.weights
      }
    };
  }

  /**
   * Calculate relevance score for a single item
   */
  public calculateRelevance(
    item: RankingCandidate,
    context: UserRankingContext
  ): Result<RankedItem> {
    try {
      const factors = this.calculateFactors(item, context);
      const qualityScore = this.calculateQualityScore(item);
      const relevanceScore = this.calculateWeightedScore(factors);

      const rankedItem: RankedItem = {
        ...item,
        relevanceScore,
        qualityScore,
        factors
      };

      return Result.ok(rankedItem);
    } catch (error) {
      return Result.fail(`Failed to calculate relevance: ${error}`);
    }
  }

  /**
   * Rank multiple items and return sorted by relevance
   */
  public rankItems(
    items: RankingCandidate[],
    context: UserRankingContext
  ): Result<RankedItem[]> {
    const rankedItems: RankedItem[] = [];

    for (const item of items) {
      const result = this.calculateRelevance(item, context);
      if (result.isSuccess) {
        const rankedItem = result.getValue();
        // Apply minimum threshold filter
        if (rankedItem.relevanceScore >= this.config.minRelevanceThreshold) {
          rankedItems.push(rankedItem);
        }
      }
    }

    // Sort by relevance score (descending)
    rankedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply diversity enforcement if needed
    const diversifiedItems = this.enforceDiversity(rankedItems);

    return Result.ok(diversifiedItems);
  }

  /**
   * Calculate all relevance factors for an item
   */
  private calculateFactors(
    item: RankingCandidate,
    context: UserRankingContext
  ): RelevanceFactors {
    return {
      spaceEngagement: this.calculateSpaceEngagement(item.spaceId, context),
      contentRecency: this.calculateRecency(item.createdAt),
      contentQuality: this.calculateQualityScore(item),
      toolInteractionValue: this.calculateToolValue(item),
      socialSignals: this.calculateSocialSignals(item.engagement),
      creatorInfluence: this.calculateCreatorInfluence(item),
      diversityFactor: 50, // Base value, adjusted in final ranking
      temporalRelevance: this.calculateTemporalRelevance(item)
    };
  }

  /**
   * Calculate space engagement factor
   */
  private calculateSpaceEngagement(spaceId: string, context: UserRankingContext): number {
    // Get user's engagement score for this space
    const engagementScore = context.spaceEngagementScores.get(spaceId) ?? 20;

    // Bonus for preferred spaces
    const isPreferred = context.preferredSpaceIds.includes(spaceId);
    const preferredBonus = isPreferred ? 20 : 0;

    return Math.min(100, engagementScore + preferredBonus);
  }

  /**
   * Calculate content recency factor with exponential decay
   */
  private calculateRecency(createdAt: Date): number {
    const now = new Date();
    const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Linear decay over max age
    const recency = Math.max(0, 100 - (ageHours / this.config.maxContentAgeHours) * 100);

    return recency;
  }

  /**
   * Calculate content quality score
   */
  private calculateQualityScore(item: RankingCandidate): number {
    let quality = 50; // Base score

    // Tool-generated content gets higher quality score
    if (item.contentType === 'tool_generated') {
      quality += this.config.toolContentBonus;
    } else if (item.contentType === 'tool_enhanced') {
      quality += this.config.toolContentBonus * 0.7;
    }

    // Tool presence bonus
    if (item.toolId) {
      quality += 10;
    }

    // Content completeness
    if (item.content && item.content.length > 50) {
      quality += 10;
    }
    if (item.title) {
      quality += 5;
    }
    if (item.hasMetadata) {
      quality += 5;
    }

    return Math.min(100, quality);
  }

  /**
   * Calculate tool interaction value
   */
  private calculateToolValue(item: RankingCandidate): number {
    // Base value for non-tool content
    if (!item.toolId) {
      return 50;
    }

    // Tool-generated content gets higher base value
    let value = 70;

    // Event announcements are valuable
    if (item.contentType === 'space_event') {
      value += 15;
    }

    // Builder announcements are valuable
    if (item.contentType === 'builder_announcement') {
      value += 10;
    }

    return Math.min(100, value);
  }

  /**
   * Calculate social signals factor
   */
  private calculateSocialSignals(engagement: RankingCandidate['engagement']): number {
    // Weighted engagement calculation
    const totalEngagement =
      (engagement.likes || 0) +
      (engagement.comments || 0) * 2 +
      (engagement.shares || 0) * 3;

    // Scale to 0-100 (assume 20 interactions = max score)
    return Math.min(100, totalEngagement * 5);
  }

  /**
   * Calculate creator influence factor
   */
  private calculateCreatorInfluence(item: RankingCandidate): number {
    let influence = 30; // Base influence

    // Role bonus
    switch (item.authorRole) {
      case 'owner':
        influence += 40;
        break;
      case 'admin':
        influence += 35;
        break;
      case 'moderator':
        influence += 20;
        break;
      case 'member':
        influence += 10;
        break;
      default:
        break;
    }

    // Activity bonus based on post count
    if (item.authorPostCount) {
      influence += Math.min(20, item.authorPostCount);
    }

    return Math.min(100, influence);
  }

  /**
   * Calculate temporal relevance for time-sensitive content
   */
  private calculateTemporalRelevance(item: RankingCandidate): number {
    // Check for time-sensitive content
    if (item.contentType !== 'space_event' && !item.hasDeadline) {
      return 50; // Neutral for non-time-sensitive content
    }

    if (!item.eventDate) {
      return 50;
    }

    const now = new Date();
    const hoursUntilEvent = (item.eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Past events get low score
    if (hoursUntilEvent < 0) {
      return 10;
    }

    // Events in next 24 hours get high score
    if (hoursUntilEvent <= 24) {
      return 100;
    }

    // Events in next week get medium-high score
    if (hoursUntilEvent <= 168) {
      return 80;
    }

    // Future events get medium score
    return 60;
  }

  /**
   * Calculate weighted relevance score from factors
   */
  private calculateWeightedScore(factors: RelevanceFactors): number {
    const { weights } = this.config;

    const score =
      factors.spaceEngagement * weights.spaceEngagement +
      factors.contentRecency * weights.contentRecency +
      factors.contentQuality * weights.contentQuality +
      factors.toolInteractionValue * weights.toolInteractionValue +
      factors.socialSignals * weights.socialSignals +
      factors.creatorInfluence * weights.creatorInfluence +
      factors.diversityFactor * weights.diversityFactor +
      factors.temporalRelevance * weights.temporalRelevance;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Enforce content diversity in the feed
   */
  private enforceDiversity(items: RankedItem[]): RankedItem[] {
    if (this.config.diversityMode === 'relaxed' || items.length < 10) {
      return items;
    }

    const diversified: RankedItem[] = [];
    const contentTypeCounts: Map<string, number> = new Map();
    const spaceCounts: Map<string, number> = new Map();

    // Max items per content type / space based on mode
    const maxPerType = this.config.diversityMode === 'strict' ? 2 : 4;
    const maxPerSpace = this.config.diversityMode === 'strict' ? 3 : 5;

    for (const item of items) {
      const typeCount = contentTypeCounts.get(item.contentType) || 0;
      const spaceCount = spaceCounts.get(item.spaceId) || 0;

      // Check if we've hit limits
      const typeOk = typeCount < maxPerType;
      const spaceOk = spaceCount < maxPerSpace;

      if (typeOk && spaceOk) {
        diversified.push(item);
        contentTypeCounts.set(item.contentType, typeCount + 1);
        spaceCounts.set(item.spaceId, spaceCount + 1);
      } else {
        // Apply diversity penalty
        const penalizedItem = {
          ...item,
          relevanceScore: item.relevanceScore * 0.7,
          factors: {
            ...item.factors,
            diversityFactor: 20 // Reduced diversity bonus
          }
        };
        diversified.push(penalizedItem);
      }
    }

    // Re-sort after diversity adjustments
    diversified.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return diversified;
  }

  /**
   * Calculate diversity score for a set of items
   */
  public calculateDiversityScore(items: RankedItem[]): number {
    if (items.length === 0) return 0;

    const contentTypes = new Set(items.map(i => i.contentType));
    const spaces = new Set(items.map(i => i.spaceId));

    // Diversity score based on unique types and spaces
    const typeScore = (contentTypes.size / 6) * 50; // 6 possible types
    const spaceScore = (spaces.size / items.length) * 50;

    return Math.min(100, typeScore + spaceScore);
  }

  /**
   * Calculate tool content percentage
   */
  public calculateToolContentPercentage(items: RankedItem[]): number {
    if (items.length === 0) return 0;

    const toolItems = items.filter(
      i => i.contentType === 'tool_generated' || i.contentType === 'tool_enhanced'
    );

    return (toolItems.length / items.length) * 100;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): FeedRankingConfig {
    return { ...this.config };
  }
}
