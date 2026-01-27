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
  return (
    <motion.header
      className={cn(
        'flex items-center justify-between py-4',
        'border-b border-white/[0.06]',
        className
      )}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durationSeconds.gentle, ease: MOTION.ease.premium }}
    >
      {/* Left: Identity */}
      <button
        onClick={onSpaceInfoClick}
        className="flex items-center gap-3 group"
      >
        {/* Avatar with entrance animation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: durationSeconds.smooth, delay: 0.1, ease: MOTION.ease.premium }}
        >
          <Avatar size="default" className="group-hover:ring-2 ring-white/10 transition-all">
            {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
            <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Name and handle */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            {/* Space name - Clash Display */}
            <motion.h1
              className="text-title-sm md:text-title font-semibold text-white tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: durationSeconds.smooth, delay: 0.15, ease: MOTION.ease.premium }}
            >
              {space.name}
            </motion.h1>

            {/* Verified/Leader badge */}
            {space.isVerified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: durationSeconds.quick, delay: 0.3, ease: MOTION.ease.premium }}
                title="Verified Organization"
              >
                <Crown className="h-3.5 w-3.5 text-[var(--color-gold)]" />
              </motion.div>
            )}

            {/* Dropdown indicator */}
            <ChevronDown className="h-3.5 w-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
          </div>

          {/* Handle and online count */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: durationSeconds.smooth, delay: 0.2, ease: MOTION.ease.premium }}
          >
            <Text size="xs" tone="muted" className="font-mono">
              @{space.handle}
            </Text>

            {/* Energy indicator - shows activity level and presence */}
            {(() => {
              const energyLevel = getEnergyLevel(space.recentMessageCount);
              return (
                <div className="flex items-center gap-2">
                  {/* Energy dots */}
                  {energyLevel !== 'none' && (
                    <div className="flex items-center gap-1">
                      <EnergyDots level={energyLevel} />
                      <Text size="xs" className="text-white/40">
                        {energyLevel}
                      </Text>
                    </div>
                  )}

                  {/* Presence count - "here now" instead of "online" */}
                  {space.onlineCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse" />
                      <Text size="xs" className="text-[var(--color-gold)]/70">
                        {space.onlineCount} here now
                      </Text>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Social Links (P2.2) */}
            {space.socialLinks && Object.values(space.socialLinks).some(Boolean) && (
              <div className="flex items-center gap-2 ml-2 border-l border-white/[0.06] pl-3">
                {space.socialLinks.website && (
                  <a
                    href={space.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white/60 transition-colors"
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
                    className="text-white/40 hover:text-white/60 transition-colors"
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
                    className="text-white/40 hover:text-white/60 transition-colors"
                    title="Twitter/X"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                )}
                {space.socialLinks.facebook && (
                  <a
                    href={space.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white/60 transition-colors"
                    title="Facebook"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Facebook className="h-3.5 w-3.5" />
                  </a>
                )}
                {space.socialLinks.linkedin && (
                  <a
                    href={space.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white/60 transition-colors"
                    title="LinkedIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}
                {space.socialLinks.youtube && (
                  <a
                    href={space.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white/60 transition-colors"
                    title="YouTube"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Youtube className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </button>

      {/* Right: Actions */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: durationSeconds.smooth, delay: 0.25, ease: MOTION.ease.premium }}
      >
        {/* Members button */}
        {onMembersClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMembersClick}
            className="text-white/50 hover:text-white/70"
          >
            <span className="hidden sm:inline">Members</span>
            <span className="text-xs ml-1.5 opacity-60">
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
            className="text-[var(--hive-brand-primary)]/60 hover:text-[var(--hive-brand-primary)]"
            title="Build a tool for this space"
          >
            <Hammer className="h-4 w-4" />
            <span className="hidden sm:inline ml-2 text-xs">Build</span>
          </Button>
        )}

        {/* Create Event (leader only) */}
        {isLeader && onCreateEventClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateEventClick}
            className="text-[var(--color-gold)]/60 hover:text-[var(--color-gold)]"
            title="Create an event for this space"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline ml-2 text-xs">Event</span>
          </Button>
        )}

        {/* Settings - Available to all members (leaders get full access, members get leave option) */}
        {isMember && onSettingsClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="text-white/40 hover:text-white/60"
            title={isLeader ? "Space settings" : "Leave space"}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </motion.div>
    </motion.header>
  );
}

SpaceHeader.displayName = 'SpaceHeader';
