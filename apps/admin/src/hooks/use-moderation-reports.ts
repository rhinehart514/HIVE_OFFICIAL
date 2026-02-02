"use client";

import { useState, useEffect, useCallback } from "react";

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
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

type StatusFilter = "all" | "pending" | "resolved" | "dismissed";
type TypeFilter = "all" | "spam" | "harassment" | "inappropriate" | "other";

interface UseModerationReportsOptions {
  statusFilter?: StatusFilter;
  typeFilter?: TypeFilter;
  page?: number;
  limit?: number;
}

export function useModerationReports(options: UseModerationReportsOptions = {}) {
  const { statusFilter = "all", typeFilter = "all", page = 1, limit = 20 } = options;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    hasMore: false,
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const response = await fetch(`/api/admin/moderation/reports?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 20,
        hasMore: data.hasMore || false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    pagination,
    loading,
    error,
    refresh: fetchReports,
    clearError: () => setError(null),
  };
}
