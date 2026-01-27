'use client';

/**
 * Space Analytics Page - /s/[handle]/analytics
 *
 * Provides space leaders with insights into their community's health,
 * engagement, and growth. Leader-only access.
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button, Text, Card, MOTION } from '@hive/ui/design-system/primitives';
import { StatCard, StatCardGroup, StatCardSkeleton } from '@hive/ui';
import {
  ArrowLeftIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  CalendarDaysIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@hive/auth-logic';

// Analytics data types
interface MemberGrowthData {
  date: string;
  value: number;
}

interface EngagementData {
  posts: number;
  reactions: number;
  comments: number;
  events: number;
}

interface HealthScore {
  score: number;
  insights: string[];
}

interface SpaceAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  members: {
    total: number;
    newInPeriod: number;
    growth: MemberGrowthData[];
    roleDistribution: Record<string, number>;
  };
  posts: {
    total: number;
    totalLikes: number;
    totalComments: number;
    activity: MemberGrowthData[];
  };
  events: {
    total: number;
    totalRSVPs: number;
    upcoming: number;
    activity: MemberGrowthData[];
  };
  engagement: {
    totalActions: number;
    uniqueActiveUsers: number;
    engagementRate: number;
  };
  summary: {
    healthScore: number;
    topInsights: string[];
  };
}

/**
 * Fetch analytics data from API
 */
async function fetchAnalytics(spaceId: string, period: string): Promise<SpaceAnalytics | null> {
  try {
    const response = await fetch(`/api/spaces/${spaceId}/analytics?period=${period}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return null;
  }
}

/**
 * Resolve space ID from handle
 */
async function resolveSpaceId(handle: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/spaces/resolve?handle=${handle}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.spaceId || data.spaceId || null;
  } catch {
    return null;
  }
}

/**
 * MemberGrowthChart - Simple line visualization
 */
function MemberGrowthChart({
  data,
  title = 'Member Growth',
}: {
  data: MemberGrowthData[];
  title?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-white/5 border-white/[0.08]">
        <Text size="lg" weight="semibold" className="mb-4">{title}</Text>
        <div className="h-40 flex items-center justify-center text-white/40">
          No data available
        </div>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 120;

  return (
    <Card className="p-6 bg-white/5 border-white/[0.08]">
      <Text size="lg" weight="semibold" className="mb-4">{title}</Text>
      <div className="relative h-32">
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {/* Area fill */}
          <defs>
            <linearGradient id="growth-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hive-brand-primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--hive-brand-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Area */}
          <path
            d={`
              M 0 ${chartHeight}
              ${data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = chartHeight - (d.value / maxValue) * chartHeight;
                return `L ${x}% ${y}`;
              }).join(' ')}
              L 100% ${chartHeight}
              Z
            `}
            fill="url(#growth-gradient)"
          />

          {/* Line */}
          <path
            d={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = chartHeight - (d.value / maxValue) * chartHeight;
              return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`;
            }).join(' ')}
            fill="none"
            stroke="var(--hive-brand-primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* End dot */}
          {data.length > 0 && (
            <circle
              cx="100%"
              cy={chartHeight - (data[data.length - 1].value / maxValue) * chartHeight}
              r={4}
              fill="var(--hive-brand-primary)"
            />
          )}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          <Text size="xs" tone="muted">{data[0]?.date}</Text>
          <Text size="xs" tone="muted">{data[data.length - 1]?.date}</Text>
        </div>
      </div>
    </Card>
  );
}

/**
 * EngagementMetrics - Engagement breakdown
 */
function EngagementMetrics({
  engagement,
  posts,
}: {
  engagement: SpaceAnalytics['engagement'];
  posts: SpaceAnalytics['posts'];
}) {
  const metrics = [
    { label: 'Posts', value: posts.total, icon: ChatBubbleLeftIcon },
    { label: 'Reactions', value: posts.totalLikes, icon: HeartIcon },
    { label: 'Comments', value: posts.totalComments, icon: ChatBubbleLeftIcon },
    { label: 'Active Users', value: engagement.uniqueActiveUsers, icon: UsersIcon },
  ];

  const maxValue = Math.max(...metrics.map(m => m.value), 1);

  return (
    <Card className="p-6 bg-white/5 border-white/[0.08]">
      <Text size="lg" weight="semibold" className="mb-4">Engagement Breakdown</Text>
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <metric.icon className="h-4 w-4 text-white/50" />
                <Text size="sm" tone="muted">{metric.label}</Text>
              </div>
              <Text size="sm" weight="semibold">{metric.value.toLocaleString()}</Text>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-[var(--hive-brand-primary)] to-[var(--hive-brand-hover)] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(metric.value / maxValue) * 100}%` }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * HealthScoreCard - Space health indicator
 */
function HealthScoreCard({ summary }: { summary: SpaceAnalytics['summary'] }) {
  const score = summary.healthScore;
  const scoreColor =
    score >= 80 ? 'text-green-400' :
    score >= 60 ? 'text-yellow-400' :
    score >= 40 ? 'text-orange-400' :
    'text-red-400';

  const scoreBg =
    score >= 80 ? 'bg-green-500/20' :
    score >= 60 ? 'bg-yellow-500/20' :
    score >= 40 ? 'bg-orange-500/20' :
    'bg-red-500/20';

  return (
    <Card className="p-6 bg-white/5 border-white/[0.08]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Text size="lg" weight="semibold">Space Health</Text>
          <Text size="xs" tone="muted" className="mt-1">Based on engagement and activity</Text>
        </div>
        <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', scoreBg)}>
          <Text size="lg" weight="bold" className={cn('text-2xl', scoreColor)}>{score}</Text>
        </div>
      </div>

      {summary.topInsights && summary.topInsights.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-white/[0.08]">
          <Text size="sm" weight="medium" className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-[var(--hive-brand-primary)]" />
            Insights
          </Text>
          <ul className="space-y-1">
            {summary.topInsights.slice(0, 3).map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-[var(--hive-brand-primary)] mt-1">•</span>
                <Text size="sm" tone="muted">{insight}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/**
 * PeriodSelector - Time range selector
 */
function PeriodSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (period: string) => void;
}) {
  const periods = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
  ];

  return (
    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            value === period.value
              ? 'bg-[var(--hive-brand-primary)] text-black'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for analytics page
 */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <StatCardGroup columns={4}>
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </StatCardGroup>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/5 border-white/[0.08] animate-pulse">
          <div className="h-4 w-32 bg-white/10 rounded mb-4" />
          <div className="h-32 bg-white/5 rounded" />
        </Card>
        <Card className="p-6 bg-white/5 border-white/[0.08] animate-pulse">
          <div className="h-4 w-32 bg-white/10 rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-white/5 rounded" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Access denied view
 */
function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center p-4"
    >
      <Card className="p-8 bg-white/5 border-white/[0.08] max-w-md text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChartBarIcon className="h-8 w-8 text-red-400" />
        </div>
        <Text size="lg" weight="semibold" className="mb-2">Analytics Access Restricted</Text>
        <Text size="sm" tone="muted" className="mb-6">
          Only space leaders (owners, admins, and moderators) can view analytics.
        </Text>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Space
        </Button>
      </Card>
    </motion.div>
  );
}

/**
 * Main Space Analytics Page
 */
export default function SpaceAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const { user } = useAuth();

  const [spaceId, setSpaceId] = React.useState<string | null>(null);
  const [analytics, setAnalytics] = React.useState<SpaceAnalytics | null>(null);
  const [period, setPeriod] = React.useState('30d');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Resolve space ID from handle
  React.useEffect(() => {
    async function resolve() {
      const id = await resolveSpaceId(handle);
      if (id) {
        setSpaceId(id);
      } else {
        setError('Space not found');
        setIsLoading(false);
      }
    }
    resolve();
  }, [handle]);

  // Fetch analytics when spaceId or period changes
  React.useEffect(() => {
    if (!spaceId) return;

    const currentSpaceId = spaceId; // Capture for closure

    async function load() {
      setIsLoading(true);
      const data = await fetchAnalytics(currentSpaceId, period);
      if (data) {
        setAnalytics(data);
        setError(null);
      } else {
        setError('Permission denied or failed to load analytics');
      }
      setIsLoading(false);
    }

    load();
  }, [spaceId, period]);

  const handleBack = () => {
    router.push(`/s/${handle}`);
  };

  // Access denied
  if (error === 'Permission denied or failed to load analytics') {
    return <AccessDenied onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-[var(--bg-ground)]/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                <Text size="lg" weight="semibold">Space Analytics</Text>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <AnalyticsSkeleton />
        ) : analytics ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <StatCardGroup columns={4}>
              <StatCard
                label="Total Members"
                value={analytics.members.total}
                trend={analytics.members.newInPeriod > 0 ?
                  (analytics.members.newInPeriod / Math.max(analytics.members.total - analytics.members.newInPeriod, 1)) * 100 :
                  0}
                trendLabel={`+${analytics.members.newInPeriod} this period`}
                icon={<UsersIcon className="h-4 w-4 text-[var(--hive-brand-primary)]" />}
              />
              <StatCard
                label="Total Posts"
                value={analytics.posts.total}
                icon={<ChatBubbleLeftIcon className="h-4 w-4 text-[var(--hive-brand-primary)]" />}
              />
              <StatCard
                label="Upcoming Events"
                value={analytics.events.upcoming}
                trendLabel={`${analytics.events.totalRSVPs} total RSVPs`}
                icon={<CalendarDaysIcon className="h-4 w-4 text-[var(--hive-brand-primary)]" />}
              />
              <StatCard
                label="Engagement Rate"
                value={`${analytics.engagement.engagementRate.toFixed(1)}%`}
                trendLabel={`${analytics.engagement.uniqueActiveUsers} active users`}
                icon={<HeartIcon className="h-4 w-4 text-[var(--hive-brand-primary)]" />}
              />
            </StatCardGroup>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MemberGrowthChart
                data={analytics.members.growth}
                title="Member Growth"
              />
              <EngagementMetrics
                engagement={analytics.engagement}
                posts={analytics.posts}
              />
            </div>

            {/* Health Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MemberGrowthChart
                  data={analytics.posts.activity}
                  title="Post Activity"
                />
              </div>
              <HealthScoreCard summary={analytics.summary} />
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Text size="lg" tone="muted">No analytics data available</Text>
          </div>
        )}
      </main>
    </div>
  );
}
