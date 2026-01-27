"use client";

/**
 * Queue Dashboard
 *
 * Unified view of all actionable queues in Operations Center.
 * Shows counts and provides quick navigation to each queue type.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useOperationsStore, selectQueueCounts } from "@/lib/stores";
import { HiveCard, CardContent, CardHeader, CardTitle, Badge, Button, Progress } from "@hive/ui";
import {
  FlagIcon,
  TrophyIcon,
  WrenchIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface QueueConfig {
  id: "reports" | "claims" | "tools" | "appeals";
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  href: string;
}

const queueConfigs: QueueConfig[] = [
  {
    id: "reports",
    label: "Content Reports",
    description: "Flagged content requiring review",
    icon: FlagIcon,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    href: "/operations/content",
  },
  {
    id: "claims",
    label: "Leader Claims",
    description: "Space ownership claims pending verification",
    icon: TrophyIcon,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    href: "/operations/spaces",
  },
  {
    id: "tools",
    label: "Tool Reviews",
    description: "HiveLab tools awaiting approval",
    icon: WrenchIcon,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    href: "/operations/tools",
  },
  {
    id: "appeals",
    label: "Appeals",
    description: "User appeals for moderation decisions",
    icon: ScaleIcon,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    href: "/operations/content",
  },
];

function QueueCard({ config, count, loading }: { config: QueueConfig; count: number; loading: boolean }) {
  const Icon = config.icon;
  const hasItems = count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <HiveCard className={`${config.bgColor} border ${config.borderColor} h-full`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            {hasItems ? (
              <Badge className={`${config.bgColor} ${config.color} ${config.borderColor} border`}>
                {count} pending
              </Badge>
            ) : (
              <Badge className="bg-green-500/10 text-green-400 border-green-500/30 border">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Clear
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">{config.label}</h3>
            <p className="text-sm text-white/50">{config.description}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/40">
              <ClockIcon className="h-4 w-4" />
              <span>Updated now</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`${config.color} hover:bg-white/5`}
              asChild
            >
              <a href={config.href}>
                Review
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </HiveCard>
    </motion.div>
  );
}

function TotalQueueSummary({
  total,
  counts,
}: {
  total: number;
  counts: { reports: number; claims: number; tools: number; appeals: number };
}) {
  const highest = Math.max(counts.reports, counts.claims, counts.tools, counts.appeals);

  return (
    <HiveCard className="bg-[#111] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
          Queue Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-5xl font-bold text-white"
          >
            {total}
          </motion.div>
          <p className="text-sm text-white/50 mt-1">total items requiring attention</p>
        </div>

        <div className="space-y-4">
          {queueConfigs.map((config) => {
            const count = counts[config.id];
            const percentage = highest > 0 ? (count / highest) * 100 : 0;

            return (
              <div key={config.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">{config.label}</span>
                  <span className={config.color}>{count}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`h-full rounded-full ${config.bgColor.replace("/10", "/50")}`}
                    style={{
                      backgroundColor:
                        config.id === "reports"
                          ? "#ef4444"
                          : config.id === "claims"
                          ? "#f59e0b"
                          : config.id === "tools"
                          ? "#a855f7"
                          : "#3b82f6",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </HiveCard>
  );
}

export function QueueDashboard() {
  const counts = useOperationsStore(selectQueueCounts);
  const fetchQueueCounts = useOperationsStore((state) => state.fetchQueueCounts);
  const loading = useOperationsStore((state) => state.queueLoading);
  const error = useOperationsStore((state) => state.queueError);

  useEffect(() => {
    fetchQueueCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchQueueCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchQueueCounts]);

  const total = counts.reports + counts.claims + counts.tools + counts.appeals;

  if (loading && total === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-white/50">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          Loading queues...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Action Queues</h2>
          <p className="text-sm text-white/50 mt-1">
            Items requiring admin attention
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchQueueCounts()}
          disabled={loading}
          className="gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* All clear message */}
      {total === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HiveCard className="bg-green-500/5 border-green-500/20">
            <CardContent className="py-8 text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-400">All Queues Clear</h3>
              <p className="text-sm text-white/50 mt-1">
                No items requiring attention. Great job!
              </p>
            </CardContent>
          </HiveCard>
        </motion.div>
      )}

      {/* Queue cards grid */}
      {total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Summary card */}
          <div className="lg:col-span-2">
            <TotalQueueSummary total={total} counts={counts} />
          </div>

          {/* Individual queues */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {queueConfigs.map((config, index) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <QueueCard config={config} count={counts[config.id]} loading={loading} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions when there are items */}
      {total > 0 && (
        <HiveCard className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {counts.reports > 0 && (
                <Button variant="outline" size="sm" className="gap-2 text-red-400 border-red-500/30" asChild>
                  <a href="/operations/content">
                    <FlagIcon className="h-4 w-4" />
                    Review {counts.reports} report{counts.reports !== 1 ? "s" : ""}
                  </a>
                </Button>
              )}
              {counts.claims > 0 && (
                <Button variant="outline" size="sm" className="gap-2 text-amber-400 border-amber-500/30" asChild>
                  <a href="/operations/spaces">
                    <TrophyIcon className="h-4 w-4" />
                    Review {counts.claims} claim{counts.claims !== 1 ? "s" : ""}
                  </a>
                </Button>
              )}
              {counts.tools > 0 && (
                <Button variant="outline" size="sm" className="gap-2 text-purple-400 border-purple-500/30" asChild>
                  <a href="/operations/tools">
                    <WrenchIcon className="h-4 w-4" />
                    Review {counts.tools} tool{counts.tools !== 1 ? "s" : ""}
                  </a>
                </Button>
              )}
              {counts.appeals > 0 && (
                <Button variant="outline" size="sm" className="gap-2 text-blue-400 border-blue-500/30" asChild>
                  <a href="/operations/content">
                    <ScaleIcon className="h-4 w-4" />
                    Review {counts.appeals} appeal{counts.appeals !== 1 ? "s" : ""}
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </HiveCard>
      )}
    </div>
  );
}
