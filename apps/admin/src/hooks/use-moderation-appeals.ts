"use client";

import { useState, useEffect, useCallback } from "react";

interface Appeal {
  id: string;
  userId: string;
  userName?: string;
  type: "suspension" | "ban" | "content_removal";
  appealReason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
}

export function useModerationAppeals() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/moderation/appeals?status=pending");
      if (!response.ok) throw new Error("Failed to fetch appeals");
      const data = await response.json();
      setAppeals(data.appeals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appeals");
    } finally {
      setLoading(false);
    }
  }, []);

  const decideAppeal = useCallback(async (
    appealId: string,
    decision: "approve" | "deny",
    reason: string
  ) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/moderation/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appealId,
          decision,
          reason,
          liftSuspension: decision === "approve",
          restoreContent: decision === "approve",
        }),
      });

      if (!response.ok) throw new Error("Failed to process appeal");

      await fetchAppeals();
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      return { success: false, error: err instanceof Error ? err.message : "Action failed" };
    } finally {
      setActionLoading(false);
    }
  }, [fetchAppeals]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  return {
    appeals,
    loading,
    error,
    actionLoading,
    refresh: fetchAppeals,
    decideAppeal,
    clearError: () => setError(null),
  };
}
