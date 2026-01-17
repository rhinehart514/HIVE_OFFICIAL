'use client';

/**
 * Skeleton Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Staggered wave animation (opacity pulse with delay)
 * Premium loading state that feels alive, not generic.
 *
 * Recipe:
 *   animation: Staggered wave (opacity 0.5 → 1 → 0.5)
 *   duration: 1.5s per cycle
 *   stagger: 0.15s between elements
 *   base: rgba(255,255,255,0.08)
 *   radius: rounded (4px) for text, rounded-lg for avatars/cards
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Staggered wave keyframes (added via style tag or CSS)
const skeletonKeyframes = `
@keyframes skeleton-wave {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
`;

const skeletonVariants = cva(
  [
    'bg-white/[0.08]',
  ].join(' '),
  {
    variants: {
      variant: {
        // Default: Rectangle for general use
        default: 'rounded',
        // Circle: For avatars (matches Avatar rounded-lg)
        circle: 'rounded-lg',
        // Text: Inline text placeholder
        text: 'rounded h-4',
        // Card: Card-shaped placeholder
        card: 'rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Width (CSS value or number in px) */
  width?: string | number;
  /** Height (CSS value or number in px) */
  height?: string | number;
  /** Stagger delay index (for staggered animation) */
  staggerIndex?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, style, staggerIndex = 0, ...props }, ref) => {
    const computedStyle: React.CSSProperties = {
      ...style,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      // LOCKED: Staggered wave animation
      animation: 'skeleton-wave 1.5s ease-in-out infinite',
      animationDelay: `${staggerIndex * 0.15}s`,
    };

    return (
      <>
        <style>{skeletonKeyframes}</style>
        <div
          ref={ref}
          className={cn(skeletonVariants({ variant }), className)}
          style={computedStyle}
          {...props}
        />
      </>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton compositions with staggered animation
export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Width of last line (percentage) */
  lastLineWidth?: string;
}

const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
}) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        staggerIndex={i}
        style={{
          width: i === lines - 1 ? lastLineWidth : '100%',
        }}
      />
    ))}
  </div>
);

const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Skeleton variant="circle" width={size} height={size} />
);

const SkeletonCard: React.FC<{ height?: number }> = ({ height = 200 }) => (
  <Skeleton variant="card" width="100%" height={height} />
);

// Common skeleton patterns with staggered animation
const SkeletonListItem: React.FC<{ staggerOffset?: number }> = ({ staggerOffset = 0 }) => (
  <div className="flex items-center gap-3 p-3">
    <Skeleton variant="circle" width={40} height={40} staggerIndex={staggerOffset} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="40%" staggerIndex={staggerOffset + 1} />
      <Skeleton variant="text" width="70%" staggerIndex={staggerOffset + 2} />
    </div>
  </div>
);

const SkeletonMessageBubble: React.FC<{ align?: 'left' | 'right'; staggerOffset?: number }> = ({
  align = 'left',
  staggerOffset = 0,
}) => (
  <div
    className={cn(
      'flex gap-2',
      align === 'right' ? 'flex-row-reverse' : 'flex-row'
    )}
  >
    <Skeleton variant="circle" width={32} height={32} staggerIndex={staggerOffset} />
    <div className="space-y-1">
      <Skeleton width={200} height={60} className="rounded-xl" staggerIndex={staggerOffset + 1} />
      <Skeleton variant="text" width={60} height={12} staggerIndex={staggerOffset + 2} />
    </div>
  </div>
);

const SkeletonSpaceCard: React.FC<{ staggerOffset?: number }> = ({ staggerOffset = 0 }) => (
  <div className="rounded-xl border border-white/[0.08] overflow-hidden">
    <Skeleton height={120} className="rounded-none" staggerIndex={staggerOffset} />
    <div className="p-4 space-y-3">
      <Skeleton variant="text" width="60%" staggerIndex={staggerOffset + 1} />
      <Skeleton variant="text" width="80%" staggerIndex={staggerOffset + 2} />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton variant="circle" width={24} height={24} staggerIndex={staggerOffset + 3} />
        <Skeleton variant="text" width={80} staggerIndex={staggerOffset + 4} />
      </div>
    </div>
  </div>
);

const SkeletonProfileHeader: React.FC<{ staggerOffset?: number }> = ({ staggerOffset = 0 }) => (
  <div className="flex flex-col items-center gap-4">
    <Skeleton variant="circle" width={80} height={80} staggerIndex={staggerOffset} />
    <div className="space-y-2 text-center">
      <Skeleton variant="text" width={120} className="mx-auto" staggerIndex={staggerOffset + 1} />
      <Skeleton variant="text" width={160} className="mx-auto" staggerIndex={staggerOffset + 2} />
    </div>
  </div>
);

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListItem,
  SkeletonMessageBubble,
  SkeletonSpaceCard,
  SkeletonProfileHeader,
  skeletonVariants,
  skeletonKeyframes,
};
