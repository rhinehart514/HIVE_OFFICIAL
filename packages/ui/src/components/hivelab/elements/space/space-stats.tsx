'use client';

/**
 * SpaceStats Element (Space Tier)
 *
 * Display engagement metrics for a specific space.
 * Requires: spaceId context (leaders only).
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, Badge } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

export function SpaceStatsElement({ config, data, context, onChange, onAction }: ElementProps) {
  const [stats, setStats] = useState<Record<string, number>>(data?.stats || {});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const metrics = config.metrics || ['members', 'posts', 'events'];

  useEffect(() => {
    if (!context?.spaceId) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/spaces/${context.spaceId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          const space = result.space || result;
          const spaceMetrics = space.metrics || {};
          const statsData: Record<string, number> = {
            members: spaceMetrics.memberCount || space.memberCount || 0,
            posts: spaceMetrics.postCount || space.postCount || 0,
            events: spaceMetrics.eventCount || space.eventCount || 0,
            engagement: spaceMetrics.weeklyEngagement || 0,
          };
          setStats(statsData);
          onChange?.({ stats: statsData, metrics });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [context?.spaceId]);

  // Preview mode: show mock data in IDE
  const isPreviewMode = !context?.spaceId;
  const mockStats: Record<string, number> = {
    members: 42,
    posts: 156,
    events: 8,
    engagement: 73,
    membersTrend: 12,
    postsTrend: 8,
    eventsTrend: -2,
    engagementTrend: 15,
  };
  const displayStats = isPreviewMode ? mockStats : stats;

  const metricLabels: Record<string, string> = {
    members: 'Members',
    posts: 'Posts',
    events: 'Events',
    engagement: 'Engagement',
  };

  const handleMetricClick = (metric: string) => {
    setSelectedMetric(metric);
    onChange?.({ selectedMetric: metric, stats, metrics });
    onAction?.('select', { selectedMetric: metric, value: stats[metric], stats, metrics });
  };

  return (
    <Card className={`bg-gradient-to-br from-primary/5 to-transparent ${isPreviewMode ? 'border-dashed border-primary/30' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Space Analytics</span>
          {isPreviewMode && <Badge variant="outline" className="text-xs text-primary">Preview</Badge>}
        </div>

        {isLoading && !isPreviewMode ? (
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 bg-background rounded-lg border">
                <div className="h-6 bg-muted rounded w-12 mb-1" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric: string) => (
              <div
                key={metric}
                className={`p-3 bg-background rounded-lg border cursor-pointer transition-all ${
                  selectedMetric === metric ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'
                }`}
                onClick={() => handleMetricClick(metric)}
              >
                <div className="text-2xl font-bold">{displayStats[metric] ?? 0}</div>
                <div className="text-xs text-muted-foreground">{metricLabels[metric] || metric}</div>
                {config.showTrends && displayStats[`${metric}Trend`] !== undefined && (
                  <div className={`text-xs mt-1 ${displayStats[`${metric}Trend`] >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {displayStats[`${metric}Trend`] >= 0 ? '+' : ''}{displayStats[`${metric}Trend`]}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
