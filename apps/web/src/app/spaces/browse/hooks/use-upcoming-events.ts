/**
 * useUpcomingEvents - Fetch campus-wide upcoming events
 *
 * Returns events happening soon across all spaces.
 * Used for "Happening Soon" section in browse (new user view).
 */

'use client';

import * as React from 'react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export interface UpcomingEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  attendeeCount: number;
  /** Space this event belongs to */
  space: {
    id: string;
    name: string;
    slug?: string;
    bannerImage?: string;
  };
  /** Friends attending (if available) */
  friendsAttending?: {
    count: number;
    avatars: string[];
    names: string[];
  };
  /** User's RSVP status */
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
}

export interface UseUpcomingEventsReturn {
  events: UpcomingEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasEvents: boolean;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useUpcomingEvents(limit: number = 5): UseUpcomingEventsReturn {
  const { user } = useAuth();
  const [events, setEvents] = React.useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEvents = React.useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch campus-wide upcoming events
      // Fall back to empty if endpoint doesn't exist yet
      const res = await secureApiFetch(`/api/events/upcoming?limit=${limit}`, {
        method: 'GET',
      });

      if (!res.ok) {
        // If endpoint doesn't exist, return empty (not an error for now)
        if (res.status === 404) {
          setEvents([]);
          return;
        }
        throw new Error(`Failed to fetch events: ${res.status}`);
      }

      const data = await res.json();
      const eventsList = data?.events || data?.data?.events || [];
      setEvents(eventsList);
    } catch (err) {
      // Don't treat as error if endpoint not implemented yet
      setEvents([]);
      logger.warn('Failed to fetch upcoming events (may not be implemented)', {
        component: 'useUpcomingEvents',
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    hasEvents: events.length > 0,
  };
}
