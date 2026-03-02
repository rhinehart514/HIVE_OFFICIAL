'use client';

/**
 * ContextBar - Persistent bar above the stream (~40px)
 *
 * Shows ONE item (priority order):
 * 1. Next upcoming event with countdown
 * 2. Active poll with response count
 * 3. Pinned announcement
 *
 * Hides entirely when nothing is active/upcoming.
 */

import * as React from 'react';
import { Calendar, BarChart3, Pin, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextBarEvent {
  id: string;
  title: string;
  startDate: string;
  rsvpCount?: number;
}

interface ContextBarPoll {
  id: string;
  question: string;
  responseCount: number;
}

interface ContextBarAnnouncement {
  id: string;
  text: string;
}

interface ContextBarProps {
  nextEvent?: ContextBarEvent | null;
  activePoll?: ContextBarPoll | null;
  pinnedAnnouncement?: ContextBarAnnouncement | null;
  onEventClick?: (eventId: string) => void;
  onPollClick?: (pollId: string) => void;
  className?: string;
}

function useCountdown(targetDate: string) {
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    const update = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setText('Now');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) setText(`in ${days}d`);
      else if (hours > 0) setText(`in ${hours}h ${minutes % 60}m`);
      else setText(`in ${minutes}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return text;
}

export function ContextBar({
  nextEvent,
  activePoll,
  pinnedAnnouncement,
  onEventClick,
  onPollClick,
  className,
}: ContextBarProps) {
  const countdown = useCountdown(nextEvent?.startDate || '');

  // Priority: event > poll > announcement
  if (!nextEvent && !activePoll && !pinnedAnnouncement) return null;

  if (nextEvent) {
    const isStartingSoon = (() => {
      const diff = new Date(nextEvent.startDate).getTime() - Date.now();
      return diff > 0 && diff < 15 * 60 * 1000;
    })();

    return (
      <button
        onClick={() => onEventClick?.(nextEvent.id)}
        className={cn(
          'w-full h-10 px-4 flex items-center gap-2.5',
          'bg-white/[0.02] border-b border-white/[0.06]',
          'text-left transition-colors hover:bg-white/[0.04]',
          className
        )}
      >
        <Calendar className="w-3.5 h-3.5 text-[var(--color-gold)] flex-shrink-0" />
        <span className="text-[13px] text-white/70 truncate flex-1">
          {nextEvent.title}
        </span>
        <span
          className={cn(
            'text-[11px] font-medium flex-shrink-0 px-2 py-0.5 rounded-full',
            isStartingSoon
              ? 'bg-[var(--color-gold)]/15 text-[var(--color-gold)]'
              : 'text-white/40'
          )}
        >
          {isStartingSoon && <Zap className="w-2.5 h-2.5 inline mr-0.5" />}
          {countdown}
        </span>
      </button>
    );
  }

  if (activePoll) {
    return (
      <button
        onClick={() => onPollClick?.(activePoll.id)}
        className={cn(
          'w-full h-10 px-4 flex items-center gap-2.5',
          'bg-white/[0.02] border-b border-white/[0.06]',
          'text-left transition-colors hover:bg-white/[0.04]',
          className
        )}
      >
        <BarChart3 className="w-3.5 h-3.5 text-[var(--color-gold)] flex-shrink-0" />
        <span className="text-[13px] text-white/70 truncate flex-1">
          {activePoll.question}
        </span>
        <span className="text-[11px] text-white/40 flex-shrink-0">
          {activePoll.responseCount} responses
        </span>
      </button>
    );
  }

  if (pinnedAnnouncement) {
    return (
      <div
        className={cn(
          'w-full h-10 px-4 flex items-center gap-2.5',
          'bg-white/[0.02] border-b border-white/[0.06]',
          className
        )}
      >
        <Pin className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        <span className="text-[13px] text-white/50 truncate">
          {pinnedAnnouncement.text}
        </span>
      </div>
    );
  }

  return null;
}

ContextBar.displayName = 'ContextBar';
