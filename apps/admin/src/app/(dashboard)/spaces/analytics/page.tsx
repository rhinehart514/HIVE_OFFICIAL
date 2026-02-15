"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { Button, Badge, HiveCard as Card, CardContent, CardHeader, CardTitle } from "@hive/ui";
import {
  ArrowPathIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

// Aliases
const RefreshCw = ArrowPathIcon;
const BarChart = ChartBarIcon;
const TrendingUp = ArrowTrendingUpIcon;
const Users = UsersIcon;
const MessageSquare = ChatBubbleLeftIcon;
const Calendar = CalendarIcon;
const AlertTriangle = ExclamationTriangleIcon;
const Rocket = RocketLaunchIcon;

interface AnalyticsData {
  creationTrend: Array<{
    date: string;
    count: number;
  }>;
  activationFunnel: {
    ghost: number;
    gathering: number;
    open: number;
    conversionRate: number;
  };
  engagement: {
    totalMessages: number;
    messagesPerWeek: number;
    totalEvents: number;
    eventsPerWeek: number;
  };
  topSpaces: Array<{
    id: string;
    name: string;
    memberCount: number;
    engagementScore: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  campusComparison?: Array<{
    campusId: string;
    campusName: string;
    totalSpaces: number;
    activeSpaces: number;
    avgHealth: number;
  }>;
}

export default function SpaceAnalyticsPage() {
  const { admin } = useAdminAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = useCallback(async () => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/admin/spaces/analytics?range=${timeRange}`, {
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [admin, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Error Loading Analytics</h3>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const data = analytics!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart className="h-6 w-6 text-amber-400" />
          <h2 className="text-xl font-semibold text-white">Space Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <Button
            onClick={fetchAnalytics}
            disabled={loading}
            variant="outline"
            className="border-white/[0.12] text-white/70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-white/[0.08] bg-[#141414]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Messages/Week</p>
                <p className="text-2xl font-bold text-white">
                  {data.engagement.messagesPerWeek.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#141414]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Events/Week</p>
                <p className="text-2xl font-bold text-white">
                  {data.engagement.eventsPerWeek}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#141414]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-400">
                  {data.activationFunnel.conversionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#141414]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Rocket className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Open Spaces</p>
                <p className="text-2xl font-bold text-amber-400">
                  {data.activationFunnel.open}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activation Funnel */}
      <Card className="border-white/[0.08] bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-white">Activation Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-48">
            {/* Ghost */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-white/[0.08] rounded-t-lg transition-all"
                style={{ height: `${Math.max(20, (data.activationFunnel.ghost / (data.activationFunnel.ghost + data.activationFunnel.gathering + data.activationFunnel.open)) * 100)}%` }}
              />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{data.activationFunnel.ghost}</p>
                <p className="text-sm text-white/50">Ghost</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="pb-12 text-white/30">→</div>

            {/* Gathering */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-blue-500/30 rounded-t-lg transition-all"
                style={{ height: `${Math.max(20, (data.activationFunnel.gathering / (data.activationFunnel.ghost + data.activationFunnel.gathering + data.activationFunnel.open)) * 100)}%` }}
              />
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{data.activationFunnel.gathering}</p>
                <p className="text-sm text-white/50">Gathering</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="pb-12 text-white/30">→</div>

            {/* Open */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-green-500/30 rounded-t-lg transition-all"
                style={{ height: `${Math.max(20, (data.activationFunnel.open / (data.activationFunnel.ghost + data.activationFunnel.gathering + data.activationFunnel.open)) * 100)}%` }}
              />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{data.activationFunnel.open}</p>
                <p className="text-sm text-white/50">Open</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown & Top Spaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="border-white/[0.08] bg-[#141414]">
          <CardHeader>
            <CardTitle className="text-white">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.categoryBreakdown.map(cat => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{cat.category}</span>
                    <span className="text-white/50 text-sm">{cat.count} ({cat.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Spaces */}
        <Card className="border-white/[0.08] bg-[#141414]">
          <CardHeader>
            <CardTitle className="text-white">Top Performing Spaces</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topSpaces.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No data available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topSpaces.map((space, index) => (
                  <div
                    key={space.id}
                    className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">{space.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/[0.08] text-white/70">
                        {space.memberCount} members
                      </Badge>
                      <span className="text-green-400 text-sm font-medium">
                        {space.engagementScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campus Comparison (HIVE team only) */}
      {!admin?.campusId && data.campusComparison && data.campusComparison.length > 0 && (
        <Card className="border-white/[0.08] bg-[#141414]">
          <CardHeader>
            <CardTitle className="text-white">Campus Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left p-3 text-white/50">Campus</th>
                    <th className="text-left p-3 text-white/50">Total Spaces</th>
                    <th className="text-left p-3 text-white/50">Active</th>
                    <th className="text-left p-3 text-white/50">Avg Health</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campusComparison.map(campus => (
                    <tr key={campus.campusId} className="border-b border-white/[0.06]">
                      <td className="p-3 text-white font-medium">{campus.campusName}</td>
                      <td className="p-3 text-white">{campus.totalSpaces}</td>
                      <td className="p-3 text-green-400">{campus.activeSpaces}</td>
                      <td className="p-3">
                        <span className={campus.avgHealth >= 70 ? 'text-green-400' : campus.avgHealth >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                          {Math.round(campus.avgHealth)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
