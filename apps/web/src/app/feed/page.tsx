"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  _Badge,
  Avatar,
} from "@hive/ui";
import {
  Activity,
  Plus,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { ErrorBoundary } from "../../components/error-boundary";
import { formatDistanceToNow } from "date-fns";

// =============================================================================
// TYPES
// =============================================================================

interface FeedPost {
  id: string;
  type: "post" | "event" | "tool" | "system";
  content: string;
  authorId: string;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  spaceId?: string;
  spaceName?: string;
  createdAt: string;
  updatedAt: string;
  reactions?: {
    heart?: number;
    comments?: number;
    shares?: number;
  };
  tags?: string[];
  isLiked?: boolean;
  isPinned?: boolean;
  // Event-specific
  eventDate?: string;
  eventLocation?: string;
  eventCapacity?: number;
  eventAttendees?: number;
  // Tool-specific
  toolInstalls?: number;
  toolRating?: number;
  toolCategory?: string;
}

interface FeedResponse {
  success: boolean;
  posts: FeedPost[];
  pagination: {
    limit: number;
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
  };
}

type FilterType = "all" | "following" | "spaces" | "events";

// =============================================================================
// FEED PAGE COMPONENT
// =============================================================================

export default function FeedPage() {
  // State
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [_showComposer, setShowComposer] = useState(false);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchFeed = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setPosts([]);
        setCursor(undefined);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const params = new URLSearchParams({
        limit: "20",
        type: filter === "following" ? "all" : filter,
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
        setPosts(prev => [...prev, ...data.posts]);
      }

      setCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filter, cursor]);

  // Initial load and filter changes
  useEffect(() => {
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // =============================================================================
  // RENDER POST CARD
  // =============================================================================

  const renderPostCard = (post: FeedPost) => {
    const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

    return (
      <Card
        key={post.id}
        className="p-4 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] hover:border-[var(--hive-border-hover)] transition-colors"
      >
        {/* Author row */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10">
            {post.authorAvatar ? (
              <img src={post.authorAvatar} alt={post.authorName || "User"} className="rounded-full" />
            ) : (
              <div className="h-full w-full bg-[var(--hive-background-tertiary)] rounded-full flex items-center justify-center text-sm font-medium text-[var(--hive-text-primary)]">
                {(post.authorName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--hive-text-primary)] truncate">
                {post.authorName || "Unknown"}
              </span>
              {post.authorHandle && (
                <span className="text-[var(--hive-text-tertiary)] text-sm truncate">
                  @{post.authorHandle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--hive-text-tertiary)]">
              <span>{timeAgo}</span>
              {post.spaceName && (
                <>
                  <span>•</span>
                  <span className="text-[var(--hive-text-secondary)]">{post.spaceName}</span>
                </>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <p className="text-[var(--hive-text-primary)] whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-[var(--hive-background-tertiary)] text-[var(--hive-text-secondary)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-[var(--hive-border-default)]">
          <Button
            variant="ghost"
            size="sm"
            className={`flex-1 h-9 ${post.isLiked ? 'text-[var(--hive-brand-primary)]' : 'text-[var(--hive-text-tertiary)]'}`}
            onClick={() => handleLike(post.id)}
          >
            <Heart className={`h-4 w-4 mr-1.5 ${post.isLiked ? 'fill-current' : ''}`} />
            {post.reactions?.heart || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-9 text-[var(--hive-text-tertiary)]"
            onClick={() => handleComment(post.id)}
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            {post.reactions?.comments || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-9 text-[var(--hive-text-tertiary)]"
            onClick={() => handleBookmark(post.id)}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-9 text-[var(--hive-text-tertiary)]"
            onClick={() => handleShare(post.id)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? {
            ...post,
            isLiked: !post.isLiked,
            reactions: {
              ...post.reactions,
              heart: (post.reactions?.heart || 0) + (post.isLiked ? -1 : 1)
            }
          }
        : post
    ));

    try {
      await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "heart" }),
      });
    } catch {
      // Revert on error
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              reactions: {
                ...post.reactions,
                heart: (post.reactions?.heart || 0) + (post.isLiked ? 1 : -1)
              }
            }
          : post
      ));
    }
  };

  const handleComment = (postId: string) => {
    // Navigate to post detail or open comment modal
    window.location.href = `/posts/${postId}#comments`;
  };

  const handleBookmark = async (postId: string) => {
    try {
      await fetch(`/api/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/posts/${postId}`;
    if (navigator.share) {
      navigator.share({ url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const _handlePostCreated = () => {
    setShowComposer(false);
    fetchFeed(true);
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--hive-background-primary)]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[var(--hive-background-primary)]/95 backdrop-blur-sm border-b border-[var(--hive-border-default)]">
          <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
            {/* Title row */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[var(--hive-text-primary)] mb-1">Your Feed</h1>
                <p className="text-sm text-[var(--hive-text-secondary)]">
                  {posts.length > 0 ? `${posts.length} posts from your campus` : 'Stay connected with your campus'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchFeed(true)}
                  className="text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)]"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>

                <Button
                  className="bg-white text-black hover:bg-neutral-100 font-semibold"
                  size="sm"
                  onClick={() => setShowComposer(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Post
                </Button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
              {[
                { id: "all", label: "All Posts" },
                { id: "following", label: "Following" },
                { id: "spaces", label: "My Spaces" },
                { id: "events", label: "Events" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as FilterType)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-[var(--hive-text-primary)] text-[var(--hive-background-primary)]'
                      : 'bg-[var(--hive-background-secondary)] text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Feed content */}
        <main className="max-w-3xl mx-auto px-4 py-6">
          {error ? (
            <Card className="p-8 text-center bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
              <p className="text-[var(--hive-status-error)] mb-4">{error}</p>
              <Button onClick={() => fetchFeed(true)} variant="secondary">
                Try Again
              </Button>
            </Card>
          ) : posts.length === 0 && !isLoading ? (
            <Card className="p-12 text-center bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--hive-background-tertiary)] flex items-center justify-center">
                <Activity className="h-6 w-6 text-[var(--hive-text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-2">No Posts Yet</h3>
              <p className="text-[var(--hive-text-secondary)] mb-6">
                Join some spaces to see posts in your feed, or create the first post!
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  className="bg-white text-black hover:bg-neutral-100"
                  onClick={() => window.location.href = "/spaces"}
                >
                  Browse Spaces
                </Button>
                <Button variant="secondary" onClick={() => setShowComposer(true)}>
                  Create Post
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map(renderPostCard)}

              {/* Load more */}
              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    variant="secondary"
                    onClick={() => fetchFeed(false)}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-4 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] animate-pulse">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--hive-background-tertiary)]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 bg-[var(--hive-background-tertiary)] rounded" />
                          <div className="h-3 w-16 bg-[var(--hive-background-tertiary)] rounded" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-[var(--hive-background-tertiary)] rounded" />
                        <div className="h-4 w-3/4 bg-[var(--hive-background-tertiary)] rounded" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* TODO: Add FeedComposerSheet when props are aligned */}
      </div>
    </ErrorBoundary>
  );
}
