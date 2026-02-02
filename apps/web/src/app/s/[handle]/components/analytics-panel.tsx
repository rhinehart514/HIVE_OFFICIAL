'use client';

/**
 * AnalyticsPanel - Space analytics dashboard for leaders
 *
 * Features:
 * - Member growth chart
 * - Post activity metrics
 * - Event attendance
 * - Engagement heatmap
 * - Health score
 * - Actionable insights
 *
 * @version 1.0.0 - Space Architecture Completion (Feb 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  Award,
  X,
  Loader2,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsPanelProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AnalyticsData {
  period: string;
  startDate: string;
  endDate: string;
  spaceId: string;
  members?: {
    total: number;
    newInPeriod: number;
    growth: { date: string; value: number }[];
    roleDistribution: Record<string, number>;
  };
  posts?: {
    total: number;
    totalLikes: number;
    totalComments: number;
    activity: { date: string; value: number }[];
    typeDistribution: Record<string, number>;
    averageEngagement: number;
  };
  events?: {
    total: number;
    totalRSVPs: number;
    upcoming: number;
    activity: { date: string; value: number }[];
    typeDistribution: Record<string, number>;
  };
  engagement?: {
    totalActions: number;
    uniqueActiveUsers: number;
    actionBreakdown: Record<string, number>;
    engagementRate: number;
    peakActivityTimes: {
      hour: { hour: number; count: number } | null;
      day: { day: string; dayIndex: number; count: number } | null;
      hourlyBreakdown: Record<number, number>;
      dailyBreakdown: Record<number, number>;
    };
  };
  topContributors?: {
    userId: string;
    activityCount: number;
    fullName: string;
    handle?: string;
    photoURL?: string;
  }[];
  topContent?: {
    id: string;
    content: string;
    authorId: string;
    authorName?: string;
    likes: number;
    comments: number;
    engagement: number;
    createdAt: string;
    type: string;
  }[];
  summary?: {
    healthScore: number;
    topInsights: string[];
  };
}

type Period = '7d' | '30d' | '90d';

export function AnalyticsPanel({ spaceId, isOpen, onClose }: AnalyticsPanelProps) {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [period, setPeriod] = React.useState<Period>('30d');

  const fetchAnalytics = React.useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/analytics?period=${period}`
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Only space leaders can view analytics');
        }
        throw new Error('Failed to load analytics');
      }

      const result = await response.json();
      setData(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, period]);

  React.useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, fetchAnalytics]);

  if (!isOpen) return null;

  const healthScore = data?.summary?.healthScore ?? 0;
  const healthColor =
    healthScore >= 70 ? 'text-green-400' : healthScore >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className={cn(
          'w-full max-w-4xl max-h-[90vh] overflow-y-auto',
          'bg-[#0A0A09] border border-white/[0.08] rounded-xl',
          'shadow-2xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0A0A09]">
          <div>
            <h2 className="text-lg font-semibold text-white">Space Analytics</h2>
            <p className="text-sm text-white/50">
              {data?.startDate && data?.endDate
                ? `${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`
                : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className={cn(
                  'appearance-none px-3 py-1.5 pr-8 rounded-lg',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'text-white text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-white/20'
                )}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className={cn(
                'p-2 rounded-lg',
                'hover:bg-white/[0.06] transition-colors',
                'text-white/50 hover:text-white',
                'disabled:opacity-50'
              )}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg',
                'hover:bg-white/[0.06] transition-colors',
                'text-white/50 hover:text-white'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-4 text-sm text-white/60 hover:text-white underline"
              >
                Try again
              </button>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Health Score + Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-5 h-5 text-white/50" />
                    <span className="text-sm font-medium text-white">Health Score</span>
                  </div>
                  <div className={cn('text-4xl font-bold', healthColor)}>
                    {healthScore}
                    <span className="text-lg text-white/30">/100</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-5 h-5 text-white/50" />
                    <span className="text-sm font-medium text-white">Insights</span>
                  </div>
                  <ul className="space-y-1">
                    {data.summary?.topInsights?.slice(0, 3).map((insight, i) => (
                      <li key={i} className="text-sm text-white/60">
                        {insight}
                      </li>
                    ))}
                    {(!data.summary?.topInsights || data.summary.topInsights.length === 0) && (
                      <li className="text-sm text-white/40">No insights available</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={Users}
                  label="Members"
                  value={data.members?.total ?? 0}
                  change={data.members?.newInPeriod ?? 0}
                  changeLabel="new"
                />
                <MetricCard
                  icon={MessageSquare}
                  label="Posts"
                  value={data.posts?.total ?? 0}
                  subValue={`${data.posts?.averageEngagement?.toFixed(1) ?? 0} avg engagement`}
                />
                <MetricCard
                  icon={Calendar}
                  label="Events"
                  value={data.events?.total ?? 0}
                  subValue={`${data.events?.upcoming ?? 0} upcoming`}
                />
                <MetricCard
                  icon={Activity}
                  label="Active Users"
                  value={data.engagement?.uniqueActiveUsers ?? 0}
                  subValue={`${data.engagement?.engagementRate ?? 0}% engagement`}
                />
              </div>

              {/* Peak Activity Times */}
              {data.engagement?.peakActivityTimes && (
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-white/50" />
                    <span className="text-sm font-medium text-white">Peak Activity</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/40 mb-1">Best Day</p>
                      <p className="text-lg font-medium text-white">
                        {data.engagement.peakActivityTimes.day?.day || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">Best Hour</p>
                      <p className="text-lg font-medium text-white">
                        {data.engagement.peakActivityTimes.hour
                          ? `${data.engagement.peakActivityTimes.hour.hour}:00`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Contributors */}
              {data.topContributors && data.topContributors.length > 0 && (
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-5 h-5 text-white/50" />
                    <span className="text-sm font-medium text-white">Top Contributors</span>
                  </div>
                  <div className="space-y-2">
                    {data.topContributors.slice(0, 5).map((contributor, i) => (
                      <div
                        key={contributor.userId}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-white/40 w-4">{i + 1}</span>
                          <div
                            className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-white/60"
                            style={{
                              backgroundImage: contributor.photoURL
                                ? `url(${contributor.photoURL})`
                                : undefined,
                              backgroundSize: 'cover',
                            }}
                          >
                            {!contributor.photoURL && contributor.fullName.charAt(0)}
                          </div>
                          <span className="text-sm text-white">{contributor.fullName}</span>
                        </div>
                        <span className="text-sm text-white/50">
                          {contributor.activityCount} actions
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Content */}
              {data.topContent && data.topContent.length > 0 && (
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-5 h-5 text-white/50" />
                    <span className="text-sm font-medium text-white">Top Performing Content</span>
                  </div>
                  <div className="space-y-3">
                    {data.topContent.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                      >
                        <p className="text-sm text-white/80 mb-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          <span>{post.likes} likes</span>
                          <span>{post.comments} comments</span>
                          <span>by {post.authorName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  change?: number;
  changeLabel?: string;
  subValue?: string;
}

function MetricCard({ icon: Icon, label, value, change, changeLabel, subValue }: MetricCardProps) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/40" />
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-white">{value.toLocaleString()}</div>
      {change !== undefined && change > 0 && (
        <div className="text-xs text-green-400 mt-1">
          +{change} {changeLabel}
        </div>
      )}
      {subValue && <div className="text-xs text-white/40 mt-1">{subValue}</div>}
    </div>
  );
}

AnalyticsPanel.displayName = 'AnalyticsPanel';

export default AnalyticsPanel;
