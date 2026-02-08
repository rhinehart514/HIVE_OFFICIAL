'use client';

/**
 * EventList - List of campus events
 *
 * Shows upcoming events with RSVP counts and space context.
 * Uses stagger container for orchestrated reveals.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Users, Search } from 'lucide-react';
import { GlassSurface, Badge, Button } from '@hive/ui/design-system/primitives';
import { MOTION, revealVariants, staggerContainerVariants, cardHoverVariants } from '@hive/tokens';
import { toast } from '@hive/ui';
import { cn } from '@/lib/utils';

export interface EventData {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  spaceName?: string;
  spaceHandle?: string;
  spaceId?: string;
  rsvpCount: number;
  isLive?: boolean;
  userRsvp?: 'going' | 'maybe' | 'not_going';
}

export interface EventListProps {
  events: EventData[];
  loading?: boolean;
  searchQuery?: string;
  onRSVP?: (eventId: string, spaceId: string, status: 'going' | 'maybe' | 'not_going') => Promise<void>;
}

export function EventList({ events, loading, searchQuery, onRSVP }: EventListProps) {
  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state with helpful guidance
  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.standard, ease: MOTION.ease.premium }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <GlassSurface
          intensity="subtle"
          className="p-8 rounded-xl max-w-md w-full text-center"
        >
          {/* Icon */}
          <motion.div
            className="w-14 h-14 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {searchQuery ? (
              <Search className="w-6 h-6 text-white/30" />
            ) : (
              <Calendar className="w-6 h-6 text-white/30" />
            )}
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-body-lg font-medium text-white/80 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            {searchQuery
              ? `No events match "${searchQuery}"`
              : 'Your calendar is open'}
          </motion.h3>

          {/* Subtitle */}
          <motion.p
            className="text-body-sm text-white/40 mb-6 max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            {searchQuery
              ? 'Try a different search or browse all upcoming events'
              : 'Events from your spaces will appear here. Join spaces to see what\'s happening on campus.'}
          </motion.p>

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
          >
            <Button variant="default" size="sm" asChild>
              <Link href="/explore?tab=spaces">
                <Users className="w-4 h-4 mr-1.5" />
                Find Spaces
              </Link>
            </Button>
            {searchQuery && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/explore?tab=events">See All Events</Link>
              </Button>
            )}
          </motion.div>

          {/* Helpful hint */}
          {!searchQuery && (
            <motion.p
              className="text-label text-white/25 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              Meetings, workshops, and hangouts all show up here
            </motion.p>
          )}
        </GlassSurface>
      </motion.div>
    );
  }

  // Group events by date
  const groupedEvents = groupEventsByDate(events);

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
        <motion.div key={dateKey} className="space-y-3" variants={revealVariants}>
          <h3 className="text-label text-white/40 uppercase tracking-wider">
            {dateKey}
          </h3>
          <motion.div
            className="space-y-3"
            variants={staggerContainerVariants}
          >
            {dateEvents.map((event) => (
              <EventCard key={event.id} event={event} onRSVP={onRSVP} />
            ))}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ============================================
// EVENT CARD
// ============================================

interface EventCardProps {
  event: EventData;
  onRSVP?: (eventId: string, spaceId: string, status: 'going' | 'maybe' | 'not_going') => Promise<void>;
}

function EventCard({ event, onRSVP }: EventCardProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [localRsvp, setLocalRsvp] = React.useState(event.userRsvp);
  const timeString = formatEventTime(event.startTime, event.endTime);

  // Determine RSVP button state
  const isGoing = localRsvp === 'going';
  const rsvpLabel = isGoing ? 'Going ✓' : 'RSVP';

  const handleRSVP = async () => {
    if (!event.spaceId || !onRSVP) {
      toast.error('Cannot RSVP', 'Event is missing space information.');
      return;
    }
    const newStatus = isGoing ? 'not_going' : 'going';
    setIsSubmitting(true);
    try {
      await onRSVP(event.id, event.spaceId, newStatus);
      setLocalRsvp(newStatus);
      toast.success(newStatus === 'going' ? "You're going!" : 'RSVP removed');
    } catch (err) {
      toast.error('RSVP failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={revealVariants}
      whileHover="hover"
      initial="initial"
    >
      <Link href={event.spaceHandle ? `/s/${event.spaceHandle}/events/${event.id}` : '#'}>
        <motion.div variants={cardHoverVariants}>
          <GlassSurface
            intensity="subtle"
            className={cn(
              'group p-4 rounded-xl transition-colors duration-200',
              'border border-white/[0.06] hover:border-white/10',
              event.isLive && 'border-[var(--life-gold)]/30'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Time column */}
              <div className="w-16 shrink-0 text-center">
                <p className="text-label text-white/40 group-hover:text-white/60 transition-colors">
                  {timeString.time}
                </p>
                {event.isLive && (
                  <Badge variant="gold" size="sm" className="mt-1">
                    Live
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Space context - now more prominent */}
                {event.spaceName && (
                  <p className="text-label-sm text-white/30 mb-1">
                    {event.spaceName}
                  </p>
                )}

                <h3 className="text-body font-medium text-white truncate group-hover:text-white/90">
                  {event.title}
                </h3>

                {event.description && (
                  <p className="text-body-sm text-white/50 line-clamp-1 mt-0.5">
                    {event.description}
                  </p>
                )}

                {/* Location and attendees */}
                <div className="flex items-center gap-3 mt-2 text-label text-white/30">
                  {event.location && <span>{event.location}</span>}
                  {event.rsvpCount > 0 && (
                    <>
                      {event.location && <span>·</span>}
                      <span>{event.rsvpCount} going</span>
                    </>
                  )}
                </div>
              </div>

              {/* RSVP - shows user state */}
              <div className="shrink-0 text-right">
                <Button
                  variant={isGoing ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    isGoing && 'text-[var(--life-gold)] border-[var(--life-gold)]/30'
                  )}
                  disabled={isSubmitting || !event.spaceId}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRSVP();
                  }}
                >
                  {isSubmitting ? '...' : rsvpLabel}
                </Button>
              </div>
            </div>
          </GlassSurface>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ============================================
// SKELETON
// ============================================

function EventCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 space-y-1">
          <div className="h-3 w-12 bg-white/[0.06] rounded mx-auto" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
          <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
        </div>
        <div className="w-16 space-y-1">
          <div className="h-3 w-12 bg-white/[0.04] rounded ml-auto" />
          <div className="h-7 w-14 bg-white/[0.04] rounded ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function groupEventsByDate(events: EventData[]): Record<string, EventData[]> {
  const groups: Record<string, EventData[]> = {};

  for (const event of events) {
    const dateKey = formatDateKey(event.startTime);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
  }

  return groups;
}

function formatDateKey(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, tomorrow)) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatEventTime(
  start: Date,
  _end?: Date
): { time: string; date: string } {
  const timeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    time: timeStr,
    date: start.toLocaleDateString(),
  };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
