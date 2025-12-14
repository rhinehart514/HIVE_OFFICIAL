"use client";

/**
 * Space Analytics Page - Leader Dashboard
 *
 * Shows space leaders key metrics about their community:
 * - Member growth
 * - Message/post activity
 * - Event participation
 * - Engagement trends
 * - Top contributors
 * - Peak activity times
 *
 * Leader-only access enforced via API
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ChevronLeft,
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Clock,
  Crown,
  Lightbulb,
  Download,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Heart,
  MessageCircle,
  Flame,
} from "lucide-react";
import { Button, Card, cn, toast } from "@hive/ui";
import { springPresets, easingArrays } from "@hive/tokens";
import { secureApiFetch } from "@/lib/secure-auth-utils";

// =============================================================================
// TYPES
// =============================================================================

interface SpaceAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  spaceId: string;
  members?: {
    total: number;
    newInPeriod: number;
    growth: Array<{ date: string; value: number }>;
    roleDistribution: Record<string, number>;
  };
  posts?: {
    total: number;
    totalLikes: number;
    totalComments: number;
    activity: Array<{ date: string; value: number }>;
    typeDistribution: Record<string, number>;
    averageEngagement: number;
  };
  events?: {
    total: number;
    totalRSVPs: number;
    upcoming: number;
    activity: Array<{ date: string; value: number }>;
    typeDistribution: Record<string, number>;
  };
  engagement?: {
    totalActions: number;
    uniqueActiveUsers: number;
    actionBreakdown: Record<string, number>;
    engagementRate: number;
    peakActivityTimes?: {
      hour: { hour: number; count: number } | null;
      day: { day: string; dayIndex: number; count: number } | null;
      hourlyBreakdown: Record<number, number>;
      dailyBreakdown: Record<number, number>;
    };
  };
  topContributors?: Array<{
    userId: string;
    activityCount: number;
    fullName: string;
    handle?: string;
    photoURL?: string;
  }>;
  topContent?: Array<{
    id: string;
    content: string;
    authorId: string;
    authorName?: string;
    likes: number;
    comments: number;
    engagement: number;
    createdAt: string;
    type: string;
  }>;
  summary?: {
    healthScore: number;
    topInsights: string[];
  };
}

type TimePeriod = "7d" | "30d" | "90d";

// =============================================================================
// MOTION VARIANTS
// =============================================================================

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easingArrays.silk,
      staggerChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springPresets.snappy,
  },
};

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  format?: "number" | "percentage" | "decimal";
  colorClass?: string;
}

function MetricCard({ title, value, previousValue, icon, format = "number", colorClass = "text-[#FFD700]" }: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case "percentage":
        return `${val}%`;
      case "decimal":
        return val.toFixed(1);
      default:
        return val.toLocaleString();
    }
  };

  const change = previousValue !== undefined && previousValue > 0
    ? Math.round(((value - previousValue) / previousValue) * 100)
    : undefined;

  return (
    <motion.div variants={cardVariants}>
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06] hover:bg-neutral-900/80 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10", colorClass)}>
            {icon}
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              change >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change >= 0 ? "+" : ""}{change}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white mb-1">
          {formatValue(value)}
        </div>
        <div className="text-sm text-neutral-400">{title}</div>
      </Card>
    </motion.div>
  );
}

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  title: string;
  emptyMessage?: string;
}

function SimpleBarChart({ data, title, emptyMessage = "No data yet" }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="py-8 text-center text-neutral-500 text-sm">{emptyMessage}</div>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 7).map((item, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 truncate max-w-[60%]">{item.label}</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFD700]/70 h-1.5 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

interface HealthScoreProps {
  score: number;
}

function HealthScore({ score }: HealthScoreProps) {
  const getScoreColor = () => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = () => {
    if (score >= 70) return "Thriving";
    if (score >= 40) return "Growing";
    return "Needs attention";
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-neutral-800"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="35"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className={getScoreColor()}
            initial={{ strokeDasharray: "0 220" }}
            animate={{ strokeDasharray: `${score * 2.2} 220` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-xl font-bold", getScoreColor())}>{score}</span>
        </div>
      </div>
      <div>
        <div className={cn("text-lg font-semibold", getScoreColor())}>{getScoreLabel()}</div>
        <div className="text-xs text-neutral-500">Community health score</div>
      </div>
    </div>
  );
}

interface TopContributorsProps {
  contributors: SpaceAnalytics['topContributors'];
}

function TopContributors({ contributors }: TopContributorsProps) {
  if (!contributors || contributors.length === 0) {
    return (
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="h-5 w-5 text-[#FFD700]" />
          <h3 className="text-sm font-semibold text-white">Top Contributors</h3>
        </div>
        <p className="text-sm text-neutral-500 text-center py-4">No activity data yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
          <Crown className="h-4 w-4 text-[#FFD700]" />
        </div>
        <h3 className="text-sm font-semibold text-white">Top Contributors</h3>
      </div>
      <div className="space-y-3">
        {contributors.slice(0, 5).map((contributor, index) => (
          <motion.div
            key={contributor.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3"
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
              index === 0 ? "bg-[#FFD700] text-black" :
              index === 1 ? "bg-neutral-300 text-black" :
              index === 2 ? "bg-orange-600 text-white" :
              "bg-neutral-700 text-neutral-300"
            )}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {contributor.photoURL ? (
                  <img
                    src={contributor.photoURL}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-400">
                    {contributor.fullName.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-white truncate">{contributor.fullName}</span>
                {contributor.handle && (
                  <span className="text-xs text-neutral-500">@{contributor.handle}</span>
                )}
              </div>
            </div>
            <div className="text-sm font-medium text-neutral-400">
              {contributor.activityCount} actions
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

interface PeakActivityProps {
  peakTimes: NonNullable<SpaceAnalytics['engagement']>['peakActivityTimes'];
}

function PeakActivityCard({ peakTimes }: PeakActivityProps) {
  if (!peakTimes) {
    return (
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Peak Activity Times</h3>
        </div>
        <p className="text-sm text-neutral-500 text-center py-4">Not enough data yet</p>
      </Card>
    );
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  // Create hour distribution chart data
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: peakTimes.hourlyBreakdown?.[i] || 0,
  }));
  const maxHourly = Math.max(...hourlyData.map(h => h.count), 1);

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center">
          <Clock className="h-4 w-4 text-cyan-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Peak Activity Times</h3>
      </div>

      {/* Peak summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {peakTimes.day && (
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="text-xs text-neutral-400 mb-1">Best Day</div>
            <div className="text-lg font-bold text-white">{peakTimes.day.day}</div>
            <div className="text-xs text-neutral-500">{peakTimes.day.count} actions</div>
          </div>
        )}
        {peakTimes.hour && (
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="text-xs text-neutral-400 mb-1">Best Time</div>
            <div className="text-lg font-bold text-white">{formatHour(peakTimes.hour.hour)}</div>
            <div className="text-xs text-neutral-500">{peakTimes.hour.count} actions</div>
          </div>
        )}
      </div>

      {/* Hourly mini chart */}
      <div className="mt-4">
        <div className="text-xs text-neutral-400 mb-2">Activity by Hour</div>
        <div className="flex items-end gap-0.5 h-12">
          {hourlyData.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-cyan-400/40 rounded-t-sm transition-all hover:bg-cyan-400"
              style={{ height: `${Math.max((h.count / maxHourly) * 100, 4)}%` }}
              title={`${formatHour(h.hour)}: ${h.count} actions`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>12a</span>
          <span>6a</span>
          <span>12p</span>
          <span>6p</span>
          <span>12a</span>
        </div>
      </div>
    </Card>
  );
}

interface InsightCardProps {
  insights: string[];
}

function InsightCard({ insights }: InsightCardProps) {
  if (insights.length === 0) {
    return (
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3">
          <Lightbulb className="h-5 w-5 text-[#FFD700]" />
          <h3 className="text-sm font-semibold text-white">Insights</h3>
        </div>
        <p className="text-sm text-neutral-500">Keep growing your space to unlock insights!</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-[#FFD700]" />
        </div>
        <h3 className="text-sm font-semibold text-white">Insights & Recommendations</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <div className="w-5 h-5 rounded-full bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-[#FFD700]">{index + 1}</span>
            </div>
            <p className="text-sm text-neutral-300">{insight}</p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

interface TopContentProps {
  content: SpaceAnalytics['topContent'];
}

function TopContentCard({ content }: TopContentProps) {
  if (!content || content.length === 0) {
    return (
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="h-5 w-5 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Top Content</h3>
        </div>
        <p className="text-sm text-neutral-500 text-center py-4">No engaging content yet this period</p>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-orange-400/20 flex items-center justify-center">
          <Flame className="h-4 w-4 text-orange-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Most Engaged Content</h3>
      </div>
      <div className="space-y-3">
        {content.slice(0, 5).map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                index === 0 ? "bg-orange-400 text-black" :
                index === 1 ? "bg-orange-400/70 text-black" :
                "bg-neutral-700 text-neutral-300"
              )}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white line-clamp-2 mb-2">{post.content || '(No text content)'}</p>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-400" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-blue-400" />
                    {post.comments}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                  {post.authorName && (
                    <span className="text-neutral-500">by {post.authorName}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SpaceAnalyticsPage() {
  const params = useParams<{ spaceId: string }>();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const spaceId = params?.spaceId;

  const [analytics, setAnalytics] = React.useState<SpaceAnalytics | null>(null);
  const [spaceName, setSpaceName] = React.useState<string>("");
  const [period, setPeriod] = React.useState<TimePeriod>("30d");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = React.useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch space info for name
      const spaceRes = await secureApiFetch(`/api/spaces/${spaceId}`);
      if (spaceRes.ok) {
        const spaceData = await spaceRes.json();
        setSpaceName(spaceData.space?.name || spaceData.data?.space?.name || "Space");
      }

      // Fetch analytics
      const res = await secureApiFetch(`/api/spaces/${spaceId}/analytics?period=${period}`);

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Access denied", "Only leaders can view analytics.");
          router.push(`/spaces/${spaceId}`);
          return;
        }
        throw new Error("Failed to fetch analytics");
      }

      const data = await res.json();
      setAnalytics(data.data || data);
    } catch (e) {
      console.error("Analytics fetch error:", e);
      setError("Unable to load analytics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, period, router]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export analytics as JSON
  const handleExport = () => {
    if (!analytics) return;

    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `space-analytics-${spaceId}-${period}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Exported", "Analytics data downloaded.");
  };

  // Transform data for charts
  const memberGrowthData = analytics?.members?.growth?.map(d => ({
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: d.value,
  })) || [];

  const roleDistributionData = analytics?.members?.roleDistribution
    ? Object.entries(analytics.members.roleDistribution).map(([role, count]) => ({
        label: role.charAt(0).toUpperCase() + role.slice(1),
        value: count,
      }))
    : [];

  const postActivityData = analytics?.posts?.activity?.map(d => ({
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: d.value,
  })) || [];

  const actionBreakdownData = analytics?.engagement?.actionBreakdown
    ? Object.entries(analytics.engagement.actionBreakdown).map(([action, count]) => ({
        label: action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
      })).sort((a, b) => b.value - a.value)
    : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-neutral-800/50 rounded" />
            <div className="h-4 w-64 bg-neutral-800/50 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-800/50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 bg-neutral-900/60 border-red-500/20 max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Unable to load analytics</h2>
          <p className="text-sm text-neutral-400 mb-4">{error}</p>
          <Button onClick={fetchAnalytics} variant="outline" className="border-neutral-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!spaceId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-400">Space not found</div>
      </div>
    );
  }

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-black"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/spaces/${spaceId}`)}
                className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#FFD700]" />
                  Analytics
                </h1>
                <p className="text-sm text-neutral-400">{spaceName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as TimePeriod)}
                className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white text-sm focus:border-[#FFD700]/50 focus:outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalytics}
                className="border-neutral-700 text-neutral-300 hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-neutral-700 text-neutral-300 hover:bg-white/5"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Health Score & Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div variants={cardVariants}>
            <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06] h-full">
              <h3 className="text-sm font-semibold text-white mb-4">Community Health</h3>
              <HealthScore score={analytics?.summary?.healthScore || 50} />
            </Card>
          </motion.div>
          <div className="lg:col-span-2">
            <InsightCard insights={analytics?.summary?.topInsights || []} />
          </div>
        </div>

        {/* Key Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Members"
              value={analytics?.members?.total || 0}
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              title="New Members"
              value={analytics?.members?.newInPeriod || 0}
              icon={<TrendingUp className="h-5 w-5" />}
              colorClass="text-green-400"
            />
            <MetricCard
              title="Messages"
              value={analytics?.posts?.total || 0}
              icon={<MessageSquare className="h-5 w-5" />}
              colorClass="text-blue-400"
            />
            <MetricCard
              title="Events"
              value={analytics?.events?.total || 0}
              icon={<Calendar className="h-5 w-5" />}
              colorClass="text-purple-400"
            />
          </div>
        </div>

        {/* Engagement Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total RSVPs"
            value={analytics?.events?.totalRSVPs || 0}
            icon={<Calendar className="h-5 w-5" />}
            colorClass="text-purple-400"
          />
          <MetricCard
            title="Upcoming Events"
            value={analytics?.events?.upcoming || 0}
            icon={<Clock className="h-5 w-5" />}
            colorClass="text-cyan-400"
          />
          <MetricCard
            title="Active Users"
            value={analytics?.engagement?.uniqueActiveUsers || 0}
            icon={<Activity className="h-5 w-5" />}
            colorClass="text-orange-400"
          />
          <MetricCard
            title="Engagement Rate"
            value={analytics?.engagement?.engagementRate || 0}
            format="percentage"
            icon={<TrendingUp className="h-5 w-5" />}
            colorClass="text-green-400"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div variants={cardVariants}>
            <SimpleBarChart
              data={memberGrowthData}
              title="New Members Over Time"
              emptyMessage="No new members this period"
            />
          </motion.div>
          <motion.div variants={cardVariants}>
            <SimpleBarChart
              data={postActivityData}
              title="Message Activity"
              emptyMessage="No messages this period"
            />
          </motion.div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div variants={cardVariants}>
            <SimpleBarChart
              data={roleDistributionData}
              title="Member Roles"
              emptyMessage="No role data"
            />
          </motion.div>
          <motion.div variants={cardVariants}>
            <SimpleBarChart
              data={actionBreakdownData}
              title="Activity Types"
              emptyMessage="No activity data"
            />
          </motion.div>
        </div>

        {/* Top Contributors & Peak Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div variants={cardVariants}>
            <TopContributors contributors={analytics?.topContributors} />
          </motion.div>
          <motion.div variants={cardVariants}>
            <PeakActivityCard peakTimes={analytics?.engagement?.peakActivityTimes} />
          </motion.div>
        </div>

        {/* Top Engaged Content */}
        <motion.div variants={cardVariants}>
          <TopContentCard content={analytics?.topContent} />
        </motion.div>

        {/* Post Engagement Summary */}
        {analytics?.posts && (
          <motion.div variants={cardVariants}>
            <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white mb-4">Content Engagement</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">{analytics.posts.totalLikes}</div>
                  <div className="text-xs text-neutral-400">Total Likes</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">{analytics.posts.totalComments}</div>
                  <div className="text-xs text-neutral-400">Total Comments</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">{analytics.posts.averageEngagement.toFixed(1)}</div>
                  <div className="text-xs text-neutral-400">Avg. Engagement</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Footer Note */}
        <motion.div variants={cardVariants} className="text-center py-4">
          <p className="text-xs text-neutral-500">
            Analytics are updated in real-time. Data shown for the {period === "7d" ? "last 7 days" : period === "30d" ? "last 30 days" : "last 3 months"}.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
