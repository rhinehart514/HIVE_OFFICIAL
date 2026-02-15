'use client';

/**
 * Events Page — Browse all campus events
 * Personalized scoring, filterable, searchable
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  Zap,
  Check,
  ChevronDown,
  Sparkles,
  Filter,
  X,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { Button } from '@hive/ui';
import { cn } from '@/lib/utils';
import { EventDetailsModal } from '@/components/events/event-details-modal';
import type { EventData } from '@/hooks/use-events';
import {
  formatEventTime,
  getEventTypeColor,
} from '@/hooks/use-events';

// ─── Types ───────────────────────────────────────────────────

type TimeFilter = 'all' | 'today' | 'this-week' | 'this-month';
type EventCategory = 'all' | 'academic' | 'social' | 'professional' | 'recreational' | 'official';
type SortMode = 'personalized' | 'date' | 'popular';

interface ApiEvent {
  id: string;
  title: string;
  description?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  locationName?: string;
  locationType?: string;
  virtualLink?: string;
  goingCount?: number;
  tags?: string[];
  space?: { id: string; name: string; type?: string } | null;
  organizer?: { id: string; name: string; handle: string; verified?: boolean };
  rsvpStatus?: string | null;
  isBookmarked?: boolean;
  source?: string;
  relevanceScore?: number;
  matchReasons?: string[];
  friendsAttending?: number;
}

// ─── Constants ───────────────────────────────────────────────

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
];

const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'social', label: 'Social' },
  { value: 'academic', label: 'Academic' },
  { value: 'professional', label: 'Professional' },
  { value: 'recreational', label: 'Recreation' },
  { value: 'official', label: 'Official' },
];

// ─── Helpers ─────────────────────────────────────────────────

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);

  if (diffMs < 0) return 'Started';
  if (diffMin <= 15) return 'Starting soon';
  if (diffHrs < 1) return `In ${diffMin}m`;
  if (diffHrs < 24) return `In ${diffHrs}h`;

  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isStartingSoon(isoString: string): boolean {
  const diff = new Date(isoString).getTime() - Date.now();
  return diff > 0 && diff < 15 * 60 * 1000;
}

function getCategoryLabel(type: string): string {
  const map: Record<string, string> = {
    academic: 'Academic',
    social: 'Social',
    professional: 'Professional',
    recreational: 'Recreation',
    official: 'Official',
    meeting: 'Meeting',
    virtual: 'Virtual',
  };
  return map[type] || type;
}

function getCategoryDot(type: string): string {
  const map: Record<string, string> = {
    academic: 'bg-blue-400',
    social: 'bg-pink-400',
    professional: 'bg-emerald-400',
    recreational: 'bg-[#FFD700]',
    official: 'bg-purple-400',
  };
  return map[type] || 'bg-white/30';
}

// ─── Event Card ──────────────────────────────────────────────

function EventCard({
  event,
  onRsvp,
  onClick,
}: {
  event: ApiEvent;
  onRsvp?: (id: string, status: 'going' | 'not_going') => void;
  onClick?: () => void;
}) {
  const soon = event.startTime ? isStartingSoon(event.startTime) : false;
  const isVirtual = event.locationType === 'virtual';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl p-5',
        'bg-[#0A0A0A] border transition-all duration-150',
        'hover:bg-[#111] active:scale-[0.995]',
        soon
          ? 'border-[#FFD700]/20 hover:border-[#FFD700]/30'
          : 'border-white/[0.08] hover:border-white/[0.12]'
      )}
    >
      {/* Top row: category + time badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {event.type && (
            <span className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', getCategoryDot(event.type))} />
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                {getCategoryLabel(event.type)}
              </span>
            </span>
          )}
          {event.space && (
            <span className="text-[11px] text-white/30 truncate max-w-[140px]">
              · {event.space.name}
            </span>
          )}
        </div>

        {event.startTime && (
          soon ? (
            <motion.span
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(255, 215, 0, 0)',
                  '0 0 6px 2px rgba(255, 215, 0, 0.2)',
                  '0 0 0 0 rgba(255, 215, 0, 0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFD700]/15 text-[#FFD700]"
            >
              <Zap className="w-2.5 h-2.5" />
              Starting soon
            </motion.span>
          ) : (
            <span className="text-[11px] font-mono text-white/40">
              {formatRelativeDate(event.startTime)}
            </span>
          )
        )}
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-medium text-white leading-snug mb-2 line-clamp-2">
        {event.title}
      </h3>

      {/* Description */}
      {event.description && (
        <p className="text-[13px] text-white/40 line-clamp-2 mb-3 leading-relaxed">
          {event.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 text-[12px] text-white/40">
        {event.startTime && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {formatTime(event.startTime)}
          </span>
        )}
        {(event.locationName || isVirtual) && (
          <span className="flex items-center gap-1.5 truncate">
            {isVirtual ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
            <span className="truncate">{isVirtual ? 'Online' : event.locationName}</span>
          </span>
        )}
        {(event.goingCount ?? 0) > 0 && (
          <span className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            {event.goingCount}
          </span>
        )}
      </div>

      {/* Match reasons (personalized) */}
      {event.matchReasons && event.matchReasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#FFD700]/70">
            <Sparkles className="w-3 h-3" />
            <span className="truncate">{event.matchReasons[0]}</span>
          </div>
        </div>
      )}

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {event.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] text-white/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.button>
  );
}

// ─── Filter Chip ─────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap',
        active
          ? 'bg-white text-black'
          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70'
      )}
    >
      {children}
    </button>
  );
}

// ─── Page Component ──────────────────────────────────────────

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [category, setCategory] = useState<EventCategory>('all');
  const [sortMode, setSortMode] = useState<SortMode>('personalized');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Data state
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Build params and fetch
  const fetchEvents = useCallback(async (reset = true) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const currentOffset = reset ? 0 : offset;
      params.set('limit', '30');
      params.set('offset', String(currentOffset));
      params.set('upcoming', 'true');

      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (category !== 'all') params.set('type', category);

      // Time filter → date ranges
      const now = new Date();
      switch (timeFilter) {
        case 'today': {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const end = new Date(start.getTime() + 86400000);
          params.set('from', start.toISOString());
          params.set('to', end.toISOString());
          break;
        }
        case 'this-week': {
          params.set('from', now.toISOString());
          params.set('to', new Date(now.getTime() + 7 * 86400000).toISOString());
          break;
        }
        case 'this-month': {
          params.set('from', now.toISOString());
          params.set('to', new Date(now.getTime() + 30 * 86400000).toISOString());
          break;
        }
      }

      // Use personalized endpoint if user is logged in and wants personalized sort
      let url = `/api/events?${params.toString()}`;

      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch');

      const data = await resp.json();
      const raw: ApiEvent[] = (data.events || []).map((e: Record<string, unknown>) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type || e.eventType,
        startTime: e.startTime || e.startDate,
        endTime: e.endTime || e.endDate,
        locationName: e.locationName || e.location,
        locationType: e.locationType,
        virtualLink: e.virtualLink,
        goingCount: e.goingCount || e.currentCapacity || e.rsvpCount || 0,
        tags: e.tags || [],
        space: e.space || null,
        organizer: e.organizer || null,
        rsvpStatus: e.rsvpStatus || null,
        isBookmarked: e.isBookmarked || false,
        source: e.source,
        relevanceScore: e.relevanceScore,
        matchReasons: e.matchReasons,
        friendsAttending: e.friendsAttending,
      }));

      if (reset) {
        setEvents(raw);
        setOffset(30);
      } else {
        setEvents((prev) => [...prev, ...raw]);
        setOffset(currentOffset + 30);
      }
      setHasMore(data.hasMore ?? false);
    } catch {
      // silent fail — events stay empty
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, timeFilter, offset]);

  // Refetch on filter change
  useEffect(() => {
    fetchEvents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, timeFilter]);

  // Sort events client-side
  const sortedEvents = useMemo(() => {
    const copy = [...events];
    switch (sortMode) {
      case 'personalized':
        // If we have relevance scores, use them; otherwise fall back to date
        return copy.sort((a, b) => {
          if (a.relevanceScore && b.relevanceScore) return b.relevanceScore - a.relevanceScore;
          return new Date(a.startTime || '').getTime() - new Date(b.startTime || '').getTime();
        });
      case 'popular':
        return copy.sort((a, b) => (b.goingCount ?? 0) - (a.goingCount ?? 0));
      case 'date':
      default:
        return copy.sort(
          (a, b) => new Date(a.startTime || '').getTime() - new Date(b.startTime || '').getTime()
        );
    }
  }, [events, sortMode]);

  // Group by date for display
  const groupedEvents = useMemo(() => {
    const groups: { label: string; events: ApiEvent[] }[] = [];
    const now = new Date();

    for (const event of sortedEvents) {
      if (!event.startTime) continue;
      const date = new Date(event.startTime);
      const isToday = date.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();

      let label: string;
      if (isToday) label = 'Today';
      else if (isTomorrow) label = 'Tomorrow';
      else label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

      const existing = groups.find((g) => g.label === label);
      if (existing) existing.events.push(event);
      else groups.push({ label, events: [event] });
    }
    return groups;
  }, [sortedEvents]);

  // Selected event for modal
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    const e = events.find((ev) => ev.id === selectedEventId);
    if (!e) return null;
    // Map to EventData shape for the modal
    return {
      id: e.id,
      title: e.title || 'Untitled',
      description: e.description || '',
      type: (e.type || 'social') as EventData['type'],
      organizer: {
        id: e.organizer?.id || '',
        name: e.organizer?.name || 'Organizer',
        handle: e.organizer?.handle || '',
        verified: e.organizer?.verified,
      },
      space: e.space ? { id: e.space.id, name: e.space.name, type: e.space.type || 'general' } : undefined,
      datetime: {
        start: e.startTime || new Date().toISOString(),
        end: e.endTime || new Date().toISOString(),
        timezone: 'America/New_York',
      },
      location: {
        type: (e.locationType || 'physical') as 'physical' | 'virtual' | 'hybrid',
        name: e.locationName || 'TBD',
        virtualLink: e.virtualLink,
      },
      capacity: { max: 100, current: e.goingCount || 0, waitlist: 0 },
      tools: [],
      tags: e.tags || [],
      visibility: 'public' as const,
      rsvpStatus: (e.rsvpStatus as EventData['rsvpStatus']) || null,
      isBookmarked: e.isBookmarked || false,
      engagement: { going: e.goingCount || 0, interested: 0, comments: 0, shares: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies EventData;
  }, [selectedEventId, events]);

  const handleRSVP = useCallback(async (eventId: string, status: 'going' | 'interested' | 'not_going') => {
    // Capture previous state for rollback
    const previousEvents = events;

    // Optimistic update
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const delta = status === 'going' ? 1 : e.rsvpStatus === 'going' ? -1 : 0;
        return { ...e, rsvpStatus: status, goingCount: (e.goingCount ?? 0) + delta };
      })
    );

    // Find the event to get its spaceId
    const event = events.find((e) => e.id === eventId);
    if (!event?.space?.id) {
      // Can't call API without spaceId — roll back
      setEvents(previousEvents);
      return;
    }

    // Map 'interested' to 'maybe' for the API (API accepts 'going' | 'maybe' | 'not_going')
    const apiStatus = status === 'interested' ? 'maybe' : status;

    try {
      const resp = await fetch(`/api/spaces/${event.space.id}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatus }),
      });

      if (!resp.ok) {
        // Roll back optimistic update on failure
        setEvents(previousEvents);
      }
    } catch {
      // Roll back optimistic update on network error
      setEvents(previousEvents);
    }
  }, [events]);

  const showSearchClear = searchQuery.length > 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
          <h1
            className="text-[28px] font-semibold text-white mb-4"
            style={{ fontFamily: 'var(--font-clash, inherit)' }}
          >
            Events
          </h1>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-10 py-2.5 rounded-xl',
                'bg-white/[0.04] border border-white/[0.08]',
                'text-[15px] text-white placeholder:text-white/30',
                'focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.06]',
                'transition-all'
              )}
            />
            {showSearchClear && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/[0.08]"
              >
                <X className="w-3.5 h-3.5 text-white/40" />
              </button>
            )}
          </div>

          {/* Time filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TIME_OPTIONS.map((opt) => (
              <Chip key={opt.value} active={timeFilter === opt.value} onClick={() => setTimeFilter(opt.value)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Category + Sort row */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategory(opt.value)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap',
                  category === opt.value
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/30 hover:text-white/50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => {
              const modes: SortMode[] = ['personalized', 'date', 'popular'];
              const idx = modes.indexOf(sortMode);
              setSortMode(modes[(idx + 1) % modes.length]);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono text-white/40 hover:text-white/60 bg-white/[0.03] hover:bg-white/[0.06] transition-all whitespace-nowrap"
          >
            {sortMode === 'personalized' && <Sparkles className="w-3 h-3" />}
            {sortMode === 'date' && <Calendar className="w-3 h-3" />}
            {sortMode === 'popular' && <Users className="w-3 h-3" />}
            {sortMode === 'personalized' ? 'For You' : sortMode === 'date' ? 'By Date' : 'Popular'}
          </button>
        </div>
      </div>

      {/* Event List */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && events.length === 0 ? (
          // Skeleton
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#0A0A0A] border border-white/[0.08] p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-3 w-20 bg-white/[0.06] rounded" />
                  <div className="h-3 w-14 bg-white/[0.06] rounded" />
                </div>
                <div className="h-5 w-3/4 bg-white/[0.08] rounded mb-2" />
                <div className="h-4 w-full bg-white/[0.04] rounded mb-3" />
                <div className="flex gap-4">
                  <div className="h-3 w-16 bg-white/[0.04] rounded" />
                  <div className="h-3 w-24 bg-white/[0.04] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-[15px] text-white/50 font-medium mb-1">No events found</p>
            <p className="text-[13px] text-white/30">
              {debouncedSearch ? 'Try a different search' : 'Check back later for upcoming events'}
            </p>
          </div>
        ) : (
          // Grouped event list
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {groupedEvents.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-3 mb-3">
                    <h2
                      className="text-[13px] font-mono uppercase tracking-wider text-white/30"
                    >
                      {group.label}
                    </h2>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[11px] font-mono text-white/20">
                      {group.events.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setSelectedEventId(event.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchEvents(false)}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white/50 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            >
              Load more events
            </button>
          </div>
        )}

        {loading && events.length > 0 && (
          <div className="flex justify-center mt-6">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Event details modal */}
      <EventDetailsModal
        isOpen={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
        event={selectedEvent}
        currentUserId={user?.uid}
        onRSVP={handleRSVP}
      />
    </div>
  );
}
