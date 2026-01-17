'use client';

/**
 * Heading Primitive
 * LOCKED: January 2026
 *
 * Section headers. Clash Display for h1-h2, Geist for h3-h6.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const headingVariants = cva(
  // Base: Primary text color
  'text-[var(--color-text-primary)]',
  {
    variants: {
      level: {
        1: [
          'font-[var(--font-display)]',
          'text-[var(--font-size-heading-xl)]', // 36px
          'font-semibold',
          'leading-[1.2]',
          'tracking-[var(--letter-spacing-heading)]', // -0.01em
        ].join(' '),
        2: [
          'font-[var(--font-display)]',
          'text-[var(--font-size-heading-lg)]', // 28px
          'font-semibold',
          'leading-[1.25]',
          'tracking-[var(--letter-spacing-heading)]',
        ].join(' '),
        3: [
          'font-[var(--font-body)]',
          'text-[var(--font-size-heading-md)]', // 22px
          'font-semibold',
          'leading-[1.3]',
        ].join(' '),
        4: [
          'font-[var(--font-body)]',
          'text-[var(--font-size-heading-sm)]', // 18px
          'font-semibold',
          'leading-[1.35]',
        ].join(' '),
        5: [
          'font-[var(--font-body)]',
          'text-[var(--font-size-body-lg)]', // 16px
          'font-semibold',
          'leading-[1.4]',
        ].join(' '),
        6: [
          'font-[var(--font-body)]',
          'text-[var(--font-size-body-md)]', // 14px
          'font-semibold',
          'leading-[1.4]',
        ].join(' '),
      },
    },
    defaultVariants: {
      level: 2,
    },
  }
);

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  /** Render as different element (defaults to matching level) */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, as, children, ...props }, ref) => {
    // Default element matches level
    const tag = as || `h${level}`;

    // Use createElement for polymorphic support
    return React.createElement(
      tag,
      {
        ref,
        className: cn(headingVariants({ level }), className),
        ...props,
      },
      children
    );
  }
);

Heading.displayName = 'Heading';

export { Heading, headingVariants };
