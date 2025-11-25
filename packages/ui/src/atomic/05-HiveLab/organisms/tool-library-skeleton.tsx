/**
 * Tool Library Loading Skeleton
 *
 * Skeleton loader for HiveLab tool library.
 * Supports grid layout for 200+ tools with virtualization.
 *
 * @module tool-library-skeleton
 * @since 1.0.0
 */

'use client';

import React from 'react';
import { Skeleton } from '../../00-Global/atoms/skeleton';
import { cn } from '../../../lib/utils';

export interface ToolLibrarySkeletonProps {
  /** Number of tool cards to show (default: 12) */
  count?: number;

  /** Show filters/search section (default: true) */
  showFilters?: boolean;

  /** Show featured tools section (default: true) */
  showFeatured?: boolean;

  /** Grid columns (default: 3) */
  columns?: 2 | 3 | 4;

  /** Custom className */
  className?: string;
}

/**
 * Tool Library Skeleton
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <ToolLibrarySkeleton count={12} columns={3} />;
 * }
 * ```
 */
export function ToolLibrarySkeleton({
  count = 12,
  showFilters = true,
  showFeatured = true,
  columns = 3,
  className,
}: ToolLibrarySkeletonProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div
      className={cn('container mx-auto px-4 py-6', className)}
      role="status"
      aria-label="Loading tool library"
    >
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" /> {/* Title */}
        <Skeleton className="h-5 w-96" /> {/* Description */}
      </div>

      {/* Filters & Search */}
      {showFilters && (
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <Skeleton className="h-10 w-full md:w-80 rounded-md" />

          {/* Category Filter */}
          <Skeleton className="h-10 w-40 rounded-md" />

          {/* Type Filter */}
          <Skeleton className="h-10 w-32 rounded-md" />

          {/* Sort */}
          <Skeleton className="h-10 w-32 rounded-md ml-auto" />
        </div>
      )}

      {/* Featured Tools */}
      {showFeatured && (
        <div className="mb-8">
          <Skeleton className="h-6 w-40 mb-4" /> {/* Section title */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <FeaturedToolCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* All Tools Grid */}
      <div className="mb-6">
        <Skeleton className="h-6 w-32 mb-4" /> {/* Section title */}
      </div>

      <div className={cn('grid gap-4', gridCols[columns])}>
        {Array.from({ length: count }).map((_, i) => (
          <ToolCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual tool card skeleton
 */
export function ToolCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        'bg-[var(--hive-background-primary)]',
        'border-[var(--hive-border-primary)]',
        'hover:border-[var(--hive-border-hover)]',
        'transition-colors',
        className
      )}
      role="status"
      aria-label="Loading tool"
    >
      {/* Icon & Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Tool Icon */}
        <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />

        {/* Title & Category */}
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-full" /> {/* Tool name */}
          <Skeleton className="h-3 w-20 rounded-full" /> {/* Category badge */}
        </div>

        {/* More menu */}
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        <Skeleton className="h-3 w-16" /> {/* Usage count */}
        <Skeleton className="h-3 w-20" /> {/* Creator */}
      </div>

      {/* Footer: Tags */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-[var(--hive-border-secondary)]">
        <Skeleton className="h-9 flex-1 rounded-md" /> {/* Use tool */}
        <Skeleton className="h-9 w-9 rounded-md" /> {/* Favorite */}
      </div>
    </div>
  );
}

/**
 * Featured tool card skeleton (larger format)
 */
function FeaturedToolCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden',
        'bg-[var(--hive-background-primary)]',
        'border-[var(--hive-border-primary)]',
        className
      )}
      role="status"
      aria-label="Loading featured tool"
    >
      {/* Banner */}
      <Skeleton className="h-24 w-full" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Icon */}
        <Skeleton className="h-12 w-12 rounded-md -mt-10 border-2 border-[var(--hive-background-primary)]" />

        {/* Title */}
        <Skeleton className="h-5 w-full" />

        {/* Description */}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />

        {/* Use button */}
        <Skeleton className="h-9 w-full rounded-md mt-4" />
      </div>
    </div>
  );
}

/**
 * Tool execution skeleton (for when a tool is running)
 *
 * @example
 * ```tsx
 * if (isExecuting) {
 *   return <ToolExecutionSkeleton toolName="Event RSVP Tracker" />;
 * }
 * ```
 */
export function ToolExecutionSkeleton({
  toolName,
  className,
}: {
  toolName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-6',
        'bg-[var(--hive-background-primary)]',
        'border-[var(--hive-border-primary)]',
        className
      )}
      role="status"
      aria-label={`Executing ${toolName || 'tool'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" /> {/* Tool name */}
          <Skeleton className="h-4 w-32" /> {/* Status */}
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" /> {/* Label */}
          <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-28" /> {/* Label */}
          <Skeleton className="h-24 w-full rounded-md" /> {/* Textarea */}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-10 w-24 rounded-md" /> {/* Cancel */}
        <Skeleton className="h-10 w-32 rounded-md" /> {/* Submit */}
      </div>
    </div>
  );
}

/**
 * Compact tool list item skeleton (for list view)
 *
 * @example
 * ```tsx
 * <div className="space-y-2">
 *   {Array.from({ length: 10 }).map((_, i) => (
 *     <ToolListItemSkeleton key={i} />
 *   ))}
 * </div>
 * ```
 */
export function ToolListItemSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-[var(--hive-background-primary)]',
        'border border-[var(--hive-border-primary)]',
        className
      )}
      role="status"
      aria-label="Loading tool"
    >
      <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}
