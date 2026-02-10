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
import { Settings, ChevronDown, Hammer, Globe, Instagram, Twitter, Calendar, Shield, BellOff, Bell, Clock, Plus, BarChart3, UserCheck, ClipboardList, Timer, Sparkles, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';



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
    /** Whether the space has been claimed */
    isClaimed?: boolean;
  };
  isLeader?: boolean;
  isMember?: boolean;
  onSettingsClick?: () => void;
  onMembersClick?: () => void;
  onSpaceInfoClick?: () => void;
  onBuildToolClick?: () => void;
  onCreateEventClick?: () => void;
  onModerationClick?: () => void;
  onClaimClick?: () => void;
  /** Leader create menu actions */
  onCreatePoll?: () => void;
  onCreateRsvp?: () => void;
  onCreateSignup?: () => void;
  onCreateCountdown?: () => void;
  onCreateWithAI?: () => void;
  /** Whether user can moderate (owner, admin, or moderator role) */
  canModerate?: boolean;
  /** Whether the space is currently muted */
  isMuted?: boolean;
  /** Callback when mute state changes. Returns the muteUntil ISO string or null to unmute. */
  onMuteChange?: (muteUntil: string | null) => void;
  className?: string;
}

const MUTE_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '8 hours', hours: 8 },
  { label: '24 hours', hours: 24 },
  { label: 'Until I turn off', hours: null },
] as const;

function LeaderCreateMenu({
  onCreatePoll,
  onCreateRsvp,
  onCreateSignup,
  onCreateCountdown,
  onCreateEvent,
  onCreateWithAI,
  onBuildTool,
}: {
  onCreatePoll?: () => void;
  onCreateRsvp?: () => void;
  onCreateSignup?: () => void;
  onCreateCountdown?: () => void;
  onCreateEvent?: () => void;
  onCreateWithAI?: () => void;
  onBuildTool?: () => void;
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

  const menuItems = [
    { icon: BarChart3, label: 'Poll', onClick: onCreatePoll },
    { icon: UserCheck, label: 'RSVP', onClick: onCreateRsvp },
    { icon: ClipboardList, label: 'Signup', onClick: onCreateSignup },
    { icon: Timer, label: 'Countdown', onClick: onCreateCountdown },
    { icon: Calendar, label: 'Event', onClick: onCreateEvent },
    { icon: Sparkles, label: 'AI Generate', onClick: onCreateWithAI },
    { icon: Wrench, label: 'Builder', onClick: onBuildTool },
  ].filter(item => item.onClick);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
        title="Create content"
      >
        <Plus className="h-4 w-4" />
      </button>

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
              'rounded-lg',
              'bg-[var(--bg-surface-hover)] border border-white/[0.06]',
            )}
          >
            <div className="px-3 py-1.5">
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider font-mono">
                Create
              </span>
            </div>
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left',
                  'text-xs text-white/50 hover:text-white hover:bg-white/[0.06]',
                  'transition-colors'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MuteDropdown({
  isMuted,
  onMuteChange,
  spaceId: _spaceId,
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
        title={isMuted ? 'Notifications muted' : 'Mute notifications'}
      >
        {isMuted ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
      </button>

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
              'rounded-lg',
              'bg-[var(--bg-surface-hover)] border border-white/[0.06]',
            )}
          >
            {isMuted ? (
              <button
                onClick={handleUnmute}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left',
                  'text-xs text-white/50 hover:text-white hover:bg-white/[0.06]',
                  'transition-colors'
                )}
              >
                <Bell className="w-3.5 h-3.5" />
                Unmute notifications
              </button>
            ) : (
              <>
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider font-mono">
                    Mute for
                  </span>
                </div>
                {MUTE_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleMute(option.hours)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left',
                      'text-xs text-white/50 hover:text-white hover:bg-white/[0.06]',
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
  onClaimClick,
  onCreatePoll,
  onCreateRsvp,
  onCreateSignup,
  onCreateCountdown,
  onCreateWithAI,
  canModerate = false,
  isMuted = false,
  onMuteChange,
  className,
}: SpaceHeaderProps) {
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
        <Avatar size="default" className="flex-shrink-0 group-hover:ring-2 ring-white/[0.06] transition-all">
          {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
          <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
        </Avatar>

        {/* Name + Handle + Stats - Compressed */}
        <div className="flex flex-col items-start min-w-0">
          {/* Row 1: Name + Dropdown */}
          <div className="flex items-center gap-2">
            <h1
              className="text-body font-semibold text-white truncate max-w-[200px] md:max-w-none"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {space.name}
            </h1>
            <ChevronDown className="h-3 w-3 text-white/50 group-hover:text-white transition-colors flex-shrink-0" />
          </div>

          {/* Row 2: Handle · Members · Online */}
          <div className="flex items-center gap-2 text-label text-white/50">
            <span className="font-mono">@{space.handle}</span>
            <span>·</span>
            <span>{space.memberCount} members</span>
            {space.onlineCount > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {space.onlineCount} online
                </span>
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
                className="p-1.5 text-white/50 hover:text-white transition-colors"
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
                className="p-1.5 text-white/50 hover:text-white transition-colors"
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
                className="p-1.5 text-white/50 hover:text-white transition-colors"
                title="Twitter/X"
                onClick={(e) => e.stopPropagation()}
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Claim This Space button - only for unclaimed spaces */}
        {space.isClaimed === false && onClaimClick && (
          <button
            onClick={onClaimClick}
            className="rounded-full px-4 py-1.5 text-xs font-medium bg-[var(--color-gold)] text-black hover:bg-[var(--color-gold)]/90 transition-colors"
          >
            Claim This Space
          </button>
        )}

        {/* Members button - pill */}
        {onMembersClick && (
          <button
            onClick={onMembersClick}
            className="rounded-full px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <span className="hidden sm:inline">Members</span>
            <span className="sm:ml-1">
              {space.memberCount}
            </span>
          </button>
        )}

        {/* Leader Create Menu - consolidated creation options */}
        {isLeader && (
          <LeaderCreateMenu
            onCreatePoll={onCreatePoll}
            onCreateRsvp={onCreateRsvp}
            onCreateSignup={onCreateSignup}
            onCreateCountdown={onCreateCountdown}
            onCreateEvent={onCreateEventClick}
            onCreateWithAI={onCreateWithAI}
            onBuildTool={onBuildToolClick}
          />
        )}

        {/* Moderation (moderators, admins, owners) - pill */}
        {canModerate && onModerationClick && (
          <button
            onClick={onModerationClick}
            className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Moderation queue"
          >
            <Shield className="h-4 w-4" />
          </button>
        )}

        {/* Mute notifications */}
        {isMember && onMuteChange && (
          <MuteDropdown
            isMuted={isMuted}
            onMuteChange={onMuteChange}
            spaceId={space.id}
          />
        )}

        {/* Settings - pill */}
        {isMember && onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="rounded-full p-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            title={isLeader ? "Space settings" : "Leave space"}
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.header>
  );
}

SpaceHeader.displayName = 'SpaceHeader';
