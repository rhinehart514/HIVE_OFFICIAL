'use client';

import * as React from 'react';

import { cn } from '../../../lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Use pulse instead of shimmer (for reduced motion) */
  variant?: 'shimmer' | 'pulse';
  /** Add subtle honeycomb texture for brand identity */
  branded?: boolean;
};

/**
 * Creates a subtle hex pattern for skeleton backgrounds
 */
function HexPattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn('absolute inset-0 w-full h-full opacity-[0.02]', className)}
      viewBox="0 0 40 35"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="skeleton-hex" width="40" height="35" patternUnits="userSpaceOnUse">
          <path
            d="M20 0L40 10v15L20 35 0 25V10L20 0z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#skeleton-hex)" />
    </svg>
  );
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'shimmer', branded = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md bg-[#1A1A1A] relative overflow-hidden',
          variant === 'pulse' && 'animate-pulse',
          className
        )}
        {...props}
      >
        {/* Subtle honeycomb texture for branded skeletons */}
        {branded && <HexPattern className="text-white" />}

        {variant === 'shimmer' && (
          <div
            className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
