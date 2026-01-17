'use client';

/**
 * EntryShell - "The Void" Layout
 * LOCKED: Jan 15, 2026
 *
 * Ultra-minimal entry layout. Nothing but the task.
 *
 * Layout:
 * - Content: centered, max-width 360px
 * - Logo: bottom-right corner (subtle)
 * - Background: Pure dark #0A0A09
 * - Ambient glow responds to emotional state
 *
 * Philosophy: Entry should be invisible. Get them in.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HiveLogo } from '@hive/ui';
import { cn } from '@/lib/utils';
import { AmbientGlow } from './motion/AmbientGlow';
import { type EmotionalState, EASE_PREMIUM, DURATION } from './motion/entry-motion';

export interface EntryShellProps {
  children: React.ReactNode;
  /** Current emotional state for ambient glow */
  emotionalState?: EmotionalState;
  /** Hide logo entirely (for special cases) */
  hideLogo?: boolean;
  /** Additional class names for content container */
  className?: string;
}

export function EntryShell({
  children,
  emotionalState = 'neutral',
  hideLogo = false,
  className,
}: EntryShellProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: '#0A0A09' }}
      suppressHydrationWarning
    >
      {/* Ambient glow - responds to emotional state */}
      <AmbientGlow state={emotionalState} />

      {/* Content container - centered */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: DURATION.smooth, ease: EASE_PREMIUM }
        }
        className={cn('w-full max-w-[360px] relative z-10', className)}
      >
        {children}
      </motion.div>

      {/* Logo - bottom right, subtle */}
      {!hideLogo && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0.35 } : { opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: DURATION.slow, delay: 0.4, ease: EASE_PREMIUM }
          }
          className="fixed bottom-6 right-6 flex items-center gap-2 select-none"
        >
          <HiveLogo className="w-5 h-5 text-white" />
          <span className="text-[13px] font-medium tracking-wide text-white uppercase">
            HIVE
          </span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Static fallback shell for Suspense boundaries
 * Matches EntryShell layout without animations
 */
export function EntryShellStatic({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: '#0A0A09' }}
      suppressHydrationWarning
    >
      {/* Content container - centered */}
      <div className="w-full max-w-[360px] relative z-10">
        {children}
      </div>

      {/* Logo - bottom right, subtle */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 opacity-35 select-none">
        <HiveLogo className="w-5 h-5 text-white" />
        <span className="text-[13px] font-medium tracking-wide text-white uppercase">
          HIVE
        </span>
      </div>

      {/* Static glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30vh] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,255,255,0.015) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

EntryShell.displayName = 'EntryShell';
EntryShellStatic.displayName = 'EntryShellStatic';
