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
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, MessageSquare, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { AnimatedLine, WordReveal, GoldBorderContainer } from '@hive/ui/motion';
import { MOTION, durationSeconds } from '@hive/tokens';

/** Preview message for glass barrier peek */
interface PreviewMessage {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  timestamp: string;
}

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
  /** Preview messages for glass barrier peek (blurred) */
  previewMessages?: PreviewMessage[];
  onJoin: () => void;
  onPreview?: () => void;
  isJoining?: boolean;
  /** Error message to display inline (e.g., from failed join attempt) */
  joinError?: string | null;
  /** Callback to clear the error (e.g., when user retries) */
  onClearError?: () => void;
}

export function SpaceThreshold({
  space,
  upcomingEvents = [],
  recentActivity,
  previewMessages = [],
  onJoin,
  onPreview,
  isJoining = false,
  joinError = null,
  onClearError,
}: SpaceThresholdProps) {
  // Clear error when user starts joining
  const handleJoin = () => {
    if (onClearError) {
      onClearError();
    }
    onJoin();
  };
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

        {/* Glass Barrier Peek - Blurred activity preview */}
        {previewMessages.length > 0 && (
          <motion.div
            className="relative mb-10 rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: durationSeconds.gentle, delay: 0.95, ease: MOTION.ease.premium }}
          >
            {/* Glass effect container */}
            <div className="relative">
              {/* Gradient overlay to fade edges */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A09] z-10 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0A0A09] to-transparent z-10 pointer-events-none" />

              {/* Blurred messages */}
              <div
                className="space-y-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                style={{ filter: 'blur(6px)' }}
              >
                {previewMessages.slice(0, 3).map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <Avatar size="sm" className="flex-shrink-0">
                      {msg.authorAvatarUrl && <AvatarImage src={msg.authorAvatarUrl} />}
                      <AvatarFallback>{getInitials(msg.authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <Text size="sm" weight="medium" className="text-white">
                          {msg.authorName}
                        </Text>
                        <Text size="xs" className="text-white/30">
                          {msg.timestamp}
                        </Text>
                      </div>
                      <Text size="sm" className="text-white/60 line-clamp-2">
                        {msg.content}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              {/* "See what's happening" overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="px-4 py-2 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.12]">
                  <Text size="xs" weight="medium" className="text-white/60">
                    <MessageSquare className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                    {previewMessages.length > 3 ? `${previewMessages.length}+ messages` : 'Active conversation'}
                  </Text>
                </div>
              </div>
            </div>
          </motion.div>
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
          {/* Inline Error Message */}
          <AnimatePresence mode="wait">
            {joinError && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: MOTION.ease.premium }}
                className="w-full max-w-[320px] rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Text size="sm" className="text-red-300 leading-snug">
                      {joinError}
                    </Text>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="cta"
            size="lg"
            onClick={handleJoin}
            disabled={isJoining}
            loading={isJoining}
            className="w-full max-w-[280px]"
          >
            {isJoining ? 'Joining...' : joinError ? 'Try Again' : 'Join Space'}
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
