"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@hive/ui";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Server,
  Database,
  Shield,
  HardDrive,
  Wifi,
  Zap,
  TrendingUp,
} from "lucide-react";

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: number;
  lastChecked: string;
  message?: string;
}

interface SystemMetrics {
  apiRequests24h: number;
  errorRate: number;
  avgLatency: number;
  activeConnections: number;
}

interface HealthData {
  overallStatus: "healthy" | "degraded" | "down";
  services: ServiceHealth[];
  metrics: SystemMetrics;
  uptime: number;
  lastIncident?: {
    type: string;
    message: string;
    timestamp: string;
    resolved: boolean;
  };
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Firestore: Database,
  "Firestore Write": Database,
  "Firebase Auth": Shield,
  "Cloud Storage": HardDrive,
};

export function SystemHealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/system/health");
      const data = await response.json();

      if (data.success) {
        setHealth(data.data.health);
        setLastRefresh(new Date());
      } else {
        setError(data.error?.message || "Failed to fetch health data");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Activity className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "degraded":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "down":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      default:
        return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return "text-green-400";
    if (latency < 300) return "text-yellow-400";
    return "text-red-400";
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const spinClass = loading ? "animate-spin" : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">System Health</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor infrastructure and service status
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-zinc-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${spinClass}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl border ${getStatusColor(health.overallStatus)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(health.overallStatus)}
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">
                  System Status:{" "}
                  <span className="capitalize">{health.overallStatus}</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  {health.services.filter((s) => s.status === "healthy").length}{" "}
                  of {health.services.length} services operational
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-zinc-500">Uptime</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {formatUptime(health.uptime)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-500">Avg Latency</p>
                <p
                  className={`text-lg font-semibold ${getLatencyColor(health.metrics.avgLatency)}`}
                >
                  {health.metrics.avgLatency}ms
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Service Status Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {health.services.map((service, index) => {
            const Icon = SERVICE_ICONS[service.name] || Server;
            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-800">
                          <Icon className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {service.name}
                          </p>
                          <p
                            className={`text-xs ${getLatencyColor(service.latency)}`}
                          >
                            {service.latency}ms
                          </p>
                        </div>
                      </div>
                      {getStatusIcon(service.status)}
                    </div>
                    {service.message && (
                      <p className="text-xs text-zinc-500 mt-3 truncate">
                        {service.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Metrics */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Zap className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {health.metrics.apiRequests24h.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">API Requests (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${health.metrics.errorRate < 1 ? "bg-green-500/20" : "bg-red-500/20"}`}
                >
                  <TrendingUp
                    className={`h-5 w-5 ${health.metrics.errorRate < 1 ? "text-green-400" : "text-red-400"}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-2xl font-bold ${health.metrics.errorRate < 1 ? "text-green-400" : "text-red-400"}`}
                  >
                    {health.metrics.errorRate}%
                  </p>
                  <p className="text-xs text-zinc-500">Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p
                    className={`text-2xl font-bold ${getLatencyColor(health.metrics.avgLatency)}`}
                  >
                    {health.metrics.avgLatency}ms
                  </p>
                  <p className="text-xs text-zinc-500">Avg Latency</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Wifi className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {health.metrics.activeConnections}
                  </p>
                  <p className="text-xs text-zinc-500">Active Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Incident */}
      {health?.lastIncident && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Last Incident
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {health.lastIncident.type}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {health.lastIncident.message}
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className={
                    health.lastIncident.resolved
                      ? "text-green-400 border-green-500/30"
                      : "text-yellow-400 border-yellow-500/30"
                  }
                >
                  {health.lastIncident.resolved ? "Resolved" : "Ongoing"}
                </Badge>
                <p className="text-xs text-zinc-500 mt-1">
                  {new Date(health.lastIncident.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !health && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 text-zinc-600 mx-auto mb-4 animate-spin" />
          <p className="text-zinc-500">Checking system health...</p>
        </div>
      )}
    </div>
  );
}
