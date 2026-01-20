'use client';

/**
 * EntryShell - Split-Screen Immersive Layout
 * REDESIGNED: Jan 18, 2026
 *
 * Split-screen entry layout:
 * - Left (40%): Ambient brand panel with logo, glow, particles
 * - Right (60%): Content panel with form inputs
 * - Mobile: Stacked vertically
 *
 * Philosophy: Entry is the first impression. Make it feel like home.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HiveLogo } from '@hive/ui';
import { cn } from '@/lib/utils';
import { AmbientGlow } from './motion/AmbientGlow';
import { EntryProgress } from './EntryProgress';
import { type EmotionalState, EASE_PREMIUM, DURATION } from './motion/entry-motion';

export type EntryStep = 'school' | 'email' | 'code' | 'role' | 'identity' | 'arrival' | 'alumni-waitlist';

export interface EntryShellProps {
  children: React.ReactNode;
  /** Current emotional state for ambient glow */
  emotionalState?: EmotionalState;
  /** Current step for progress indicator */
  currentStep?: EntryStep;
  /** Whether to show progress indicator */
  showProgress?: boolean;
  /** Additional class names for content container */
  className?: string;
}

const STEP_LABELS: Record<EntryStep, string> = {
  school: 'Campus',
  email: 'Email',
  role: 'Role',
  code: 'Verify',
  identity: 'Profile',
  arrival: 'Done',
  'alumni-waitlist': 'Done',
};

export function EntryShell({
  children,
  emotionalState = 'neutral',
  currentStep = 'school',
  showProgress = true,
  className,
}: EntryShellProps) {
  const shouldReduceMotion = useReducedMotion();

  // Hide progress on arrival/waitlist (celebration/confirmation takes full focus)
  const displayProgress = showProgress && currentStep !== 'arrival' && currentStep !== 'alumni-waitlist';

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row relative overflow-hidden"
      style={{ backgroundColor: '#0A0A09' }}
      suppressHydrationWarning
    >
      {/* LEFT PANEL - Ambient Brand (40% desktop, header on mobile) */}
      <div className="relative w-full lg:w-[40%] h-[30vh] lg:h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background glow - extends beyond panel */}
        <AmbientGlow state={emotionalState} height="100%" />

        {/* Gradient overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(10,10,9,0.6) 100%)',
          }}
        />

        {/* Logo centered */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: DURATION.gentle, ease: EASE_PREMIUM }
          }
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <HiveLogo className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
          <motion.span
            initial={shouldReduceMotion ? { opacity: 0.8 } : { opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: DURATION.slow, delay: 0.2, ease: EASE_PREMIUM }
            }
            className="text-sm lg:text-base font-medium tracking-[0.2em] text-white uppercase"
          >
            HIVE
          </motion.span>
        </motion.div>

        {/* Subtle tagline on desktop */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 0.3 } : { opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: DURATION.slow, delay: 0.4, ease: EASE_PREMIUM }
          }
          className="hidden lg:block absolute bottom-8 text-xs text-white/30 tracking-wide"
        >
          Your campus. Your people. Your tools.
        </motion.p>
      </div>

      {/* RIGHT PANEL - Content (60% desktop, main on mobile) */}
      <div className="relative flex-1 lg:w-[60%] flex flex-col items-center justify-center px-6 py-12 lg:py-0">
        {/* Progress indicator */}
        {displayProgress && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: DURATION.smooth, delay: 0.1, ease: EASE_PREMIUM }
            }
            className="absolute top-6 lg:top-8 left-6 right-6 lg:left-auto lg:right-auto lg:w-full lg:max-w-[400px]"
          >
            <EntryProgress currentStep={currentStep} />
          </motion.div>
        )}

        {/* Content container */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: DURATION.smooth, ease: EASE_PREMIUM }
          }
          className={cn('w-full max-w-[400px] relative z-10', className)}
        >
          {children}
        </motion.div>
      </div>
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
      className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row relative overflow-hidden"
      style={{ backgroundColor: '#0A0A09' }}
      suppressHydrationWarning
    >
      {/* LEFT PANEL - Static */}
      <div className="relative w-full lg:w-[40%] h-[30vh] lg:h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Static glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,255,255,0.015) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <HiveLogo className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
          <span className="text-sm lg:text-base font-medium tracking-[0.2em] text-white/80 uppercase">
            HIVE
          </span>
        </div>
      </div>

      {/* RIGHT PANEL - Content */}
      <div className="relative flex-1 lg:w-[60%] flex flex-col items-center justify-center px-6 py-12 lg:py-0">
        <div className="w-full max-w-[400px] relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

EntryShell.displayName = 'EntryShell';
EntryShellStatic.displayName = 'EntryShellStatic';
