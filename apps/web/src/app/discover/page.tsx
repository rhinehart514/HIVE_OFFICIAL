'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  Calendar,
  Check,
  Clock,
  MapPin,
  RefreshCw,
  Share2,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FeedTab = 'for-you' | 'latest';
type EventCategory = 'all' | 'social' | 'academic' | 'professional' | 'recreation' | 'official';

interface FeedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  eventType?: string;
  rsvpCount: number;
  isUserRsvped?: boolean;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  spaceName?: string;
  spaceHandle?: string;
  spaceId?: string;
  spaceAvatarUrl?: string;
  organizerName?: string;
  relevanceScore?: number;
  matchReasons?: string[];
  friendsAttending?: number;
  friendsAttendingNames?: string[];
  interestMatch?: string[];
}

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function fetchEvents(sort: 'relevance' | 'newest' | 'soonest', page: number, category?: string): Promise<{ events: FeedEvent[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    timeRange: 'this-month',
    maxItems: '20',
    page: String(page),
  });
  if (sort === 'newest') params.set('sort', 'newest');
  if (sort === 'soonest') params.set('sort', 'soonest');
  if (category && category !== 'all') params.set('eventTypes', category);

  const res = await fetch(`/api/events/personalized?${params}`, { credentials: 'include' });
  if (!res.ok) return { events: [], hasMore: false };
  const payload = await res.json();
  const data = payload.data || payload;
  const events: FeedEvent[] = data.events || [];
  return { events, hasMore: data.meta?.hasMoreEvents || events.length >= 20 };
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
  if (diffH < 24) {
    return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isUrgent(startDate: string): boolean {
  const diffMs = new Date(startDate).getTime() - Date.now();
  return diffMs >= 0 && diffMs <= 15 * 60 * 1000;
}

function isHappeningNow(startDate: string): boolean {
  return new Date(startDate).getTime() - Date.now() < 0;
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function Avatar({ name, url, size = 36 }: { name?: string; url?: string; size?: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
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

function EventCard({ event, onRsvp }: { event: FeedEvent; onRsvp: (eventId: string, spaceId: string) => void }) {
  const urgent = isUrgent(event.startDate);
  const live = isHappeningNow(event.startDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar name={event.spaceName} url={event.spaceAvatarUrl} size={36} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Link
            href={event.spaceHandle ? `/s/${event.spaceHandle}` : '#'}
            className="text-[15px] font-semibold text-white hover:underline truncate"
          >
            {event.spaceName || event.organizerName || 'Campus Event'}
          </Link>
          <span className="text-white/20">·</span>
          <span className="text-white/40 text-[13px] flex-shrink-0">
            <Clock className="w-3 h-3 inline mr-1" />
            {eventTimeLabel(event.startDate)}
          </span>
        </div>
        {(urgent || live) && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${
            live
              ? 'bg-red-500/15 text-red-400'
              : 'bg-[#FFD700]/15 text-[#FFD700]'
          }`}>
            <Zap className="w-3 h-3" />
            {live ? 'Live' : 'Soon'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="ml-[46px]">
        <h3 className="text-[15px] font-medium text-white leading-snug">{event.title}</h3>

        {event.description && (
          <p className="text-[14px] text-white/50 mt-1 line-clamp-2 leading-relaxed">{event.description}</p>
        )}

        {/* Match reasons */}
        {event.matchReasons && event.matchReasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.matchReasons.slice(0, 2).map((reason, i) => (
              <span key={i} className="text-[11px] text-[#FFD700]/80 bg-[#FFD700]/10 px-2 py-0.5 rounded-full">
                ✦ {reason}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 mt-2 text-[13px] text-white/40">
          {event.location && (
            <span className="flex items-center gap-1">
              {event.isOnline ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
              <span className="truncate max-w-[180px]">{event.isOnline ? 'Online' : event.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {event.rsvpCount} going
          </span>
          {event.friendsAttending && event.friendsAttending > 0 && (
            <span className="text-[#FFD700]/70">
              {event.friendsAttending} friend{event.friendsAttending > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-3 -ml-2">
          {event.spaceId ? (
            <button
              onClick={() => onRsvp(event.id, event.spaceId!)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                isGoing
                  ? 'bg-[#FFD700]/15 text-[#FFD700]'
                  : 'text-white/40 hover:text-[#FFD700] hover:bg-[#FFD700]/10'
              }`}
            >
              {isGoing ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
              {isGoing ? 'Going' : 'RSVP'}
            </button>
          ) : null}
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FeedTab>('for-you');
  const [category, setCategory] = useState<EventCategory>('all');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const sort = tab === 'for-you' ? 'relevance' : 'newest';

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/enter?redirect=/discover');
    }
  }, [authLoading, user, router]);

  // Reset page when tab/category changes
  useEffect(() => {
    setPage(1);
  }, [tab, category]);

  const eventsQuery = useQuery({
    queryKey: ['discover-events', sort, category, page],
    queryFn: () => fetchEvents(sort as 'relevance' | 'newest' | 'soonest', page, category),
    staleTime: 60_000,
    enabled: !authLoading && !!user,
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, spaceId }: { eventId: string; spaceId: string }) =>
      rsvpToEvent(spaceId, eventId, 'going'),
    onMutate: async ({ eventId }) => {
      await queryClient.cancelQueries({ queryKey: ['discover-events'] });
      const prev = queryClient.getQueryData(['discover-events', sort, category, page]);
      queryClient.setQueryData(['discover-events', sort, category, page], (old: { events: FeedEvent[]; hasMore: boolean } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          events: old.events.map((e) =>
            e.id === eventId
              ? { ...e, isUserRsvped: true, userRsvp: 'going' as const, rsvpCount: e.rsvpCount + 1 }
              : e
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['discover-events', sort, category, page], context.prev);
      }
    },
  });

  const handleRsvp = useCallback((eventId: string, spaceId: string) => {
    rsvpMutation.mutate({ eventId, spaceId });
  }, [rsvpMutation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['discover-events'] });
    setIsRefreshing(false);
  }, [queryClient]);

  // Load more on scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && eventsQuery.data?.hasMore && !eventsQuery.isFetching) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eventsQuery.data?.hasMore, eventsQuery.isFetching]);

  const events = eventsQuery.data?.events || [];

  const categories: { key: EventCategory; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'social', label: 'Social' },
    { key: 'academic', label: 'Academic' },
    { key: 'professional', label: 'Professional' },
    { key: 'recreation', label: 'Recreation' },
    { key: 'official', label: 'Official' },
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
        {/* Header */}
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.08]">
          {/* Tabs */}
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

        {/* Category pills */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08] overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                category === c.key
                  ? 'bg-white text-black'
                  : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
              }`}
            >
              {c.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full text-white/40 hover:text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading */}
        {eventsQuery.isLoading && (
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

        {/* Empty */}
        {!eventsQuery.isLoading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-[15px] text-white/50">No events yet</p>
            <p className="text-[13px] text-white/30 mt-1">Events from your spaces and campus will show up here</p>
          </div>
        )}

        {/* Events feed */}
        {!eventsQuery.isLoading && events.length > 0 && (
          <div>
            {events.map((event) => (
              <div key={event.id} className="border-b border-white/[0.08]">
                <EventCard event={event} onRsvp={handleRsvp} />
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-10" />
        {eventsQuery.isFetching && page > 1 && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 rounded-full border-2 border-white/[0.06] border-t-[#FFD700] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
