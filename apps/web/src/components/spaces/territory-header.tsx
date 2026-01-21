'use client';

/**
 * TerritoryHeader - Premium discovery page header
 * CREATED: Jan 21, 2026
 *
 * Territory narrative for Spaces discovery:
 * - Clash Display headline
 * - Live stats (total, claimed, waiting)
 * - About-page motion patterns
 *
 * "423 Spaces. 67 claimed. Yours waiting."
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { WordReveal, AnimatedLine, StatCounter } from '@hive/ui/motion';
import { MOTION, durationSeconds } from '@hive/tokens';

export interface TerritoryHeaderProps {
  totalSpaces?: number;
  claimedSpaces?: number;
  yourSpaceCount?: number;
  isAuthenticated?: boolean;
  className?: string;
}

export function TerritoryHeader({
  totalSpaces = 423,
  claimedSpaces = 67,
  yourSpaceCount = 0,
  isAuthenticated = false,
  className,
}: TerritoryHeaderProps) {
  const waitingSpaces = totalSpaces - claimedSpaces;

  return (
    <motion.header
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: durationSeconds.gentle, ease: MOTION.ease.premium }}
    >
      {/* Main headline - Clash Display */}
      <motion.h1
        className="text-[36px] md:text-[48px] font-semibold leading-[1.0] tracking-tight text-white mb-4"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.hero, ease: MOTION.ease.premium }}
      >
        <WordReveal stagger={0.12}>Your campus, mapped.</WordReveal>
      </motion.h1>

      {/* Stats line - territory narrative */}
      <motion.div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.gentle, delay: 0.4, ease: MOTION.ease.premium }}
      >
        <StatCounter value={totalSpaces} suffix="spaces" delay={0.5} />
        <span className="text-white/20">·</span>
        <StatCounter value={claimedSpaces} suffix="claimed" delay={0.6} highlight />
        <span className="text-white/20">·</span>
        <motion.span
          className="text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: durationSeconds.smooth, delay: 0.7, ease: MOTION.ease.premium }}
        >
          <span className="text-white">{waitingSpaces.toLocaleString()}</span>
          <span className="text-white/40 ml-1">waiting for leaders</span>
        </motion.span>
      </motion.div>

      {/* Subtext based on auth state */}
      <motion.p
        className="text-[16px] text-white/40 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: durationSeconds.gentle, delay: 0.8, ease: MOTION.ease.premium }}
      >
        {isAuthenticated ? (
          yourSpaceCount > 0 ? (
            <>
              You're in{' '}
              <span className="text-white/60">{yourSpaceCount}</span>{' '}
              {yourSpaceCount === 1 ? 'space' : 'spaces'}.
              Explore more or claim your territory.
            </>
          ) : (
            <>Find your people. Claim your org.</>
          )
        ) : (
          <>Every org has a home waiting. Find yours.</>
        )}
      </motion.p>

      {/* Animated separator */}
      <AnimatedLine className="mt-8" delay={0.9} />
    </motion.header>
  );
}

TerritoryHeader.displayName = 'TerritoryHeader';
