'use client';

/**
 * /events — Campus Events Feed
 *
 * Personalized campus events ranked by relevance.
 * Groups: Tonight / This Week / Later
 */

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  Check,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { secureApiFetch } from '@/lib/secure-auth-utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CampusEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  locationType?: string;
  isOnline?: boolean;
  rsvpCount: number;
  isUserRsvped?: boolean;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  spaceId?: string;
  spaceName?: string;
  spaceHandle?: string;
  organizerName?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  relevanceScore?: number;
  matchReasons?: string[];
  friendsAttending?: number;
}

type TimeGroup = 'Tonight' | 'Tomorrow' | 'This Week' | 'Later';

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────────────────

async function fetchEvents(): Promise<CampusEvent[]> {
  const params = new URLSearchParams({
    timeRange: 'this-week',
    maxItems: '50',
    sort: 'soonest',
  });
  const res = await secureApiFetch(`/api/events/personalized?${params}`);
  if (!res.ok) return [];
  const payload = await res.json();
  const data = payload.data || payload;
  return (data.events || []) as CampusEvent[];
}

async function rsvpEvent(spaceId: string, eventId: string, status: 'going' | 'maybe' | 'not_going') {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('RSVP failed');
}

// ─────────────────────────────────────────────────────────────────────────────
// Time grouping
// ─────────────────────────────────────────────────────────────────────────────

function getTimeGroup(dateStr: string): TimeGroup {
  const now = new Date();
  const date = new Date(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);
  const startOfDayAfter = new Date(startOfTomorrow.getTime() + 86400000);
  const startOfNextWeek = new Date(startOfToday.getTime() + 7 * 86400000);

  if (date >= startOfToday && date < startOfTomorrow) return 'Tonight';
  if (date >= startOfTomorrow && date < startOfDayAfter) return 'Tomorrow';
  if (date >= startOfDayAfter && date < startOfNextWeek) return 'This Week';
  return 'Later';
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Card
// ─────────────────────────────────────────────────────────────────────────────

function EventCard({ event, onRsvp }: { event: CampusEvent; onRsvp: (status: 'going' | 'not_going') => void }) {
  const isGoing = event.userRsvp === 'going' || event.isUserRsvped;
  const isOnline = event.locationType === 'virtual' || event.isOnline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.06] bg-[#080808] p-4 transition-colors hover:border-white/[0.1]"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          {/* Space attribution */}
          {event.spaceName && (
            <div className="flex items-center gap-1.5 mb-2">
              {event.spaceHandle ? (
                <Link
                  href={`/s/${event.spaceHandle}`}
                  className="text-[12px] text-white/40 hover:text-white/70 transition-colors truncate"
                >
                  {event.spaceName}
                </Link>
              ) : (
                <span className="text-[12px] text-white/40 truncate">{event.spaceName}</span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="text-[15px] font-medium text-white leading-snug mb-2 line-clamp-2">
            {event.title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-[12px] text-white/50">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {formatTime(event.startDate)}
            </span>

            {event.location && !isOnline && (
              <span className="flex items-center gap-1 text-[12px] text-white/50">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[160px]">{event.location}</span>
              </span>
            )}

            {isOnline && (
              <span className="flex items-center gap-1 text-[12px] text-white/50">
                <Video className="w-3 h-3 flex-shrink-0" />
                Online
              </span>
            )}

            {event.rsvpCount > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-white/40">
                <Users className="w-3 h-3 flex-shrink-0" />
                {event.rsvpCount} going
              </span>
            )}
          </div>

          {/* Friends attending */}
          {event.friendsAttending && event.friendsAttending > 0 && (
            <p className="mt-1.5 text-[12px] text-white/40">
              {event.friendsAttending === 1 ? '1 friend' : `${event.friendsAttending} friends`} going
            </p>
          )}
        </div>

        {/* Right: RSVP */}
        {event.spaceId && (
          <button
            type="button"
            onClick={() => onRsvp(isGoing ? 'not_going' : 'going')}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-150',
              isGoing
                ? 'bg-white/[0.08] text-white/70 border border-white/[0.08]'
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            {isGoing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Going
              </>
            ) : (
              'RSVP'
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Group Section
// ─────────────────────────────────────────────────────────────────────────────

function EventGroup({ label, events, onRsvp }: {
  label: TimeGroup;
  events: CampusEvent[];
  onRsvp: (eventId: string, spaceId: string, status: 'going' | 'not_going') => void;
}) {
  if (events.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/40">{label}</h2>
        {label === 'Tonight' && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFD700] animate-pulse" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onRsvp={(status) => onRsvp(event.id, event.spaceId!, status)}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Calendar className="w-8 h-8 text-white/20 mb-3" />
      <p className="text-[15px] font-medium text-white/40 mb-1">No upcoming events</p>
      <p className="text-[13px] text-white/30 mb-5">
        Join spaces to see events from your campus orgs
      </p>
      <Link
        href="/spaces"
        className="flex items-center gap-1.5 text-[13px] font-medium text-white/50 hover:text-white transition-colors"
      >
        Browse spaces
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_ORDER: TimeGroup[] = ['Tonight', 'Tomorrow', 'This Week', 'Later'];

export default function EventsPage() {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['campus-events'],
    queryFn: fetchEvents,
    staleTime: 60_000,
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, spaceId, status }: { eventId: string; spaceId: string; status: 'going' | 'not_going' }) =>
      rsvpEvent(spaceId, eventId, status),
    onMutate: async ({ eventId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['campus-events'] });
      const prev = queryClient.getQueryData<CampusEvent[]>(['campus-events']);
      queryClient.setQueryData<CampusEvent[]>(['campus-events'], (old = []) =>
        old.map((e) =>
          e.id === eventId
            ? {
                ...e,
                userRsvp: status,
                isUserRsvped: status === 'going',
                rsvpCount: e.rsvpCount + (status === 'going' ? 1 : -1),
              }
            : e
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['campus-events'], ctx.prev);
    },
  });

  // Group events
  const grouped = React.useMemo(() => {
    const groups: Record<TimeGroup, CampusEvent[]> = {
      Tonight: [],
      Tomorrow: [],
      'This Week': [],
      Later: [],
    };
    for (const event of events) {
      groups[getTimeGroup(event.startDate)].push(event);
    }
    return groups;
  }, [events]);

  const hasEvents = events.length > 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-black/80 backdrop-blur-md">
        <div className="max-w-xl px-6 py-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[18px] font-medium text-white">Events</h1>
            {!isLoading && hasEvents && (
              <span className="text-[13px] text-white/30">
                {events.length} upcoming
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl px-6 py-5 pb-24">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.06] bg-[#080808] p-4 h-24 animate-pulse"
              />
            ))}
          </div>
        ) : !hasEvents ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            <div className="flex flex-col gap-7">
              {GROUP_ORDER.map((label) => (
                <EventGroup
                  key={label}
                  label={label}
                  events={grouped[label]}
                  onRsvp={(eventId, spaceId, status) =>
                    rsvpMutation.mutate({ eventId, spaceId, status })
                  }
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
