'use client';

/**
 * EventsTab - Events list for space pages
 *
 * Shows upcoming events in the space
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus } from 'lucide-react';
import { Button, MOTION } from '@hive/ui/design-system/primitives';
import { } from '@hive/tokens';

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  location?: string;
  goingCount?: number;
}

interface EventsTabProps {
  events: Event[];
  isLoading: boolean;
  isLeader: boolean;
  onCreateEvent: () => void;
}

export function EventsTab({
  events,
  isLoading,
  isLeader,
  onCreateEvent,
}: EventsTabProps) {
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <EventSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
      >
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6">
          <Calendar className="w-8 h-8 text-white/30" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No upcoming events
        </h3>
        <p className="text-white/50 mb-6">
          {isLeader
            ? 'Create an event to bring your space together'
            : 'No events scheduled yet'}
        </p>
        {isLeader && (
          <Button variant="cta" size="default" onClick={onCreateEvent}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <motion.div
        className="space-y-4 max-w-4xl mx-auto"
        initial="initial"
        animate="animate"
      >
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </motion.div>

      {isLeader && (
        <motion.div
          className="fixed bottom-6 right-6 z-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: MOTION.duration.fast,
            ease: MOTION.ease.bounce,
            delay: 0.2,
          }}
        >
          <Button
            variant="cta"
            size="lg"
            onClick={onCreateEvent}
            className="rounded-full shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const date = new Date(event.startTime);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <motion.div
      className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/[0.04] flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-white/40 uppercase leading-none">
            {dateStr.split(' ')[0]}
          </span>
          <span className="text-body font-semibold text-white leading-none mt-0.5">
            {dateStr.split(' ')[1]}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-body font-medium text-white mb-1">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-body-sm text-white/50 mb-2">
              {event.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-label text-white/40">
            <span>{timeStr}</span>
            {event.location && (
              <>
                <span>·</span>
                <span>{event.location}</span>
              </>
            )}
            {event.goingCount && event.goingCount > 0 && (
              <>
                <span>·</span>
                <span>{event.goingCount} going</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EventSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/[0.06] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 bg-white/[0.06] rounded" />
          <div className="h-3 w-full bg-white/[0.04] rounded" />
          <div className="h-3 w-32 bg-white/[0.04] rounded" />
        </div>
      </div>
    </div>
  );
}
