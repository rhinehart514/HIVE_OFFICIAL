"use client";

/**
 * LeaderHealthDashboard - Admin component for monitoring leader health metrics
 *
 * Shows:
 * - Setup completion rates across all verified leaders
 * - At-risk leaders with no activity in 7+ days
 * - Verification and activation trends
 *
 * Uses /api/admin/leaders/health endpoint
 */

import { useState, useEffect, useCallback } from "react";
import { Button, Badge, HiveCard as Card, CardContent, CardHeader, CardTitle, Progress } from "@hive/ui";
import { useAdminAuth } from "@/lib/auth";
import {
  TrophyIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  WrenchIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon as ArrowPathIcon2,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const Crown = TrophyIcon;
const Users = UsersIcon;
const MessageSquare = ChatBubbleLeftIcon;
const Wrench = WrenchIcon;
const TrendingUp = ArrowTrendingUpIcon;
const AlertTriangle = ExclamationTriangleIcon;
const RefreshCw = ArrowPathIcon;
const Mail = EnvelopeIcon;
const ExternalLink = ArrowTopRightOnSquareIcon;
const Loader2 = ArrowPathIcon2;
const CheckCircle2 = CheckCircleIcon;
const Clock = ClockIcon;

interface LeaderHealthMetrics {
  totalVerified: number;
  setupComplete: { count: number; percentage: number };
  postedWelcome: { count: number; percentage: number };
  deployedTool: { count: number; percentage: number };
  fivePlusMembers: { count: number; percentage: number };
  atRiskLeaders: AtRiskLeader[];
  verifiedThisWeek: number;
  avgSetupTimeHours: number;
}

interface AtRiskLeader {
  userId: string;
  userName: string;
  userEmail: string;
  spaceName: string;
  spaceId: string;
  lastActiveAt: string | null;
  daysSinceActive: number;
  setupProgress: {
    welcomeMessage: boolean;
    toolDeployed: boolean;
    memberCount: number;
  };
}

export function LeaderHealthDashboard() {
  const { admin } = useAdminAuth();
  const [metrics, setMetrics] = useState<LeaderHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingNudge, setSendingNudge] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/leaders/health', {
        headers: {
          'Authorization': `Bearer ${admin.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leader health metrics');
      }

      const data = await response.json();
      setMetrics(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const sendNudge = async (leader: AtRiskLeader) => {
    if (!admin) return;

    setSendingNudge(leader.userId);

    try {
      const response = await fetch("/api/admin/leaders/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: leader.userId,
          email: leader.userEmail,
          type: "reactivation",
          message: `Hi ${leader.userName}, we noticed you haven't been active on your space recently. Your community is waiting! Log in to check on your members.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send nudge");
      }

      await fetchMetrics();
    } catch {
      setError("Failed to send nudge notification");
    } finally {
      setSendingNudge(null);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchMetrics, 120000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-white/50 mr-3" />
        <span className="text-white/50">Loading leader health metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-white/10 bg-[#141414]">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-3" />
          <p className="text-white/50 mb-4">Error: {error}</p>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const setupMetrics = [
    {
      label: "Setup Complete",
      count: metrics.setupComplete.count,
      percentage: metrics.setupComplete.percentage,
      icon: CheckCircle2,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "Posted Welcome",
      count: metrics.postedWelcome.count,
      percentage: metrics.postedWelcome.percentage,
      icon: MessageSquare,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Deployed Tool",
      count: metrics.deployedTool.count,
      percentage: metrics.deployedTool.percentage,
      icon: Wrench,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      label: "5+ Members",
      count: metrics.fivePlusMembers.count,
      percentage: metrics.fivePlusMembers.percentage,
      icon: Users,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with summary stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Leader Health</h2>
            <p className="text-sm text-white/50">
              {metrics.totalVerified} verified leaders · {metrics.verifiedThisWeek} this week
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {metrics.avgSetupTimeHours > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
              <Clock className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/50">
                Avg setup: <span className="text-white">{metrics.avgSetupTimeHours}h</span>
              </span>
            </div>
          )}

          <Button
            onClick={fetchMetrics}
            disabled={loading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Setup progress cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {setupMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-white/10 bg-[#141414]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  <span className="text-sm text-white/50">{metric.label}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{metric.count}</span>
                    <span className="text-sm text-white/40">({metric.percentage}%)</span>
                  </div>

                  <Progress
                    value={metric.percentage}
                    className="h-1.5 bg-white/5"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* At-risk leaders */}
      <Card className="border-white/10 bg-[#141414]">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-white">
                At-Risk Leaders
              </CardTitle>
              {metrics.atRiskLeaders.length > 0 && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  {metrics.atRiskLeaders.length} inactive
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {metrics.atRiskLeaders.length === 0 ? (
            <div className="py-12 text-center">
              <TrendingUp className="w-10 h-10 mx-auto text-green-400 mb-3" />
              <p className="text-white/50">All leaders are active!</p>
              <p className="text-sm text-white/40 mt-1">No leaders have been inactive for 7+ days</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {metrics.atRiskLeaders.map((leader) => (
                <div
                  key={leader.userId}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Leader info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white truncate">
                          {leader.spaceName}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs bg-red-500/10 text-red-400 border-red-500/30"
                        >
                          {leader.daysSinceActive}d inactive
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <span>@{leader.userName}</span>
                        <span className="text-white/30">·</span>
                        <span>{leader.userEmail}</span>
                      </div>
                    </div>

                    {/* Setup progress indicators */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          leader.setupProgress.welcomeMessage
                            ? 'bg-green-500/20'
                            : 'bg-white/5'
                        }`}>
                          <MessageSquare className={`w-3 h-3 ${
                            leader.setupProgress.welcomeMessage
                              ? 'text-green-400'
                              : 'text-white/40'
                          }`} />
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          leader.setupProgress.toolDeployed
                            ? 'bg-green-500/20'
                            : 'bg-white/5'
                        }`}>
                          <Wrench className={`w-3 h-3 ${
                            leader.setupProgress.toolDeployed
                              ? 'text-green-400'
                              : 'text-white/40'
                          }`} />
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          leader.setupProgress.memberCount >= 5
                            ? 'bg-green-500/20'
                            : 'bg-white/5'
                        }`}>
                          <Users className={`w-3 h-3 ${
                            leader.setupProgress.memberCount >= 5
                              ? 'text-green-400'
                              : 'text-white/40'
                          }`} />
                        </div>
                        <span className="text-white/40 text-xs">
                          {leader.setupProgress.memberCount} members
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => sendNudge(leader)}
                          disabled={sendingNudge === leader.userId}
                          size="sm"
                          variant="outline"
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        >
                          {sendingNudge === leader.userId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-1" />
                              Nudge
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white/50 hover:text-white"
                          onClick={() => window.open(`/spaces/${leader.spaceId}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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

export default LeaderHealthDashboard;
