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
import { Star } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { durationSeconds, easingArrays, getWarmthLevel, warmthSpectrum } from '@hive/tokens';
import { Button } from '../../00-Global/atoms/button';
import { MomentumIndicator } from '../atoms/momentum-indicator';
import { MemberStack, type MemberStackMember } from '../atoms/member-stack';
import { ActivityBadge } from '../atoms/activity-badge';
import { AmbientGlow } from '../atoms/ambient-glow';
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
  /** Active users now - for warmth calculation */
  activeNow?: number;
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
    activeNow = 0,
  } = space;

  // Phase 3: Calculate warmth level for ambient styling
  const warmthLevel = getWarmthLevel(memberCount, activeNow);
  const warmthState = warmthSpectrum[warmthLevel];

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
      style={{
        // Phase 3: Warmth-based border
        borderColor: warmthState.border,
      }}
    >
      {/* Phase 3: Warmth-based ambient glow */}
      <AmbientGlow warmth={warmthLevel} className="absolute inset-0" />

      {/* Subtle glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-white/[0.03] via-transparent to-transparent rounded-xl pointer-events-none" />

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
                'bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A]',
                'border border-[#3A3A3A]',
                'group-hover:border-[#4A4A4A] transition-colors'
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
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.12] to-white/[0.04]">
                  <span className="text-lg font-bold text-white">{monogram}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-[#FAFAFA] truncate group-hover:text-white transition-colors">
                  {name}
                </h3>
                {isVerified && (
                  <Star className="w-3.5 h-3.5 text-[#FFD700] flex-shrink-0" />
                )}
              </div>

              <p className="text-sm text-[#71717A] mb-2">
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
                  'bg-[#1A1A1A] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]',
                  'border border-[#3A3A3A] hover:border-[#FAFAFA]',
                  'text-[#FAFAFA] font-medium',
                  'transition-all duration-200'
                )}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </Button>
            </motion.div>
          </div>

          {/* Category tag */}
          <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#1A1A1A] text-[10px] font-medium text-[#A1A1A6] uppercase tracking-wider">
              {category.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SpaceDiscoveryCard;
