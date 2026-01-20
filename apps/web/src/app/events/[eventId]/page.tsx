'use client';

/**
 * /events/[eventId] — Event Detail
 *
 * Archetype: Orientation
 * Purpose: View event details and RSVP
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - Full event information display
 * - RSVP functionality
 * - Location, time, host info
 * - Link to attendees list
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { Text, Heading, Card, Button, Badge, SimpleAvatar, getInitials } from '@hive/ui/design-system/primitives';
import { useAuth } from '@hive/auth-logic';

interface EventDetail {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
  locationUrl?: string;
  isVirtual: boolean;
  virtualLink?: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  spaceId: string;
  spaceName: string;
  attendeeCount: number;
  maxAttendees?: number;
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  rsvpStatus?: 'going' | 'maybe' | 'not_going' | null;
  coverImage?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const eventId = params?.eventId as string;

  const [event, setEvent] = React.useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRsvping, setIsRsvping] = React.useState(false);

  // Fetch event details
  React.useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;

      try {
        const res = await fetch(`/api/events/${eventId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
        }
      } catch {
        // Failed to fetch event
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  // Handle RSVP
  const handleRsvp = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!isAuthenticated) {
      router.push(`/enter?from=/events/${eventId}`);
      return;
    }

    setIsRsvping(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setEvent(prev => prev ? { ...prev, rsvpStatus: status } : null);
      }
    } catch {
      // Failed to RSVP
    } finally {
      setIsRsvping(false);
    }
  };

  // Format date/time
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }),
    };
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="text-center">
          <Text size="lg" weight="medium" className="mb-2">Event not found</Text>
          <Button variant="secondary" onClick={() => router.push('/events')}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(event.startAt);

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link
            href={`/spaces/${event.spaceId}`}
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            {event.spaceName}
          </Link>
        </div>

        {/* Cover image */}
        {event.coverImage && (
          <div className="aspect-[2/1] rounded-xl overflow-hidden mb-6 bg-white/[0.04]">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Status badge */}
        {event.status !== 'upcoming' && (
          <Badge
            variant={event.status === 'ongoing' ? 'gold' : 'neutral'}
            className="mb-3"
          >
            {event.status === 'ongoing' ? 'Happening Now' :
             event.status === 'past' ? 'Past Event' : 'Cancelled'}
          </Badge>
        )}

        {/* Title */}
        <Heading level={1} className="text-2xl mb-4">
          {event.title}
        </Heading>

        {/* Key details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-white/70">
            <Calendar className="h-5 w-5 text-white/40" />
            <Text>{date}</Text>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <Clock className="h-5 w-5 text-white/40" />
            <Text>{time}</Text>
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-white/70">
              <MapPin className="h-5 w-5 text-white/40" />
              <Text>{event.location}</Text>
              {event.locationUrl && (
                <a
                  href={event.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white/60"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
          {event.isVirtual && event.virtualLink && (
            <div className="flex items-center gap-3 text-white/70">
              <ExternalLink className="h-5 w-5 text-white/40" />
              <a
                href={event.virtualLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--life-gold)] hover:underline"
              >
                Join Virtual Event
              </a>
            </div>
          )}
        </div>

        {/* Host */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <SimpleAvatar
              src={event.hostAvatar}
              fallback={getInitials(event.hostName)}
              size="default"
            />
            <div>
              <Text size="xs" tone="muted">Hosted by</Text>
              <Link
                href={`/profile/${event.hostId}`}
                className="font-medium hover:text-white/80"
              >
                {event.hostName}
              </Link>
            </div>
          </div>
        </Card>

        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <Text size="sm" tone="muted" className="uppercase tracking-wider mb-2">
              About
            </Text>
            <Text className="whitespace-pre-wrap">{event.description}</Text>
          </div>
        )}

        {/* Attendees summary */}
        <Link href={`/events/${eventId}/attendees`}>
          <Card interactive className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-white/40" />
                <div>
                  <Text weight="medium">{event.attendeeCount} attending</Text>
                  {event.maxAttendees && (
                    <Text size="xs" tone="muted">
                      {event.maxAttendees - event.attendeeCount} spots left
                    </Text>
                  )}
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-white/40 rotate-180" />
            </div>
          </Card>
        </Link>

        {/* RSVP buttons */}
        {event.status === 'upcoming' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={event.rsvpStatus === 'going' ? 'default' : 'secondary'}
                onClick={() => handleRsvp('going')}
                disabled={isRsvping}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Going
              </Button>
              <Button
                variant={event.rsvpStatus === 'maybe' ? 'default' : 'secondary'}
                onClick={() => handleRsvp('maybe')}
                disabled={isRsvping}
                className="flex-1"
              >
                Maybe
              </Button>
              <Button
                variant={event.rsvpStatus === 'not_going' ? 'default' : 'secondary'}
                onClick={() => handleRsvp('not_going')}
                disabled={isRsvping}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Can't Go
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                navigator.share?.({
                  title: event.title,
                  url: window.location.href,
                });
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Event
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
