/**
 * Post Composer Loading Skeleton
 *
 * Skeleton loader for the post creation composer.
 * Matches the layout of the actual PostComposer component.
 *
 * @module post-composer-skeleton
 * @since 1.0.0
 */

'use client';

import React from 'react';
import { Skeleton } from '../../00-Global/atoms/skeleton';
import { cn } from '../../../lib/utils';

export interface PostComposerSkeletonProps {
  /** Show media upload section */
  showMedia?: boolean;

  /** Variant (full or compact) */
  variant?: 'full' | 'compact';

  /** Custom className */
  className?: string;
}

/**
 * Post Composer Skeleton
 *
 * @example
 * ```tsx
 * if (isLoadingComposer) {
 *   return <PostComposerSkeleton showMedia />;
 * }
 * ```
 */
export function PostComposerSkeleton({
  showMedia = false,
  variant = 'full',
  className,
}: PostComposerSkeletonProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'rounded-lg border',
        'bg-[var(--hive-background-primary)]',
        'border-[var(--hive-border-primary)]',
        'p-4',
        className
      )}
      role="status"
      aria-label="Loading post composer"
    >
      {/* Header: Avatar + Input */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

        {/* Text Input */}
        <div className="flex-1 space-y-2">
          <Skeleton className={cn('w-full', isCompact ? 'h-10' : 'h-24')} />
        </div>
      </div>

      {/* Media Upload Area (if showMedia) */}
      {showMedia && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
          </div>
        </div>
      )}

      {/* Footer: Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--hive-border-secondary)] pt-4">
        {/* Left: Media/Poll/Location buttons */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>

        {/* Right: Submit button */}
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Compact Post Input Skeleton (for inline use)
 *
 * @example
 * ```tsx
 * <CompactPostInputSkeleton />
 * ```
 */
export function CompactPostInputSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-full border',
        'bg-[var(--hive-background-primary)]',
        'border-[var(--hive-border-primary)]',
        'px-4 py-3',
        'cursor-not-allowed opacity-70',
        className
      )}
      role="status"
      aria-label="Loading post input"
    >
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <Skeleton className="h-5 w-full max-w-xs rounded-full" />
    </div>
  );
}
