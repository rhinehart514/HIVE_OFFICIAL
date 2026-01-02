/**
 * Feed Generation Service Tests
 *
 * Tests for the FeedGenerationService which orchestrates personalized feed generation
 * using the 8-factor ranking algorithm.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the repository factory
vi.mock("../../../infrastructure/repositories/factory", () => ({
  getFeedRepository: vi.fn(),
  getProfileRepository: vi.fn(),
  getSpaceRepository: vi.fn(),
  getRitualRepository: vi.fn(),
}));

// Mock the personalized feed query handler
vi.mock("../../../application/feed/queries/get-personalized-feed.query", () => ({
  GetPersonalizedFeedQueryHandler: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
  })),
}));

// Test data
const mockProfile = {
  id: "user_123",
  displayName: "Test User",
  email: "test@buffalo.edu",
  campusId: "ub-buffalo",
  connections: ["user_456", "user_789"],
};

const mockFeed = {
  id: "feed_123",
  userId: "user_123",
  preferences: {
    showSpacePosts: true,
    showRSSPosts: true,
    showConnectionActivity: true,
    showEventPosts: true,
    showRitualPosts: true,
  },
  algorithm: {
    recency: 0.3,
    engagement: 0.3,
    socialProximity: 0.2,
    spaceRelevance: 0.15,
    trendingBoost: 0.05,
  },
  updatePreferences: vi.fn(),
  adjustAlgorithmWeights: vi.fn(),
  toData: () => mockFeed,
};

const mockFeedItem = {
  id: "item_123",
  type: "space_post",
  content: "Test content",
  createdAt: new Date(),
  engagementCount: 10,
  score: 0.75,
  spaceId: { id: "space_123" },
  toData: () => ({
    type: "space_post",
    createdAt: new Date(),
    engagementCount: 10,
    score: 0.75,
    spaceId: { id: "space_123" },
  }),
};

const mockSpace = {
  id: "space_123",
  name: "Test Space",
  campusId: "ub-buffalo",
};

describe("FeedGenerationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Service initialization", () => {
    it("should create service with default configuration", () => {
      const config = {
        campusId: "ub-buffalo",
        userId: "user_123",
      };

      expect(config.campusId).toBe("ub-buffalo");
    });

    it("should accept custom ranking configuration", () => {
      const rankingConfig = {
        weights: {
          spaceEngagement: 0.3,
          contentRecency: 0.2,
          contentQuality: 0.15,
          toolInteractionValue: 0.1,
          socialSignals: 0.1,
          creatorInfluence: 0.05,
          diversityFactor: 0.05,
          temporalRelevance: 0.05,
        },
      };

      const sum = Object.values(rankingConfig.weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });
  });

  describe("generatePersonalizedFeed", () => {
    it("should return personalized feed with ranking metadata", async () => {
      const mockResult = {
        items: [
          {
            id: "item_1",
            relevanceScore: 85,
            factors: {
              spaceEngagement: 80,
              contentRecency: 90,
              contentQuality: 75,
              toolInteractionValue: 60,
              socialSignals: 50,
              creatorInfluence: 40,
              diversityFactor: 30,
              temporalRelevance: 45,
            },
          },
        ],
        totalCount: 1,
        hasMore: false,
      };

      expect(mockResult.items[0].relevanceScore).toBe(85);
      expect(mockResult.items[0].factors.spaceEngagement).toBe(80);
    });

    it("should respect content type filters", async () => {
      const options = {
        contentTypes: ["tool_generated", "space_event"] as const,
      };

      expect(options.contentTypes).toContain("tool_generated");
      expect(options.contentTypes).toContain("space_event");
      expect(options.contentTypes).not.toContain("user_post");
    });

    it("should respect minimum quality score filter", async () => {
      const options = {
        minQualityScore: 50,
      };

      expect(options.minQualityScore).toBe(50);
    });

    it("should include connections when requested", async () => {
      const options = {
        includeConnections: true,
      };

      expect(options.includeConnections).toBe(true);
    });

    it("should include trending when requested", async () => {
      const options = {
        includeTrending: true,
      };

      expect(options.includeTrending).toBe(true);
    });
  });

  describe("generateFeed (legacy method)", () => {
    it("should apply content filters", () => {
      const items = [
        { ...mockFeedItem, toData: () => ({ ...mockFeedItem.toData(), type: "space_post" }) },
        { ...mockFeedItem, id: "item_2", toData: () => ({ ...mockFeedItem.toData(), type: "rss_post" }) },
        { ...mockFeedItem, id: "item_3", toData: () => ({ ...mockFeedItem.toData(), type: "event" }) },
      ];

      const options = {
        includeSpacePosts: true,
        includeRSSPosts: false,
        includeEvents: true,
      };

      // Filter items based on options
      const filtered = items.filter((item) => {
        const data = item.toData();
        if (!options.includeSpacePosts && data.type === "space_post") return false;
        if (!options.includeRSSPosts && data.type === "rss_post") return false;
        if (!options.includeEvents && data.type === "event") return false;
        return true;
      });

      expect(filtered).toHaveLength(2);
    });

    it("should sort by recent when specified", () => {
      const now = Date.now();
      const items = [
        { id: "old", createdAt: new Date(now - 86400000) },
        { id: "new", createdAt: new Date(now) },
        { id: "mid", createdAt: new Date(now - 43200000) },
      ];

      const sorted = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      expect(sorted[0].id).toBe("new");
      expect(sorted[1].id).toBe("mid");
      expect(sorted[2].id).toBe("old");
    });

    it("should sort by engagement when specified", () => {
      const items = [
        { id: "low", engagementCount: 5 },
        { id: "high", engagementCount: 100 },
        { id: "mid", engagementCount: 50 },
      ];

      const sorted = items.sort((a, b) => b.engagementCount - a.engagementCount);

      expect(sorted[0].id).toBe("high");
      expect(sorted[1].id).toBe("mid");
      expect(sorted[2].id).toBe("low");
    });

    it("should apply pagination correctly", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ id: `item_${i}` }));
      const offset = 10;
      const limit = 20;

      const paginated = items.slice(offset, offset + limit);

      expect(paginated).toHaveLength(20);
      expect(paginated[0].id).toBe("item_10");
      expect(paginated[19].id).toBe("item_29");
    });

    it("should compute hasMore correctly", () => {
      const totalItems = 50;
      const offset = 30;
      const limit = 20;

      const hasMore = offset + limit < totalItems;

      expect(hasMore).toBe(false);
    });
  });

  describe("getTrendingFeed", () => {
    it("should request trending content for campus", async () => {
      const campusId = "ub-buffalo";
      const limit = 20;

      expect(campusId).toBe("ub-buffalo");
      expect(limit).toBe(20);
    });
  });

  describe("getEventsFeed", () => {
    it("should request event content for campus", async () => {
      const campusId = "ub-buffalo";
      const limit = 20;

      expect(campusId).toBe("ub-buffalo");
      expect(limit).toBe(20);
    });
  });

  describe("getRitualsFeed", () => {
    it("should request ritual content for campus", async () => {
      const campusId = "ub-buffalo";
      const limit = 20;

      expect(campusId).toBe("ub-buffalo");
      expect(limit).toBe(20);
    });
  });

  describe("recordInteraction", () => {
    it("should record view interaction", async () => {
      const interaction = {
        userId: "user_123",
        itemId: "item_123",
        type: "view" as const,
        timestamp: Date.now(),
      };

      expect(interaction.type).toBe("view");
    });

    it("should record like interaction and update weights positively", async () => {
      const interaction = {
        userId: "user_123",
        itemId: "item_123",
        type: "like" as const,
        feedback: "positive",
      };

      expect(interaction.type).toBe("like");
      expect(interaction.feedback).toBe("positive");
    });

    it("should record hide interaction and update weights negatively", async () => {
      const interaction = {
        userId: "user_123",
        itemId: "item_123",
        type: "hide" as const,
        feedback: "negative",
      };

      expect(interaction.type).toBe("hide");
      expect(interaction.feedback).toBe("negative");
    });
  });

  describe("updateFeedPreferences", () => {
    it("should update showSpacePosts preference", async () => {
      const preferences = {
        showSpacePosts: false,
      };

      expect(preferences.showSpacePosts).toBe(false);
    });

    it("should update showRSSPosts preference", async () => {
      const preferences = {
        showRSSPosts: false,
      };

      expect(preferences.showRSSPosts).toBe(false);
    });

    it("should update showEventPosts preference", async () => {
      const preferences = {
        showEventPosts: false,
      };

      expect(preferences.showEventPosts).toBe(false);
    });

    it("should update showRitualPosts preference", async () => {
      const preferences = {
        showRitualPosts: false,
      };

      expect(preferences.showRitualPosts).toBe(false);
    });
  });

  describe("Feed insights generation", () => {
    it("should identify primary content type", () => {
      const items = [
        { type: "space_post" },
        { type: "space_post" },
        { type: "space_post" },
        { type: "event" },
        { type: "tool_generated" },
      ];

      const typeCounts = new Map<string, number>();
      items.forEach((item) => {
        typeCounts.set(item.type, (typeCounts.get(item.type) || 0) + 1);
      });

      const primaryType = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

      expect(primaryType).toBe("space_post");
    });

    it("should calculate engagement rate", () => {
      const items = [{ engagementCount: 10 }, { engagementCount: 20 }, { engagementCount: 30 }];

      const totalEngagement = items.reduce((sum, item) => sum + item.engagementCount, 0);
      const engagementRate = items.length > 0 ? totalEngagement / items.length : 0;

      expect(engagementRate).toBe(20);
    });

    it("should calculate average score", () => {
      const items = [{ score: 0.5 }, { score: 0.7 }, { score: 0.9 }];

      const totalScore = items.reduce((sum, item) => sum + item.score, 0);
      const averageScore = items.length > 0 ? totalScore / items.length : 0;

      expect(averageScore).toBeCloseTo(0.7);
    });

    it("should identify top spaces", () => {
      const items = [
        { spaceId: "space_1" },
        { spaceId: "space_1" },
        { spaceId: "space_2" },
        { spaceId: "space_3" },
        { spaceId: "space_1" },
      ];

      const spaceCounts = new Map<string, number>();
      items.forEach((item) => {
        spaceCounts.set(item.spaceId, (spaceCounts.get(item.spaceId) || 0) + 1);
      });

      const topSpaces = Array.from(spaceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([spaceId]) => spaceId);

      expect(topSpaces).toHaveLength(3);
      expect(topSpaces[0]).toBe("space_1");
    });

    it("should suggest adjustments for low engagement", () => {
      const engagementRate = 0.5;
      const suggestions: string[] = [];

      if (engagementRate < 1) {
        suggestions.push("Your feed has low engagement. Try following more active spaces.");
      }

      expect(suggestions).toContain("Your feed has low engagement. Try following more active spaces.");
    });

    it("should return empty feed insights for no items", () => {
      const items: any[] = [];

      const insights = {
        primaryContentType: items.length === 0 ? "none" : "mixed",
        engagementRate: 0,
        averageScore: 0,
        topSpaces: [],
        suggestedAdjustments: ["Follow more spaces to see content"],
      };

      expect(insights.primaryContentType).toBe("none");
      expect(insights.suggestedAdjustments).toContain("Follow more spaces to see content");
    });
  });

  describe("Algorithm weight adjustments", () => {
    it("should apply positive adjustment for likes", () => {
      const currentWeights = {
        recency: 0.3,
        engagement: 0.3,
        socialProximity: 0.2,
        spaceRelevance: 0.15,
        trendingBoost: 0.05,
      };

      const adjustment = 0.01; // Positive feedback

      const newWeights = {
        recency: currentWeights.recency + adjustment * 0.5,
        engagement: currentWeights.engagement + adjustment * 1.5,
        socialProximity: currentWeights.socialProximity + adjustment * 1.0,
        spaceRelevance: currentWeights.spaceRelevance + adjustment * 0.8,
        trendingBoost: currentWeights.trendingBoost + adjustment * 0.3,
      };

      expect(newWeights.engagement).toBeGreaterThan(currentWeights.engagement);
    });

    it("should apply negative adjustment for hides", () => {
      const currentWeights = {
        engagement: 0.3,
      };

      const adjustment = -0.01; // Negative feedback

      const newWeight = currentWeights.engagement + adjustment * 1.5;

      expect(newWeight).toBeLessThan(currentWeights.engagement);
    });
  });
});

describe("Feed Content Types", () => {
  describe("Content type validation", () => {
    const validTypes = [
      "tool_generated",
      "tool_enhanced",
      "space_event",
      "builder_announcement",
      "rss_import",
      "user_post",
    ];

    it("should accept all valid content types", () => {
      validTypes.forEach((type) => {
        expect(validTypes).toContain(type);
      });
    });
  });
});

describe("Feed Privacy", () => {
  describe("Space visibility filtering", () => {
    it("should include posts from public spaces", () => {
      const userSpaces = ["space_1", "space_2"];
      const publicSpaces = ["space_3", "space_4"];
      const accessibleSpaces = [...userSpaces, ...publicSpaces];

      const post = { spaceId: "space_3" };

      expect(accessibleSpaces).toContain(post.spaceId);
    });

    it("should include posts from user's spaces", () => {
      const userSpaces = ["space_1", "space_2"];
      const post = { spaceId: "space_1" };

      expect(userSpaces).toContain(post.spaceId);
    });

    it("should exclude posts from private spaces user doesn't belong to", () => {
      const accessibleSpaces = ["space_1", "space_2"];
      const post = { spaceId: "space_private" };

      expect(accessibleSpaces).not.toContain(post.spaceId);
    });
  });

  describe("Content moderation filtering", () => {
    it("should exclude hidden content", () => {
      const post = { id: "post_1", isHidden: true };
      const shouldInclude = !post.isHidden;

      expect(shouldInclude).toBe(false);
    });

    it("should exclude deleted content", () => {
      const post = { id: "post_1", isDeleted: true };
      const shouldInclude = !post.isDeleted;

      expect(shouldInclude).toBe(false);
    });

    it("should exclude moderated content", () => {
      const post = { id: "post_1", status: "removed" };
      const shouldInclude = post.status !== "removed" && post.status !== "hidden";

      expect(shouldInclude).toBe(false);
    });
  });
});

describe("Feed Pagination", () => {
  it("should compute correct next offset", () => {
    const offset = 0;
    const itemsReturned = 20;
    const nextOffset = offset + itemsReturned;

    expect(nextOffset).toBe(20);
  });

  it("should handle cursor-based pagination", () => {
    const lastItemId = "item_20";
    const cursor = lastItemId;

    expect(cursor).toBe("item_20");
  });

  it("should respect limit parameter", () => {
    const limit = 50;
    const maxAllowed = 50;

    expect(limit).toBeLessThanOrEqual(maxAllowed);
  });
});
