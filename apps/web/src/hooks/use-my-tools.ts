'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@hive/auth-logic';
import { apiClient } from '@/lib/api-client';

export interface MyTool {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'pending_review' | 'deployed';
  updatedAt: string;
  createdAt: string;
  useCount: number;
  deployments: number;
  wau: number;
  weeklyInteractions: number;
  templateId: string | null;
}

export interface MyToolsStats {
  totalTools: number;
  totalUsers: number;
  weeklyInteractions: number;
}

interface MyToolsResponse {
  tools: MyTool[];
  stats: MyToolsStats;
}

async function fetchMyTools(): Promise<MyToolsResponse> {
  const response = await apiClient.get('/api/tools/my-tools');
  if (!response.ok) throw new Error('Failed to fetch tools');
  const json = await response.json();
  const data = json.data || json;
  return {
    tools: data.tools || [],
    stats: data.stats || { totalTools: 0, totalUsers: 0, weeklyInteractions: 0 },
  };
}

export function useMyTools() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-tools', user?.uid],
    queryFn: fetchMyTools,
    enabled: !!user,
    staleTime: 60_000,
  });
}

interface ToolAnalyticsData {
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

async function fetchToolAnalytics(toolId: string, range: string): Promise<ToolAnalyticsData> {
  const response = await apiClient.get(`/api/tools/${toolId}/analytics?range=${range}`);
  if (!response.ok) throw new Error('Failed to fetch analytics');
  const json = await response.json();
  return json.data || json;
}

export function useToolAnalytics(toolId: string | null, range: string = '7d') {
  return useQuery({
    queryKey: ['tool-analytics', toolId, range],
    queryFn: () => fetchToolAnalytics(toolId!, range),
    enabled: !!toolId,
    staleTime: 120_000,
  });
}
