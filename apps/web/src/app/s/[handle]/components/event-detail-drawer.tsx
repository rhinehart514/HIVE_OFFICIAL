'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Users,
  Video,
  X,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  getInitials,
  MOTION,
  Text,
} from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';

type RSVPStatus = 'going' | 'maybe' | 'not_going';

interface EventDetailDrawerProps {
  eventId: string | null;
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  startDate?: unknown;
  startTime?: unknown;
  startAt?: unknown;
  endDate?: unknown;
  endTime?: unknown;
  endAt?: unknown;
  location?: string;
  locationName?: string;
  locationType?: string;
  isOnline?: boolean;
  virtualLink?: string;
  currentAttendees?: number;
  goingCount?: number;
  userRSVP?: RSVPStatus | null;
  userRsvp?: RSVPStatus | null;
  organizer?: {
    id: string;
    fullName?: string;
    handle?: string;
    photoURL?: string;
  } | null;
  organizerName?: string;
  organizerHandle?: string;
  organizerAvatarUrl?: string;
}

const RSVP_OPTIONS: Array<{ status: RSVPStatus; label: string }> = [
  { status: 'going', label: 'Going' },
  { status: 'maybe', label: 'Maybe' },
  { status: 'not_going', label: 'Not Going' },
];

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'object') {
    const dateLike = value as {
      toDate?: () => Date;
      _seconds?: number;
      seconds?: number;
    };

    if (typeof dateLike.toDate === 'function') {
      const date = dateLike.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const seconds =
      typeof dateLike._seconds === 'number'
        ? dateLike._seconds
        : typeof dateLike.seconds === 'number'
          ? dateLike.seconds
          : null;

    if (seconds !== null) {
      const date = new Date(seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

function formatDate(date: Date | null): string {
  if (!date) return 'Date TBD';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeRange(start: Date | null, end: Date | null): string {
  if (!start) return 'Time TBD';

  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (!end) {
    return startTime;
  }

  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${startTime} - ${endTime}`;
}

function getResponsePayload<T = unknown>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as { data?: T };
  if (root.data) return root.data;
  return payload as T;
}

function getEventFromPayload(payload: unknown): EventDetail | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as { event?: EventDetail };
  if (root.event) return root.event;
  return payload as EventDetail;
}

export function EventDetailDrawer({
  eventId,
  spaceId,
  isOpen,
  onClose,
}: EventDetailDrawerProps) {
  const [event, setEvent] = React.useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSavingStatus, setIsSavingStatus] = React.useState<RSVPStatus | null>(null);

  React.useEffect(() => {
    if (!isOpen || !eventId || !spaceId) return;

    let cancelled = false;

    const loadEvent = async () => {
      setIsLoading(true);
      setError(null);
      setEvent(null);

      try {
        const response = await fetch(`/api/spaces/${spaceId}/events/${eventId}`);
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            (json as { error?: string; message?: string })?.error ||
            (json as { error?: string; message?: string })?.message ||
            'Failed to load event details';
          throw new Error(message);
        }

        const data = getResponsePayload<{ event?: EventDetail }>(json);
        const eventData = getEventFromPayload(data);
        if (!eventData) {
          throw new Error('Event details unavailable');
        }

        if (!cancelled) {
          setEvent(eventData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load event details');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventId, isOpen, spaceId]);

  const handleRsvp = React.useCallback(async (status: RSVPStatus) => {
    if (!eventId || !spaceId) return;

    setError(null);
    setIsSavingStatus(status);

    try {
      const response = await fetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (json as { error?: string; message?: string })?.error ||
          (json as { error?: string; message?: string })?.message ||
          'Failed to update RSVP';
        throw new Error(message);
      }

      const data = getResponsePayload<{ currentAttendees?: number }>(json);
      const nextCount = data?.currentAttendees;

      setEvent((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          userRSVP: status,
          userRsvp: status,
          ...(typeof nextCount === 'number'
            ? {
                currentAttendees: nextCount,
                goingCount: nextCount,
              }
            : {}),
        };
      });
    } catch (rsvpError) {
      const message = rsvpError instanceof Error ? rsvpError.message : 'Failed to update RSVP';
      setError(message);
      toast.error(message);
    } finally {
      setIsSavingStatus(null);
    }
  }, [eventId, spaceId]);

  const start = React.useMemo(() => {
    if (!event) return null;
    return parseDate(event.startDate ?? event.startTime ?? event.startAt);
  }, [event]);

  const end = React.useMemo(() => {
    if (!event) return null;
    return parseDate(event.endDate ?? event.endTime ?? event.endAt);
  }, [event]);

  const userRsvp = event?.userRSVP ?? event?.userRsvp ?? null;
  const attendeeCount = event?.currentAttendees ?? event?.goingCount ?? 0;
  const isOnline = Boolean(event?.isOnline || event?.locationType === 'virtual' || event?.virtualLink);
  const location = event?.location || event?.locationName || (isOnline ? 'Online event' : 'Location TBD');
  const organizerName = event?.organizer?.fullName || event?.organizerName || 'Unknown organizer';
  const organizerHandle = event?.organizer?.handle || event?.organizerHandle;
  const organizerAvatar = event?.organizer?.photoURL || event?.organizerAvatarUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION.duration.fast }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative h-full w-full max-w-md bg-[var(--bg-ground)] border-l border-white/[0.06] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <Text weight="medium" className="text-white">
                Event details
              </Text>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close event details"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-7 w-4/5 rounded bg-white/[0.06]" />
                  <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
                  <div className="h-24 rounded-xl bg-white/[0.06]" />
                  <div className="h-20 rounded-xl bg-white/[0.06]" />
                </div>
              )}

              {!isLoading && error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <Text size="sm" className="text-red-300">
                    {error}
                  </Text>
                </div>
              )}

              {!isLoading && !error && event && (
                <div className="space-y-6">
                  <div>
                    <h2
                      className="text-title font-semibold text-white"
                      style={{ fontFamily: 'var(--font-clash)' }}
                    >
                      {event.title}
                    </h2>
                    {event.description && (
                      <p className="mt-2 text-sm text-white/50 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.06] p-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-[var(--color-gold)] mt-0.5" />
                        <div className="min-w-0">
                          <Text size="sm" className="text-white">
                            {formatDate(start)}
                          </Text>
                          <div className="mt-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-white/50" />
                            <Text size="xs" tone="muted" className="text-white/50">
                              {formatTimeRange(start, end)}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.06] p-4">
                      <div className="flex items-start gap-3">
                        {isOnline ? (
                          <Video className="w-4 h-4 text-[var(--color-gold)] mt-0.5" />
                        ) : (
                          <MapPin className="w-4 h-4 text-[var(--color-gold)] mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <Text size="sm" className="text-white">
                            {location}
                          </Text>
                          {event.virtualLink && (
                            <a
                              href={event.virtualLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-gold)] hover:opacity-80 transition-opacity"
                            >
                              Join link
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.06] p-4">
                    <Text size="xs" weight="medium" className="uppercase tracking-wider text-white/50">
                      RSVP
                    </Text>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {RSVP_OPTIONS.map((option) => {
                        const isActive = userRsvp === option.status;
                        return (
                          <Button
                            key={option.status}
                            size="sm"
                            variant={
                              isActive
                                ? option.status === 'not_going'
                                  ? 'destructive'
                                  : 'primary'
                                : 'default'
                            }
                            loading={isSavingStatus === option.status}
                            disabled={isSavingStatus !== null}
                            onClick={() => handleRsvp(option.status)}
                          >
                            {option.label}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-white/50">
                      <Users className="w-3.5 h-3.5" />
                      <Text size="xs" tone="muted" className="text-white/50">
                        {attendeeCount} going
                      </Text>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.06] p-4">
                    <Text size="xs" weight="medium" className="uppercase tracking-wider text-white/50">
                      Organizer
                    </Text>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar size="sm" className="ring-1 ring-white/[0.06]">
                        {organizerAvatar && <AvatarImage src={organizerAvatar} />}
                        <AvatarFallback>{getInitials(organizerName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Text size="sm" className="text-white truncate">
                          {organizerName}
                        </Text>
                        {organizerHandle && (
                          <Text size="xs" tone="muted" className="text-white/50 truncate">
                            @{organizerHandle}
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

EventDetailDrawer.displayName = 'EventDetailDrawer';

export default EventDetailDrawer;
