'use client';

/**
 * EventList - List of campus events
 *
 * Shows upcoming events with RSVP counts and space context.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GlassSurface, Badge, Button, MOTION } from '@hive/ui/design-system/primitives';
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
  rsvpCount: number;
  isLive?: boolean;
}

export interface EventListProps {
  events: EventData[];
  loading?: boolean;
  searchQuery?: string;
}

export function EventList({ events, loading, searchQuery }: EventListProps) {
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

  // Empty state
  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center py-16"
      >
        <p className="text-white/40 text-[15px] mb-2">
          {searchQuery
            ? `No events match "${searchQuery}"`
            : 'No upcoming events'}
        </p>
        <p className="text-white/25 text-[13px]">
          Events from your spaces will appear here
        </p>
      </motion.div>
    );
  }

  // Group events by date
  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
        <div key={dateKey} className="space-y-3">
          <h3 className="text-[12px] text-white/40 uppercase tracking-wider">
            {dateKey}
          </h3>
          <div className="space-y-3">
            {dateEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EVENT CARD
// ============================================

interface EventCardProps {
  event: EventData;
  index: number;
}

function EventCard({ event, index }: EventCardProps) {
  const timeString = formatEventTime(event.startTime, event.endTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: index * 0.03,
        ease: MOTION.ease.premium,
      }}
    >
      <GlassSurface
        intensity="subtle"
        className={cn(
          'p-4 rounded-xl transition-all duration-200',
          'border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]',
          event.isLive && 'border-[var(--life-gold)]/30'
        )}
      >
        <div className="flex items-start gap-4">
          {/* Time column */}
          <div className="w-16 shrink-0 text-center">
            <p className="text-[12px] text-white/40">{timeString.time}</p>
            {event.isLive && (
              <Badge variant="gold" size="sm" className="mt-1">
                Live
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-medium text-white truncate">
              {event.title}
            </h3>

            {event.description && (
              <p className="text-[13px] text-white/50 line-clamp-1 mt-0.5">
                {event.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-[12px] text-white/30">
              {event.location && <span>{event.location}</span>}
              {event.spaceName && (
                <>
                  {event.location && <span>·</span>}
                  <Link
                    href={`/s/${event.spaceHandle}`}
                    className="hover:text-white/50"
                  >
                    @{event.spaceHandle}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* RSVP */}
          <div className="shrink-0 text-right">
            <p className="text-[12px] text-white/40">{event.rsvpCount} going</p>
            <Button variant="ghost" size="sm" className="mt-1">
              RSVP
            </Button>
          </div>
        </div>
      </GlassSurface>
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
  end?: Date
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
