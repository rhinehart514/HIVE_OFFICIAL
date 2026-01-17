'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export const clusterVariants = cva('flex flex-row', {
  variants: {
    gap: { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' },
    align: { start: 'items-start', center: 'items-center', end: 'items-end', baseline: 'items-baseline', stretch: 'items-stretch' },
    justify: { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around', evenly: 'justify-evenly' },
    wrap: { true: 'flex-wrap', false: 'flex-nowrap' },
  },
  defaultVariants: { gap: 'sm', align: 'center', justify: 'start', wrap: false },
});

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof clusterVariants> {}

export const Cluster = React.forwardRef<HTMLDivElement, ClusterProps>(
  ({ gap, align, justify, wrap, className, children, ...props }, ref) => (
    <div ref={ref} className={cn(clusterVariants({ gap, align, justify, wrap }), className)} {...props}>
      {children}
    </div>
  )
);
Cluster.displayName = 'Cluster';
