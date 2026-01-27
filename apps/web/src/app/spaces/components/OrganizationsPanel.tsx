'use client';

/**
 * OrganizationsPanel — Grid of your spaces
 *
 * Clean cards with real data only:
 * - Avatar + Name
 * - Member count (real)
 * - Unread badge (real)
 * - Energy dots (activity indicator)
 *
 * @version 2.0.0 - Added energy dots (Sprint 3, Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import type { Space } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface OrganizationsPanelProps {
  spaces: Space[];
  maxVisible?: number;
}

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
// Space Card
// ============================================================

function SpaceCard({
  space,
  index,
}: {
  space: Space;
  index: number;
}) {
  const router = useRouter();

  // Calculate energy level for this space
  const energyLevel = getEnergyLevel(space.recentMessageCount);
  const energyDotCount = getEnergyDotCount(energyLevel);

  return (
    <motion.button
      onClick={() => router.push(`/s/${space.handle || space.id}`)}
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-xl text-center',
        'transition-all duration-200',
        'bg-white/[0.02] hover:bg-white/[0.05]',
        'ring-1 ring-white/[0.04] hover:ring-white/[0.08]'
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar size="lg" className="ring-1 ring-white/[0.06]">
          {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
          <AvatarFallback className="text-body bg-white/[0.04]">
            {getInitials(space.name)}
          </AvatarFallback>
        </Avatar>

        {/* Unread badge - takes priority position */}
        {space.unreadCount && space.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold text-black">
            {space.unreadCount > 9 ? '9+' : space.unreadCount}
          </span>
        )}

        {/* Energy dots - bottom right of avatar */}
        {energyDotCount > 0 && !space.unreadCount && (
          <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-[#0A0A0A]">
            <EnergyDots count={energyDotCount} />
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-body-sm text-white/70 line-clamp-2 leading-snug">
        {space.name}
      </span>

      {/* Member count + energy indicator */}
      <div className="flex items-center gap-2">
        <span className="text-label text-white/30">
          {space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}
        </span>
        {/* Show energy dots inline if there are unreads (since badge takes position) */}
        {energyDotCount > 0 && space.unreadCount && space.unreadCount > 0 && (
          <EnergyDots count={energyDotCount} />
        )}
      </div>
    </motion.button>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptySpaces() {
  const router = useRouter();

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12">
      <p className="text-body text-white/30 text-center mb-4">
        You haven't joined any spaces yet
      </p>
      <button
        onClick={() => router.push('/spaces/browse')}
        className="text-body-sm text-white/50 hover:text-white/70 transition-colors"
      >
        Browse spaces →
      </button>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function OrganizationsPanel({
  spaces,
  maxVisible = 12,
}: OrganizationsPanelProps) {
  const router = useRouter();
  const visibleSpaces = spaces.slice(0, maxVisible);
  const remainingCount = Math.max(0, spaces.length - maxVisible);

  if (visibleSpaces.length === 0) {
    return <EmptySpaces />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {visibleSpaces.map((space, i) => (
        <SpaceCard key={space.id} space={space} index={i} />
      ))}

      {/* More card */}
      {remainingCount > 0 && (
        <motion.button
          onClick={() => router.push('/spaces/browse')}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-4 rounded-xl',
            'bg-white/[0.02] hover:bg-white/[0.04]',
            'ring-1 ring-white/[0.04] hover:ring-white/[0.06]',
            'transition-all duration-200'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-heading text-white/20">+{remainingCount}</span>
          <span className="text-label text-white/30">more</span>
        </motion.button>
      )}
    </div>
  );
}
