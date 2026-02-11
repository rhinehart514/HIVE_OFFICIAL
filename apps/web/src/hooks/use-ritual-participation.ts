"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

export interface ParticipationData {
  isParticipating: boolean;
  joinedAt?: string;
  lastParticipatedAt?: string;
  completionCount: number;
  streakCount: number;
  totalPoints: number;
  achievements: string[];
  rank?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  streakCount: number;
  completionCount: number;
  isCurrentUser: boolean;
}

export interface UseRitualParticipationOptions {
  ritualId: string;
  /** Auto-refresh interval in ms (0 = disabled) */
  refreshInterval?: number;
}

export interface UseRitualParticipationResult {
  participation: ParticipationData | null;
  leaderboard: LeaderboardEntry[];
  totalParticipants: number;
  isLoading: boolean;
  error: Error | null;
  /** Join the ritual */
  join: () => Promise<void>;
  /** Leave the ritual */
  leave: () => Promise<void>;
  /** Record a participation action */
  participate: (action: string, points?: number, metadata?: Record<string, unknown>) => Promise<{
    points: number;
    streak: number;
    totalPoints: number;
  }>;
  /** Refresh participation data */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing user's participation in a ritual
 *
 * @example
 * ```tsx
 * const { participation, leaderboard, join, participate } = useRitualParticipation({
 *   ritualId: 'rit_123',
 * });
 *
 * // Check in for the day
 * const result = await participate('daily_check_in', 10);
 * ```
 */
export function useRitualParticipation(
  options: UseRitualParticipationOptions
): UseRitualParticipationResult {
  const { ritualId, refreshInterval = 0 } = options;

  const [participation, setParticipation] = useState<ParticipationData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch participation data
  const fetchParticipation = useCallback(async () => {
    try {
      setError(null);

      // Fetch leaderboard which includes current user's entry
      const response = await fetch(`/api/rituals/${ritualId}/leaderboard?limit=50`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Ritual not found");
        }
        throw new Error("Failed to fetch participation data");
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setTotalParticipants(data.totalParticipants || 0);

      // Check if user is in leaderboard
      const userEntry = data.leaderboard?.find((e: LeaderboardEntry) => e.isCurrentUser);

      if (userEntry) {
        setParticipation({
          isParticipating: true,
          completionCount: userEntry.completionCount,
          streakCount: userEntry.streakCount,
          totalPoints: userEntry.totalPoints,
          achievements: [],
          rank: userEntry.rank,
        });
      } else if (data.currentUserEntry) {
        // User is participating but not in top leaderboard
        setParticipation({
          isParticipating: true,
          completionCount: data.currentUserEntry.completionCount,
          streakCount: data.currentUserEntry.streakCount,
          totalPoints: data.currentUserEntry.totalPoints,
          achievements: [],
          rank: data.currentUserEntry.rank,
        });
      } else {
        setParticipation({
          isParticipating: false,
          completionCount: 0,
          streakCount: 0,
          totalPoints: 0,
          achievements: [],
        });
      }
    } catch (err) {
      logger.error("Failed to fetch participation data", {
        ritualId,
        error: err instanceof Error ? err.message : String(err),
      });
      setError(err instanceof Error ? err : new Error("Failed to fetch participation data"));
    } finally {
      setIsLoading(false);
    }
  }, [ritualId]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchParticipation();
  }, [fetchParticipation]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchParticipation, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchParticipation, refreshInterval]);

  // Join ritual
  const join = useCallback(async () => {
    try {
      const response = await fetch(`/api/rituals/${ritualId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join ritual");
      }

      const data = await response.json();

      setParticipation({
        isParticipating: true,
        joinedAt: data.participation?.joinedAt,
        completionCount: 0,
        streakCount: 0,
        totalPoints: 0,
        achievements: [],
      });

      setTotalParticipants((prev) => prev + 1);

      logger.info("Joined ritual", { ritualId });
    } catch (err) {
      logger.error("Failed to join ritual", {
        ritualId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }, [ritualId]);

  // Leave ritual
  const leave = useCallback(async () => {
    try {
      const response = await fetch(`/api/rituals/${ritualId}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave ritual");
      }

      setParticipation({
        isParticipating: false,
        completionCount: 0,
        streakCount: 0,
        totalPoints: 0,
        achievements: [],
      });

      setTotalParticipants((prev) => Math.max(0, prev - 1));

      logger.info("Left ritual", { ritualId });
    } catch (err) {
      logger.error("Failed to leave ritual", {
        ritualId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }, [ritualId]);

  // Participate
  const participate = useCallback(
    async (
      action: string,
      points: number = 10,
      metadata?: Record<string, unknown>
    ) => {
      try {
        const response = await fetch(`/api/rituals/${ritualId}/participate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, points, metadata }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to record participation");
        }

        const data = await response.json();

        // Update local state
        setParticipation((prev) =>
          prev
            ? {
                ...prev,
                lastParticipatedAt: new Date().toISOString(),
                completionCount: prev.completionCount + 1,
                streakCount: data.streak,
                totalPoints: data.totalPoints,
              }
            : null
        );

        logger.info("Recorded participation", {
          ritualId,
          action,
          points: data.points,
          streak: data.streak,
        });

        return {
          points: data.points,
          streak: data.streak,
          totalPoints: data.totalPoints,
        };
      } catch (err) {
        logger.error("Failed to record participation", {
          ritualId,
          action,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    [ritualId]
  );

  return {
    participation,
    leaderboard,
    totalParticipants,
    isLoading,
    error,
    join,
    leave,
    participate,
    refresh: fetchParticipation,
  };
}
