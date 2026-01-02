"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  Network,
  ChevronRight,
  Bell,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { cn } from "../../../lib/utils";
import { Card } from "../../00-Global/atoms/card";
import { Button } from "../../00-Global/atoms/button";

// ============================================================================
// Types
// ============================================================================

export type FeatureKey = "ai_insights" | "campus_graph";

export interface ProfileComingSoonProps {
  /** Features the user has already signed up for */
  notifiedFeatures?: FeatureKey[];
  /** Callback when user clicks "Notify Me" */
  onNotify?: (feature: FeatureKey) => Promise<void>;
  /** Whether notifications are being saved */
  isSaving?: boolean;
  /** Feature flags for each card - allows admin control */
  featureFlags?: {
    aiInsights?: boolean;
    campusGraph?: boolean;
  };
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const AI_INSIGHT_EXAMPLES = [
  "Who should I meet in my major?",
  "What spaces match my interests?",
  "Which events are trending on campus?",
];

// ============================================================================
// Sub-components
// ============================================================================

function AIInsightsHero({
  isNotified,
  onNotify,
  isSaving,
}: {
  isNotified: boolean;
  onNotify?: () => void;
  isSaving?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-colors">
      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="rounded-xl bg-[color-mix(in_srgb,var(--hive-brand-primary,#facc15)_12%,transparent)] p-3"
            >
              <Brain className="h-6 w-6 text-[var(--hive-brand-primary,#facc15)]" />
            </motion.div>
            <div>
              <h4 className="text-lg font-semibold text-[var(--hive-text-primary,#f7f7ff)]">
                AI Insights
              </h4>
              <p className="text-sm text-[var(--hive-text-muted,#8d90a2)]">
                Coming Soon
              </p>
            </div>
          </div>

          {/* Notify Button */}
          <Button
            variant={isNotified ? "ghost" : "secondary"}
            size="sm"
            onClick={onNotify}
            disabled={isNotified || isSaving}
            className={cn(
              "shrink-0 gap-2",
              isNotified &&
                "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10"
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isNotified ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {isNotified ? "Notified" : "Notify Me"}
          </Button>
        </div>

        {/* Example questions */}
        <div className="space-y-3">
          {AI_INSIGHT_EXAMPLES.map((question, idx) => (
            <motion.div
              key={question}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_60%,transparent)] px-4 py-3"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--hive-brand-primary,#facc15)]/60" />
              <span className="text-sm text-[var(--hive-text-secondary,#c0c2cc)]">
                "{question}"
              </span>
            </motion.div>
          ))}
        </div>

        {/* Description */}
        <p className="mt-5 text-sm text-[var(--hive-text-muted,#8d90a2)]">
          {isNotified
            ? "You'll get early beta access when we launch."
            : "Personalized recommendations powered by your campus graph."}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  accentColor,
  isNotified,
  onNotify,
  isSaving,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  accentColor?: string;
  isNotified: boolean;
  onNotify?: () => void;
  isSaving?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-colors">
      <div className="relative p-5">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-4 inline-flex rounded-xl bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_80%,transparent)] p-3"
        >
          <Icon
            className="h-5 w-5"
            style={{ color: accentColor || "var(--hive-brand-primary,#facc15)" }}
          />
        </motion.div>

        {/* Content */}
        <h4 className="mb-1 text-base font-medium text-[var(--hive-text-primary,#f7f7ff)]">
          {title}
        </h4>
        <p className="mb-4 text-sm text-[var(--hive-text-muted,#8d90a2)]">
          {description}
        </p>

        {/* Action */}
        <Button
          variant={isNotified ? "ghost" : "secondary"}
          size="sm"
          onClick={onNotify}
          disabled={isNotified || isSaving}
          className={cn(
            "w-full gap-2",
            isNotified &&
              "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10"
          )}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isNotified ? (
            <>
              <CheckCircle className="h-4 w-4" />
              You're In
            </>
          ) : (
            <>
              Get Early Access
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ProgressIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex items-center gap-3"
    >
      {/* Animated progress bar */}
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522)_80%,transparent)]">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--hive-brand-primary,#facc15)] via-[var(--hive-brand-primary,#facc15)]/60 to-transparent"
          initial={{ width: "0%" }}
          animate={{ width: "45%" }}
          transition={{ delay: 0.6, duration: 1.5, ease: "easeOut" }}
        />
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "400%"] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeInOut",
          }}
        />
      </div>
      <span className="text-xs text-[var(--hive-text-muted,#8d90a2)]">
        Building more...
      </span>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProfileComingSoonSection({
  notifiedFeatures = [],
  onNotify,
  isSaving = false,
  featureFlags = { aiInsights: true, campusGraph: true },
  className,
}: ProfileComingSoonProps) {
  const [savingFeature, setSavingFeature] = React.useState<FeatureKey | null>(null);

  const handleNotify = async (feature: FeatureKey) => {
    if (!onNotify) return;
    setSavingFeature(feature);
    try {
      await onNotify(feature);
    } finally {
      setSavingFeature(null);
    }
  };

  // Check if any features are enabled
  const showAiInsights = featureFlags.aiInsights !== false;
  const showCampusGraph = featureFlags.campusGraph !== false;
  const hasVisibleFeatures = showAiInsights || showCampusGraph;

  // If no features are enabled, don't render the section
  if (!hasVisibleFeatures) {
    return null;
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-[color-mix(in_srgb,var(--hive-border-default,#2d3145)_60%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-secondary,#111221)_86%,transparent)] p-6",
        className
      )}
    >
      {/* Section Header */}
      <div className="mb-6 flex items-center gap-3">
        <motion.div
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Sparkles className="h-5 w-5 text-[var(--hive-brand-primary,#facc15)]" />
        </motion.div>
        <h3 className="text-lg font-medium tracking-tight text-[var(--hive-text-primary,#f7f7ff)]">
          The Future of Your Campus Profile
        </h3>
      </div>

      {/* Features Grid */}
      <div className="space-y-4">
        {/* AI Insights - Hero Card (feature-flagged) */}
        {showAiInsights && (
          <AIInsightsHero
            isNotified={notifiedFeatures.includes("ai_insights")}
            onNotify={() => handleNotify("ai_insights")}
            isSaving={isSaving || savingFeature === "ai_insights"}
          />
        )}

        {/* Campus Graph - Single card (feature-flagged) */}
        {showCampusGraph && (
          <FeatureCard
            icon={Network}
            title="Campus Graph"
            description="Visualize your connections across campus. See who knows who."
            accentColor="#60a5fa"
            isNotified={notifiedFeatures.includes("campus_graph")}
            onNotify={() => handleNotify("campus_graph")}
            isSaving={isSaving || savingFeature === "campus_graph"}
          />
        )}
      </div>

      {/* Progress indicator */}
      <div className="mt-6">
        <ProgressIndicator />
      </div>
    </Card>
  );
}
