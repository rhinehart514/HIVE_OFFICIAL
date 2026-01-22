'use client';

/**
 * SpaceGrid - Grid of spaces for discovery
 *
 * Combines claimed and ghost (unclaimed) spaces.
 * Shows activity signals and claim CTAs.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { SpaceCard, type SpaceCardData } from './SpaceCard';
import { GhostSpaceCard, type GhostSpaceData } from './GhostSpaceCard';
import { MOTION } from '@hive/ui/design-system/primitives';

export interface SpaceGridProps {
  spaces: SpaceCardData[];
  ghostSpaces?: GhostSpaceData[];
  loading?: boolean;
  searchQuery?: string;
}

export function SpaceGrid({
  spaces,
  ghostSpaces = [],
  loading,
  searchQuery,
}: SpaceGridProps) {
  // Show loading skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SpaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (spaces.length === 0 && ghostSpaces.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center py-16"
      >
        <p className="text-white/40 text-[15px] mb-2">
          {searchQuery
            ? `No spaces match "${searchQuery}"`
            : 'No spaces yet'}
        </p>
        <p className="text-white/25 text-[13px]">
          {searchQuery
            ? 'Try a different search'
            : 'Be the first to start a space'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Claimed Spaces */}
      {spaces.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[12px] text-white/40 uppercase tracking-wider">
            Active Spaces · {spaces.length}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map((space, i) => (
              <SpaceCard key={space.id} space={space} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Ghost Spaces */}
      {ghostSpaces.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[12px] text-white/40 uppercase tracking-wider">
            Waiting for Leaders · {ghostSpaces.length}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ghostSpaces.map((space, i) => (
              <GhostSpaceCard
                key={space.id}
                space={space}
                index={spaces.length + i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

function SpaceCardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-white/[0.06] rounded" />
            <div className="h-3 w-20 bg-white/[0.04] rounded" />
          </div>
          <div className="w-8 h-4 bg-white/[0.04] rounded" />
        </div>
        <div className="h-3 w-full bg-white/[0.04] rounded" />
        <div className="h-3 w-2/3 bg-white/[0.04] rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-24 bg-white/[0.04] rounded" />
          <div className="h-5 w-16 bg-white/[0.04] rounded-full" />
        </div>
      </div>
    </div>
  );
}
