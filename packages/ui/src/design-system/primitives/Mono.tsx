'use client';

/**
 * Mono Primitive
 * LOCKED: January 2026
 *
 * Code and technical text using Geist Mono with locked token application.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const monoVariants = cva(
  // Base: Geist Mono font, primary text, tabular-nums for stable number rendering
  [
    'font-[var(--font-mono)]',
    'text-[var(--color-text-primary)]',
    'tabular-nums',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'text-[var(--font-size-body-sm)]', // 14px
        sm: 'text-[var(--font-size-body-xs)]',      // 13px
        xs: 'text-label',                           // 12px
        // Semantic variants
        data: 'text-[14px] font-medium leading-[1.3]',         // counts, stats, @handles
        'data-sm': 'text-[12px] font-medium leading-[1.3]',    // badge numbers, compact stats
        label: 'text-[11px] font-medium uppercase tracking-label leading-none text-white/50', // section labels
        meta: 'text-[11px] font-normal leading-[1.3] text-white/30',  // timestamps, fine print
      },
      inline: {
        true: [
          'bg-[var(--color-bg-elevated)]',
          'px-1.5 py-0.5',
          'rounded',
        ].join(' '),
      },
    },
    defaultVariants: {
      size: 'default',
      inline: false,
    },
  }
);

export interface MonoProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof monoVariants> {
  /** Render as different element (default: code for inline, pre for block) */
  as?: 'code' | 'pre' | 'span' | 'div';
}

const Mono = React.forwardRef<HTMLElement, MonoProps>(
  ({ className, size, inline, as, children, ...props }, ref) => {
    // Default element based on inline prop
    const tag = as || (inline ? 'code' : 'span');

    // Use createElement for polymorphic support
    return React.createElement(
      tag,
      {
        ref,
        className: cn(monoVariants({ size, inline }), className),
        ...props,
      },
      children
    );
  }
);

Mono.displayName = 'Mono';

export { Mono, monoVariants };
