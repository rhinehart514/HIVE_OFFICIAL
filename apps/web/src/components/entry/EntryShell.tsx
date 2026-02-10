'use client';

/**
 * EntryShell - Void Aesthetic Entry Layout
 * ENHANCED: Jan 21, 2026
 *
 * Full-screen void layout inspired by OpenAI/Apple + About page:
 * - Centered content on dark void background
 * - Animated line that draws in on load
 * - Ambient glow that responds to entry tone
 * - Logo at top, minimal chrome
 *
 * Philosophy: Entry is confidence. Luxuriously slow. Premium.
 */

import * as React from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Logo } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  type EntryTone,
  EASE_PREMIUM,
  DURATION,
  lineDrawVariants,
  GOLD,
} from './motion/constants';

// LOCKED: Entry content max-width for consistency across shell variants
const ENTRY_MAX_WIDTH = 'max-w-[460px]';

export type EntryStep = 'school' | 'email' | 'code' | 'role' | 'identity' | 'arrival' | 'alumni-waitlist';

export interface EntryShellProps {
  children: React.ReactNode;
  /** Current tone for ambient effects */
  entryTone?: EntryTone;
  /** Current step (unused in void design but kept for compatibility) */
  currentStep?: EntryStep;
  /** Whether to show progress indicator (unused in void design) */
  showProgress?: boolean;
  /** Additional class names for content container */
  className?: string;
  /** Override content max-width (default: max-w-[460px]) */
  contentMaxWidth?: string;
  /** Custom footer content (replaces default Terms/Privacy footer) */
  footer?: React.ReactNode;
  /** Enable scroll for evolving entry */
  scrollable?: boolean;
  /** Show loading overlay during API calls */
  isLoading?: boolean;
}

export function EntryShell({
  children,
  entryTone = 'neutral',
  currentStep: _currentStep = 'school',
  showProgress: _showProgress = false,
  className,
  contentMaxWidth,
  footer,
  scrollable = false,
  isLoading = false,
}: EntryShellProps) {
  const shouldReduceMotion = useReducedMotion();

  // Entry tone determines glow intensity
  const isCelebration = entryTone === 'celebration';
  const isAnticipation = entryTone === 'anticipation';

  // Glow configuration based on entry tone
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
      

      {/* Static line at top */}
      <motion.div
        className="absolute top-0 left-6 right-6 h-px bg-white/[0.06]"
        variants={lineDrawVariants}
        initial="initial"
        animate="animate"
      />

      {/* Ambient glow - responds to entry tone */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: glowConfig.opacity }}
        transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
        style={{ background: glowConfig.gradient }}
      />

      {/* Loading overlay - premium fade during API calls */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[var(--color-bg-void)]/80" />

            {/* Loading indicator */}
            <motion.div className="relative z-10">
              <div
                className="w-10 h-10 rounded-full border border-white/[0.06]"
                style={{
                  backgroundColor: GOLD.glowSubtle,
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          className="text-body-sm text-white/50 hover:text-white/50 transition-colors"
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
            'w-full mx-auto',
            contentMaxWidth || ENTRY_MAX_WIDTH,
            className
          )}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="relative z-10 px-6 py-6 flex items-center justify-center gap-4 text-label text-white/50"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.gentle, delay: 0.5, ease: EASE_PREMIUM }}
      >
        {footer || (
          <>
            <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
              Terms
            </Link>
            <span className="text-white/50">·</span>
            <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
              Privacy
            </Link>
          </>
        )}
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
        <span className="text-body-sm text-white/50">Back</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className={cn('w-full mx-auto', ENTRY_MAX_WIDTH)}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 flex items-center justify-center gap-4 text-label text-white/50">
        <span>Terms</span>
        <span className="text-white/50">·</span>
        <span>Privacy</span>
      </footer>
    </div>
  );
}

EntryShell.displayName = 'EntryShell';
EntryShellStatic.displayName = 'EntryShellStatic';
