'use client';

/**
 * SpaceEvents Element (Space Tier)
 *
 * Display upcoming events for a specific space.
 * Requires: spaceId context (leaders only).
 *
 * GTM Polish Pass (January 2026):
 * - Added Framer Motion animations
 * - Improved loading skeletons with shimmer
 * - Better empty state with illustrations
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { springPresets } from '@hive/tokens';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface SpaceEvent {
  id: string;
  title: string;
  date: string;
  rsvpCount?: number;
  location?: string;
}

export function SpaceEventsElement({ config, data, context, onChange, onAction }: ElementProps) {
  const [events, setEvents] = useState<SpaceEvent[]>(data?.events || []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const maxEvents = config.maxEvents || 5;

  useEffect(() => {
    if (!context?.spaceId) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/spaces/${context.spaceId}/events`, {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          const eventData = (result.events || []).map((e: Record<string, unknown>) => ({
            id: e.id,
            title: e.title || e.name || 'Untitled Event',
            date: e.startDate || e.date || new Date().toISOString(),
            rsvpCount: e.rsvpCount || e.attendeeCount || 0,
            location: e.location,
          }));
          setEvents(eventData);
          onChange?.({ events: eventData, upcomingEvents: eventData });
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [context?.spaceId]);

  if (!context?.spaceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Space Events requires space context</p>
          <p className="text-xs mt-1">Deploy to a space to see events</p>
        </CardContent>
      </Card>
    );
  }

  const handleEventClick = (event: SpaceEvent) => {
    setSelectedEvent(event.id);
    onChange?.({ selectedEvent: event, events, upcomingEvents: events });
    onAction?.('select', { selectedEvent: event, events, upcomingEvents: events });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Upcoming Events</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="h-4 bg-muted rounded w-2/3 mb-2 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                <div className="h-3 bg-muted rounded w-1/3 animate-pulse" style={{ animationDelay: `${i * 100 + 50}ms` }} />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springPresets.gentle}
            className="py-8 text-center"
          >
            <motion.div
              animate={{ y: [0, -4, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-3"
            >
              <CalendarIcon className="h-7 w-7 text-purple-500/50" />
            </motion.div>
            <p className="font-medium text-foreground mb-1">No upcoming events</p>
            <p className="text-sm text-muted-foreground">Events will appear when scheduled</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {events.slice(0, maxEvents).map((event, index) => (
                <motion.div
                  key={event.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05, ...springPresets.snappy }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedEvent === event.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleEventClick(event)}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <ClockIcon className="h-3 w-3" />
                    {formatDate(event.date)}
                  </div>
                  {config.showRsvpCount && event.rsvpCount !== undefined && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                    >
                      <Badge variant="outline" className="mt-2 text-xs">
                        {event.rsvpCount} attending
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
