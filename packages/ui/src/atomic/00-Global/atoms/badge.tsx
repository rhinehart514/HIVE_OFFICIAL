import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../../lib/utils"

const badgeVariants = cva(
  // Dark-first design: Subtle styling, white focus ring
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-white/20",
  {
    variants: {
      variant: {
        default:
          "bg-white/[0.06] text-[#A1A1A6] border-[#2A2A2A]",
        secondary:
          "bg-[#141414] text-[#818187] border-[#2A2A2A]",
        destructive:
          "bg-[#FF3737]/10 text-[#FF3737] border-[#FF3737]/20",
        success:
          "bg-[#00D46A]/10 text-[#00D46A] border-[#00D46A]/20",
        warning:
          "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20",
        outline:
          "bg-transparent text-[#A1A1A6] border-[#3A3A3A]",
        pill:
          "bg-[#141414] text-[#818187] border-[#2A2A2A]",
        // University class year variants (dark theme)
        freshman:
          "bg-green-500/10 text-green-400 border-green-500/20",
        sophomore:
          "bg-blue-500/10 text-blue-400 border-blue-500/20",
        junior:
          "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        senior:
          "bg-red-500/10 text-red-400 border-red-500/20",
        // Skill and activity variants (dark theme)
        "skill-tag":
          "bg-purple-500/10 text-purple-400 border-purple-500/20",
        "building-tools":
          "bg-orange-500/10 text-orange-400 border-orange-500/20",
        // Additional variants
        primary:
          "bg-[#FFD700] text-[#0A0A0A] border-transparent",
        "prof-favorite":
          "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        "major-tag":
          "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        "active-tag":
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        "tool-tag":
          "bg-pink-500/10 text-pink-400 border-pink-500/20",
        leadership:
          "bg-amber-500/10 text-amber-400 border-amber-500/20",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px]",
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
      },
      tone: {
        default: "",
        muted:
          "bg-[#141414] text-[#71717A] border-[#2A2A2A]",
        contrast:
          "bg-[#FAFAFA] text-[#0A0A0A] border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      tone: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, tone, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
