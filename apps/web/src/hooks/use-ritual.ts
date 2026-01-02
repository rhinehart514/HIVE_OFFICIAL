"use client";

import { useState, useEffect, useCallback } from "react";
import { RitualUnion, RitualPhase } from "@hive/core";
import { logger } from "@/lib/logger";

export interface UseRitualOptions {
  /** Ritual ID or slug to fetch */
  id: string;
  /** Whether to use slug lookup (default: false - uses ID) */
  useSlug?: boolean;
  /** Auto-refresh interval in ms (0 = disabled) */
  refreshInterval?: number;
}

export interface UseRitualResult {
  ritual: RitualUnion | null;
  isLoading: boolean;
  error: Error | null;
  isParticipating: boolean;
  /** Join the ritual */
  join: () => Promise<void>;
  /** Leave the ritual */
  leave: () => Promise<void>;
  /** Record a participation action */
  participate: (action: string, points?: number) => Promise<void>;
  /** Refresh ritual data */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and interacting with a single ritual
 *
 * @example
 * ```tsx
 * const { ritual, isLoading, join, participate } = useRitual({ id: 'rit_123' });
 *
 * // Join the ritual
 * await join();
 *
 * // Record participation
 * await participate('daily_check_in', 10);
 * ```
 */
export function useRitual(options: UseRitualOptions): UseRitualResult {
  const { id, useSlug = false, refreshInterval = 0 } = options;

  const [ritual, setRitual] = useState<RitualUnion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);

  // Fetch ritual data
  const fetchRitual = useCallback(async () => {
    try {
      setError(null);

      const endpoint = useSlug
        ? `/api/rituals/slug/${id}`
        : `/api/rituals/${id}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Ritual not found");
        }
        throw new Error("Failed to fetch ritual");
      }

      const data = await response.json();
      setRitual(data.ritual);

      // Check participation status via leaderboard
      const leaderboardRes = await fetch(`/api/rituals/${data.ritual.id}/leaderboard?limit=1`);
      if (leaderboardRes.ok) {
        const lbData = await leaderboardRes.json();
        setIsParticipating(!!lbData.currentUserEntry);
      }
    } catch (err) {
      logger.error("Failed to fetch ritual", {
        id,
        error: err instanceof Error ? err.message : String(err),
      });
      setError(err instanceof Error ? err : new Error("Failed to fetch ritual"));
    } finally {
      setIsLoading(false);
    }
  }, [id, useSlug]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchRitual();
  }, [fetchRitual]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchRitual, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRitual, refreshInterval]);

  // Join ritual
  const join = useCallback(async () => {
    if (!ritual) return;

    try {
      const response = await fetch(`/api/rituals/${ritual.id}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join ritual");
      }

      setIsParticipating(true);
      logger.info("Joined ritual", { ritualId: ritual.id });
    } catch (err) {
      logger.error("Failed to join ritual", {
        ritualId: ritual?.id,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }, [ritual]);

  // Leave ritual
  const leave = useCallback(async () => {
    if (!ritual) return;

    try {
      const response = await fetch(`/api/rituals/${ritual.id}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave ritual");
      }

      setIsParticipating(false);
      logger.info("Left ritual", { ritualId: ritual.id });
    } catch (err) {
      logger.error("Failed to leave ritual", {
        ritualId: ritual?.id,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }, [ritual]);

  // Participate
  const participate = useCallback(
    async (action: string, points: number = 10) => {
      if (!ritual) return;

      try {
        const response = await fetch(`/api/rituals/${ritual.id}/participate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, points }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to record participation");
        }

        logger.info("Recorded participation", {
          ritualId: ritual.id,
          action,
          points,
        });
      } catch (err) {
        logger.error("Failed to record participation", {
          ritualId: ritual?.id,
          action,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    [ritual]
  );

  return {
    ritual,
    isLoading,
    error,
    isParticipating,
    join,
    leave,
    participate,
    refresh: fetchRitual,
  };
}
