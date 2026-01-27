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
import { motion } from 'framer-motion';
import { Settings, ChevronDown, Crown, Hammer, Globe, Instagram, Twitter, Facebook, Linkedin, Youtube, ExternalLink, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';

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
  };
  isLeader?: boolean;
  isMember?: boolean;
  onSettingsClick?: () => void;
  onMembersClick?: () => void;
  onSpaceInfoClick?: () => void;
  onBuildToolClick?: () => void;
  onCreateEventClick?: () => void;
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

export function SpaceHeader({
  space,
  isLeader = false,
  isMember = true,
  onSettingsClick,
  onMembersClick,
  onSpaceInfoClick,
  onBuildToolClick,
  onCreateEventClick,
  className,
}: SpaceHeaderProps) {
  const energyLevel = getEnergyLevel(space.recentMessageCount);

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

          {/* Row 2: Handle · Members · Online (inline stats) */}
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
            {energyLevel !== 'none' && space.onlineCount === 0 && (
              <>
                <span className="text-white/20">·</span>
                <EnergyDots level={energyLevel} />
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
