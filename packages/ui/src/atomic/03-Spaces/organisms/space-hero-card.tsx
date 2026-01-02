'use client';

/**
 * SpaceHeroCard - Featured space with visible life
 *
 * The "wow" moment in discovery. Shows:
 * - Big, prominent presentation
 * - Real activity fragment (recent message or event)
 * - Member presence (avatars, online count)
 * - Gold accent for trending
 *
 * Design: Landing page energy - this should feel like peeking into a world
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Users, Calendar, MessageCircle } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { spaceHeroCardVariants, withReducedMotion } from '../../../lib/motion-variants-spaces';

// SNAP motion - matches landing page rhythm
const SNAP_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

const SNAP_VARIANTS = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SNAP_SPRING,
  },
};

export interface ActivityFragment {
  type: 'message' | 'event' | 'tool';
  content: string;
  author?: string;
  timestamp?: string;
}

export interface SpaceHeroCardProps {
  /** Space ID */
  id: string;
  /** Space name */
  name: string;
  /** Space description */
  description?: string;
  /** Category */
  category: string;
  /** Member count */
  memberCount: number;
  /** Online member count */
  onlineCount?: number;
  /** Recent activity fragment to show */
  activityFragment?: ActivityFragment;
  /** Banner image URL */
  bannerImage?: string;
  /** Whether this space is trending */
  isTrending?: boolean;
  /** Callback when enter is clicked */
  onEnter?: () => void;
  /** Callback when join is clicked */
  onJoin?: () => void;
  /** Whether currently joining */
  isJoining?: boolean;
  /** Additional className */
  className?: string;
}

export function SpaceHeroCard({
  id,
  name,
  description,
  category,
  memberCount,
  onlineCount = 0,
  activityFragment,
  bannerImage,
  isTrending = false,
  onEnter,
  onJoin,
  isJoining = false,
  className,
}: SpaceHeroCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const monogram = name?.charAt(0)?.toUpperCase() || 'S';

  const cardVariants = withReducedMotion(spaceHeroCardVariants, shouldReduceMotion ?? false);

  const handleEnter = () => onEnter?.();
  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.();
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={shouldReduceMotion ? undefined : "hover"}
      whileTap={shouldReduceMotion ? undefined : "tap"}
      onClick={handleEnter}
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-2xl',
        'bg-[#0A0A0A] border border-white/[0.06]',
        'group',
        className
      )}
      role="article"
      aria-label={`Featured space: ${name}`}
    >
      {/* Trending gold glow */}
      {isTrending && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,215,0,0.08) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative p-6 md:p-8">
        {/* Header row */}
        <div className="flex items-start gap-5 mb-6">
          {/* Avatar */}
          <motion.div
            variants={SNAP_VARIANTS}
            initial="hidden"
            animate="visible"
            className={cn(
              'w-16 h-16 md:w-20 md:h-20 rounded-2xl flex-shrink-0 overflow-hidden',
              'bg-gradient-to-br from-white/[0.08] to-white/[0.02]',
              'border border-white/[0.08]',
              isTrending && 'ring-2 ring-[#FFD700]/30 ring-offset-2 ring-offset-[#0A0A0A]'
            )}
          >
            {bannerImage ? (
              <img
                src={bannerImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-bold text-white/60">{monogram}</span>
              </div>
            )}
          </motion.div>

          {/* Name + Meta */}
          <div className="flex-1 min-w-0">
            <motion.div
              variants={SNAP_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.05 }}
              className="flex items-center gap-3 mb-2"
            >
              {isTrending && (
                <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-semibold uppercase tracking-wider">
                  Trending
                </span>
              )}
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                {category.replace('_', ' ')}
              </span>
            </motion.div>

            <motion.h2
              variants={SNAP_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2 group-hover:text-white/90 transition-colors"
            >
              {name}
            </motion.h2>

            {description && (
              <motion.p
                variants={SNAP_VARIANTS}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.15 }}
                className="text-[15px] text-white/50 line-clamp-2"
              >
                {description}
              </motion.p>
            )}
          </div>
        </div>

        {/* Activity Fragment - The life glimpse */}
        {activityFragment && (
          <motion.div
            variants={SNAP_VARIANTS}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]"
          >
            <div className="flex items-start gap-3">
              {activityFragment.type === 'message' && (
                <MessageCircle className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              )}
              {activityFragment.type === 'event' && (
                <Calendar className="w-4 h-4 text-[#FFD700]/70 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                {activityFragment.author && (
                  <p className="text-[12px] text-white/40 mb-1">
                    {activityFragment.author}
                  </p>
                )}
                <p className="text-[14px] text-white/70 leading-relaxed">
                  "{activityFragment.content}"
                </p>
                {activityFragment.timestamp && (
                  <p className="text-[11px] text-white/25 mt-2">
                    {activityFragment.timestamp}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer: Members + Actions */}
        <motion.div
          variants={SNAP_VARIANTS}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25 }}
          className="flex items-center justify-between"
        >
          {/* Member info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/40">
              <Users className="w-4 h-4" />
              <span className="text-[13px]">{memberCount.toLocaleString()} members</span>
            </div>
            {onlineCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                <span className="text-[13px] text-[#FFD700]">
                  {onlineCount} here now
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleJoin}
              disabled={isJoining}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              className={cn(
                'px-5 py-2.5 rounded-full text-[13px] font-semibold',
                'bg-white text-black',
                'hover:bg-white/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center gap-2'
              )}
            >
              {isJoining ? 'Joining...' : 'Enter'}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Hover shimmer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%)',
        }}
      />
    </motion.article>
  );
}

export default SpaceHeroCard;
