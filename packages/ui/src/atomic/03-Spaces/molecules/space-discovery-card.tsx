'use client';

/**
 * SpaceDiscoveryCard - Enhanced card with momentum strip, hover reveal, social proof
 *
 * Design Token Compliance:
 * - Background: Glass morphism (8px blur, subtle)
 * - Border: Gold accent on hover
 * - Motion: T2 tier - medium motion with spring physics
 * - Brand: Gold accent for CTAs, verified badge
 *
 * Key Features:
 * - Left momentum strip (gold/green/gray)
 * - Hover lift with shadow expansion
 * - Member stack with social proof
 * - Activity badge
 * - Verified sparkle badge
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { durationSeconds, easingArrays } from '@hive/tokens';
import { Button } from '../../00-Global/atoms/button';
import { MomentumIndicator } from '../atoms/momentum-indicator';
import { MemberStack, type MemberStackMember } from '../atoms/member-stack';
import { ActivityBadge } from '../atoms/activity-badge';
import {
  spaceDiscoveryCardVariants,
  withReducedMotion,
} from '../../../lib/motion-variants-spaces';
import { glassPresets } from '../../../lib/glass-morphism';

export interface SpaceDiscoveryCardData {
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

export interface SpaceDiscoveryCardProps {
  /** Space data */
  space: SpaceDiscoveryCardData;
  /** Callback when join is clicked */
  onJoin?: (spaceId: string) => void;
  /** Callback when card is clicked */
  onClick?: () => void;
  /** Whether join is loading */
  isJoining?: boolean;
  /** Optional className */
  className?: string;
}

export function SpaceDiscoveryCard({
  space,
  onJoin,
  onClick,
  isJoining = false,
  className,
}: SpaceDiscoveryCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const {
    id,
    name,
    memberCount,
    category,
    isVerified,
    activityLevel = 'quiet',
    recentMembers = [],
    bannerImage,
  } = space;

  // Generate monogram from first letter
  const monogram = name?.charAt(0)?.toUpperCase() || 'S';

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.(id);
  };

  // Use centralized T2 motion variants with reduced motion support
  const cardVariants = withReducedMotion(spaceDiscoveryCardVariants, shouldReduceMotion ?? false);

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl',
        glassPresets.discoveryCard,
        className
      )}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      tabIndex={0}
      role="article"
      aria-label={`${name} space with ${memberCount} members`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-[#FFD700]/5 via-transparent to-transparent rounded-xl pointer-events-none" />

      <div className="relative flex">
        {/* Momentum Strip - Left border */}
        <MomentumIndicator level={activityLevel} size="full" className="rounded-l-xl" />

        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3.5">
            {/* Avatar */}
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden',
                'bg-gradient-to-br from-neutral-700 to-neutral-800',
                'border border-neutral-700/50',
                'group-hover:border-neutral-600/50 transition-colors'
              )}
            >
              {bannerImage ? (
                <motion.img
                  src={bannerImage}
                  alt=""
                  className="w-full h-full object-cover"
                  animate={shouldReduceMotion ? {} : { scale: 1 }}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                  transition={{ duration: durationSeconds.smooth, ease: easingArrays.default }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold-500/20 to-gold-500/5">
                  <span className="text-lg font-bold text-gold-500">{monogram}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-white truncate group-hover:text-gold-500 transition-colors">
                  {name}
                </h3>
                {isVerified && (
                  <Sparkles className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
                )}
              </div>

              <p className="text-sm text-neutral-500 mb-2">
                {memberCount.toLocaleString()} members
              </p>

              {/* Activity + Members Row */}
              <div className="flex items-center gap-4">
                <ActivityBadge level={activityLevel} />
                {recentMembers.length > 0 && (
                  <MemberStack
                    members={recentMembers}
                    total={memberCount}
                    maxDisplay={3}
                    size="sm"
                  />
                )}
              </div>
            </div>

            {/* Join Button */}
            <motion.div
              className="flex-shrink-0"
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            >
              <Button
                size="sm"
                variant="secondary"
                onClick={handleJoinClick}
                disabled={isJoining}
                className={cn(
                  'bg-neutral-800 hover:bg-white hover:text-black',
                  'border border-neutral-700 hover:border-white',
                  'text-white font-medium',
                  'transition-all duration-200'
                )}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </Button>
            </motion.div>
          </div>

          {/* Category tag */}
          <div className="mt-3 pt-3 border-t border-neutral-800/50">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-800/50 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
              {category.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SpaceDiscoveryCard;
