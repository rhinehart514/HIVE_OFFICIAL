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
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Textarea,
  Checkbox,
} from "@hive/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  WrenchIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ClockIcon,
  HashtagIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  Square2StackIcon,
  SparklesIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const Wrench = WrenchIcon;
const Check = CheckIcon;
const X = XMarkIcon;
const AlertTriangle = ExclamationTriangleIcon;
const User = UserIcon;
const Clock = ClockIcon;
const Hash = HashtagIcon;
const ExternalLink = ArrowTopRightOnSquareIcon;
const RefreshCw = ArrowPathIcon;
const Search = MagnifyingGlassIcon;
const ChevronRight = ChevronRightIcon;
const Star = StarIcon;
const MessageSquare = ChatBubbleLeftIcon;
const Layers = Square2StackIcon;
const Sparkles = SparklesIcon;
const ThumbsUp = HandThumbUpIcon;
const ThumbsDown = HandThumbDownIcon;
const Edit3 = PencilIcon;
import { PieChart, BarChart } from "./charts";

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

interface ReviewStats {
  total: number;
  pending: number;
  inReview: number;
  withFlags: number;
  avgQualityScore: number;
}

interface ReviewMetrics {
  statusCounts: {
    pending: number;
    approved: number;
    rejected: number;
    changes_requested: number;
    total: number;
  };
  metrics: {
    approvalRate: number;
    avgReviewTimeHours: number;
    totalReviewsInPeriod: number;
    totalSubmissionsInPeriod: number;
  };
}

type SortBy = "createdAt" | "toolName" | "creator";

export function ToolReviewDashboard() {
  const [tools, setTools] = useState<PendingTool[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");

  const [selectedTool, setSelectedTool] = useState<PendingTool | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Review form state
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [promoteToTemplate, setPromoteToTemplate] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [toolsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/tools/pending?sortBy=${sortBy}&sortOrder=desc`),
        fetch("/api/admin/tools/review-stats?days=30"),
      ]);

      const toolsData = await toolsResponse.json();
      const statsData = await statsResponse.json();

      if (toolsData.success) {
        setTools(toolsData.data.tools);
        setStats(toolsData.data.stats);
      } else {
        setError(toolsData.error?.message || "Failed to fetch pending tools");
      }

      if (statsData.success) {
        setMetrics({
          statusCounts: statsData.data.statusCounts,
          metrics: statsData.data.metrics,
        });
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleApprove = async () => {
    if (!selectedTool) return;
    setActionLoading(true);

    try {
      const response = await fetch(
        `/api/admin/tools/${selectedTool.toolId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: selectedTool.requestId,
            feedback: reviewFeedback || undefined,
            promoteToTemplate,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSelectedTool(null);
        setReviewFeedback("");
        setPromoteToTemplate(false);
        fetchTools();
      } else {
        setError(data.error?.message || "Failed to approve tool");
      }
    } catch (err) {
      setError("Failed to approve tool");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestChanges: boolean) => {
    if (!selectedTool || !rejectionReason) return;
    setActionLoading(true);

    try {
      const response = await fetch(
        `/api/admin/tools/${selectedTool.toolId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: selectedTool.requestId,
            action: requestChanges ? "request_changes" : "reject",
            reason: rejectionReason,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSelectedTool(null);
        setRejectionReason("");
        fetchTools();
      } else {
        setError(data.error?.message || "Failed to reject tool");
      }
    } catch (err) {
      setError("Failed to reject tool");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTools = tools.filter(
    (tool) =>
      tool.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.creatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.creatorHandle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQualityColor = (score?: number) => {
    if (!score) return "text-zinc-500";
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  // Chart data
  const statusDistribution = metrics
    ? [
        { name: "Approved", value: metrics.statusCounts.approved, color: "#22C55E" },
        { name: "Rejected", value: metrics.statusCounts.rejected, color: "#EF4444" },
        { name: "Changes Requested", value: metrics.statusCounts.changes_requested, color: "#EAB308" },
        { name: "Pending", value: metrics.statusCounts.pending, color: "#8B5CF6" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">
            Tool Review Workflow
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            HiveLab tool approval queue and review metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTools}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">
                  {stats?.pending || 0}
                </p>
                <p className="text-xs text-zinc-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ThumbsUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">
                  {metrics?.statusCounts.approved || 0}
                </p>
                <p className="text-xs text-zinc-500">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <ThumbsDown className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">
                  {metrics?.statusCounts.rejected || 0}
                </p>
                <p className="text-xs text-zinc-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">
                  {stats?.withFlags || 0}
                </p>
                <p className="text-xs text-zinc-500">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">
                  {metrics?.metrics.approvalRate || 0}%
                </p>
                <p className="text-xs text-zinc-500">Approval Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-700">
                <Clock className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">
                  {metrics?.metrics.avgReviewTimeHours || 0}h
                </p>
                <p className="text-xs text-zinc-500">Avg Review Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Review Outcomes (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <PieChart data={statusDistribution} height={200} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-500">
                No review data
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Quality Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              {stats?.avgQualityScore ? (
                <div className="text-center">
                  <p className={`text-5xl font-bold ${getQualityColor(stats.avgQualityScore)}`}>
                    {stats.avgQualityScore}
                  </p>
                  <p className="text-sm text-zinc-500 mt-2">
                    Average AI Quality Score
                  </p>
                </div>
              ) : (
                <p className="text-zinc-500">No quality data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search tools or creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-700"
          />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[150px] bg-zinc-900/50 border-zinc-700">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Submitted</SelectItem>
            <SelectItem value="toolName">Tool Name</SelectItem>
            <SelectItem value="creator">Creator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Tools Queue */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.requestId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card
                className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer ${
                  tool.aiFlags && tool.aiFlags.length > 0
                    ? "border-l-2 border-l-yellow-500"
                    : ""
                }`}
                onClick={() => setSelectedTool(tool)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Wrench className="h-6 w-6 text-zinc-500" />
                      </div>

                      <div>
                        <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                          {tool.toolName}
                          {tool.aiFlags && tool.aiFlags.length > 0 && (
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          )}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {tool.creatorName || tool.creatorHandle || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {tool.elementCount} elements
                          </span>
                          {tool.targetSpaceName && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {tool.targetSpaceName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {tool.aiQualityScore !== undefined && (
                        <div className="text-right">
                          <p
                            className={`text-lg font-semibold ${getQualityColor(
                              tool.aiQualityScore
                            )}`}
                          >
                            {tool.aiQualityScore}
                          </p>
                          <p className="text-xs text-zinc-500">Quality</p>
                        </div>
                      )}

                      <Badge
                        variant="outline"
                        className={
                          tool.status === "pending"
                            ? "text-purple-400 border-purple-400/30"
                            : "text-blue-400 border-blue-400/30"
                        }
                      >
                        {tool.status === "pending" ? "Pending" : "In Review"}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTool(tool);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTool(tool);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      </div>
                    </div>
                  </div>

                  {/* AI Flags */}
                  {tool.aiFlags && tool.aiFlags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <div className="flex flex-wrap gap-1">
                        {tool.aiFlags.map((flag, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs border-yellow-500/30 text-yellow-400"
                          >
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 text-xs text-zinc-600">
                    Submitted {new Date(tool.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!loading && filteredTools.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400 mb-2">
            No pending tools
          </h3>
          <p className="text-sm text-zinc-500">
            All tools have been reviewed
          </p>
        </div>
      )}

      {/* Review Sheet */}
      <Sheet
        open={!!selectedTool}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTool(null);
            setReviewFeedback("");
            setPromoteToTemplate(false);
            setRejectionReason("");
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg bg-zinc-900 border-zinc-800 overflow-y-auto">
          {selectedTool && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-zinc-100">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div>
                    <span>{selectedTool.toolName}</span>
                    <span className="text-sm text-zinc-500 font-normal block">
                      by {selectedTool.creatorName || selectedTool.creatorHandle}
                    </span>
                  </div>
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Tool review details
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Tool Info */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3">
                    Tool Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedTool.toolDescription && (
                      <p className="text-zinc-300">
                        {selectedTool.toolDescription}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="p-2 rounded bg-zinc-800/50">
                        <span className="text-zinc-500">Category:</span>
                        <span className="text-zinc-300 ml-2">
                          {selectedTool.toolCategory || "Uncategorized"}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-zinc-800/50">
                        <span className="text-zinc-500">Elements:</span>
                        <span className="text-zinc-300 ml-2">
                          {selectedTool.elementCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quality Score */}
                {selectedTool.aiQualityScore !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-3">
                      AI Quality Assessment
                    </h4>
                    <div className="flex items-center gap-4 p-3 rounded bg-zinc-800/50">
                      <div
                        className={`text-3xl font-bold ${getQualityColor(
                          selectedTool.aiQualityScore
                        )}`}
                      >
                        {selectedTool.aiQualityScore}
                      </div>
                      <div>
                        <p className="text-sm text-zinc-300">
                          {selectedTool.aiQualityScore >= 80
                            ? "High quality tool"
                            : selectedTool.aiQualityScore >= 60
                            ? "Acceptable quality"
                            : "Needs improvement"}
                        </p>
                        {selectedTool.aiFlags && selectedTool.aiFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedTool.aiFlags.map((flag, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs border-yellow-500/30 text-yellow-400"
                              >
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Target Space */}
                {selectedTool.targetSpaceName && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-3">
                      Target Deployment
                    </h4>
                    <div className="p-3 rounded bg-zinc-800/50 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-300">
                        {selectedTool.targetSpaceName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Approve Section */}
                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-400 mb-3">
                    Approve Tool
                  </h4>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Optional feedback for creator..."
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700"
                      rows={2}
                    />
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                      <Checkbox
                        checked={promoteToTemplate}
                        onCheckedChange={(checked) =>
                          setPromoteToTemplate(checked as boolean)
                        }
                      />
                      Promote to template library
                    </label>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Tool
                    </Button>
                  </div>
                </div>

                {/* Reject Section */}
                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-medium text-zinc-400 mb-3">
                    Reject or Request Changes
                  </h4>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Reason for rejection or requested changes (required)..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                        onClick={() => handleReject(true)}
                        disabled={actionLoading || !rejectionReason}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Request Changes
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleReject(false)}
                        disabled={actionLoading || !rejectionReason}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>

                {/* View Tool */}
                {selectedTool.previewUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <a
                      href={selectedTool.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Tool
                    </a>
                  </Button>
                )}

                {/* Metadata */}
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>
                    Submitted: {new Date(selectedTool.createdAt).toLocaleString()}
                  </p>
                  <p>Request ID: {selectedTool.requestId}</p>
                  <p>Tool ID: {selectedTool.toolId}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
