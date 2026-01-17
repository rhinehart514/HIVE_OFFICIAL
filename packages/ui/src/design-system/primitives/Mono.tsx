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
  // Base: Geist Mono font, primary text
  [
    'font-[var(--font-mono)]',
    'text-[var(--color-text-primary)]',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'text-[var(--font-size-body-sm)]', // 14px
        sm: 'text-[var(--font-size-body-xs)]',      // 13px
        xs: 'text-[12px]',                          // 12px
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
