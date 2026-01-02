"use client";

/**
 * Presence Indicator
 *
 * Design Direction (Phase 3: Visual Warmth):
 * - Live (< 30s): gold solid dot + slow breath pulse
 * - Present (< 2min): gold ring, no fill
 * - Recent (< 5min): dim gold dot
 * - Away (> 5min): neutral gray
 *
 * Legacy states (backwards compatible):
 * - Online: gold #FFD700, subtle pulse every 3s
 * - Offline: gray #52525B, static
 * - Away: gold outline, no fill
 * - Ghost: purple (for stealth mode)
 *
 * Gold = Life. Where there's gold, something is alive.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import * as React from "react";
import { presenceStates, type PresenceState } from "@hive/tokens";

import { cn } from "../lib/utils";

export type PresenceStatus = "online" | "away" | "offline" | "ghost" | "busy";

export const presenceVariants = cva(
  "rounded-full flex-shrink-0",
  {
    variants: {
      status: {
        // Dark-first design: Gold = Life
        online: "bg-[#FFD700]",
        offline: "bg-[#52525B]",
        away: "bg-transparent border-2 border-[#FFD700]",
        ghost: "bg-purple-500/50",
        busy: "bg-[#FF3737]",
      },
      size: {
        xs: "w-2 h-2",
        sm: "w-2.5 h-2.5",
        md: "w-3 h-3",
        lg: "w-4 h-4",
      },
    },
    defaultVariants: {
      status: "offline",
      size: "md",
    },
  }
);

export interface PresenceDotProps extends VariantProps<typeof presenceVariants> {
  className?: string;
  /** Enable pulse animation for online status */
  pulse?: boolean;
  /** Show ring around indicator for better visibility on avatars */
  ring?: boolean;
}

export const PresenceDot: React.FC<PresenceDotProps> = ({
  status,
  size,
  className,
  pulse = true,
  ring = false,
}) => {
  const isOnline = status === "online";
  const shouldPulse = pulse && isOnline;

  return (
    <span className={cn("relative inline-flex", className)}>
      {/* Ring background for better visibility on avatars */}
      {ring && (
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-[#0A0A0A]",
            size === "xs" && "-m-0.5",
            size === "sm" && "-m-0.5",
            size === "md" && "-m-1",
            size === "lg" && "-m-1"
          )}
          style={{
            width: size === "xs" ? "12px" : size === "sm" ? "14px" : size === "md" ? "20px" : "24px",
            height: size === "xs" ? "12px" : size === "sm" ? "14px" : size === "md" ? "20px" : "24px",
          }}
        />
      )}

      {/* Main indicator */}
      <motion.span
        className={cn(presenceVariants({ status, size }), "relative z-10")}
        animate={shouldPulse ? {
          boxShadow: [
            "0 0 0 0 rgba(255, 215, 0, 0)",
            "0 0 0 4px rgba(255, 215, 0, 0.2)",
            "0 0 0 0 rgba(255, 215, 0, 0)",
          ],
        } : undefined}
        transition={shouldPulse ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        } : undefined}
      />
    </span>
  );
};

PresenceDot.displayName = "PresenceDot";

// ============================================
// ACTIVITY PRESENCE (Phase 3: Visual Warmth)
// ============================================

export type ActivityLevel = PresenceState;

export interface ActivityPresenceProps {
  /** Activity level based on last active time */
  level: ActivityLevel;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const activitySizes = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

/**
 * ActivityPresence - Activity-based presence indicator
 *
 * Uses the new 4-tier presence system:
 * - live: Gold solid with breathing pulse (active < 30s)
 * - present: Gold ring only (active < 2min)
 * - recent: Dim gold (active < 5min)
 * - away: Gray (inactive > 5min)
 */
export const ActivityPresence: React.FC<ActivityPresenceProps> = ({
  level,
  size = 'md',
  className,
}) => {
  const state = presenceStates[level];

  return (
    <span className={cn("relative inline-flex", className)}>
      {/* Outer ring (for present state) */}
      {state.ring !== 'transparent' && (
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            activitySizes[size],
          )}
          style={{
            border: `2px solid ${state.ring}`,
            transform: 'scale(1.5)',
          }}
        />
      )}

      {/* Main dot */}
      <motion.span
        className={cn(
          "rounded-full relative z-10",
          activitySizes[size],
        )}
        style={{
          backgroundColor: state.dot,
        }}
        animate={state.pulse ? {
          scale: [1, 1.15, 1],
          opacity: [1, 0.8, 1],
        } : undefined}
        transition={state.pulse ? {
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        } : undefined}
      />

      {/* Glow effect for live state */}
      {level === 'live' && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: '#FFD700',
            filter: 'blur(4px)',
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </span>
  );
};

ActivityPresence.displayName = "ActivityPresence";

/**
 * Calculate activity level from last active timestamp
 */
export function getActivityLevel(lastActiveMs: number | null | undefined): ActivityLevel {
  if (!lastActiveMs) return 'away';

  const now = Date.now();
  const diff = now - lastActiveMs;

  if (diff < 30_000) return 'live';      // < 30 seconds
  if (diff < 120_000) return 'present';  // < 2 minutes
  if (diff < 300_000) return 'recent';   // < 5 minutes
  return 'away';
}
