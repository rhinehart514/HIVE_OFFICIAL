"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FeedPageLayout,
  FeedCardPost,
  FeedCardEvent,
  type FeedItem,
  type FeedCardPostData,
} from "@hive/ui";
import { formatDistanceToNow } from "date-fns";
import { logger } from "@/lib/logger";

// =============================================================================
// TYPES
// =============================================================================

interface FeedPostAPI {
  id: string;
  type: "post" | "event" | "tool" | "system";
  content: string;
  authorId: string;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  spaceId?: string;
  spaceName?: string;
  spaceColor?: string;
  createdAt: string;
  updatedAt: string;
  reactions?: {
    heart?: number;
    comments?: number;
    shares?: number;
  };
  tags?: string[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
  // Event-specific
  eventDate?: string;
  eventLocation?: string;
  eventCapacity?: number;
  eventAttendees?: number;
}

interface FeedResponse {
  success: boolean;
  posts: FeedPostAPI[];
  pagination: {
    limit: number;
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
  };
}

type FilterType = "all" | "my_spaces" | "events";

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Transform API response to FeedItem format for virtualized list
 */
function transformToFeedItem(post: FeedPostAPI): FeedItem {
  return {
    id: post.id,
    type: post.type,
    data: post,
  };
}

/**
 * Transform API post to FeedCardPostData format
 */
function transformToPostCard(post: FeedPostAPI): FeedCardPostData {
  return {
    id: post.id,
    author: {
      id: post.authorId,
      name: post.authorName || "Unknown",
      avatarUrl: post.authorAvatar,
    },
    space: {
      id: post.spaceId || "",
      name: post.spaceName || "General",
      color: post.spaceColor,
    },
    content: {
      body: post.content,
      tags: post.tags,
    },
    stats: {
      upvotes: post.reactions?.heart || 0,
      comments: post.reactions?.comments || 0,
      isUpvoted: post.isLiked || false,
      isBookmarked: post.isBookmarked || false,
    },
    meta: {
      timeAgo: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
      isPinned: post.isPinned,
    },
  };
}

// =============================================================================
// FEED PAGE COMPONENT
// =============================================================================

export default function FeedPage() {
  // State
  const [posts, setPosts] = useState<FeedPostAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [_showComposer, setShowComposer] = useState(false);

  // Transform posts to FeedItems for virtualized list
  const feedItems = useMemo<FeedItem[]>(
    () => posts.map(transformToFeedItem),
    [posts]
  );

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchFeed = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsInitialLoad(true);
        setPosts([]);
        setCursor(undefined);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        limit: "20",
        type: filter === "my_spaces" ? "all" : filter,
      });

      if (!reset && cursor) {
        params.set("cursor", cursor);
      }

      const response = await fetch(`/api/feed?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status}`);
      }

      const data: FeedResponse = await response.json();

      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load feed"));
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [filter, cursor]);

  // Initial load and filter changes
  useEffect(() => {
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  const handleUpvote = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              reactions: {
                ...post.reactions,
                heart: (post.reactions?.heart || 0) + (post.isLiked ? -1 : 1),
              },
            }
          : post
      )
    );

    try {
      await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "heart" }),
      });
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                reactions: {
                  ...post.reactions,
                  heart: (post.reactions?.heart || 0) + (post.isLiked ? 1 : -1),
                },
              }
            : post
        )
      );
    }
  }, []);

  const handleComment = useCallback((postId: string) => {
    window.location.href = `/posts/${postId}#comments`;
  }, []);

  const handleBookmark = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, isBookmarked: !post.isBookmarked }
          : post
      )
    );

    try {
      await fetch(`/api/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
    } catch (err) {
      logger.error("Failed to bookmark", { component: "FeedPage" }, err instanceof Error ? err : undefined);
      // Revert on error
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, isBookmarked: !post.isBookmarked }
            : post
        )
      );
    }
  }, []);

  const handleShare = useCallback((postId: string) => {
    const url = `${window.location.origin}/posts/${postId}`;
    if (navigator.share) {
      navigator.share({ url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }, []);

  const handleOpenPost = useCallback((postId: string) => {
    window.location.href = `/posts/${postId}`;
  }, []);

  const handleSpaceClick = useCallback((spaceId: string) => {
    window.location.href = `/spaces/${spaceId}`;
  }, []);

  // =============================================================================
  // RENDER ITEM
  // =============================================================================

  const renderFeedItem = useCallback(
    (item: FeedItem, _index: number) => {
      const post = item.data as FeedPostAPI;

      // Render event cards differently
      if (item.type === "event" && post.eventDate) {
        return (
          <FeedCardEvent
            event={{
              id: post.id,
              title: post.content,
              coverImage: post.authorAvatar ? { type: 'image' as const, url: post.authorAvatar } : undefined,
              space: {
                id: post.spaceId || "",
                name: post.spaceName || "Event",
              },
              meta: {
                scheduleLabel: post.eventDate ? new Date(post.eventDate).toLocaleDateString() : "TBD",
                locationLabel: post.eventLocation || "TBD",
                status: new Date(post.eventDate) > new Date() ? "upcoming" : "past",
              },
              stats: {
                attendingCount: post.eventAttendees || 0,
                capacity: post.eventCapacity,
                isAttending: false,
              },
            }}
            onToggleRsvp={() => handleOpenPost(post.id)}
            onViewDetails={() => handleOpenPost(post.id)}
          />
        );
      }

      // Default: render as post card
      const postData = transformToPostCard(post);

      return (
        <FeedCardPost
          post={postData}
          onOpen={handleOpenPost}
          onSpaceClick={handleSpaceClick}
          onUpvote={handleUpvote}
          onComment={handleComment}
          onBookmark={handleBookmark}
          onShare={handleShare}
        />
      );
    },
    [handleOpenPost, handleSpaceClick, handleUpvote, handleComment, handleBookmark, handleShare]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <FeedPageLayout
      title="Your Feed"
      showComposer={true}
      onCompose={() => setShowComposer(true)}
      activeFilter={filter}
      onFilterChange={setFilter}
      feedItems={feedItems}
      renderFeedItem={renderFeedItem}
      onLoadMore={() => fetchFeed(false)}
      hasMore={hasMore}
      isLoading={isLoading}
      isInitialLoad={isInitialLoad}
      error={error}
      onRetry={() => fetchFeed(true)}
    />
  );
}
