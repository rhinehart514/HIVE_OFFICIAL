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
import { useEntry, type EntryPhase } from './hooks/useEntry';
import { EntryShell } from './EntryShell';
import { type EntryTone, DURATION, EASE_PREMIUM, GOLD } from './motion/constants';

// Screens
import { GateScreen } from './screens/GateScreen';
import { NamingScreen } from './screens/NamingScreen';
import { FieldScreen } from './screens/FieldScreen';
import { CrossingScreen } from './screens/CrossingScreen';

// Clash Display font
const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export { clashDisplay };

/**
 * Map entry phase to tone for ambient background
 */
function getEntryTone(phase: EntryPhase): EntryTone {
  switch (phase) {
    case 'gate':
      return 'neutral';
    case 'naming':
      return 'anticipation';
    case 'field':
      return 'anticipation';
    case 'crossing':
      return 'celebration';
    default:
      return 'neutral';
  }
}

/**
 * Progress dots footer for entry flow
 */
function ProgressDots({ currentPhase }: { currentPhase: EntryPhase }) {
  const phases: EntryPhase[] = ['gate', 'naming', 'field', 'crossing'];
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className="flex justify-center gap-2">
      {phases.map((phase, i) => {
        const isActive = currentPhase === phase;
        const isComplete = i < currentIndex;

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
  );
}

export function Entry() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read school info from URL params (set by /schools page)
  const schoolId = searchParams.get('schoolId') || undefined;
  const domain = searchParams.get('domain') || undefined;
  // Middleware sets redirect param when bouncing incomplete users here
  const redirectParam = searchParams.get('redirect') || undefined;

  const entry = useEntry({
    onComplete: (serverRedirect: string) => {
      // URL redirect param takes priority (user's intended destination)
      router.push(redirectParam || serverRedirect);
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
  }, [entry, router]);

  return (
    <EntryShell
      entryTone={getEntryTone(entry.phase)}
      isLoading={false}
      contentMaxWidth={entry.phase === 'field' ? 'max-w-2xl' : 'max-w-md'}
      footer={<ProgressDots currentPhase={entry.phase} />}
    >
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
    </EntryShell>
  );
}
