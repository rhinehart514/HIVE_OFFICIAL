'use client';

/**
 * EventCard - Inline event card in feed
 *
 * Shows:
 * - Event title and date/time
 * - Location (physical or virtual)
 * - RSVP count and action
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Video, Users, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui';
import { SPACE_COMPONENTS, SPACE_COLORS } from '@hive/tokens';

export interface EventCardEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  virtualLink?: string;
  rsvpCount: number;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  // Optional space info for cross-space contexts (e.g., home page)
  spaceName?: string;
  spaceHandle?: string;
  spaceId?: string;
  isLive?: boolean;
}

interface EventCardProps {
  event: EventCardEvent;
  onRsvp?: (status: 'going' | 'maybe' | 'not_going') => void;
  onClick?: () => void;
  className?: string;
}

export function EventCard({
  event,
  onRsvp,
  onClick,
  className,
}: EventCardProps) {
  const { eventCard } = SPACE_COMPONENTS;

  // Format date/time
  const formattedDateTime = React.useMemo(() => {
    const start = new Date(event.startDate);
    const now = new Date();
    const isToday = start.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = start.toDateString() === tomorrow.toDateString();

    const timeStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;

    return start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [event.startDate]);

  // Time until event
  const timeUntil = React.useMemo(() => {
    const start = new Date(event.startDate);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return null; // Event has passed
    if (diffHours < 1) return 'Starting soon';
    if (diffHours < 24) return `In ${diffHours}h`;
    if (diffDays < 7) return `In ${diffDays}d`;
    return null;
  }, [event.startDate]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'rounded-xl',
        'bg-white/[0.02] hover:bg-white/[0.04]',
        'border border-white/[0.06] hover:border-white/[0.10]',
        'transition-all duration-150',
        'cursor-pointer',
        className
      )}
      style={{
        maxWidth: `${eventCard.maxWidth}px`,
        padding: `${eventCard.padding}px`,
        borderRadius: `${eventCard.borderRadius}px`,
      }}
      onClick={onClick}
    >
      {/* Space badge (when showing in cross-space context like home) */}
      {event.spaceName && (
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-gold)]/10 text-[var(--color-gold)] truncate max-w-[200px]">
            {event.spaceName}
          </span>
          {event.isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
      )}

      {/* Header: Icon + Title + Time badge */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[var(--color-gold)]/10 flex-shrink-0">
          <Calendar className="w-4 h-4 text-[var(--color-gold)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">
              {event.title}
            </h3>
            {timeUntil && !event.isLive && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-gold)]/10 text-[var(--color-gold)]">
                {timeUntil}
              </span>
            )}
          </div>

          {/* Date/time */}
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="w-3 h-3 text-white/40" />
            <span className="text-xs text-white/50">{formattedDateTime}</span>
          </div>

          {/* Location */}
          {(event.location || event.isOnline) && (
            <div className="flex items-center gap-1.5 mt-1">
              {event.isOnline ? (
                <Video className="w-3 h-3 text-white/40" />
              ) : (
                <MapPin className="w-3 h-3 text-white/40" />
              )}
              <span className="text-xs text-white/50 truncate">
                {event.isOnline ? 'Online event' : event.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description (truncated) */}
      {event.description && (
        <p className="mt-3 text-xs text-white/40 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Footer: RSVP count + action */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
        {/* RSVP count */}
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/50">
            {event.rsvpCount} going
          </span>
        </div>

        {/* RSVP button */}
        {onRsvp && (
          <div className="flex items-center gap-1">
            {event.userRsvp === 'going' ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--color-gold)] bg-[var(--color-gold)]/10 hover:bg-[var(--color-gold)]/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onRsvp('not_going');
                }}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Going
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onRsvp('going');
                }}
              >
                RSVP
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

EventCard.displayName = 'EventCard';

export default EventCard;
