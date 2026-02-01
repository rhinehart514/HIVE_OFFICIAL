'use client';

/**
 * SpaceIdentity - Large space card with animated border draw
 *
 * Features:
 * - Large avatar (120px) with animated border draw (1.2s)
 * - Name with WordReveal animation
 * - Handle in mono font
 * - Stats row: members, online, energy level
 * - Description (if exists)
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { Users } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  useInView,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  WordReveal,
} from '@hive/ui/design-system/primitives';
import { SPACES_GOLD, getEnergyDotCount } from '@hive/ui/tokens';

// ============================================================
// Types
// ============================================================

interface SpaceIdentityProps {
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
    onlineCount: number;
    isVerified?: boolean;
    recentMessageCount?: number;
  };
  /** Delay before animation starts */
  delay?: number;
}

// ============================================================
// Energy Indicator
// ============================================================

function EnergyIndicator({ level }: { level: 1 | 2 | 3 }) {
  const labels = {
    1: 'Quiet',
    2: 'Active',
    3: 'Busy',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: level }).map((_, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: SPACES_GOLD.primary }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.8 + i * 0.1,
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-white/40">{labels[level]}</span>
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export function SpaceIdentity({
  space,
  delay = 0,
}: SpaceIdentityProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  const energyLevel = getEnergyDotCount(space.recentMessageCount ?? 0);

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.slower,
        delay: shouldReduceMotion ? 0 : delay,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Avatar with animated border */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.slow,
          delay: shouldReduceMotion ? 0 : delay + 0.2,
          ease: MOTION.ease.premium,
        }}
      >
        <div className="relative">
          <Avatar
            size="xl"
            className="w-[120px] h-[120px] ring-2 ring-white/10"
          >
            {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
            <AvatarFallback className="text-3xl bg-white/[0.06]">
              {getInitials(space.name)}
            </AvatarFallback>
          </Avatar>

          {/* Animated border ring */}
          {isInView && !shouldReduceMotion && (
            <motion.div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: MOTION.duration.slower,
                delay: delay + 0.5,
                ease: MOTION.ease.premium,
              }}
            />
          )}
        </div>

        {/* Verified badge */}
        {space.isVerified && (
          <motion.div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{
              duration: 0.3,
              delay: delay + 0.8,
              type: 'spring',
              stiffness: 400,
              damping: 20,
            }}
          >
            <svg
              className="w-3.5 h-3.5 text-black"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Space name with word reveal */}
      <h1
        className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-white mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {shouldReduceMotion ? (
          space.name
        ) : (
          <WordReveal text={space.name} delay={delay + 0.3} />
        )}
      </h1>

      {/* Handle */}
      <motion.p
        className="text-sm font-mono text-white/40 mb-6"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.base,
          delay: shouldReduceMotion ? 0 : delay + 0.6,
          ease: MOTION.ease.premium,
        }}
      >
        @{space.handle}
      </motion.p>

      {/* Stats row */}
      <motion.div
        className="flex items-center justify-center gap-6 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.base,
          delay: shouldReduceMotion ? 0 : delay + 0.7,
          ease: MOTION.ease.premium,
        }}
      >
        {/* Member count */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-white/30" />
          <span className="text-sm text-white/50">
            {space.memberCount} members
          </span>
        </div>

        {/* Online count */}
        {space.onlineCount > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: SPACES_GOLD.primary }}
            />
            <span className="text-sm" style={{ color: `${SPACES_GOLD.primary}99` }}>
              {space.onlineCount} here now
            </span>
          </div>
        )}

        {/* Energy level */}
        <EnergyIndicator level={energyLevel} />
      </motion.div>

      {/* Description */}
      {space.description && (
        <motion.p
          className="text-sm text-white/50 leading-relaxed max-w-md"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.base,
            delay: shouldReduceMotion ? 0 : delay + 0.8,
            ease: MOTION.ease.premium,
          }}
        >
          {space.description}
        </motion.p>
      )}
    </motion.div>
  );
}

SpaceIdentity.displayName = 'SpaceIdentity';
