"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useModerationReports } from "@/hooks/use-moderation-reports";
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
  XCircleIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  UsersIcon,
  WrenchIcon,
  UserIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

type StatusFilter = "all" | "pending" | "resolved" | "dismissed";
type TypeFilter = "all" | "spam" | "harassment" | "inappropriate" | "other";

export default function ModerationReportsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);

  const {
    reports,
    pagination,
    loading,
    error,
    refresh,
    clearError,
  } = useModerationReports({ statusFilter, typeFilter, page });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Resolved</Badge>;
      case "dismissed":
        return <Badge className="bg-white/10 text-white/50 border-white/20">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-white/10 bg-[#141414]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Report History</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
                <SelectTrigger className="w-[130px] bg-[#0A0A0A] border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-white/10">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as TypeFilter); setPage(1); }}>
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
            <FlagIcon className="h-12 w-12 text-[#A1A1A6] mb-4" />
            <p className="text-lg font-medium text-white">No reports found</p>
            <p className="text-sm text-[#A1A1A6]">Try adjusting your filters</p>
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
          <Card className="border-white/10 bg-[#141414]">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Content Type Icon */}
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-[#A1A1A6]">
                  {getContentTypeIcon(report.contentType)}
                </div>

                {/* Report Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(report.status)}
                    {getPriorityBadge(report.priority)}
                    {getTypeBadge(report.reportType)}
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
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {formatDate(report.createdAt)}
                    </span>
                  </div>

                  {report.reason && (
                    <p className="mt-2 text-sm text-[#818187] italic">&quot;{report.reason}&quot;</p>
                  )}

                  {report.resolution && (
                    <p className="mt-2 text-sm text-green-400">
                      Resolution: {report.resolution}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Pagination */}
      {!loading && reports.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#A1A1A6]">
            Showing {(page - 1) * pagination.limit + 1}-{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="text-[#A1A1A6] hover:text-white disabled:opacity-50"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!pagination.hasMore}
              onClick={() => setPage(page + 1)}
              className="text-[#A1A1A6] hover:text-white disabled:opacity-50"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
