/**
 * Space Board Loading Skeleton
 *
 * Skeleton loader for space board with 2-column layout.
 * Shows main feed area + right rail with widgets.
 *
 * @module space-board-skeleton
 * @since 1.0.0
 */

'use client';

import React from 'react';
import { Skeleton } from '../../00-Global/atoms/skeleton';
import { cn } from '../../../lib/utils';

export interface SpaceBoardSkeletonProps {
  /** Number of post skeletons to show (default: 5) */
  count?: number;

  /** Show right rail widgets (default: true) */
  showRightRail?: boolean;

  /** Show pinned posts section (default: true) */
  showPinned?: boolean;

  /** Custom className */
  className?: string;
}

/**
 * Space Board Skeleton
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <SpaceBoardSkeleton count={5} showRightRail />;
 * }
 * ```
 */
export function SpaceBoardSkeleton({
  count = 5,
  showRightRail = true,
  showPinned = true,
  className,
}: SpaceBoardSkeletonProps) {
  return (
    <div
      className={cn('container mx-auto px-4 py-6', className)}
      role="status"
      aria-label="Loading space board"
    >
      {/* Space Header */}
      <div className="mb-6">
        {/* Cover Image */}
        <Skeleton className="h-48 w-full rounded-t-lg" />

        {/* Space Info */}
        <div className="rounded-b-lg border border-t-0 border-[var(--hive-border-primary)] bg-[var(--hive-background-primary)] p-6">
          <div className="flex items-start justify-between">
            {/* Left: Space details */}
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" /> {/* Title */}
              <Skeleton className="h-4 w-96" /> {/* Description */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" /> {/* Member count */}
                <Skeleton className="h-4 w-24" /> {/* Post count */}
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-32 rounded-md" /> {/* Join button */}
              <Skeleton className="h-10 w-10 rounded-md" /> {/* More menu */}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main Feed Column */}
        <div className="space-y-6">
          {/* Pinned Posts */}
          {showPinned && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" /> {/* "Pinned" label */}
              <div className="space-y-3">
                <SpaceBoardPostSkeleton isPinned />
                <SpaceBoardPostSkeleton isPinned />
              </div>
            </div>
          )}

          {/* Post Composer */}
          <div className="rounded-lg border border-[var(--hive-border-primary)] bg-[var(--hive-background-primary)] p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <Skeleton className="h-10 flex-1 rounded-full" />
            </div>
          </div>

          {/* Regular Posts */}
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <SpaceBoardPostSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Right Rail */}
        {showRightRail && (
          <div className="space-y-4">
            {/* About Widget */}
            <SpaceBoardWidgetSkeleton title="About" />

            {/* Events Widget */}
            <SpaceBoardWidgetSkeleton title="Upcoming Events" />

            {/* Members Widget */}
            <SpaceBoardWidgetSkeleton title="Members" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual post skeleton for space board
 */
function SpaceBoardPostSkeleton({ isPinned = false }: { isPinned?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        'bg-[var(--hive-background-primary)]',
        'border-[var(--hive-border-primary)]',
        isPinned && 'border-[var(--hive-accent-gold)]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" /> {/* Avatar */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" /> {/* Author name */}
            <Skeleton className="h-3 w-20" /> {/* Timestamp */}
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded" /> {/* More menu */}
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <Skeleton className="h-8 w-16 rounded" /> {/* Upvote */}
        <Skeleton className="h-8 w-20 rounded" /> {/* Comment */}
        <Skeleton className="h-8 w-16 rounded" /> {/* Share */}
      </div>
    </div>
  );
}

/**
 * Right rail widget skeleton
 */
function SpaceBoardWidgetSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-[var(--hive-border-primary)] bg-[var(--hive-background-primary)] p-4">
      {/* Widget title */}
      <Skeleton className="h-5 w-32 mb-4" />

      {/* Widget content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

/**
 * Compact Space Card Skeleton (for discovery grid)
 *
 * @example
 * ```tsx
 * <div className="grid grid-cols-3 gap-4">
 *   {Array.from({ length: 9 }).map((_, i) => (
 *     <SpaceCardSkeleton key={i} />
 *   ))}
 * </div>
 * ```
 */
export function SpaceCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden',
        'bg-[var(--hive-background-primary)]',
        'border-[var(--hive-border-primary)]',
        className
      )}
      role="status"
      aria-label="Loading space"
    >
      {/* Cover Image */}
      <Skeleton className="aspect-video w-full" />

      {/* Content */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" /> {/* Space name */}
        <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
        <Skeleton className="h-4 w-5/6" /> {/* Description line 2 */}

        {/* Metadata */}
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-3 w-20" /> {/* Member count */}
          <Skeleton className="h-3 w-16" /> {/* Post count */}
        </div>

        {/* Join button */}
        <Skeleton className="h-9 w-full rounded-md mt-4" />
      </div>
    </div>
  );
}
