'use client';

/**
 * SpaceThreshold - Welcome Gate for Non-Members
 * CREATED: Jan 21, 2026
 *
 * Premium presentation of a Space before joining.
 * Shows what the space is about, who's there, what's coming.
 *
 * Motion philosophy (aligned with /about):
 * - Luxuriously slow entrance (1.2s)
 * - Word-by-word headline reveals
 * - Animated container borders
 * - Gold accents for key moments
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { AnimatedLine, WordReveal, GoldBorderContainer } from '@hive/ui/motion';
import { MOTION, durationSeconds } from '@hive/tokens';

interface SpaceThresholdProps {
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
    onlineCount: number;
    isVerified?: boolean;
    category?: string;
  };
  upcomingEvents?: Array<{
    id: string;
    title: string;
    time: string;
    goingCount: number;
  }>;
  recentActivity?: {
    messageCount: number;
    lastActiveLabel: string;
  };
  onJoin: () => void;
  onPreview?: () => void;
  isJoining?: boolean;
}

export function SpaceThreshold({
  space,
  upcomingEvents = [],
  recentActivity,
  onJoin,
  onPreview,
  isJoining = false,
}: SpaceThresholdProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-lg">
        {/* Hero: Avatar + Name */}
        <motion.div
          className="flex flex-col items-center text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durationSeconds.hero, ease: MOTION.ease.premium }}
        >
          {/* Space Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: durationSeconds.slow, delay: 0.2, ease: MOTION.ease.premium }}
          >
            <Avatar size="xl" className="mb-6 ring-2 ring-white/10">
              {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
              <AvatarFallback className="text-2xl">{getInitials(space.name)}</AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Space Name - Clash Display */}
          <h1
            className="text-heading-lg md:text-display-sm font-semibold leading-[1.0] tracking-tight text-white mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <WordReveal delay={0.3}>{space.name}</WordReveal>
          </h1>

          {/* Handle */}
          <motion.p
            className="text-body font-mono text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: durationSeconds.gentle, delay: 0.6, ease: MOTION.ease.premium }}
          >
            @{space.handle}
          </motion.p>
        </motion.div>

        {/* Animated separator */}
        <AnimatedLine className="mb-10" delay={0.7} />

        {/* Stats Row */}
        <motion.div
          className="flex items-center justify-center gap-8 mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durationSeconds.gentle, delay: 0.8, ease: MOTION.ease.premium }}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-white/30" />
            <Text size="sm" tone="muted">
              {space.memberCount} members
            </Text>
          </div>
          {space.onlineCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
              <Text size="sm" className="text-[var(--color-gold)]/80">
                {space.onlineCount} online now
              </Text>
            </div>
          )}
        </motion.div>

        {/* Description */}
        {space.description && (
          <motion.p
            className="text-center text-body-lg leading-relaxed text-white/50 mb-10 max-w-md mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durationSeconds.gentle, delay: 0.9, ease: MOTION.ease.premium }}
          >
            {space.description}
          </motion.p>
        )}

        {/* Next Up - Events preview */}
        {upcomingEvents.length > 0 && (
          <GoldBorderContainer className="rounded-xl bg-white/[0.02] p-6 mb-10" delay={1.0}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-[var(--color-gold)]/60" />
              <Text size="xs" className="uppercase tracking-wider text-white/40">
                Next Up
              </Text>
            </div>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 2).map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <Text size="sm" weight="medium">
                    {event.title}
                  </Text>
                  <Text size="xs" tone="muted">
                    {event.time} · {event.goingCount} going
                  </Text>
                </div>
              ))}
            </div>
          </GoldBorderContainer>
        )}

        {/* Activity hint */}
        {recentActivity && (
          <motion.div
            className="flex items-center justify-center gap-2 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: durationSeconds.gentle, delay: 1.2, ease: MOTION.ease.premium }}
          >
            <MessageSquare className="h-3 w-3 text-white/20" />
            <Text size="xs" tone="muted">
              {recentActivity.messageCount} messages · Active {recentActivity.lastActiveLabel}
            </Text>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durationSeconds.gentle, delay: 1.3, ease: MOTION.ease.premium }}
        >
          <Button
            variant="cta"
            size="lg"
            onClick={onJoin}
            disabled={isJoining}
            loading={isJoining}
            className="w-full max-w-[280px]"
          >
            {isJoining ? 'Joining...' : 'Join Space'}
            {!isJoining && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>

          {onPreview && (
            <button
              onClick={onPreview}
              className="text-body-sm text-white/30 hover:text-white/50 transition-colors"
            >
              Preview first
            </button>
          )}
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-center text-label text-white/20 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: durationSeconds.gentle, delay: 1.5, ease: MOTION.ease.premium }}
        >
          You can leave anytime. Your choice.
        </motion.p>
      </div>
    </div>
  );
}

SpaceThreshold.displayName = 'SpaceThreshold';
