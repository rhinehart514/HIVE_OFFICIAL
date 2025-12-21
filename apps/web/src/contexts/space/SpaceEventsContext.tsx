"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { secureApiFetch } from "@/lib/secure-auth-utils";
import { useSpaceMetadata } from "./SpaceMetadataContext";

/**
 * SpaceEventsContext
 *
 * Focused context for space events data.
 * Re-renders only when events change.
 */

// ============================================================
// Types
// ============================================================

export interface SpaceEvent {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  location?: string;
  virtualLink?: string;
  currentAttendees: number;
  maxAttendees?: number;
  userRSVP: string | null;
  organizer?: {
    id: string;
    fullName: string;
    handle?: string;
    photoURL?: string;
  };
}

export interface SpaceEventsContextValue {
  events: SpaceEvent[];
  isEventsLoading: boolean;
  refreshEvents: () => Promise<void>;
}

// ============================================================
// Context
// ============================================================

const SpaceEventsCtx = createContext<SpaceEventsContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface SpaceEventsProviderProps {
  children: ReactNode;
}

export function SpaceEventsProvider({ children }: SpaceEventsProviderProps) {
  const { spaceId } = useSpaceMetadata();
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!spaceId) return;

    setIsEventsLoading(true);

    try {
      const res = await secureApiFetch(
        `/api/spaces/${spaceId}/events?limit=10&upcoming=true`
      );
      if (!res.ok) {
        setEvents([]);
        return;
      }

      const response = await res.json();
      const data = response.data || response;
      const eventsList = data.events || [];

      const mappedEvents: SpaceEvent[] = eventsList.map(
        (e: Record<string, unknown>) => ({
          id: e.id as string,
          title: e.title as string,
          description: e.description as string | undefined,
          type: e.type as string,
          startDate:
            e.startDate instanceof Date
              ? (e.startDate as Date).toISOString()
              : String(e.startDate),
          endDate:
            e.endDate instanceof Date
              ? (e.endDate as Date).toISOString()
              : String(e.endDate),
          location: e.location as string | undefined,
          virtualLink: e.virtualLink as string | undefined,
          currentAttendees: (e.currentAttendees as number) || 0,
          maxAttendees: e.maxAttendees as number | undefined,
          userRSVP: (e.userRSVP as string) || null,
          organizer: e.organizer as SpaceEvent["organizer"],
        })
      );

      setEvents(mappedEvents);
    } catch {
      setEvents([]);
    } finally {
      setIsEventsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const value = useMemo<SpaceEventsContextValue>(
    () => ({
      events,
      isEventsLoading,
      refreshEvents: fetchEvents,
    }),
    [events, isEventsLoading, fetchEvents]
  );

  return (
    <SpaceEventsCtx.Provider value={value}>{children}</SpaceEventsCtx.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useSpaceEvents(): SpaceEventsContextValue {
  const ctx = useContext(SpaceEventsCtx);
  if (!ctx) {
    throw new Error("useSpaceEvents must be used within SpaceContextProvider");
  }
  return ctx;
}

export function useOptionalSpaceEvents(): SpaceEventsContextValue | null {
  return useContext(SpaceEventsCtx);
}
