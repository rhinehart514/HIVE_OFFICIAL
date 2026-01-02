"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RitualUnion, RitualPhase, RitualArchetype } from "@hive/core";
import { logger } from "@/lib/logger";

export interface UseRitualsListOptions {
  /** Filter by phases (e.g., ["active", "announced"]) */
  phases?: RitualPhase[];
  /** Filter by archetype */
  archetype?: RitualArchetype;
  /** Max items to fetch */
  limit?: number;
  /** Auto-refresh interval in ms (0 = disabled) */
  refreshInterval?: number;
  /** Only fetch active rituals */
  activeOnly?: boolean;
}

export interface UseRitualsListResult {
  rituals: RitualUnion[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  /** Active rituals (phase = "active") */
  activeRituals: RitualUnion[];
  /** Upcoming rituals (phase = "announced" or "draft" with future start) */
  upcomingRituals: RitualUnion[];
  /** Completed rituals (phase = "ended" or "cooldown") */
  completedRituals: RitualUnion[];
  /** Featured ritual (first active with most participants) */
  featuredRitual: RitualUnion | undefined;
  /** Refresh the list */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching a list of rituals with filtering
 *
 * @example
 * ```tsx
 * const { activeRituals, upcomingRituals, isLoading } = useRitualsList({
 *   phases: ["active", "announced"],
 *   limit: 20,
 * });
 * ```
 */
export function useRitualsList(
  options: UseRitualsListOptions = {}
): UseRitualsListResult {
  const {
    phases,
    archetype,
    limit = 50,
    refreshInterval = 0,
    activeOnly = false,
  } = options;

  const [rituals, setRituals] = useState<RitualUnion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Fetch rituals
  const fetchRituals = useCallback(async () => {
    try {
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      params.set("limit", String(limit));

      if (phases && phases.length > 0) {
        params.set("phase", phases.join(","));
      }

      if (archetype) {
        params.set("archetype", archetype);
      }

      const endpoint = activeOnly
        ? "/api/rituals/active"
        : `/api/rituals?${params.toString()}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch rituals");
      }

      const data = await response.json();
      setRituals(data.rituals || []);
      setHasMore(data.pagination?.hasMore || false);
    } catch (err) {
      logger.error("Failed to fetch rituals", {
        error: err instanceof Error ? err.message : String(err),
        phases,
        archetype,
      });
      setError(err instanceof Error ? err : new Error("Failed to fetch rituals"));
    } finally {
      setIsLoading(false);
    }
  }, [phases, archetype, limit, activeOnly]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchRituals();
  }, [fetchRituals]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchRituals, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRituals, refreshInterval]);

  // Derived lists
  const activeRituals = useMemo(() => {
    return rituals.filter((r) => {
      if (r.phase === "active") return true;
      if (r.phase === "announced") {
        const now = new Date();
        const startsAt = new Date(r.startsAt);
        return now >= startsAt;
      }
      return false;
    });
  }, [rituals]);

  const upcomingRituals = useMemo(() => {
    const now = new Date();
    return rituals.filter((r) => {
      if (r.phase === "draft") return true;
      if (r.phase === "announced") {
        const startsAt = new Date(r.startsAt);
        return now < startsAt;
      }
      return false;
    });
  }, [rituals]);

  const completedRituals = useMemo(() => {
    return rituals.filter((r) => {
      return r.phase === "ended" || r.phase === "cooldown";
    });
  }, [rituals]);

  // Featured ritual
  const featuredRitual = useMemo(() => {
    if (activeRituals.length === 0) return undefined;

    // Find the one with most participants
    return activeRituals.reduce((best, current) => {
      const bestParticipants =
        (best.metrics as { participants?: number })?.participants || 0;
      const currentParticipants =
        (current.metrics as { participants?: number })?.participants || 0;
      return currentParticipants > bestParticipants ? current : best;
    });
  }, [activeRituals]);

  return {
    rituals,
    isLoading,
    error,
    hasMore,
    activeRituals,
    upcomingRituals,
    completedRituals,
    featuredRitual,
    refresh: fetchRituals,
  };
}
