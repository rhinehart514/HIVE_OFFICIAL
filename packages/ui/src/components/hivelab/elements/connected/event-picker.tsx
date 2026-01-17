'use client';

/**
 * EventPicker Element (Connected Tier)
 *
 * Browse and select from campus events.
 * Requires: campusId context for event fetching.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  location?: string;
}

export function EventPickerElement({ config, data, onChange, context, onAction }: ElementProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const effectiveSpaceId = context?.spaceId || config.spaceId || data?.spaceId;

  useEffect(() => {
    if (data?.events && Array.isArray(data.events)) {
      setEvents(data.events);
      return;
    }

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (effectiveSpaceId) {
          params.append('spaceId', effectiveSpaceId);
        }
        if (context?.campusId) {
          params.append('campusId', context.campusId);
        }

        const url = `/api/calendar${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const result = await response.json();
          const mappedEvents = (result.events || []).map((e: Record<string, unknown>) => ({
            id: e.id as string,
            title: e.title as string,
            date: (e.startDate || e.date) as string,
            location: e.location as string | undefined,
          }));
          setEvents(mappedEvents);
        }
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [data?.events, effectiveSpaceId, context?.campusId]);

  const filteredEvents = events
    .filter(e => config.showPastEvents || new Date(e.date) >= new Date())
    .slice(0, config.maxEvents || 20);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Select Event</span>
        </div>

        {isLoading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No upcoming events</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event.id);
                  onChange?.({ selectedEvent: event, eventId: event.id });
                  onAction?.('select', { selectedEvent: event, eventId: event.id });
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedEvent === event.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{event.date}</div>
                {event.location && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPinIcon className="h-3 w-3" />
                    {event.location}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
