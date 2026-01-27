"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@hive/ui";
import { useAdminFetch } from "@/hooks/use-admin-api";

interface PendingTool {
  id: string;
  requestId: string;
  toolId: string;
  toolName: string;
  toolDescription?: string;
  toolCategory?: string;
  creatorId: string;
  creatorName?: string;
  creatorHandle?: string;
  targetSpaceId?: string;
  targetSpaceName?: string;
  status: "pending" | "in_review";
  aiQualityScore?: number;
  aiFlags?: string[];
  elementCount: number;
  previewUrl?: string;
  createdAt: string;
  lastUpdated?: string;
}

interface PendingToolsResponse {
  tools: PendingTool[];
  stats: {
    total: number;
    pending: number;
    inReview: number;
    withFlags: number;
    avgQualityScore: number;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function BuilderQueue() {
  const { adminFetch, isReady } = useAdminFetch();
  const [tools, setTools] = useState<PendingTool[]>([]);
  const [stats, setStats] = useState<PendingToolsResponse["stats"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    tool: PendingTool;
    reason: string;
    action: "reject" | "request_changes";
  } | null>(null);

  const fetchPendingTools = useCallback(async () => {
    if (!isReady) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminFetch("/api/admin/tools/pending");

      if (!response.ok) {
        throw new Error("Failed to fetch pending tools");
      }

      const data: { success: boolean; data: PendingToolsResponse } = await response.json();
      if (data.success) {
        setTools(data.data.tools);
        setStats(data.data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [adminFetch, isReady]);

  useEffect(() => {
    fetchPendingTools();
  }, [fetchPendingTools]);

  const handleApprove = async (tool: PendingTool) => {
    try {
      setActionLoading(tool.id);
      const response = await adminFetch(`/api/admin/tools/${tool.toolId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: tool.requestId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve tool");
      }

      setTools((prev) => prev.filter((t) => t.id !== tool.id));
      if (stats) {
        setStats({ ...stats, total: stats.total - 1, pending: stats.pending - 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog || rejectDialog.reason.length < 10) return;

    try {
      setActionLoading(rejectDialog.tool.id);
      const response = await adminFetch(`/api/admin/tools/${rejectDialog.tool.toolId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: rejectDialog.tool.requestId,
          action: rejectDialog.action,
          reason: rejectDialog.reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject tool");
      }

      setTools((prev) => prev.filter((t) => t.id !== rejectDialog.tool.id));
      if (stats) {
        setStats({ ...stats, total: stats.total - 1, pending: stats.pending - 1 });
      }
      setRejectDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-400">Loading pending tools...</div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-md border border-gray-700 bg-gray-800/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-red-400">{error}</div>
        <Button variant="outline" size="sm" onClick={fetchPendingTools}>
          Retry
        </Button>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-400">No pending builder applications</div>
        {stats && stats.total === 0 && (
          <div className="text-xs text-gray-500">
            All tools have been reviewed. Check back later.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stats && (
        <div className="flex gap-4 text-xs text-gray-400">
          <span>{stats.total} pending</span>
          {stats.withFlags > 0 && (
            <span className="text-amber-400">{stats.withFlags} flagged</span>
          )}
          {stats.avgQualityScore > 0 && (
            <span>Avg quality: {stats.avgQualityScore}%</span>
          )}
        </div>
      )}

      <div className="space-y-2">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="rounded-md border border-gray-600 bg-gray-800/50 p-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate font-medium text-white">
                    {tool.toolName}
                  </div>
                  {tool.aiFlags && tool.aiFlags.length > 0 && (
                    <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                      {tool.aiFlags.length} flags
                    </span>
                  )}
                  {tool.aiQualityScore !== undefined && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${
                        tool.aiQualityScore >= 80
                          ? "bg-green-500/20 text-green-400"
                          : tool.aiQualityScore >= 60
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {tool.aiQualityScore}%
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-gray-400">
                  {tool.creatorHandle ? `@${tool.creatorHandle}` : tool.creatorName || "Unknown"}
                  {tool.targetSpaceName && (
                    <span className="text-gray-500"> → {tool.targetSpaceName}</span>
                  )}
                </div>
                {tool.toolDescription && (
                  <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {tool.toolDescription}
                  </div>
                )}
                <div className="mt-1 flex gap-3 text-xs text-gray-500">
                  <span>{tool.elementCount} elements</span>
                  <span>{new Date(tool.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading === tool.id}
                  onClick={() =>
                    setRejectDialog({ tool, reason: "", action: "reject" })
                  }
                >
                  Reject
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={actionLoading === tool.id}
                  onClick={() => handleApprove(tool)}
                >
                  {actionLoading === tool.id ? "..." : "Approve"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-4">
            <h3 className="mb-4 text-lg font-medium text-white">
              {rejectDialog.action === "reject" ? "Reject Tool" : "Request Changes"}
            </h3>
            <div className="mb-4">
              <label className="mb-1 block text-sm text-gray-400">
                Reason (min 10 characters)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-600 bg-gray-800 p-2 text-sm text-white placeholder-gray-500 focus:border-white focus:outline-none"
                rows={4}
                placeholder="Explain why this tool is being rejected..."
                value={rejectDialog.reason}
                onChange={(e) =>
                  setRejectDialog({ ...rejectDialog, reason: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  className="rounded border-gray-600 bg-gray-800"
                  checked={rejectDialog.action === "request_changes"}
                  onChange={(e) =>
                    setRejectDialog({
                      ...rejectDialog,
                      action: e.target.checked ? "request_changes" : "reject",
                    })
                  }
                />
                Request changes (allow resubmission)
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={rejectDialog.reason.length < 10 || actionLoading !== null}
                onClick={handleReject}
              >
                {actionLoading ? "..." : rejectDialog.action === "reject" ? "Reject" : "Request Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
