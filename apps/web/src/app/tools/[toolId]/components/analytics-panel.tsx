'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { XMarkIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, UsersIcon, ChartBarIcon, StarIcon } from '@heroicons/react/24/outline';

interface ToolAnalyticsPanelProps {
  toolId: string;
  toolName: string;
  onClose: () => void;
}

interface AnalyticsData {
  overview: {
    totalUsage: number;
    activeUsers: number;
    avgRating: number;
    downloads: number;
    usageTrend: number;
    userTrend: number;
    returningUsers: number;
    retentionRate: number;
  };
  usage: {
    daily: Array<{ date: string; usage: number; users: number }>;
    spaces: Array<{ name: string; usage: number; members: number }>;
    features: Array<{ feature: string; usage: number; percentage: number }>;
    elementTypes: Array<{ type: string; usage: number }>;
  };
  feedback: {
    ratings: Array<{ rating: number; count: number }>;
    comments: Array<{ user: string; comment: string; rating: number; date: string }>;
    totalReviews: number;
  };
}

async function fetchAnalytics(toolId: string, range: '7d' | '30d' | '90d' = '7d'): Promise<AnalyticsData> {
  const response = await fetch(`/api/tools/${toolId}/analytics?range=${range}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  return response.json();
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <div className="flex items-center gap-1 text-xs">
      {isPositive ? (
        <ArrowTrendingUpIcon className="h-3 w-3 text-emerald-500" />
      ) : (
        <ArrowTrendingDownIcon className="h-3 w-3 text-red-500" />
      )}
      <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
        {isPositive ? '+' : ''}{value}%
      </span>
      <span className="text-[#9e9e9e]">{label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon: Icon
}: {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#e0e0e0]">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#4CAF50]" />
        </div>
        {trend !== undefined && <TrendBadge value={trend} label="vs prev" />}
      </div>
      <div className="text-2xl font-semibold text-[#212121]">{value}</div>
      <div className="text-sm text-[#757575]">{label}</div>
    </div>
  );
}

function MiniBarChart({ data }: { data: Array<{ date: string; usage: number }> }) {
  const maxUsage = Math.max(...data.map(d => d.usage), 1);

  return (
    <div className="h-20 flex items-end gap-1">
      {data.slice(-14).map((d, i) => (
        <div
          key={d.date}
          className="flex-1 bg-[#4CAF50]/20 rounded-t transition-all hover:bg-[#4CAF50]/40"
          style={{ height: `${(d.usage / maxUsage) * 100}%`, minHeight: d.usage > 0 ? 4 : 0 }}
          title={`${d.date}: ${d.usage} uses`}
        />
      ))}
    </div>
  );
}

function RatingBar({ rating, count, maxCount }: { rating: number; count: number; maxCount: number }) {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 w-16">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`h-3 w-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-[#e0e0e0]'}`}
          />
        ))}
      </div>
      <div className="flex-1 h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-[#757575] w-8 text-right">{count}</span>
    </div>
  );
}

export function ToolAnalyticsPanel({ toolId, toolName, onClose }: ToolAnalyticsPanelProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tool-analytics', toolId],
    queryFn: () => fetchAnalytics(toolId),
    staleTime: 60000,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-[#fafafa] shadow-2xl h-full overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#212121]">Analytics</h2>
            <p className="text-sm text-[#757575]">{toolName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-[#757575]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white rounded-xl border border-[#e0e0e0] animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-[#757575]">Failed to load analytics</p>
              <p className="text-sm text-[#9e9e9e] mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          ) : data ? (
            <>
              {/* Overview Stats */}
              <div>
                <h3 className="text-sm font-medium text-[#757575] mb-3">Overview (Last 7 days)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Total Usage"
                    value={data.overview.totalUsage.toLocaleString()}
                    trend={data.overview.usageTrend}
                    icon={ChartBarIcon}
                  />
                  <StatCard
                    label="Active Users"
                    value={data.overview.activeUsers.toLocaleString()}
                    trend={data.overview.userTrend}
                    icon={UsersIcon}
                  />
                  <StatCard
                    label="Avg Rating"
                    value={data.overview.avgRating.toFixed(1)}
                    icon={StarIcon}
                  />
                  <StatCard
                    label="Retention Rate"
                    value={`${data.overview.retentionRate}%`}
                    icon={UsersIcon}
                  />
                </div>
              </div>

              {/* Usage Chart */}
              <div className="bg-white rounded-xl p-4 border border-[#e0e0e0]">
                <h3 className="text-sm font-medium text-[#212121] mb-4">Daily Usage</h3>
                <MiniBarChart data={data.usage.daily} />
                <div className="flex justify-between mt-2 text-xs text-[#9e9e9e]">
                  <span>{data.usage.daily[0]?.date || ''}</span>
                  <span>{data.usage.daily[data.usage.daily.length - 1]?.date || ''}</span>
                </div>
              </div>

              {/* Top Spaces */}
              {data.usage.spaces.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-[#e0e0e0]">
                  <h3 className="text-sm font-medium text-[#212121] mb-3">Top Spaces</h3>
                  <div className="space-y-3">
                    {data.usage.spaces.slice(0, 5).map((space, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-xs font-medium text-[#4CAF50]">
                            {i + 1}
                          </div>
                          <span className="text-sm text-[#212121]">{space.name}</span>
                        </div>
                        <span className="text-sm text-[#757575]">{space.usage} uses</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature Usage */}
              {data.usage.features.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-[#e0e0e0]">
                  <h3 className="text-sm font-medium text-[#212121] mb-3">Top Actions</h3>
                  <div className="space-y-2">
                    {data.usage.features.slice(0, 5).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#212121] capitalize">{feature.feature.replace(/_/g, ' ')}</span>
                            <span className="text-[#757575]">{feature.percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-[#f5f5f5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#4CAF50] rounded-full"
                              style={{ width: `${feature.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings */}
              {data.feedback.totalReviews > 0 && (
                <div className="bg-white rounded-xl p-4 border border-[#e0e0e0]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[#212121]">Ratings</h3>
                    <span className="text-sm text-[#757575]">{data.feedback.totalReviews} reviews</span>
                  </div>
                  <div className="space-y-2">
                    {data.feedback.ratings.map((r) => (
                      <RatingBar
                        key={r.rating}
                        rating={r.rating}
                        count={r.count}
                        maxCount={Math.max(...data.feedback.ratings.map(x => x.count))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Comments */}
              {data.feedback.comments.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-[#e0e0e0]">
                  <h3 className="text-sm font-medium text-[#212121] mb-3">Recent Reviews</h3>
                  <div className="space-y-3">
                    {data.feedback.comments.slice(0, 3).map((comment, i) => (
                      <div key={i} className="pb-3 border-b border-[#f5f5f5] last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <StarIcon
                                key={j}
                                className={`h-3 w-3 ${j < comment.rating ? 'text-amber-400 fill-amber-400' : 'text-[#e0e0e0]'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[#9e9e9e]">
                            {new Date(comment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#424242] line-clamp-2">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {data.overview.totalUsage === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                    <ChartBarIcon className="h-8 w-8 text-[#9e9e9e]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#212121] mb-1">No data yet</h3>
                  <p className="text-sm text-[#757575]">
                    Deploy your tool to start collecting analytics
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
