'use client';

/**
 * useSpaceEvents - Fetch events for a specific space
 *
 * Wires GET /api/spaces/[spaceId]/events to display upcoming events in space tabs.
 *
 * @version 1.0.0 - Phase 1 Wiring (Feb 2026)
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface SpaceEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  locationType?: 'physical' | 'virtual' | 'hybrid';
  virtualLink?: string;
  goingCount: number;
  interestedCount: number;
  rsvpStatus?: 'going' | 'interested' | 'not_going' | null;
  organizerId: string;
  organizerName: string;
}

interface UseSpaceEventsOptions {
  spaceId: string | undefined;
  enabled?: boolean;
}

interface UseSpaceEventsReturn {
  events: SpaceEvent[];
  upcomingEvents: SpaceEvent[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

// Query Key Factory
export const spaceEventsKeys = {
  all: ['space-events'] as const,
  space: (spaceId: string) => [...spaceEventsKeys.all, spaceId] as const,
};

// Fetcher
async function fetchSpaceEvents(spaceId: string): Promise<SpaceEvent[]> {
  const params = new URLSearchParams({
    limit: '20',
    upcoming: 'true',
  });

  const response = await fetch(`/api/spaces/${spaceId}/events?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 404) {
      return []; // Space not found or no events
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch space events');
  }

  const data = await response.json();
  return data.events || [];
}

export function useSpaceEvents({
  spaceId,
  enabled = true,
}: UseSpaceEventsOptions): UseSpaceEventsReturn {
  const queryClient = useQueryClient();

  const queryKey = spaceId ? spaceEventsKeys.space(spaceId) : spaceEventsKeys.all;

  const {
    data: events = [],
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchSpaceEvents(spaceId!),
    enabled: enabled && !!spaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Filter upcoming events (events that haven't ended yet)
  const upcomingEvents = events.filter(event => {
    const endTime = event.endTime || event.startTime;
    return new Date(endTime) > new Date();
  });

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  const invalidate = useCallback(async () => {
    if (spaceId) {
      await queryClient.invalidateQueries({
        queryKey: spaceEventsKeys.space(spaceId),
      });
    }
  }, [queryClient, spaceId]);

  return {
    events,
    upcomingEvents,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
    invalidate,
  };
}

export default useSpaceEvents;
