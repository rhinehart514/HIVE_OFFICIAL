"use client";

import { fetchWithAuth } from "@/hooks/use-admin-api";

/**
 * Momentum View
 *
 * Growth timeline visualization for Command Center.
 * Shows historical trends and growth metrics with recharts.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HiveCard, CardContent, CardHeader, CardTitle, Badge, Button } from "@hive/ui";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FlagIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DailyDataPoint {
  date: string;
  activeUsers: number;
  newUsers: number;
  postsCreated: number;
  eventsCreated: number;
  spacesCreated: number;
  toolsDeployed: number;
  engagementScore: number;
}

interface GrowthMetric {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

interface Milestone {
  id: string;
  type: string;
  title: string;
  value: number;
  date: string;
}

type TimeRange = "7d" | "14d" | "30d" | "90d";

function GrowthCard({ metric }: { metric: GrowthMetric }) {
  const trendColor =
    metric.trend === "up"
      ? "text-green-400"
      : metric.trend === "down"
      ? "text-red-400"
      : "text-white/50";

  return (
    <HiveCard className="bg-[#111] border-white/10">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/50">{metric.metric}</span>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            {metric.trend === "up" ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : metric.trend === "down" ? (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            ) : null}
            <span>{metric.changePercent > 0 ? "+" : ""}{metric.changePercent}%</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-white">
          {metric.current.toLocaleString()}
        </div>
        <div className="text-xs text-white/40 mt-1">
          vs {metric.previous.toLocaleString()} last period
        </div>
      </CardContent>
    </HiveCard>
  );
}

function MilestoneItem({ milestone }: { milestone: Milestone }) {
  const typeColors: Record<string, string> = {
    users: "bg-green-500/20 text-green-400 border-green-500/30",
    spaces: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    events: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    tools: "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30",
    launch: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-2"
    >
      <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
      <div className="flex-1">
        <div className="text-sm text-white">{milestone.title}</div>
        <div className="text-xs text-white/40">
          {new Date(milestone.date).toLocaleDateString()}
        </div>
      </div>
      <Badge className={typeColors[milestone.type] || "bg-white/[0.20]/20"}>
        {milestone.value.toLocaleString()}
      </Badge>
    </motion.div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-[#111] border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-sm text-white/50 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-white font-medium">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function MomentumView() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [timeline, setTimeline] = useState<DailyDataPoint[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetric[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"users" | "posts" | "engagement">("users");

  useEffect(() => {
    async function fetchMomentum() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithAuth(`/api/admin/command/momentum?range=${range}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setTimeline(result.data.timeline);
          setGrowthMetrics(result.data.growthMetrics);
          setMilestones(result.data.milestones);
        } else {
          throw new Error(result.error?.message || "Failed to fetch momentum");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMomentum();
  }, [range]);

  // Prepare chart data based on selected metric
  const chartData = timeline.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value:
      selectedMetric === "users"
        ? d.activeUsers
        : selectedMetric === "posts"
        ? d.postsCreated
        : d.engagementScore,
    secondary:
      selectedMetric === "users"
        ? d.newUsers
        : selectedMetric === "posts"
        ? d.eventsCreated
        : 0,
  }));

  const chartLabels = {
    users: { primary: "Active Users", secondary: "New Users" },
    posts: { primary: "Posts", secondary: "Events" },
    engagement: { primary: "Engagement Score", secondary: "" },
  };

  if (loading && timeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/50">Loading momentum data...</div>
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
      {/* Time range selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-[#FFD700]" />
          <span className="text-lg font-semibold text-white">Growth Timeline</span>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "14d", "30d", "90d"] as TimeRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
              className={range === r ? "bg-[#FFD700] text-black" : ""}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Growth metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {growthMetrics.map((metric) => (
          <GrowthCard key={metric.metric} metric={metric} />
        ))}
      </div>

      {/* Main chart */}
      <HiveCard className="bg-[#111] border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Trend Analysis</CardTitle>
            <div className="flex items-center gap-2">
              {(["users", "posts", "engagement"] as const).map((m) => (
                <Button
                  key={m}
                  variant={selectedMetric === m ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedMetric(m)}
                  className={selectedMetric === m ? "bg-[#FFD700] text-black" : "text-white/50"}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tick={{ fill: "#888", fontSize: 12 }}
                />
                <YAxis stroke="#666" tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={chartLabels[selectedMetric].primary}
                  stroke="#FFD700"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
                {chartLabels[selectedMetric].secondary && (
                  <Area
                    type="monotone"
                    dataKey="secondary"
                    name={chartLabels[selectedMetric].secondary}
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#colorSecondary)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </HiveCard>

      {/* Milestones */}
      {milestones.length > 0 && (
        <HiveCard className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FlagIcon className="h-5 w-5 text-[#FFD700]" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {milestones.map((milestone) => (
                <MilestoneItem key={milestone.id} milestone={milestone} />
              ))}
            </div>
          </CardContent>
        </HiveCard>
      )}
    </div>
  );
}
