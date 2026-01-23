'use client';

/**
 * EntryShell - Void Aesthetic Entry Layout
 * ENHANCED: Jan 21, 2026
 *
 * Full-screen void layout inspired by OpenAI/Apple + About page:
 * - Centered content on dark void background
 * - Animated line that draws in on load
 * - Ambient glow that responds to emotional state
 * - Logo at top, minimal chrome
 *
 * Philosophy: Entry is confidence. Luxuriously slow. Premium.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Logo, NoiseOverlay } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  type EmotionalState,
  EASE_PREMIUM,
  DURATION,
  lineDrawVariants,
  GOLD,
} from './motion/entry-motion';

export type EntryStep = 'school' | 'email' | 'code' | 'role' | 'identity' | 'arrival' | 'alumni-waitlist';

export interface EntryShellProps {
  children: React.ReactNode;
  /** Current emotional state for ambient effects */
  emotionalState?: EmotionalState;
  /** Current step (unused in void design but kept for compatibility) */
  currentStep?: EntryStep;
  /** Whether to show progress indicator (unused in void design) */
  showProgress?: boolean;
  /** Additional class names for content container */
  className?: string;
  /** Enable scroll for evolving entry */
  scrollable?: boolean;
}

export function EntryShell({
  children,
  emotionalState = 'neutral',
  currentStep = 'school',
  showProgress = false,
  className,
  scrollable = false,
}: EntryShellProps) {
  const shouldReduceMotion = useReducedMotion();

  // Emotional state determines glow intensity
  const isCelebration = emotionalState === 'celebration';
  const isAnticipation = emotionalState === 'anticipation';

  // Glow configuration based on emotional state
  const glowConfig = React.useMemo(() => {
    if (isCelebration) {
      return {
        opacity: 1,
        gradient: `radial-gradient(ellipse 80% 50% at 50% 20%, ${GOLD.glowSubtle}, transparent 70%)`,
      };
    }
    if (isAnticipation) {
      return {
        opacity: 0.6,
        gradient: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,215,0,0.04), transparent 60%)`,
      };
    }
    return {
      opacity: 0,
      gradient: 'transparent',
    };
  }, [isCelebration, isAnticipation]);

  return (
    <div
      className={cn(
        'min-h-screen min-h-[100dvh] flex flex-col bg-[var(--color-bg-void)] text-white relative',
        scrollable ? 'overflow-auto' : 'overflow-hidden'
      )}
    >
      <NoiseOverlay />

      {/* Animated line at top (about-page style) */}
      <motion.div
        className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={lineDrawVariants}
        initial="initial"
        animate="animate"
      />

      {/* Ambient glow - responds to emotional state */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: glowConfig.opacity }}
        transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
        style={{ background: glowConfig.gradient }}
      />

      {/* Header */}
      <motion.header
        className="relative z-10 px-6 py-6 flex items-center justify-between"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
      >
        <Link href="/" className="transition-opacity hover:opacity-70">
          <Logo variant="mark" size="sm" color="gold" />
        </Link>
        <Link
          href="/"
          className="text-[13px] text-white/40 hover:text-white/60 transition-colors"
        >
          Back
        </Link>
      </motion.header>

      {/* Main content - centered, wider like /about for premium feel */}
      <main
        className={cn(
          'flex-1 flex flex-col px-6 relative z-10',
          scrollable ? 'py-8' : 'justify-center py-12'
        )}
      >
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: DURATION.dramatic, ease: EASE_PREMIUM }
          }
          className={cn(
            'w-full max-w-[460px] mx-auto',
            className
          )}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="relative z-10 px-6 py-6 flex items-center justify-center gap-4 text-[12px] text-white/30"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.gentle, delay: 0.5, ease: EASE_PREMIUM }}
      >
        <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
          Terms
        </Link>
        <span className="text-white/20">·</span>
        <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
          Privacy
        </Link>
      </motion.footer>
    </div>
  );
}

/**
 * Static fallback shell for Suspense boundaries
 */
export function EntryShellStatic({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[var(--color-bg-void)] text-white relative">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between">
        <Logo variant="mark" size="sm" color="gold" />
        <span className="text-[13px] text-white/40">Back</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="w-full max-w-[400px] mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 flex items-center justify-center gap-4 text-[12px] text-white/30">
        <span>Terms</span>
        <span className="text-white/20">·</span>
        <span>Privacy</span>
      </footer>
    </div>
  );
}

EntryShell.displayName = 'EntryShell';
EntryShellStatic.displayName = 'EntryShellStatic';
