'use client';

/**
 * SpacesDiscoveryGrid - Responsive grid of space cards with stagger animations
 *
 * Design Token Compliance:
 * - Grid: Responsive columns (1 on mobile, 2 on tablet+)
 * - Motion: Stagger animation on load and category change
 * - Gap: gap-3 (12px)
 *
 * Features:
 * - Staggered card entrance animations
 * - Empty state handling
 * - Loading skeleton support
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { cn } from '../../../lib/utils';
import { springPresets, staggerPresets } from '@hive/tokens';
import { SpaceDiscoveryCard, type SpaceDiscoveryCardData } from '../molecules/space-discovery-card';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerPresets.default,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

export interface SpacesDiscoveryGridProps {
  /** Array of spaces to display */
  spaces: SpaceDiscoveryCardData[];
  /** Callback when join is clicked */
  onJoin?: (spaceId: string) => void;
  /** Callback when a space card is clicked */
  onSpaceClick?: (spaceId: string) => void;
  /** Number of columns (auto-responsive if not set) */
  columns?: 1 | 2 | 3;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  /** Set of space IDs currently being joined */
  joiningIds?: Set<string>;
  /** Optional className */
  className?: string;
}

// Skeleton card for loading state
function SpaceCardSkeleton() {
  return (
    <div className="bg-[#141414]/50 border border-[#2A2A2A]/50 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-[#1A1A1A]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-[#1A1A1A] rounded" />
          <div className="h-3 w-24 bg-[#1A1A1A]/60 rounded" />
        </div>
        <div className="h-8 w-16 bg-[#1A1A1A] rounded-lg" />
      </div>
      <div className="mt-3 pt-3 border-t border-[#2A2A2A]/50">
        <div className="h-4 w-20 bg-[#1A1A1A]/40 rounded" />
      </div>
    </div>
  );
}

export function SpacesDiscoveryGrid({
  spaces,
  onJoin,
  onSpaceClick,
  columns,
  isLoading = false,
  skeletonCount = 6,
  joiningIds = new Set(),
  className,
}: SpacesDiscoveryGridProps) {
  const shouldReduceMotion = useReducedMotion();

  const gridCols = columns
    ? {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      }[columns]
    : 'grid-cols-1 md:grid-cols-2';

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('grid gap-3', gridCols, className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SpaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (spaces.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-[#A1A1A6]">No spaces found</p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn('grid gap-3', gridCols, className)}
      variants={shouldReduceMotion ? {} : containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {spaces.map((space) => (
          <motion.div
            key={space.id}
            variants={shouldReduceMotion ? {} : itemVariants}
            exit={shouldReduceMotion ? {} : itemVariants.exit}
            layout={!shouldReduceMotion}
          >
            <SpaceDiscoveryCard
              space={space}
              onJoin={onJoin}
              onClick={() => onSpaceClick?.(space.id)}
              isJoining={joiningIds.has(space.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export default SpacesDiscoveryGrid;
