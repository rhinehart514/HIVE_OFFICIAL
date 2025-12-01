"use client";

/**
 * RailWidget - Sidebar widget for quick actions, progress, and live events
 *
 * Refactored to use centralized motion variants (T3 tier - subtle motion)
 * and glass morphism styling for consistency.
 */

import { Calendar, Clock, Play, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "../../../lib/utils";
import { Button } from "../../00-Global/atoms/button";
import { Progress } from "../../00-Global/atoms/progress";
import {
  railWidgetVariants,
  withReducedMotion,
} from "../../../lib/motion-variants-spaces";
import { glassPresets } from "../../../lib/glass-morphism";

import type { MouseEventHandler } from "react";

export type RailWidgetVariant = "action" | "progress" | "eventNow";

export interface RailWidgetProps {
  variant: RailWidgetVariant;
  title?: string;
  description?: string;
  progress?: number;
  ctaLabel?: string;
  onCta?: MouseEventHandler<HTMLButtonElement>;
  startTimeLabel?: string;
  endTimeLabel?: string;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Additional className */
  className?: string;
}

const defaultTitle: Record<RailWidgetVariant, string> = {
  action: "Quick Action",
  progress: "Progress",
  eventNow: "Happening Now",
};

const variantIcons: Record<RailWidgetVariant, React.ReactNode> = {
  action: <Sparkles className="h-4 w-4 text-gold-400" aria-hidden />,
  progress: <Play className="h-4 w-4 text-gold-400" aria-hidden />,
  eventNow: <Calendar className="h-4 w-4 text-gold-400" aria-hidden />,
};

export function RailWidget({
  variant,
  title,
  description,
  progress = 0,
  ctaLabel = "Open",
  onCta,
  startTimeLabel,
  endTimeLabel,
  animate = true,
  className,
}: RailWidgetProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionVariants = animate
    ? withReducedMotion(railWidgetVariants, shouldReduceMotion ?? false)
    : undefined;

  return (
    <motion.div
      className={cn(glassPresets.railWidget, 'overflow-hidden', className)}
      variants={motionVariants}
      initial={animate ? "initial" : undefined}
      animate={animate ? "animate" : undefined}
      whileHover={animate ? "hover" : undefined}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
          {variantIcons[variant]}
          <span>{title ?? defaultTitle[variant]}</span>
        </h3>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {description && (
          <p className="text-sm text-neutral-400">
            {description}
          </p>
        )}

        {variant === "progress" && (
          <Progress
            value={progress}
            size="sm"
            className="mt-1"
            aria-label={`Progress ${Math.round(progress)}%`}
          />
        )}

        {variant === "eventNow" && (
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {startTimeLabel ?? "Now"}
            </span>
            {endTimeLabel && (
              <span className="text-neutral-500">{`→ ${endTimeLabel}`}</span>
            )}
          </div>
        )}

        <div className="pt-1">
          <Button
            size="sm"
            onClick={onCta}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
            type="button"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
