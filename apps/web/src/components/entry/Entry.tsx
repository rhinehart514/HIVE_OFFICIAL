'use client';

/**
 * Entry - The Threshold
 *
 * 4 phases (same URL):
 * 1. Gate      → Email + code verification
 * 2. Naming    → First/last name (THE WEDGE)
 * 3. Field     → Year + major (morphing screen)
 * 4. Crossing  → Interests selection
 *
 * Narrative Arc: Outsider → Proven → Named → Claimed → Arrived
 * Design: Clash Display typography, gold accents, editorial feel
 *
 * Community identities + residence collected later via progressive profiling in settings.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Logo, NoiseOverlay } from '@hive/ui/design-system/primitives';
import { useEntry, type EntryPhase } from './hooks/useEntry';
import { DURATION, EASE_PREMIUM, GOLD } from './motion/entry-motion';

// Screens
import { GateScreen } from './screens/GateScreen';
import { NamingScreen } from './screens/NamingScreen';
import { FieldScreen } from './screens/FieldScreen';
import { CrossingScreen } from './screens/CrossingScreen';

// Clash Display font
const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export { clashDisplay };

export function Entry() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read school info from URL params (set by /schools page)
  const schoolId = searchParams.get('schoolId') || undefined;
  const domain = searchParams.get('domain') || undefined;

  const entry = useEntry({
    onComplete: (redirect: string) => {
      router.push(redirect);
    },
    schoolId,
    domain,
  });

  // Handle browser back button - intercept and use entry.goBack() instead
  React.useEffect(() => {
    // Push initial state to history so we can intercept back button
    const initialState = { phase: entry.phase, gateStep: entry.gateStep };
    window.history.replaceState(initialState, '');

    const handlePopState = (event: PopStateEvent) => {
      // Prevent default browser back navigation
      event.preventDefault();

      // If we're at the first step (gate/email), allow leaving
      if (entry.phase === 'gate' && entry.gateStep === 'email') {
        router.push('/');
        return;
      }

      // Otherwise, use our internal back navigation
      entry.goBack();

      // Push state again to continue intercepting
      window.history.pushState({ phase: entry.phase }, '');
    };

    // Push initial state
    window.history.pushState({ phase: entry.phase }, '');

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [entry.phase, entry.gateStep, entry.goBack, router]);

  return (
    <div className="min-h-dvh bg-[var(--color-bg-void,#030303)] text-white relative">
      <NoiseOverlay />

      {/* Animated line at top */}
      <motion.div
        className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE_PREMIUM }}
      />

      {/* Full page container */}
      <div className="min-h-dvh flex flex-col relative z-10">
        {/* Header */}
        <header className="px-6 py-6 flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-70">
            <Logo variant="mark" size="sm" color="gold" />
          </Link>
          <Link
            href="/"
            aria-label="Return to homepage"
            className="text-[13px] text-white/30 hover:text-white/50 transition-colors min-h-11 min-w-11 flex items-center justify-center -mr-3"
          >
            Back to home
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-24 pb-12">
          <div className={cn(
            'w-full',
            entry.phase === 'field' ? 'max-w-2xl' : 'max-w-md'
          )}>
            <AnimatePresence mode="wait">
              {entry.phase === 'gate' && (
                <motion.div
                  key="gate"
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
                >
                  <GateScreen entry={entry} />
                </motion.div>
              )}

              {entry.phase === 'naming' && (
                <motion.div
                  key="naming"
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
                >
                  <NamingScreen entry={entry} />
                </motion.div>
              )}

              {entry.phase === 'field' && (
                <motion.div
                  key="field"
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
                >
                  <FieldScreen entry={entry} />
                </motion.div>
              )}

              {entry.phase === 'crossing' && (
                <motion.div
                  key="crossing"
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
                >
                  <CrossingScreen entry={entry} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* 4-dot progress indicator */}
        <footer className="p-6">
          <div className="flex justify-center gap-2">
            {(['gate', 'naming', 'field', 'crossing'] as EntryPhase[]).map((phase, i) => {
              const phaseOrder = ['gate', 'naming', 'field', 'crossing'];
              const currentIndex = phaseOrder.indexOf(entry.phase);
              const thisIndex = phaseOrder.indexOf(phase);

              const isActive = entry.phase === phase;
              const isComplete = thisIndex < currentIndex;

              return (
                <motion.div
                  key={phase}
                  className="h-1.5 w-1.5 rounded-full transition-all duration-500"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: isActive ? 1.2 : 1,
                  }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: EASE_PREMIUM }}
                  style={{
                    backgroundColor: isComplete
                      ? GOLD.primary
                      : isActive
                        ? GOLD.glow
                        : 'rgba(255, 255, 255, 0.15)',
                  }}
                />
              );
            })}
          </div>
        </footer>
      </div>
    </div>
  );
}
