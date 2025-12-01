import { describe, it, expect, beforeEach } from 'vitest';
import {
  FeedRankingService,
  RankingCandidate,
  UserRankingContext,
  DEFAULT_RANKING_CONFIG
} from '../../../../domain/feed/services/feed-ranking.service';

describe('FeedRankingService', () => {
  let service: FeedRankingService;
  let defaultContext: UserRankingContext;

  beforeEach(() => {
    service = new FeedRankingService();

    defaultContext = {
      userId: 'user-123',
      spaceEngagementScores: new Map([
        ['space-1', 80],
        ['space-2', 60],
        ['space-3', 40]
      ]),
      preferredSpaceIds: ['space-1', 'space-2'],
      preferredContentTypes: ['tool_generated', 'space_event'],
      optimalPostingHours: [9, 10, 11, 12, 13, 14, 15, 16, 17]
    };
  });

  const createCandidate = (overrides: Partial<RankingCandidate> = {}): RankingCandidate => ({
    id: 'post-1',
    spaceId: 'space-1',
    authorId: 'author-1',
    createdAt: new Date(),
    contentType: 'user_post',
    content: 'This is test content for the ranking algorithm.',
    title: 'Test Post',
    hasMetadata: true,
    engagement: {
      likes: 5,
      comments: 3,
      shares: 1,
      views: 100
    },
    authorRole: 'member',
    authorPostCount: 10,
    ...overrides
  });

  describe('DEFAULT_RANKING_CONFIG', () => {
    it('should have weights that sum to 1.0', () => {
      const weights = DEFAULT_RANKING_CONFIG.weights;
      const sum =
        weights.spaceEngagement +
        weights.contentRecency +
        weights.contentQuality +
        weights.toolInteractionValue +
        weights.socialSignals +
        weights.creatorInfluence +
        weights.diversityFactor +
        weights.temporalRelevance;

      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should have spaceEngagement as highest weight (25%)', () => {
      expect(DEFAULT_RANKING_CONFIG.weights.spaceEngagement).toBe(0.25);
    });

    it('should have reasonable thresholds', () => {
      expect(DEFAULT_RANKING_CONFIG.maxContentAgeHours).toBe(48);
      expect(DEFAULT_RANKING_CONFIG.minRelevanceThreshold).toBe(25);
      expect(DEFAULT_RANKING_CONFIG.qualityThreshold).toBe(30);
    });
  });

  describe('calculateRelevance', () => {
    it('should return a RankedItem with relevance score', () => {
      const candidate = createCandidate();
      const result = service.calculateRelevance(candidate, defaultContext);

      expect(result.isSuccess).toBe(true);
      const ranked = result.getValue();
      expect(ranked.relevanceScore).toBeGreaterThan(0);
      expect(ranked.relevanceScore).toBeLessThanOrEqual(100);
    });

    it('should include all factor scores in the result', () => {
      const candidate = createCandidate();
      const result = service.calculateRelevance(candidate, defaultContext);
      const ranked = result.getValue();

      expect(ranked.factors).toBeDefined();
      expect(ranked.factors.spaceEngagement).toBeGreaterThanOrEqual(0);
      expect(ranked.factors.contentRecency).toBeGreaterThanOrEqual(0);
      expect(ranked.factors.contentQuality).toBeGreaterThanOrEqual(0);
      expect(ranked.factors.toolInteractionValue).toBeGreaterThanOrEqual(0);
      expect(ranked.factors.socialSignals).toBeGreaterThanOrEqual(0);
      expect(ranked.factors.creatorInfluence).toBeGreaterThanOrEqual(0);
      expect(ranked.factors.diversityFactor).toBeGreaterThanOrEqual(0);
      expect(ranked.factors.temporalRelevance).toBeGreaterThanOrEqual(0);
    });

    it('should score recent content higher than old content', () => {
      const recentCandidate = createCandidate({ createdAt: new Date() });
      const oldCandidate = createCandidate({
        id: 'post-2',
        createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000) // 40 hours ago
      });

      const recentResult = service.calculateRelevance(recentCandidate, defaultContext);
      const oldResult = service.calculateRelevance(oldCandidate, defaultContext);

      expect(recentResult.getValue().factors.contentRecency)
        .toBeGreaterThan(oldResult.getValue().factors.contentRecency);
    });

    it('should score tool-generated content higher for quality', () => {
      const toolPost = createCandidate({ contentType: 'tool_generated', toolId: 'tool-1' });
      const userPost = createCandidate({ id: 'post-2', contentType: 'user_post' });

      const toolResult = service.calculateRelevance(toolPost, defaultContext);
      const userResult = service.calculateRelevance(userPost, defaultContext);

      expect(toolResult.getValue().factors.contentQuality)
        .toBeGreaterThan(userResult.getValue().factors.contentQuality);
    });

    it('should score content from preferred spaces higher', () => {
      const preferredSpace = createCandidate({ spaceId: 'space-1' }); // In preferred list
      const otherSpace = createCandidate({ id: 'post-2', spaceId: 'space-99' }); // Not in list

      const preferredResult = service.calculateRelevance(preferredSpace, defaultContext);
      const otherResult = service.calculateRelevance(otherSpace, defaultContext);

      expect(preferredResult.getValue().factors.spaceEngagement)
        .toBeGreaterThan(otherResult.getValue().factors.spaceEngagement);
    });

    it('should score content from owner/admin higher for creator influence', () => {
      const ownerPost = createCandidate({ authorRole: 'owner' });
      const memberPost = createCandidate({ id: 'post-2', authorRole: 'member' });

      const ownerResult = service.calculateRelevance(ownerPost, defaultContext);
      const memberResult = service.calculateRelevance(memberPost, defaultContext);

      expect(ownerResult.getValue().factors.creatorInfluence)
        .toBeGreaterThan(memberResult.getValue().factors.creatorInfluence);
    });

    it('should score highly engaged content higher for social signals', () => {
      const popularPost = createCandidate({
        engagement: { likes: 50, comments: 20, shares: 10, views: 1000 }
      });
      const unpopularPost = createCandidate({
        id: 'post-2',
        engagement: { likes: 0, comments: 0, shares: 0, views: 5 }
      });

      const popularResult = service.calculateRelevance(popularPost, defaultContext);
      const unpopularResult = service.calculateRelevance(unpopularPost, defaultContext);

      expect(popularResult.getValue().factors.socialSignals)
        .toBeGreaterThan(unpopularResult.getValue().factors.socialSignals);
    });
  });

  describe('rankItems', () => {
    it('should sort items by relevance score descending', () => {
      const candidates = [
        createCandidate({ id: 'post-1', spaceId: 'space-99', authorRole: 'guest' }),
        createCandidate({ id: 'post-2', spaceId: 'space-1', authorRole: 'owner' }),
        createCandidate({ id: 'post-3', spaceId: 'space-2', authorRole: 'admin' })
      ];

      const result = service.rankItems(candidates, defaultContext);
      expect(result.isSuccess).toBe(true);

      const ranked = result.getValue();
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i]!.relevanceScore).toBeGreaterThanOrEqual(ranked[i + 1]!.relevanceScore);
      }
    });

    it('should filter items below minimum relevance threshold', () => {
      // Create service with high threshold
      const strictService = new FeedRankingService({
        minRelevanceThreshold: 80 // High threshold
      });

      const candidates = [
        createCandidate({ id: 'post-1', spaceId: 'space-99', authorRole: 'guest' }), // Low score
        createCandidate({
          id: 'post-2',
          spaceId: 'space-1',
          authorRole: 'owner',
          contentType: 'tool_generated',
          toolId: 'tool-1'
        }) // High score
      ];

      const result = strictService.rankItems(candidates, defaultContext);
      const ranked = result.getValue();

      // All returned items should meet threshold
      ranked.forEach(item => {
        expect(item.relevanceScore).toBeGreaterThanOrEqual(80);
      });
    });

    it('should return empty array for empty input', () => {
      const result = service.rankItems([], defaultContext);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toHaveLength(0);
    });
  });

  describe('temporal relevance', () => {
    it('should score upcoming events in next 24 hours as highly relevant', () => {
      const upcomingEvent = createCandidate({
        contentType: 'space_event',
        eventDate: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
      });

      const result = service.calculateRelevance(upcomingEvent, defaultContext);
      expect(result.getValue().factors.temporalRelevance).toBe(100);
    });

    it('should score events in next week as medium-high relevance', () => {
      const weekEvent = createCandidate({
        contentType: 'space_event',
        eventDate: new Date(Date.now() + 72 * 60 * 60 * 1000) // 3 days from now
      });

      const result = service.calculateRelevance(weekEvent, defaultContext);
      expect(result.getValue().factors.temporalRelevance).toBe(80);
    });

    it('should score past events as low relevance', () => {
      const pastEvent = createCandidate({
        contentType: 'space_event',
        eventDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      });

      const result = service.calculateRelevance(pastEvent, defaultContext);
      expect(result.getValue().factors.temporalRelevance).toBe(10);
    });

    it('should score non-event content as neutral temporal relevance', () => {
      const regularPost = createCandidate({ contentType: 'user_post' });

      const result = service.calculateRelevance(regularPost, defaultContext);
      expect(result.getValue().factors.temporalRelevance).toBe(50);
    });
  });

  describe('diversity enforcement', () => {
    it('should penalize items when too many from same content type', () => {
      // Create many items of same type
      const candidates = Array.from({ length: 10 }, (_, i) =>
        createCandidate({
          id: `post-${i}`,
          contentType: 'user_post',
          spaceId: `space-${i % 3}` // Spread across spaces
        })
      );

      const strictService = new FeedRankingService({
        diversityMode: 'strict'
      });

      const result = strictService.rankItems(candidates, defaultContext);
      const ranked = result.getValue();

      // With strict diversity, some items should have reduced scores
      // Check that not all items have the same score pattern
      const scores = ranked.map(r => r.relevanceScore);
      const uniqueScores = new Set(scores);
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

    it('should skip diversity enforcement in relaxed mode', () => {
      const relaxedService = new FeedRankingService({
        diversityMode: 'relaxed'
      });

      const candidates = Array.from({ length: 5 }, (_, i) =>
        createCandidate({
          id: `post-${i}`,
          contentType: 'user_post',
          spaceId: 'space-1'
        })
      );

      const result = relaxedService.rankItems(candidates, defaultContext);
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('calculateDiversityScore', () => {
    it('should return 0 for empty array', () => {
      const score = service.calculateDiversityScore([]);
      expect(score).toBe(0);
    });

    it('should return higher score for diverse content', () => {
      const diverse = [
        createCandidate({ id: '1', contentType: 'user_post', spaceId: 'space-1' }),
        createCandidate({ id: '2', contentType: 'tool_generated', spaceId: 'space-2' }),
        createCandidate({ id: '3', contentType: 'space_event', spaceId: 'space-3' })
      ].map(c => service.calculateRelevance(c, defaultContext).getValue());

      const homogeneous = [
        createCandidate({ id: '4', contentType: 'user_post', spaceId: 'space-1' }),
        createCandidate({ id: '5', contentType: 'user_post', spaceId: 'space-1' }),
        createCandidate({ id: '6', contentType: 'user_post', spaceId: 'space-1' })
      ].map(c => service.calculateRelevance(c, defaultContext).getValue());

      const diverseScore = service.calculateDiversityScore(diverse);
      const homogeneousScore = service.calculateDiversityScore(homogeneous);

      expect(diverseScore).toBeGreaterThan(homogeneousScore);
    });
  });

  describe('calculateToolContentPercentage', () => {
    it('should return 0 for empty array', () => {
      const percentage = service.calculateToolContentPercentage([]);
      expect(percentage).toBe(0);
    });

    it('should calculate correct percentage of tool content', () => {
      const items = [
        createCandidate({ id: '1', contentType: 'tool_generated' }),
        createCandidate({ id: '2', contentType: 'tool_enhanced' }),
        createCandidate({ id: '3', contentType: 'user_post' }),
        createCandidate({ id: '4', contentType: 'space_event' })
      ].map(c => service.calculateRelevance(c, defaultContext).getValue());

      const percentage = service.calculateToolContentPercentage(items);
      expect(percentage).toBe(50); // 2 out of 4
    });
  });

  describe('custom configuration', () => {
    it('should allow custom weights', () => {
      const customService = new FeedRankingService({
        weights: {
          spaceEngagement: 0.5, // Heavy weight on space engagement
          contentRecency: 0.1,
          contentQuality: 0.1,
          toolInteractionValue: 0.1,
          socialSignals: 0.05,
          creatorInfluence: 0.05,
          diversityFactor: 0.05,
          temporalRelevance: 0.05
        }
      });

      const config = customService.getConfig();
      expect(config.weights.spaceEngagement).toBe(0.5);
    });

    it('should allow custom tool content bonus', () => {
      const highBonusService = new FeedRankingService({
        toolContentBonus: 50 // Higher bonus
      });

      const toolPost = createCandidate({ contentType: 'tool_generated' });
      const result = highBonusService.calculateRelevance(toolPost, defaultContext);

      // Quality should be higher due to larger bonus
      expect(result.getValue().factors.contentQuality).toBeGreaterThanOrEqual(100);
    });

    it('should return config via getConfig()', () => {
      const config = service.getConfig();
      expect(config).toBeDefined();
      expect(config.weights).toBeDefined();
      expect(config.maxContentAgeHours).toBeDefined();
    });
  });
});
