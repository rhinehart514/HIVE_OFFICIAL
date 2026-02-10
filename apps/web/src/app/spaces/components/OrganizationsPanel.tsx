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
import { MoreHorizontal, BellOff, LogOut, Settings, Link2 } from 'lucide-react';
import {
  motion,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  toast,
} from '@hive/ui';
import { cn } from '@/lib/utils';
import { getEnergyLevel, getEnergyDotCount } from '@/lib/energy-utils';
import type { Space } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface OrganizationsPanelProps {
  spaces: Space[];
  maxVisible?: number;
  onMuteSpace?: (spaceId: string) => void;
  onLeaveSpace?: (spaceId: string) => void;
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
  onMute,
  onLeave,
}: {
  space: Space;
  index: number;
  onMute?: (spaceId: string) => void;
  onLeave?: (spaceId: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Calculate energy level for this space
  const energyLevel = getEnergyLevel(space.recentMessageCount);
  const energyDotCount = getEnergyDotCount(energyLevel);
  const hasOnline = (space.onlineCount ?? 0) > 0;

  const handleCopyInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/s/${space.handle || space.id}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
    setMenuOpen(false);
  };

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMute?.(space.id);
    toast.success('Space muted');
    setMenuOpen(false);
  };

  const handleLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLeave?.(space.id);
    toast.success('Left space');
    setMenuOpen(false);
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/s/${space.handle || space.id}?settings=true`);
    setMenuOpen(false);
  };

  return (
    <motion.div
      className={cn(
        'group relative flex flex-col items-center gap-3 p-4 rounded-lg text-center',
        'transition-all duration-200',
        'bg-white/[0.06] hover:bg-white/[0.06]',
        'ring-1 ring-white/[0.06] hover:ring-white/[0.06]',
        'cursor-pointer'
      )}
      onClick={() => router.push(`/s/${space.handle || space.id}`)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Quick Actions Menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md bg-black/40 hover:bg-black/60 transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-white/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleCopyInvite}>
              <Link2 className="w-4 h-4 mr-2" />
              Copy link
            </DropdownMenuItem>
            {onMute && (
              <DropdownMenuItem onClick={handleMute}>
                <BellOff className="w-4 h-4 mr-2" />
                Mute
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            {onLeave && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLeave} className="text-red-400 focus:text-red-400">
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Avatar */}
      <div className="relative">
        <Avatar size="lg" className="ring-1 ring-white/[0.06]">
          {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
          <AvatarFallback className="text-body bg-white/[0.06]">
            {getInitials(space.name)}
          </AvatarFallback>
        </Avatar>

        {/* Unread badge - takes priority position */}
        {space.unreadCount && space.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[var(--color-gold,#C9A227)] text-[10px] font-semibold text-black">
            {space.unreadCount > 9 ? '9+' : space.unreadCount}
          </span>
        )}

        {/* Online indicator - green dot when members online */}
        {hasOnline && !space.unreadCount && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-black" />
        )}

        {/* Energy dots - bottom right of avatar (when no online, no unreads) */}
        {energyDotCount > 0 && !space.unreadCount && !hasOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-black">
            <EnergyDots count={energyDotCount} />
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-body-sm text-white/50 line-clamp-2 leading-snug">
        {space.name}
      </span>

      {/* Member count + presence */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {hasOnline ? (
          <span className="text-label text-emerald-400/70">
            {space.onlineCount} here
          </span>
        ) : (
          <span className="text-label text-white/50">
            {space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}
          </span>
        )}
        {/* Show energy dots inline if there are unreads (since badge takes position) */}
        {energyDotCount > 0 && space.unreadCount && space.unreadCount > 0 && (
          <EnergyDots count={energyDotCount} />
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptySpaces() {
  const router = useRouter();

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12">
      <p className="text-body text-white/50 text-center mb-4">
        You haven't joined any spaces yet
      </p>
      <button
        onClick={() => router.push('/discover')}
        className="text-body-sm text-white/50 hover:text-white/50 transition-colors"
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
  onMuteSpace,
  onLeaveSpace,
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
        <SpaceCard
          key={space.id}
          space={space}
          index={i}
          onMute={onMuteSpace}
          onLeave={onLeaveSpace}
        />
      ))}

      {/* More card */}
      {remainingCount > 0 && (
        <motion.button
          onClick={() => router.push('/discover')}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-4 rounded-lg',
            'bg-white/[0.06] hover:bg-white/[0.06]',
            'ring-1 ring-white/[0.06] hover:ring-white/[0.06]',
            'transition-all duration-200'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-heading text-white/50">+{remainingCount}</span>
          <span className="text-label text-white/50">more</span>
        </motion.button>
      )}
    </div>
  );
}
