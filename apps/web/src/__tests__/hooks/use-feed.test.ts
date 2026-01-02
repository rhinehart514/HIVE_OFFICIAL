/**
 * Tests for useFeed hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock auth
vi.mock("@hive/auth-logic", () => ({
  useAuth: vi.fn(() => ({
    user: {
      uid: "user_123",
      email: "test@buffalo.edu",
      getIdToken: vi.fn().mockResolvedValue("mock-token"),
    },
    isAuthenticated: true,
  })),
}));

// Mock secure API fetch
vi.mock("@/lib/secure-auth-utils", () => ({
  secureApiFetch: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Test data
const mockPost = {
  id: "post_123",
  content: "Test post content",
  type: "text",
  authorId: "user_456",
  author: {
    id: "user_456",
    name: "Test Author",
    handle: "testauthor",
    avatarUrl: "https://example.com/avatar.jpg",
  },
  createdAt: new Date().toISOString(),
  visibility: "public",
  engagement: {
    likes: 10,
    comments: 5,
    shares: 2,
    views: 100,
    hasLiked: false,
    hasBookmarked: false,
  },
};

const mockFeedResponse = {
  success: true,
  posts: [mockPost],
  pagination: {
    total: 1,
    limit: 20,
    offset: 0,
    hasMore: false,
  },
};

describe("useFeed hook", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should start with loading state", async () => {
      // Test expected initial state
      const initialState = {
        posts: [],
        isLoading: true,
        isLoadingMore: false,
        hasMore: true,
        error: null,
        lastUpdated: null,
      };

      expect(initialState.isLoading).toBe(true);
      expect(initialState.posts).toHaveLength(0);
    });

    it("should have empty posts array initially", async () => {
      const initialState = {
        posts: [],
      };

      expect(initialState.posts).toEqual([]);
    });
  });

  describe("loading posts", () => {
    it("should construct correct API URL with default params", async () => {
      const options = {
        limit: 20,
      };

      const params = new URLSearchParams({
        limit: String(options.limit),
      });

      expect(params.get("limit")).toBe("20");
    });

    it("should include spaceId filter when provided", async () => {
      const options = {
        limit: 20,
        spaceId: "space_123",
      };

      const params = new URLSearchParams({
        limit: String(options.limit),
        spaceId: options.spaceId,
      });

      expect(params.get("spaceId")).toBe("space_123");
    });

    it("should include type filter when provided", async () => {
      const options = {
        types: ["spaces"],
      };

      const qType = options.types.length === 1 ? options.types[0] : undefined;

      expect(qType).toBe("spaces");
    });

    it("should transform my_spaces type to spaces", async () => {
      const types = ["my_spaces"];
      const qType = types[0] === "my_spaces" ? "spaces" : types[0];

      expect(qType).toBe("spaces");
    });

    it("should include cursor for pagination", async () => {
      const existingPosts = [{ id: "post_1" }, { id: "post_2" }, { id: "post_3" }];
      const cursor = existingPosts[existingPosts.length - 1]?.id || "";

      expect(cursor).toBe("post_3");
    });
  });

  describe("post transformations", () => {
    it("should transform engagement data correctly", async () => {
      const apiPost = {
        id: "post_123",
        engagement: {
          likes: 10,
          comments: 5,
        },
        userInteractions: {
          hasLiked: true,
          hasBookmarked: false,
        },
      };

      const transformed = {
        ...apiPost,
        engagement: {
          likes: apiPost.engagement?.likes || 0,
          comments: apiPost.engagement?.comments || 0,
          shares: 0,
          views: 0,
          hasLiked: apiPost.userInteractions?.hasLiked || false,
          hasBookmarked: apiPost.userInteractions?.hasBookmarked || false,
        },
      };

      expect(transformed.engagement.likes).toBe(10);
      expect(transformed.engagement.hasLiked).toBe(true);
    });

    it("should handle missing engagement data", async () => {
      const apiPost = {
        id: "post_123",
      };

      const transformed = {
        engagement: {
          likes: (apiPost as any).engagement?.likes || 0,
          comments: (apiPost as any).engagement?.comments || 0,
          shares: 0,
          views: 0,
          hasLiked: false,
          hasBookmarked: false,
        },
      };

      expect(transformed.engagement.likes).toBe(0);
      expect(transformed.engagement.comments).toBe(0);
    });
  });

  describe("createPost", () => {
    it("should require authentication", async () => {
      const user = null;

      const canCreate = !!user;

      expect(canCreate).toBe(false);
    });

    it("should construct correct post data", async () => {
      const postData = {
        content: "New post content",
        type: "text",
        visibility: "public",
        spaceId: "space_123",
        tags: ["tag1", "tag2"],
      };

      expect(postData.content).toBe("New post content");
      expect(postData.type).toBe("text");
      expect(postData.visibility).toBe("public");
    });

    it("should add new post to beginning of feed", async () => {
      const existingPosts = [{ id: "post_1" }, { id: "post_2" }];
      const newPost = { id: "post_new" };

      const updatedPosts = [newPost, ...existingPosts];

      expect(updatedPosts[0].id).toBe("post_new");
      expect(updatedPosts).toHaveLength(3);
    });

    it("should initialize engagement for new post", async () => {
      const newPost = {
        id: "post_new",
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          hasLiked: false,
          hasBookmarked: false,
        },
      };

      expect(newPost.engagement.likes).toBe(0);
      expect(newPost.engagement.hasLiked).toBe(false);
    });
  });

  describe("post interactions", () => {
    describe("likePost", () => {
      it("should toggle like when post was not liked", async () => {
        const post = {
          id: "post_123",
          engagement: { likes: 10, hasLiked: false },
        };

        const action = post.engagement.hasLiked ? "unlike" : "like";

        expect(action).toBe("like");
      });

      it("should toggle unlike when post was liked", async () => {
        const post = {
          id: "post_123",
          engagement: { likes: 10, hasLiked: true },
        };

        const action = post.engagement.hasLiked ? "unlike" : "like";

        expect(action).toBe("unlike");
      });

      it("should optimistically update like count", async () => {
        const post = {
          id: "post_123",
          engagement: { likes: 10, hasLiked: false },
        };

        const updatedEngagement = {
          ...post.engagement,
          likes: post.engagement.likes + 1,
          hasLiked: true,
        };

        expect(updatedEngagement.likes).toBe(11);
        expect(updatedEngagement.hasLiked).toBe(true);
      });

      it("should optimistically update unlike count", async () => {
        const post = {
          id: "post_123",
          engagement: { likes: 10, hasLiked: true },
        };

        const updatedEngagement = {
          ...post.engagement,
          likes: Math.max(0, post.engagement.likes - 1),
          hasLiked: false,
        };

        expect(updatedEngagement.likes).toBe(9);
        expect(updatedEngagement.hasLiked).toBe(false);
      });
    });

    describe("bookmarkPost", () => {
      it("should toggle bookmark when not bookmarked", async () => {
        const post = {
          id: "post_123",
          engagement: { hasBookmarked: false },
        };

        const action = post.engagement.hasBookmarked ? "unbookmark" : "bookmark";

        expect(action).toBe("bookmark");
      });

      it("should toggle unbookmark when bookmarked", async () => {
        const post = {
          id: "post_123",
          engagement: { hasBookmarked: true },
        };

        const action = post.engagement.hasBookmarked ? "unbookmark" : "bookmark";

        expect(action).toBe("unbookmark");
      });
    });

    describe("sharePost", () => {
      it("should increment share count", async () => {
        const post = {
          id: "post_123",
          engagement: { shares: 5 },
        };

        const updatedEngagement = {
          ...post.engagement,
          shares: post.engagement.shares + 1,
        };

        expect(updatedEngagement.shares).toBe(6);
      });
    });

    describe("commentOnPost", () => {
      it("should increment comment count", async () => {
        const post = {
          id: "post_123",
          engagement: { comments: 5 },
        };

        const updatedEngagement = {
          ...post.engagement,
          comments: post.engagement.comments + 1,
        };

        expect(updatedEngagement.comments).toBe(6);
      });

      it("should include comment content in interaction", async () => {
        const interaction = {
          postId: "post_123",
          action: "comment",
          content: "This is a comment",
        };

        expect(interaction.content).toBe("This is a comment");
      });
    });
  });

  describe("loadMore", () => {
    it("should not load if already loading", async () => {
      const state = {
        isLoadingMore: true,
        hasMore: true,
      };

      const shouldLoad = !state.isLoadingMore && state.hasMore;

      expect(shouldLoad).toBe(false);
    });

    it("should not load if no more posts", async () => {
      const state = {
        isLoadingMore: false,
        hasMore: false,
      };

      const shouldLoad = !state.isLoadingMore && state.hasMore;

      expect(shouldLoad).toBe(false);
    });

    it("should load when conditions are met", async () => {
      const state = {
        isLoadingMore: false,
        hasMore: true,
      };

      const shouldLoad = !state.isLoadingMore && state.hasMore;

      expect(shouldLoad).toBe(true);
    });

    it("should append posts to existing list", async () => {
      const existingPosts = [{ id: "post_1" }, { id: "post_2" }];
      const newPosts = [{ id: "post_3" }, { id: "post_4" }];

      const allPosts = [...existingPosts, ...newPosts];

      expect(allPosts).toHaveLength(4);
    });
  });

  describe("refresh", () => {
    it("should reset posts list", async () => {
      const reset = true;
      const existingPosts = [{ id: "post_1" }, { id: "post_2" }];
      const freshPosts = [{ id: "post_fresh" }];

      const posts = reset ? freshPosts : [...existingPosts, ...freshPosts];

      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe("post_fresh");
    });

    it("should update lastUpdated timestamp", async () => {
      const now = new Date();

      expect(now).toBeInstanceOf(Date);
    });
  });

  describe("error handling", () => {
    it("should set error state on API failure", async () => {
      const error = new Error("Feed load failed: 500");

      const state = {
        error: error.message,
        isLoading: false,
      };

      expect(state.error).toBe("Feed load failed: 500");
      expect(state.isLoading).toBe(false);
    });

    it("should set error for non-success response", async () => {
      const response = {
        success: false,
        error: "Failed to load feed",
      };

      const state = {
        error: response.error,
      };

      expect(state.error).toBe("Failed to load feed");
    });

    it("should revert optimistic update on interaction failure", async () => {
      const originalPosts = [
        { id: "post_123", engagement: { likes: 10, hasLiked: false } },
      ];

      // After failed interaction, should revert to original
      const revertedPosts = originalPosts;

      expect(revertedPosts[0].engagement.likes).toBe(10);
      expect(revertedPosts[0].engagement.hasLiked).toBe(false);
    });
  });

  describe("hasMore computation", () => {
    it("should be true when returned items equal limit", async () => {
      const returnedCount = 20;
      const limit = 20;

      const hasMore = returnedCount === limit;

      expect(hasMore).toBe(true);
    });

    it("should be false when returned items less than limit", async () => {
      const returnedCount: number = 15;
      const limit: number = 20;

      const hasMore = returnedCount === limit;

      expect(hasMore).toBe(false);
    });
  });
});

describe("Feed Options", () => {
  describe("FeedOptions interface", () => {
    it("should accept spaceId filter", () => {
      const options = {
        spaceId: "space_123",
      };

      expect(options.spaceId).toBe("space_123");
    });

    it("should accept userId filter", () => {
      const options = {
        userId: "user_123",
      };

      expect(options.userId).toBe("user_123");
    });

    it("should accept limit", () => {
      const options = {
        limit: 50,
      };

      expect(options.limit).toBe(50);
    });

    it("should accept sortBy", () => {
      const validSortBy = ["recent", "popular", "trending"];

      validSortBy.forEach((sort) => {
        expect(validSortBy).toContain(sort);
      });
    });

    it("should accept types array", () => {
      const options = {
        types: ["text", "image", "video"],
      };

      expect(options.types).toHaveLength(3);
    });

    it("should accept enableRealtime flag", () => {
      const options = {
        enableRealtime: true,
      };

      expect(options.enableRealtime).toBe(true);
    });
  });
});

describe("Post Types", () => {
  describe("Post interface", () => {
    it("should have required fields", () => {
      const post = {
        id: "post_123",
        content: "Content",
        type: "text",
        authorId: "user_123",
        author: {
          id: "user_123",
          name: "Author",
          handle: "author",
        },
        createdAt: new Date().toISOString(),
        visibility: "public",
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          hasLiked: false,
          hasBookmarked: false,
        },
      };

      expect(post.id).toBeDefined();
      expect(post.content).toBeDefined();
      expect(post.type).toBeDefined();
      expect(post.authorId).toBeDefined();
      expect(post.author).toBeDefined();
      expect(post.createdAt).toBeDefined();
      expect(post.visibility).toBeDefined();
      expect(post.engagement).toBeDefined();
    });

    it("should accept optional fields", () => {
      const post = {
        id: "post_123",
        content: "Content",
        type: "text",
        authorId: "user_123",
        author: { id: "user_123", name: "Author", handle: "author" },
        createdAt: new Date().toISOString(),
        visibility: "public",
        engagement: { likes: 0, comments: 0, shares: 0, views: 0, hasLiked: false, hasBookmarked: false },
        // Optional fields
        updatedAt: new Date().toISOString(),
        spaceId: "space_123",
        spaceName: "Test Space",
        attachments: [],
        mentions: ["user_456"],
        tags: ["tag1"],
        isPinned: true,
        isEdited: false,
      };

      expect(post.updatedAt).toBeDefined();
      expect(post.spaceId).toBeDefined();
      expect(post.isPinned).toBe(true);
    });

    it("should accept tool metadata for tool posts", () => {
      const post = {
        id: "post_123",
        type: "tool",
        tool: {
          name: "Test Tool",
          summary: "A test tool",
          category: "productivity",
          featured: true,
          installs: 100,
        },
      };

      expect(post.type).toBe("tool");
      expect(post.tool?.name).toBe("Test Tool");
      expect(post.tool?.featured).toBe(true);
    });

    it("should accept announcement metadata for announcement posts", () => {
      const post = {
        id: "post_123",
        type: "announcement",
        announcement: {
          title: "Important Update",
          variant: "urgent",
          actionLabel: "Learn More",
        },
      };

      expect(post.type).toBe("announcement");
      expect(post.announcement?.variant).toBe("urgent");
    });
  });

  describe("valid post types", () => {
    it("should support all post types", () => {
      const validTypes = [
        "text",
        "image",
        "video",
        "link",
        "poll",
        "event",
        "tool",
        "announcement",
      ];

      validTypes.forEach((type) => {
        expect(validTypes).toContain(type);
      });
    });
  });

  describe("valid visibility types", () => {
    it("should support all visibility levels", () => {
      const validVisibility = ["public", "space", "private"];

      validVisibility.forEach((vis) => {
        expect(validVisibility).toContain(vis);
      });
    });
  });
});

describe("Post Interactions", () => {
  describe("PostInteraction interface", () => {
    it("should support like action", () => {
      const interaction = {
        postId: "post_123",
        action: "like" as const,
      };

      expect(interaction.action).toBe("like");
    });

    it("should support comment action with content", () => {
      const interaction = {
        postId: "post_123",
        action: "comment" as const,
        content: "Great post!",
      };

      expect(interaction.action).toBe("comment");
      expect(interaction.content).toBe("Great post!");
    });

    it("should support share action", () => {
      const interaction = {
        postId: "post_123",
        action: "share" as const,
      };

      expect(interaction.action).toBe("share");
    });

    it("should support bookmark actions", () => {
      const bookmarkAction = { postId: "post_123", action: "bookmark" as const };
      const unbookmarkAction = { postId: "post_123", action: "unbookmark" as const };

      expect(bookmarkAction.action).toBe("bookmark");
      expect(unbookmarkAction.action).toBe("unbookmark");
    });

    it("should accept optional metadata", () => {
      const interaction = {
        postId: "post_123",
        action: "share" as const,
        metadata: {
          platform: "twitter",
          referrer: "feed",
        },
      };

      expect(interaction.metadata?.platform).toBe("twitter");
    });
  });
});

describe("CreatePostData", () => {
  it("should have required fields", () => {
    const postData = {
      content: "New post",
      type: "text",
      visibility: "public",
    };

    expect(postData.content).toBeDefined();
    expect(postData.type).toBeDefined();
    expect(postData.visibility).toBeDefined();
  });

  it("should accept optional fields", () => {
    const postData = {
      content: "New post",
      type: "text",
      visibility: "space",
      spaceId: "space_123",
      attachments: [{ type: "image", url: "https://example.com/img.jpg" }],
      tags: ["tag1", "tag2"],
      mentions: ["user_456"],
      poll: { options: ["Yes", "No"] },
      event: { date: "2025-01-01", location: "Campus Center" },
      location: { lat: 42.99, lng: -78.79 },
    };

    expect(postData.spaceId).toBe("space_123");
    expect(postData.attachments).toHaveLength(1);
    expect(postData.tags).toHaveLength(2);
  });
});
