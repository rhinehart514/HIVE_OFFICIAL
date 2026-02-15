"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import {
  InboxStackIcon,
  FlagIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  NoSymbolIcon,
  UserIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

type Tab = "queue" | "reports" | "appeals";

interface QueueItem {
  id: string;
  contentType: string;
  contentPreview: string;
  reportType: string;
  priority: string;
  reportedByName?: string;
  targetUserName?: string;
  reason?: string;
  createdAt: string;
  aiScore?: number;
  aiFlags?: string[];
}

interface Report {
  id: string;
  contentType: string;
  contentPreview: string;
  reportType: string;
  status: string;
  priority: string;
  reportedByName?: string;
  targetUserName?: string;
  reason?: string;
  resolution?: string;
  createdAt: string;
}

interface Appeal {
  id: string;
  userId: string;
  userName?: string;
  type: string;
  appealReason: string;
  status: string;
  createdAt: string;
}

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [counts, setCounts] = useState({ queue: 0, reports: 0, appeals: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [queueRes, reportsRes, appealsRes] = await Promise.all([
        fetchWithAuth("/api/admin/moderation/queue"),
        fetchWithAuth("/api/admin/moderation/reports?status=pending"),
        fetchWithAuth("/api/admin/moderation/appeals?status=pending"),
      ]);

      const queueData = queueRes.ok ? await queueRes.json() : { reports: [] };
      const reportsData = reportsRes.ok ? await reportsRes.json() : { reports: [] };
      const appealsData = appealsRes.ok ? await appealsRes.json() : { appeals: [] };

      const q = queueData.reports || queueData.queue || [];
      const r = reportsData.reports || [];
      const a = appealsData.appeals || [];

      setQueue(q);
      setReports(r);
      setAppeals(a);
      setCounts({ queue: q.length, reports: r.length, appeals: a.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load moderation data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleQueueAction = async (id: string, action: string) => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/moderation/reports/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolution: "Admin action" }),
      });
      if (!res.ok) throw new Error("Action failed");
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAppealDecision = async (id: string, decision: "approve" | "deny") => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/moderation/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appealId: id,
          decision,
          reason: `Appeal ${decision}d by admin`,
          liftSuspension: decision === "approve",
          restoreContent: decision === "approve",
        }),
      });
      if (!res.ok) throw new Error("Decision failed");
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed");
    } finally {
      setActionLoading(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const severityColor: Record<string, string> = {
    critical: "bg-red-600/20 text-red-400 border-red-600/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    reviewing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    resolved: "bg-green-500/20 text-green-400 border-green-500/30",
    dismissed: "bg-white/10 text-white/50 border-white/20",
  };

  const tabs: { key: Tab; label: string; icon: typeof InboxStackIcon; count: number }[] = [
    { key: "queue", label: "Queue", icon: InboxStackIcon, count: counts.queue },
    { key: "reports", label: "Reports", icon: FlagIcon, count: counts.reports },
    { key: "appeals", label: "Appeals", icon: ScaleIcon, count: counts.appeals },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  active
                    ? "bg-[#FFD700]/10 text-[#FFD700] shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                    active ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-white/10 text-white/60"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchAll}
          disabled={loading}
          className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}>
            <XCircleIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
        </div>
      )}

      {/* Queue Tab */}
      {!loading && activeTab === "queue" && (
        <div className="space-y-3">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <CheckCircleIcon className="h-12 w-12 text-green-400 mb-3" />
              <p className="text-white font-medium">All caught up!</p>
              <p className="text-sm text-white/40">No pending items in the queue</p>
            </div>
          ) : (
            queue.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${severityColor[item.priority] || severityColor.low}`}>
                        {item.priority}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/50 border border-white/10">
                        {item.reportType}
                      </span>
                      <span className="text-xs text-white/30">{item.contentType}</span>
                    </div>
                    <p className="text-white text-sm mb-1">{item.contentPreview || "No preview"}</p>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      {item.reportedByName && (
                        <span className="flex items-center gap-1">
                          <FlagIcon className="h-3 w-3" />
                          {item.reportedByName}
                        </span>
                      )}
                      {item.targetUserName && (
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {item.targetUserName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="mt-2 text-xs text-white/30 italic">&quot;{item.reason}&quot;</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleQueueAction(item.id, "dismiss")}
                      disabled={actionLoading}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleQueueAction(item.id, "remove_content")}
                      disabled={actionLoading}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleQueueAction(item.id, "warn_user")}
                      disabled={actionLoading}
                      className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                      title="Escalate"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports Tab */}
      {!loading && activeTab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <FlagIcon className="h-12 w-12 text-white/20 mb-3" />
              <p className="text-white font-medium">No pending reports</p>
              <p className="text-sm text-white/40">All reports have been resolved</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColor[report.status] || statusColor.pending}`}>
                        {report.status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${severityColor[report.priority] || severityColor.low}`}>
                        {report.priority}
                      </span>
                      <span className="text-xs text-white/30">{report.reportType}</span>
                    </div>
                    <p className="text-white text-sm">{report.contentPreview || "No preview"}</p>
                    <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                      <span>{report.reportedByName || "Anonymous"}</span>
                      <span>{timeAgo(report.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 text-white/30 transition-transform ${expandedReport === report.id ? "rotate-180" : ""}`} />
                </button>
                {expandedReport === report.id && (
                  <div className="px-4 pb-4 border-t border-white/[0.06] pt-3 space-y-2">
                    {report.reason && (
                      <div>
                        <span className="text-xs text-white/40">Reason:</span>
                        <p className="text-sm text-white/70">{report.reason}</p>
                      </div>
                    )}
                    {report.targetUserName && (
                      <div className="text-xs text-white/40">
                        Target: <span className="text-white/70">{report.targetUserName}</span>
                      </div>
                    )}
                    {report.resolution && (
                      <div className="text-xs text-green-400">
                        Resolution: {report.resolution}
                      </div>
                    )}
                    {report.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleQueueAction(report.id, "remove_content")}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          Remove Content
                        </button>
                        <button
                          onClick={() => handleQueueAction(report.id, "dismiss")}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-medium bg-white/5 text-white/60 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Appeals Tab */}
      {!loading && activeTab === "appeals" && (
        <div className="space-y-3">
          {appeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <ShieldCheckIcon className="h-12 w-12 text-blue-400/50 mb-3" />
              <p className="text-white font-medium">No pending appeals</p>
              <p className="text-sm text-white/40">All appeals have been reviewed</p>
            </div>
          ) : (
            appeals.map((appeal) => (
              <div key={appeal.id} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ScaleIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {appeal.type.replace("_", " ")}
                      </span>
                      <span className="text-sm text-white/50">{appeal.userName || "User"}</span>
                      <span className="text-xs text-white/30">{timeAgo(appeal.createdAt)}</span>
                    </div>
                    <p className="text-white text-sm">{appeal.appealReason}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAppealDecision(appeal.id, "approve")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAppealDecision(appeal.id, "deny")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
