"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { logger } from "@/lib/logger";

// ============================================
// TYPES
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'event' | 'class' | 'assignment' | 'meeting' | 'personal';
  color: string;
  source: 'hive' | 'google' | 'outlook' | 'canvas' | 'manual';
  attendees?: string[];
  isConflict?: boolean;
  conflictsWith?: string[];
  rsvpStatus?: 'going' | 'interested' | 'not_going';
  tools?: string[];
  space?: {
    id: string;
    name: string;
  };
}

export interface CalendarIntegration {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'canvas';
  isConnected: boolean;
  lastSync?: string;
  eventCount?: number;
}

export type ViewMode = 'month' | 'week' | 'day';
export type EventTypeFilter = CalendarEvent['type'] | 'all';

// ============================================
// HELPERS
// ============================================

export const getTypeColor = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'event': return 'bg-[var(--hive-status-info)]';
    case 'class': return 'bg-[var(--hive-status-success)]';
    case 'assignment': return 'bg-[var(--hive-status-warning)]';
    case 'meeting': return 'bg-[var(--hive-status-purple)]';
    case 'personal': return 'bg-[var(--hive-status-pink)]';
    default: return 'bg-[var(--surface-elevated)]';
  }
};

export const getTypeIcon = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'event': return '🎉';
    case 'class': return '📚';
    case 'assignment': return '📝';
    case 'meeting': return '💼';
    case 'personal': return '👤';
    default: return '📅';
  }
};

export const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const getEventDataType = (calendarType: CalendarEvent['type']): 'academic' | 'social' | 'professional' | 'recreational' | 'official' => {
  switch (calendarType) {
    case 'class': return 'academic';
    case 'assignment': return 'academic';
    case 'event': return 'social';
    case 'meeting': return 'professional';
    case 'personal': return 'recreational';
    default: return 'social';
  }
};

// ============================================
// HOOK
// ============================================

interface UseCalendarOptions {
  initialViewMode?: ViewMode;
}

export function useCalendar(options: UseCalendarOptions = {}) {
  const { initialViewMode = 'month' } = options;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar data
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/calendar', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch calendar events: ${response.status}`);
        }

        const data = await response.json() as { events?: unknown[] };
        const fetchedEvents = data.events || [];

        const transformedEvents: CalendarEvent[] = fetchedEvents.map((event: unknown) => {
          const eventData = event as Record<string, unknown>;
          return {
            id: String(eventData.id || ''),
            title: String(eventData.title || ''),
            description: String(eventData.description || ''),
            startTime: String(eventData.startDate || ''),
            endTime: String(eventData.endDate || ''),
            location: String(eventData.location || ''),
            type: eventData.type === 'personal' ? 'event' : (eventData.type as CalendarEvent['type']) || 'event',
            color: eventData.type === 'personal' ? 'var(--hive-status-info)' :
                  eventData.type === 'space' ? 'var(--hive-status-success)' : 'var(--hive-status-warning)',
            source: eventData.type === 'personal' ? 'hive' : (eventData.source as CalendarEvent['source']) || 'hive',
            rsvpStatus: eventData.canEdit ? 'going' : 'interested',
            space: eventData.spaceName ? {
              id: String(eventData.spaceId || ''),
              name: String(eventData.spaceName)
            } : undefined,
            tools: Array.isArray(eventData.tools) ? eventData.tools.map(String) : []
          };
        });

        const defaultIntegrations: CalendarIntegration[] = [
          { id: 'google', name: 'Google Calendar', type: 'google', isConnected: false },
          { id: 'canvas', name: 'Canvas LMS', type: 'canvas', isConnected: false },
          { id: 'outlook', name: 'Outlook Calendar', type: 'outlook', isConnected: false }
        ];

        setEvents(transformedEvents);
        setIntegrations(defaultIntegrations);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error fetching calendar events', { error: errorMessage });
        setError(errorMessage);
        setEvents([]);
        setIntegrations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarEvents();
  }, []);

  // Filter events by type
  const filteredEvents = useMemo(() => {
    if (eventTypeFilter === 'all') return events;
    return events.filter(event => event.type === eventTypeFilter);
  }, [events, eventTypeFilter]);

  // Get events for current view
  const viewEvents = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        end.setDate(start.getDate() + 1);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 7);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(start.getMonth() + 1, 0);
        break;
    }

    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= start && eventDate <= end;
    });
  }, [filteredEvents, currentDate, viewMode]);

  // Conflict events
  const conflictEvents = useMemo(() => {
    return events.filter(event => event.isConflict);
  }, [events]);

  // Navigation
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);

      switch (viewMode) {
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
      }

      return newDate;
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Event mutations - API-backed create
  const addEvent = useCallback(async (event: CalendarEvent): Promise<CalendarEvent> => {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: event.title,
        description: event.description,
        startDate: event.startTime,
        endDate: event.endTime,
        location: event.location,
        isAllDay: false,
      }),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create event');
    }
    const data = await response.json();
    const createdEvent: CalendarEvent = {
      ...event,
      id: data.event.id,
    };
    setEvents(prev => [createdEvent, ...prev]);
    return createdEvent;
  }, []);

  const updateEventRSVP = useCallback(async (eventId: string, status: CalendarEvent['rsvpStatus'], spaceId?: string) => {
    // Find the event to get its spaceId if not provided
    const event = events.find(e => e.id === eventId);
    const targetSpaceId = spaceId || event?.space?.id;

    // Optimistic update
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId ? { ...e, rsvpStatus: status } : e
      )
    );

    // If we have a space ID, persist to API
    if (targetSpaceId) {
      try {
        const response = await fetch(`/api/spaces/${targetSpaceId}/events/${eventId}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
          credentials: 'include',
        });

        if (!response.ok) {
          // Revert on failure
          setEvents(prev =>
            prev.map(e =>
              e.id === eventId ? { ...e, rsvpStatus: event?.rsvpStatus } : e
            )
          );
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update RSVP');
        }
      } catch (err) {
        logger.error('Failed to update RSVP', { eventId, status, error: err instanceof Error ? err.message : 'Unknown error' });
        // Revert optimistic update on error
        setEvents(prev =>
          prev.map(e =>
            e.id === eventId ? { ...e, rsvpStatus: event?.rsvpStatus } : e
          )
        );
        throw err;
      }
    }
  }, [events]);

  const removeEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  // API-backed update event
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    const response = await fetch(`/api/calendar/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: updates.title,
        description: updates.description,
        startDate: updates.startTime,
        endDate: updates.endTime,
        location: updates.location,
      }),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update event');
    }
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
  }, []);

  // API-backed delete event
  const deleteEvent = useCallback(async (eventId: string) => {
    const response = await fetch(`/api/calendar/${eventId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete event');
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  // View title
  const viewTitle = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week':
        return `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'day':
        return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }, [currentDate, viewMode]);

  return {
    // State
    currentDate,
    viewMode,
    events,
    integrations,
    eventTypeFilter,
    isLoading,
    error,

    // Derived
    filteredEvents,
    viewEvents,
    conflictEvents,
    viewTitle,

    // Actions
    setCurrentDate,
    setViewMode,
    setEventTypeFilter,
    navigateDate,
    goToToday,
    addEvent,
    updateEventRSVP,
    removeEvent,
    updateEvent,
    deleteEvent,
  };
}
