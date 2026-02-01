'use client';

/**
 * GatheringThreshold - Quorum-based space activation UI
 *
 * Shows progress toward activation threshold:
 * - Visual progress bar (7/10 members)
 * - Avatar stack of current gatherers
 * - Messaging emphasizes being early / founding member
 * - CTA to join and help unlock
 *
 * Used when: activationStatus === 'gathering' (1 to threshold-1 members)
 *
 * @version 1.0.0 - Initial implementation
 */

import * as React from 'react';
import { ArrowLeft, Users, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  MOTION,
  NoiseOverlay,
} from '@hive/ui/design-system/primitives';
import { Button, Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { WordReveal, AnimatedLine } from '@hive/ui/motion';
import { durationSeconds } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

interface GathererProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface GatheringThresholdProps {
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    category?: string;
    isVerified?: boolean;
  };
  /** Current member count */
  memberCount: number;
  /** Activation threshold */
  threshold: number;
  /** Profiles of current gatherers (up to 5 shown) */
  gatherers?: GathererProfile[];
  /** Join action */
  onJoin: () => void;
  /** Whether joining is in progress */
  isJoining?: boolean;
  /** Error message from failed join */
  joinError?: string | null;
  /** Clear error callback */
  onClearError?: () => void;
}

// ============================================================
// Progress Ring Component
// ============================================================

function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 4,
  delay = 0,
}: {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{
          duration: shouldReduceMotion ? 0 : 1.2,
          delay: shouldReduceMotion ? 0 : delay,
          ease: MOTION.ease.premium,
        }}
      />
    </svg>
  );
}

// ============================================================
// Avatar Stack Component
// ============================================================

function GathererStack({
  gatherers,
  maxDisplay = 5,
  delay = 0,
}: {
  gatherers: GathererProfile[];
  maxDisplay?: number;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const displayed = gatherers.slice(0, maxDisplay);
  const overflow = Math.max(0, gatherers.length - maxDisplay);

  return (
    <motion.div
      className="flex items-center -space-x-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.standard,
        delay: shouldReduceMotion ? 0 : delay,
      }}
    >
      {displayed.map((gatherer, i) => (
        <motion.div
          key={gatherer.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.3,
            delay: shouldReduceMotion ? 0 : delay + i * 0.1,
          }}
        >
          <Avatar
            size="sm"
            className="ring-2 ring-[#0A0A09] hover:ring-white/20 transition-all hover:scale-110 hover:z-10"
            title={gatherer.name}
          >
            {gatherer.avatarUrl && <AvatarImage src={gatherer.avatarUrl} />}
            <AvatarFallback>{getInitials(gatherer.name)}</AvatarFallback>
          </Avatar>
        </motion.div>
      ))}
      {overflow > 0 && (
        <motion.div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 ring-2 ring-[#0A0A09] text-xs font-medium text-white/60"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.3,
            delay: shouldReduceMotion ? 0 : delay + maxDisplay * 0.1,
          }}
        >
          +{overflow}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function GatheringThreshold({
  space,
  memberCount,
  threshold,
  gatherers = [],
  onJoin,
  isJoining = false,
  joinError = null,
  onClearError,
}: GatheringThresholdProps) {
  const shouldReduceMotion = useReducedMotion();
  const progress = Math.min(1, memberCount / threshold);
  const membersNeeded = Math.max(0, threshold - memberCount);

  const handleJoin = () => {
    if (onClearError) onClearError();
    onJoin();
  };

  // Dynamic messaging based on progress
  const getMessage = () => {
    if (memberCount === 0) {
      return { headline: 'Be the first', subtext: `${threshold} members to unlock` };
    }
    if (memberCount === 1) {
      return { headline: '1 founding member', subtext: `${membersNeeded} more to unlock` };
    }
    if (progress >= 0.8) {
      return { headline: 'Almost there', subtext: `Just ${membersNeeded} more to unlock!` };
    }
    if (progress >= 0.5) {
      return { headline: `${memberCount} gathering`, subtext: `${membersNeeded} more to unlock` };
    }
    return { headline: `${memberCount} founding members`, subtext: `${membersNeeded} more to unlock` };
  };

  const message = getMessage();

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#050504' }}
    >
      {/* Noise texture */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.015]">
        <NoiseOverlay opacity={1} />
      </div>

      {/* Back navigation */}
      <motion.div
        className="absolute top-6 left-6 z-30"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : 0.5,
        }}
      >
        <Link
          href="/spaces"
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Spaces
        </Link>
      </motion.div>

      {/* Main content - centered */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-md">
          {/* Progress Ring + Avatar */}
          <motion.div
            className="relative flex items-center justify-center mb-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : durationSeconds.slow,
              delay: shouldReduceMotion ? 0 : 0.2,
            }}
          >
            <ProgressRing progress={progress} size={140} strokeWidth={3} delay={0.4} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar size="xl" className="ring-2 ring-white/10">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback className="text-2xl">{getInitials(space.name)}</AvatarFallback>
              </Avatar>
            </div>
          </motion.div>

          {/* Space Name */}
          <div className="text-center mb-4">
            <h1
              className="text-heading-lg md:text-display-sm font-semibold leading-[1.0] tracking-tight text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <WordReveal delay={0.4}>{space.name}</WordReveal>
            </h1>
            <motion.p
              className="text-body font-mono text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0 : durationSeconds.gentle,
                delay: shouldReduceMotion ? 0 : 0.6,
              }}
            >
              @{space.handle}
            </motion.p>
          </div>

          <AnimatedLine className="my-8" delay={0.7} />

          {/* Gathering Status */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : durationSeconds.gentle,
              delay: shouldReduceMotion ? 0 : 0.8,
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
              <Text size="lg" weight="semibold" className="text-white">
                {message.headline}
              </Text>
            </div>
            <Text size="sm" tone="muted">
              {message.subtext}
            </Text>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : durationSeconds.gentle,
              delay: shouldReduceMotion ? 0 : 0.9,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Text size="xs" tone="muted">Progress</Text>
              <Text size="xs" className="text-[var(--color-gold)] font-medium">
                {memberCount}/{threshold}
              </Text>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--color-gold)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 1.0,
                  delay: shouldReduceMotion ? 0 : 1.0,
                  ease: MOTION.ease.premium,
                }}
              />
            </div>
          </motion.div>

          {/* Gatherer Avatars */}
          {gatherers.length > 0 && (
            <motion.div
              className="flex flex-col items-center mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : durationSeconds.gentle,
                delay: shouldReduceMotion ? 0 : 1.1,
              }}
            >
              <Text size="xs" tone="muted" className="mb-3 uppercase tracking-wider">
                Already gathering
              </Text>
              <GathererStack gatherers={gatherers} delay={1.2} />
            </motion.div>
          )}

          {/* Description */}
          {space.description && (
            <motion.p
              className="text-center text-body leading-relaxed text-white/50 mb-10 max-w-sm mx-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : durationSeconds.gentle,
                delay: shouldReduceMotion ? 0 : 1.2,
              }}
            >
              {space.description}
            </motion.p>
          )}

          {/* CTA */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : durationSeconds.gentle,
              delay: shouldReduceMotion ? 0 : 1.3,
            }}
          >
            {/* Error */}
            {joinError && (
              <div className="w-full max-w-[320px] rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-center">
                <Text size="sm" className="text-red-300">
                  {joinError}
                </Text>
              </div>
            )}

            <Button
              variant="cta"
              size="lg"
              onClick={handleJoin}
              disabled={isJoining}
              loading={isJoining}
              className="w-full max-w-[280px]"
            >
              {isJoining ? 'Joining...' : 'Join the Gathering'}
              {!isJoining && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>

            <Text size="xs" tone="muted" className="text-center max-w-[240px]">
              Be a founding member. Full features unlock at {threshold} members.
            </Text>
          </motion.div>

          {/* What unlocks */}
          <motion.div
            className="mt-12 rounded-xl bg-white/[0.02] border border-white/[0.06] p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : durationSeconds.gentle,
              delay: shouldReduceMotion ? 0 : 1.5,
            }}
          >
            <Text size="xs" tone="muted" className="uppercase tracking-wider mb-4">
              <Users className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
              Unlocks at {threshold} members
            </Text>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]" />
                <Text size="sm" className="text-white/60">Group chat & conversations</Text>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]" />
                <Text size="sm" className="text-white/60">Event creation & RSVPs</Text>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]" />
                <Text size="sm" className="text-white/60">Custom boards & tools</Text>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Ambient glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[300px] pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.slow,
          delay: shouldReduceMotion ? 0 : 0.3,
        }}
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(212,175,55,0.03), transparent)',
        }}
      />
    </div>
  );
}

GatheringThreshold.displayName = 'GatheringThreshold';
