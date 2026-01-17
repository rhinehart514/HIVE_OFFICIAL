'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export const stackVariants = cva('flex flex-col', {
  variants: {
    gap: { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8', '2xl': 'gap-12', '3xl': 'gap-16' },
    align: { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' },
    justify: { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' },
  },
  defaultVariants: { gap: 'md', align: 'stretch', justify: 'start' },
});

export interface StackProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof stackVariants> {}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap, align, justify, className, children, ...props }, ref) => (
    <div ref={ref} className={cn(stackVariants({ gap, align, justify }), className)} {...props}>
      {children}
    </div>
  )
);
Stack.displayName = 'Stack';
