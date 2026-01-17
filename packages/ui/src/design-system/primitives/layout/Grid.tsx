'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export const gridVariants = cva('grid', {
  variants: {
    cols: { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6', auto: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]' },
    gap: { none: 'gap-0', sm: 'gap-3', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' },
  },
  defaultVariants: { cols: 3, gap: 'md' },
});

export interface GridProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof gridVariants> {
  colsSm?: 1 | 2 | 3;
  colsMd?: 1 | 2 | 3 | 4;
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ cols, gap, colsSm, colsMd, colsLg, className, children, ...props }, ref) => {
    const responsiveClasses = [
      colsSm || colsMd || colsLg ? 'grid-cols-1' : undefined,
      colsSm && `sm:grid-cols-${colsSm}`,
      colsMd && `md:grid-cols-${colsMd}`,
      colsLg ? `lg:grid-cols-${colsLg}` : cols && (colsSm || colsMd) ? `lg:grid-cols-${cols}` : undefined,
    ].filter(Boolean);
    return (
      <div ref={ref} className={cn(gridVariants({ cols: responsiveClasses.length ? undefined : cols, gap }), responsiveClasses.join(' '), className)} {...props}>
        {children}
      </div>
    );
  }
);
Grid.displayName = 'Grid';
