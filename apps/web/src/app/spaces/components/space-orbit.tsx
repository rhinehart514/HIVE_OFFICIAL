'use client';

/**
 * SpaceOrbit - Single space card in organizations grid
 *
 * Features:
 * - Warmth glow based on activity (hot/warm/cool/dormant)
 * - Avatar with name and stats
 * - Hover lift and glow intensification
 * - Dropdown menu for actions (copy link, mute, settings, leave)
 *
 * Warmth levels (based on recentMessageCount):
 * - Hot (20+): Gold glow, pulse animation
 * - Warm (5-19): Subtle gold glow
 * - Cool (1-4): Faint white glow
 * - Dormant (0): No glow
 *
 * @version 1.1.0 - Added dropdown actions (Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { MoreHorizontal, BellOff, LogOut, Settings, Link2 } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  toast,
} from '@hive/ui';
import {
  SPACES_MOTION,
  SPACES_GOLD,
  getWarmthConfig,
  getEnergyDotCount,
} from '@hive/ui/tokens';
import type { Space } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface SpaceOrbitProps {
  space: Space;
  index: number;
  /** Whether user is a leader of this space */
  isLeader?: boolean;
  /** Callback when mute action is triggered */
  onMute?: (spaceId: string) => void;
  /** Callback when leave action is triggered */
  onLeave?: (spaceId: string) => void;
}

// ============================================================
// Warmth Glow Component
// ============================================================

function WarmthGlow({
  level,
  glow,
  pulse,
  isHovered,
}: {
  level: string;
  glow: number;
  pulse: boolean;
  isHovered: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (glow === 0) return null;

  const baseOpacity = glow;
  const hoverOpacity = glow * SPACES_MOTION.card.hoverGlowMultiplier;
  const glowColor = level === 'dormant' || level === 'cool'
    ? 'rgba(255, 255, 255, 0.5)'
    : SPACES_GOLD.glow;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-lg"
      initial={{ opacity: 0 }}
      animate={{
        opacity: isHovered ? hoverOpacity : baseOpacity,
        scale: pulse && !shouldReduceMotion ? [1, 1.02, 1] : 1,
      }}
      transition={{
        opacity: { duration: SPACES_MOTION.card.duration },
        scale: pulse ? {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        } : undefined,
      }}
      style={{
        background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
      }}
    />
  );
}

// ============================================================
// Energy Dots
// ============================================================

function EnergyDots({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: SPACES_GOLD.primary }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceOrbit({
  space,
  index,
  isLeader = false,
  onMute,
  onLeave,
}: SpaceOrbitProps) {
  const router = useRouter();
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Calculate warmth from activity
  const warmthConfig = getWarmthConfig(space.recentMessageCount ?? 0);
  const energyDotCount = getEnergyDotCount(space.recentMessageCount ?? 0);

  // Build link href
  const href = space.handle ? `/s/${space.handle}` : `/s/${space.id}`;

  // Action handlers
  const handleCardClick = () => {
    if (!menuOpen) {
      router.push(href);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${href}`;
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
    router.push(`${href}?settings=true`);
    setMenuOpen(false);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
        delay: shouldReduceMotion ? 0 : index * SPACES_MOTION.stagger.grid,
        ease: MOTION.ease.premium,
      }}
    >
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="block cursor-pointer group"
      >
        <motion.div
          className="relative rounded-lg p-3 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
          }}
          animate={{
            y: isHovered ? SPACES_MOTION.card.orbitHoverY : 0,
          }}
          transition={{
            duration: SPACES_MOTION.card.duration,
            ease: MOTION.ease.premium,
          }}
        >
          {/* Quick Actions Menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
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
                <DropdownMenuItem onClick={handleCopyLink}>
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

          {/* Warmth glow */}
          <WarmthGlow
            level={warmthConfig.level}
            glow={warmthConfig.glow}
            pulse={warmthConfig.pulse}
            isHovered={isHovered}
          />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
            {/* Avatar */}
            <Avatar
              size="sm"
              className={`shrink-0 ${isLeader ? 'ring-2 ring-gold-500/50' : ''}`}
            >
              {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
              <AvatarFallback className="text-xs bg-white/[0.06]">
                {getInitials(space.name)}
              </AvatarFallback>
            </Avatar>

            {/* Name and stats */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">
                  {space.name}
                </p>
                {/* Unread badge */}
                {(space.unreadCount ?? 0) > 0 && (
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                    style={{
                      backgroundColor: SPACES_GOLD.primary,
                      color: '#050504',
                    }}
                  >
                    {space.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Energy dots */}
                <EnergyDots count={energyDotCount} />
                {energyDotCount > 0 && <span className="text-white/50">·</span>}
                {/* Member count or online */}
                {(space.onlineCount ?? 0) > 0 ? (
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400/70">
                      {space.onlineCount} here
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-white/50">
                    {space.memberCount} members
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Organizations Grid
// ============================================================

interface OrganizationsGridProps {
  spaces: Space[];
  maxVisible?: number;
  /** Callback when mute action is triggered */
  onMuteSpace?: (spaceId: string) => void;
  /** Callback when leave action is triggered */
  onLeaveSpace?: (spaceId: string) => void;
}

export function OrganizationsGrid({
  spaces,
  maxVisible = 12,
  onMuteSpace,
  onLeaveSpace,
}: OrganizationsGridProps) {
  const displayedSpaces = spaces.slice(0, maxVisible);
  const remainingCount = Math.max(0, spaces.length - maxVisible);

  if (spaces.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-white/50 italic">
          No organizations yet
        </p>
        <Link
          href="/discover"
          className="inline-block mt-3 text-sm text-white/50 hover:text-white/50 transition-colors"
        >
          Browse spaces →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayedSpaces.map((space, index) => (
          <SpaceOrbit
            key={space.id}
            space={space}
            index={index}
            onMute={onMuteSpace}
            onLeave={onLeaveSpace}
          />
        ))}
      </div>

      {/* Show more indicator */}
      {remainingCount > 0 && (
        <div className="mt-4 text-center">
          <Link
            href="/spaces"
            className="text-sm text-white/50 hover:text-white/50 transition-colors"
          >
            +{remainingCount} more spaces
          </Link>
        </div>
      )}
    </div>
  );
}

SpaceOrbit.displayName = 'SpaceOrbit';
OrganizationsGrid.displayName = 'OrganizationsGrid';
