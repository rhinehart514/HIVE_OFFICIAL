'use client';

/**
 * SpaceHeroCard - Large featured card with banner, full details
 *
 * Design Token Compliance:
 * - Background: Gradient overlay on banner image
 * - Border: Glassmorphic with subtle gold glow on hover
 * - Motion: Ken Burns zoom on banner, spring lift on hover (T1 motion tier)
 * - Brand: Gold for verified badge, CTAs
 *
 * Variants:
 * - large: 320px min-height, full details (col-span-2 row-span-2 in bento)
 * - compact: 180px min-height, condensed (single grid cell)
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { easingArrays } from '@hive/tokens';
import { Button } from '../../00-Global/atoms/button';
import { MemberStack, type MemberStackMember } from '../atoms/member-stack';
import { ActivityBadge } from '../atoms/activity-badge';
import {
  spaceHeroCardVariants,
  kenBurnsVariants,
  withReducedMotion,
} from '../../../lib/motion-variants-spaces';
import { glassPresets } from '../../../lib/glass-morphism';

export interface SpaceHeroCardData {
  id: string;
  name: string;
  description?: string;
  bannerImage?: string;
  memberCount: number;
  category: string;
  isVerified?: boolean;
  activityLevel?: 'high' | 'live' | 'quiet';
  recentMembers?: MemberStackMember[];
}

export interface SpaceHeroCardProps {
  /** Space data */
  space: SpaceHeroCardData;
  /** Card variant - large for hero, compact for secondary */
  variant?: 'large' | 'compact';
  /** Callback when join is clicked */
  onJoin?: (spaceId: string) => void;
  /** Callback when card is clicked */
  onClick?: () => void;
  /** Whether to show metrics (member stack, activity) */
  showMetrics?: boolean;
  /** Whether join is loading */
  isJoining?: boolean;
  /** Optional className */
  className?: string;
}

export function SpaceHeroCard({
  space,
  variant = 'large',
  onJoin,
  onClick,
  showMetrics = true,
  isJoining = false,
  className,
}: SpaceHeroCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const isLarge = variant === 'large';

  const {
    id,
    name,
    description,
    bannerImage,
    memberCount,
    category,
    isVerified,
    activityLevel = 'quiet',
    recentMembers = [],
  } = space;

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.(id);
  };

  // Use centralized motion variants with reduced motion support
  const cardVariants = withReducedMotion(spaceHeroCardVariants, shouldReduceMotion ?? false);
  const bgVariants = withReducedMotion(kenBurnsVariants, shouldReduceMotion ?? false);

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer overflow-hidden rounded-2xl',
        glassPresets.heroCard,
        isLarge ? 'col-span-2 row-span-2' : 'col-span-1',
        className
      )}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      tabIndex={0}
      role="article"
      aria-label={`Featured: ${name} space with ${memberCount} members`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Background with gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl overflow-hidden',
          !bannerImage && 'bg-gradient-to-br from-[#1A1A1A]/80 via-[#141414] to-[#0A0A0A]'
        )}
      >
        {bannerImage && (
          <>
            <motion.img
              src={bannerImage}
              alt=""
              className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-700"
              variants={bgVariants}
              animate="animate"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </>
        )}
      </div>

      {/* Glass border effect */}
      <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-hover:border-white/[0.15] transition-colors duration-300" />

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-[#FFD700]/10 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div
        className={cn(
          'relative h-full flex flex-col justify-end p-5',
          isLarge ? 'min-h-[320px]' : 'min-h-[180px]'
        )}
      >
        {/* Verified badge */}
        {isVerified && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/20 backdrop-blur-sm border border-[#FFD700]/30">
            <Sparkles className="w-3 h-3 text-[#FFD700]" />
            <span className="text-[10px] font-semibold text-[#FFD700] uppercase tracking-wider">
              Verified
            </span>
          </div>
        )}

        {/* Category tag */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-[11px] font-medium text-white/70 uppercase tracking-wider">
            {category.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <h3
          className={cn(
            'font-bold text-[#FAFAFA] mb-2 group-hover:text-[#FFD700] transition-colors duration-300',
            isLarge ? 'text-2xl' : 'text-lg'
          )}
        >
          {name}
        </h3>

        {/* Description (only on large) */}
        {isLarge && description && (
          <p className="text-sm text-[#A1A1A6] mb-4 line-clamp-2">{description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showMetrics && recentMembers.length > 0 && (
              <MemberStack
                members={recentMembers}
                total={memberCount}
                maxDisplay={isLarge ? 4 : 3}
                size={isLarge ? 'md' : 'sm'}
              />
            )}
            {showMetrics && <ActivityBadge level={activityLevel} />}
          </div>

          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          >
            <Button
              size="sm"
              onClick={handleJoinClick}
              disabled={isJoining}
              className="bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#FFD700] hover:text-[#0A0A0A] font-semibold transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default SpaceHeroCard;
