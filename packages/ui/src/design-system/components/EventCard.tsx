'use client';

/**
 * EventCard Component — LOCKED 2026-01-11
 *
 * LOCKED DECISIONS:
 * 1. Time Display: Absolute format ("3:00 PM")
 * 2. RSVP Style: Toggle Chip ("Going?" / "✓ Going")
 * 3. Live Indicator: Edge Warmth + LIVE badge
 * 4. Info Density: Standard (title + time + location + count)
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  VideoCameraIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  Card,
  Text,
  Badge,
  AvatarGroup,
  Icon,
} from '../primitives';

// ============================================
// TYPES
// ============================================

export interface EventCardProps {
  event: {
    id: string;
    title: string;
    type?: 'meeting' | 'social' | 'virtual';
    startDate: Date;
    endDate?: Date;
    location?: string;
    virtualLink?: string;
    currentAttendees: number;
    maxAttendees?: number;
    attendees?: Array<{ id: string; avatar?: string; name?: string }>;
    userRSVP?: 'going' | 'maybe' | 'not_going' | null;
    organizerName?: string;
  };
  /** Card variant */
  variant?: 'default' | 'compact';
  /** Show RSVP toggle */
  showRSVP?: boolean;
  /** RSVP callback */
  onRSVP?: (status: 'going' | 'not_going') => void;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// HELPERS
// ============================================

function formatEventDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow =
    date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// LOCKED: Absolute time format
function formatEventTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getEventStatus(
  startDate: Date,
  endDate?: Date
): 'upcoming' | 'today' | 'live' | 'soon' | 'past' {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 3600000);

  if (now > end) return 'past';
  if (now >= start && now <= end) return 'live';
  if (start.toDateString() === now.toDateString()) {
    const diff = start.getTime() - now.getTime();
    if (diff <= 1800000) return 'soon'; // 30 minutes
    return 'today';
  }
  return 'upcoming';
}

// ============================================
// RSVP TOGGLE CHIP (LOCKED)
// ============================================

interface RSVPToggleProps {
  isGoing: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function RSVPToggle({ isGoing, onClick, disabled }: RSVPToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        // LOCKED: Toggle chip styling
        'px-3 py-1.5 rounded-full text-sm font-medium',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        disabled && 'opacity-50 cursor-not-allowed',
        // LOCKED: Default state
        !isGoing && 'bg-white/10 hover:bg-white/15 text-white',
        // LOCKED: Toggled state - gold tint
        isGoing && 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
      )}
    >
      {isGoing ? '✓ Going' : 'Going?'}
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const EventCard: React.FC<EventCardProps> = ({
  event,
  variant = 'default',
  showRSVP = true,
  onRSVP,
  onClick,
  className,
}) => {
  const {
    title,
    type,
    startDate,
    endDate,
    location,
    virtualLink,
    currentAttendees,
    maxAttendees,
    attendees = [],
    userRSVP,
  } = event;

  const status = getEventStatus(startDate, endDate);
  const dateStr = formatEventDate(startDate);
  const timeStr = formatEventTime(startDate);
  const isVirtual = type === 'virtual' || !!virtualLink;
  const isLive = status === 'live';
  const isPast = status === 'past';
  const isGoing = userRSVP === 'going';

  // LOCKED: Use Card warmth for live events
  const warmthLevel = isLive ? 'high' : 'none';

  // Compact variant - minimal for lists
  if (variant === 'compact') {
    return (
      <Card
        interactive={!!onClick}
        warmth={warmthLevel}
        className={cn(
          'p-3 transition-colors duration-[var(--duration-snap)]',
          onClick && 'cursor-pointer hover:bg-[var(--color-bg-elevated)]',
          isPast && 'opacity-50',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {/* Time column */}
          <div className="flex flex-col items-center min-w-[40px]">
            <Text size="xs" tone="muted" className="uppercase">
              {dateStr}
            </Text>
            <Text size="sm" weight="medium">
              {timeStr}
            </Text>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <Text weight="medium" className={cn('truncate', isPast && 'line-through')}>
              {title}
            </Text>
          </div>

          {/* LOCKED: LIVE badge */}
          {isLive && (
            <Badge variant="gold" size="sm">
              LIVE
            </Badge>
          )}
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      interactive={!!onClick}
      warmth={warmthLevel}
      className={cn(
        'p-4 transition-all duration-[var(--duration-smooth)]',
        onClick && 'cursor-pointer',
        // LOCKED: NO scale on hover, use opacity-90
        onClick && 'hover:opacity-90',
        isPast && 'opacity-50',
        className
      )}
      onClick={onClick}
    >
      {/* LOCKED: Standard info density - title + time + location + count */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Title with LIVE badge inline */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Text size="lg" weight="semibold" className={cn('truncate', isPast && 'line-through')}>
            {title}
          </Text>
          {isLive && (
            <Badge variant="gold" size="sm">
              LIVE
            </Badge>
          )}
        </div>

        {/* LOCKED: RSVP toggle chip */}
        {showRSVP && onRSVP && !isPast && (
          <RSVPToggle
            isGoing={isGoing}
            onClick={() => onRSVP(isGoing ? 'not_going' : 'going')}
          />
        )}
      </div>

      {/* LOCKED: Time + Location combined */}
      <div className="flex items-center gap-2 mb-3">
        <Icon
          icon={isVirtual ? VideoCameraIcon : CalendarIcon}
          size="sm"
          className="text-[var(--color-text-muted)]"
        />
        <Text size="sm" tone="muted">
          {timeStr} {location && `· ${location}`}
          {isVirtual && !location && '· Virtual Event'}
        </Text>
      </div>

      {/* Attendees */}
      <div className="flex items-center gap-3">
        {attendees.length > 0 && (
          <AvatarGroup
            users={attendees.slice(0, 4).map((a) => ({
              id: a.id,
              name: a.name || 'Attendee',
              avatar: a.avatar,
            }))}
            max={4}
            size="xs"
          />
        )}
        <Text size="xs" tone="muted">
          {currentAttendees} going
          {maxAttendees && ` / ${maxAttendees}`}
        </Text>
      </div>
    </Card>
  );
};

EventCard.displayName = 'EventCard';

// ============================================
// SKELETON
// ============================================

interface EventCardSkeletonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const EventCardSkeleton: React.FC<EventCardSkeletonProps> = ({
  variant = 'default',
  className,
}) => {
  if (variant === 'compact') {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center min-w-[40px] gap-1">
            <div className="h-3 w-10 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-8 rounded bg-white/[0.06] animate-pulse" />
          </div>
          <div className="h-4 flex-1 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-5 w-40 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-7 w-20 rounded-full bg-white/[0.06] animate-pulse" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-5 w-5 rounded-lg bg-white/[0.06] animate-pulse ring-2 ring-[#0a0a09]"
            />
          ))}
        </div>
        <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
      </div>
    </Card>
  );
};

EventCardSkeleton.displayName = 'EventCardSkeleton';

// ============================================
// EXPORTS
// ============================================

export { EventCard, EventCardSkeleton };
