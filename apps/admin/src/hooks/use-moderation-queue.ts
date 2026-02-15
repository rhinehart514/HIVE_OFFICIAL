"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/hooks/use-admin-api";

interface Report {
  id: string;
  contentType: "message" | "space" | "tool" | "profile" | "post";
  contentId: string;
  contentPreview: string;
  reportType: "spam" | "harassment" | "inappropriate" | "other";
  reportedBy: string;
  reportedByName?: string;
  targetUserId?: string;
  targetUserName?: string;
  spaceId?: string;
  spaceName?: string;
  reason: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  priority: "high" | "medium" | "low";
  aiScore?: number;
  aiFlags?: string[];
  createdAt: string;
}

interface ModerationStats {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
  byType: {
    spam: number;
    harassment: number;
    inappropriate: number;
    other: number;
  };
}

type PriorityFilter = "all" | "high" | "medium" | "low";
type TypeFilter = "all" | "spam" | "harassment" | "inappropriate" | "other";

interface UseModerationQueueOptions {
  priorityFilter?: PriorityFilter;
  typeFilter?: TypeFilter;
}

export function useModerationQueue(options: UseModerationQueueOptions = {}) {
  const { priorityFilter = "all", typeFilter = "all" } = options;

  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetchWithAuth(`/api/admin/moderation/queue?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch moderation queue");
      }

      const data = await response.json();
      setReports(data.reports || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, typeFilter]);

  const resolveReport = useCallback(async (
    reportId: string,
    action: "remove_content" | "warn_user" | "suspend_user" | "ban_user" | "dismiss",
    resolution: string = "Admin action"
  ) => {
    setActionLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/moderation/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolution }),
      });

      if (!response.ok) throw new Error("Failed to resolve report");

      await fetchQueue();
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      return { success: false, error: err instanceof Error ? err.message : "Action failed" };
    } finally {
      setActionLoading(false);
    }
  }, [fetchQueue]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return {
    reports,
    stats,
    loading,
    error,
    actionLoading,
    refresh: fetchQueue,
    resolveReport,
    clearError: () => setError(null),
  };
}
