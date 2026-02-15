"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import {
  ServerIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  CloudIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  BellAlertIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  lastChecked?: string;
  message?: string;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  acknowledged?: boolean;
}

const serviceIcons: Record<string, typeof ServerIcon> = {
  api: ServerIcon,
  database: CircleStackIcon,
  auth: ShieldCheckIcon,
  storage: CloudIcon,
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  healthy: { color: "text-green-400", bg: "bg-green-500", label: "Healthy" },
  degraded: { color: "text-yellow-400", bg: "bg-yellow-500", label: "Degraded" },
  down: { color: "text-red-400", bg: "bg-red-500", label: "Down" },
};

export default function SystemPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealth = useCallback(async () => {
    try {
      const [healthRes, alertsRes] = await Promise.all([
        fetchWithAuth("/api/admin/system/health"),
        fetchWithAuth("/api/admin/alerts"),
      ]);

      if (healthRes.ok) {
        const data = await healthRes.json();
        const svc = data.services || data.checks || [];
        // Normalize: could be array or object
        if (Array.isArray(svc)) {
          setServices(svc);
        } else {
          setServices(
            Object.entries(svc).map(([name, info]) => ({
              name,
              ...(typeof info === "object" && info !== null ? info : { status: info }),
            })) as ServiceHealth[]
          );
        }
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts((data.alerts || data.recentAlerts || []).slice(0, 5));
      }

      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetchWithAuth("/api/admin/alerts/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch {
      // silent
    }
  };

  const overallStatus = services.some((s) => s.status === "down")
    ? "down"
    : services.some((s) => s.status === "degraded")
    ? "degraded"
    : "healthy";

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${statusConfig[overallStatus]?.bg || "bg-gray-500"} animate-pulse`} />
            <h2 className="text-lg font-semibold text-white">System Status</h2>
            <span className={`text-sm ${statusConfig[overallStatus]?.color || "text-white/50"}`}>
              {statusConfig[overallStatus]?.label || "Unknown"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">
              Last checked: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchHealth}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading && services.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-[#FFD700]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(services.length > 0 ? services : [
              { name: "API", status: "healthy" as const },
              { name: "Database", status: "healthy" as const },
              { name: "Auth", status: "healthy" as const },
              { name: "Storage", status: "healthy" as const },
            ]).map((service) => {
              const Icon = serviceIcons[service.name.toLowerCase()] || ServerIcon;
              const cfg = statusConfig[service.status] || statusConfig.healthy;
              return (
                <div key={service.name} className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-white/50" />
                      <span className="text-sm font-medium text-white capitalize">{service.name}</span>
                    </div>
                    <div className={`h-2.5 w-2.5 rounded-full ${cfg.bg}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                    {service.latency !== undefined && (
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {service.latency}ms
                      </span>
                    )}
                  </div>
                  {service.message && (
                    <p className="text-xs text-white/30 mt-2">{service.message}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Recent Alerts */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
          <BellAlertIcon className="h-5 w-5 text-[#FFD700]" />
          <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
          <span className="text-xs text-white/30">({alerts.filter((a) => !a.acknowledged).length} unacknowledged)</span>
        </div>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircleIcon className="h-8 w-8 text-green-400/50 mb-2" />
            <p className="text-sm text-white/40">No recent alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-4">
                {alert.severity === "critical" || alert.severity === "error" ? (
                  <XCircleIcon className="h-5 w-5 text-red-400 shrink-0" />
                ) : alert.severity === "warning" ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 shrink-0" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-blue-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{alert.message}</p>
                  <p className="text-xs text-white/30">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-3 py-1 text-xs font-medium text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-lg hover:bg-[#FFD700]/20 transition-colors shrink-0"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
