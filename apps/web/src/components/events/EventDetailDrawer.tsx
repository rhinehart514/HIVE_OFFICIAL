'use client';

/**
 * EventDetailDrawer — Mobile drawer for event details.
 * Slides up from bottom. Used in Feed and Space stream when tapping event cards.
 */

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Check,
  Video,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';

interface EventDrawerData {
  id: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  locationType?: string;
  virtualLink?: string | null;
  type?: string;
  space?: {
    id: string;
    name: string;
    handle?: string;
    avatarUrl?: string;
  } | null;
  organizer?: {
    id: string;
    name: string;
    handle?: string;
    photoURL?: string;
  } | null;
  rsvp?: {
    goingCount: number;
    maybeCount: number;
    userStatus: string | null;
  };
  attendees?: Array<{
    userId: string;
    name: string | null;
    photoURL: string | null;
    status: string;
  }>;
  friendsAttending?: Array<{
    userId: string;
    name: string;
    photoURL?: string;
  }>;
}

interface EventDetailDrawerProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Date TBD';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EventDetailDrawer({ eventId, isOpen, onClose }: EventDetailDrawerProps) {
  const [event, setEvent] = React.useState<EventDrawerData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !eventId) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setEvent(null);

      try {
        const res = await fetch(`/api/events/${eventId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load event');

        const data = json?.data ?? json;
        if (!cancelled) setEvent(data.event);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [eventId, isOpen]);

  const handleRsvp = React.useCallback(async (status: 'going' | 'maybe' | 'not_going') => {
    if (!eventId) return;
    setRsvpLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Failed to RSVP');

      const data = json?.data ?? json;
      setEvent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rsvp: {
            ...prev.rsvp!,
            userStatus: status,
            goingCount: typeof data?.currentAttendees === 'number'
              ? data.currentAttendees
              : (prev.rsvp?.goingCount ?? 0),
          },
        };
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to RSVP');
    } finally {
      setRsvpLoading(false);
    }
  }, [eventId]);

  const handleShare = React.useCallback(async () => {
    if (!eventId) return;
    const url = `${window.location.origin}/e/${eventId}`;
    if (navigator.share) {
      try { await navigator.share({ title: event?.title ?? 'Event', url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  }, [eventId, event?.title]);

  const isOnline = event?.locationType === 'virtual' || Boolean(event?.virtualLink);
  const userStatus = event?.rsvp?.userStatus ?? null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Drawer */}
          <motion.div
            className="relative w-full max-w-lg max-h-[85vh] bg-[var(--bg-ground)] border-t border-white/[0.05] rounded-t-2xl flex flex-col overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-white/[0.05]">
              <span className="text-sm font-medium text-white/50">Event details</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" onClick={handleShare} aria-label="Share">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {isLoading && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-6 w-3/4 rounded bg-white/[0.05]" />
                  <div className="h-20 rounded-xl bg-white/[0.05]" />
                  <div className="h-16 rounded-xl bg-white/[0.05]" />
                </div>
              )}

              {!isLoading && error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {!isLoading && !error && event && (
                <>
                  {/* Space badge */}
                  {event.space && (
                    <div className="flex items-center gap-2">
                      <Avatar size="xs">
                        {event.space.avatarUrl && <AvatarImage src={event.space.avatarUrl} />}
                        <AvatarFallback>{getInitials(event.space.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-white/50">{event.space.name}</span>
                    </div>
                  )}

                  {/* Title */}
                  <h2
                    className="text-xl font-semibold text-white"
                    style={{ fontFamily: 'var(--font-clash)' }}
                  >
                    {event.title}
                  </h2>

                  {/* Date/time */}
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.05] p-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[var(--color-gold)]" />
                      <div>
                        <p className="text-sm text-white">{formatDate(event.startDate)}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-white/50" />
                          <span className="text-xs text-white/50">
                            {formatTime(event.startDate)}
                            {event.endDate ? ` - ${formatTime(event.endDate)}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.05] p-3">
                    <div className="flex items-center gap-3">
                      {isOnline ? (
                        <Video className="w-4 h-4 text-[var(--color-gold)]" />
                      ) : (
                        <MapPin className="w-4 h-4 text-[var(--color-gold)]" />
                      )}
                      <div>
                        <p className="text-sm text-white">
                          {event.location ?? (isOnline ? 'Online event' : 'Location TBD')}
                        </p>
                        {event.virtualLink && (
                          <a
                            href={event.virtualLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--color-gold)] hover:opacity-80"
                          >
                            Join link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RSVP */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-sm text-white/50">
                        {event.rsvp?.goingCount ?? 0} going
                      </span>
                    </div>

                    {/* Friends attending */}
                    {event.friendsAttending && event.friendsAttending.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {event.friendsAttending.slice(0, 3).map((f) => (
                            <Avatar key={f.userId} size="xs" className="ring-2 ring-[var(--bg-ground)]">
                              {f.photoURL && <AvatarImage src={f.photoURL} />}
                              <AvatarFallback>{getInitials(f.name)}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-[var(--color-gold)]">
                          {event.friendsAttending[0].name}
                          {event.friendsAttending.length > 1
                            ? ` + ${event.friendsAttending.length - 1} friend${event.friendsAttending.length > 2 ? 's' : ''} going`
                            : ' is going'}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant={userStatus === 'going' ? 'primary' : 'default'}
                        onClick={() => handleRsvp(userStatus === 'going' ? 'not_going' : 'going')}
                        disabled={rsvpLoading}
                      >
                        {userStatus === 'going' && <Check className="w-3.5 h-3.5 mr-1" />}
                        Going
                      </Button>
                      <Button
                        size="sm"
                        variant={userStatus === 'maybe' ? 'primary' : 'default'}
                        onClick={() => handleRsvp(userStatus === 'maybe' ? 'not_going' : 'maybe')}
                        disabled={rsvpLoading}
                      >
                        Maybe
                      </Button>
                      <Button
                        size="sm"
                        variant={userStatus === 'not_going' ? 'destructive' : 'default'}
                        onClick={() => handleRsvp('not_going')}
                        disabled={rsvpLoading}
                      >
                        Can&apos;t Go
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}

                  {/* Organizer */}
                  {event.organizer && (
                    <div className="flex items-center gap-3 pt-2">
                      <Avatar size="sm" className="ring-1 ring-white/[0.05]">
                        {event.organizer.photoURL && <AvatarImage src={event.organizer.photoURL} />}
                        <AvatarFallback>{getInitials(event.organizer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-white">{event.organizer.name}</p>
                        {event.organizer.handle && (
                          <p className="text-xs text-white/50">@{event.organizer.handle}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Full page link */}
                  <Link
                    href={`/e/${event.id}`}
                    className="block text-center text-sm text-[var(--color-gold)] hover:opacity-80 pt-2"
                  >
                    View full event page
                  </Link>
                </>
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
