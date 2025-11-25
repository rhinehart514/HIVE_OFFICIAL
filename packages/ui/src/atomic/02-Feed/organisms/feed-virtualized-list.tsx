'use client';

import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { durationSeconds, easingArrays, staggerPresets } from '@hive/tokens';

import { cn } from '../../../lib/utils';
import { Skeleton } from '../../00-Global/atoms/skeleton';

// Animation variants for feed items
const feedItemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durationSeconds.standard,
      ease: easingArrays.default,
      delay: Math.min(index * staggerPresets.fast, 0.3), // Cap delay at 300ms
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: durationSeconds.quick,
    },
  },
};

export interface FeedItem {
  id: string;
  type: 'post' | 'event' | 'tool' | 'system';
  data: unknown;
}

export interface FeedVirtualizedListProps extends React.HTMLAttributes<HTMLDivElement> {
  items: FeedItem[];
  renderItem: (item: FeedItem, index: number) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  loadingSkeletonCount?: number;
  estimatedItemHeight?: number;
}

export const FeedVirtualizedList = React.forwardRef<HTMLDivElement, FeedVirtualizedListProps>(
  (
    {
      items,
      renderItem,
      onLoadMore,
      hasMore = false,
      isLoading = false,
      loadingSkeletonCount = 3,
      estimatedItemHeight = 200,
      className,
      ...props
    },
    forwardedRef
  ) => {
    const parentRef = React.useRef<HTMLDivElement>(null);

    // TanStack Virtual - virtualizes large lists for 60fps performance
    const virtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => estimatedItemHeight,
      overscan: 5, // Render 5 extra items above/below viewport for smooth scrolling
      gap: 16, // 4 in Tailwind (gap-4)
    });

    const virtualItems = virtualizer.getVirtualItems();

    // Infinite scroll - load more when scrolling near bottom
    React.useEffect(() => {
      const [lastItem] = [...virtualItems].reverse();

      if (!lastItem || !hasMore || isLoading) return;

      // Load more when within 5 items of the end
      if (lastItem.index >= items.length - 5) {
        onLoadMore?.();
      }
    }, [hasMore, isLoading, onLoadMore, items.length, virtualItems]);

    const setSize = items.length;

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;

        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    return (
      <div
        ref={combinedRef}
        role="feed"
        aria-busy={isLoading}
        className={cn('h-full overflow-auto', className)}
        {...props}
      >
        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hive-background-tertiary)]">
              <span className="text-2xl">📭</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--hive-text-primary)]">
                No posts yet
              </h3>
              <p className="text-sm text-[var(--hive-text-secondary)]">
                Join some spaces to see posts in your feed
              </p>
            </div>
          </div>
        )}

        {/* Virtualized Feed Items */}
        {items.length > 0 && (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <AnimatePresence mode="popLayout">
              {virtualItems.map((virtualItem) => {
                const item = items[virtualItem.index];
                if (!item) return null;

                return (
                  <motion.div
                    key={item.id}
                    role="article"
                    aria-posinset={virtualItem.index + 1}
                    aria-setsize={setSize}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    variants={feedItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={virtualItem.index % 10} // Stagger within viewport batch
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {renderItem(item, virtualItem.index)}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Loading Skeletons (shown while loading more) */}
        {isLoading && items.length > 0 && (
          <div className="flex flex-col gap-4 pt-4">
            {Array.from({ length: loadingSkeletonCount }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex flex-col gap-4 rounded-2xl border border-[color-mix(in_srgb,var(--hive-border-default) 80%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-secondary) 94%,transparent)] p-6"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* End of Feed Message */}
        {!hasMore && items.length > 0 && !isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-[var(--hive-text-tertiary)]">
              You&apos;ve reached the end of the feed
            </p>
          </div>
        )}
      </div>
    );
  }
);

FeedVirtualizedList.displayName = 'FeedVirtualizedList';
