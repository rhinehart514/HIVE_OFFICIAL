'use client';

/**
 * ThresholdView - Full threshold experience
 *
 * Layout:
 * - Split: 60% space identity, 40% activity preview
 * - Activity preview behind glass barrier (blur 8px, opacity 0.4)
 * - Glass shows "life inside" without access
 * - Join button is ONLY gold element
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  MOTION,
  NoiseOverlay,
} from '@hive/ui/design-system/primitives';

import { SpaceIdentity } from './space-identity';
import { FamiliarFaces } from './familiar-faces';
import { GlassBarrier } from './glass-barrier';
import { ActivityPreview } from './activity-preview';
import { JoinCeremony } from './join-ceremony';

// ============================================================
// Types
// ============================================================

interface ThresholdViewProps {
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
    onlineCount: number;
    isVerified?: boolean;
    recentMessageCount?: number;
  };
  /** Upcoming events for preview */
  upcomingEvents?: Array<{
    id: string;
    title: string;
    time: string;
    goingCount?: number;
  }>;
  /** Recent activity hints */
  recentActivity?: {
    messageCount: number;
    lastActiveLabel: string;
  };
  /** Mutual connections */
  familiarFaces?: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
  }>;
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
// Component
// ============================================================

export function ThresholdView({
  space,
  upcomingEvents = [],
  recentActivity,
  familiarFaces = [],
  onJoin,
  isJoining = false,
  joinError = null,
  onClearError,
}: ThresholdViewProps) {
  const shouldReduceMotion = useReducedMotion();

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

      {/* Main content */}
      <div className="relative z-20 min-h-screen flex">
        {/* Left side: Space Identity (60%) */}
        <div className="flex-[6] flex flex-col items-center justify-center px-8 py-24">
          <div className="w-full max-w-md">
            {/* Space Identity */}
            <SpaceIdentity space={space} delay={0} />

            {/* Familiar Faces */}
            {familiarFaces.length > 0 && (
              <div className="mt-8">
                <FamiliarFaces faces={familiarFaces} delay={1.0} />
              </div>
            )}

            {/* Join CTA */}
            <div className="mt-10">
              <JoinCeremony
                onJoin={onJoin}
                isJoining={isJoining}
                error={joinError}
                onClearError={onClearError}
                delay={1.2}
              />
            </div>
          </div>
        </div>

        {/* Right side: Activity Preview behind glass (40%) */}
        <div className="flex-[4] flex items-center justify-center border-l border-white/[0.04] px-8 py-24">
          <div className="w-full max-w-sm">
            <GlassBarrier active={true}>
              <ActivityPreview
                messageCount={recentActivity?.messageCount}
                lastActiveLabel={recentActivity?.lastActiveLabel}
                upcomingEvents={upcomingEvents}
                delay={0.8}
              />
            </GlassBarrier>
          </div>
        </div>
      </div>

      {/* Ambient glow at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[300px] pointer-events-none z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.slow,
          delay: shouldReduceMotion ? 0 : 0.3,
        }}
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(255,255,255,0.02), transparent)',
        }}
      />
    </div>
  );
}

ThresholdView.displayName = 'ThresholdView';
