"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hive/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const FileText = DocumentTextIcon;
const Search = MagnifyingGlassIcon;
const Filter = FunnelIcon;
const RefreshCw = ArrowPathIcon;
const ChevronDown = ChevronDownIcon;
const ChevronUp = ChevronUpIcon;
const Info = InformationCircleIcon;
const AlertTriangle = ExclamationTriangleIcon;
const AlertCircle = ExclamationCircleIcon;
const XCircle = XCircleIcon;
const Clock = ClockIcon;
const User = UserIcon;
const Terminal = CommandLineIcon;

interface ActivityLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  target: string;
  targetId?: string;
  details?: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

interface LogStats {
  severityCounts: {
    info: number;
    warning: number;
    error: number;
    critical: number;
  };
}

export function ActivityLogViewer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Pagination
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Expanded log details
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;

      try {
        const params = new URLSearchParams({
          limit: "50",
          offset: String(currentOffset),
        });

        if (actionFilter !== "all") {
          params.set("action", actionFilter);
        }
        if (severityFilter !== "all") {
          params.set("severity", severityFilter);
        }

        const response = await fetch(`/api/admin/logs?${params}`);
        const data = await response.json();

        if (data.success) {
          if (reset) {
            setLogs(data.data.logs);
          } else {
            setLogs((prev) => [...prev, ...data.data.logs]);
          }
          setHasMore(data.data.pagination.hasMore);
          setStats(data.data.stats);
          setAvailableActions(data.data.filters.availableActions);
          if (reset) {
            setOffset(data.data.logs.length);
          } else {
            setOffset((prev) => prev + data.data.logs.length);
          }
        } else {
          setError(data.error?.message || "Failed to fetch logs");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    },
    [offset, actionFilter, severityFilter]
  );

  useEffect(() => {
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, severityFilter]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "info":
        return <Info className="h-4 w-4 text-blue-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Info className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "warning":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "error":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30";
      case "critical":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      default:
        return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.target.toLowerCase().includes(search) ||
      log.adminEmail?.toLowerCase().includes(search) ||
      log.targetId?.toLowerCase().includes(search)
    );
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const spinClass = loading ? "animate-spin" : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">Activity Logs</h2>
          <p className="text-sm text-zinc-400 mt-1">
            View admin actions and system events
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(true)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${spinClass}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-zinc-400">Info</span>
                </div>
                <span className="text-lg font-semibold text-blue-400">
                  {stats.severityCounts.info}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-zinc-400">Warning</span>
                </div>
                <span className="text-lg font-semibold text-yellow-400">
                  {stats.severityCounts.warning}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-zinc-400">Error</span>
                </div>
                <span className="text-lg font-semibold text-orange-400">
                  {stats.severityCounts.error}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-zinc-400">Critical</span>
                </div>
                <span className="text-lg font-semibold text-red-400">
                  {stats.severityCounts.critical}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            className="pl-10 bg-zinc-900/50 border-zinc-700"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-700">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {availableActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px] bg-zinc-900/50 border-zinc-700">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Recent Activity ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            <AnimatePresence>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>No logs found</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border border-zinc-800 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedLog(expandedLog === log.id ? null : log.id)
                      }
                      className="w-full p-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(log.severity)}
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-100">
                              {log.action}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getSeverityColor(log.severity)}`}
                            >
                              {log.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500">
                            {log.target}
                            {log.targetId && ` • ${log.targetId.slice(0, 8)}...`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <User className="h-3 w-3" />
                            {log.adminEmail?.split("@")[0] || "Unknown"}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-600">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </div>
                        {expandedLog === log.id ? (
                          <ChevronUp className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-zinc-500" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedLog === log.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-800 bg-zinc-900/50"
                        >
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-zinc-500">Admin ID:</span>
                                <span className="ml-2 text-zinc-300 font-mono text-xs">
                                  {log.adminId}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500">Timestamp:</span>
                                <span className="ml-2 text-zinc-300">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {log.ip && (
                                <div>
                                  <span className="text-zinc-500">IP:</span>
                                  <span className="ml-2 text-zinc-300 font-mono text-xs">
                                    {log.ip}
                                  </span>
                                </div>
                              )}
                              {log.targetId && (
                                <div>
                                  <span className="text-zinc-500">Target ID:</span>
                                  <span className="ml-2 text-zinc-300 font-mono text-xs">
                                    {log.targetId}
                                  </span>
                                </div>
                              )}
                            </div>

                            {log.details && Object.keys(log.details).length > 0 && (
                              <div>
                                <span className="text-xs text-zinc-500 block mb-2">
                                  Details:
                                </span>
                                <pre className="text-xs bg-zinc-950 p-3 rounded-lg overflow-x-auto text-zinc-400 font-mono">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(false)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
