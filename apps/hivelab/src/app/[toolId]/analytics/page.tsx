'use client';

/**
 * HiveLab Tool Analytics Page
 *
 * Per DRAMA plan Phase 4.5:
 * 1. Stats: StatCounter count-up (stagger 100ms between)
 * 2. Chart: Line draws left-to-right (800ms)
 * 3. Feedback: Cards stagger in from bottom
 * 4. Export: Success checkmark + "Downloaded" toast
 *
 * States:
 * - Empty (no usage yet)
 * - Loading (skeleton)
 * - Error (retry CTA)
 */

import { useState, useEffect, use, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@hive/ui';
import { MOTION } from '@hive/ui/tokens/motion';
import { apiClient } from '@/lib/api-client';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  UsersIcon,
  StarIcon,
  FireIcon,
  ShareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

const ArrowLeft = ArrowLeftIcon;
const Download = ArrowDownTrayIcon;
const Chart = ChartBarIcon;
const Users = UsersIcon;
const Star = StarIcon;
const Fire = FireIcon;
const Share = ShareIcon;
const Check = CheckIcon;

const EASE = MOTION.ease.premium;

// Colors
const COLORS = {
  bg: 'var(--hive-background-primary, #0A0A0A)',
  bgSecondary: 'var(--hive-background-secondary, #141414)',
  border: 'var(--hive-border-default, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hive-text-primary, #FAF9F7)',
  textSecondary: 'var(--hive-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hive-text-tertiary, #5A5A5A)',
  gold: 'var(--hive-brand-primary, #D4AF37)',
};

interface Props {
  params: Promise<{ toolId: string }>;
}

type TimeRange = '7d' | '30d' | '90d';

interface AnalyticsData {
  totalUsage: number;
  activeUsers: number;
  avgRating: number;
  thisWeek: number;
  dailyUsage: Array<{ date: string; count: number }>;
  feedback: Array<{
    id: string;
    rating: number;
    comment: string;
    author: string;
    createdAt: string;
  }>;
}

// StatCounter with count-up animation
function StatCounter({
  value,
  label,
  icon: Icon,
  suffix,
  index,
}: {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  suffix?: string;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const duration = 600; // 600ms count-up
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Delay based on index (100ms stagger)
    const delay = index * 100;
    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, index, shouldReduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : index * 0.1,
        ease: EASE,
      }}
    >
      <Card className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-[var(--hive-text-primary)]">
                {displayValue.toLocaleString()}
                {suffix && <span className="text-lg ml-1">{suffix}</span>}
              </p>
              <p className="text-sm text-[var(--hive-text-secondary)] mt-1">
                {label}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--hive-brand-primary)]"
              style={{ backgroundColor: `${COLORS.gold}20` }}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Usage chart with line drawing animation
function UsageChart({ data, isLoading }: { data: Array<{ date: string; count: number }>; isLoading: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const [animationProgress, setAnimationProgress] = useState(0);

  // Calculate chart dimensions
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const points = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (d.count / maxCount) * 80, // Leave 20% padding at top
    count: d.count,
    date: d.date,
  }));

  // Create SVG path
  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` +
      points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Animate line drawing
  useEffect(() => {
    if (shouldReduceMotion || data.length === 0) {
      setAnimationProgress(1);
      return;
    }

    setAnimationProgress(0);
    const duration = 800; // 800ms line draw
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start after stats animation (400ms delay)
    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 400);

    return () => clearTimeout(timer);
  }, [data, shouldReduceMotion]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--hive-text-tertiary)]">
        No usage data yet
      </div>
    );
  }

  return (
    <div className="h-64 relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1={0}
            y1={y}
            x2={100}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.5}
          />
        ))}

        {/* Animated line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - animationProgress}
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />

        {/* Area fill */}
        {animationProgress > 0 && (
          <motion.path
            d={`${pathD} L 100 100 L 0 100 Z`}
            fill={`${COLORS.gold}10`}
            initial={{ opacity: 0 }}
            animate={{ opacity: animationProgress }}
          />
        )}

        {/* Data points */}
        {points.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={COLORS.gold}
            initial={{ scale: 0 }}
            animate={{ scale: animationProgress > (i / points.length) ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            style={{ transformOrigin: `${point.x}px ${point.y}px` }}
          />
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-[var(--hive-text-tertiary)] px-2 -mb-6">
        {data.length > 0 && (
          <>
            <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Feedback card with stagger
function FeedbackCard({
  feedback,
  index,
}: {
  feedback: { id: string; rating: number; comment: string; author: string; createdAt: string };
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : 0.6 + index * 0.1, // After chart animation
        ease: EASE,
      }}
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: COLORS.bgSecondary,
        borderColor: COLORS.border,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            i < feedback.rating ? (
              <span key={i} style={{ color: COLORS.gold }}><StarSolid className="w-4 h-4" /></span>
            ) : (
              <span key={i} style={{ color: COLORS.textTertiary }}><Star className="w-4 h-4" /></span>
            )
          ))}
        </div>
        <span className="text-xs" style={{ color: COLORS.textTertiary }}>
          {formatRelativeTime(feedback.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-sm" style={{ color: COLORS.textPrimary }}>
        "{feedback.comment}"
      </p>
      <p className="mt-1 text-xs" style={{ color: COLORS.textSecondary }}>
        — {feedback.author}
      </p>
    </motion.div>
  );
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Empty state
function EmptyState({ onShare }: { onShare: () => void }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        ease: EASE,
      }}
      className="text-center py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
          delay: shouldReduceMotion ? 0 : 0.2,
        }}
        className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-[var(--hive-brand-primary)]"
        style={{ backgroundColor: `${COLORS.gold}20` }}
      >
        <Chart className="w-8 h-8" />
      </motion.div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
        No Analytics Yet
      </h3>
      <p className="mb-6 max-w-sm mx-auto" style={{ color: COLORS.textSecondary }}>
        Share your tool to start collecting usage data and feedback from your community.
      </p>
      <Button
        onClick={onShare}
        className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-hover)]"
      >
        <Share className="w-4 h-4 mr-2" />
        Share Tool
      </Button>
    </motion.div>
  );
}

// Download toast
function DownloadToast({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg"
          style={{
            backgroundColor: COLORS.bgSecondary,
            border: `1px solid ${COLORS.gold}40`,
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.gold }}
          >
            <Check className="w-3 h-3 text-black" />
          </div>
          <span style={{ color: COLORS.textPrimary }}>Downloaded</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ToolAnalyticsRoute({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);
  const [toolName, setToolName] = useState('Tool');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadToast, setShowDownloadToast] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsage: 0,
    activeUsers: 0,
    avgRating: 0,
    thisWeek: 0,
    dailyUsage: [],
    feedback: [],
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (range: TimeRange) => {
    if (!toolId) return;

    try {
      setIsLoading(true);

      // Fetch tool info
      const toolResponse = await apiClient.get(`/api/tools/${toolId}`);
      if (toolResponse.ok) {
        const toolData = await toolResponse.json();
        setToolName((toolData.tool || toolData).name || 'Tool');
      }

      // Fetch analytics
      const analyticsResponse = await apiClient.get(`/api/tools/${toolId}/analytics?range=${range}`);

      if (!analyticsResponse.ok) {
        // Use empty data for new tools
        setAnalytics({
          totalUsage: 0,
          activeUsers: 0,
          avgRating: 0,
          thisWeek: 0,
          dailyUsage: [],
          feedback: [],
        });
        return;
      }

      const data = await analyticsResponse.json();

      setAnalytics({
        totalUsage: data.overview?.totalUsage ?? data.totalUsage ?? 0,
        activeUsers: data.overview?.activeUsers ?? data.activeUsers ?? 0,
        avgRating: data.overview?.avgRating ?? data.avgRating ?? 0,
        thisWeek: data.overview?.thisWeek ?? data.thisWeek ?? 0,
        dailyUsage: data.usage?.daily || data.dailyUsage || [],
        feedback: data.feedback?.comments || data.feedback || [],
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    if (!isClient) return;
    fetchAnalytics(timeRange);
  }, [isClient, timeRange, fetchAnalytics]);

  // Handle export
  const handleExport = useCallback(() => {
    const fileName = `${toolName.toLowerCase().replace(/\s+/g, '-')}-analytics.json`;
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show toast
    setShowDownloadToast(true);
    setTimeout(() => setShowDownloadToast(false), 2000);
  }, [analytics, toolName]);

  // Handle share
  const handleShare = useCallback(() => {
    router.push(`/${toolId}/deploy`);
  }, [router, toolId]);

  // Check if empty state
  const isEmpty = analytics.totalUsage === 0 && analytics.dailyUsage.length === 0;

  // Stats config
  const stats = useMemo(() => [
    { value: analytics.totalUsage, label: 'Total Uses', icon: Chart },
    { value: analytics.activeUsers, label: 'Active Users', icon: Users },
    { value: analytics.avgRating, label: 'Avg Rating', icon: Star, suffix: '★' },
    { value: analytics.thisWeek, label: 'This Week', icon: Fire },
  ], [analytics]);

  if (!isClient || isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-[var(--hive-status-error)]">{error}</p>
          <div className="flex items-center gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => fetchAnalytics(timeRange)}
            >
              Try Again
            </Button>
            <button
              onClick={() => router.push('/')}
              className="text-[var(--hive-brand-primary)] hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.base,
            ease: EASE,
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${toolId}`)}
              className="text-[var(--hive-text-secondary)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold" style={{ color: COLORS.textPrimary }}>
              {toolName} Analytics
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Time range tabs */}
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={timeRange === range
                  ? 'bg-[var(--hive-brand-primary)] text-black'
                  : 'text-[var(--hive-text-secondary)]'
                }
              >
                {range}
              </Button>
            ))}

            {/* Export button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isEmpty}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {isEmpty ? (
          <EmptyState onShare={handleShare} />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <StatCounter
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  icon={stat.icon}
                  suffix={stat.suffix}
                  index={index}
                />
              ))}
            </div>

            {/* Usage Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : MOTION.duration.base,
                delay: shouldReduceMotion ? 0 : 0.3,
                ease: EASE,
              }}
            >
              <Card className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
                <CardHeader>
                  <CardTitle style={{ color: COLORS.textPrimary }}>Usage Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <UsageChart data={analytics.dailyUsage} isLoading={isLoading} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Feedback */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : MOTION.duration.base,
                delay: shouldReduceMotion ? 0 : 0.5,
                ease: EASE,
              }}
            >
              <Card className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
                <CardHeader>
                  <CardTitle style={{ color: COLORS.textPrimary }}>Recent Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.feedback.length === 0 ? (
                    <p className="text-center py-8" style={{ color: COLORS.textTertiary }}>
                      No feedback yet. Share your tool to collect feedback.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.feedback.slice(0, 5).map((fb, index) => (
                        <FeedbackCard key={fb.id} feedback={fb} index={index} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Download Toast */}
      <DownloadToast isVisible={showDownloadToast} />
    </div>
  );
}
