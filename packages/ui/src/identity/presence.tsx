"use client";

/**
 * Presence Indicator
 *
 * Design Direction:
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
