'use client';

/**
 * Event Share Link Page - /e/[code]
 *
 * Public event preview page for shareable event links.
 * Pattern: Fetch event by shortcode, show preview modal, RSVP, optional signup.
 *
 * GTM Loop: Event discovery -> RSVP -> signup if not authenticated
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowRightIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Button, toast } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';

interface EventData {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  virtualLink?: string;
  currentAttendees: number;
  maxAttendees?: number;
  organizerName?: string;
  organizerAvatarUrl?: string;
  spaceId: string;
  spaceName: string;
  spaceEmoji?: string;
  userRSVP?: 'going' | 'maybe' | 'not_going' | null;
}

export default function EventSharePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const code = params?.code;

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRsvping, setIsRsvping] = React.useState(false);

  // Fetch event by shortcode
  React.useEffect(() => {
    if (!code) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/by-code/${code}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Event not found');
          } else {
            setError('Failed to load event');
          }
          return;
        }
        const data = await res.json();
        setEvent(data.event);
      } catch {
        setError('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchEvent();
  }, [code]);

  // Handle RSVP
  const handleRSVP = async (status: 'going' | 'maybe') => {
    if (!event) return;

    // If not authenticated, redirect to login with return URL
    if (!user) {
      const returnUrl = `/e/${code}?rsvp=${status}`;
      router.push(`/enter?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsRsvping(true);
    try {
      const res = await fetch(`/api/spaces/${event.spaceId}/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to RSVP');
      }

      setEvent((prev) => prev ? { ...prev, userRSVP: status } : null);
      toast.success(
        status === 'going' ? "You're going!" : 'Marked as maybe',
        `We'll remind you before ${event.title}`
      );
    } catch {
      toast.error('RSVP failed', 'Please try again');
    } finally {
      setIsRsvping(false);
    }
  };

  // Format date
  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <CalendarIcon className="w-8 h-8 text-white/30" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">
            Event not found
          </h1>
          <p className="text-white/50 mb-6">
            This event may have ended or the link is invalid.
          </p>
          <Button onClick={() => router.push('/spaces')}>
            Browse Spaces
          </Button>
        </div>
      </div>
    );
  }

  const { dayOfWeek, date, time } = formatEventDate(event.startDate);
  const isVirtual = !!event.virtualLink;
  const isFull = event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false;

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Space badge */}
          <button
            onClick={() => router.push(`/spaces/${event.spaceId}`)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 hover:bg-white/[0.08] transition-colors mb-6"
          >
            {event.spaceEmoji && <span>{event.spaceEmoji}</span>}
            <span>{event.spaceName}</span>
            <ArrowRightIcon className="w-3 h-3" />
          </button>

          {/* Event card */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06]">
              <div className="flex items-start gap-4 mb-4">
                {/* Date badge */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[var(--life-gold)]/10 border border-[var(--life-gold)]/20 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-[var(--life-gold)] uppercase tracking-wide">
                    {date.split(' ')[0]}
                  </span>
                  <span className="text-lg font-bold text-[var(--life-gold)]">
                    {date.split(' ')[1]}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-white mb-1">
                    {event.title}
                  </h1>
                  <p className="text-sm text-white/50">
                    {dayOfWeek} at {time}
                  </p>
                </div>
              </div>

              {event.description && (
                <p className="text-white/60 text-sm leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Location */}
              {(event.location || isVirtual) && (
                <div className="flex items-start gap-3">
                  {isVirtual ? (
                    <VideoCameraIcon className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                  ) : (
                    <MapPinIcon className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-white/70 text-sm">
                      {isVirtual ? 'Virtual Event' : event.location}
                    </p>
                    {isVirtual && user && (
                      <a
                        href={event.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--life-gold)] text-sm hover:underline"
                      >
                        Join link (visible after RSVP)
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Attendees */}
              <div className="flex items-center gap-3">
                <UserGroupIcon className="w-5 h-5 text-white/40" />
                <p className="text-white/70 text-sm">
                  {event.currentAttendees} going
                  {event.maxAttendees && ` · ${event.maxAttendees - event.currentAttendees} spots left`}
                </p>
              </div>

              {/* Organizer */}
              {event.organizerName && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center">
                    {event.organizerAvatarUrl ? (
                      <img
                        src={event.organizerAvatarUrl}
                        alt={event.organizerName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-white/40">
                        {event.organizerName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-sm">
                    Hosted by {event.organizerName}
                  </p>
                </div>
              )}
            </div>

            {/* RSVP actions */}
            <div className="p-6 border-t border-white/[0.06] bg-white/[0.01]">
              {event.userRSVP ? (
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-2">
                    {event.userRSVP === 'going' ? "You're going!" : "You're marked as maybe"}
                  </p>
                  <button
                    onClick={() => router.push(`/spaces/${event.spaceId}/events`)}
                    className="text-[var(--life-gold)] text-sm hover:underline"
                  >
                    View all events
                  </button>
                </div>
              ) : isFull ? (
                <div className="text-center">
                  <p className="text-white/50 text-sm">This event is full</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleRSVP('going')}
                    disabled={isRsvping}
                    className="flex-1"
                    variant="cta"
                  >
                    {isRsvping ? 'Saving...' : "I'm going"}
                  </Button>
                  <Button
                    onClick={() => handleRSVP('maybe')}
                    disabled={isRsvping}
                    variant="secondary"
                    className="flex-1"
                  >
                    Maybe
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Not logged in prompt */}
          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <p className="text-white/40 text-sm">
                Sign up with your .edu email to RSVP and join {event.spaceName}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
