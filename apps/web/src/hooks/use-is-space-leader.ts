"use client";

/**
 * Hook to check if the current user is a leader of any space.
 * Used to gate access to HiveLab/Tools features.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@hive/auth-logic";

interface UseIsSpaceLeaderReturn {
  isSpaceLeader: boolean;
  ledSpaces: Array<{ id: string; name: string }>;
  isLoading: boolean;
  error: string | null;
}

export function useIsSpaceLeader(): UseIsSpaceLeaderReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [isSpaceLeader, setIsSpaceLeader] = useState(false);
  const [ledSpaces, setLedSpaces] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkLeaderStatus() {
      if (authLoading) return;

      if (!user?.uid) {
        setIsSpaceLeader(false);
        setLedSpaces([]);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch spaces where user is a leader
        const response = await fetch("/api/spaces/mine?role=leader", {
          credentials: "include",
        });

        if (!response.ok) {
          // If the endpoint doesn't support role filter, try the general endpoint
          const fallbackResponse = await fetch("/api/spaces/mine", {
            credentials: "include",
          });

          if (!fallbackResponse.ok) {
            throw new Error("Failed to fetch spaces");
          }

          const data = await fallbackResponse.json();
          // Handle both wrapped { data: { spaces } } and flat { spaces } formats
          const spaces = data.data?.spaces || data.spaces || [];

          // Filter for leader/owner roles
          const leaderSpaces = spaces.filter(
            (s: { role?: string }) => s.role === "owner" || s.role === "leader" || s.role === "admin"
          );

          setLedSpaces(leaderSpaces.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
          setIsSpaceLeader(leaderSpaces.length > 0);
        } else {
          const data = await response.json();
          // Handle both wrapped { data: { spaces } } and flat { spaces } formats
          const spaces = data.data?.spaces || data.spaces || [];
          setLedSpaces(spaces.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
          setIsSpaceLeader(spaces.length > 0);
        }
      } catch (err) {
        console.error("Error checking leader status:", err);
        setError(err instanceof Error ? err.message : "Failed to check leader status");
        setIsSpaceLeader(false);
        setLedSpaces([]);
      } finally {
        setIsLoading(false);
      }
    }

    checkLeaderStatus();
  }, [user?.uid, authLoading]);

  return {
    isSpaceLeader,
    ledSpaces,
    isLoading: authLoading || isLoading,
    error,
  };
}

export default useIsSpaceLeader;
