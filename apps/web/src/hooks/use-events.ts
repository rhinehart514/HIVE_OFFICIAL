"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@hive/auth-logic";
import { toast } from "@hive/ui";
import { logger } from "@/lib/logger";

// ============================================
// TYPES
// ============================================

interface RawEventData {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  type?: unknown;
  organizer?: { id?: unknown; name?: unknown; handle?: unknown; verified?: unknown };
  organizerId?: unknown;
  organizerName?: unknown;
  organizerHandle?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  timezone?: unknown;
  datetime?: { start?: unknown; end?: unknown; timezone?: unknown };
  locationType?: unknown;
  locationName?: unknown;
  locationAddress?: unknown;
  virtualLink?: unknown;
  location?: { name?: unknown };
  space?: unknown;
  maxCapacity?: unknown;
  currentCapacity?: unknown;
  waitlistCount?: unknown;
  capacity?: { max?: unknown; current?: unknown; waitlist?: unknown };
  tools?: unknown[];
  tags?: unknown[];
  visibility?: unknown;
  rsvpStatus?: unknown;
  isBookmarked?: unknown;
  goingCount?: unknown;
  interestedCount?: unknown;
  commentsCount?: unknown;
  sharesCount?: unknown;
  engagement?: { going?: unknown; interested?: unknown; comments?: unknown; shares?: unknown };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EventData {
  id: string;
  title: string;
  description: string;
  type: 'academic' | 'social' | 'professional' | 'recreational' | 'official';
  organizer: { id: string; name: string; handle: string; avatar?: string; verified?: boolean };
  space?: { id: string; name: string; type: string };
  datetime: { start: string; end: string; timezone: string };
  location: { type: 'physical' | 'virtual' | 'hybrid'; name: string; address?: string; virtualLink?: string };
  capacity: { max: number; current: number; waitlist: number };
  tools: string[];
  tags: string[];
  visibility: 'public' | 'space_only' | 'invited_only';
  rsvpStatus?: 'going' | 'interested' | 'not_going' | null;
  isBookmarked: boolean;
  engagement: { going: number; interested: number; comments: number; shares: number };
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'my_events';
export type EventTypeFilter = EventData['type'] | 'all';

// ============================================
// HELPERS
// ============================================

export const formatEventTime = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  const isToday = start.toDateString() === now.toDateString();
  const isTomorrow = start.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

  let dayText = '';
  if (isToday) dayText = 'Today';
  else if (isTomorrow) dayText = 'Tomorrow';
  else dayText = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const timeText = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

  return `${dayText} • ${timeText}`;
};

export const getEventTypeColor = (type: EventData['type']) => {
  switch (type) {
    case 'academic': return 'bg-blue-500';
    case 'social': return 'bg-pink-500';
    case 'professional': return 'bg-green-500';
    case 'recreational': return 'bg-life-gold';
    case 'official': return 'bg-purple-500';
    default: return 'bg-white/[0.20]';
  }
};

export const getEventTypeIcon = (type: EventData['type']) => {
  switch (type) {
    case 'academic': return '📚';
    case 'social': return '🎉';
    case 'professional': return '💼';
    case 'recreational': return '🎮';
    case 'official': return '🏛️';
    default: return '📅';
  }
};

// ============================================
// HOOK
// ============================================

export function useEvents() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [eventType, setEventType] = useState<EventTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const authResult = useAuth();
  const { user } = mounted ? authResult : { user: null };

  // Fetch events
  useEffect(() => {
    if (!mounted) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/events?limit=100&upcoming=true');
        if (!response.ok) throw new Error('Failed to fetch events');

        const data = await response.json() as { events?: unknown[] };
        const rawEvents = data.events || [];

        const mappedEvents: EventData[] = rawEvents.map((event: unknown): EventData => {
          const eventData = event as RawEventData;

          return {
            id: String(eventData.id || `event-${Date.now()}-${Math.random()}`),
            title: String(eventData.title || 'Untitled Event'),
            description: String(eventData.description || ''),
            type: (eventData.type as EventData['type']) || 'social',
            organizer: {
              id: String(eventData.organizer?.id || eventData.organizerId || 'unknown'),
              name: String(eventData.organizer?.name || eventData.organizerName || 'Event Organizer'),
              handle: String(eventData.organizer?.handle || eventData.organizerHandle || 'organizer'),
              verified: Boolean(eventData.organizer?.verified)
            },
            space: eventData.space ? {
              id: String((eventData.space as Record<string, unknown>).id),
              name: String((eventData.space as Record<string, unknown>).name),
              type: String((eventData.space as Record<string, unknown>).type || 'general')
            } : undefined,
            datetime: {
              start: String(eventData.startTime || eventData.datetime?.start || new Date().toISOString()),
              end: String(eventData.endTime || eventData.datetime?.end || new Date(Date.now() + 3600000).toISOString()),
              timezone: String(eventData.timezone || eventData.datetime?.timezone || 'America/New_York')
            },
            location: {
              type: (eventData.locationType as 'physical' | 'virtual' | 'hybrid') || 'physical',
              name: String(eventData.locationName || eventData.location?.name || 'TBD'),
              address: eventData.locationAddress ? String(eventData.locationAddress) : undefined,
              virtualLink: eventData.virtualLink ? String(eventData.virtualLink) : undefined
            },
            capacity: {
              max: Number(eventData.maxCapacity || eventData.capacity?.max || 50),
              current: Number(eventData.currentCapacity || eventData.capacity?.current || 0),
              waitlist: Number(eventData.waitlistCount || eventData.capacity?.waitlist || 0)
            },
            tools: Array.isArray(eventData.tools) ? eventData.tools.map(String) : [],
            tags: Array.isArray(eventData.tags) ? eventData.tags.map(String) : [],
            visibility: (eventData.visibility as EventData['visibility']) || 'public',
            rsvpStatus: (eventData.rsvpStatus as EventData['rsvpStatus']) || null,
            isBookmarked: Boolean(eventData.isBookmarked),
            engagement: {
              going: Number(eventData.goingCount || eventData.engagement?.going || 0),
              interested: Number(eventData.interestedCount || eventData.engagement?.interested || 0),
              comments: Number(eventData.commentsCount || eventData.engagement?.comments || 0),
              shares: Number(eventData.sharesCount || eventData.engagement?.shares || 0)
            },
            requirements: [],
            createdAt: String(eventData.createdAt || new Date().toISOString()),
            updatedAt: String(eventData.updatedAt || new Date().toISOString())
          };
        });

        setEvents(mappedEvents);
      } catch (error) {
        logger.error('Error fetching events', { component: 'useEvents' }, error instanceof Error ? error : undefined);
        toast.error('Failed to load events', 'Please refresh the page to try again.');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [mounted]);

  // Filter and search events
  const filteredEvents = useMemo(() => {
    let filtered = events;
    const now = new Date();

    switch (filter) {
      case 'today':
        filtered = filtered.filter(event => new Date(event.datetime.start).toDateString() === now.toDateString());
        break;
      case 'week': {
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.datetime.start);
          return eventDate >= now && eventDate <= nextWeek;
        });
        break;
      }
      case 'month': {
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.datetime.start);
          return eventDate >= now && eventDate <= nextMonth;
        });
        break;
      }
      case 'my_events':
        filtered = filtered.filter(event => event.rsvpStatus === 'going' || event.organizer.id === user?.id);
        break;
    }

    if (eventType !== 'all') {
      filtered = filtered.filter(event => event.type === eventType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query)) ||
        event.organizer.name.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(a.datetime.start).getTime() - new Date(b.datetime.start).getTime());
  }, [events, filter, eventType, searchQuery, user?.id]);

  // Handlers
  const handleRSVP = useCallback((eventId: string, status: 'going' | 'interested' | 'not_going') => {
    setEvents(prevEvents =>
      prevEvents.map(event => {
        if (event.id === eventId) {
          const prevStatus = event.rsvpStatus;
          const newEngagement = { ...event.engagement };

          if (prevStatus === 'going') newEngagement.going--;
          if (prevStatus === 'interested') newEngagement.interested--;

          if (status === 'going') newEngagement.going++;
          if (status === 'interested') newEngagement.interested++;

          return { ...event, rsvpStatus: status, engagement: newEngagement };
        }
        return event;
      })
    );
  }, []);

  const handleBookmark = useCallback((eventId: string) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, isBookmarked: !event.isBookmarked } : event
      )
    );
  }, []);

  const addEvent = useCallback((event: EventData) => {
    setEvents(prev => [event, ...prev]);
  }, []);

  const selectedEvent = useMemo(() => {
    return showEventDetails ? events.find(e => e.id === showEventDetails) || null : null;
  }, [showEventDetails, events]);

  return {
    // State
    mounted,
    events,
    isLoading,
    filter,
    eventType,
    searchQuery,
    showCreateModal,
    showEventDetails,
    user,

    // Derived
    filteredEvents,
    selectedEvent,

    // Actions
    setFilter,
    setEventType,
    setSearchQuery,
    setShowCreateModal,
    setShowEventDetails,

    // Handlers
    handleRSVP,
    handleBookmark,
    addEvent,
  };
}
