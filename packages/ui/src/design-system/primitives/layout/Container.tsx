'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

export const containerVariants = cva('w-full', {
  variants: {
    size: { sm: 'max-w-screen-sm', md: 'max-w-screen-md', lg: 'max-w-screen-lg', xl: 'max-w-screen-xl', '2xl': 'max-w-screen-2xl', full: 'max-w-full' },
    center: { true: 'mx-auto', false: '' },
    px: { none: 'px-0', sm: 'px-4', md: 'px-6 md:px-8', lg: 'px-8 md:px-12' },
  },
  defaultVariants: { size: 'lg', center: true, px: 'md' },
});

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size, center, px, className, children, ...props }, ref) => (
    <div ref={ref} className={cn(containerVariants({ size, center, px }), className)} {...props}>
      {children}
    </div>
  )
);
Container.displayName = 'Container';
