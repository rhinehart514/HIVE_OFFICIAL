"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useModerationQueue } from "@/hooks/use-moderation-queue";
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
} from "@hive/ui";
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
  NoSymbolIcon,
  TrashIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

type PriorityFilter = "all" | "high" | "medium" | "low";
type TypeFilter = "all" | "spam" | "harassment" | "inappropriate" | "other";

export default function ModerationQueuePage() {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const {
    reports,
    stats,
    loading,
    error,
    actionLoading,
    refresh,
    resolveReport,
    clearError,
  } = useModerationQueue({ priorityFilter, typeFilter });

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

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return <ChatBubbleLeftIcon className="h-4 w-4" />;
      case "space":
        return <UsersIcon className="h-4 w-4" />;
      case "tool":
        return <WrenchIcon className="h-4 w-4" />;
      case "profile":
        return <UserIcon className="h-4 w-4" />;
      default:
        return <FlagIcon className="h-4 w-4" />;
    }
  };

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
                <ExclamationTriangleIcon className="h-6 w-6 text-[#FFD700]" />
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
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
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
                <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A1A1A6]">Total Reports</p>
                <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                <FlagIcon className="h-6 w-6 text-white/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-white/10 bg-[#141414]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Active Queue</CardTitle>
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
                onClick={refresh}
                disabled={loading}
                className="text-[#A1A1A6] hover:text-white"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
        >
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <XCircleIcon className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircleIcon className="h-12 w-12 text-green-400 mb-4" />
            <p className="text-lg font-medium text-white">All caught up!</p>
            <p className="text-sm text-[#A1A1A6]">No pending reports in the queue</p>
          </CardContent>
        </Card>
      )}

      {/* Report List */}
      {!loading && reports.map((report) => (
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
                      <FlagIcon className="h-3 w-3" />
                      Reported by {report.reportedByName || "Anonymous"}
                    </span>
                    {report.targetUserName && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {report.targetUserName}
                      </span>
                    )}
                    {report.spaceName && (
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {report.spaceName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
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
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveReport(report.id, "warn_user")}
                    disabled={actionLoading}
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                    title="Warn User"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveReport(report.id, "suspend_user")}
                    disabled={actionLoading}
                    className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                    title="Suspend User"
                  >
                    <NoSymbolIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolveReport(report.id, "dismiss")}
                    disabled={actionLoading}
                    className="text-[#A1A1A6] hover:text-white hover:bg-white/5"
                    title="Dismiss"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
