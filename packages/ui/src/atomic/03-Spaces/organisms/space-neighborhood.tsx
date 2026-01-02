'use client';

/**
 * SpaceNeighborhood - Category cluster with SNAP reveal
 *
 * A "neighborhood" of spaces you scroll through.
 * Uses SNAP motion from landing page for punchy reveals.
 *
 * Layout: Horizontal scroll on mobile, grid on desktop
 */

import React from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { cn } from '../../../lib/utils';

// SNAP motion - matches landing page rhythm
const SNAP_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

const SECTION_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const HEADER_VARIANTS = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SNAP_SPRING,
  },
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 30, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SNAP_SPRING,
  },
};

export interface NeighborhoodSpace {
  id: string;
  name: string;
  memberCount: number;
  onlineCount?: number;
  activitySnippet?: string;
  bannerImage?: string;
  isLive?: boolean;
}

export interface SpaceNeighborhoodProps {
  /** Category/neighborhood name */
  title: string;
  /** Category key for filtering */
  categoryKey: string;
  /** Spaces in this neighborhood */
  spaces: NeighborhoodSpace[];
  /** Callback when a space is clicked */
  onSpaceClick?: (spaceId: string) => void;
  /** Callback when join is clicked */
  onJoinSpace?: (spaceId: string) => void;
  /** Callback when "View all" is clicked */
  onViewAll?: () => void;
  /** Whether more spaces exist */
  hasMore?: boolean;
  /** Additional className */
  className?: string;
}

function NeighborhoodCard({
  space,
  onClick,
  onJoin,
}: {
  space: NeighborhoodSpace;
  onClick: () => void;
  onJoin: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const monogram = space.name?.charAt(0)?.toUpperCase() || 'S';

  return (
    <motion.div
      variants={CARD_VARIANTS}
      onClick={onClick}
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-xl',
        'bg-white/[0.02] border border-white/[0.06]',
        'hover:bg-white/[0.04] hover:border-white/[0.10]',
        'transition-colors duration-200',
        'w-[260px] md:w-auto flex-shrink-0 md:flex-shrink',
        'group'
      )}
    >
      <div className="p-4">
        {/* Header: Avatar + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden',
              'bg-white/[0.04] border border-white/[0.06]',
              space.isLive && 'ring-2 ring-[#FFD700]/40 ring-offset-1 ring-offset-[#0A0A0A]'
            )}
          >
            {space.bannerImage ? (
              <img
                src={space.bannerImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white/50">{monogram}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-white text-[14px] truncate group-hover:text-white/90">
              {space.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] text-white/35">
                {space.memberCount.toLocaleString()} {space.memberCount === 1 ? 'member' : 'members'}
              </span>
              {space.isLive && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1 text-[12px] text-[#FFD700]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] shadow-[0_0_6px_rgba(255,215,0,0.6)]" />
                    Live
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Activity snippet - the life glimpse */}
        {space.activitySnippet && (
          <div className="mb-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03]">
            <p className="text-[12px] text-white/50 leading-relaxed line-clamp-2">
              "{space.activitySnippet}"
            </p>
          </div>
        )}

        {/* Online indicator */}
        {space.onlineCount && space.onlineCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-1">
              {[...Array(Math.min(space.onlineCount, 3))].map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-white/[0.08] border border-[#0A0A0A] flex items-center justify-center"
                >
                  <span className="text-[8px] text-white/40">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>
            {space.onlineCount > 3 && (
              <span className="text-[11px] text-white/30">
                +{space.onlineCount - 3} more
              </span>
            )}
          </div>
        )}

        {/* Join button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full py-2 rounded-lg text-[12px] font-medium',
            'bg-white/[0.06] text-white/70 border border-white/[0.08]',
            'hover:bg-white hover:text-black hover:border-white',
            'transition-all duration-200'
          )}
        >
          Join
        </motion.button>
      </div>
    </motion.div>
  );
}

export function SpaceNeighborhood({
  title,
  categoryKey,
  spaces,
  onSpaceClick,
  onJoinSpace,
  onViewAll,
  hasMore = false,
  className,
}: SpaceNeighborhoodProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  if (spaces.length === 0) return null;

  return (
    <motion.section
      ref={ref}
      variants={SECTION_VARIANTS}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={cn('mb-12', className)}
    >
      {/* Header */}
      <motion.div
        variants={HEADER_VARIANTS}
        className="flex items-center justify-between mb-4 px-6 md:px-0"
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
          {title}
        </h2>
        {hasMore && onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-[12px] text-white/30 hover:text-white/60 transition-colors"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </motion.div>

      {/* Cards - horizontal scroll on mobile, grid on desktop */}
      <div className="relative">
        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-6 pb-4">
            {spaces.map((space) => (
              <NeighborhoodCard
                key={space.id}
                space={space}
                onClick={() => onSpaceClick?.(space.id)}
                onJoin={() => onJoinSpace?.(space.id)}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {spaces.map((space) => (
            <NeighborhoodCard
              key={space.id}
              space={space}
              onClick={() => onSpaceClick?.(space.id)}
              onJoin={() => onJoinSpace?.(space.id)}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default SpaceNeighborhood;
