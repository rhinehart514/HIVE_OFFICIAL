'use client';

/**
 * EntryShell - Void Aesthetic Entry Layout
 * REDESIGNED: Jan 21, 2026
 *
 * Full-screen void layout inspired by OpenAI/Apple:
 * - Centered content on dark void background
 * - Logo at top, minimal chrome
 * - Content vertically centered
 * - Mobile: Same layout, responsive sizing
 *
 * Philosophy: Entry is confidence. Minimal, premium, focused.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Logo, NoiseOverlay } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { type EmotionalState, EASE_PREMIUM, DURATION } from './motion/entry-motion';

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

  // Celebration state gets subtle gold glow
  const isCelebration = emotionalState === 'celebration';

  return (
    <div
      className={cn(
        'min-h-screen min-h-[100dvh] flex flex-col bg-[var(--color-bg-void)] text-white relative',
        scrollable ? 'overflow-auto' : 'overflow-hidden'
      )}
    >
      <NoiseOverlay />

      {/* Ambient glow for celebration state */}
      {isCelebration && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: EASE_PREMIUM }}
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,215,0,0.08) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between">
        <Link href="/" className="transition-opacity hover:opacity-70">
          <Logo variant="mark" size="sm" color="gold" />
        </Link>
        <Link
          href="/"
          className="text-[13px] text-white/40 hover:text-white/60 transition-colors"
        >
          Back
        </Link>
      </header>

      {/* Main content - centered */}
      <main
        className={cn(
          'flex-1 flex flex-col px-6 relative z-10',
          scrollable ? 'py-8' : 'justify-center py-12'
        )}
      >
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: DURATION.smooth, ease: EASE_PREMIUM }
          }
          className={cn(
            'w-full max-w-[400px] mx-auto',
            className
          )}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 flex items-center justify-center gap-4 text-[12px] text-white/30">
        <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
          Terms
        </Link>
        <span className="text-white/20">·</span>
        <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
          Privacy
        </Link>
      </footer>
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
