'use client';

/**
 * IdentityRow — Three identity cards (Major, Home, Greek)
 *
 * Each card shows:
 * - Avatar with ring
 * - Category label
 * - Space name
 * - Energy dots (activity indicator)
 * - Hover reveals arrow
 *
 * @version 2.0.0 - Added energy dots (Sprint 3, Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  motion,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { getEnergyLevel, getEnergyDotCount } from '@/lib/energy-utils';
import type { IdentityClaim } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface IdentityRowProps {
  majorSpace: IdentityClaim | null;
  homeSpace: IdentityClaim | null;
  greekSpace: IdentityClaim | null;
  /** Whether user is in 7-day onboarding period - makes empty cards more prominent */
  isOnboarding?: boolean;
}

interface IdentityCardProps {
  type: 'major' | 'home' | 'greek';
  claim: IdentityClaim | null;
  index: number;
  isOnboarding?: boolean;
}

// ============================================================
// Constants
// ============================================================

const IDENTITY_CONFIG = {
  major: {
    label: 'Major',
    emptyText: 'Choose your major',
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    accent: 'text-blue-400',
    ring: 'ring-blue-500/30',
    browseUrl: '/spaces/browse?category=major',
  },
  home: {
    label: 'Home',
    emptyText: 'Find your residence',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    accent: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
    browseUrl: '/spaces/browse?category=residential',
  },
  greek: {
    label: 'Greek',
    emptyText: 'Join your letters',
    gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    accent: 'text-rose-400',
    ring: 'ring-rose-500/30',
    browseUrl: '/spaces/browse?category=greek',
  },
};

// ============================================================
// Energy Dots Component
// ============================================================

function EnergyDots({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(count)].map((_, i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-[var(--color-gold)]"
        />
      ))}
    </div>
  );
}

// ============================================================
// Identity Card
// ============================================================

function IdentityCard({ type, claim, index, isOnboarding = false }: IdentityCardProps) {
  const router = useRouter();
  const config = IDENTITY_CONFIG[type];
  const [isHovered, setIsHovered] = React.useState(false);

  // Calculate energy level for this space
  const energyLevel = claim ? getEnergyLevel(claim.recentMessageCount) : 'none';
  const energyDotCount = getEnergyDotCount(energyLevel);

  // Empty cards get gold hint during onboarding
  const showOnboardingHint = !claim && isOnboarding;

  const handleClick = () => {
    if (claim) {
      router.push(`/s/${claim.spaceId}`);
    } else {
      router.push(config.browseUrl);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex-1 rounded-2xl p-5 text-left overflow-hidden',
        'transition-all duration-300',
        'bg-gradient-to-br',
        config.gradient,
        'hover:scale-[1.01]'
      )}
      style={{
        background: showOnboardingHint
          ? 'linear-gradient(180deg, rgba(255,215,0,0.04) 0%, rgba(255,215,0,0.01) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: showOnboardingHint
          ? 'inset 0 1px 0 rgba(255,215,0,0.08), 0 0 0 1px rgba(255,215,0,0.08)'
          : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        delay: index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500',
          config.gradient,
          isHovered && 'opacity-100'
        )}
      />

      {/* Energy dots - top right corner */}
      {claim && energyDotCount > 0 && (
        <div className="absolute top-4 right-4 z-20">
          <EnergyDots count={energyDotCount} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top: Category label */}
        <span className={cn('text-label-sm font-medium uppercase tracking-wider mb-3', config.accent)}>
          {config.label}
        </span>

        {/* Middle: Avatar + Name */}
        <div className="flex items-center gap-3 flex-1">
          {claim ? (
            <>
              <Avatar size="default" className={cn('ring-2', config.ring)}>
                {claim.spaceAvatarUrl && <AvatarImage src={claim.spaceAvatarUrl} />}
                <AvatarFallback className="text-body-sm bg-white/[0.06]">
                  {getInitials(claim.spaceName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-white/90 truncate">
                  {claim.spaceName}
                </p>
              </div>
            </>
          ) : (
            <p className={cn(
              'text-body italic',
              showOnboardingHint ? 'text-[#FFD700]/50' : 'text-white/40'
            )}>
              {config.emptyText}
            </p>
          )}
        </div>

        {/* Bottom: Member count + presence */}
        {claim && (
          <div className="flex items-center gap-3 mt-3">
            <span className="text-label text-white/30">
              {claim.memberCount} {claim.memberCount === 1 ? 'member' : 'members'}
            </span>
            {/* Show "here now" if online count > 0 */}
            {(claim.onlineCount ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse" />
                <span className="text-label text-[var(--color-gold)]/60">
                  {claim.onlineCount} here
                </span>
              </div>
            )}
          </div>
        )}

        {/* Hover arrow */}
        <motion.div
          className="absolute bottom-5 right-5"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -5 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={18} className="text-white/40" />
        </motion.div>
      </div>
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function IdentityRow({ majorSpace, homeSpace, greekSpace, isOnboarding = false }: IdentityRowProps) {
  return (
    <div className="flex gap-4 shrink-0">
      <IdentityCard type="major" claim={majorSpace} index={0} isOnboarding={isOnboarding} />
      <IdentityCard type="home" claim={homeSpace} index={1} isOnboarding={isOnboarding} />
      <IdentityCard type="greek" claim={greekSpace} index={2} isOnboarding={isOnboarding} />
    </div>
  );
}
