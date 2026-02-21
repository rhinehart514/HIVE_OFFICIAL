import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

const surfaceVariants = cva(
  "relative rounded-[12px] border border-white/[0.06] bg-[#080808] text-white transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
  {
    variants: {
      tone: {
        // Canonical 3-tier surface set
        standard: "bg-[#080808] border-white/[0.06] text-white",
        subtle: "bg-[#0D0D0D] border-white/[0.06] text-white",
        overlay: "bg-black/80 backdrop-blur-2xl border-white/[0.08] text-white",

        // Compatibility aliases
        default: "bg-[#080808] border-white/[0.06] text-white",
        contrast: "bg-[#0D0D0D] border-white/[0.08] text-white",
        inverted: "bg-[#0D0D0D] border-white/[0.08] text-white",
        glass: "bg-black/80 backdrop-blur-2xl border-white/[0.08] text-white",
      },
      elevation: {
        flat: "shadow-none",
        sm: "shadow-[0_8px_16px_rgba(0,0,0,0.28)]",
        md: "shadow-[0_12px_24px_rgba(0,0,0,0.36)]",
        lg: "shadow-[0_16px_32px_rgba(0,0,0,0.44)]",
      },
      padding: {
        none: "p-0",
        xs: "p-3",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      radius: {
        md: "rounded-[12px]",
        lg: "rounded-[12px]",
        full: "rounded-[24px]",
      },
      interactive: {
        true: "hover:bg-[#0D0D0D] hover:border-white/[0.08]",
      },
    },
    defaultVariants: {
      tone: "standard",
      elevation: "sm",
      padding: "md",
      radius: "md",
    },
  }
);

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  /**
   * Adds `role="presentation"` when the surface is purely decorative.
   */
  decorative?: boolean;
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, tone, elevation, padding, radius, interactive, decorative, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={decorative ? "presentation" : props.role}
        className={cn(
          surfaceVariants({ tone, elevation, padding, radius, interactive }),
          className
        )}
        {...props}
      />
    );
  }
);
Surface.displayName = "Surface";

export { surfaceVariants };
