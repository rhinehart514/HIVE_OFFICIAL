"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@hive/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  UsersIcon,
  WrenchIcon,
  UserIcon,
  ClockIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  TrashIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const AlertTriangle = ExclamationTriangleIcon;
const CheckCircle = CheckCircleIcon;
const XCircle = XCircleIcon;
const Flag = FlagIcon;
const MessageSquare = ChatBubbleLeftIcon;
const Users = UsersIcon;
const Wrench = WrenchIcon;
const User = UserIcon;
const Clock = ClockIcon;
const Shield = ShieldCheckIcon;
const Ban = NoSymbolIcon;
const Trash2 = TrashIcon;
const AlertCircle = ExclamationCircleIcon;
const RefreshCw = ArrowPathIcon;
const ChevronRight = ChevronRightIcon;
const ExternalLink = ArrowTopRightOnSquareIcon;
import { PieChart, BarChart } from "./charts";

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

interface Appeal {
  id: string;
  userId: string;
  userName?: string;
  type: "suspension" | "ban" | "content_removal";
  appealReason: string;
  status: "pending" | "approved" | "denied";
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

export function ContentModerationDashboard() {
  // State
  const [activeTab, setActiveTab] = useState<"queue" | "reports" | "appeals">("queue");
  const [reports, setReports] = useState<Report[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch queue
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/admin/moderation/queue?${params}`);

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

  // Fetch appeals
  const fetchAppeals = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/moderation/appeals?status=pending");
      if (!response.ok) throw new Error("Failed to fetch appeals");
      const data = await response.json();
      setAppeals(data.appeals || []);
    } catch {
      // Silently fail for appeals
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchQueue();
    fetchAppeals();
  }, [fetchQueue, fetchAppeals]);

  // Refetch on filter change
  useEffect(() => {
    if (activeTab === "queue") {
      fetchQueue();
    }
  }, [priorityFilter, typeFilter, activeTab, fetchQueue]);

  // Resolve report
  const resolveReport = async (
    reportId: string,
    action: "remove_content" | "warn_user" | "suspend_user" | "ban_user" | "dismiss",
    resolution: string = "Admin action"
  ) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/moderation/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolution }),
      });

      if (!response.ok) throw new Error("Failed to resolve report");

      setSelectedReport(null);
      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Decide appeal
  const decideAppeal = async (appealId: string, decision: "approve" | "deny", reason: string) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "spam":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Spam</Badge>;
      case "harassment":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Harassment</Badge>;
      case "inappropriate":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Inappropriate</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "space":
        return <Users className="h-4 w-4" />;
      case "tool":
        return <Wrench className="h-4 w-4" />;
      case "profile":
        return <User className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  // Time ago helper
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A1A1A6]">Pending</p>
                <p className="text-3xl font-bold text-[#FFD700]">{stats?.pending || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#FFD700]/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-[#FFD700]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A1A1A6]">Resolved Today</p>
                <p className="text-3xl font-bold text-green-400">{stats?.resolved || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A1A1A6]">High Priority</p>
                <p className="text-3xl font-bold text-red-400">
                  {reports.filter((r) => r.priority === "high").length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A1A1A6]">Pending Appeals</p>
                <p className="text-3xl font-bold text-blue-400">{appeals.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Type Distribution */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white text-sm">Reports by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart
                data={[
                  { name: "Spam", value: stats.byType.spam, color: "#A855F7" },
                  { name: "Harassment", value: stats.byType.harassment, color: "#EF4444" },
                  { name: "Inappropriate", value: stats.byType.inappropriate, color: "#F97316" },
                  { name: "Other", value: stats.byType.other, color: "#6B7280" },
                ]}
                height={200}
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white text-sm">Resolution Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={[
                  { name: "Pending", value: stats.pending },
                  { name: "Resolved", value: stats.resolved },
                  { name: "Dismissed", value: stats.dismissed },
                ]}
                height={200}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-[#0A0A0A]">
            <TabsTrigger value="queue" className="data-[state=active]:bg-[#141414]">
              Queue ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#141414]">
              All Reports
            </TabsTrigger>
            <TabsTrigger value="appeals" className="data-[state=active]:bg-[#141414]">
              Appeals ({appeals.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
              <SelectTrigger className="w-[120px] bg-[#0A0A0A] border-white/10 text-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[140px] bg-[#0A0A0A] border-white/10 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate">Inappropriate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchQueue()}
              disabled={loading}
              className="text-[#A1A1A6] hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Queue Tab */}
        <TabsContent value="queue" className="mt-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
            </div>
          )}

          {!loading && reports.length === 0 && (
            <Card className="border-white/10 bg-[#141414]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
                <p className="text-lg font-medium text-white">All caught up!</p>
                <p className="text-sm text-[#A1A1A6]">No pending reports in the queue</p>
              </CardContent>
            </Card>
          )}

          {!loading &&
            reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-white/10 bg-[#141414] hover:bg-[#1A1A1A] transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Content Type Icon */}
                      <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-[#A1A1A6]">
                        {getContentTypeIcon(report.contentType)}
                      </div>

                      {/* Report Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityBadge(report.priority)}
                          {getTypeBadge(report.reportType)}
                          <span className="text-xs text-[#818187]">{report.contentType}</span>
                        </div>

                        <p className="text-white font-medium mb-1">
                          {report.contentPreview || "No preview available"}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-[#A1A1A6]">
                          <span className="flex items-center gap-1">
                            <Flag className="h-3 w-3" />
                            Reported by {report.reportedByName || "Anonymous"}
                          </span>
                          {report.targetUserName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {report.targetUserName}
                            </span>
                          )}
                          {report.spaceName && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {report.spaceName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(report.createdAt)}
                          </span>
                        </div>

                        {report.reason && (
                          <p className="mt-2 text-sm text-[#818187] italic">&quot;{report.reason}&quot;</p>
                        )}

                        {/* AI Flags */}
                        {report.aiFlags && report.aiFlags.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-[#A1A1A6]">AI Flags:</span>
                            {report.aiFlags.map((flag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {flag}
                              </Badge>
                            ))}
                            {report.aiScore !== undefined && (
                              <Badge
                                className={`text-xs ${
                                  report.aiScore > 0.7
                                    ? "bg-red-500/20 text-red-400"
                                    : report.aiScore > 0.4
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                Score: {Math.round(report.aiScore * 100)}%
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveReport(report.id, "remove_content")}
                          disabled={actionLoading}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Remove Content"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveReport(report.id, "warn_user")}
                          disabled={actionLoading}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                          title="Warn User"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveReport(report.id, "suspend_user")}
                          disabled={actionLoading}
                          className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                          title="Suspend User"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveReport(report.id, "dismiss")}
                          disabled={actionLoading}
                          className="text-[#A1A1A6] hover:text-white hover:bg-white/5"
                          title="Dismiss"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          className="text-[#A1A1A6] hover:text-white hover:bg-white/5"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </TabsContent>

        {/* All Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <Card className="border-white/10 bg-[#141414]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ExternalLink className="h-12 w-12 text-[#A1A1A6] mb-4" />
              <p className="text-lg font-medium text-white">View All Reports</p>
              <p className="text-sm text-[#A1A1A6] mb-4">Full history with advanced filters</p>
              <Button variant="outline" className="border-white/20 text-white">
                Open Report History
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appeals Tab */}
        <TabsContent value="appeals" className="mt-4 space-y-4">
          {appeals.length === 0 && (
            <Card className="border-white/10 bg-[#141414]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-blue-400 mb-4" />
                <p className="text-lg font-medium text-white">No Pending Appeals</p>
                <p className="text-sm text-[#A1A1A6]">All appeals have been reviewed</p>
              </CardContent>
            </Card>
          )}

          {appeals.map((appeal) => (
            <motion.div
              key={appeal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-white/10 bg-[#141414]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {appeal.type.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-[#A1A1A6]">by {appeal.userName || "User"}</span>
                        <span className="text-xs text-[#818187]">{timeAgo(appeal.createdAt)}</span>
                      </div>

                      <p className="text-white">{appeal.appealReason}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decideAppeal(appeal.id, "approve", "Appeal approved by admin")}
                        disabled={actionLoading}
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decideAppeal(appeal.id, "deny", "Appeal denied by admin")}
                        disabled={actionLoading}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card className="border-white/10 bg-[#0A0A0A]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Report Details</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedReport(null)}
                      className="text-[#A1A1A6] hover:text-white"
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(selectedReport.priority)}
                    {getTypeBadge(selectedReport.reportType)}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-[#A1A1A6]">Content Preview</p>
                    <div className="p-3 rounded-lg bg-[#141414] border border-white/10">
                      <p className="text-white">{selectedReport.contentPreview || "No preview"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-[#A1A1A6]">Report Reason</p>
                    <p className="text-white">{selectedReport.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#A1A1A6]">Reported By</p>
                      <p className="text-white">{selectedReport.reportedByName || "Anonymous"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#A1A1A6]">Target User</p>
                      <p className="text-white">{selectedReport.targetUserName || "N/A"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <p className="text-sm font-medium text-[#A1A1A6]">Take Action</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => resolveReport(selectedReport.id, "remove_content")}
                        disabled={actionLoading}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Content
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => resolveReport(selectedReport.id, "warn_user")}
                        disabled={actionLoading}
                        className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Warn User
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => resolveReport(selectedReport.id, "suspend_user")}
                        disabled={actionLoading}
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend User
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => resolveReport(selectedReport.id, "dismiss")}
                        disabled={actionLoading}
                        className="border-white/20 text-[#A1A1A6] hover:bg-white/5"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
