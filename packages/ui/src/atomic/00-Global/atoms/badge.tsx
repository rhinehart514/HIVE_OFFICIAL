import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../../lib/utils"

/**
 * Badge Variants - Dark-First Design System
 *
 * MONOCHROME DISCIPLINE:
 * - Default badges are grayscale
 * - Gold badges (`primary`, `leadership`, `building-tools`) are for ACHIEVEMENTS ONLY
 *
 * Gold Badge Rules (when to use `primary` or gold variants):
 * ✅ User earned verification (e.g., "Verified Leader")
 * ✅ Achievement unlocked (e.g., "Top Contributor")
 * ✅ Special status earned (e.g., "Founding Member")
 * ✅ Active/Live indicator (e.g., "Now Live")
 *
 * ❌ DO NOT use gold for:
 * - Generic labels (use `default`)
 * - Categories (use `outline`)
 * - Counts or quantities (use `secondary`)
 * - Standard status indicators (use `success`/`warning`/`destructive`)
 */
const badgeVariants = cva(
  // Dark-first design: Clean, neutral base with white focus ring
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20",
  {
    variants: {
      variant: {
        // === CORE BADGES (use these first) ===

        // Default: Subtle grayscale label
        default:
          "bg-white/[0.06] text-[#A1A1A6] border-white/[0.08]",
        // Secondary: Even more subtle
        secondary:
          "bg-white/[0.04] text-[#71717A] border-white/[0.06]",
        // Outline: Text only with border
        outline:
          "bg-transparent text-[#A1A1A6] border-white/[0.12]",

        // === STATUS BADGES ===

        // Success: Green for positive states
        success:
          "bg-[#00D46A]/10 text-[#00D46A] border-[#00D46A]/20",
        // Warning: Amber for caution
        warning:
          "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20",
        // Destructive: Red for errors/danger
        destructive:
          "bg-[#FF3737]/10 text-[#FF3737] border-[#FF3737]/20",

        // === GOLD BADGES (ACHIEVEMENTS ONLY) ===

        /**
         * Primary: Gold badge - ACHIEVEMENTS/VERIFICATION ONLY
         * Use when user has EARNED something special.
         * Example: "Verified", "Top Contributor", "Founding Member"
         */
        primary:
          "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30",
        /**
         * Leadership: Gold for verified leaders
         * Use for space leaders with verified status
         */
        leadership: "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20",
        /**
         * Building Tools: Gold for active builders
         * Use for users actively creating in HiveLab
         */
        "building-tools": "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20",

        // === ACADEMIC YEAR (grayscale progression) ===

        freshman: "bg-white/[0.06] text-[#A1A1A6] border-white/[0.08]",
        sophomore: "bg-white/[0.08] text-[#C4C4C4] border-white/[0.10]",
        junior: "bg-white/[0.10] text-[#E0E0E0] border-white/[0.12]",
        senior: "bg-white/[0.12] text-[#FAFAFA] border-white/[0.14]",

        // === STYLE VARIANTS ===

        pill: "bg-white/[0.06] text-[#A1A1A6] border-white/[0.08] rounded-full",
        "skill-tag": "bg-white/[0.08] text-[#C4C4C4] border-white/[0.10]",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px]",
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
