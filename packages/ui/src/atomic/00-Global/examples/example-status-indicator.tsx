/**
 * Example Atom: StatusIndicator
 *
 * DEMONSTRATES:
 * - Atom using semantic tokens (text colors, status colors)
 * - CVA for type-safe variants
 * - Proper TypeScript patterns
 * - Accessibility attributes
 *
 * USAGE:
 * <StatusIndicator status="online" pulse />
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

/**
 * Define variants using CVA
 * Atoms should use semantic tokens for colors
 */
const statusIndicatorVariants = cva(
  // Base styles (always applied)
  "inline-block rounded-full transition-all",
  {
    // Variant definitions
    variants: {
      status: {
        // Use semantic status tokens
        online: [
          "bg-status-success-default",      // Semantic token
          "border-2 border-status-success-default/20"
        ],
        away: [
          "bg-status-warning-default",
          "border-2 border-status-warning-default/20"
        ],
        offline: [
          "bg-border-muted",
          "border-2 border-border-default/20"
        ],
      },
      size: {
        sm: "w-2 h-2",
        md: "w-3 h-3",
        lg: "w-4 h-4",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      }
    },
    // Default variants
    defaultVariants: {
      size: "md",
      pulse: false,
    },
  }
);

/**
 * TypeScript interface extending HTML props + CVA variants
 */
export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusIndicatorVariants> {
  /**
   * Online status
   */
  status: 'online' | 'away' | 'offline';

  /**
   * Show pulse animation
   * @default false
   */
  pulse?: boolean;
}

/**
 * StatusIndicator component
 * Example of a well-typed atom using semantic tokens
 */
export const StatusIndicator = React.forwardRef<
  HTMLSpanElement,
  StatusIndicatorProps
>(({ status, pulse, size, className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(statusIndicatorVariants({ status, size, pulse }), className)}
      aria-label={`Status: ${status}`}
      role="status"
      {...props}
    />
  );
});

StatusIndicator.displayName = 'StatusIndicator';
