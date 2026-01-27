"use client";

/**
 * Pulse View
 *
 * Real-time platform heartbeat dashboard for Command Center.
 * Shows live metrics, activity feed, and growth indicators.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCommandStore,
  selectPulse,
  selectRecentActivity,
  selectIsConnected,
} from "@/lib/stores";
import { Badge, HiveCard, CardContent, CardHeader, CardTitle, Progress } from "@hive/ui";
import {
  UsersIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// Animated counter component
function AnimatedNumber({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

// Metric card with trend
function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color = "gold",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  color?: "gold" | "blue" | "green" | "red" | "purple";
}) {
  const colorClasses = {
    gold: "bg-[#FFD700]/10 text-[#FFD700]",
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
    red: "bg-red-500/10 text-red-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <HiveCard className="bg-[#111] border-white/10">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}
          >
            <Icon className="h-5 w-5" />
          </div>
          {trend && trendValue !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm ${
                trend === "up"
                  ? "text-green-400"
                  : trend === "down"
                  ? "text-red-400"
                  : "text-gray-400"
              }`}
            >
              {trend === "up" ? (
                <ArrowTrendingUpIcon className="h-4 w-4" />
              ) : trend === "down" ? (
                <ArrowTrendingDownIcon className="h-4 w-4" />
              ) : null}
              <span>{trendValue > 0 ? "+" : ""}{trendValue}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-3xl font-bold text-white">
            <AnimatedNumber value={value} />
          </div>
          <div className="text-sm text-gray-400 mt-1">{label}</div>
        </div>
      </CardContent>
    </HiveCard>
  );
}

// Queue badge
function QueueBadge({
  label,
  count,
  color = "red",
}: {
  label: string;
  count: number;
  color?: "red" | "amber" | "blue";
}) {
  const colorClasses = {
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
      <span className="text-sm text-gray-300">{label}</span>
      <Badge className={colorClasses[color]}>{count}</Badge>
    </div>
  );
}

// Activity item
function ActivityItem({
  type,
  entityName,
  timestamp,
}: {
  type: string;
  entityName: string;
  timestamp: string;
}) {
  const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    user_signup: { icon: UsersIcon, label: "New user", color: "text-green-400" },
    space_created: { icon: BuildingOffice2Icon, label: "Space created", color: "text-blue-400" },
    event_created: { icon: CalendarDaysIcon, label: "Event created", color: "text-purple-400" },
    post_created: { icon: DocumentTextIcon, label: "Post", color: "text-gray-400" },
    tool_deployed: { icon: SignalIcon, label: "Tool deployed", color: "text-[#FFD700]" },
  };

  const config = typeConfig[type] || { icon: ClockIcon, label: type, color: "text-gray-400" };
  const Icon = config.icon;

  const timeAgo = getTimeAgo(timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2"
    >
      <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{entityName}</div>
        <div className="text-xs text-gray-500">{config.label}</div>
      </div>
      <div className="text-xs text-gray-500">{timeAgo}</div>
    </motion.div>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function PulseView() {
  const pulse = useCommandStore(selectPulse);
  const recentActivity = useCommandStore(selectRecentActivity);
  const isConnected = useCommandStore(selectIsConnected);
  const fetchPulse = useCommandStore((state) => state.fetchPulse);
  const pulseLoading = useCommandStore((state) => state.pulseLoading);
  const connectSSE = useCommandStore((state) => state.connectSSE);

  // Fetch data and connect SSE on mount
  useEffect(() => {
    fetchPulse();
    connectSSE();

    // Refresh pulse every 30 seconds
    const interval = setInterval(fetchPulse, 30000);
    return () => clearInterval(interval);
  }, [fetchPulse, connectSSE]);

  if (pulseLoading && !pulse) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading pulse data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-gray-500">
          {isConnected ? "Live" : "Reconnecting..."}
        </span>
        {pulse?.updatedAt && (
          <span className="text-xs text-gray-600">
            Last update: {getTimeAgo(pulse.updatedAt)}
          </span>
        )}
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={UsersIcon}
          label="Active Users (24h)"
          value={pulse?.activeUsers || 0}
          trend={pulse?.weeklyGrowth.users ? (pulse.weeklyGrowth.users > 0 ? "up" : "down") : undefined}
          trendValue={pulse?.weeklyGrowth.users}
          color="gold"
        />
        <MetricCard
          icon={BuildingOffice2Icon}
          label="Active Spaces"
          value={pulse?.totalSpaces || 0}
          trend={pulse?.weeklyGrowth.spaces ? (pulse.weeklyGrowth.spaces > 0 ? "up" : "down") : undefined}
          trendValue={pulse?.weeklyGrowth.spaces}
          color="blue"
        />
        <MetricCard
          icon={CalendarDaysIcon}
          label="Events"
          value={pulse?.totalEvents || 0}
          color="purple"
        />
        <MetricCard
          icon={DocumentTextIcon}
          label="Posts Today"
          value={pulse?.postsToday || 0}
          color="green"
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Queue status */}
        <HiveCard className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
              Action Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QueueBadge
              label="Pending Reports"
              count={pulse?.reportsPending || 0}
              color={(pulse?.reportsPending || 0) > 5 ? "red" : "amber"}
            />
            <QueueBadge
              label="Tool Reviews"
              count={pulse?.toolsPending || 0}
              color="blue"
            />
            <QueueBadge
              label="Leader Claims"
              count={pulse?.claimsPending || 0}
              color="amber"
            />
            <QueueBadge
              label="Appeals"
              count={pulse?.appealsPending || 0}
              color={(pulse?.appealsPending || 0) > 0 ? "red" : "amber"}
            />
          </CardContent>
        </HiveCard>

        {/* Weekly growth */}
        <HiveCard className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />
              Weekly Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Users</span>
                <span className={`text-sm ${(pulse?.weeklyGrowth.users || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                  {(pulse?.weeklyGrowth.users || 0) > 0 ? "+" : ""}{pulse?.weeklyGrowth.users || 0}%
                </span>
              </div>
              <Progress value={Math.min(100, Math.abs(pulse?.weeklyGrowth.users || 0) * 2)} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Spaces</span>
                <span className={`text-sm ${(pulse?.weeklyGrowth.spaces || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                  {(pulse?.weeklyGrowth.spaces || 0) > 0 ? "+" : ""}{pulse?.weeklyGrowth.spaces || 0}%
                </span>
              </div>
              <Progress value={Math.min(100, Math.abs(pulse?.weeklyGrowth.spaces || 0) * 2)} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Engagement</span>
                <span className={`text-sm ${(pulse?.weeklyGrowth.engagement || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                  {(pulse?.weeklyGrowth.engagement || 0) > 0 ? "+" : ""}{pulse?.weeklyGrowth.engagement || 0}%
                </span>
              </div>
              <Progress value={Math.min(100, Math.abs(pulse?.weeklyGrowth.engagement || 0) * 2)} className="h-2" />
            </div>
          </CardContent>
        </HiveCard>

        {/* Activity feed */}
        <HiveCard className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <SignalIcon className="h-5 w-5 text-[#FFD700]" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <AnimatePresence>
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 8).map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      type={activity.type}
                      entityName={activity.entityName}
                      timestamp={activity.timestamp}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No recent activity
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </HiveCard>
      </div>

      {/* Risk indicator */}
      {(pulse?.spacesAtRisk || 0) > 0 && (
        <HiveCard className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
              <span className="text-amber-400">
                {pulse?.spacesAtRisk} spaces need attention (no activity in 14+ days)
              </span>
            </div>
          </CardContent>
        </HiveCard>
      )}
    </div>
  );
}
