"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hive/ui";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Heart,
} from "lucide-react";
import { AreaChart, BarChart, PieChart } from "./charts";

interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

interface FunnelData {
  stages: FunnelStage[];
  totalStarted: number;
  totalCompleted: number;
  overallConversion: number;
  avgCompletionTime: number;
  dropoffByStep: {
    step: string;
    count: number;
    percentage: number;
  }[];
  dailySignups: {
    date: string;
    signups: number;
    completed: number;
    conversionRate: number;
  }[];
  userTypeBreakdown: {
    type: string;
    count: number;
    percentage: number;
  }[];
  topInterests: {
    interest: string;
    count: number;
  }[];
}

type TimePeriod = "7" | "14" | "30" | "90";

export function OnboardingFunnelDashboard() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30");

  const fetchFunnel = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/analytics/onboarding-funnel?days=${timePeriod}`
      );
      const data = await response.json();

      if (data.success) {
        setFunnelData(data.data.funnel);
      } else {
        setError(data.error?.message || "Failed to fetch funnel data");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchFunnel();
  }, [fetchFunnel]);

  const getConversionColor = (rate: number) => {
    if (rate >= 80) return "text-green-400";
    if (rate >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getConversionBg = (rate: number) => {
    if (rate >= 80) return "bg-green-500/20";
    if (rate >= 50) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  // Prepare chart data
  const dailyChartData = funnelData?.dailySignups.map((d) => ({
    name: d.date.split("-").slice(1).join("/"),
    signups: d.signups,
    completed: d.completed,
  })) || [];

  const userTypeChartData = funnelData?.userTypeBreakdown.map((d) => ({
    name: d.type,
    value: d.count,
    color: d.type === "explorer" ? "#8B5CF6" : d.type === "leader" ? "#FFD700" : "#22C55E",
  })) || [];

  const interestChartData = funnelData?.topInterests.slice(0, 8).map((d) => ({
    name: d.interest,
    value: d.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">
            Onboarding Funnel Analytics
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Track user journey from landing to first space
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={timePeriod}
            onValueChange={(v) => setTimePeriod(v as TimePeriod)}
          >
            <SelectTrigger className="w-[130px] bg-zinc-900/50 border-zinc-700">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFunnel}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {funnelData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <UserPlus className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {funnelData.totalStarted}
                  </p>
                  <p className="text-xs text-zinc-500">Started Onboarding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {funnelData.totalCompleted}
                  </p>
                  <p className="text-xs text-zinc-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getConversionBg(funnelData.overallConversion)}`}>
                  <Target className={`h-5 w-5 ${getConversionColor(funnelData.overallConversion)}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${getConversionColor(funnelData.overallConversion)}`}>
                    {funnelData.overallConversion}%
                  </p>
                  <p className="text-xs text-zinc-500">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Clock className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {funnelData.avgCompletionTime}m
                  </p>
                  <p className="text-xs text-zinc-500">Avg Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Funnel Visualization */}
      {funnelData && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Onboarding Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {funnelData.stages.map((stage, index) => {
                const maxCount = funnelData.stages[0].count;
                const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

                return (
                  <motion.div
                    key={stage.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-4">
                      {/* Stage bar */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-zinc-300">
                            {stage.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-100">
                              {stage.count.toLocaleString()}
                            </span>
                            {index > 0 && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${getConversionColor(stage.conversionRate)}`}
                              >
                                {stage.conversionRate}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="h-8 bg-zinc-800 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dropoff indicator */}
                    {index < funnelData.stages.length - 1 && stage.dropoffRate > 0 && (
                      <div className="flex items-center justify-center py-1 text-xs text-red-400">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        {stage.dropoffRate}% drop-off
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Signups */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Daily Signups & Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyChartData.length > 0 ? (
              <AreaChart
                data={dailyChartData}
                height={250}
                areas={[
                  { dataKey: "signups", color: "#8B5CF6", name: "Signups" },
                  { dataKey: "completed", color: "#22C55E", name: "Completed" },
                ]}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-zinc-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Type Breakdown */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              User Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userTypeChartData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <PieChart data={userTypeChartData} height={200} />
                </div>
                <div className="space-y-2">
                  {funnelData?.userTypeBreakdown.map((type) => (
                    <div key={type.type} className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          type.type === "explorer"
                            ? "bg-purple-500"
                            : type.type === "leader"
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                      />
                      <span className="text-sm text-zinc-300 capitalize">
                        {type.type}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {type.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Interests */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" />
              <CardTitle className="text-sm font-medium text-zinc-400">
                Top Interests Selected
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {interestChartData.length > 0 ? (
              <BarChart data={interestChartData} height={200} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drop-off Analysis */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <CardTitle className="text-sm font-medium text-zinc-400">
                Drop-off Analysis
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {funnelData && funnelData.dropoffByStep.length > 0 ? (
              <div className="space-y-3">
                {funnelData.dropoffByStep.slice(0, 5).map((dropoff, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-zinc-300 truncate max-w-[200px]">
                        {dropoff.step}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500">
                        {dropoff.count} users
                      </span>
                      <Badge variant="outline" className="text-red-400 border-red-400/30">
                        {dropoff.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-500">
                No significant drop-offs
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !funnelData && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 text-zinc-600 mx-auto mb-4 animate-spin" />
          <p className="text-zinc-500">Loading funnel data...</p>
        </div>
      )}
    </div>
  );
}
