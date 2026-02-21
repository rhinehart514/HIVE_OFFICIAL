'use client';

/**
 * Label Primitive
 * REFINED: Feb 9, 2026
 *
 * Form labels use a mono uppercase treatment for compact hierarchy.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const labelVariants = cva(
  // Base: Geist Mono uppercase pattern
  [
    'font-[var(--font-sans)]',
    'font-medium',
    'uppercase',
    'tracking-[0.08em]',
    'text-white/50',
    'leading-none',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'text-[11px]',
        sm: 'text-[10px]',
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-[#EF4444]",
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
