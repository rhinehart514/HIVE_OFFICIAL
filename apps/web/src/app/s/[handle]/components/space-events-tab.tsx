'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Plus, Users, Video } from 'lucide-react';
import { Button, MOTION } from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';
import { cn } from '@/lib/utils';
import { secureApiFetch } from '@/lib/secure-auth-utils';

type RSVPStatus = 'going' | 'maybe' | 'interested' | 'not_going' | null;

interface RawSpaceEvent {
  id?: unknown;
  title?: unknown;
  startDate?: unknown;
  startAt?: unknown;
  startTime?: unknown;
  endDate?: unknown;
  endTime?: unknown;
  location?: unknown;
  locationType?: unknown;
  virtualLink?: unknown;
  currentAttendees?: unknown;
  attendeeCount?: unknown;
  rsvpCount?: unknown;
  userRSVP?: unknown;
  rsvpStatus?: unknown;
}

interface SpaceEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  locationType?: string;
  virtualLink?: string;
  currentAttendees: number;
  userRSVP: RSVPStatus;
}

type QueryResponse = {
  data?: {
    events?: RawSpaceEvent[];
    currentAttendees?: number;
    message?: string;
  };
  events?: RawSpaceEvent[];
  currentAttendees?: number;
  message?: string;
  error?: string;
};

type NormalizedRSVP = 'going' | 'maybe' | 'not_going' | null;

const UPCOMING_GROUP_ORDER = ['Today', 'Tomorrow', 'This Week', 'Later'] as const;
type UpcomingGroup = (typeof UPCOMING_GROUP_ORDER)[number];

export interface SpaceEventsTabProps {
  spaceId: string;
  isLeader: boolean;
  onCreateEvent: () => void;
  onEventClick: (eventId: string) => void;
}

function getEventsQueryKey(spaceId: string, upcoming: boolean) {
  return ['space-events-tab', spaceId, upcoming ? 'upcoming' : 'past'] as const;
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeRsvp(status: RSVPStatus): NormalizedRSVP {
  if (status === 'going') return 'going';
  if (status === 'maybe' || status === 'interested') return 'maybe';
  if (status === 'not_going') return 'not_going';
  return null;
}

function normalizeEvent(raw: RawSpaceEvent): SpaceEvent | null {
  const id = toStringValue(raw.id);
  const startRaw = toStringValue(raw.startDate) ?? toStringValue(raw.startAt) ?? toStringValue(raw.startTime);

  if (!id || !startRaw) return null;

  const parsedStart = new Date(startRaw);
  if (Number.isNaN(parsedStart.getTime())) return null;

  const endRaw = toStringValue(raw.endDate) ?? toStringValue(raw.endTime);
  const parsedEnd = endRaw ? new Date(endRaw) : null;

  return {
    id,
    title: toStringValue(raw.title) || 'Untitled event',
    startDate: parsedStart.toISOString(),
    endDate: parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? parsedEnd.toISOString() : undefined,
    location: toStringValue(raw.location),
    locationType: toStringValue(raw.locationType),
    virtualLink: toStringValue(raw.virtualLink),
    currentAttendees:
      toNumber(raw.currentAttendees, -1) >= 0
        ? toNumber(raw.currentAttendees)
        : toNumber(raw.attendeeCount, -1) >= 0
          ? toNumber(raw.attendeeCount)
          : toNumber(raw.rsvpCount),
    userRSVP: (raw.userRSVP as RSVPStatus) ?? (raw.rsvpStatus as RSVPStatus) ?? null,
  };
}

async function fetchEvents(spaceId: string, upcoming: boolean): Promise<SpaceEvent[]> {
  const params = new URLSearchParams({
    limit: '50',
    upcoming: String(upcoming),
  });

  const response = await secureApiFetch(`/api/spaces/${spaceId}/events?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }

    const errorPayload = (await response.json().catch(() => null)) as QueryResponse | null;
    const data = errorPayload?.data;
    const message =
      data?.message || errorPayload?.message || errorPayload?.error || 'Failed to fetch events';
    throw new Error(message);
  }

  const payload = (await response.json()) as QueryResponse;
  const data = payload.data ?? payload;
  const events = Array.isArray(data.events) ? data.events : [];

  return events
    .map(normalizeEvent)
    .filter((event): event is SpaceEvent => event !== null)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getUpcomingGroup(date: Date): UpcomingGroup {
  const today = startOfDay(new Date());
  const eventDay = startOfDay(date);
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 6) return 'This Week';
  return 'Later';
}

function groupUpcomingEvents(events: SpaceEvent[]) {
  const groups: Record<UpcomingGroup, SpaceEvent[]> = {
    Today: [],
    Tomorrow: [],
    'This Week': [],
    Later: [],
  };

  for (const event of events) {
    groups[getUpcomingGroup(new Date(event.startDate))].push(event);
  }

  return groups;
}

function formatEventDateTime(dateString: string): string {
  const date = new Date(dateString);
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const today = startOfDay(new Date());
  const eventDay = startOfDay(date);
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return `Today · ${time}`;
  if (diffDays === 1) return `Tomorrow · ${time}`;

  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return `${datePart} · ${time}`;
}

function formatPastEventDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getRsvpLabel(status: RSVPStatus): string {
  const normalized = normalizeRsvp(status);
  if (normalized === 'going') return 'You are going';
  if (normalized === 'maybe') return 'You are interested';
  if (normalized === 'not_going') return 'You are not going';
  return 'No RSVP yet';
}

function updateEventWithRsvp(
  events: SpaceEvent[] | undefined,
  eventId: string,
  nextStatus: 'going' | 'maybe',
  currentAttendees?: number
) {
  if (!events) return events;

  return events.map((event) => {
    if (event.id !== eventId) return event;

    const prevStatus = normalizeRsvp(event.userRSVP);
    let nextCount = event.currentAttendees;

    if (typeof currentAttendees === 'number') {
      nextCount = currentAttendees;
    } else if (prevStatus === 'going' && nextStatus !== 'going') {
      nextCount = Math.max(0, event.currentAttendees - 1);
    } else if (prevStatus !== 'going' && nextStatus === 'going') {
      nextCount = event.currentAttendees + 1;
    }

    return {
      ...event,
      currentAttendees: nextCount,
      userRSVP: nextStatus,
    };
  });
}

function EventsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-white/[0.06] bg-white/[0.06] p-4"
        >
          <div className="h-4 w-44 rounded bg-white/[0.06]" />
          <div className="mt-3 flex gap-3">
            <div className="h-3 w-28 rounded bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
            <div className="h-3 w-20 rounded bg-white/[0.06]" />
          </div>
          <div className="mt-4 h-8 w-36 rounded-full bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

interface EventCardProps {
  event: SpaceEvent;
  isPast?: boolean;
  isRsvpPending: boolean;
  onEventClick: (eventId: string) => void;
  onRsvp: (eventId: string, status: 'going' | 'maybe') => void;
}

function EventCard({
  event,
  isPast = false,
  isRsvpPending,
  onEventClick,
  onRsvp,
}: EventCardProps) {
  const isVirtual =
    event.locationType === 'virtual' || event.locationType === 'hybrid' || Boolean(event.virtualLink) || !event.location;
  const rsvp = normalizeRsvp(event.userRSVP);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onEventClick(event.id)}
      onKeyDown={(eventKey) => {
        if (eventKey.key === 'Enter' || eventKey.key === ' ') {
          eventKey.preventDefault();
          onEventClick(event.id);
        }
      }}
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.06] p-4 text-left transition-colors',
        'hover:border-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        isPast && 'opacity-80'
      )}
      whileHover={{ opacity: 0.96 }}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-white">{event.title}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {isPast ? formatPastEventDateTime(event.startDate) : formatEventDateTime(event.startDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {isVirtual ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              {isVirtual ? 'Virtual' : event.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {event.currentAttendees} going
            </span>
          </div>

          <p className="mt-2 text-xs text-white/50">{getRsvpLabel(event.userRSVP)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={rsvp === 'going' ? 'secondary' : 'ghost'}
            size="sm"
            disabled={isRsvpPending}
            className={cn(rsvp === 'going' && 'text-[#FFD700] border-[#FFD700]/30')}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onRsvp(event.id, 'going');
            }}
          >
            Going
          </Button>
          <Button
            variant={rsvp === 'maybe' ? 'secondary' : 'ghost'}
            size="sm"
            disabled={isRsvpPending}
            className={cn(rsvp === 'maybe' && 'text-[#FFD700] border-[#FFD700]/30')}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onRsvp(event.id, 'maybe');
            }}
          >
            Interested
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function SpaceEventsTab({
  spaceId,
  isLeader,
  onCreateEvent,
  onEventClick,
}: SpaceEventsTabProps) {
  const queryClient = useQueryClient();
  const [showPastEvents, setShowPastEvents] = React.useState(false);
  const [pendingRsvpByEvent, setPendingRsvpByEvent] = React.useState<Record<string, boolean>>({});

  const upcomingQueryKey = React.useMemo(() => getEventsQueryKey(spaceId, true), [spaceId]);
  const pastQueryKey = React.useMemo(() => getEventsQueryKey(spaceId, false), [spaceId]);

  const {
    data: upcomingEvents = [],
    isLoading: isUpcomingLoading,
    error: upcomingError,
  } = useQuery({
    queryKey: upcomingQueryKey,
    queryFn: () => fetchEvents(spaceId, true),
    enabled: Boolean(spaceId),
    staleTime: 60 * 1000,
  });

  const {
    data: pastEvents = [],
    isLoading: isPastLoading,
    error: pastError,
  } = useQuery({
    queryKey: pastQueryKey,
    queryFn: () => fetchEvents(spaceId, false),
    enabled: Boolean(spaceId) && showPastEvents,
    staleTime: 60 * 1000,
  });

  const groupedUpcoming = React.useMemo(
    () => groupUpcomingEvents(upcomingEvents),
    [upcomingEvents]
  );

  const visibleEventCount = upcomingEvents.length + (showPastEvents ? pastEvents.length : 0);
  const isLoading = isUpcomingLoading || (showPastEvents && isPastLoading && pastEvents.length === 0);

  const handleRsvp = React.useCallback(
    async (eventId: string, status: 'going' | 'maybe') => {
      if (pendingRsvpByEvent[eventId]) return;

      const allEvents = [...upcomingEvents, ...pastEvents];
      const currentEvent = allEvents.find((event) => event.id === eventId);
      if (!currentEvent) return;

      const currentStatus = normalizeRsvp(currentEvent.userRSVP);
      if ((currentStatus === 'going' && status === 'going') || (currentStatus === 'maybe' && status === 'maybe')) {
        return;
      }

      setPendingRsvpByEvent((previous) => ({ ...previous, [eventId]: true }));

      try {
        const response = await secureApiFetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
          method: 'POST',
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as QueryResponse | null;
          const data = errorPayload?.data;
          const message =
            data?.message || errorPayload?.message || errorPayload?.error || 'Failed to RSVP';
          throw new Error(message);
        }

        const payload = (await response.json().catch(() => null)) as QueryResponse | null;
        const data = payload?.data ?? payload;
        const currentAttendees =
          typeof data?.currentAttendees === 'number' ? data.currentAttendees : undefined;

        queryClient.setQueryData<SpaceEvent[]>(
          upcomingQueryKey,
          (events) => updateEventWithRsvp(events, eventId, status, currentAttendees) ?? []
        );
        queryClient.setQueryData<SpaceEvent[]>(
          pastQueryKey,
          (events) => updateEventWithRsvp(events, eventId, status, currentAttendees) ?? []
        );
      } catch (error) {
        toast.error('RSVP failed', error instanceof Error ? error.message : 'Please try again');
      } finally {
        setPendingRsvpByEvent((previous) => ({ ...previous, [eventId]: false }));
      }
    },
    [pastEvents, pendingRsvpByEvent, queryClient, spaceId, upcomingEvents, upcomingQueryKey, pastQueryKey]
  );

  return (
    <div className="p-6 md:p-8">
      <motion.div
        className="mx-auto max-w-4xl space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
      >
        <div className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.06] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              {visibleEventCount} {visibleEventCount === 1 ? 'event' : 'events'}
            </p>
            <p className="text-xs text-white/50">
              {showPastEvents ? 'Upcoming and past events' : 'Upcoming events'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPastEvents((previous) => !previous)}
            >
              {showPastEvents ? 'Hide past events' : 'Show past events'}
            </Button>
            {isLeader && (
              <Button variant="cta" size="sm" onClick={onCreateEvent}>
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            )}
          </div>
        </div>

        {isLoading && <EventsSkeleton />}

        {!isLoading && upcomingEvents.length === 0 && (!showPastEvents || pastEvents.length === 0) && (
          <motion.div
            className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.06] px-4 py-20 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/[0.06]">
              <Calendar className="h-8 w-8 text-white/50" />
            </div>
            <h3 className="text-lg font-semibold text-white">No upcoming events</h3>
            {isLeader && (
              <Button variant="cta" size="sm" className="mt-5" onClick={onCreateEvent}>
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            )}
          </motion.div>
        )}

        {!isLoading && upcomingEvents.length > 0 && (
          <AnimatePresence mode="popLayout">
            {UPCOMING_GROUP_ORDER.map((group) => {
              const groupEvents = groupedUpcoming[group];
              if (groupEvents.length === 0) return null;

              return (
                <motion.section
                  key={group}
                  className="space-y-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
                >
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                    {group}
                  </h3>
                  <div className="space-y-3">
                    {groupEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isRsvpPending={Boolean(pendingRsvpByEvent[event.id])}
                        onEventClick={onEventClick}
                        onRsvp={handleRsvp}
                      />
                    ))}
                  </div>
                </motion.section>
              );
            })}
          </AnimatePresence>
        )}

        {!isLoading && showPastEvents && pastEvents.length > 0 && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
              Past Events
            </h3>
            <div className="space-y-3">
              {pastEvents
                .slice()
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                .map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isPast
                    isRsvpPending={Boolean(pendingRsvpByEvent[event.id])}
                    onEventClick={onEventClick}
                    onRsvp={handleRsvp}
                  />
                ))}
            </div>
          </motion.section>
        )}

        {!isLoading && (upcomingError || pastError) && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
            Failed to load some events. Pull to refresh and try again.
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default SpaceEventsTab;
