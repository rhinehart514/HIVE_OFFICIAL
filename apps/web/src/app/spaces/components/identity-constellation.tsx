'use client';

/**
 * IdentityConstellation - The 3 identity cards (Major/Home/Greek)
 *
 * Visual treatment for the core identity spaces with:
 * - Claimed: Avatar with ring, name, energy dots, member count
 * - Unclaimed: Dashed border, type label, "Claim →" link
 * - Motion: Cards stagger in, border draws on first view
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  useInView,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import {
  SPACES_MOTION,
  SPACES_GOLD,
  getEnergyDotCount,
} from '@hive/ui/tokens';
import type { IdentityClaim } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface IdentityConstellationProps {
  /** Major space claim */
  major: IdentityClaim | null;
  /** Home/Residential space claim */
  home: IdentityClaim | null;
  /** Greek space claim */
  greek: IdentityClaim | null;
  /** Whether in 7-day onboarding period */
  isOnboarding?: boolean;
  /** Layout mode */
  layout?: 'prominent' | 'compact';
}

interface IdentityCardProps {
  type: 'major' | 'home' | 'greek';
  claim: IdentityClaim | null;
  index: number;
  isOnboarding?: boolean;
  layout: 'prominent' | 'compact';
}

// ============================================================
// Constants
// ============================================================

const IDENTITY_CONFIG = {
  major: {
    label: 'Major',
    emptyText: 'Choose your major',
    browseUrl: '/spaces/browse?category=major',
    ringColor: 'ring-blue-500/40',
    accentColor: 'text-blue-400',
    bgGradient: 'from-blue-500/8 to-blue-500/2',
  },
  home: {
    label: 'Home',
    emptyText: 'Find your residence',
    browseUrl: '/spaces/browse?category=residential',
    ringColor: 'ring-emerald-500/40',
    accentColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/8 to-emerald-500/2',
  },
  greek: {
    label: 'Greek',
    emptyText: 'Join your letters',
    browseUrl: '/spaces/browse?category=greek',
    ringColor: 'ring-rose-500/40',
    accentColor: 'text-rose-400',
    bgGradient: 'from-rose-500/8 to-rose-500/2',
  },
} as const;

// ============================================================
// Energy Dots
// ============================================================

function EnergyDots({ count, pulse = false }: { count: number; pulse?: boolean }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: SPACES_GOLD.primary }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: pulse ? [1, 1.2, 1] : 1,
          }}
          transition={{
            opacity: { duration: 0.3, delay: i * SPACES_MOTION.energy.dotDelay },
            scale: pulse ? {
              duration: SPACES_MOTION.energy.pulseDuration,
              repeat: Infinity,
              delay: i * 0.2,
            } : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Identity Card
// ============================================================

function IdentityCard({
  type,
  claim,
  index,
  isOnboarding = false,
  layout,
}: IdentityCardProps) {
  const router = useRouter();
  const ref = React.useRef<HTMLButtonElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = React.useState(false);

  const config = IDENTITY_CONFIG[type];
  const energyDotCount = claim ? getEnergyDotCount(claim.recentMessageCount ?? 0) : 0;
  const isHot = energyDotCount === 3;

  // Show gold hint for unclaimed during onboarding
  const showGoldHint = !claim && isOnboarding;

  const handleClick = () => {
    if (claim?.spaceId) {
      router.push(`/s/${claim.spaceId}`);
    } else {
      router.push(config.browseUrl);
    }
  };

  // Card dimensions based on layout
  const cardClasses = layout === 'prominent'
    ? 'flex-1 min-h-[140px] p-5'
    : 'flex-1 min-h-[80px] p-4';

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative rounded-2xl text-left overflow-hidden
        transition-transform duration-200
        ${cardClasses}
        ${isHovered ? 'scale-[1.02]' : 'scale-100'}
      `}
      style={{
        background: claim
          ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
          : showGoldHint
          ? 'linear-gradient(180deg, rgba(255,215,0,0.04) 0%, rgba(255,215,0,0.01) 100%)'
          : 'transparent',
        boxShadow: claim
          ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.04)'
          : showGoldHint
          ? 'inset 0 1px 0 rgba(255,215,0,0.08), 0 0 0 1px rgba(255,215,0,0.1)'
          : 'none',
        border: !claim && !showGoldHint ? '1px dashed rgba(255,255,255,0.15)' : 'none',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : index * SPACES_MOTION.stagger.identity,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Animated border for claimed cards on first view */}
      {claim && isInView && !shouldReduceMotion && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: MOTION.duration.slower,
              ease: MOTION.ease.premium,
            }}
          />
        </div>
      )}

      {/* Hover glow */}
      {claim && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: isHovered ? 0.08 : 0,
          }}
          transition={{ duration: 0.2 }}
          style={{
            background: `radial-gradient(ellipse at center, ${
              isHot ? SPACES_GOLD.glow : 'rgba(255,255,255,0.3)'
            }, transparent 70%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top row: Label + Energy dots */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium uppercase tracking-wider ${config.accentColor}`}>
            {config.label}
          </span>
          {claim && energyDotCount > 0 && (
            <EnergyDots count={energyDotCount} pulse={isHot} />
          )}
        </div>

        {/* Middle: Avatar + Name OR Empty prompt */}
        {claim ? (
          <div className="flex items-center gap-3 flex-1">
            <Avatar size="default" className={`ring-2 ${config.ringColor} shrink-0`}>
              {claim.spaceAvatarUrl && <AvatarImage src={claim.spaceAvatarUrl} />}
              <AvatarFallback className="text-sm bg-white/[0.06]">
                {getInitials(claim.spaceName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">
                {claim.spaceName.length > 20
                  ? `${claim.spaceName.slice(0, 20)}...`
                  : claim.spaceName}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center">
            <p className={`text-sm italic ${showGoldHint ? 'text-[#FFD700]/50' : 'text-white/30'}`}>
              {config.emptyText}
            </p>
          </div>
        )}

        {/* Bottom row: Stats or Claim link */}
        <div className="flex items-center justify-between mt-3">
          {claim ? (
            <>
              <span className="text-xs text-white/30">
                {claim.memberCount} {claim.memberCount === 1 ? 'member' : 'members'}
              </span>
              {(claim.onlineCount ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400/70">
                    {claim.onlineCount} here
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className={`
              text-xs flex items-center gap-1
              ${showGoldHint ? 'text-[#FFD700]/60' : 'text-white/40'}
            `}>
              Claim
              <ChevronRight size={12} />
            </span>
          )}
        </div>

        {/* Hover arrow for claimed cards */}
        {claim && (
          <motion.div
            className="absolute bottom-5 right-5"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -5 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={16} className="text-white/40" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function IdentityConstellation({
  major,
  home,
  greek,
  isOnboarding = false,
  layout = 'prominent',
}: IdentityConstellationProps) {
  return (
    <div className={`flex gap-4 ${layout === 'prominent' ? 'mb-8' : 'mb-4'}`}>
      <IdentityCard
        type="major"
        claim={major}
        index={0}
        isOnboarding={isOnboarding}
        layout={layout}
      />
      <IdentityCard
        type="home"
        claim={home}
        index={1}
        isOnboarding={isOnboarding}
        layout={layout}
      />
      <IdentityCard
        type="greek"
        claim={greek}
        index={2}
        isOnboarding={isOnboarding}
        layout={layout}
      />
    </div>
  );
}

IdentityConstellation.displayName = 'IdentityConstellation';
