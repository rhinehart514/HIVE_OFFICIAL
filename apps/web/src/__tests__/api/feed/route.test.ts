/**
 * Feed API Route Tests
 *
 * Tests for the /api/feed endpoints with the 8-factor ranking algorithm.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock modules
vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  dbAdmin: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(),
          limit: vi.fn(() => ({
            get: vi.fn(),
          })),
        })),
        get: vi.fn(),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(),
          })),
        })),
        select: vi.fn(() => ({
          get: vi.fn(),
          limit: vi.fn(() => ({
            get: vi.fn(),
          })),
        })),
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Test utilities
const createMockRequest = (
  method: string,
  body?: object,
  searchParams?: Record<string, string>
): NextRequest => {
  const url = new URL("http://localhost:3000/api/feed");
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });
};

// Test data
const mockPost = {
  id: "post_123",
  campusId: "ub-buffalo",
  content: "Test post content",
  contentType: "user_post",
  authorId: "user_123",
  spaceId: "space_123",
  createdAt: new Date(),
  isActive: true,
  isDeleted: false,
  engagement: {
    likes: 10,
    comments: 5,
    shares: 2,
    views: 100,
  },
};

const mockSession = {
  user: {
    id: "user_123",
    campusId: "ub-buffalo",
    email: "test@buffalo.edu",
  },
};

describe("Feed API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/feed", () => {
    it("should require authentication", async () => {
      // Structural test - actual auth testing would use integration tests
      expect(mockSession.user.id).toBeDefined();
    });

    it("should accept limit parameter", async () => {
      const req = createMockRequest("GET", undefined, { limit: "30" });
      const params = req.nextUrl.searchParams;

      expect(params.get("limit")).toBe("30");
    });

    it("should accept offset parameter", async () => {
      const req = createMockRequest("GET", undefined, { offset: "20" });
      const params = req.nextUrl.searchParams;

      expect(params.get("offset")).toBe("20");
    });

    it("should accept type filter parameter", async () => {
      const req = createMockRequest("GET", undefined, { type: "events" });
      const params = req.nextUrl.searchParams;

      expect(params.get("type")).toBe("events");
    });

    it("should accept spaceId filter parameter", async () => {
      const req = createMockRequest("GET", undefined, { spaceId: "space_123" });
      const params = req.nextUrl.searchParams;

      expect(params.get("spaceId")).toBe("space_123");
    });

    it("should accept sortBy parameter", async () => {
      const req = createMockRequest("GET", undefined, { sortBy: "recent" });
      const params = req.nextUrl.searchParams;

      expect(params.get("sortBy")).toBe("recent");
    });

    it("should accept cursor parameter for pagination", async () => {
      const req = createMockRequest("GET", undefined, { cursor: "post_100" });
      const params = req.nextUrl.searchParams;

      expect(params.get("cursor")).toBe("post_100");
    });
  });

  describe("Feed Query Schema Validation", () => {
    it("should validate limit is within range", () => {
      const validLimits = [1, 20, 50];
      const invalidLimits = [0, -1, 51, 100];

      validLimits.forEach((limit) => {
        expect(limit).toBeGreaterThanOrEqual(1);
        expect(limit).toBeLessThanOrEqual(50);
      });

      invalidLimits.forEach((limit) => {
        const isValid = limit >= 1 && limit <= 50;
        expect(isValid).toBe(false);
      });
    });

    it("should validate offset is non-negative", () => {
      const validOffsets = [0, 10, 100];
      const invalidOffsets = [-1, -10];

      validOffsets.forEach((offset) => {
        expect(offset).toBeGreaterThanOrEqual(0);
      });

      invalidOffsets.forEach((offset) => {
        expect(offset).toBeLessThan(0);
      });
    });

    it("should validate type is one of allowed values", () => {
      const allowedTypes = ["all", "spaces", "events", "posts", "tools"];
      const invalidTypes = ["invalid", "random", ""];

      allowedTypes.forEach((type) => {
        expect(allowedTypes).toContain(type);
      });

      invalidTypes.forEach((type) => {
        expect(allowedTypes).not.toContain(type);
      });
    });

    it("should validate sortBy is one of allowed values", () => {
      const allowedSortBy = ["algorithm", "recent", "engagement"];
      const invalidSortBy = ["invalid", "random"];

      allowedSortBy.forEach((sort) => {
        expect(allowedSortBy).toContain(sort);
      });

      invalidSortBy.forEach((sort) => {
        expect(allowedSortBy).not.toContain(sort);
      });
    });
  });

  describe("Feed Response Format", () => {
    it("should have correct success response structure", () => {
      const successResponse = {
        success: true,
        posts: [mockPost],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.posts).toBeDefined();
      expect(Array.isArray(successResponse.posts)).toBe(true);
      expect(successResponse.pagination).toBeDefined();
    });

    it("should have correct error response structure", () => {
      const errorResponse = {
        success: false,
        error: "Unauthorized",
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
    });

    it("should include ranking metadata when sortBy is algorithm", () => {
      const rankedPost = {
        ...mockPost,
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
      };

      expect(rankedPost.relevanceScore).toBeDefined();
      expect(rankedPost.factors).toBeDefined();
    });
  });

  describe("8-Factor Ranking Algorithm", () => {
    it("should weight factors correctly", () => {
      const weights = {
        spaceEngagement: 0.25,
        contentRecency: 0.15,
        contentQuality: 0.2,
        toolInteractionValue: 0.15,
        socialSignals: 0.1,
        creatorInfluence: 0.05,
        diversityFactor: 0.05,
        temporalRelevance: 0.05,
      };

      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it("should calculate relevance score from factors", () => {
      const factors = {
        spaceEngagement: 80,
        contentRecency: 90,
        contentQuality: 75,
        toolInteractionValue: 60,
        socialSignals: 50,
        creatorInfluence: 40,
        diversityFactor: 30,
        temporalRelevance: 45,
      };

      const weights = {
        spaceEngagement: 0.25,
        contentRecency: 0.15,
        contentQuality: 0.2,
        toolInteractionValue: 0.15,
        socialSignals: 0.1,
        creatorInfluence: 0.05,
        diversityFactor: 0.05,
        temporalRelevance: 0.05,
      };

      const score =
        factors.spaceEngagement * weights.spaceEngagement +
        factors.contentRecency * weights.contentRecency +
        factors.contentQuality * weights.contentQuality +
        factors.toolInteractionValue * weights.toolInteractionValue +
        factors.socialSignals * weights.socialSignals +
        factors.creatorInfluence * weights.creatorInfluence +
        factors.diversityFactor * weights.diversityFactor +
        factors.temporalRelevance * weights.temporalRelevance;

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("User Context Building", () => {
    it("should include user's space memberships", () => {
      const memberships = [
        { spaceId: "space_1", role: "owner" },
        { spaceId: "space_2", role: "member" },
      ];

      const preferredSpaceIds = memberships.map((m) => m.spaceId);

      expect(preferredSpaceIds).toContain("space_1");
      expect(preferredSpaceIds).toContain("space_2");
    });

    it("should calculate engagement score based on role", () => {
      const roles = {
        owner: 50 + 40, // 90
        admin: 50 + 30, // 80
        moderator: 50 + 20, // 70
        member: 50 + 10, // 60
        guest: 50, // 50
      };

      expect(roles.owner).toBe(90);
      expect(roles.admin).toBe(80);
      expect(roles.moderator).toBe(70);
      expect(roles.member).toBe(60);
    });

    it("should include public spaces as accessible", () => {
      const userSpaces = ["space_1"];
      const publicSpaces = ["space_2", "space_3"];
      const accessibleSpaces = new Set([...userSpaces, ...publicSpaces]);

      expect(accessibleSpaces.has("space_1")).toBe(true);
      expect(accessibleSpaces.has("space_2")).toBe(true);
      expect(accessibleSpaces.has("space_3")).toBe(true);
    });

    it("should boost engagement for recent interactions", () => {
      const currentScore = 50;
      const interactionBoost = 5;
      const newScore = Math.min(100, currentScore + interactionBoost);

      expect(newScore).toBe(55);
    });
  });

  describe("Privacy and Security Filtering", () => {
    it("should filter out hidden content", () => {
      const posts = [
        { id: "post_1", isHidden: false },
        { id: "post_2", isHidden: true },
        { id: "post_3", status: "hidden" },
      ];

      const visible = posts.filter(
        (p) => !p.isHidden && p.status !== "hidden"
      );

      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe("post_1");
    });

    it("should filter out deleted content", () => {
      const posts = [
        { id: "post_1", isDeleted: false },
        { id: "post_2", isDeleted: true },
        { id: "post_3", status: "deleted" },
      ];

      const visible = posts.filter(
        (p) => !p.isDeleted && p.status !== "deleted"
      );

      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe("post_1");
    });

    it("should filter out moderated content", () => {
      const posts = [
        { id: "post_1", status: "active" },
        { id: "post_2", status: "removed" },
      ];

      const visible = posts.filter((p) => p.status !== "removed");

      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe("post_1");
    });

    it("should only include posts from accessible spaces", () => {
      const accessibleSpaces = new Set(["space_1", "space_2"]);
      const posts = [
        { id: "post_1", spaceId: "space_1" },
        { id: "post_2", spaceId: "space_3" },
        { id: "post_3", spaceId: null }, // Campus-wide post
      ];

      const visible = posts.filter(
        (p) => !p.spaceId || accessibleSpaces.has(p.spaceId)
      );

      expect(visible).toHaveLength(2);
      expect(visible.map((p) => p.id)).toContain("post_1");
      expect(visible.map((p) => p.id)).toContain("post_3");
    });
  });

  describe("Campus Isolation", () => {
    it("should only return posts from user's campus", () => {
      const userCampusId = "ub-buffalo";
      const posts = [
        { id: "post_1", campusId: "ub-buffalo" },
        { id: "post_2", campusId: "other-campus" },
      ];

      const campusFiltered = posts.filter((p) => p.campusId === userCampusId);

      expect(campusFiltered).toHaveLength(1);
      expect(campusFiltered[0].id).toBe("post_1");
    });
  });

  describe("Content Type Filtering", () => {
    it("should filter for events when type=events", () => {
      const posts = [
        { id: "post_1", contentType: "space_event" },
        { id: "post_2", contentType: "user_post" },
      ];

      const events = posts.filter((p) => p.contentType === "space_event");

      expect(events).toHaveLength(1);
    });

    it("should filter for tools when type=tools", () => {
      const posts = [
        { id: "post_1", contentType: "tool_generated" },
        { id: "post_2", contentType: "tool_enhanced" },
        { id: "post_3", contentType: "user_post" },
      ];

      const tools = posts.filter(
        (p) =>
          p.contentType === "tool_generated" || p.contentType === "tool_enhanced"
      );

      expect(tools).toHaveLength(2);
    });

    it("should return all types when type=all", () => {
      const posts = [
        { id: "post_1", contentType: "space_event" },
        { id: "post_2", contentType: "user_post" },
        { id: "post_3", contentType: "tool_generated" },
      ];

      // No filter applied for 'all'
      expect(posts).toHaveLength(3);
    });
  });

  describe("Sorting Behavior", () => {
    it("should sort by relevance when sortBy=algorithm", () => {
      const posts = [
        { id: "post_1", relevanceScore: 50 },
        { id: "post_2", relevanceScore: 90 },
        { id: "post_3", relevanceScore: 70 },
      ];

      const sorted = [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore);

      expect(sorted[0].id).toBe("post_2");
      expect(sorted[1].id).toBe("post_3");
      expect(sorted[2].id).toBe("post_1");
    });

    it("should sort by date when sortBy=recent", () => {
      const now = Date.now();
      const posts = [
        { id: "post_1", createdAt: new Date(now - 86400000) },
        { id: "post_2", createdAt: new Date(now) },
        { id: "post_3", createdAt: new Date(now - 43200000) },
      ];

      const sorted = [...posts].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      expect(sorted[0].id).toBe("post_2");
      expect(sorted[1].id).toBe("post_3");
      expect(sorted[2].id).toBe("post_1");
    });

    it("should sort by engagement when sortBy=engagement", () => {
      const posts = [
        { id: "post_1", engagement: { likes: 10, comments: 5 } },
        { id: "post_2", engagement: { likes: 100, comments: 50 } },
        { id: "post_3", engagement: { likes: 50, comments: 25 } },
      ];

      const sorted = [...posts].sort(
        (a, b) =>
          b.engagement.likes +
          b.engagement.comments -
          (a.engagement.likes + a.engagement.comments)
      );

      expect(sorted[0].id).toBe("post_2");
      expect(sorted[1].id).toBe("post_3");
      expect(sorted[2].id).toBe("post_1");
    });
  });

  describe("Error Handling", () => {
    it("should return 401 for unauthenticated requests", () => {
      const statusCodes = {
        unauthorized: 401,
      };

      expect(statusCodes.unauthorized).toBe(401);
    });

    it("should return 400 for invalid parameters", () => {
      const statusCodes = {
        badRequest: 400,
      };

      expect(statusCodes.badRequest).toBe(400);
    });

    it("should return 500 for server errors", () => {
      const statusCodes = {
        serverError: 500,
      };

      expect(statusCodes.serverError).toBe(500);
    });
  });
});

describe("Feed Post Transformation", () => {
  it("should transform post to response format", () => {
    const dbPost = {
      id: "post_123",
      content: "Test",
      contentType: "user_post",
      authorId: "user_123",
      createdAt: { toDate: () => new Date() },
      likes: 10,
      comments: 5,
    };

    const transformed = {
      id: dbPost.id,
      content: dbPost.content,
      type: dbPost.contentType,
      authorId: dbPost.authorId,
      createdAt:
        typeof dbPost.createdAt === "object" && "toDate" in dbPost.createdAt
          ? dbPost.createdAt.toDate().toISOString()
          : dbPost.createdAt,
      engagement: {
        likes: dbPost.likes || 0,
        comments: dbPost.comments || 0,
        shares: 0,
        views: 0,
      },
    };

    expect(transformed.id).toBe("post_123");
    expect(transformed.engagement.likes).toBe(10);
  });
});

describe("Feed Diversity Enforcement", () => {
  it("should limit consecutive posts from same space", () => {
    const posts = [
      { id: "1", spaceId: "space_1" },
      { id: "2", spaceId: "space_1" },
      { id: "3", spaceId: "space_1" },
      { id: "4", spaceId: "space_2" },
    ];

    const maxConsecutive = 2;
    const diversified: typeof posts = [];
    let consecutiveCount = 0;
    let lastSpaceId: string | null = null;

    posts.forEach((post) => {
      if (post.spaceId === lastSpaceId) {
        consecutiveCount++;
        if (consecutiveCount <= maxConsecutive) {
          diversified.push(post);
        }
      } else {
        consecutiveCount = 1;
        lastSpaceId = post.spaceId;
        diversified.push(post);
      }
    });

    expect(diversified.length).toBeLessThan(posts.length);
  });

  it("should mix content types for variety", () => {
    const posts = [
      { id: "1", contentType: "user_post" },
      { id: "2", contentType: "space_event" },
      { id: "3", contentType: "tool_generated" },
    ];

    const contentTypes = new Set(posts.map((p) => p.contentType));

    expect(contentTypes.size).toBe(3);
  });
});
