'use client';

/**
 * EventsList - Upcoming events preview in sidebar
 *
 * Shows next 3 events with compact card design
 *
 * @version 1.0.0 - Spaces Reskin (Feb 2026)
 */

import * as React from 'react';
import { Calendar, MapPin, Video, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventCardEvent } from '../feed/event-card';

export interface EventsListProps {
  events: EventCardEvent[];
  maxEvents?: number;
  onClick?: (event: EventCardEvent) => void;
}

export function EventsList({
  events,
  maxEvents = 3,
  onClick,
}: EventsListProps) {
  const displayedEvents = events.slice(0, maxEvents);

  if (displayedEvents.length === 0) {
    return (
      <div className="text-center py-4">
        <Calendar className="w-5 h-5 text-white/50 mx-auto mb-2" />
        <p className="text-xs text-white/50">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayedEvents.map((event) => {
        // Format date/time compactly
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

        let dateLabel: string;
        if (isToday) dateLabel = 'Today';
        else if (isTomorrow) dateLabel = 'Tomorrow';
        else dateLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return (
          <button
            key={event.id}
            onClick={() => onClick?.(event)}
            className={cn(
              'w-full p-2 rounded-lg',
              'text-left',
              'bg-white/[0.06] hover:bg-white/[0.06]',
              'border border-white/[0.06] hover:border-white/[0.06]',
              'transition-colors'
            )}
          >
            {/* Title */}
            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-white truncate">
                  {event.title}
                </h4>
              </div>
            </div>

            {/* Date/time */}
            <div className="flex items-center gap-1.5 mt-1.5 ml-5">
              <Clock className="w-3 h-3 text-white/50" />
              <span className="text-[10px] text-white/50 font-sans">
                {dateLabel} · {timeStr}
              </span>
            </div>

            {/* Location (if present) */}
            {(event.location || event.isOnline) && (
              <div className="flex items-center gap-1.5 mt-1 ml-5">
                {event.isOnline ? (
                  <Video className="w-3 h-3 text-white/50" />
                ) : (
                  <MapPin className="w-3 h-3 text-white/50" />
                )}
                <span className="text-[10px] text-white/50 truncate">
                  {event.isOnline ? 'Online' : event.location}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

EventsList.displayName = 'EventsList';

export default EventsList;
