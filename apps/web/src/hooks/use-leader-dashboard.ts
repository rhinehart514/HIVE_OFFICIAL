'use client';

/**
 * useLeaderDashboard - Fetch leader dashboard data
 *
 * Aggregates metrics and pending items for space leaders.
 * Combines data from multiple sources into a single dashboard view.
 *
 * @version 1.0.0 - Phase 1 New Build (Feb 2026)
 */

import { useQuery } from '@tanstack/react-query';
import { useSpaceEvents } from './use-space-events';

export interface LeaderDashboardMetrics {
  memberCount: number;
  memberGrowth: number;
  activeMembers: number;
  messagesThisWeek: number;
  messageGrowth: number;
  upcomingEvents: number;
}

export interface PendingItem {
  id: string;
  type: 'tool' | 'claim' | 'report' | 'event';
  title: string;
  description?: string;
  timestamp: string;
  urgent?: boolean;
}

interface UseLeaderDashboardOptions {
  spaceId: string | undefined;
  enabled?: boolean;
}

interface UseLeaderDashboardReturn {
  metrics: LeaderDashboardMetrics | null;
  pendingItems: PendingItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Fetch dashboard metrics from the space analytics API
async function fetchDashboardMetrics(spaceId: string): Promise<LeaderDashboardMetrics> {
  const res = await fetch(`/api/spaces/${spaceId}/analytics?period=7d&metrics=members,posts`);
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard metrics');
  }
  const json = await res.json();
  const data = json.data || json;

  const members = data.members || {};
  const posts = data.posts || {};

  // Calculate growth percentage
  const totalMembers = members.total || 0;
  const newInPeriod = members.newInPeriod || 0;
  const prevBase = totalMembers - newInPeriod;
  const memberGrowth = prevBase > 0 ? Math.round((newInPeriod / prevBase) * 100) : 0;

  const totalPosts = posts.total || 0;

  return {
    memberCount: totalMembers,
    memberGrowth,
    activeMembers: members.activeInPeriod || Math.round(totalMembers * 0.6),
    messagesThisWeek: totalPosts,
    messageGrowth: 0, // would need previous period comparison
    upcomingEvents: 0, // filled by events hook below
  };
}

// Fetch pending items from moderation + admin APIs
async function fetchPendingItems(spaceId: string): Promise<PendingItem[]> {
  const items: PendingItem[] = [];

  // Fetch moderation reports for this space
  try {
    const res = await fetch(`/api/admin/moderation/reports?spaceId=${spaceId}&status=pending&limit=5`);
    if (res.ok) {
      const json = await res.json();
      const reports = json.data?.reports || json.reports || [];
      for (const report of reports) {
        items.push({
          id: report.id,
          type: 'report',
          title: report.reason || 'Content report',
          description: report.reporterName ? `Reported by ${report.reporterName}` : undefined,
          timestamp: report.createdAt || new Date().toISOString(),
          urgent: report.severity === 'high',
        });
      }
    }
  } catch {
    // Non-critical — skip silently
  }

  return items;
}

export function useLeaderDashboard({
  spaceId,
  enabled = true,
}: UseLeaderDashboardOptions): UseLeaderDashboardReturn {
  // Fetch metrics
  const {
    data: metrics = null,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['leader-dashboard-metrics', spaceId],
    queryFn: () => fetchDashboardMetrics(spaceId!),
    enabled: enabled && !!spaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  // Fetch pending items
  const {
    data: pendingItems = [],
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['leader-dashboard-pending', spaceId],
    queryFn: () => fetchPendingItems(spaceId!),
    enabled: enabled && !!spaceId,
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for pending items)
    gcTime: 5 * 60 * 1000,
  });

  // Fetch events to get upcoming count
  const { upcomingEvents } = useSpaceEvents({ spaceId, enabled });

  // Merge events count into metrics
  const enrichedMetrics = metrics ? {
    ...metrics,
    upcomingEvents: upcomingEvents.length,
  } : null;

  const refetch = async () => {
    await Promise.all([refetchMetrics(), refetchPending()]);
  };

  return {
    metrics: enrichedMetrics,
    pendingItems,
    isLoading: metricsLoading || pendingLoading,
    error: (metricsError || pendingError) as Error | null,
    refetch,
  };
}

export default useLeaderDashboard;
