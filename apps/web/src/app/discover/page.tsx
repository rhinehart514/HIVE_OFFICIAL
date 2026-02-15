'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  Calendar,
  Check,
  Clock,
  MapPin,
  Megaphone,
  RefreshCw,
  Search,
  Share2,
  Users,
  Video,
  Wrench,
  Zap,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FeedTab = 'for-you' | 'latest';
type FilterPill = 'all' | 'events' | 'announcements' | 'tools';

interface FeedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  rsvpCount: number;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  spaceName?: string;
  spaceHandle?: string;
  spaceId?: string;
  spaceAvatarUrl?: string;
  isLive?: boolean;
  relevanceScore?: number;
}

interface GlobalFeedItem {
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

interface UnifiedFeedItem {
  id: string;
  kind: 'event' | 'announcement' | 'tool' | 'activity';
  timestamp: Date;
  score: number; // for "For You" weighting
  event?: FeedEvent;
  activity?: GlobalFeedItem;
}

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'space' | 'tool' | 'person' | 'event' | 'post';
  url: string;
}

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed: ${url}`);
  const payload = await res.json();
  return (payload.data || payload) as T;
}

async function fetchEvents(page: number): Promise<{ events: FeedEvent[]; hasMore: boolean }> {
  try {
    const data = await fetchJson<{ events?: FeedEvent[] }>(
      `/api/events/personalized?timeRange=upcoming&maxItems=20&page=${page}`
    );
    const events = data.events || [];
    return { events, hasMore: events.length >= 20 };
  } catch {
    return { events: [], hasMore: false };
  }
}

async function fetchGlobalFeed(before?: string): Promise<{ items: GlobalFeedItem[]; hasMore: boolean; oldestTimestamp: string | null }> {
  try {
    const url = before
      ? `/api/feed/global?limit=30&before=${encodeURIComponent(before)}`
      : '/api/feed/global?limit=30';
    const data = await fetchJson<{ items: GlobalFeedItem[]; hasMore: boolean; oldestTimestamp: string | null }>(url);
    return data;
  } catch {
    return { items: [], hasMore: false, oldestTimestamp: null };
  }
}

async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  const data = await fetchJson<{ results?: SearchResult[] }>(
    `/api/search?q=${encodeURIComponent(query)}&limit=8`
  );
  return data.results || [];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function eventTimeLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMs < 0) return 'Happening now';
  if (diffMin <= 15) return 'Starting soon!';
  if (diffMin < 60) return `In ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `In ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `In ${diffD}d`;

  return start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function eventUrgencyScore(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const hoursAway = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursAway < 0) return 100; // happening now
  if (hoursAway < 1) return 90;
  if (hoursAway < 6) return 70;
  if (hoursAway < 24) return 50;
  if (hoursAway < 72) return 30;
  return 10;
}

function classifyActivity(type: GlobalFeedItem['type']): UnifiedFeedItem['kind'] {
  if (type === 'event_created' || type === 'rsvp') return 'announcement';
  if (type === 'tool_created' || type === 'tool_deployed') return 'tool';
  return 'activity';
}

function unifyFeed(events: FeedEvent[], activities: GlobalFeedItem[], tab: FeedTab): UnifiedFeedItem[] {
  const items: UnifiedFeedItem[] = [];

  for (const ev of events) {
    items.push({
      id: `ev-${ev.id}`,
      kind: 'event',
      timestamp: new Date(ev.startDate),
      score: tab === 'for-you' ? eventUrgencyScore(ev.startDate) + (ev.relevanceScore || 0) : 0,
      event: ev,
    });
  }

  for (const act of activities) {
    const kind = classifyActivity(act.type);
    items.push({
      id: act.id,
      kind,
      timestamp: new Date(act.timestamp),
      score: tab === 'for-you' ? (kind === 'announcement' ? 40 : 20) : 0,
      activity: act,
    });
  }

  if (tab === 'for-you') {
    items.sort((a, b) => b.score - a.score || b.timestamp.getTime() - a.timestamp.getTime());
  } else {
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Avatar({ name, url, size = 36 }: { name?: string; url?: string; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || ''}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const letter = (name || '?')[0].toUpperCase();
  return (
    <div
      className="rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-white/60 text-sm font-medium"
      style={{ width: size, height: size }}
    >
      {letter}
    </div>
  );
}

function EventFeedCard({ item }: { item: FeedEvent }) {
  const timeLabel = eventTimeLabel(item.startDate);
  const isUrgent = timeLabel === 'Starting soon!' || timeLabel === 'Happening now';

  return (
    <div className="px-4 py-3">
      {/* Header: avatar + space name + time */}
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar name={item.spaceName} url={item.spaceAvatarUrl} size={36} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Link
            href={item.spaceHandle ? `/s/${item.spaceHandle}` : '#'}
            className="text-[15px] font-semibold text-white hover:underline truncate"
          >
            {item.spaceName || 'Campus Event'}
          </Link>
          <span className="text-white/30 text-[13px]">·</span>
          <span className="text-white/40 text-[13px] flex-shrink-0">{relativeTime(new Date(item.startDate))}</span>
        </div>
        {isUrgent && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFD700]/15 text-[#FFD700] flex-shrink-0">
            <Zap className="w-3 h-3" />
            {timeLabel}
          </span>
        )}
      </div>

      {/* Event content */}
      <div className="ml-[46px]">
        <h3 className="text-[15px] font-medium text-white leading-snug">{item.title}</h3>

        {item.description && (
          <p className="text-[14px] text-white/50 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-2 text-[13px] text-white/40">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {eventTimeLabel(item.startDate)}
          </span>
          {item.location && (
            <span className="flex items-center gap-1">
              {item.isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
              <span className="truncate max-w-[150px]">{item.isOnline ? 'Online' : item.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {item.rsvpCount} going
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3 -ml-2">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              item.userRsvp === 'going'
                ? 'bg-[#FFD700]/15 text-[#FFD700]'
                : 'text-white/40 hover:text-[#FFD700] hover:bg-[#FFD700]/10'
            }`}
          >
            {item.userRsvp === 'going' ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
            {item.userRsvp === 'going' ? 'Going' : 'RSVP'}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors">
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityFeedCard({ item }: { item: GlobalFeedItem }) {
  const icon = item.type === 'tool_created' || item.type === 'tool_deployed'
    ? <Wrench className="w-4 h-4 text-[#FFD700]" />
    : item.type === 'event_created'
    ? <Calendar className="w-4 h-4 text-[#FFD700]" />
    : item.type === 'rsvp'
    ? <Check className="w-4 h-4 text-[#FFD700]" />
    : item.type === 'message_summary'
    ? <Megaphone className="w-4 h-4 text-[#FFD700]" />
    : <Users className="w-4 h-4 text-[#FFD700]" />;

  const linkHref = item.spaceHandle
    ? `/s/${item.spaceHandle}`
    : item.toolId
    ? `/t/${item.toolId}`
    : item.eventId
    ? '#'
    : '#';

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar name={item.actorName || item.spaceName} url={item.actorAvatarUrl} size={36} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-[15px] font-semibold text-white truncate">
            {item.actorName || item.spaceName || 'HIVE'}
          </span>
          {item.spaceName && item.actorName && (
            <>
              <span className="text-white/30 text-[13px]">in</span>
              <Link
                href={item.spaceHandle ? `/s/${item.spaceHandle}` : '#'}
                className="text-[13px] text-white/50 hover:underline truncate"
              >
                {item.spaceName}
              </Link>
            </>
          )}
          <span className="text-white/30 text-[13px]">·</span>
          <span className="text-white/40 text-[13px] flex-shrink-0">
            {relativeTime(new Date(item.timestamp))}
          </span>
        </div>
      </div>

      <div className="ml-[46px]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FFD700]/10 flex-shrink-0">{icon}</div>
          <Link href={linkHref} className="text-[15px] text-white hover:underline leading-snug">
            {item.headline}
          </Link>
        </div>
        {item.detail && (
          <p className="text-[14px] text-white/40 mt-1 line-clamp-2 leading-relaxed">{item.detail}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2 -ml-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors">
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<FeedTab>('for-you');
  const [filter, setFilter] = useState<FilterPill>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/enter?redirect=/discover');
    }
  }, [authLoading, user, router]);

  // Events query
  const eventsQuery = useQuery({
    queryKey: ['discover-events'],
    queryFn: () => fetchEvents(1),
    staleTime: 60_000,
  });

  // Global feed with infinite scroll
  const feedQuery = useInfiniteQuery({
    queryKey: ['discover-global-feed'],
    queryFn: ({ pageParam }) => fetchGlobalFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.oldestTimestamp : undefined,
    staleTime: 60_000,
  });

  // Search
  const trimmedSearch = searchQuery.trim();
  const searchResultsQuery = useQuery({
    queryKey: ['discover-search', trimmedSearch],
    queryFn: () => fetchSearchResults(trimmedSearch),
    enabled: trimmedSearch.length >= 2,
    staleTime: 20_000,
  });

  // Unify feed items
  const feedItems = useMemo(() => {
    const events = eventsQuery.data?.events || [];
    const activities = feedQuery.data?.pages.flatMap((p) => p.items) || [];
    let items = unifyFeed(events, activities, tab);

    if (filter !== 'all') {
      items = items.filter((item) => {
        if (filter === 'events') return item.kind === 'event';
        if (filter === 'announcements') return item.kind === 'announcement';
        if (filter === 'tools') return item.kind === 'tool';
        return true;
      });
    }

    return items;
  }, [eventsQuery.data, feedQuery.data, tab, filter]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
          feedQuery.fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [feedQuery.hasNextPage, feedQuery.isFetchingNextPage, feedQuery.fetchNextPage]);

  // Refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['discover-events'] }),
      queryClient.invalidateQueries({ queryKey: ['discover-global-feed'] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  const isLoading = eventsQuery.isLoading && feedQuery.isLoading;
  const searchResults = searchResultsQuery.data || [];

  const pills: { key: FilterPill; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'events', label: 'Events' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'tools', label: 'Tools' },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/[0.06] border-t-[#FFD700] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="mx-auto w-full max-w-[600px]">
        {/* Search bar */}
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.06] pl-10 pr-3 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-[#FFD700]/40"
              />
            </div>
          </div>

          {/* Search results dropdown */}
          {trimmedSearch.length >= 2 && (
            <div className="border-b border-white/[0.08] px-4 pb-2">
              {searchResultsQuery.isLoading && (
                <div className="py-3 text-[13px] text-white/30">Searching…</div>
              )}
              {!searchResultsQuery.isLoading && searchResults.length === 0 && (
                <div className="py-3 text-[13px] text-white/30">No results</div>
              )}
              {!searchResultsQuery.isLoading && searchResults.length > 0 && (
                <div>
                  {searchResults.map((r) => (
                    <Link
                      key={`${r.type}-${r.id}`}
                      href={r.url}
                      className="flex items-center justify-between py-2 px-1 hover:bg-white/[0.04] rounded-lg"
                    >
                      <span className="text-[14px] text-white truncate">{r.title}</span>
                      <span className="text-[11px] uppercase tracking-wide text-white/30 ml-2 flex-shrink-0">{r.type}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabs: For You / Latest */}
          <div className="flex">
            <button
              onClick={() => setTab('for-you')}
              className={`flex-1 py-3 text-[15px] font-semibold text-center transition-colors relative ${
                tab === 'for-you' ? 'text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              For You
              {tab === 'for-you' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[#FFD700]" />
              )}
            </button>
            <button
              onClick={() => setTab('latest')}
              className={`flex-1 py-3 text-[15px] font-semibold text-center transition-colors relative ${
                tab === 'latest' ? 'text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Latest
              {tab === 'latest' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[#FFD700]" />
              )}
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08] overflow-x-auto">
          {pills.map((p) => (
            <button
              key={p.key}
              onClick={() => setFilter(p.key)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                filter === p.key
                  ? 'bg-white text-black'
                  : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
              }`}
            >
              {p.label}
            </button>
          ))}

          <div className="flex-1" />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full text-white/40 hover:text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feed */}
        {isLoading && (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-white/[0.08] px-4 py-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] animate-pulse" />
                  <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" />
                </div>
                <div className="ml-[46px] space-y-2">
                  <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/[0.04] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && feedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-[15px] text-white/50">Nothing here yet</p>
            <p className="text-[13px] text-white/30 mt-1">Join some spaces to see activity in your feed</p>
          </div>
        )}

        {!isLoading && feedItems.length > 0 && (
          <div>
            {feedItems.map((item) => (
              <div key={item.id} className="border-b border-white/[0.08]">
                {item.kind === 'event' && item.event ? (
                  <EventFeedCard item={item.event} />
                ) : item.activity ? (
                  <ActivityFeedCard item={item.activity} />
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-10" />
        {feedQuery.isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 rounded-full border-2 border-white/[0.06] border-t-[#FFD700] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
