"use client";

/**
 * NowCard - Event/activity card for "happening now" sidebar content
 *
 * Refactored to use centralized motion variants (T3 tier - subtle motion)
 * and glass morphism styling for consistency.
 */

import { CalendarDays, MapPin, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "../../../lib/utils";
import { Button } from "../../00-Global/atoms/button";
import {
  nowCardVariants,
  withReducedMotion,
} from "../../../lib/motion-variants-spaces";
import { glassPresets } from "../../../lib/glass-morphism";

import type { MouseEventHandler } from "react";

export interface NowCardProps {
  title: string;
  subtitle?: string;
  when?: string;
  where?: string;
  ctaLabel?: string;
  onCta?: MouseEventHandler<HTMLButtonElement>;
  /** Whether this is urgent/live (adds pulse animation) */
  isUrgent?: boolean;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Additional className */
  className?: string;
}

export function NowCard({
  title,
  subtitle,
  when,
  where,
  ctaLabel = "View",
  onCta,
  isUrgent = false,
  animate = true,
  className,
}: NowCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionVariants = animate
    ? withReducedMotion(nowCardVariants, shouldReduceMotion ?? false)
    : undefined;

  return (
    <motion.div
      className={cn(glassPresets.railWidget, 'overflow-hidden', className)}
      variants={motionVariants}
      initial={animate ? "initial" : undefined}
      animate={animate ? (isUrgent ? "urgent" : "animate") : undefined}
      whileHover={animate ? "hover" : undefined}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          {isUrgent && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500" />
            </span>
          )}
          <h3 className="text-base font-semibold text-neutral-100 truncate">
            {title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2 text-sm">
        {subtitle && (
          <p className="text-neutral-400">{subtitle}</p>
        )}

        {when && (
          <p className="inline-flex items-center gap-2 text-neutral-400">
            <CalendarDays className="h-4 w-4 text-neutral-500" aria-hidden />
            {when}
          </p>
        )}

        {where && (
          <p className="inline-flex items-center gap-2 text-neutral-400">
            <MapPin className="h-4 w-4 text-neutral-500" aria-hidden />
            {where}
          </p>
        )}

        <div className="pt-2">
          <Button
            size="sm"
            onClick={onCta}
            className={cn(
              "w-full",
              isUrgent
                ? "bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 border border-gold-500/30"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
            )}
            type="button"
          >
            {isUrgent && <Zap className="h-3.5 w-3.5 mr-1.5" />}
            {ctaLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
