'use client';

/**
 * Entry - Editorial entry flow
 *
 * 3 screens:
 * 1. Prove - email + code verification
 * 2. Claim - name, handle, year, major
 * 3. Enter - interests selection
 *
 * Design: Clash Display typography, subtle gold accents, worldview-aligned copy
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Logo, NoiseOverlay } from '@hive/ui/design-system/primitives';
import { useEntry, type EntryScreen } from './hooks/useEntry';
import { DURATION, EASE_PREMIUM } from './motion/entry-motion';

// Screens
import { ProveScreen } from './screens/ProveScreen';
import { ClaimScreen } from './screens/ClaimScreen';
import { EnterScreen } from './screens/EnterScreen';

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
    onComplete: () => {
      router.push('/spaces');
    },
    schoolId,
    domain,
  });

  return (
    <div className="min-h-dvh bg-[#030303] text-white relative">
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
            className="text-[13px] text-white/30 hover:text-white/50 transition-colors"
          >
            Back to home
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-24 pb-12">
          <div className={cn(
            'w-full',
            entry.screen === 'claim' ? 'max-w-2xl' : 'max-w-md'
          )}>
            <AnimatePresence mode="wait">
              {entry.screen === 'prove' && (
                <motion.div
                  key="prove"
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
                >
                  <ProveScreen entry={entry} />
                </motion.div>
              )}

              {entry.screen === 'claim' && (
                <motion.div
                  key="claim"
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
                >
                  <ClaimScreen entry={entry} />
                </motion.div>
              )}

              {entry.screen === 'enter' && (
                <motion.div
                  key="enter"
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
                >
                  <EnterScreen entry={entry} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Progress indicator with gold accents */}
        <footer className="p-6">
          <div className="flex justify-center gap-2">
            {(['prove', 'claim', 'enter'] as EntryScreen[]).map((screen, i) => {
              const isActive = entry.screen === screen;
              const isComplete =
                (screen === 'prove' && (entry.screen === 'claim' || entry.screen === 'enter')) ||
                (screen === 'claim' && entry.screen === 'enter');

              return (
                <motion.div
                  key={screen}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    isActive ? 'w-8' : 'w-1.5'
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: EASE_PREMIUM }}
                  style={{
                    backgroundColor: isActive
                      ? '#FFD700'
                      : isComplete
                        ? 'rgba(255, 215, 0, 0.4)'
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
