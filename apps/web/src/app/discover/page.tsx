'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Flame,
  MapPin,
  MessageSquare,
  RefreshCw,
  Share2,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface TrendingSpace {
  id: string;
  name: string;
  avatarUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  isVerified?: boolean;
  isJoined?: boolean;
  lastActivityAt?: string;
  upcomingEventCount?: number;
  nextEventTitle?: string;
  mutualCount?: number;
  description?: string;
  category?: string;
}

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function fetchEvents(
  sort: 'relevance' | 'newest' | 'soonest',
  page: number,
  category?: string,
  timeRange: string = 'this-month'
): Promise<{ events: FeedEvent[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    timeRange,
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

async function fetchTrendingSpaces(): Promise<TrendingSpace[]> {
  const params = new URLSearchParams({
    category: 'all',
    sort: 'trending',
    limit: '8',
  });
  const res = await fetch(`/api/spaces/browse-v2?${params}`, { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  const spaces = data?.data?.spaces || data?.spaces || [];
  return spaces.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    avatarUrl: (s.iconURL || s.bannerImage) as string | undefined,
    bannerUrl: (s.coverImageURL || s.bannerImage) as string | undefined,
    memberCount: (s.memberCount as number) || 0,
    isVerified: s.isVerified as boolean | undefined,
    isJoined: s.isJoined as boolean | undefined,
    lastActivityAt: s.lastActivityAt as string | undefined,
    upcomingEventCount: s.upcomingEventCount as number | undefined,
    nextEventTitle: s.nextEventTitle as string | undefined,
    mutualCount: s.mutualCount as number | undefined,
    description: s.description as string | undefined,
    category: s.category as string | undefined,
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

function shortDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isHappeningNow(startDate: string, endDate?: string): boolean {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : start + 2 * 60 * 60 * 1000;
  return now >= start && now <= end;
}

function isUpcomingToday(startDate: string): boolean {
  const start = new Date(startDate);
  const now = new Date();
  return start.toDateString() === now.toDateString() && start.getTime() > now.getTime();
}

function isUrgent(startDate: string): boolean {
  const diffMs = new Date(startDate).getTime() - Date.now();
  return diffMs >= 0 && diffMs <= 15 * 60 * 1000;
}

function getDaysOfWeek(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.toDateString() === d2.toDateString();
}

/* ------------------------------------------------------------------ */
/*  Shared Components                                                  */
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

function SectionHeader({ icon: Icon, title, count, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-6 pb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#FFD700]" />
        <h2 className="text-[15px] font-semibold text-white">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="text-[12px] text-white/30 bg-white/[0.06] px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-1 text-[13px] text-white/40 hover:text-white/60 transition-colors"
        >
          {action.label}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Happening Now / Today                                              */
/* ------------------------------------------------------------------ */

function HappeningNowCard({ event, onRsvp }: { event: FeedEvent; onRsvp: (eventId: string, spaceId: string) => void }) {
  const live = isHappeningNow(event.startDate, event.endDate);
  const urgent = isUrgent(event.startDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';

  return (
    <div className="min-w-[280px] max-w-[300px] rounded-2xl bg-[#080808] border border-white/[0.06] p-4 flex flex-col gap-3 snap-start">
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          live
            ? 'bg-red-500/15 text-red-400'
            : urgent
              ? 'bg-[#FFD700]/15 text-[#FFD700]'
              : 'bg-white/[0.06] text-white/50'
        }`}>
          {live ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Live now</>
          ) : urgent ? (
            <><Zap className="w-3 h-3" /> Starting soon</>
          ) : (
            <><Clock className="w-3 h-3" /> {eventTimeLabel(event.startDate)}</>
          )}
        </span>
        {event.rsvpCount > 0 && (
          <span className="text-[12px] text-white/30">
            {event.rsvpCount} going
          </span>
        )}
      </div>

      {/* Title & space */}
      <div>
        <h3 className="text-[15px] font-medium text-white leading-snug line-clamp-2">{event.title}</h3>
        {event.spaceName && (
          <Link
            href={event.spaceHandle ? `/s/${event.spaceHandle}` : '#'}
            className="text-[13px] text-white/40 hover:text-white/60 mt-1 block truncate"
          >
            {event.spaceName}
          </Link>
        )}
      </div>

      {/* Location */}
      {event.location && (
        <div className="flex items-center gap-1.5 text-[12px] text-white/30">
          {event.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
          <span className="truncate">{event.isOnline ? 'Online' : event.location}</span>
        </div>
      )}

      {/* Match reasons */}
      {event.matchReasons && event.matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {event.matchReasons.slice(0, 2).map((reason, i) => (
            <span key={i} className="text-[11px] text-[#FFD700]/70 bg-[#FFD700]/10 px-2 py-0.5 rounded-full">
              ✦ {reason}
            </span>
          ))}
        </div>
      )}

      {/* RSVP */}
      {event.spaceId && (
        <button
          onClick={() => onRsvp(event.id, event.spaceId!)}
          className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[13px] font-medium transition-colors ${
            isGoing
              ? 'bg-[#FFD700]/15 text-[#FFD700]'
              : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.08] hover:text-white/70'
          }`}
        >
          {isGoing ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
          {isGoing ? 'Going' : 'RSVP'}
        </button>
      )}
    </div>
  );
}

function HappeningNowSection({ events, onRsvp }: { events: FeedEvent[]; onRsvp: (eventId: string, spaceId: string) => void }) {
  // Filter: live + upcoming today
  const nowEvents = useMemo(() => {
    return events.filter(e =>
      isHappeningNow(e.startDate, e.endDate) || isUpcomingToday(e.startDate)
    ).sort((a, b) => {
      // Live first, then by start time
      const aLive = isHappeningNow(a.startDate, a.endDate);
      const bLive = isHappeningNow(b.startDate, b.endDate);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events]);

  if (nowEvents.length === 0) return null;

  const liveCount = nowEvents.filter(e => isHappeningNow(e.startDate, e.endDate)).length;

  return (
    <div>
      <SectionHeader
        icon={Zap}
        title={liveCount > 0 ? 'Happening Now' : "Today's Events"}
        count={nowEvents.length}
      />
      <div className="flex gap-3 px-4 pb-2 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {nowEvents.slice(0, 10).map((event) => (
          <HappeningNowCard key={event.id} event={event} onRsvp={onRsvp} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trending Spaces                                                    */
/* ------------------------------------------------------------------ */

function TrendingSpaceCard({ space }: { space: TrendingSpace }) {
  return (
    <Link
      href={`/s/${space.id}`}
      className="min-w-[200px] max-w-[220px] rounded-2xl bg-[#080808] border border-white/[0.06] overflow-hidden snap-start hover:border-white/[0.12] transition-colors group"
    >
      {/* Banner */}
      <div className="h-16 bg-gradient-to-br from-white/[0.04] to-white/[0.02] relative overflow-hidden">
        {space.bannerUrl && (
          <img src={space.bannerUrl} alt="" className="w-full h-full object-cover opacity-60" />
        )}
      </div>

      {/* Content */}
      <div className="p-3 -mt-5 relative">
        <Avatar name={space.name} url={space.avatarUrl} size={32} />
        <h3 className="text-[14px] font-medium text-white mt-2 truncate group-hover:text-white/90">
          {space.name}
          {space.isVerified && (
            <span className="inline-block ml-1 text-[#FFD700]" title="Verified">✓</span>
          )}
        </h3>

        <div className="flex items-center gap-3 mt-1.5 text-[12px] text-white/30">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {space.memberCount}
          </span>
          {space.upcomingEventCount && space.upcomingEventCount > 0 && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {space.upcomingEventCount}
            </span>
          )}
          {space.mutualCount && space.mutualCount > 0 && (
            <span className="text-[#FFD700]/60">
              {space.mutualCount} mutual{space.mutualCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {space.nextEventTitle && (
          <p className="text-[11px] text-white/25 mt-1.5 truncate">
            Next: {space.nextEventTitle}
          </p>
        )}
      </div>
    </Link>
  );
}

function TrendingSpacesSection({ spaces }: { spaces: TrendingSpace[] }) {
  if (spaces.length === 0) return null;

  return (
    <div>
      <SectionHeader
        icon={TrendingUp}
        title="Trending Spaces"
        count={spaces.length}
        action={{ label: 'Browse all', href: '/spaces' }}
      />
      <div className="flex gap-3 px-4 pb-2 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {spaces.map((space) => (
          <TrendingSpaceCard key={space.id} space={space} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upcoming This Week - Calendar View                                 */
/* ------------------------------------------------------------------ */

function WeekCalendarView({ events, selectedDay, onSelectDay, onRsvp }: {
  events: FeedEvent[];
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
  onRsvp: (eventId: string, spaceId: string) => void;
}) {
  const days = useMemo(() => getDaysOfWeek(), []);
  const today = new Date();

  const dayEvents = useMemo(() => {
    return events.filter(e => isSameDay(new Date(e.startDate), selectedDay))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, selectedDay]);

  // Count events per day for dots
  const eventCountByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      const key = new Date(e.startDate).toDateString();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [events]);

  return (
    <div>
      {/* Day selector */}
      <div className="flex gap-1 px-4 pb-3">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDay);
          const isCurrentDay = isSameDay(day, today);
          const eventCount = eventCountByDay.get(day.toDateString()) || 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors ${
                isSelected
                  ? 'bg-white/[0.08] border border-white/[0.12]'
                  : 'border border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className={`text-[11px] font-medium ${
                isSelected ? 'text-white/70' : 'text-white/30'
              }`}>
                {shortDay(day)}
              </span>
              <span className={`text-[15px] font-semibold ${
                isSelected
                  ? 'text-white'
                  : isCurrentDay
                    ? 'text-[#FFD700]'
                    : 'text-white/50'
              }`}>
                {day.getDate()}
              </span>
              {/* Event dots */}
              {eventCount > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-[#FFD700]' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Events for selected day */}
      <div className="px-4 space-y-2">
        {dayEvents.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-white/30">No events on {shortDate(selectedDay)}</p>
          </div>
        ) : (
          dayEvents.map((event) => (
            <CalendarEventRow key={event.id} event={event} onRsvp={onRsvp} />
          ))
        )}
      </div>
    </div>
  );
}

function CalendarEventRow({ event, onRsvp }: { event: FeedEvent; onRsvp: (eventId: string, spaceId: string) => void }) {
  const start = new Date(event.startDate);
  const isGoing = event.isUserRsvped || event.userRsvp === 'going';
  const live = isHappeningNow(event.startDate, event.endDate);

  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-[#080808] border border-white/[0.06]">
      {/* Time column */}
      <div className="flex flex-col items-center justify-start pt-0.5 min-w-[48px]">
        <span className={`text-[13px] font-semibold ${live ? 'text-red-400' : 'text-white/60'}`}>
          {live ? 'NOW' : start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-medium text-white leading-snug truncate">{event.title}</h4>
        <div className="flex items-center gap-3 mt-1 text-[12px] text-white/30">
          {event.spaceName && (
            <span className="truncate max-w-[120px]">{event.spaceName}</span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.isOnline ? 'Online' : event.location}</span>
            </span>
          )}
          {event.rsvpCount > 0 && (
            <span>{event.rsvpCount} going</span>
          )}
        </div>
      </div>

      {/* RSVP button */}
      {event.spaceId && (
        <button
          onClick={() => onRsvp(event.id, event.spaceId!)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-medium self-center transition-colors ${
            isGoing
              ? 'bg-[#FFD700]/15 text-[#FFD700]'
              : 'bg-white/[0.06] text-white/40 hover:text-white/60'
          }`}
        >
          {isGoing ? <Check className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          {isGoing ? 'Going' : 'RSVP'}
        </button>
      )}
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
  const [category, setCategory] = useState<EventCategory>('all');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/enter?redirect=/discover');
    }
  }, [authLoading, user, router]);

  // Fetch today/tonight events for "Happening Now"
  const todayEventsQuery = useQuery({
    queryKey: ['discover-today-events', category],
    queryFn: () => fetchEvents('soonest', 1, category, 'today'),
    staleTime: 60_000,
    enabled: !authLoading && !!user,
  });

  // Fetch this week events for calendar
  const weekEventsQuery = useQuery({
    queryKey: ['discover-week-events', category],
    queryFn: () => fetchEvents('soonest', 1, category, 'this-week'),
    staleTime: 60_000,
    enabled: !authLoading && !!user,
  });

  // Fetch trending spaces
  const spacesQuery = useQuery({
    queryKey: ['discover-trending-spaces'],
    queryFn: fetchTrendingSpaces,
    staleTime: 5 * 60_000,
    enabled: !authLoading && !!user,
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, spaceId }: { eventId: string; spaceId: string }) =>
      rsvpToEvent(spaceId, eventId, 'going'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover-today-events'] });
      queryClient.invalidateQueries({ queryKey: ['discover-week-events'] });
    },
  });

  const handleRsvp = useCallback((eventId: string, spaceId: string) => {
    rsvpMutation.mutate({ eventId, spaceId });
  }, [rsvpMutation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['discover-today-events'] }),
      queryClient.invalidateQueries({ queryKey: ['discover-week-events'] }),
      queryClient.invalidateQueries({ queryKey: ['discover-trending-spaces'] }),
    ]);
    setIsRefreshing(false);
  }, [queryClient]);

  const todayEvents = todayEventsQuery.data?.events || [];
  const weekEvents = weekEventsQuery.data?.events || [];
  const trendingSpaces = spacesQuery.data || [];

  const categories: { key: EventCategory; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'social', label: 'Social' },
    { key: 'academic', label: 'Academic' },
    { key: 'professional', label: 'Professional' },
    { key: 'recreation', label: 'Recreation' },
    { key: 'official', label: 'Official' },
  ];

  const isLoading = todayEventsQuery.isLoading && weekEventsQuery.isLoading && spacesQuery.isLoading;

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
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-[18px] font-bold text-white">Discover</h1>
              <p className="text-[13px] text-white/30">What&apos;s happening at UB right now</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full text-white/40 hover:text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
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
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-6 py-4">
            {/* Happening Now skeleton */}
            <div className="px-4">
              <div className="h-5 w-40 bg-white/[0.06] rounded animate-pulse mb-3" />
              <div className="flex gap-3 overflow-hidden">
                {[0, 1, 2].map(i => (
                  <div key={i} className="min-w-[280px] h-[180px] rounded-2xl bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            </div>
            {/* Trending skeleton */}
            <div className="px-4">
              <div className="h-5 w-36 bg-white/[0.06] rounded animate-pulse mb-3" />
              <div className="flex gap-3 overflow-hidden">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="min-w-[200px] h-[140px] rounded-2xl bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-20">
            {/* 1. Happening Now */}
            <HappeningNowSection events={todayEvents} onRsvp={handleRsvp} />

            {/* 2. Trending Spaces */}
            <TrendingSpacesSection spaces={trendingSpaces} />

            {/* 3. Upcoming This Week */}
            <div>
              <SectionHeader
                icon={Calendar}
                title="Upcoming This Week"
                count={weekEvents.length}
              />
              <WeekCalendarView
                events={weekEvents}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                onRsvp={handleRsvp}
              />
            </div>

            {/* Empty state if nothing at all */}
            {todayEvents.length === 0 && trendingSpaces.length === 0 && weekEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
                  <Flame className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-[15px] text-white/50">Nothing happening yet</p>
                <p className="text-[13px] text-white/30 mt-1">
                  Events and spaces from your campus will show up here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
