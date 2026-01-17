'use client';

/**
 * Text Primitive
 * LOCKED: January 2026
 *
 * Body copy using Geist font with locked token application.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const textVariants = cva(
  // Base: Geist font, normal weight
  [
    'font-[var(--font-body)]',
    'font-normal',
    'text-[var(--color-text-primary)]',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'text-[var(--font-size-body-md)] leading-[var(--line-height-normal)]', // 16px
        sm: 'text-[var(--font-size-body-sm)] leading-[var(--line-height-normal)]',      // 14px
        xs: 'text-[var(--font-size-body-xs)] leading-[var(--line-height-snug)]',        // 13px
        lg: 'text-[var(--font-size-body-lg)] leading-[var(--line-height-relaxed)]',     // 18px
      },
      tone: {
        primary: 'text-[var(--color-text-primary)]',
        secondary: 'text-[var(--color-text-secondary)]',
        muted: 'text-[var(--color-text-muted)]',
        subtle: 'text-[var(--color-text-subtle)]',
        inverse: 'text-[var(--color-text-inverse)]',
        error: 'text-[var(--color-status-error)]',
        success: 'text-[var(--color-status-success)]',
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
      },
      truncate: {
        true: 'overflow-hidden text-ellipsis whitespace-nowrap',
      },
    },
    defaultVariants: {
      size: 'default',
      tone: 'primary',
      weight: 'normal',
    },
  }
);

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  /** Render as different element (default: p) */
  as?: 'p' | 'span' | 'div' | 'label';
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, tone, weight, truncate, as: tag = 'p', children, ...props }, ref) => {
    // Use createElement for polymorphic support
    return React.createElement(
      tag,
      {
        ref,
        className: cn(textVariants({ size, tone, weight, truncate }), className),
        ...props,
      },
      children
    );
  }
);

Text.displayName = 'Text';

export { Text, textVariants };
