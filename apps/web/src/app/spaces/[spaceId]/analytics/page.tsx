"use client";

/**
 * Space Analytics Page - Leader Dashboard
 *
 * Archetype: Discovery (Shell ON)
 * Pattern: Metrics dashboard
 * Shell: ON
 *
 * Shows space leaders key metrics about their community.
 * Leader-only access enforced via API.
 *
 * @version 7.0.0 - Redesigned for Spaces Vertical Slice (Jan 2026)
 */

import * as React from "react";

// Category accent colors (domain-based)
const CATEGORY_COLORS: Record<string, string> = {
  university: '#3B82F6',
  student_org: '#F59E0B',
  residential: '#10B981',
  greek: '#8B5CF6',
};
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ChevronLeftIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Button, Card, toast } from "@hive/ui";
import { easingArrays } from "@hive/tokens";
import { secureApiFetch } from "@/lib/secure-auth-utils";

import {
  MetricCard,
  cardVariants,
  SimpleBarChart,
  HealthScore,
  TopContributors,
  PeakActivityCard,
  InsightCard,
  TopContentCard,
  type TopContributor,
  type PeakActivityTimes,
  type TopContentItem,
} from "./components";

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
    peakActivityTimes?: PeakActivityTimes;
  };
  topContributors?: TopContributor[];
  topContent?: TopContentItem[];
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
  const [spaceCategory, setSpaceCategory] = React.useState<string>("student_org");
  const [period, setPeriod] = React.useState<TimePeriod>("30d");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const spaceRes = await secureApiFetch(`/api/spaces/${spaceId}`);
      if (spaceRes.ok) {
        const spaceData = await spaceRes.json();
        const space = spaceData.space || spaceData.data?.space || spaceData;
        setSpaceName(space.name || "Space");
        setSpaceCategory(space.category || "student_org");
      }

      const res = await secureApiFetch(
        `/api/spaces/${spaceId}/analytics?period=${period}`
      );

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
    } catch {
      setError("Unable to load analytics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, period, router]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = () => {
    if (!analytics) return;

    const blob = new Blob([JSON.stringify(analytics, null, 2)], {
      type: "application/json",
    });
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
  const memberGrowthData =
    analytics?.members?.growth?.map((d) => ({
      label: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: d.value,
    })) || [];

  const roleDistributionData = analytics?.members?.roleDistribution
    ? Object.entries(analytics.members.roleDistribution).map(
        ([role, count]) => ({
          label: role.charAt(0).toUpperCase() + role.slice(1),
          value: count,
        })
      )
    : [];

  const postActivityData =
    analytics?.posts?.activity?.map((d) => ({
      label: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: d.value,
    })) || [];

  const actionBreakdownData = analytics?.engagement?.actionBreakdown
    ? Object.entries(analytics.engagement.actionBreakdown)
        .map(([action, count]) => ({
          label: action
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          value: count,
        }))
        .sort((a, b) => b.value - a.value)
    : [];

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

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 bg-neutral-900/60 border-red-500/20 max-w-md text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">
            Unable to load analytics
          </h2>
          <p className="text-sm text-neutral-400 mb-4">{error}</p>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            className="border-neutral-700"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
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

  // Get category color for accent
  const categoryColor = CATEGORY_COLORS[spaceCategory] || CATEGORY_COLORS.student_org;

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-black relative"
    >
      {/* Category accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-40"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50 pt-1">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
                onClick={() => router.push(`/spaces/${spaceId}`)}
                className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-life-gold" />
                  Analytics
                </h1>
                <p className="text-sm text-neutral-400">{spaceName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as TimePeriod)}
                className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white text-sm focus:border-white/30 focus:ring-1 focus:ring-white/20 focus:outline-none"
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
                <ArrowPathIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-neutral-700 text-neutral-300 hover:bg-white/5"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Health Score & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div variants={cardVariants}>
            <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06] h-full">
              <h3 className="text-sm font-semibold text-white mb-4">
                Community Health
              </h3>
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
              icon={<UsersIcon className="h-5 w-5" />}
            />
            <MetricCard
              title="New Members"
              value={analytics?.members?.newInPeriod || 0}
              icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
              colorClass="text-green-400"
            />
            <MetricCard
              title="Messages"
              value={analytics?.posts?.total || 0}
              icon={<ChatBubbleLeftIcon className="h-5 w-5" />}
              colorClass="text-blue-400"
            />
            <MetricCard
              title="Events"
              value={analytics?.events?.total || 0}
              icon={<CalendarIcon className="h-5 w-5" />}
              colorClass="text-purple-400"
            />
          </div>
        </div>

        {/* Engagement Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total RSVPs"
            value={analytics?.events?.totalRSVPs || 0}
            icon={<CalendarIcon className="h-5 w-5" />}
            colorClass="text-purple-400"
          />
          <MetricCard
            title="Upcoming Events"
            value={analytics?.events?.upcoming || 0}
            icon={<ClockIcon className="h-5 w-5" />}
            colorClass="text-cyan-400"
          />
          <MetricCard
            title="Active Users"
            value={analytics?.engagement?.uniqueActiveUsers || 0}
            icon={<ChartBarIcon className="h-5 w-5" />}
            colorClass="text-orange-400"
          />
          <MetricCard
            title="Engagement Rate"
            value={analytics?.engagement?.engagementRate || 0}
            format="percentage"
            icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
            colorClass="text-green-400"
          />
        </div>

        {/* Charts */}
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
            <PeakActivityCard
              peakTimes={analytics?.engagement?.peakActivityTimes}
            />
          </motion.div>
        </div>

        {/* Top Content */}
        <motion.div variants={cardVariants}>
          <TopContentCard content={analytics?.topContent} />
        </motion.div>

        {/* Post Engagement Summary */}
        {analytics?.posts && (
          <motion.div variants={cardVariants}>
            <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white mb-4">
                Content Engagement
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {analytics.posts.totalLikes}
                  </div>
                  <div className="text-xs text-neutral-400">Total Likes</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {analytics.posts.totalComments}
                  </div>
                  <div className="text-xs text-neutral-400">Total Comments</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {analytics.posts.averageEngagement.toFixed(1)}
                  </div>
                  <div className="text-xs text-neutral-400">
                    Avg. Engagement
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div variants={cardVariants} className="text-center py-4">
          <p className="text-xs text-neutral-500">
            Analytics are updated in real-time. Data shown for the{" "}
            {period === "7d"
              ? "last 7 days"
              : period === "30d"
                ? "last 30 days"
                : "last 3 months"}
            .
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
