'use client';

/**
 * ResidenceHeader - Animated header with border draw
 *
 * Features:
 * - Animated border on first visit (draws after ceremony)
 * - Compact identity: avatar + name + stats inline
 * - Actions: members, settings, create event
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { Users, Settings, Calendar, Plus } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  useInView,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  Button,
} from '@hive/ui/design-system/primitives';
import { SPACES_MOTION, SPACES_GOLD, getEnergyDotCount } from '@hive/ui/tokens';

// ============================================================
// Types
// ============================================================

interface ResidenceHeaderProps {
  space: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string;
    onlineCount: number;
    memberCount: number;
    isVerified?: boolean;
    recentMessageCount?: number;
  };
  /** Whether user is a leader */
  isLeader?: boolean;
  /** Whether to animate the border (first visit) */
  animateBorder?: boolean;
  /** Callback for members button */
  onMembersClick?: () => void;
  /** Callback for settings button */
  onSettingsClick?: () => void;
  /** Callback for create event button */
  onCreateEventClick?: () => void;
  /** Callback for space info */
  onSpaceInfoClick?: () => void;
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
// Component
// ============================================================

export function ResidenceHeader({
  space,
  isLeader = false,
  animateBorder = false,
  onMembersClick,
  onSettingsClick,
  onCreateEventClick,
  onSpaceInfoClick,
}: ResidenceHeaderProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  const energyDotCount = getEnergyDotCount(space.recentMessageCount ?? 0);

  return (
    <motion.header
      ref={ref}
      className="relative px-6 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Animated border on first visit */}
      {animateBorder && isInView && !shouldReduceMotion && (
        <div className="absolute inset-x-6 bottom-0 h-px">
          <motion.div
            className="h-full origin-left"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: SPACES_MOTION.crossing.headerBorder,
              delay: 0.2,
              ease: MOTION.ease.premium,
            }}
          />
        </div>
      )}

      {/* Static border if not animating */}
      {!animateBorder && (
        <div className="absolute inset-x-6 bottom-0 h-px bg-white/[0.06]" />
      )}

      <div className="flex items-center justify-between">
        {/* Left: Space identity */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <button
            onClick={onSpaceInfoClick}
            className="relative group"
          >
            <Avatar size="default" className="ring-2 ring-white/10 group-hover:ring-white/20 transition-all">
              {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
              <AvatarFallback className="text-sm bg-white/[0.06]">
                {getInitials(space.name)}
              </AvatarFallback>
            </Avatar>

            {/* Verified badge */}
            {space.isVerified && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: SPACES_GOLD.primary }}
              >
                <svg
                  className="w-2.5 h-2.5 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>

          {/* Name and stats */}
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSpaceInfoClick}
                className="text-base font-medium text-white/90 hover:text-white transition-colors"
              >
                {space.name}
              </button>

              {/* Energy dots */}
              {energyDotCount > 0 && <EnergyDots count={energyDotCount} />}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-white/40">
                @{space.handle}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-xs text-white/40">
                {space.memberCount} members
              </span>
              {space.onlineCount > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: SPACES_GOLD.primary }}
                    />
                    <span className="text-xs" style={{ color: `${SPACES_GOLD.primary}99` }}>
                      {space.onlineCount} here
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Members */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMembersClick}
            className="text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
          >
            <Users size={16} />
          </Button>

          {/* Create Event (leaders only) */}
          {isLeader && onCreateEventClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateEventClick}
              className="text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
            >
              <Calendar size={16} />
              <Plus size={12} className="ml-0.5 -mr-1" />
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

ResidenceHeader.displayName = 'ResidenceHeader';
