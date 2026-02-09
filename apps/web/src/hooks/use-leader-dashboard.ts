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

// Fetch dashboard metrics from API
async function fetchDashboardMetrics(spaceId: string): Promise<LeaderDashboardMetrics> {
  // For now, return mock data - would integrate with analytics API
  // TODO: Wire to GET /api/spaces/[spaceId]/analytics/leader-dashboard

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    memberCount: 42,
    memberGrowth: 12,
    activeMembers: 28,
    messagesThisWeek: 156,
    messageGrowth: 23,
    upcomingEvents: 3,
  };
}

// Fetch pending items from API
async function fetchPendingItems(spaceId: string): Promise<PendingItem[]> {
  // For now, return mock data - would integrate with moderation/admin API
  // TODO: Wire to GET /api/spaces/[spaceId]/pending

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return [
    {
      id: '1',
      type: 'tool',
      title: 'Poll tool pending approval',
      description: 'Created by @alice',
      timestamp: new Date().toISOString(),
      urgent: true,
    },
    {
      id: '2',
      type: 'report',
      title: 'Content report from @bob',
      description: 'Spam in general chat',
      timestamp: new Date().toISOString(),
    },
  ];
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
