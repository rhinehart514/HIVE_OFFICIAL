import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../../lib/utils"

const badgeVariants = cva(
  // Semantic radius: badge = full (pill shape)
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-border-strong",
  {
    variants: {
      variant: {
        default:
          "bg-background-interactive text-text-secondary border-border-default",
        secondary:
          "bg-background-secondary text-text-tertiary border-border-default",
        destructive:
          "bg-status-error/10 text-status-error border-status-error/20",
        success:
          "bg-status-success/10 text-status-success border-status-success/20",
        warning:
          "bg-status-warning/10 text-status-warning border-status-warning/20",
        outline:
          "bg-transparent text-text-secondary border-border-strong",
        pill:
          "bg-background-secondary text-text-tertiary border-border-default",
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
          "bg-brand-primary text-black border-transparent",
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
        xs: "px-1.5 py-0.5 text-body-xs",   // 10px
        sm: "px-2 py-0.5 text-body-sm",     // 12px
        md: "px-2.5 py-1 text-body-sm",     // 12px
      },
      tone: {
        default: "",
        muted:
          "bg-background-secondary text-text-muted border-border-default",
        contrast:
          "bg-text-primary text-background-primary border-transparent",
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
