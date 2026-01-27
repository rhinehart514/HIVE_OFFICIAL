"use client";

/**
 * Health View
 *
 * Platform health and risk dashboard for Command Center.
 * Surfaces potential issues before they become problems.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  useCommandStore,
  selectHealthIndicators,
  type HealthIndicator,
  type AtRiskItem,
  type TrendAlert,
} from "@/lib/stores";
import { HiveCard, CardContent, CardHeader, CardTitle, Badge, Progress } from "@hive/ui";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOffice2Icon,
  ClockIcon,
} from "@heroicons/react/24/outline";

function HealthGauge({ score, status }: { score: number; status: string }) {
  const statusColors = {
    healthy: { bg: "bg-green-500/20", ring: "ring-green-500", text: "text-green-400" },
    warning: { bg: "bg-amber-500/20", ring: "ring-amber-500", text: "text-amber-400" },
    critical: { bg: "bg-red-500/20", ring: "ring-red-500", text: "text-red-400" },
  };

  const colors = statusColors[status as keyof typeof statusColors] || statusColors.healthy;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative w-32 h-32 rounded-full ${colors.bg} ring-4 ${colors.ring} flex items-center justify-center`}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-4xl font-bold ${colors.text}`}
          >
            {score}
          </motion.div>
          <div className="text-xs text-gray-400 uppercase">{status}</div>
        </div>
      </div>
    </div>
  );
}

function IndicatorCard({ indicator }: { indicator: HealthIndicator }) {
  const statusConfig = {
    healthy: {
      icon: CheckCircleIcon,
      bgClass: "bg-green-500/10",
      borderClass: "border-green-500/30",
      textClass: "text-green-400",
      badgeClass: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
      textClass: "text-amber-400",
      badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    critical: {
      icon: XCircleIcon,
      bgClass: "bg-red-500/10",
      borderClass: "border-red-500/30",
      textClass: "text-red-400",
      badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const config = statusConfig[indicator.status];
  const Icon = config.icon;

  return (
    <HiveCard className={`${config.bgClass} border ${config.borderClass}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.textClass}`} />
            <span className="font-medium text-white">{indicator.dimension}</span>
          </div>
          <Badge className={config.badgeClass}>{indicator.score}/100</Badge>
        </div>

        <Progress
          value={indicator.score}
          className="h-2 mb-3"
        />

        <p className="text-sm text-gray-400">{indicator.message}</p>

        {indicator.details && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {Object.entries(indicator.details).map(([key, value]) => (
                <span key={key} className="text-xs text-gray-500">
                  {key}: {typeof value === "number" ? value.toLocaleString() : String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </HiveCard>
  );
}

function AtRiskCard({ item }: { item: AtRiskItem }) {
  const severityColors = {
    low: "border-gray-500/30 bg-gray-500/10",
    medium: "border-amber-500/30 bg-amber-500/10",
    high: "border-red-500/30 bg-red-500/10",
  };

  const severityBadges = {
    low: "bg-gray-500/20 text-gray-400",
    medium: "bg-amber-500/20 text-amber-400",
    high: "bg-red-500/20 text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border ${severityColors[item.severity]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {item.type === "space" ? (
            <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
          ) : (
            <ClockIcon className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-white">{item.name}</span>
        </div>
        <Badge className={severityBadges[item.severity]}>{item.severity}</Badge>
      </div>
      <p className="text-xs text-gray-400 mt-1">{item.risk}</p>
      <p className="text-xs text-gray-500 mt-1">
        Last active: {new Date(item.lastActivity).toLocaleDateString()}
      </p>
    </motion.div>
  );
}

function AlertCard({ alert }: { alert: TrendAlert }) {
  const isWarning = alert.severity === "warning";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-3 rounded-lg border ${
        isWarning
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-red-500/30 bg-red-500/10"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {alert.direction === "down" ? (
          <ArrowTrendingDownIcon className={`h-4 w-4 ${isWarning ? "text-amber-400" : "text-red-400"}`} />
        ) : (
          <ArrowTrendingUpIcon className={`h-4 w-4 ${isWarning ? "text-amber-400" : "text-red-400"}`} />
        )}
        <span className="text-sm font-medium text-white">{alert.metric}</span>
        <Badge className={isWarning ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}>
          {alert.severity}
        </Badge>
      </div>
      <p className="text-sm text-gray-400">{alert.message}</p>
      <p className="text-xs text-gray-500 mt-1">
        Detected: {new Date(alert.detectedAt).toLocaleString()}
      </p>
    </motion.div>
  );
}

export function HealthView() {
  const indicators = useCommandStore(selectHealthIndicators);
  const overallScore = useCommandStore((state) => state.overallHealthScore);
  const overallStatus = useCommandStore((state) => state.overallHealthStatus);
  const atRiskSpaces = useCommandStore((state) => state.atRiskSpaces);
  const trendAlerts = useCommandStore((state) => state.trendAlerts);
  const fetchHealth = useCommandStore((state) => state.fetchHealth);
  const loading = useCommandStore((state) => state.healthLoading);
  const error = useCommandStore((state) => state.healthError);

  useEffect(() => {
    fetchHealth();

    // Refresh health every 2 minutes
    const interval = setInterval(fetchHealth, 120000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading && indicators.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading health data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with overall score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ShieldCheckIcon className="h-6 w-6 text-[#FFD700]" />
          <div>
            <h2 className="text-xl font-bold text-white">Platform Health</h2>
            <p className="text-sm text-gray-400">
              Last checked: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <HealthGauge score={overallScore} status={overallStatus} />
      </div>

      {/* Alerts (if any) */}
      {trendAlerts.length > 0 && (
        <HiveCard className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
              Active Alerts ({trendAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </CardContent>
        </HiveCard>
      )}

      {/* Health indicators grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indicators.map((indicator) => (
          <IndicatorCard key={indicator.dimension} indicator={indicator} />
        ))}
      </div>

      {/* At-risk spaces */}
      {atRiskSpaces.length > 0 && (
        <HiveCard className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BuildingOffice2Icon className="h-5 w-5 text-amber-400" />
              Spaces Needing Attention ({atRiskSpaces.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {atRiskSpaces.map((item) => (
                <AtRiskCard key={item.id} item={item} />
              ))}
            </div>
          </CardContent>
        </HiveCard>
      )}

      {/* All clear message */}
      {overallStatus === "healthy" && trendAlerts.length === 0 && atRiskSpaces.length === 0 && (
        <HiveCard className="bg-green-500/5 border-green-500/20">
          <CardContent className="py-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-400">All Systems Healthy</h3>
            <p className="text-sm text-gray-400 mt-1">
              No issues detected. Platform is operating normally.
            </p>
          </CardContent>
        </HiveCard>
      )}
    </div>
  );
}
