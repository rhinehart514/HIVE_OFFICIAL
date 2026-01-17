"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Tabs, TabsList, TabsTrigger, Badge } from "@hive/ui";
import {
  SparklesIcon,
  ClockIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  FireIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@hive/auth-logic";
import { useToast } from "@/hooks/use-toast";

// Type definitions matching the API response
interface FeedPost {
  id: string;
  spaceId?: string;
  authorId: string;
  createdAt: string;
  contentType: 'user_post' | 'tool_generated' | 'tool_enhanced' | 'space_event' | 'builder_announcement' | 'rss_import';
  toolId?: string;
  content?: string;
  title?: string;
  hasMetadata?: boolean;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  authorRole?: string;
  relevanceScore?: number;
  qualityScore?: number;
  factors?: {
    spaceEngagement: number;
    contentRecency: number;
    contentQuality: number;
    toolInteractionValue: number;
    socialSignals: number;
    creatorInfluence: number;
    diversityFactor: number;
    temporalRelevance: number;
  };
  // Extended data from joins
  author?: {
    id: string;
    name: string;
    handle: string;
    avatar?: string;
    role?: string;
  };
  space?: {
    id: string;
    name: string;
    slug?: string;
  };
  tool?: {
    id: string;
    name: string;
  };
  // Client state
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface FeedResponse {
  success: boolean;
  posts: FeedPost[];
  pagination: {
    limit: number;
    offset?: number;
    nextOffset?: number;
    hasMore: boolean;
    totalCount?: number;
    cursor?: string;
    nextCursor?: string;
  };
  metadata?: {
    sortBy: string;
    algorithm: string;
    quality?: {
      averageRelevanceScore: number;
      diversityScore: number;
      toolContentPercentage: number;
    };
  };
}

// Activity Stream: No 'posts' filter - we only show space activity
type FeedFilter = 'all' | 'spaces' | 'events' | 'tools';
type SortMode = 'algorithm' | 'recent';

// Helpers
function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getContentTypeIcon(type: FeedPost['contentType']) {
  switch (type) {
    case 'space_event':
      return <CalendarIcon className="h-4 w-4" />;
    case 'tool_generated':
    case 'tool_enhanced':
      return <WrenchScrewdriverIcon className="h-4 w-4" />;
    case 'builder_announcement':
      return <SparklesIcon className="h-4 w-4" />;
    default:
      return null;
  }
}

function getContentTypeBadge(type: FeedPost['contentType']) {
  switch (type) {
    case 'space_event':
      return <Badge variant="secondary" className="text-xs">Event</Badge>;
    case 'tool_generated':
      return <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400">Tool</Badge>;
    case 'tool_enhanced':
      return <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-400">AI Enhanced</Badge>;
    case 'builder_announcement':
      return <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400">Announcement</Badge>;
    default:
      return null;
  }
}

// Activity Card Component - Simplified for Activity Stream (no social interactions)
function ActivityCard({
  post,
}: {
  post: FeedPost;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  // Derive info
  const spaceName = post.space?.name;
  const spaceSlug = post.space?.slug || post.spaceId;

  // Check if content should be truncated
  const content = post.content || post.title || '';
  const shouldTruncate = content.length > 280 && !expanded;
  const displayContent = shouldTruncate ? content.slice(0, 280) + '...' : content;

  // Navigate to source (space or event)
  const handleNavigate = () => {
    if (post.contentType === 'space_event' && post.spaceId) {
      router.push(`/spaces/${post.spaceId}/events`);
    } else if (post.spaceId) {
      router.push(`/spaces/${post.spaceId}`);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer"
      onClick={handleNavigate}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Content type icon */}
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
          {post.contentType === 'space_event' && <CalendarIcon className="h-5 w-5 text-life-gold" />}
          {(post.contentType === 'tool_generated' || post.contentType === 'tool_enhanced') && <WrenchScrewdriverIcon className="h-5 w-5 text-life-gold" />}
          {post.contentType === 'builder_announcement' && <SparklesIcon className="h-5 w-5 text-life-gold" />}
          {post.contentType === 'rss_import' && <ArrowTopRightOnSquareIcon className="h-5 w-5 text-life-gold" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {spaceName && (
              <span className="text-sm font-medium text-white">{spaceName}</span>
            )}
            <span className="text-sm text-white/40">·</span>
            <span className="text-sm text-white/40">{formatRelativeTime(post.createdAt)}</span>
          </div>

          {/* Content type label */}
          <span className="text-xs text-white/50">
            {post.contentType === 'space_event' && 'New event'}
            {post.contentType === 'tool_generated' && 'Tool output'}
            {post.contentType === 'tool_enhanced' && 'AI-enhanced content'}
            {post.contentType === 'builder_announcement' && 'Announcement'}
            {post.contentType === 'rss_import' && 'Shared link'}
          </span>
        </div>

        {/* Content type badge */}
        <div className="flex items-center gap-2">
          {getContentTypeBadge(post.contentType)}
        </div>
      </div>

      {/* Title (if present) */}
      {post.title && (
        <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
      )}

      {/* Content */}
      {displayContent && (
        <div className="mb-4">
          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="text-life-gold text-sm hover:underline mt-1"
            >
              Show more
            </button>
          )}
        </div>
      )}

      {/* Tool reference */}
      {post.tool && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/tools/${post.toolId}`);
          }}
          className="flex items-center gap-2 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
        >
          <WrenchScrewdriverIcon className="h-5 w-5 text-life-gold" />
          <span className="text-sm text-white/70">Built with <span className="text-white font-medium">{post.tool.name}</span></span>
        </div>
      )}

      {/* Ranking debug (only in dev) */}
      {process.env.NODE_ENV === 'development' && post.relevanceScore !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/[0.04] text-xs text-white/30">
          Score: {post.relevanceScore.toFixed(2)} | Quality: {post.qualityScore?.toFixed(2)}
        </div>
      )}
    </motion.article>
  );
}

// Sidebar Components
function TrendingSpaces({ spaces }: { spaces: { id: string; name: string; members: number }[] }) {
  return (
    <Card className="p-5 bg-white/[0.02] border-white/[0.06]">
      <h3 className="text-sm font-semibold text-white mb-4">Trending Spaces</h3>
      <div className="space-y-3">
        {spaces.map((space) => (
          <Link
            key={space.id}
            href={`/spaces/${space.id}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <span className="text-sm text-white/80">{space.name}</span>
            <span className="text-xs text-white/40">{formatCount(space.members)} members</span>
          </Link>
        ))}
      </div>
      <Link href="/spaces/browse" className="block mt-4 text-sm text-life-gold hover:underline">
        See all spaces →
      </Link>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card className="p-5 bg-white/[0.02] border-white/[0.06]">
      <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <Link
          href="/tools/create"
          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
        >
          <WrenchScrewdriverIcon className="h-5 w-5 text-life-gold" />
          <span className="text-sm text-white/80">Build a Tool</span>
        </Link>
        <Link
          href="/spaces/create"
          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
        >
          <UsersIcon className="h-5 w-5 text-life-gold" />
          <span className="text-sm text-white/80">Create a Space</span>
        </Link>
        <Link
          href="/events"
          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
        >
          <CalendarIcon className="h-5 w-5 text-life-gold" />
          <span className="text-sm text-white/80">Browse Events</span>
        </Link>
      </div>
    </Card>
  );
}


// Main Activity Stream Page
export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Feed state
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Filter state
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('algorithm');

  // Trending spaces state (fetched from API)
  const [trendingSpaces, setTrendingSpaces] = useState<{ id: string; name: string; members: number }[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Fetch trending spaces
  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch('/api/spaces/browse-v2?limit=5&sortBy=member_count', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.spaces) {
            setTrendingSpaces(
              data.spaces.slice(0, 5).map((s: { id: string; name: string; memberCount?: number }) => ({
                id: s.id,
                name: s.name,
                members: s.memberCount || 0,
              }))
            );
          }
        }
      } catch {
        // Silently fail - trending is non-critical
      } finally {
        setTrendingLoading(false);
      }
    }
    fetchTrending();
  }, []);

  // Fetch feed
  const fetchFeed = useCallback(async (reset = false) => {
    if (reset) {
      setIsLoading(true);
      setOffset(0);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: '20',
        offset: currentOffset.toString(),
        type: filter,
        sortBy: sortMode,
      });

      const response = await fetch(`/api/feed?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch feed');
      }

      const data: FeedResponse = await response.json();

      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setHasMore(data.pagination.hasMore);
      setOffset(data.pagination.nextOffset || currentOffset + data.posts.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load feed';
      setError(message);
      toast.error('Feed Error', message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filter, sortMode, offset, toast]);

  // Initial fetch
  useEffect(() => {
    if (!authLoading) {
      fetchFeed(true);
    }
  }, [authLoading, filter, sortMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchFeed(false);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, hasMore, isLoading, fetchFeed]
  );

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-white/[0.06] rounded" />
                      <div className="h-3 w-24 bg-white/[0.06] rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-white/[0.06] rounded" />
                    <div className="h-4 w-4/5 bg-white/[0.06] rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden lg:block space-y-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 h-48 animate-pulse" />
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 h-48 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">Activity Stream</p>
              <h1 className="text-2xl font-semibold text-white">
                {user?.displayName ? `Hey, ${user.displayName.split(' ')[0]}` : 'Activity'}
              </h1>
              <p className="text-sm text-white/60 mt-1">
                Events, announcements, and tools from your spaces
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort toggle */}
              <div className="flex items-center bg-white/[0.04] rounded-lg p-1">
                <Button
                  variant={sortMode === 'algorithm' ? 'brand' : 'ghost'}
                  size="sm"
                  onClick={() => setSortMode('algorithm')}
                  className="text-xs gap-1.5"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  For You
                </Button>
                <Button
                  variant={sortMode === 'recent' ? 'brand' : 'ghost'}
                  size="sm"
                  onClick={() => setSortMode('recent')}
                  className="text-xs gap-1.5"
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                  Recent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          {/* Feed column */}
          <div className="space-y-4">
            {/* Filter tabs - Activity Stream only (no Posts) */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FeedFilter)} className="w-full">
              <TabsList className="bg-white/[0.04]">
                <TabsTrigger value="all">All Activity</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="spaces">Spaces</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Error state */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-sm text-red-400 mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={() => fetchFeed(true)}>
                  Try again
                </Button>
              </div>
            )}

            {/* Activity Cards */}
            <AnimatePresence mode="popLayout">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <ActivityCard
                    key={post.id}
                    post={post}
                  />
                ))
              ) : !error ? (
                <div className="text-center py-12">
                  <FireIcon className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No activity yet</h3>
                  <p className="text-sm text-white/50 mb-6">
                    {filter === 'all'
                      ? 'Join some spaces to see activity in your stream'
                      : `No ${filter} activity to show right now`}
                  </p>
                  <Button asChild className="bg-life-gold text-ground hover:bg-life-gold/90">
                    <Link href="/spaces/browse">Browse Spaces</Link>
                  </Button>
                </div>
              ) : null}
            </AnimatePresence>

            {/* Load more indicator */}
            {hasMore && posts.length > 0 && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    <span className="text-sm text-white/40">Loading more...</span>
                  </div>
                ) : (
                  <span className="text-sm text-white/30">Scroll for more</span>
                )}
              </div>
            )}

            {/* End of feed */}
            {!hasMore && posts.length > 0 && (
              <div className="py-8 text-center border-t border-white/[0.06]">
                <p className="text-sm text-white/40">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-4">
            <QuickActions />
            {trendingLoading ? (
              <Card className="p-5 bg-white/[0.02] border-white/[0.06] animate-pulse">
                <div className="h-4 w-24 bg-white/[0.06] rounded mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-white/[0.06] rounded" />
                  ))}
                </div>
              </Card>
            ) : trendingSpaces.length > 0 ? (
              <TrendingSpaces spaces={trendingSpaces} />
            ) : (
              <Card className="p-5 bg-white/[0.02] border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white mb-2">Trending Spaces</h3>
                <p className="text-xs text-white/40">No trending spaces yet</p>
              </Card>
            )}
          </aside>
        </div>
      </main>

    </div>
  );
}
