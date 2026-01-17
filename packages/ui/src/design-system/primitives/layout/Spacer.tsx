'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export const spacerVariants = cva('block w-full', {
  variants: {
    size: { xs: 'h-2', sm: 'h-4', md: 'h-8', lg: 'h-12', xl: 'h-16', '2xl': 'h-24', '3xl': 'h-32' },
  },
  defaultVariants: { size: 'md' },
});

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof spacerVariants> {}

export const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ size, className, ...props }, ref) => <div ref={ref} aria-hidden="true" className={cn(spacerVariants({ size }), className)} {...props} />
);
Spacer.displayName = 'Spacer';
