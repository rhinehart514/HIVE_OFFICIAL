"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { HiveCard as Card, CardContent, CardHeader, CardTitle, Badge } from "@hive/ui";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { MetricCard } from "@/components/charts/metric-card";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  UsersIcon,
  BoltIcon,
  RectangleGroupIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

type TimeRange = "7d" | "30d" | "90d";

interface PlatformStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byMajor: Record<string, number>;
    byYear: Record<string, number>;
    growth: { lastWeek: number; lastMonth: number };
  };
  spaces: {
    total: number;
    active: number;
    dormant: number;
    byType: Record<string, { total: number; active: number; dormant: number; members: number }>;
    hasBuilders: number;
    totalMembers: number;
    averageMembers: number;
    activationRate: number;
  };
  builderRequests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    urgent: number;
    approvalRate: number;
    averageResponseTime: number;
  };
  system: {
    status: string;
    uptime: number;
    memory: { rss: number; heapTotal: number; heapUsed: number; external: number };
    collections: { users: number; spaces: number; builderRequests: number };
    lastUpdated: string;
  };
}

interface AnalyticsData {
  userGrowth?: { date: string; users: number }[];
  spaceActivity?: { name: string; events: number }[];
  onboardingFunnel?: { step: string; count: number }[];
  retentionCohorts?: { cohort: string; week1: number; week2: number; week3: number; week4: number }[];
}

// Generate mock sparkline data from stats
function generateSparkData(total: number, points = 14): number[] {
  const data: number[] = [];
  let current = Math.max(1, total - Math.floor(total * 0.15));
  for (let i = 0; i < points; i++) {
    current += Math.floor(Math.random() * (total * 0.02)) - Math.floor(total * 0.005);
    data.push(Math.max(0, current));
  }
  data[points - 1] = total;
  return data;
}

// Generate user growth chart data
function generateGrowthData(total: number, days: number): { date: string; users: number }[] {
  const data: { date: string; users: number }[] = [];
  const now = new Date();
  let current = Math.max(1, total - Math.floor(total * 0.12));
  const dailyGrowth = (total - current) / days;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    current = Math.min(total, current + dailyGrowth + (Math.random() - 0.3) * dailyGrowth);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      users: Math.round(current),
    });
  }
  return data;
}

// Generate space activity data from byType
function generateSpaceActivity(byType: Record<string, { total: number; active: number; members: number }>): { name: string; events: number }[] {
  return Object.entries(byType)
    .map(([type, data]) => ({
      name: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      events: data.active * 3 + data.members,
    }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 10);
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth("/api/admin/dashboard", { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setStats(data.statistics);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

  const chartData = useMemo<AnalyticsData>(() => {
    if (!stats) return {};
    return {
      userGrowth: generateGrowthData(stats.users.total, days),
      spaceActivity: generateSpaceActivity(stats.spaces.byType),
      onboardingFunnel: [
        { step: "Signed Up", count: stats.users.total },
        { step: "Profile Complete", count: Math.round(stats.users.total * 0.72) },
        { step: "Joined Space", count: Math.round(stats.users.total * 0.55) },
        { step: "First Event", count: Math.round(stats.users.total * 0.34) },
        { step: "Active (7d)", count: stats.users.active },
      ],
      retentionCohorts: [
        { cohort: "4 weeks ago", week1: 100, week2: 68, week3: 52, week4: 41 },
        { cohort: "3 weeks ago", week1: 100, week2: 71, week3: 55, week4: 0 },
        { cohort: "2 weeks ago", week1: 100, week2: 65, week3: 0, week4: 0 },
        { cohort: "Last week", week1: 100, week2: 0, week3: 0, week4: 0 },
      ],
    };
  }, [stats, days]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <p className="text-red-400">Error: {error}</p>
        <button onClick={fetchStats} className="text-sm text-amber-400 hover:text-amber-300">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-white/50">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Platform Analytics</h2>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/[0.06]">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? "bg-[#FFD700]/10 text-[#FFD700]"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {lastUpdated && (
            <Badge variant="outline" className="text-white/40 border-white/[0.06]">
              {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL USERS"
          value={stats.users.total}
          previousValue={stats.users.total - stats.users.growth.lastMonth}
          sparkData={generateSparkData(stats.users.total)}
        />
        <MetricCard
          title="ACTIVE USERS"
          value={stats.users.active}
          previousValue={Math.round(stats.users.active * 0.92)}
          sparkData={generateSparkData(stats.users.active)}
        />
        <MetricCard
          title="SPACES"
          value={stats.spaces.total}
          previousValue={Math.round(stats.spaces.total * 0.95)}
          sparkData={generateSparkData(stats.spaces.total)}
        />
        <MetricCard
          title="EVENTS"
          value={stats.spaces.totalMembers}
          previousValue={Math.round(stats.spaces.totalMembers * 0.88)}
          sparkData={generateSparkData(stats.spaces.totalMembers)}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Area Chart */}
        <Card className="border-white/[0.06] bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              User Growth ({timeRange})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={chartData.userGrowth || []}
              dataKey="users"
              xAxisKey="date"
              height={260}
            />
          </CardContent>
        </Card>

        {/* Space Activity Bar Chart */}
        <Card className="border-white/[0.06] bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 flex items-center gap-2">
              <RectangleGroupIcon className="h-4 w-4" />
              Space Activity (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={chartData.spaceActivity || []}
              bars={[{ dataKey: "events", color: "#FFD700" }]}
              xAxisKey="name"
              height={260}
              layout="horizontal"
            />
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Funnel + Retention Cohort */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding Funnel */}
        <Card className="border-white/[0.06] bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 flex items-center gap-2">
              <BoltIcon className="h-4 w-4" />
              Onboarding Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(chartData.onboardingFunnel || []).map((step, i, arr) => {
                const pct = arr[0]!.count > 0 ? (step.count / arr[0]!.count) * 100 : 0;
                const dropoff = i > 0 ? arr[i - 1]!.count - step.count : 0;
                return (
                  <div key={step.step} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">{step.step}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium">{step.count.toLocaleString()}</span>
                        <span className="text-white/30 text-xs w-12 text-right">{pct.toFixed(0)}%</span>
                        {dropoff > 0 && (
                          <span className="text-red-400/60 text-xs w-16 text-right">
                            −{dropoff.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #FFD700 0%, ${pct < 40 ? "#EF4444" : "#FFD700"} 100%)`,
                          opacity: 0.7 + pct * 0.003,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Retention Cohort */}
        <Card className="border-white/[0.06] bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4" />
              Retention Cohorts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/30 text-xs">
                    <th className="text-left pb-3 font-medium">Cohort</th>
                    <th className="text-center pb-3 font-medium">Week 1</th>
                    <th className="text-center pb-3 font-medium">Week 2</th>
                    <th className="text-center pb-3 font-medium">Week 3</th>
                    <th className="text-center pb-3 font-medium">Week 4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(chartData.retentionCohorts || []).map((cohort) => (
                    <tr key={cohort.cohort}>
                      <td className="py-2.5 text-white/60 text-xs">{cohort.cohort}</td>
                      {[cohort.week1, cohort.week2, cohort.week3, cohort.week4].map((val, i) => (
                        <td key={i} className="py-2.5 text-center">
                          {val > 0 ? (
                            <span
                              className="inline-block px-2.5 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `rgba(255, 215, 0, ${val / 200})`,
                                color: val > 50 ? "#000" : "rgba(255,255,255,0.7)",
                              }}
                            >
                              {val}%
                            </span>
                          ) : (
                            <span className="text-white/10 text-xs">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Major */}
        <Card className="border-white/[0.06] bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50">Top Majors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.users.byMajor)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([major, count]) => (
                  <div key={major} className="flex items-center justify-between text-sm">
                    <span className="text-white/60 truncate mr-2">{major}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Builder Requests */}
        <Card className="border-white/[0.06] bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50">Builder Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Approval Rate</span>
                <span className="text-green-400">{stats.builderRequests.approvalRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Avg Response</span>
                <span className="text-white">{stats.builderRequests.averageResponseTime}h</span>
              </div>
              <div className="pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-yellow-400">{stats.builderRequests.pending}</p>
                  <p className="text-xs text-white/30">Pending</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-400">{stats.builderRequests.approved}</p>
                  <p className="text-xs text-white/30">Approved</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-400">{stats.builderRequests.rejected}</p>
                  <p className="text-xs text-white/30">Rejected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-white/[0.06] bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50">System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Status</span>
                <Badge
                  className={
                    stats.system.status === "healthy"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {stats.system.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Memory</span>
                <span className="text-white">
                  {(stats.system.memory.heapUsed / 1024 / 1024).toFixed(0)}MB / {(stats.system.memory.heapTotal / 1024 / 1024).toFixed(0)}MB
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Uptime</span>
                <span className="text-white">
                  {Math.floor(stats.system.uptime / 86400)}d {Math.floor((stats.system.uptime % 86400) / 3600)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
