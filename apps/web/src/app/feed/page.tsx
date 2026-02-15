'use client';

/**
 * /feed — Global Activity Feed
 *
 * Shows ALL activity across ALL spaces in one chronological stream.
 * Makes 50 users feel like 500. No auth required to view.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  CalendarPlus,
  Wrench,
  MessageSquare,
  Ticket,
  Sparkles,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';

interface FeedItem {
  id: string;
  type: 'member_joined' | 'event_created' | 'tool_deployed' | 'message_summary' | 'rsvp' | 'tool_created' | 'space_created';
  headline: string;
  detail?: string;
  spaceId?: string;
  spaceName?: string;
  spaceHandle?: string;
  actorName?: string;
  actorAvatarUrl?: string;
  toolId?: string;
  toolName?: string;
  eventId?: string;
  eventTitle?: string;
  timestamp: string;
}

const TYPE_CONFIG: Record<FeedItem['type'], { icon: typeof Users; color: string; bg: string }> = {
  member_joined: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  event_created: { icon: CalendarPlus, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  tool_deployed: { icon: Wrench, color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10' },
  tool_created: { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  message_summary: { icon: MessageSquare, color: 'text-white/50', bg: 'bg-white/[0.06]' },
  rsvp: { icon: Ticket, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  space_created: { icon: Sparkles, color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10' },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function FeedCard({ item }: { item: FeedItem }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.message_summary;
  const Icon = config.icon;

  // Build a link target
  let href: string | null = null;
  if (item.toolId) href = `/t/${item.toolId}`;
  else if (item.spaceHandle) href = `/s/${item.spaceHandle}`;
  else if (item.spaceId) href = `/s/${item.spaceId}`;

  const content = (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/90 leading-snug">{item.headline}</p>
        {item.detail && (
          <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{item.detail}</p>
        )}
        <p className="text-[11px] text-white/25 mt-1">{timeAgo(item.timestamp)}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (before?: string) => {
    const params = new URLSearchParams({ limit: '30' });
    if (before) params.set('before', before);

    const res = await fetch(`/api/feed/global?${params}`, { credentials: 'include' });
    const json = await res.json();
    return json.data || { items: [], hasMore: false };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchFeed().then((data) => {
      setItems(data.items || []);
      setHasMore(data.hasMore || false);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || items.length === 0) return;
    setIsLoadingMore(true);
    const oldest = items[items.length - 1].timestamp;
    const data = await fetchFeed(oldest);
    setItems(prev => [...prev, ...(data.items || [])]);
    setHasMore(data.hasMore || false);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, items, fetchFeed]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchFeed().then((data) => {
      setItems(data.items || []);
      setHasMore(data.hasMore || false);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [fetchFeed]);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-ground)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/discover" className="mb-1 inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors">
              ← Discover
            </Link>
            <h1 className="text-2xl font-semibold text-white">Activity</h1>
            <p className="text-sm text-white/40">What&apos;s happening across HIVE right now</p>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] text-white/50 text-xs hover:bg-white/[0.08] transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        {/* Feed items */}
        {!isLoading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 text-sm">No activity yet. Be the first!</p>
            {!user && (
              <Link href="/enter" className="mt-4 inline-block text-[#FFD700] text-sm hover:underline">
                Join HIVE &rarr;
              </Link>
            )}
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full py-3 text-center text-white/40 text-sm hover:text-white/60 transition-colors flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                  'Load more'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
