'use client';

/**
 * SpacesHeroSection - Bento grid layout for featured spaces
 *
 * Layout:
 * ┌─────────────────────────────────┬───────────────┐
 * │                                 │   [Card 2]    │
 * │       [Hero Card 1]             │   compact     │
 * │       col-span-2                ├───────────────┤
 * │       row-span-2                │   [Card 3]    │
 * │       min-h-[320px]             │   compact     │
 * └─────────────────────────────────┴───────────────┘
 *
 * Design Token Compliance:
 * - Grid: grid-cols-3 gap-4
 * - Motion: Stagger animation on load
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { cn } from '../../../lib/utils';
import { springPresets, staggerPresets } from '@hive/tokens';
import { SpaceHeroCard, type SpaceHeroCardData } from '../molecules/space-hero-card';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerPresets.default,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.snappy,
  },
};

export interface SpacesHeroSectionProps {
  /** Array of featured spaces (uses first 3) */
  spaces: SpaceHeroCardData[];
  /** Callback when join is clicked */
  onJoin?: (spaceId: string) => void;
  /** Callback when a space card is clicked */
  onSpaceClick?: (spaceId: string) => void;
  /** Optional className */
  className?: string;
}

export function SpacesHeroSection({
  spaces,
  onJoin,
  onSpaceClick,
  className,
}: SpacesHeroSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  // Take first 3 spaces for the bento grid
  const heroSpace = spaces[0];
  const secondarySpaces = spaces.slice(1, 3);

  if (!heroSpace) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        // Mobile: stack vertically, Tablet+: bento grid
        'grid grid-cols-1 md:grid-cols-3 gap-4',
        className
      )}
      variants={shouldReduceMotion ? {} : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Large hero card - full width on mobile, col-span-2 row-span-2 on tablet+ */}
      <motion.div
        className="md:col-span-2 md:row-span-2"
        variants={shouldReduceMotion ? {} : itemVariants}
      >
        <SpaceHeroCard
          space={heroSpace}
          variant="large"
          onJoin={onJoin}
          onClick={() => onSpaceClick?.(heroSpace.id)}
          showMetrics
          className="h-full min-h-[240px] md:min-h-[320px]"
        />
      </motion.div>

      {/* Secondary cards - horizontal on mobile, stacked vertically on tablet+ */}
      <div className="grid grid-cols-2 md:grid-cols-1 md:col-span-1 md:flex md:flex-col gap-4">
        <AnimatePresence>
          {secondarySpaces.map((space) => (
            <motion.div
              key={space.id}
              variants={shouldReduceMotion ? {} : itemVariants}
              className="md:flex-1"
            >
              <SpaceHeroCard
                space={space}
                variant="compact"
                onJoin={onJoin}
                onClick={() => onSpaceClick?.(space.id)}
                showMetrics
                className="h-full min-h-[140px] md:min-h-0"
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Placeholder if only 1 or 2 spaces */}
        {secondarySpaces.length < 2 && (
          <div className="hidden md:flex flex-1 rounded-2xl border border-dashed border-[#2A2A2A] items-center justify-center">
            <span className="text-sm text-[#A1A1A6]">More spaces coming...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SpacesHeroSection;
