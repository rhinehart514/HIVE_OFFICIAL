'use client';

/**
 * /spaces — Your Campus HQ
 *
 * Command center for campus life:
 * - Identity row (Major, Home, Greek)
 * - Organizations panel
 * - Attention panel (actions + live)
 * - Recent activity footer
 *
 * GPT/Apple aesthetic: dark confidence, glass surfaces, premium motion
 *
 * @version 16.0.0 - HQ redesign (Jan 2026)
 */

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, MOTION, WordReveal } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { SpacesHQ } from './components/SpacesHQ';

const STORAGE_KEY = 'hive-spaces-intro-seen';

// ============================================================
// Main Component
// ============================================================

export default function SpacesPage() {
  const searchParams = useSearchParams();
  const [hasSeenIntro, setHasSeenIntro] = React.useState<boolean | null>(null);

  // Check localStorage for intro state
  React.useEffect(() => {
    setHasSeenIntro(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const completeIntro = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenIntro(true);
  };

  // Loading state
  if (hasSeenIntro === null) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white/20"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Show intro overlay for first-time users
  if (!hasSeenIntro) {
    return <IntroOverlay onComplete={completeIntro} />;
  }

  // SpacesHQ handles ?create=true query param and its own modal
  return <SpacesHQ />;
}

// ============================================================
// Intro Overlay — Apple-style reveal
// ============================================================

function IntroOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 2) setStep(step + 1);
      else onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  const lines = [
    'Your campus has a shape',
    'Three dimensions define you',
    'This is your headquarters',
  ];

  return (
    <div
      className="fixed inset-0 bg-[#0A0A0A] z-50 flex items-center justify-center cursor-pointer"
      onClick={onComplete}
    >
      <motion.h1
        key={step}
        className="text-display-sm md:text-display-lg font-medium text-white/90 tracking-tight text-center px-8"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: MOTION.ease.premium }}
      >
        <WordReveal text={lines[step]} />
      </motion.h1>

      {/* Minimal progress */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
        {lines.map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1 h-1 rounded-full transition-all duration-500',
              i <= step ? 'bg-white/60 scale-100' : 'bg-white/10 scale-75'
            )}
          />
        ))}
      </div>
    </div>
  );
}
