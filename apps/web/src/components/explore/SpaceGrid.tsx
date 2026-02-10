'use client';

/**
 * SpaceGrid - Grid of spaces for discovery
 *
 * Combines claimed and ghost (unclaimed) spaces.
 * Shows activity signals and claim CTAs.
 * Uses stagger container for orchestrated reveals.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Plus, Search } from 'lucide-react';
import { SpaceCard, type SpaceCardData } from './SpaceCard';
import { GhostSpaceCard, type GhostSpaceData } from './GhostSpaceCard';
import { Button } from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';

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

  // Empty state with helpful guidance
  if (spaces.length === 0 && ghostSpaces.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.standard, ease: MOTION.ease.premium }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div
         
          className="p-8 rounded-lg max-w-md w-full text-center"
        >
          {/* Icon */}
          <motion.div
            className="w-14 h-14 rounded-lg bg-white/[0.06] flex items-center justify-center mx-auto mb-5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {searchQuery ? (
              <Search className="w-6 h-6 text-white/50" />
            ) : (
              <Users className="w-6 h-6 text-white/50" />
            )}
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-body-lg font-medium text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            {searchQuery
              ? `No spaces match "${searchQuery}"`
              : 'Your campus is waiting'}
          </motion.h3>

          {/* Subtitle */}
          <motion.p
            className="text-body-sm text-white/50 mb-6 max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            {searchQuery
              ? 'Try a different search term or browse all spaces'
              : 'Be the first to create a space for your community, club, or interest group'}
          </motion.p>

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
          >
            {searchQuery ? (
              <Button variant="default" size="sm" asChild>
                <Link href="/discover">Browse All Spaces</Link>
              </Button>
            ) : (
              <>
                <Button variant="cta" size="sm" asChild>
                  <Link href="/spaces/new">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create a Space
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/discover?tab=people">Find Classmates</Link>
                </Button>
              </>
            )}
          </motion.div>

          {/* Helpful hint */}
          {!searchQuery && (
            <motion.p
              className="text-label text-white/25 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              Clubs, study groups, and communities all start here
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Claimed Spaces */}
      {spaces.length > 0 && (
        <motion.div
          className="space-y-4"
          initial="initial"
          animate="animate"
        >
          <motion.h3
            className="text-label text-white/50 uppercase tracking-wider"
          >
            Active Spaces · {spaces.length}
          </motion.h3>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* Ghost Spaces */}
      {ghostSpaces.length > 0 && (
        <motion.div
          className="space-y-4"
          initial="initial"
          animate="animate"
        >
          <motion.h3
            className="text-label text-white/50 uppercase tracking-wider"
          >
            Waiting for Leaders · {ghostSpaces.length}
          </motion.h3>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {ghostSpaces.map((space) => (
              <GhostSpaceCard key={space.id} space={space} />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

function SpaceCardSkeleton() {
  return (
    <div className="p-5 rounded-lg bg-white/[0.06] border border-white/[0.06]">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-white/[0.06] rounded" />
            <div className="h-3 w-20 bg-white/[0.06] rounded" />
          </div>
          <div className="w-8 h-4 bg-white/[0.06] rounded" />
        </div>
        <div className="h-3 w-full bg-white/[0.06] rounded" />
        <div className="h-3 w-2/3 bg-white/[0.06] rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-24 bg-white/[0.06] rounded" />
          <div className="h-5 w-16 bg-white/[0.06] rounded-full" />
        </div>
      </div>
    </div>
  );
}
