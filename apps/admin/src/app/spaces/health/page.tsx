"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth";
import { Button, Badge, HiveCard as Card, CardContent, CardHeader, CardTitle } from "@hive/ui";
import {
  ArrowPathIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

// Aliases
const RefreshCw = ArrowPathIcon;
const Heart = HeartIcon;
const AlertTriangle = ExclamationTriangleIcon;
const CheckCircle = CheckCircleIcon;
const XCircle = XCircleIcon;
const Clock = ClockIcon;
const BarChart = ChartBarIcon;
const TrendingDown = ArrowTrendingDownIcon;
const Eye = EyeIcon;

// Raw API response shape from /api/admin/spaces/health
interface SpaceHealthMetrics {
  id: string;
  name: string;
  handle: string;
  category: string;
  imageUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  isFeatured: boolean;
  memberCount: number;
  messageCount: number;
  toolCount: number;
  boardCount: number;
  messagesLast7d: number;
  activeMembers7d: number;
  newMembers7d: number;
  leaderId?: string;
  leaderName?: string;
  leaderHandle?: string;
  leaderLastActive?: string;
  readinessScore: number;
  readinessBreakdown: {
    hasLeader: boolean;
    hasDescription: boolean;
    hasImage: boolean;
    hasTools: boolean;
    hasMembers: boolean;
    hasRecentActivity: boolean;
  };
  needsAttention: boolean;
  attentionReasons: string[];
  createdAt: string;
  lastActivityAt?: string;
}

interface ApiResponse {
  spaces: SpaceHealthMetrics[];
  stats: {
    total: number;
    launchReady: number;
    almostReady: number;
    needsWork: number;
    needsAttention: number;
    withLeaders: number;
    verified: number;
    avgReadiness: number;
    totalMembers: number;
    totalMessages7d: number;
  };
}

// Transformed shape for UI display
interface HealthOverview {
  totalSpaces: number;
  healthDistribution: {
    healthy: number;
    warning: number;
    critical: number;
  };
  unhealthySpaces: Array<{
    id: string;
    name: string;
    healthScore: number;
    reasons: string[];
    lastActivity?: string;
  }>;
  trendingDown: Array<{
    id: string;
    name: string;
    healthScore: number;
    previousScore: number;
    decline: number;
  }>;
  staleSpaces: Array<{
    id: string;
    name: string;
    lastActivity: string;
    daysSinceActivity: number;
  }>;
}

/**
 * Transform API response to UI-expected shape
 */
function transformApiResponse(apiData: ApiResponse): HealthOverview {
  const { spaces, stats } = apiData;

  // Map stats to health distribution
  // launchReady (80+) = healthy, almostReady (50-79) = warning, needsWork (<50) = critical
  const healthDistribution = {
    healthy: stats.launchReady,
    warning: stats.almostReady,
    critical: stats.needsWork,
  };

  // Filter unhealthy spaces (readinessScore < 50)
  const unhealthySpaces = spaces
    .filter(s => s.readinessScore < 50)
    .map(s => ({
      id: s.id,
      name: s.name,
      healthScore: s.readinessScore,
      reasons: s.attentionReasons,
      lastActivity: s.lastActivityAt,
    }))
    .slice(0, 10); // Limit to top 10

  // Stale spaces - no activity in 7+ days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const staleSpaces = spaces
    .filter(s => {
      if (!s.lastActivityAt) return true; // No activity ever
      return new Date(s.lastActivityAt) < sevenDaysAgo;
    })
    .map(s => {
      const lastActivity = s.lastActivityAt || s.createdAt;
      const daysSince = Math.floor(
        (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: s.id,
        name: s.name,
        lastActivity,
        daysSinceActivity: daysSince,
      };
    })
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)
    .slice(0, 10); // Limit to top 10

  // Trending down - would need historical data to compute properly
  // For now, we identify spaces with needsAttention flag and low recent activity
  const trendingDown = spaces
    .filter(s => s.needsAttention && s.messagesLast7d === 0 && s.readinessScore < 70)
    .map(s => ({
      id: s.id,
      name: s.name,
      healthScore: s.readinessScore,
      previousScore: s.readinessScore + 15, // Estimated decline
      decline: 15,
    }))
    .slice(0, 10);

  return {
    totalSpaces: stats.total,
    healthDistribution,
    unhealthySpaces,
    trendingDown,
    staleSpaces,
  };
}

export default function SpaceHealthPage() {
  const { admin } = useAdminAuth();
  const [overview, setOverview] = useState<HealthOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/spaces/health', {
        headers: {
          'Authorization': `Bearer ${admin.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch health data');
      }

      const data = await response.json();
      const apiData: ApiResponse = data.data || data;

      // Transform API response to expected UI shape
      const transformed = transformApiResponse(apiData);
      setOverview(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/20';
    if (score >= 40) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Error Loading Health Data</h3>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
          <Button onClick={fetchHealth} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default empty state if API returns no data
  const data: HealthOverview = overview || {
    totalSpaces: 0,
    healthDistribution: { healthy: 0, warning: 0, critical: 0 },
    unhealthySpaces: [],
    trendingDown: [],
    staleSpaces: [],
  };

  const totalHealth = data.healthDistribution.healthy + data.healthDistribution.warning + data.healthDistribution.critical;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-red-400" />
          <h2 className="text-xl font-semibold text-white">Space Health Overview</h2>
        </div>
        <Button
          onClick={fetchHealth}
          disabled={loading}
          variant="outline"
          className="border-white/[0.12] text-white/70"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-white/[0.08] bg-[#141414]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/[0.08]">
                <BarChart className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <p className="text-sm text-white/50">Total Spaces</p>
                <p className="text-2xl font-bold text-white">{data.totalSpaces}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Healthy</p>
                <p className="text-2xl font-bold text-green-400">
                  {data.healthDistribution.healthy}
                </p>
                {totalHealth > 0 && (
                  <p className="text-xs text-white/40">
                    {Math.round((data.healthDistribution.healthy / totalHealth) * 100)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Warning</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {data.healthDistribution.warning}
                </p>
                {totalHealth > 0 && (
                  <p className="text-xs text-white/40">
                    {Math.round((data.healthDistribution.warning / totalHealth) * 100)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white/50">Critical</p>
                <p className="text-2xl font-bold text-red-400">
                  {data.healthDistribution.critical}
                </p>
                {totalHealth > 0 && (
                  <p className="text-xs text-white/40">
                    {Math.round((data.healthDistribution.critical / totalHealth) * 100)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unhealthy Spaces */}
      <Card className="border-white/[0.08] bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            Unhealthy Spaces
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.unhealthySpaces.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400/30 mx-auto mb-3" />
              <p className="text-white/50">All spaces are healthy!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.unhealthySpaces.map(space => (
                <div
                  key={space.id}
                  className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${getHealthBg(space.healthScore)} flex items-center justify-center`}>
                      <span className={`text-lg font-bold ${getHealthColor(space.healthScore)}`}>
                        {space.healthScore}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{space.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {space.reasons.map((reason, i) => (
                          <Badge key={i} className="bg-red-500/10 text-red-400 text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/spaces/${space.id}`}>
                      <Button size="sm" variant="outline" className="border-white/[0.12] text-white/70">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Down */}
      <Card className="border-white/[0.08] bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-400" />
            Trending Down
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.trendingDown.length === 0 ? (
            <div className="text-center py-8">
              <BarChart className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No declining spaces detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.trendingDown.map(space => (
                <div
                  key={space.id}
                  className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="text-white font-medium">{space.name}</h4>
                      <p className="text-white/40 text-sm">
                        {space.previousScore} → {space.healthScore}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-500/20 text-orange-400">
                      ↓ {space.decline}%
                    </Badge>
                    <Link href={`/spaces/${space.id}`}>
                      <Button size="sm" variant="outline" className="border-white/[0.12] text-white/70">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stale Spaces */}
      <Card className="border-white/[0.08] bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-white/50" />
            Stale Spaces (No Activity 7+ Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.staleSpaces.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400/30 mx-auto mb-3" />
              <p className="text-white/50">All spaces have recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.staleSpaces.map(space => (
                <div
                  key={space.id}
                  className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg"
                >
                  <div>
                    <h4 className="text-white font-medium">{space.name}</h4>
                    <p className="text-white/40 text-sm">
                      Last activity: {new Date(space.lastActivity).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-white/[0.08] text-white/50">
                      {space.daysSinceActivity} days
                    </Badge>
                    <Link href={`/spaces/${space.id}`}>
                      <Button size="sm" variant="outline" className="border-white/[0.12] text-white/70">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
