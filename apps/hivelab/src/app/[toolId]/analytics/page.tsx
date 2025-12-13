'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ToolAnalyticsPage,
  Skeleton,
  type ToolAnalyticsData,
} from '@hive/ui';
import { apiClient } from '@/lib/api-client';

/**
 * HiveLab Tool Analytics Page
 *
 * Shows usage metrics, ratings, and feedback for a tool.
 * Uses the ToolAnalyticsPage component from @hive/ui.
 */

interface Props {
  params: Promise<{ toolId: string }>;
}

type TimeRange = '7d' | '30d' | '90d';

// Default empty analytics data
const EMPTY_ANALYTICS: ToolAnalyticsData = {
  overview: {
    totalUsage: 0,
    activeUsers: 0,
    avgRating: 0,
    downloads: 0,
  },
  usage: {
    daily: [],
    spaces: [],
    features: [],
  },
  feedback: {
    ratings: [
      { rating: 5, count: 0 },
      { rating: 4, count: 0 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ],
    comments: [],
  },
};

export default function ToolAnalyticsRoute({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [toolName, setToolName] = useState('Tool');
  const [analytics, setAnalytics] = useState<ToolAnalyticsData>(EMPTY_ANALYTICS);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (range: TimeRange) => {
    if (!toolId) return;

    try {
      setIsLoading(true);

      // Fetch tool info for the name
      const toolResponse = await apiClient.get('/api/tools/' + toolId);
      if (toolResponse.ok) {
        const toolData = await toolResponse.json();
        setToolName((toolData.tool || toolData).name || 'Tool');
      }

      // Fetch analytics
      const analyticsResponse = await apiClient.get(
        '/api/tools/' + toolId + '/analytics?range=' + range
      );

      if (!analyticsResponse.ok) {
        // Return empty analytics instead of failing
        setAnalytics(EMPTY_ANALYTICS);
        return;
      }

      const data = await analyticsResponse.json();

      // Transform API response to ToolAnalyticsData format
      const analyticsData: ToolAnalyticsData = {
        overview: {
          totalUsage: data.overview?.totalUsage ?? data.totalUsage ?? 0,
          activeUsers: data.overview?.activeUsers ?? data.activeUsers ?? 0,
          avgRating: data.overview?.avgRating ?? data.avgRating ?? 0,
          downloads: data.overview?.downloads ?? data.downloads ?? 0,
        },
        usage: {
          daily: data.usage?.daily || data.dailyUsage || [],
          spaces: data.usage?.spaces || data.spaceUsage || [],
          features: data.usage?.features || data.featureUsage || [],
        },
        feedback: {
          ratings: data.feedback?.ratings || data.ratings || [
            { rating: 5, count: 0 },
            { rating: 4, count: 0 },
            { rating: 3, count: 0 },
            { rating: 2, count: 0 },
            { rating: 1, count: 0 },
          ],
          comments: data.feedback?.comments || data.comments || [],
        },
      };

      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setAnalytics(EMPTY_ANALYTICS);
    } finally {
      setIsLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    if (!isClient) return;
    fetchAnalytics(timeRange);
  }, [isClient, timeRange, fetchAnalytics]);

  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/' + toolId);
  };

  // Handle export
  const handleExport = () => {
    // Create downloadable JSON
    const fileName = toolName.toLowerCase().replace(/\s+/g, '-') + '-analytics.json';
    const blob = new Blob([JSON.stringify(analytics, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--hive-status-error)]">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-[var(--hive-brand-primary)] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToolAnalyticsPage
      toolName={toolName}
      analytics={analytics}
      timeRange={timeRange}
      onTimeRangeChange={handleTimeRangeChange}
      onBack={handleBack}
      onExport={handleExport}
    />
  );
}
