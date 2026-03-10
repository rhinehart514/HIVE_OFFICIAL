'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Check,
  Video,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { toast } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  locationType: string;
  virtualLink: string | null;
  type: string;
  imageUrl: string | null;
  maxAttendees: number | null;
  tags: string[];
  createdAt: string | null;
  space: {
    id: string;
    name: string;
    handle?: string;
    avatarUrl?: string;
  } | null;
  organizer: {
    id: string;
    name: string;
    handle?: string;
    photoURL?: string;
  } | null;
  rsvp: {
    goingCount: number;
    maybeCount: number;
    userStatus: string | null;
  };
  attendees: Array<{
    userId: string;
    name: string | null;
    photoURL: string | null;
    status: string;
  }>;
  friendsAttending: Array<{
    userId: string;
    name: string;
    photoURL?: string;
  }>;
  relatedEvents: Array<{
    id: string;
    title: string;
    startDate: string | null;
    location: string | null;
    rsvpCount: number;
  }>;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Date TBD';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string | null): string {
  if (!iso) return 'TBD';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EventDetailPageClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = React.useState<EventData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = React.useState(false);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const authResult = useAuth();
  const { user } = mounted ? authResult : { user: null };

  // Fetch event data
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/events/${eventId}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error ?? json?.message ?? 'Event not found');
        }

        const data = json?.data ?? json;
        if (!cancelled) {
          setEvent(data.event);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load event');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [eventId]);

  const handleRsvp = React.useCallback(async (status: 'going' | 'maybe' | 'not_going') => {
    if (!user) {
      toast.error('Sign in to RSVP', 'Create an account to RSVP to events.');
      return;
    }

    setRsvpLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? 'Failed to RSVP');
      }

      const data = json?.data ?? json;

      setEvent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rsvp: {
            ...prev.rsvp,
            userStatus: status,
            goingCount: typeof data?.currentAttendees === 'number'
              ? data.currentAttendees
              : prev.rsvp.goingCount + (status === 'going' ? 1 : 0),
          },
        };
      });

      if (status === 'going') toast.success("You're going!");
      else if (status === 'maybe') toast.success('Marked as maybe');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to RSVP');
    } finally {
      setRsvpLoading(false);
    }
  }, [eventId, user]);

  const handleShare = React.useCallback(async () => {
    const url = `${window.location.origin}/e/${eventId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title ?? 'Event', url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  }, [eventId, event?.title]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
            <div className="h-32 rounded-xl bg-white/[0.06]" />
            <div className="h-24 rounded-xl bg-white/[0.06]" />
            <div className="h-24 rounded-xl bg-white/[0.06]" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-semibold text-white mb-2">Event not found</h1>
          <p className="text-white/50 mb-6">{error ?? 'This event may have been removed.'}</p>
          <Link href="/" className="text-[var(--color-gold)] hover:underline">
            Back to HIVE
          </Link>
        </div>
      </div>
    );
  }

  const isOnline = event.locationType === 'virtual' || Boolean(event.virtualLink);
  const userStatus = event.rsvp.userStatus;
  const goingAttendees = event.attendees.filter(a => a.status === 'going');
  const maybeAttendees = event.attendees.filter(a => a.status === 'maybe');

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-ground)] border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">HIVE</span>
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={handleShare} aria-label="Share event">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Space badge */}
        {event.space && (
          <Link
            href={event.space.handle ? `/s/${event.space.handle}` : '#'}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.08] transition-colors"
          >
            <Avatar size="xs">
              {event.space.avatarUrl && <AvatarImage src={event.space.avatarUrl} />}
              <AvatarFallback>{getInitials(event.space.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/70">{event.space.name}</span>
            <ChevronRight className="w-3 h-3 text-white/30" />
          </Link>
        )}

        {/* Title */}
        <h1
          className="text-3xl font-bold text-white leading-tight"
          style={{ fontFamily: 'var(--font-clash)' }}
        >
          {event.title}
        </h1>

        {/* Date & Time card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-gold)]/10 flex-shrink-0">
              <Calendar className="w-5 h-5 text-[var(--color-gold)]" />
            </div>
            <div>
              <p className="font-medium text-white">{formatDate(event.startDate)}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-white/50" />
                <span className="text-sm text-white/50">
                  {formatTime(event.startDate)}
                  {event.endDate ? ` - ${formatTime(event.endDate)}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-gold)]/10 flex-shrink-0">
              {isOnline ? (
                <Video className="w-5 h-5 text-[var(--color-gold)]" />
              ) : (
                <MapPin className="w-5 h-5 text-[var(--color-gold)]" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">
                {event.location ?? (isOnline ? 'Online event' : 'Location TBD')}
              </p>
              {event.virtualLink && (
                <a
                  href={event.virtualLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--color-gold)] hover:opacity-80"
                >
                  Join link
                  <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* RSVP section */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/50" />
            <span className="text-sm text-white/50">
              {event.rsvp.goingCount} going
              {event.rsvp.maybeCount > 0 ? ` · ${event.rsvp.maybeCount} maybe` : ''}
            </span>
          </div>

          {/* Friends attending */}
          {event.friendsAttending.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {event.friendsAttending.slice(0, 3).map((friend) => (
                  <Avatar key={friend.userId} size="xs" className="ring-2 ring-[var(--bg-ground)]">
                    {friend.photoURL && <AvatarImage src={friend.photoURL} />}
                    <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-[var(--color-gold)]">
                {event.friendsAttending.length === 1
                  ? `${event.friendsAttending[0].name} is going`
                  : event.friendsAttending.length === 2
                    ? `${event.friendsAttending[0].name} + 1 friend going`
                    : `${event.friendsAttending[0].name} + ${event.friendsAttending.length - 1} friends going`}
              </span>
            </div>
          )}

          {user ? (
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
          ) : (
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Sign up to RSVP
              </Button>
            </Link>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
              About
            </h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Attendees */}
        {goingAttendees.length > 0 && (
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">
              Going ({goingAttendees.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {goingAttendees.map((a) => (
                <div
                  key={a.userId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06]"
                >
                  <Avatar size="xs">
                    {a.photoURL && <AvatarImage src={a.photoURL} />}
                    <AvatarFallback>{getInitials(a.name ?? '?')}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white/70">{a.name ?? 'Attendee'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {maybeAttendees.length > 0 && (
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">
              Maybe ({maybeAttendees.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {maybeAttendees.map((a) => (
                <div
                  key={a.userId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06]"
                >
                  <Avatar size="xs">
                    {a.photoURL && <AvatarImage src={a.photoURL} />}
                    <AvatarFallback>{getInitials(a.name ?? '?')}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white/50">{a.name ?? 'Attendee'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organizer */}
        {event.organizer && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">
              Hosted by
            </h2>
            <div className="flex items-center gap-3">
              <Avatar size="sm" className="ring-1 ring-white/[0.06]">
                {event.organizer.photoURL && <AvatarImage src={event.organizer.photoURL} />}
                <AvatarFallback>{getInitials(event.organizer.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">{event.organizer.name}</p>
                {event.organizer.handle && (
                  <p className="text-xs text-white/50">@{event.organizer.handle}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs bg-white/[0.06] text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Related events */}
        {event.relatedEvents.length > 0 && (
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">
              More from {event.space?.name ?? 'this org'}
            </h2>
            <div className="space-y-2">
              {event.relatedEvents.map((re) => (
                <Link
                  key={re.id}
                  href={`/e/${re.id}`}
                  className="block rounded-xl border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.06] p-3 transition-colors"
                >
                  <p className="text-sm font-medium text-white truncate">{re.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                    <span>{formatShortDate(re.startDate)}</span>
                    {re.location && <span>{re.location}</span>}
                    <span>{re.rsvpCount} going</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Share CTA */}
        <div className="pt-4 border-t border-white/[0.06]">
          <Button variant="default" className="w-full" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Event
          </Button>
        </div>
      </div>
    </div>
  );
}
