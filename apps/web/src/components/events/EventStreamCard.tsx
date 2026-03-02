'use client';

/**
 * EventStreamCard — Compact event card (~120px) for Space chat stream.
 * Shows: event name, time, location, RSVP count with face stack, inline Going/Can't Go.
 * Tapping body opens EventDetailDrawer.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  getInitials,
} from '@hive/ui/design-system/primitives';

export interface EventStreamCardData {
  id: string;
  title: string;
  startDate: string;
  location?: string | null;
  isOnline?: boolean;
  rsvpCount: number;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  attendeeAvatars?: Array<{ name: string; photoURL?: string | null }>;
}

interface EventStreamCardProps {
  event: EventStreamCardData;
  onRsvp?: (status: 'going' | 'not_going') => void;
  onClick?: () => void;
  className?: string;
}

function formatCompactTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ` ${time}`;
}

export function EventStreamCard({
  event,
  onRsvp,
  onClick,
  className,
}: EventStreamCardProps) {
  const isGoing = event.userRsvp === 'going';

  return (
    <motion.div
      whileHover={{ opacity: 0.96 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.06]',
        'cursor-pointer transition-colors',
        className,
      )}
      onClick={onClick}
    >
      <div className="p-3 flex items-start gap-3">
        {/* Calendar icon */}
        <div className="p-2 rounded-lg bg-[var(--color-gold)]/10 flex-shrink-0">
          <Calendar className="w-4 h-4 text-[var(--color-gold)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{event.title}</h3>

          {/* Time + Location in one line */}
          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatCompactTime(event.startDate)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>

          {/* RSVP count with face stack */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {/* Face stack */}
              {event.attendeeAvatars && event.attendeeAvatars.length > 0 && (
                <div className="flex -space-x-1.5">
                  {event.attendeeAvatars.slice(0, 3).map((a, i) => (
                    <Avatar key={i} size="xs" className="ring-1 ring-[var(--bg-ground)] w-5 h-5">
                      {a.photoURL && <AvatarImage src={a.photoURL} />}
                      <AvatarFallback className="text-[8px]">{getInitials(a.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Users className="w-3 h-3" />
                {event.rsvpCount}
              </span>
            </div>

            {/* Inline RSVP buttons */}
            {onRsvp && (
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <Button
                  variant={isGoing ? 'primary' : 'default'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => onRsvp(isGoing ? 'not_going' : 'going')}
                >
                  {isGoing && <Check className="w-3 h-3 mr-1" />}
                  {isGoing ? 'Going' : 'Going'}
                </Button>
                {!isGoing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-white/40"
                    onClick={() => onRsvp('not_going')}
                  >
                    Can&apos;t Go
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

EventStreamCard.displayName = 'EventStreamCard';
export default EventStreamCard;
