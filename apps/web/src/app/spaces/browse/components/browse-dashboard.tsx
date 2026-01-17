'use client';

/**
 * Browse Dashboard Components
 *
 * Components for the "Your Spaces" dashboard view (returning users).
 * Uses HIVE design system primitives.
 *
 * @version 4.1.0 - Primitives integration (Jan 2026)
 */

import * as React from 'react';
import { motion, type Variants, type Transition } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';

// Design system primitives
import {
  Button,
  Text,
  Heading,
} from '@hive/ui/design-system/primitives';

import { SpaceDashboardCard, SpaceDashboardCardSkeleton } from './space-dashboard-card';
import { NeighborhoodCard } from './browse-cards';
import type { MySpace, FriendsSpace, SpaceSearchResult } from '../hooks';

// ============================================================
// Your Spaces Section (Dashboard)
// ============================================================

interface YourSpacesSectionProps {
  spaces: MySpace[];
  loading: boolean;
  staggerContainer: Variants;
  onNavigate: (spaceId: string) => void;
  onFindMore: () => void;
}

export function YourSpacesSection({
  spaces,
  loading,
  staggerContainer,
  onNavigate,
  onFindMore,
}: YourSpacesSectionProps) {
  if (loading) {
    return (
      <div className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <SpaceDashboardCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (spaces.length === 0) {
    return null;
  }

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mb-10"
    >
      {/* Grid - no section header since main hero has it */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {spaces.map((space, index) => (
          <motion.div
            key={space.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ delay: index * 0.05 }}
          >
            <SpaceDashboardCard
              space={space}
              onOpen={() => onNavigate(space.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ============================================================
// Friends' Spaces Section
// ============================================================

interface FriendsSpacesSectionProps {
  spaces: FriendsSpace[];
  loading: boolean;
  staggerContainer: Variants;
  snapVariants: Variants;
  onNavigate: (spaceId: string) => void;
  onJoin: (spaceId: string) => Promise<void>;
}

export function FriendsSpacesSection({
  spaces,
  loading,
  staggerContainer,
  snapVariants,
  onNavigate,
  onJoin,
}: FriendsSpacesSectionProps) {
  if (loading || spaces.length === 0) {
    return null; // Hidden when empty per plan
  }

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mb-8"
    >
      <h2 className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-4">
        Friends are in
      </h2>

      {/* Mobile: Horizontal scroll */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-6 px-6">
        <div className="flex gap-3 pb-4">
          {spaces.slice(0, 6).map((space) => (
            <NeighborhoodCard
              key={space.id}
              space={space as SpaceSearchResult}
              onClick={() => onNavigate(space.id)}
              onJoin={() => onJoin(space.id)}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {spaces.slice(0, 8).map((space) => (
          <motion.div key={space.id} variants={snapVariants}>
            <NeighborhoodCard
              space={space as SpaceSearchResult}
              onClick={() => onNavigate(space.id)}
              onJoin={() => onJoin(space.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ============================================================
// Dashboard Content (Full View for Returning Users)
// ============================================================

interface DashboardContentProps {
  mySpaces: MySpace[];
  friendsSpaces: FriendsSpace[];
  mySpacesLoading: boolean;
  friendsLoading: boolean;
  staggerContainer: Variants;
  snapVariants: Variants;
  snapSpring: Transition;
  onNavigate: (spaceId: string) => void;
  onJoin: (spaceId: string) => Promise<void>;
  onFindMore: () => void;
}

export function DashboardContent({
  mySpaces,
  friendsSpaces,
  mySpacesLoading,
  friendsLoading,
  staggerContainer,
  snapVariants,
  snapSpring,
  onNavigate,
  onJoin,
  onFindMore,
}: DashboardContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={snapSpring}
    >
      {/* Your Spaces */}
      <YourSpacesSection
        spaces={mySpaces}
        loading={mySpacesLoading}
        staggerContainer={staggerContainer}
        onNavigate={onNavigate}
        onFindMore={onFindMore}
      />

      {/* Explore CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center mb-12"
      >
        <button
          onClick={onFindMore}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-full
            text-[14px] font-medium text-[#A3A19E]
            bg-white/[0.04] border border-white/[0.08]
            hover:bg-white/[0.08] hover:text-[#FAF9F7] hover:border-white/[0.12]
            transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
          "
        >
          <PlusIcon className="w-4 h-4" />
          Explore more spaces
        </button>
      </motion.div>

      {/* Friends' Spaces (you're not in) */}
      <FriendsSpacesSection
        spaces={friendsSpaces}
        loading={friendsLoading}
        staggerContainer={staggerContainer}
        snapVariants={snapVariants}
        onNavigate={onNavigate}
        onJoin={onJoin}
      />
    </motion.div>
  );
}
