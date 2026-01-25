'use client';

/**
 * Label Primitive
 * LOCKED: January 2026
 *
 * Form labels using Geist font with locked token application.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const labelVariants = cva(
  // Base: Geist font, medium weight, secondary color
  [
    'font-[var(--font-body)]',
    'font-medium',
    'text-[var(--color-text-secondary)]',
    'leading-none',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'text-[var(--font-size-body-xs)]', // 13px
        sm: 'text-label',                          // 12px
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-[var(--color-status-error)]",
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, required, disabled, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ size, required, disabled }), className)}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label, labelVariants };
