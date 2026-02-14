'use client';

import * as React from 'react';
import { Calendar, MapPin, Plus, Users } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { useSpaceEvents } from '@/contexts/space';

interface SpaceEventsTabProps {
  isLeader: boolean;
  onCreateEvent?: () => void;
  onRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => Promise<void> | void;
}

export function SpaceEventsTab({
  isLeader,
  onCreateEvent,
  onRsvp,
}: SpaceEventsTabProps) {
  const { events, isEventsLoading } = useSpaceEvents();
  const [pendingEventId, setPendingEventId] = React.useState<string | null>(null);

  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events]);

  const handleRsvp = React.useCallback(async (eventId: string, currentRsvp: string | null) => {
    if (!onRsvp) return;
    setPendingEventId(eventId);
    try {
      const nextStatus = currentRsvp === 'going' ? 'not_going' : 'going';
      await onRsvp(eventId, nextStatus);
    } finally {
      setPendingEventId(null);
    }
  }, [onRsvp]);

  if (isEventsLoading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-white/[0.06] bg-white/[0.06] p-5"
          >
            <div className="h-4 w-40 rounded bg-white/[0.06]" />
            <div className="mt-3 h-3 w-56 rounded bg-white/[0.06]" />
            <div className="mt-2 h-3 w-44 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-white/[0.06]">
          <Calendar className="h-7 w-7 text-white/50" />
        </div>
        <h3 className="text-lg font-semibold text-white">No events yet</h3>
        <p className="mt-2 max-w-md text-sm text-white/50">
          {isLeader
            ? 'Create your first event to kick things off in this space.'
            : 'No events are scheduled yet.'}
        </p>
        {isLeader && (
          <Button
            variant="cta"
            size="sm"
            className="mt-6"
            onClick={onCreateEvent}
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-white/50">All Events</h3>
        {isLeader && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateEvent}
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sortedEvents.map((event) => {
          const startDate = new Date(event.startDate);
          const formattedDate = Number.isNaN(startDate.getTime())
            ? 'Date TBD'
            : startDate.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });
          const isGoing = event.userRSVP === 'going';

          return (
            <div
              key={event.id}
              className="rounded-lg border border-white/[0.06] bg-white/[0.06] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-white">
                    {event.title}
                  </h4>
                  <p className="mt-1 text-sm text-white/50">{formattedDate}</p>
                  {event.location && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                    <Users className="h-3.5 w-3.5" />
                    <span>{event.currentAttendees} going</span>
                  </div>
                </div>

                <Button
                  variant={isGoing ? 'cta' : 'ghost'}
                  size="sm"
                  loading={pendingEventId === event.id}
                  onClick={() => {
                    void handleRsvp(event.id, event.userRSVP);
                  }}
                  disabled={!onRsvp}
                >
                  {isGoing ? 'Going' : 'RSVP'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

