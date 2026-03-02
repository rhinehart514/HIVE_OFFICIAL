'use client';

/**
 * EventFeedCard — Card for the home Feed.
 * Same as stream card + social proof line: "Sarah + 2 friends going" or "23 going".
 * Uses friendsAttending data from personalized events API.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  getInitials,
} from '@hive/ui/design-system/primitives';

export interface EventFeedCardData {
  id: string;
  title: string;
  startDate: string;
  location?: string | null;
  isOnline?: boolean;
  rsvpCount: number;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  // Social proof
  friendsAttending: number;
  friendsAttendingNames?: string[];
  // Space context
  spaceName?: string;
  spaceAvatarUrl?: string;
  // Attendee avatars for face stack
  attendeeAvatars?: Array<{ name: string; photoURL?: string | null }>;
}

interface EventFeedCardProps {
  event: EventFeedCardData;
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

function buildSocialProofText(
  friendsAttending: number,
  friendsAttendingNames?: string[],
  totalGoing?: number,
): string | null {
  if (friendsAttending > 0 && friendsAttendingNames && friendsAttendingNames.length > 0) {
    const firstName = friendsAttendingNames[0];
    if (friendsAttending === 1) return `${firstName} is going`;
    return `${firstName} + ${friendsAttending - 1} friend${friendsAttending > 2 ? 's' : ''} going`;
  }
  if (totalGoing && totalGoing > 0) return `${totalGoing} going`;
  return null;
}

export function EventFeedCard({
  event,
  onRsvp,
  onClick,
  className,
}: EventFeedCardProps) {
  const isGoing = event.userRsvp === 'going';

  // Check if event is starting soon (< 2 hours)
  const isStartingSoon = React.useMemo(() => {
    const diff = new Date(event.startDate).getTime() - Date.now();
    return diff > 0 && diff < 2 * 60 * 60 * 1000;
  }, [event.startDate]);

  const socialProof = buildSocialProofText(
    event.friendsAttending,
    event.friendsAttendingNames,
    event.rsvpCount,
  );

  return (
    <motion.div
      whileHover={{ opacity: 0.96 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'rounded-xl border bg-white/[0.04] hover:bg-white/[0.06]',
        'cursor-pointer transition-colors',
        isStartingSoon
          ? 'border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/30'
          : 'border-white/[0.06]',
        className,
      )}
      onClick={onClick}
    >
      <div className="p-3.5">
        {/* Space badge + urgency badge */}
        {(event.spaceName || isStartingSoon) && (
          <div className="flex items-center gap-2 mb-2.5">
            {event.spaceName && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-white/50">
                {event.spaceAvatarUrl && (
                  <Avatar size="xs" className="w-3.5 h-3.5">
                    <AvatarImage src={event.spaceAvatarUrl} />
                    <AvatarFallback className="text-[6px]">{getInitials(event.spaceName)}</AvatarFallback>
                  </Avatar>
                )}
                {event.spaceName}
              </span>
            )}
            {isStartingSoon && (
              <motion.span
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(255, 215, 0, 0)',
                    '0 0 6px 2px rgba(255, 215, 0, 0.2)',
                    '0 0 0 0 rgba(255, 215, 0, 0)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-gold)]/20 text-[var(--color-gold)]"
              >
                <Zap className="w-2.5 h-2.5" />
                Starting soon
              </motion.span>
            )}
          </div>
        )}

        {/* Main row: icon + info */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-gold)]/10 flex-shrink-0">
            <Calendar className="w-4 h-4 text-[var(--color-gold)]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{event.title}</h3>

            {/* Time + Location */}
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
          </div>
        </div>

        {/* Footer: social proof + RSVP */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
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

            {/* Social proof text */}
            {socialProof ? (
              <span className={cn(
                'text-xs',
                event.friendsAttending > 0 ? 'text-[var(--color-gold)]' : 'text-white/40',
              )}>
                {socialProof}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Users className="w-3 h-3" />
                {event.rsvpCount} going
              </span>
            )}
          </div>

          {/* RSVP buttons */}
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
    </motion.div>
  );
}

EventFeedCard.displayName = 'EventFeedCard';
export default EventFeedCard;
