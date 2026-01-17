'use client';

/**
 * Browse Page Cards
 *
 * Extracted card components for the spaces browse page.
 * Uses HIVE design system primitives.
 *
 * @version 4.1.0 - Primitives integration (Jan 2026)
 *
 * COLD START SIGNALS:
 * Prioritizes signals that show value without activity:
 * - Verified badge (official UB org)
 * - Upcoming events with dates
 * - Mutual friends in space
 * - Tool count
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid } from '@heroicons/react/24/solid';

// Design system primitives
import {
  Button,
  Text,
  Badge,
  SimpleAvatar,
  AvatarGroup,
  PresenceDot,
} from '@hive/ui/design-system/primitives';

import {
  isSpaceLive,
  getActivityLevel,
  formatActivityTime,
  type SpaceSearchResult,
} from '../hooks';

// ============================================================
// Cold Start Helpers
// ============================================================

/**
 * Format next event date for display
 * Returns relative format like "Tomorrow" or "Friday" or "Jan 15"
 */
function formatNextEventDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

/**
 * Check if space has cold start signals worth showing
 */
function hasValueSignals(space: SpaceSearchResult): boolean {
  return Boolean(
    space.isVerified ||
    (space.upcomingEventCount && space.upcomingEventCount > 0) ||
    (space.mutualCount && space.mutualCount > 0) ||
    (space.toolCount && space.toolCount > 0)
  );
}

// ============================================================
// Motion Variants
// ============================================================

const DEFAULT_SNAP_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 30,
      mass: 0.8,
    },
  },
};

const HEARTBEAT_VARIANTS = {
  live: {
    opacity: [0.4, 1, 0.4],
    boxShadow: [
      '0 0 0px rgba(255,215,0,0)',
      '0 0 12px rgba(255,215,0,0.4)',
      '0 0 0px rgba(255,215,0,0)',
    ],
  },
  recent: {
    opacity: [0.3, 0.7, 0.3],
  },
  quiet: {
    opacity: 0.2,
  },
};

// ============================================================
// Join Button
// ============================================================

type JoinButtonState = 'idle' | 'loading' | 'success';

export function JoinButton({
  onJoin,
  variant = 'default',
}: {
  onJoin: () => Promise<void> | void;
  variant?: 'default' | 'hero';
}) {
  const shouldReduceMotion = useReducedMotion();
  const [state, setState] = React.useState<JoinButtonState>('idle');

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state !== 'idle') return;

    setState('loading');
    try {
      await onJoin();
      setState('success');
    } catch {
      setState('idle');
    }
  };

  const isHero = variant === 'hero';

  const baseClasses = isHero
    ? 'rounded-full text-[13px] font-semibold transition-all flex items-center justify-center gap-2'
    : 'rounded-lg text-[12px] font-medium transition-all flex items-center justify-center';

  const stateClasses = {
    idle: isHero
      ? 'px-5 py-2.5 bg-white text-black hover:bg-white/90 min-w-[100px]'
      : 'w-full py-2 bg-white/[0.06] text-white/70 border border-white/[0.08] hover:bg-white hover:text-black hover:border-white',
    loading: isHero
      ? 'w-10 h-10 bg-white/10 border border-[var(--life-gold)]/40'
      : 'w-full py-2 bg-white/[0.06] border border-[var(--life-gold)]/40',
    success: isHero
      ? 'w-10 h-10 bg-[var(--life-gold)]/20 border border-[var(--life-gold)]/60'
      : 'w-full py-2 bg-[var(--life-gold)]/20 border border-[var(--life-gold)]/40',
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={state !== 'idle'}
      animate={{
        width: shouldReduceMotion ? undefined : state === 'loading' || state === 'success' ? (isHero ? 40 : undefined) : undefined,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${baseClasses} ${stateClasses[state]} disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {isHero ? (
              <>
                Enter
                <ArrowRightIcon className="w-4 h-4" />
              </>
            ) : (
              'Join'
            )}
          </motion.span>
        )}

        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-[var(--life-gold)]/30 border-t-[var(--life-gold)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <motion.svg
              className="w-4 h-4 text-[var(--life-gold)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 12l5 5L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================================
// Hero Space Card
// ============================================================

export function HeroSpaceCard({
  space,
  onEnter,
  onJoin,
}: {
  space: SpaceSearchResult;
  onEnter: () => void;
  onJoin: () => Promise<void> | void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const monogram = space.name?.charAt(0)?.toUpperCase() || 'S';
  const isLive = isSpaceLive(space);
  const activityLevel = getActivityLevel(space.lastActivityAt);

  const heartbeatColor = {
    live: 'var(--life-gold)',
    recent: 'rgba(255,255,255,0.6)',
    quiet: 'rgba(255,255,255,0.15)',
  }[activityLevel];

  return (
    <motion.article
      variants={DEFAULT_SNAP_VARIANTS}
      initial="hidden"
      animate="visible"
      onClick={onEnter}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEnter()}
      className="relative cursor-pointer overflow-hidden rounded-2xl bg-[var(--bg-ground)] border border-[var(--border)] group transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      {/* Activity Heartbeat Strip */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full z-10"
        style={{ backgroundColor: heartbeatColor }}
        animate={
          shouldReduceMotion
            ? {}
            : activityLevel === 'live'
              ? HEARTBEAT_VARIANTS.live
              : activityLevel === 'recent'
                ? HEARTBEAT_VARIANTS.recent
                : HEARTBEAT_VARIANTS.quiet
        }
        transition={
          activityLevel === 'live'
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : activityLevel === 'recent'
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : {}
        }
      />

      {/* Trending glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,215,0,0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative p-6 md:p-8 pl-7 md:pl-10">
        {/* Header */}
        <div className="flex items-start gap-5 mb-5">
          {/* Avatar with animated live ring */}
          <div className="relative">
            {isLive && !shouldReduceMotion && (
              <motion.div
                className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 0 2px rgba(255,215,0,0.2)',
                    '0 0 0 4px rgba(255,215,0,0.1)',
                    '0 0 0 2px rgba(255,215,0,0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <div
              className={`
                w-16 h-16 md:w-20 md:h-20 rounded-2xl flex-shrink-0 overflow-hidden
                bg-white/[0.04] border border-[var(--border)]
              `}
            >
              {space.bannerImage ? (
                <motion.div
                  className="w-full h-full"
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.05, 1] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <img src={space.bannerImage} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-[var(--text-secondary)]">{monogram}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Verified badge - prominent for official orgs */}
              {space.isVerified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-semibold uppercase tracking-wider">
                  <CheckBadgeSolid className="w-3 h-3" />
                  Official
                </span>
              )}
              {/* Trending badge - only if not verified (avoid badge overload) */}
              {!space.isVerified && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--life-gold)]/10 text-[var(--life-gold)] text-[10px] font-semibold uppercase tracking-wider">
                  Trending
                </span>
              )}
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {space.category.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2 group-hover:text-[var(--text-secondary)] transition-colors">
              {space.name}
            </h2>

            {space.description && (
              <p className="text-[14px] text-[var(--text-secondary)] line-clamp-2">
                {space.description}
              </p>
            )}

            {/* Cold start signals - show value without activity */}
            <div className="flex items-center gap-4 mt-3">
              {/* Upcoming event - creates urgency */}
              {space.nextEventTitle && space.nextEventAt && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[var(--life-gold)]" />
                  <span className="text-[12px] text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)] font-medium">{space.nextEventTitle}</span>
                    {' · '}
                    <span className="text-[var(--life-gold)]">{formatNextEventDate(space.nextEventAt)}</span>
                  </span>
                </div>
              )}
              {/* Multiple events indicator */}
              {!space.nextEventTitle && space.upcomingEventCount && space.upcomingEventCount > 0 && (
                <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
                  <CalendarIcon className="w-4 h-4 text-[var(--life-gold)]" />
                  {space.upcomingEventCount} upcoming event{space.upcomingEventCount !== 1 ? 's' : ''}
                </div>
              )}
              {/* Mutual friends - social proof */}
              {space.mutualCount && space.mutualCount > 0 && (
                <div className="flex items-center gap-2">
                  {/* Avatar stack */}
                  {space.mutualAvatars && space.mutualAvatars.length > 0 && (
                    <div className="flex -space-x-2">
                      {space.mutualAvatars.slice(0, 3).map((avatar, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border border-[var(--bg-ground)] overflow-hidden"
                        >
                          <img src={avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-[12px] text-[var(--life-gold)]">
                    {space.mutualCount} friend{space.mutualCount !== 1 ? 's' : ''} here
                  </span>
                </div>
              )}
              {/* Typing indicator - only show if live AND no event/mutual signals */}
              {isLive && !shouldReduceMotion && !space.nextEventTitle && !space.mutualCount && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)]/50"
                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-[var(--life-gold)]/60">People are chatting</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Value signals row - only show if we have signals */}
        {(space.toolCount && space.toolCount > 0) && (
          <div className="mb-5 flex items-center gap-4 text-[12px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="opacity-60">🛠</span>
              {space.toolCount} tool{space.toolCount !== 1 ? 's' : ''} available
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[var(--text-muted)]">
              {space.memberCount.toLocaleString()} members
            </span>
            {isLive && (
              <span className="flex items-center gap-2 text-[13px] text-[var(--life-gold)]">
                <motion.span
                  className="w-2 h-2 rounded-full bg-[var(--life-gold)]"
                  animate={shouldReduceMotion ? {} : {
                    boxShadow: [
                      '0 0 4px rgba(255,215,0,0.3)',
                      '0 0 12px rgba(255,215,0,0.6)',
                      '0 0 4px rgba(255,215,0,0.3)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Live now
              </span>
            )}
            {/* Last active indicator for non-live spaces */}
            {!isLive && space.lastActivityAt && (
              <span className="text-[13px] text-[var(--text-secondary)]">
                {formatActivityTime(space.lastActivityAt)}
              </span>
            )}
          </div>

          <JoinButton onJoin={onJoin} variant="hero" />
        </div>
      </div>
    </motion.article>
  );
}

// ============================================================
// Neighborhood Card
// ============================================================

export function NeighborhoodCard({
  space,
  onClick,
  onJoin,
}: {
  space: SpaceSearchResult;
  onClick: () => void;
  onJoin: () => Promise<void> | void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [_isHovered, setIsHovered] = React.useState(false);
  const monogram = space.name?.charAt(0)?.toUpperCase() || 'S';
  const isLive = isSpaceLive(space);
  const activityLevel = getActivityLevel(space.lastActivityAt);

  const heartbeatColor = {
    live: 'var(--life-gold)',
    recent: 'rgba(255,255,255,0.6)',
    quiet: 'rgba(255,255,255,0.15)',
  }[activityLevel];

  return (
    <motion.div
      variants={DEFAULT_SNAP_VARIANTS}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="relative cursor-pointer overflow-hidden rounded-xl bg-white/[0.02] border border-[var(--border)] w-[280px] md:w-auto flex-shrink-0 group transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.04] hover:border-[var(--border-hover)] hover:brightness-105 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      {/* Activity Heartbeat Strip */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
        style={{ backgroundColor: heartbeatColor }}
        animate={
          shouldReduceMotion
            ? {}
            : activityLevel === 'live'
              ? HEARTBEAT_VARIANTS.live
              : activityLevel === 'recent'
                ? HEARTBEAT_VARIANTS.recent
                : HEARTBEAT_VARIANTS.quiet
        }
        transition={
          activityLevel === 'live'
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : activityLevel === 'recent'
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : {}
        }
      />

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            {/* Verified badge on avatar */}
            {space.isVerified && (
              <div className="absolute -top-1 -right-1 z-10">
                <CheckBadgeSolid className="w-4 h-4 text-white/80" />
              </div>
            )}
            <div
              className={`
                w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden
                bg-white/[0.04] border border-[var(--border)]
                ${space.isVerified ? 'ring-2 ring-white/30 ring-offset-1 ring-offset-[var(--bg-void)]' : ''}
                ${!space.isVerified && isLive ? 'ring-2 ring-[var(--life-gold)]/40 ring-offset-1 ring-offset-[var(--bg-void)]' : ''}
              `}
            >
              {space.bannerImage ? (
                <img src={space.bannerImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">{monogram}</span>
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-[var(--text-primary)] text-[14px] truncate group-hover:text-[var(--text-secondary)]">
              {space.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[12px] text-[var(--text-muted)]">
                {space.memberCount.toLocaleString()} {space.memberCount === 1 ? 'member' : 'members'}
              </span>
              {/* Mutual friends - highest priority signal */}
              {space.mutualCount && space.mutualCount > 0 && (
                <>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-[12px] text-[var(--life-gold)]">
                    {space.mutualCount} friend{space.mutualCount !== 1 ? 's' : ''}
                  </span>
                </>
              )}
              {/* Live indicator - only if no mutuals (avoid clutter) */}
              {isLive && !space.mutualCount && (
                <>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="flex items-center gap-1 text-[12px] text-[var(--life-gold)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)] shadow-[0_0_6px_rgba(255,215,0,0.6)]" />
                    Live
                  </span>
                </>
              )}
              {/* Last active indicator - only for non-live spaces with activity data */}
              {!isLive && !space.mutualCount && space.lastActivityAt && (
                <>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-[12px] text-[var(--text-muted)]">
                    {formatActivityTime(space.lastActivityAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cold start signals row */}
        {(space.nextEventTitle || (space.upcomingEventCount && space.upcomingEventCount > 0)) && (
          <div className="flex items-center gap-2 mb-3 text-[11px]">
            <CalendarIcon className="w-3.5 h-3.5 text-[var(--life-gold)]" />
            {space.nextEventTitle ? (
              <span className="text-[var(--text-secondary)] truncate">
                <span className="text-[var(--text-primary)]">{space.nextEventTitle}</span>
                {space.nextEventAt && (
                  <span className="text-[var(--life-gold)]"> · {formatNextEventDate(space.nextEventAt)}</span>
                )}
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">
                {space.upcomingEventCount} upcoming event{space.upcomingEventCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {space.description && (
          <div className="pb-3 mb-3 border-b border-[var(--border)]">
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
              {space.description}
            </p>
          </div>
        )}

        {/* Join button */}
        <JoinButton onJoin={onJoin} variant="default" />
      </div>
    </motion.div>
  );
}
