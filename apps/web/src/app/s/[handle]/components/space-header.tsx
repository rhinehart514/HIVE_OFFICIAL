'use client';

/**
 * SpaceHeader - Premium Space Identity Header
 * CREATED: Jan 21, 2026
 *
 * Displays space identity with Clash Display and premium motion.
 * Feels like home, not a feature page.
 *
 * Motion philosophy (aligned with /about):
 * - Entrance animation on mount
 * - Gold accent for online indicator
 * - Subtle hover states
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, Crown, Hammer, Globe, Instagram, Twitter, Facebook, Linkedin, Youtube, ExternalLink, Calendar, Shield, BellOff, Bell, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Text, Avatar, AvatarImage, AvatarFallback, getInitials, SpaceHealthBadge, getSpaceHealthLevel, type SpaceHealthLevel } from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';
import { useAuth } from '@hive/auth-logic';

type EnergyLevel = 'busy' | 'active' | 'quiet' | 'none';

interface SpaceHeaderProps {
  space: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string;
    onlineCount: number;
    memberCount: number;
    isVerified?: boolean;
    // CampusLabs metadata (P2.2)
    socialLinks?: {
      website?: string;
      instagram?: string;
      twitter?: string;
      facebook?: string;
      linkedin?: string;
      youtube?: string;
    };
    // Energy signals (Sprint 3)
    recentMessageCount?: number;
    /** Last activity timestamp */
    lastActivityAt?: string | Date | null;
    /** New members in last 7 days */
    newMembers7d?: number;
  };
  isLeader?: boolean;
  isMember?: boolean;
  onSettingsClick?: () => void;
  onMembersClick?: () => void;
  onSpaceInfoClick?: () => void;
  onBuildToolClick?: () => void;
  onCreateEventClick?: () => void;
  onModerationClick?: () => void;
  /** Whether user can moderate (owner, admin, or moderator role) */
  canModerate?: boolean;
  /** Whether the space is currently muted */
  isMuted?: boolean;
  /** Callback when mute state changes. Returns the muteUntil ISO string or null to unmute. */
  onMuteChange?: (muteUntil: string | null) => void;
  className?: string;
}

/**
 * Calculate energy level from recent message count (last 24 hours)
 * - busy: 20+ messages
 * - active: 5-19 messages
 * - quiet: 1-4 messages
 * - none: 0 messages
 */
function getEnergyLevel(messageCount: number = 0): EnergyLevel {
  if (messageCount >= 20) return 'busy';
  if (messageCount >= 5) return 'active';
  if (messageCount >= 1) return 'quiet';
  return 'none';
}

/**
 * Energy dots component
 */
function EnergyDots({ level }: { level: EnergyLevel }) {
  if (level === 'none') return null;

  const dotCount = level === 'busy' ? 3 : level === 'active' ? 2 : 1;

  return (
    <div className="flex items-center gap-0.5 mr-1.5">
      {[...Array(dotCount)].map((_, i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-[var(--color-gold)]"
        />
      ))}
    </div>
  );
}

const MUTE_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '8 hours', hours: 8 },
  { label: '24 hours', hours: 24 },
  { label: 'Until I turn off', hours: null },
] as const;

function MuteDropdown({
  isMuted,
  onMuteChange,
  spaceId,
}: {
  isMuted: boolean;
  onMuteChange: (muteUntil: string | null) => void;
  spaceId: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMute = (hours: number | null) => {
    if (hours === null) {
      // Mute indefinitely - use a far-future date
      const farFuture = new Date('2099-12-31T23:59:59Z');
      onMuteChange(farFuture.toISOString());
    } else {
      const until = new Date(Date.now() + hours * 60 * 60 * 1000);
      onMuteChange(until.toISOString());
    }
    setIsOpen(false);
  };

  const handleUnmute = () => {
    onMuteChange(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-2 transition-colors',
          isMuted
            ? 'text-[var(--color-gold)]/60 hover:text-[var(--color-gold)]'
            : 'text-white/40 hover:text-white/60'
        )}
        title={isMuted ? 'Notifications muted' : 'Mute notifications'}
      >
        {isMuted ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{
              duration: durationSeconds.snap,
              ease: MOTION.ease.default,
            }}
            className={cn(
              'absolute right-0 top-full mt-1 z-50',
              'w-48 py-1',
              'rounded-xl',
              'bg-[var(--bg-surface-hover)] border border-white/[0.08]',
              'shadow-lg shadow-black/30'
            )}
          >
            {isMuted ? (
              <button
                onClick={handleUnmute}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left',
                  'text-xs text-white/60 hover:text-white hover:bg-white/[0.04]',
                  'transition-colors'
                )}
              >
                <Bell className="w-3.5 h-3.5" />
                Unmute notifications
              </button>
            ) : (
              <>
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                    Mute for
                  </span>
                </div>
                {MUTE_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleMute(option.hours)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left',
                      'text-xs text-white/60 hover:text-white hover:bg-white/[0.04]',
                      'transition-colors'
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {option.label}
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SpaceHeader({
  space,
  isLeader = false,
  isMember = true,
  onSettingsClick,
  onMembersClick,
  onSpaceInfoClick,
  onBuildToolClick,
  onCreateEventClick,
  onModerationClick,
  canModerate = false,
  isMuted = false,
  onMuteChange,
  className,
}: SpaceHeaderProps) {
  const energyLevel = getEnergyLevel(space.recentMessageCount);

  // Calculate health level for health indicator
  const healthLevel = getSpaceHealthLevel({
    lastActivityAt: space.lastActivityAt,
    onlineCount: space.onlineCount,
    recentMessageCount: space.recentMessageCount,
    memberCount: space.memberCount,
    newMembers7d: space.newMembers7d,
  });

  return (
    <motion.header
      className={cn(
        'flex items-center justify-between py-3',
        'border-b border-white/[0.06]',
        className
      )}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durationSeconds.quick, ease: MOTION.ease.premium }}
    >
      {/* Left: Compressed Identity */}
      <button
        onClick={onSpaceInfoClick}
        className="flex items-center gap-3 group min-w-0"
      >
        {/* Smaller avatar (40px = size="default") */}
        <Avatar size="default" className="flex-shrink-0 group-hover:ring-2 ring-white/10 transition-all">
          {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
          <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
        </Avatar>

        {/* Name + Handle + Stats - Compressed */}
        <div className="flex flex-col items-start min-w-0">
          {/* Row 1: Name + Verified + Dropdown */}
          <div className="flex items-center gap-2">
            <h1
              className="text-body font-semibold text-white truncate max-w-[200px] md:max-w-none"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {space.name}
            </h1>
            {space.isVerified && (
              <Crown className="h-3 w-3 text-[var(--color-gold)] flex-shrink-0" />
            )}
            <ChevronDown className="h-3 w-3 text-white/30 group-hover:text-white/50 transition-colors flex-shrink-0" />
          </div>

          {/* Row 2: Handle · Members · Online · Health (inline stats) */}
          <div className="flex items-center gap-2 text-label text-white/40">
            <span className="font-mono">@{space.handle}</span>
            <span className="text-white/20">·</span>
            <span>{space.memberCount} members</span>
            {space.onlineCount > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1 text-emerald-400/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {space.onlineCount} online
                </span>
              </>
            )}
            {/* Health indicator - show when no online users */}
            {space.onlineCount === 0 && (
              <>
                <span className="text-white/20">·</span>
                <SpaceHealthBadge
                  level={healthLevel}
                  variant="compact"
                  showLabel
                  dotSize="xs"
                  animated
                />
              </>
            )}
          </div>
        </div>
      </button>

      {/* Right: Actions - More compact */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Social links - only show on larger screens */}
        {space.socialLinks && Object.values(space.socialLinks).some(Boolean) && (
          <div className="hidden md:flex items-center gap-1.5 mr-2 pr-2 border-r border-white/[0.06]">
            {space.socialLinks.website && (
              <a
                href={space.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-white/30 hover:text-white/50 transition-colors"
                title="Website"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="h-3.5 w-3.5" />
              </a>
            )}
            {space.socialLinks.instagram && (
              <a
                href={space.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-white/30 hover:text-white/50 transition-colors"
                title="Instagram"
                onClick={(e) => e.stopPropagation()}
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
            )}
            {space.socialLinks.twitter && (
              <a
                href={space.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-white/30 hover:text-white/50 transition-colors"
                title="Twitter/X"
                onClick={(e) => e.stopPropagation()}
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Members button */}
        {onMembersClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMembersClick}
            className="text-white/50 hover:text-white/70 px-2"
          >
            <span className="hidden sm:inline text-xs">Members</span>
            <span className="text-xs sm:ml-1 opacity-60">
              {space.memberCount}
            </span>
          </Button>
        )}

        {/* Build Tool (leader/builder only) */}
        {isLeader && onBuildToolClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBuildToolClick}
            className="text-[var(--hive-brand-primary)]/60 hover:text-[var(--hive-brand-primary)] px-2"
            title="Build a tool for this space"
          >
            <Hammer className="h-4 w-4" />
          </Button>
        )}

        {/* Create Event (leader only) */}
        {isLeader && onCreateEventClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateEventClick}
            className="text-[var(--color-gold)]/60 hover:text-[var(--color-gold)] px-2"
            title="Create an event for this space"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}

        {/* Moderation (moderators, admins, owners) */}
        {canModerate && onModerationClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onModerationClick}
            className="text-white/40 hover:text-white/60 px-2"
            title="Moderation queue"
          >
            <Shield className="h-4 w-4" />
          </Button>
        )}

        {/* Mute notifications */}
        {isMember && onMuteChange && (
          <MuteDropdown
            isMuted={isMuted}
            onMuteChange={onMuteChange}
            spaceId={space.id}
          />
        )}

        {/* Settings */}
        {isMember && onSettingsClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="text-white/40 hover:text-white/60 px-2"
            title={isLeader ? "Space settings" : "Leave space"}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.header>
  );
}

SpaceHeader.displayName = 'SpaceHeader';
