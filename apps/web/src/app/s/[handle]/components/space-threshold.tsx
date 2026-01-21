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
import { motion, useInView } from 'framer-motion';
import { Users, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
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
  slow: 0.8,
  dramatic: 1.0,
  hero: 1.2,
} as const;

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

// Animated line that draws in
function AnimatedLine({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className={className}>
      <motion.div
        className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: DURATION.hero, delay, ease: EASE }}
      />
    </div>
  );
}

// Word-by-word reveal
function WordReveal({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: string;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const words = children.split(' ');

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.gentle, delay: delay + i * stagger, ease: EASE }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Container with animated gold border reveal
function GoldBorderContainer({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: DURATION.dramatic, delay, ease: EASE }}
        style={{ transformOrigin: 'left' }}
      />
      {/* Bottom border */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: DURATION.dramatic, delay: delay + 0.1, ease: EASE }}
        style={{ transformOrigin: 'right' }}
      />
      {/* Left border */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-px bg-[var(--color-gold)]/20"
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: DURATION.dramatic, delay: delay + 0.2, ease: EASE }}
        style={{ transformOrigin: 'top' }}
      />
      {/* Right border */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-px bg-[var(--color-gold)]/20"
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: DURATION.dramatic, delay: delay + 0.3, ease: EASE }}
        style={{ transformOrigin: 'bottom' }}
      />
      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: DURATION.slow, delay: delay + 0.5, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
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
          transition={{ duration: DURATION.hero, ease: EASE }}
        >
          {/* Space Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: DURATION.slow, delay: 0.2, ease: EASE }}
          >
            <Avatar size="xl" className="mb-6 ring-2 ring-white/10">
              {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
              <AvatarFallback className="text-2xl">{getInitials(space.name)}</AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Space Name - Clash Display */}
          <h1
            className="text-[36px] md:text-[48px] font-semibold leading-[1.0] tracking-tight text-white mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <WordReveal delay={0.3}>{space.name}</WordReveal>
          </h1>

          {/* Handle */}
          <motion.p
            className="text-[14px] font-mono text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.gentle, delay: 0.6, ease: EASE }}
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
          transition={{ duration: DURATION.gentle, delay: 0.8, ease: EASE }}
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
            className="text-center text-[16px] leading-relaxed text-white/50 mb-10 max-w-md mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.gentle, delay: 0.9, ease: EASE }}
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
            transition={{ duration: DURATION.gentle, delay: 1.2, ease: EASE }}
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
          transition={{ duration: DURATION.gentle, delay: 1.3, ease: EASE }}
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
              className="text-[13px] text-white/30 hover:text-white/50 transition-colors"
            >
              Preview first
            </button>
          )}
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-center text-[12px] text-white/20 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.gentle, delay: 1.5, ease: EASE }}
        >
          You can leave anytime. Your choice.
        </motion.p>
      </div>
    </div>
  );
}

SpaceThreshold.displayName = 'SpaceThreshold';
