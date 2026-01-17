'use client';

/**
 * Separator Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Inset shadow style (carved into surface)
 * Supports horizontal and vertical orientations.
 *
 * Recipe:
 *   style: Inset shadow (dark line + light highlight below)
 *   height: 1px
 *   color: rgba(0,0,0,0.4) with rgba(255,255,255,0.05) highlight
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const separatorVariants = cva(
  // Base: no shrink, full extent
  'shrink-0',
  {
    variants: {
      orientation: {
        horizontal: 'w-full h-px',
        vertical: 'h-full w-px',
      },
      variant: {
        default: '', // Gradient fade applied via style
        solid: 'bg-[var(--color-border)]',
        subtle: 'bg-[var(--color-border)]/50',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default',
    },
  }
);

export interface SeparatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof separatorVariants> {
  /** Decorative (no semantic meaning) */
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      className,
      orientation = 'horizontal',
      variant = 'default',
      decorative = true,
      style,
      ...props
    },
    ref
  ) => {
    // LOCKED: Inset shadow style for default variant
    const insetStyle = React.useMemo(() => {
      if (variant !== 'default') return {};

      return orientation === 'horizontal'
        ? {
            background: 'rgba(0,0,0,0.4)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.05)',
          }
        : {
            background: 'rgba(0,0,0,0.4)',
            boxShadow: '1px 0 0 rgba(255,255,255,0.05)',
          };
    }, [orientation, variant]);

    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={decorative ? undefined : (orientation ?? undefined)}
        className={cn(separatorVariants({ orientation, variant }), className)}
        style={{ ...insetStyle, ...style }}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

export { Separator, separatorVariants };
