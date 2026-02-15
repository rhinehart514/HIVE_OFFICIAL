"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { AdminSidebar } from "@/components/admin-sidebar";
import {
  UsersIcon,
  UserGroupIcon,
  RectangleGroupIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface MetricCard {
  label: string;
  value: number;
  change?: number;
  sparkline?: number[];
  icon: typeof UsersIcon;
}

interface GrowthPoint {
  date: string;
  users: number;
  cumulative?: number;
}

interface SpaceActivity {
  name: string;
  activity: number;
}

interface RetentionRow {
  cohort: string;
  size: number;
  weeks: number[];
}

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { admin, loading: authLoading, isAuthenticated } = useAdminAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [spaceActivity, setSpaceActivity] = useState<SpaceActivity[]>([]);
  const [retention, setRetention] = useState<RetentionRow[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, growthRes, retentionRes, funnelRes] = await Promise.all([
        fetchWithAuth(`/api/admin/analytics/comprehensive?range=${timeRange}`),
        fetchWithAuth(`/api/admin/analytics/growth?range=${timeRange}`),
        fetchWithAuth(`/api/admin/analytics/retention?range=${timeRange}`),
        fetchWithAuth("/api/admin/analytics/onboarding-funnel"),
      ]);

      if (compRes.ok) {
        const data = await compRes.json();
        const d = data.data || data;
        setMetrics([
          {
            label: "Total Users",
            value: d.totalUsers || d.users?.total || 0,
            change: d.userGrowth || d.users?.growth,
            sparkline: d.users?.sparkline,
            icon: UsersIcon,
          },
          {
            label: "Active Users",
            value: d.activeUsers || d.users?.active || 0,
            change: d.activeGrowth || d.users?.activeGrowth,
            sparkline: d.users?.activeSparkline,
            icon: UserGroupIcon,
          },
          {
            label: "Total Spaces",
            value: d.totalSpaces || d.spaces?.total || 0,
            change: d.spaceGrowth || d.spaces?.growth,
            sparkline: d.spaces?.sparkline,
            icon: RectangleGroupIcon,
          },
          {
            label: "Total Events",
            value: d.totalEvents || d.events?.total || 0,
            change: d.eventGrowth || d.events?.growth,
            sparkline: d.events?.sparkline,
            icon: CalendarDaysIcon,
          },
        ]);

        if (d.spaceActivity || d.spaces?.topByActivity) {
          setSpaceActivity(
            (d.spaceActivity || d.spaces?.topByActivity || []).slice(0, 10)
          );
        }
      }

      if (growthRes.ok) {
        const data = await growthRes.json();
        setGrowth(data.data || data.growth || data.points || []);
      }

      if (retentionRes.ok) {
        const data = await retentionRes.json();
        setRetention(data.data || data.cohorts || data.retention || []);
      }

      if (funnelRes.ok) {
        const data = await funnelRes.json();
        const steps = data.data || data.steps || data.funnel || [];
        if (steps.length === 0) {
          // Build default funnel structure
          setFunnel([
            { name: "Started", count: 0, percentage: 100 },
            { name: "Email", count: 0, percentage: 0 },
            { name: "Verified", count: 0, percentage: 0 },
            { name: "Profile", count: 0, percentage: 0 },
            { name: "Interests", count: 0, percentage: 0 },
            { name: "Completed", count: 0, percentage: 0 },
          ]);
        } else {
          setFunnel(steps);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (admin) fetchAnalytics();
  }, [admin, fetchAnalytics]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }

  if (!admin) return null;

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const MiniSparkline = ({ data }: { data?: number[] }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const h = 24;
    const w = 60;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
    return (
      <svg width={w} height={h} className="text-[#FFD700]">
        <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
      </svg>
    );
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between h-14 px-6 border-b border-white/[0.06] bg-[#0A0A0A] sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-white">Analytics</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeRange === range
                      ? "bg-[#FFD700]/10 text-[#FFD700]"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {range === "all" ? "All" : range}
                </button>
              ))}
            </div>
            <button
              onClick={fetchAnalytics}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {loading && metrics.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
            </div>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-9 w-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-[#FFD700]" />
                        </div>
                        <MiniSparkline data={m.sparkline} />
                      </div>
                      <p className="text-2xl font-bold text-white">{formatNumber(m.value)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-white/40">{m.label}</span>
                        {m.change !== undefined && m.change !== null && (
                          <span className={`flex items-center gap-0.5 text-xs font-medium ${
                            m.change >= 0 ? "text-green-400" : "text-red-400"
                          }`}>
                            {m.change >= 0 ? (
                              <ArrowTrendingUpIcon className="h-3 w-3" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-3 w-3" />
                            )}
                            {Math.abs(m.change).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">User Growth</h3>
                  {growth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={growth}>
                        <defs>
                          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                          tickFormatter={(v) => {
                            const d = new Date(v);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} stroke="rgba(255,255,255,0.05)" />
                        <Tooltip
                          contentStyle={{
                            background: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stroke="#FFD700"
                          fill="url(#goldGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-white/20 text-sm">
                      No growth data available
                    </div>
                  )}
                </div>

                {/* Space Activity */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Top Spaces by Activity</h3>
                  {spaceActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={spaceActivity} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} stroke="rgba(255,255,255,0.05)" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                          width={100}
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            color: "#fff",
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="activity" fill="#FFD700" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-white/20 text-sm">
                      No space activity data
                    </div>
                  )}
                </div>
              </div>

              {/* Retention Cohort Table */}
              {retention.length > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 overflow-x-auto">
                  <h3 className="text-sm font-semibold text-white mb-4">Retention Cohorts</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-white/40 font-medium py-2 px-3">Cohort</th>
                        <th className="text-right text-white/40 font-medium py-2 px-3">Size</th>
                        {retention[0]?.weeks?.map((_, i) => (
                          <th key={i} className="text-center text-white/40 font-medium py-2 px-3">
                            W{i + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {retention.map((row) => (
                        <tr key={row.cohort} className="border-b border-white/[0.04]">
                          <td className="text-white/70 py-2 px-3">{row.cohort}</td>
                          <td className="text-white/50 py-2 px-3 text-right">{row.size}</td>
                          {row.weeks?.map((pct, i) => {
                            const intensity = Math.min(pct / 100, 1);
                            return (
                              <td
                                key={i}
                                className="text-center py-2 px-3 text-xs font-medium"
                                style={{
                                  backgroundColor: `rgba(255, 215, 0, ${intensity * 0.3})`,
                                  color: pct > 50 ? "#FFD700" : "rgba(255,255,255,0.5)",
                                }}
                              >
                                {pct}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Onboarding Funnel */}
              {funnel.length > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-semibold text-white mb-6">Onboarding Funnel</h3>
                  <div className="flex items-end gap-2">
                    {funnel.map((step, i) => {
                      const widthPct = Math.max(step.percentage || 0, 8);
                      const dropOff = i > 0 ? (funnel[i - 1]?.percentage || 0) - (step.percentage || 0) : 0;
                      return (
                        <div key={step.name} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-xs text-white/40">{step.percentage?.toFixed(0) || 0}%</span>
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-[#FFD700]/60 to-[#FFD700]/20 transition-all"
                            style={{ height: `${Math.max(widthPct * 2, 16)}px` }}
                          />
                          <span className="text-xs text-white/60 text-center leading-tight">{step.name}</span>
                          <span className="text-xs text-white/30">{formatNumber(step.count)}</span>
                          {dropOff > 0 && (
                            <span className="text-xs text-red-400/60">-{dropOff.toFixed(0)}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
