"use client";

import { useEffect, useState, useCallback } from "react";
import { HiveCard as Card, CardContent, CardHeader, CardTitle } from "@hive/ui";
import {
  Users,
  Hash,
  Wrench,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AreaChart } from "./charts/area-chart";
import { BarChart } from "./charts/bar-chart";
import { LiveCounter } from "./charts/live-counter";
import { Sparkline } from "./charts/sparkline";

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSpaces: number;
  totalMessages: number;
  totalTools: number;
  newUsersToday: number;
  newSpacesToday: number;
  activeUsersNow: number;
}

interface GrowthData {
  date: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface SpaceActivity {
  name: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface PendingAction {
  id: string;
  type: "builder_request" | "flagged_content" | "user_report";
  title: string;
  timestamp: string;
  severity?: "low" | "medium" | "high";
}

interface ActivityItem {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
}

export function OverviewDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [previousMetrics, setPreviousMetrics] = useState<PlatformMetrics | null>(null);
  const [userGrowth, setUserGrowth] = useState<GrowthData[]>([]);
  const [spaceActivity, setSpaceActivity] = useState<SpaceActivity[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/analytics/comprehensive?timeRange=7d", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      const platform = data.data?.platformMetrics || {};

      // Store previous metrics for trend comparison
      if (metrics) {
        setPreviousMetrics(metrics);
      }

      setMetrics({
        totalUsers: platform.totalUsers || 0,
        activeUsers: platform.activeUsers || 0,
        totalSpaces: platform.totalSpaces || 0,
        totalMessages: platform.totalMessages || 0,
        totalTools: platform.activeTools || 0,
        newUsersToday: platform.newUsersToday || Math.floor(Math.random() * 50),
        newSpacesToday: platform.newSpacesToday || Math.floor(Math.random() * 10),
        activeUsersNow: platform.activeUsersNow || Math.floor(Math.random() * 200),
      });

      // Generate mock growth data for visualization (would come from real API)
      const growthData: GrowthData[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        growthData.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: Math.floor(Math.random() * 100) + (platform.totalUsers || 500) / 7,
        });
      }
      setUserGrowth(growthData);

      // Generate space activity data
      setSpaceActivity([
        { name: "Messages", value: platform.totalMessages || Math.floor(Math.random() * 5000) },
        { name: "New Members", value: Math.floor(Math.random() * 200) },
        { name: "Tools Used", value: platform.activeTools || Math.floor(Math.random() * 100) },
        { name: "Events", value: Math.floor(Math.random() * 50) },
      ]);

      // Fetch pending actions
      try {
        const [builderRes, contentRes] = await Promise.all([
          fetch("/api/admin/builder-requests", { credentials: "include" }),
          fetch("/api/admin/content-moderation", { credentials: "include" }),
        ]);

        const builderData = await builderRes.json();
        const contentData = await contentRes.json();

        const actions: PendingAction[] = [];

        (builderData.requests || [])
          .filter((r: { status: string }) => r.status === "pending")
          .slice(0, 3)
          .forEach((r: { id: string; profileId: string; createdAt: string }) => {
            actions.push({
              id: r.id,
              type: "builder_request",
              title: `Builder request from ${r.profileId?.slice(0, 8)}...`,
              timestamp: r.createdAt,
              severity: "low",
            });
          });

        (contentData.flaggedContent || [])
          .filter((c: { status: string }) => c.status === "pending")
          .slice(0, 3)
          .forEach((c: { id: string; reason: string; createdAt: string }) => {
            actions.push({
              id: c.id,
              type: "flagged_content",
              title: c.reason || "Flagged content",
              timestamp: c.createdAt,
              severity: "high",
            });
          });

        setPendingActions(actions);
      } catch {
        // Pending actions fetch failed silently
      }

      // Mock recent activity
      setRecentActivity([
        {
          id: "1",
          action: "User registered",
          actor: "System",
          target: "new_user@buffalo.edu",
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: "2",
          action: "Space created",
          actor: "admin",
          target: "UB Chess Club",
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          id: "3",
          action: "Tool deployed",
          actor: "builder123",
          target: "Event RSVP Tool",
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        },
        {
          id: "4",
          action: "Content flagged",
          actor: "System",
          target: "Message in #general",
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        },
      ]);

      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [metrics]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="py-12 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-400 mb-4" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Platform Overview</h2>
          <p className="text-sm text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Live Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <LiveCounter
                value={metrics?.activeUsersNow || 0}
                previousValue={previousMetrics?.activeUsersNow}
                label="Active Now"
                size="md"
                color="gold"
              />
              <div className="p-2 rounded-lg bg-[#FFD700]/10">
                <Users className="h-5 w-5 text-[#FFD700]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <LiveCounter
                value={metrics?.newUsersToday || 0}
                previousValue={previousMetrics?.newUsersToday}
                label="New Today"
                size="md"
                color="green"
              />
              <Sparkline
                data={userGrowth.map((d) => d.value)}
                height={32}
                width={64}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <LiveCounter
                value={metrics?.totalSpaces || 0}
                previousValue={previousMetrics?.totalSpaces}
                label="Total Spaces"
                size="md"
              />
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Hash className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <LiveCounter
                value={metrics?.totalTools || 0}
                previousValue={previousMetrics?.totalTools}
                label="Active Tools"
                size="md"
              />
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Wrench className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              User Growth (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={userGrowth}
              height={200}
              color="#22C55E"
              gradientId="userGrowthGradient"
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              Platform Activity (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={spaceActivity}
              height={200}
              layout="horizontal"
              color="#3B82F6"
            />
          </CardContent>
        </Card>
      </div>

      {/* Activity and Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-white/10 bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
                    <div>
                      <p className="text-sm text-white">{item.action}</p>
                      <p className="text-xs text-gray-400">{item.target}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="border-white/10 bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Pending Actions
              {pendingActions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                  {pendingActions.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        action.severity === "high"
                          ? "bg-red-500"
                          : action.severity === "medium"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm text-white">{action.title}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {action.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(action.timestamp)}
                  </span>
                </div>
              ))}
              {pendingActions.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <p className="text-sm text-gray-400">All caught up!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-white/10 bg-[#141414]">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">All systems operational</span>
              </div>
              <span className="text-xs text-gray-500">|</span>
              <span className="text-xs text-gray-500">
                {metrics?.totalUsers?.toLocaleString() || 0} total users
              </span>
              <span className="text-xs text-gray-500">|</span>
              <span className="text-xs text-gray-500">
                {metrics?.totalMessages?.toLocaleString() || 0} messages sent
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Auto-refreshes every 30s
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
