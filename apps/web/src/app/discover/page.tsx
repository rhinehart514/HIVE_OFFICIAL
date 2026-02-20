'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  Clock,
  GitFork,
  MapPin,
  MessageSquare,
  Play,
  RefreshCw,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FeedFilter = 'all' | 'events' | 'spaces' | 'creations' | 'posts';

interface FeedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  rsvpCount: number;
  isUserRsvped?: boolean;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  spaceName?: string;
  spaceHandle?: string;
  spaceId?: string;
  spaceAvatarUrl?: string;
  friendsAttending?: number;
  matchReasons?: string[];
}

interface FeedSpace {
  id: string;
  handle?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  isVerified?: boolean;
  isJoined?: boolean;
  category?: string;
  mutualCount?: number;
  upcomingEventCount?: number;
  nextEventTitle?: string;
  lastActivityAt?: string;
}

interface FeedCreation {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  creatorName?: string;
  creatorId?: string;
  spaceOriginName?: string;
  forkCount: number;
  useCount: number;
  category?: string;
  createdAt: string;
}

type FeedItem =
  | { type: 'event'; data: FeedEvent; sortKey: number }
  | { type: 'space'; data: FeedSpace; sortKey: number }
  | { type: 'creation'; data: FeedCreation; sortKey: number };

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function fetchFeedEvents(): Promise<FeedEvent[]> {
  const params = new URLSearchParams({
    timeRange: 'this-week',
    maxItems: '30',
    sort: 'soonest',
  });
  const res = await fetch(`/api/events/personalized?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const payload = await res.json();
  const data = payload.data || payload;
  return data.events || [];
}

async function fetchFeedSpaces(): Promise<FeedSpace[]> {
  const params = new URLSearchParams({ category: 'all', sort: 'trending', limit: '15' });
  const res = await fetch(`/api/spaces/browse-v2?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  const spaces = data?.data?.spaces || data?.spaces || [];
  return spaces.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    handle: (s.handle || s.slug) as string | undefined,
    name: s.name as string,
    description: s.description as string | undefined,
    avatarUrl: (s.iconURL || s.bannerImage) as string | undefined,
    memberCount: (s.memberCount as number) || 0,
    isVerified: s.isVerified as boolean | undefined,
    isJoined: s.isJoined as boolean | undefined,
    category: s.category as string | undefined,
    mutualCount: s.mutualCount as number | undefined,
    upcomingEventCount: s.upcomingEventCount as number | undefined,
    nextEventTitle: s.nextEventTitle as string | undefined,
    lastActivityAt: s.lastActivityAt as string | undefined,
  }));
}

async function fetchFeedCreations(): Promise<FeedCreation[]> {
  const params = new URLSearchParams({ sort: 'trending', limit: '15' });
  const res = await fetch(`/api/tools/discover?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  const tools = data?.data?.tools || data?.tools || [];
  return tools.map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: (t.title || t.name) as string,
    description: t.description as string | undefined,
    thumbnail: t.thumbnail as string | undefined,
    creatorName: (t.creator as Record<string, unknown>)?.name as string | undefined,
    creatorId: (t.creator as Record<string, unknown>)?.id as string | undefined,
    spaceOriginName: (t.spaceOrigin as Record<string, unknown>)?.name as string | undefined,
    forkCount: (t.forkCount as number) || 0,
    useCount: (t.useCount as number) || 0,
    category: t.category as string | undefined,
    createdAt: t.createdAt as string,
  }));
}

async function rsvpToEvent(spaceId: string, eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<void> {
  const res = await fetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('RSVP failed');
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function eventTimeLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMs < 0) return 'Happening now';
  if (diffMin <= 15) return 'Starting soon';
  if (diffMin < 60) return `In ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function isHappeningNow(startDate: string, endDate?: string): boolean {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : start + 2 * 60 * 60 * 1000;
  return now >= start && now <= end;
}

function isUrgent(startDate: string): boolean {
  const diffMs = new Date(startDate).getTime() - Date.now();
  return diffMs >= 0 && diffMs <= 15 * 60 * 1000;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Feed builder                                                       */
/* ------------------------------------------------------------------ */

function buildFeed(events: FeedEvent[], spaces: FeedSpace[], creations: FeedCreation[], filter: FeedFilter): FeedItem[] {
  const items: FeedItem[] = [];
  const now = Date.now();

  if (filter === 'all' || filter === 'events') {
    for (const e of events) {
      const start = new Date(e.startDate).getTime();
      const live = isHappeningNow(e.startDate, e.endDate);
      // Live events get highest priority, upcoming events scored by proximity
      const urgency = live ? 10000 : Math.max(0, 5000 - (start - now) / 60000);
      const social = (e.rsvpCount || 0) * 2 + (e.friendsAttending || 0) * 20;
      items.push({ type: 'event', data: e, sortKey: urgency + social });
    }
  }

  if (filter === 'all' || filter === 'spaces') {
    for (const s of spaces) {
      if (s.isJoined) continue; // Don't suggest already-joined spaces
      const recency = s.lastActivityAt ? Math.max(0, 2000 - (now - new Date(s.lastActivityAt).getTime()) / 60000) : 500;
      const social = (s.mutualCount || 0) * 50 + (s.memberCount || 0) * 0.1;
      items.push({ type: 'space', data: s, sortKey: recency + social });
    }
  }

  if (filter === 'all' || filter === 'creations') {
    for (const c of creations) {
      const recency = c.createdAt ? Math.max(0, 1500 - (now - new Date(c.createdAt).getTime()) / 60000) : 300;
      const popularity = (c.forkCount || 0) * 10 + (c.useCount || 0) * 3;
      items.push({ type: 'creation', data: c, sortKey: recency + popularity });
    }
  }

  // Sort by composite score descending
  items.sort((a, b) => b.sortKey - a.sortKey);
  return items;
}

/* ------------------------------------------------------------------ */
/*  Card Components                                                    */
/* ------------------------------------------------------------------ */

function Avatar({ name, url, size = 32 }: { name?: string; url?: string; size?: number }) {
  if (url) {
    return <img src={url} alt={name || ''} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  }
  const letter = (name || '?')[0].toUpperCase();
  return (
    <div className="rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-white/60 text-xs font-medium" style={{ width: size, height: size }}>
      {letter}
    </div>
  );
}

function EventCard({ event, onRsvp }: { event: FeedEvent; onRsvp: (eventId: string, spaceId: string) => void }) {
  const live = isHappeningNow(event.startDate, event.endDate);
  const urgent = isUrgent(event.startDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';

  return (
    <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-4 space-y-3">
      {/* Top row: badge + space */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          live ? 'bg-red-500/15 text-red-400' : urgent ? 'bg-[#FFD700]/15 text-[#FFD700]' : 'bg-white/[0.06] text-white/40'
        }`}>
          {live ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live</>
          ) : urgent ? (
            <><Zap className="w-3 h-3" />Starting soon</>
          ) : (
            <><Clock className="w-3 h-3" />{eventTimeLabel(event.startDate)}</>
          )}
        </span>
        {event.spaceName && (
          <Link href={event.spaceHandle ? `/s/${event.spaceHandle}` : '#'} className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/50 transition-colors">
            <Avatar name={event.spaceName} url={event.spaceAvatarUrl} size={16} />
            <span className="truncate max-w-[120px]">{event.spaceName}</span>
          </Link>
        )}
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-medium text-white leading-snug">{event.title}</h3>
      {event.description && <p className="text-[13px] text-white/30 line-clamp-2 leading-relaxed">{event.description}</p>}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-[12px] text-white/25">
        {event.location && (
          <span className="flex items-center gap-1">
            {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
            <span className="truncate max-w-[140px]">{event.isOnline ? 'Online' : event.location}</span>
          </span>
        )}
        {event.rsvpCount > 0 && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />{event.rsvpCount} going
          </span>
        )}
        {event.friendsAttending && event.friendsAttending > 0 && (
          <span className="text-[#FFD700]/60">{event.friendsAttending} friend{event.friendsAttending > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Match reasons */}
      {event.matchReasons && event.matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {event.matchReasons.slice(0, 2).map((reason, i) => (
            <span key={i} className="text-[11px] text-[#FFD700]/60 bg-[#FFD700]/[0.08] px-2 py-0.5 rounded-full">✦ {reason}</span>
          ))}
        </div>
      )}

      {/* RSVP */}
      {event.spaceId && (
        <button
          onClick={() => onRsvp(event.id, event.spaceId!)}
          className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-medium transition-all ${
            isGoing
              ? 'bg-[#FFD700]/15 text-[#FFD700]'
              : 'bg-white/[0.06] text-white/40 hover:bg-white/[0.08] hover:text-white/60 active:scale-[0.98]'
          }`}
        >
          {isGoing ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
          {isGoing ? 'Going' : 'RSVP'}
        </button>
      )}
    </div>
  );
}

function SpaceCard({ space }: { space: FeedSpace }) {
  return (
    <Link href={`/s/${space.handle || space.id}`} className="block rounded-2xl bg-[#080808] border border-white/[0.06] p-4 hover:border-white/[0.1] transition-colors group">
      <div className="flex items-start gap-3">
        <Avatar name={space.name} url={space.avatarUrl} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[15px] font-medium text-white truncate group-hover:text-white/90">{space.name}</h3>
            {space.isVerified && <span className="text-[#FFD700] text-[12px]">✓</span>}
          </div>
          {space.description && <p className="text-[13px] text-white/30 line-clamp-2 mt-1 leading-relaxed">{space.description}</p>}

          <div className="flex items-center gap-3 mt-2.5 text-[12px] text-white/25">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{space.memberCount}</span>
            {space.upcomingEventCount && space.upcomingEventCount > 0 && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{space.upcomingEventCount} event{space.upcomingEventCount > 1 ? 's' : ''}</span>
            )}
            {space.mutualCount && space.mutualCount > 0 && (
              <span className="text-[#FFD700]/50">{space.mutualCount} mutual{space.mutualCount > 1 ? 's' : ''}</span>
            )}
          </div>

          {space.nextEventTitle && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/20">
              <Zap className="w-3 h-3" />
              <span className="truncate">Next: {space.nextEventTitle}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function CreationCard({ creation }: { creation: FeedCreation }) {
  return (
    <Link href={`/tools/${creation.id}`} className="block rounded-2xl bg-[#080808] border border-white/[0.06] overflow-hidden hover:border-white/[0.1] transition-colors group">
      {creation.thumbnail && (
        <div className="h-32 bg-white/[0.02] overflow-hidden">
          <img src={creation.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-white/25">
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-medium">Creation</span>
          {creation.spaceOriginName && <span className="truncate">from {creation.spaceOriginName}</span>}
        </div>
        <h3 className="text-[15px] font-medium text-white leading-snug group-hover:text-white/90">{creation.title}</h3>
        {creation.description && <p className="text-[13px] text-white/30 line-clamp-2 leading-relaxed">{creation.description}</p>}
        <div className="flex items-center gap-4 text-[12px] text-white/25 pt-1">
          {creation.creatorName && <span>by {creation.creatorName}</span>}
          {creation.forkCount > 0 && <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{creation.forkCount}</span>}
          {creation.useCount > 0 && <span className="flex items-center gap-1"><Play className="w-3 h-3" />{creation.useCount}</span>}
          {creation.createdAt && <span>{relativeTime(creation.createdAt)}</span>}
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Pulse Indicator                                                    */
/* ------------------------------------------------------------------ */

function PulseIndicator({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-40" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
      </span>
      {count > 0 && <span className="text-[13px] text-white/40">{count} happening now</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/enter?redirect=/discover');
    }
  }, [authLoading, user, router]);

  const eventsQuery = useQuery({
    queryKey: ['feed-events'],
    queryFn: fetchFeedEvents,
    staleTime: 60_000,
    enabled: !authLoading && !!user,
  });

  const spacesQuery = useQuery({
    queryKey: ['feed-spaces'],
    queryFn: fetchFeedSpaces,
    staleTime: 5 * 60_000,
    enabled: !authLoading && !!user,
  });

  const creationsQuery = useQuery({
    queryKey: ['feed-creations'],
    queryFn: fetchFeedCreations,
    staleTime: 5 * 60_000,
    enabled: !authLoading && !!user,
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, spaceId }: { eventId: string; spaceId: string }) =>
      rsvpToEvent(spaceId, eventId, 'going'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-events'] });
    },
  });

  const handleRsvp = useCallback((eventId: string, spaceId: string) => {
    rsvpMutation.mutate({ eventId, spaceId });
  }, [rsvpMutation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['feed-events'] }),
      queryClient.invalidateQueries({ queryKey: ['feed-spaces'] }),
      queryClient.invalidateQueries({ queryKey: ['feed-creations'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  const events = eventsQuery.data || [];
  const spaces = spacesQuery.data || [];
  const creations = creationsQuery.data || [];

  const feed = useMemo(() => buildFeed(events, spaces, creations, filter), [events, spaces, creations, filter]);

  const liveCount = useMemo(() => events.filter(e => isHappeningNow(e.startDate, e.endDate)).length, [events]);

  const isLoading = eventsQuery.isLoading && spacesQuery.isLoading && creationsQuery.isLoading;

  const filters: { key: FeedFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'events', label: 'Events' },
    { key: 'spaces', label: 'Spaces' },
    { key: 'creations', label: 'Creations' },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/[0.06] border-t-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="mx-auto w-full max-w-[600px]">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <h1 className="text-[17px] font-semibold text-white tracking-tight">What&apos;s happening at UB</h1>
              <div className="mt-1">
                <PulseIndicator count={liveCount} />
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 -mr-1 rounded-full text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                  filter === f.key
                    ? 'bg-white text-black'
                    : 'bg-white/[0.06] text-white/40 hover:bg-white/[0.08] hover:text-white/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.04] animate-pulse" style={{ height: 140 + (i % 3) * 40 }} />
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-[15px] text-white/50 font-medium">Nothing here yet</p>
            <p className="text-[13px] text-white/25 mt-1 max-w-[260px]">
              Events, spaces, and creations from your campus will show up here
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4 pb-24">
            {feed.map((item) => {
              switch (item.type) {
                case 'event':
                  return <EventCard key={`e-${item.data.id}`} event={item.data} onRsvp={handleRsvp} />;
                case 'space':
                  return <SpaceCard key={`s-${item.data.id}`} space={item.data} />;
                case 'creation':
                  return <CreationCard key={`c-${item.data.id}`} creation={item.data} />;
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}
