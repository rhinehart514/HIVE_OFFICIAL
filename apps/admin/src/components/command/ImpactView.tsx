"use client";

/**
 * Impact View
 *
 * Success metrics and stories for stakeholder presentations.
 * Designed for executive demos and university stakeholder meetings.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HiveCard, CardContent, CardHeader, CardTitle, Badge, Button } from "@hive/ui";
import {
  TrophyIcon,
  SparklesIcon,
  UsersIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  WrenchIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

interface ImpactMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  context: string;
  trend?: "up" | "down" | "stable";
  changePercent?: number;
}

interface SuccessStory {
  id: string;
  type: string;
  title: string;
  description: string;
  metric: string;
  metricValue: number;
  entityName: string;
  date: string;
}

interface CategoryBreakdown {
  category: string;
  label: string;
  count: number;
  percentage: number;
}

type Period = "week" | "month" | "quarter" | "all";

const metricIcons: Record<string, React.ElementType> = {
  "students-connected": UsersIcon,
  "communities-built": BuildingOffice2Icon,
  "events-hosted": CalendarDaysIcon,
  "tools-deployed": WrenchIcon,
  "posts-shared": DocumentTextIcon,
  "connections-made": SparklesIcon,
};

function ImpactMetricCard({ metric }: { metric: ImpactMetric }) {
  const Icon = metricIcons[metric.id] || TrophyIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <HiveCard className="bg-[#111] border-white/10 h-full">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-[#FFD700]" />
            </div>
            {metric.trend && metric.changePercent !== undefined && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  metric.trend === "up" ? "text-green-400" : "text-white/50"
                }`}
              >
                <ArrowTrendingUpIcon className="h-4 w-4" />
                <span>+{metric.changePercent}%</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-4xl font-bold text-white">
              {metric.value.toLocaleString()}
            </div>
            <div className="text-lg text-[#FFD700]">{metric.label}</div>
            <div className="text-sm text-white/50">{metric.context}</div>
          </div>
        </CardContent>
      </HiveCard>
    </motion.div>
  );
}

function SuccessStoryCard({ story }: { story: SuccessStory }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-xl bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20"
    >
      <div className="flex items-start justify-between mb-3">
        <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30">
          {story.type}
        </Badge>
        <span className="text-xs text-white/40">
          {new Date(story.date).toLocaleDateString()}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{story.title}</h3>
      <p className="text-sm text-white/50 mb-3">{story.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-sm text-white/40">{story.entityName}</span>
        <div className="text-right">
          <div className="text-xl font-bold text-[#FFD700]">
            {story.metricValue.toLocaleString()}
          </div>
          <div className="text-xs text-white/40">{story.metric}</div>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryBar({ category }: { category: CategoryBreakdown }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/50">{category.label}</span>
        <span className="text-white">{category.count} spaces</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${category.percentage}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-full bg-[#FFD700] rounded-full"
        />
      </div>
    </div>
  );
}

export function ImpactView() {
  const [period, setPeriod] = useState<Period>("all");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImpact() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/command/impact?period=${period}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setHeadline(result.data.headline);
          setSubheadline(result.data.subheadline);
          setMetrics(result.data.metrics);
          setStories(result.data.successStories);
          setCategories(result.data.categoryBreakdown);
        } else {
          throw new Error(result.error?.message || "Failed to fetch impact data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchImpact();
  }, [period]);

  if (loading && metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/50">Loading impact data...</div>
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
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFD700]/10 text-[#FFD700] mb-4"
        >
          <TrophyIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Campus Impact</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          {headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-white/50"
        >
          {subheadline}
        </motion.p>

        {/* Period selector */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {(["week", "month", "quarter", "all"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? "bg-[#FFD700] text-black" : ""}
            >
              {p === "all" ? "All Time" : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Impact metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ImpactMetricCard metric={metric} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Success stories */}
        <div className="lg:col-span-2">
          <HiveCard className="bg-[#111] border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-[#FFD700]" />
                Success Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stories.map((story, index) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <SuccessStoryCard story={story} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-white/40">
                  No success stories yet. Keep building!
                </div>
              )}
            </CardContent>
          </HiveCard>
        </div>

        {/* Category breakdown */}
        <div>
          <HiveCard className="bg-[#111] border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BuildingOffice2Icon className="h-5 w-5 text-[#FFD700]" />
                Space Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CategoryBar category={category} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-white/40">
                  No category data available
                </div>
              )}
            </CardContent>
          </HiveCard>
        </div>
      </div>
    </div>
  );
}
