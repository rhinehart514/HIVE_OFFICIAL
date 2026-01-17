'use client';

/**
 * DisplayText Primitive
 * LOCKED: January 2026
 *
 * Hero headlines using Clash Display font with locked token application.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const displayTextVariants = cva(
  // Base: Clash Display, tight tracking, primary text
  [
    'font-[var(--font-display)]',
    'font-semibold',
    'tracking-[var(--letter-spacing-display)]',
    'text-[var(--color-text-primary)]',
    'leading-none',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'text-[var(--font-size-display-lg)]', // 72px
        sm: 'text-[var(--font-size-display-md)]',      // 48px
        xs: 'text-[var(--font-size-display-sm)]',      // 36px
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface DisplayTextProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof displayTextVariants> {
  /** Render as different element (default: h1) */
  as?: 'h1' | 'h2' | 'span' | 'div';
}

const DisplayText = React.forwardRef<HTMLHeadingElement, DisplayTextProps>(
  ({ className, size, as: Component = 'h1', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(displayTextVariants({ size }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

DisplayText.displayName = 'DisplayText';

export { DisplayText, displayTextVariants };
