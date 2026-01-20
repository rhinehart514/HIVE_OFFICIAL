'use client';

/**
 * EventsMode Component
 *
 * Full-screen events view for theater mode.
 * Bento grid layout with event cards.
 *
 * Features:
 * - Next event hero at top (if < 24h away)
 * - Bento grid of upcoming events (large) and past (small)
 * - Calendar toggle option
 * - RSVP actions prominent
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface SpaceEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  location?: string;
  isOnline?: boolean;
  coverUrl?: string;
  rsvpCount?: number;
  maxAttendees?: number;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  hostName?: string;
  hostAvatarUrl?: string;
}

export interface EventsModeProps {
  /** Space ID */
  spaceId: string;
  /** Events to display */
  events: SpaceEvent[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Can user create events */
  canCreate?: boolean;
  /** RSVP callback */
  onRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
  /** View event details */
  onViewEvent?: (eventId: string) => void;
  /** Create event */
  onCreateEvent?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function formatEventDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === now.toDateString()) {
    return `Today at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (d.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getTimeUntil(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();

  if (diffMs < 0) return 'Past';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Starting soon';
  if (diffHours < 24) return `In ${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

function isUpcoming(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > Date.now();
}

function isWithin24Hours(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
}

// ============================================================
// Event Card Component
// ============================================================

interface EventCardProps {
  event: SpaceEvent;
  size?: 'large' | 'medium' | 'small';
  onRsvp?: (status: 'going' | 'maybe' | 'not_going') => void;
  onClick?: () => void;
}

function EventCard({ event, size = 'medium', onRsvp, onClick }: EventCardProps) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';
  const upcoming = isUpcoming(event.startDate);
  const soon = isWithin24Hours(event.startDate);

  return (
    <motion.button
      whileHover={{ opacity: 0.9 }}
      whileTap={{ opacity: 0.8 }}
      className={cn(
        'relative w-full text-left rounded-2xl overflow-hidden',
        'bg-[#141312] border border-white/[0.06]',
        'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:border-white/[0.12]',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        soon && upcoming && 'shadow-[inset_0_0_0_1px_rgba(255,215,0,0.20)]',
        isLarge && 'col-span-2 row-span-2',
        isSmall && 'p-4',
        !isSmall && 'p-6',
      )}
      onClick={onClick}
    >
      {/* Cover image (large only) */}
      {isLarge && event.coverUrl && (
        <div className="absolute inset-0 opacity-20">
          <img
            src={event.coverUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-[#141312]/80 to-transparent" />
        </div>
      )}

      <div className="relative">
        {/* Time badge */}
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3',
          soon && upcoming
            ? 'bg-[#FFD700]/20 text-[#FFD700]'
            : upcoming
            ? 'bg-white/[0.06] text-[#A3A19E]'
            : 'bg-white/[0.03] text-[#6B6B70]',
        )}>
          {soon && upcoming && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
          )}
          {getTimeUntil(event.startDate)}
        </div>

        {/* Title */}
        <h3 className={cn(
          'font-semibold text-white mb-1',
          isLarge ? 'text-2xl' : isSmall ? 'text-sm' : 'text-lg',
          !upcoming && 'text-[#A3A19E]',
        )}>
          {event.title}
        </h3>

        {/* Date */}
        <p className={cn(
          'text-[#6B6B70] mb-3',
          isSmall ? 'text-xs' : 'text-sm',
        )}>
          {formatEventDate(event.startDate)}
        </p>

        {/* Description (large only) */}
        {isLarge && event.description && (
          <p className="text-[#A3A19E] text-sm line-clamp-2 mb-4">
            {event.description}
          </p>
        )}

        {/* Location */}
        {!isSmall && event.location && (
          <div className="flex items-center gap-2 text-[#6B6B70] text-sm mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* RSVP row */}
        {upcoming && !isSmall && (
          <div className="flex items-center justify-between">
            {/* Attendees count */}
            <span className="text-[#6B6B70] text-sm">
              {event.rsvpCount ?? 0} going
              {event.maxAttendees && ` / ${event.maxAttendees}`}
            </span>

            {/* RSVP buttons */}
            {onRsvp && (
              <div className="flex gap-2">
                <button
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95',
                    event.userRsvp === 'going'
                      ? 'bg-[#FFD700] text-black'
                      : 'bg-white/[0.06] text-white hover:bg-white/[0.10]',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRsvp('going');
                  }}
                >
                  Going
                </button>
                <button
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95',
                    event.userRsvp === 'maybe'
                      ? 'bg-white/[0.15] text-white'
                      : 'bg-white/[0.06] text-[#A3A19E] hover:bg-white/[0.10]',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRsvp('maybe');
                  }}
                >
                  Maybe
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function EventsMode({
  spaceId,
  events,
  isLoading = false,
  error,
  onRetry,
  canCreate = false,
  onRsvp,
  onViewEvent,
  onCreateEvent,
  className,
}: EventsModeProps) {
  // Separate upcoming and past events
  const upcomingEvents = events.filter((e) => isUpcoming(e.startDate));
  const pastEvents = events.filter((e) => !isUpcoming(e.startDate));

  // Get next event if within 24 hours
  const nextEvent = upcomingEvents[0] && isWithin24Hours(upcomingEvents[0].startDate)
    ? upcomingEvents[0]
    : null;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="flex items-center gap-2 text-[#6B6B70]">
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse delay-100" />
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse delay-200" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[#A3A19E] text-base mb-2">Something went wrong</p>
          <p className="text-[#6B6B70] text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-white/[0.06] text-white text-sm font-medium
                hover:bg-white/[0.10] active:scale-95 transition-all"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-white">Events</h1>
          {canCreate && onCreateEvent && (
            <button
              className="px-4 py-2 rounded-lg bg-[#FFD700] text-black font-medium
                hover:bg-[#FFD700]/90 active:scale-95 transition-all"
              onClick={onCreateEvent}
            >
              Create Event
            </button>
          )}
        </div>

        {/* Next event hero (if within 24h) */}
        {nextEvent && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-[#FFD700] mb-3 uppercase tracking-wide">
              Coming Up
            </h2>
            <EventCard
              event={nextEvent}
              size="large"
              onRsvp={onRsvp ? (status) => onRsvp(nextEvent.id, status) : undefined}
              onClick={() => onViewEvent?.(nextEvent.id)}
            />
          </div>
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > (nextEvent ? 1 : 0) && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-[#A3A19E] mb-4 uppercase tracking-wide">
              Upcoming
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.slice(nextEvent ? 1 : 0).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  size="medium"
                  onRsvp={onRsvp ? (status) => onRsvp(event.id, status) : undefined}
                  onClick={() => onViewEvent?.(event.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[#6B6B70] mb-4 uppercase tracking-wide">
              Past Events
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  size="small"
                  onClick={() => onViewEvent?.(event.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {events.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#6B6B70]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#A3A19E] text-lg mb-2">Nothing scheduled yet</p>
            <p className="text-[#6B6B70] text-sm mb-6">
              {canCreate ? 'Create the first event for this space' : 'Check back later for upcoming events'}
            </p>
            {canCreate && onCreateEvent && (
              <button
                className="px-4 py-2 rounded-lg bg-[#FFD700] text-black font-medium
                  hover:bg-[#FFD700]/90 active:scale-95 transition-all"
                onClick={onCreateEvent}
              >
                Create Event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
