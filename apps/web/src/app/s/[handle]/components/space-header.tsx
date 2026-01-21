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
import { Settings, ChevronDown, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';

// Premium easing (from about page)
const EASE = [0.22, 1, 0.36, 1] as const;

// Duration scale
const DURATION = {
  fast: 0.15,
  quick: 0.25,
  smooth: 0.4,
  gentle: 0.6,
} as const;

interface SpaceHeaderProps {
  space: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string;
    onlineCount: number;
    memberCount: number;
    isVerified?: boolean;
  };
  isLeader?: boolean;
  isMember?: boolean;
  onSettingsClick?: () => void;
  onSpaceInfoClick?: () => void;
  className?: string;
}

export function SpaceHeader({
  space,
  isLeader = false,
  isMember = true,
  onSettingsClick,
  onSpaceInfoClick,
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
      transition={{ duration: DURATION.gentle, ease: EASE }}
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
          transition={{ duration: DURATION.smooth, delay: 0.1, ease: EASE }}
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
              className="text-[18px] md:text-[20px] font-semibold text-white tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: DURATION.smooth, delay: 0.15, ease: EASE }}
            >
              {space.name}
            </motion.h1>

            {/* Verified/Leader badge */}
            {space.isVerified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: DURATION.quick, delay: 0.3, ease: EASE }}
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
            transition={{ duration: DURATION.smooth, delay: 0.2, ease: EASE }}
          >
            <Text size="xs" tone="muted" className="font-mono">
              @{space.handle}
            </Text>

            {/* Online indicator - gold when active */}
            {space.onlineCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse" />
                <Text size="xs" className="text-[var(--color-gold)]/70">
                  {space.onlineCount} online
                </Text>
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
        transition={{ duration: DURATION.smooth, delay: 0.25, ease: EASE }}
      >
        {/* Member count pill */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <Text size="xs" tone="muted">
            {space.memberCount.toLocaleString()}
          </Text>
          <Text size="xs" tone="muted" className="opacity-50">
            members
          </Text>
        </div>

        {/* Settings (leader only) */}
        {isLeader && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="text-white/40 hover:text-white/60"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </motion.div>
    </motion.header>
  );
}

SpaceHeader.displayName = 'SpaceHeader';
