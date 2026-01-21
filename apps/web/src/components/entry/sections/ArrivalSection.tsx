'use client';

/**
 * ArrivalSection - Welcome celebration (terminal section)
 *
 * Final section in the evolving entry flow.
 * Takes over the page with confetti and celebration.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfettiBurst } from '../motion/ConfettiBurst';
import {
  arrivalRevealVariants,
  arrivalGlowVariants,
  sectionChildVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface ArrivalSectionProps {
  section: SectionState;
  firstName: string;
  handle: string;
  isNewUser: boolean;
  isReturningUser: boolean;
  onComplete: () => void;
}

// Stats preview
const WAITING_STATS = [
  { label: '400+ communities', delay: 0.8 },
  { label: '35 AI tools', delay: 0.9 },
  { label: '20+ events this week', delay: 1.0 },
];

export function ArrivalSection({
  section,
  firstName,
  handle,
  isNewUser,
  isReturningUser,
  onComplete,
}: ArrivalSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showContent, setShowContent] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Staggered reveal: confetti → content
  React.useEffect(() => {
    if (section.status === 'active' || section.status === 'complete') {
      const timers = [
        setTimeout(() => setShowConfetti(true), 200),
        setTimeout(() => setShowContent(true), 400),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [section.status]);

  // Greeting based on user type
  const greeting = isReturningUser ? 'Welcome back' : 'Welcome home';
  const subtext = isReturningUser
    ? 'Good to see you again.'
    : handle
      ? `You're officially part of HIVE, @${handle}.`
      : "You're officially part of HIVE.";

  const handleComplete = () => {
    setIsNavigating(true);
    onComplete();
  };

  return (
    <motion.div
      variants={arrivalRevealVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center text-center relative py-8"
    >
      {/* Confetti burst */}
      <ConfettiBurst trigger={showConfetti} />

      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        variants={arrivalGlowVariants}
        initial="initial"
        animate="animate"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${GOLD.glowSubtle}, transparent)`,
        }}
      />

      {/* Main message */}
      <motion.div
        className="mb-8 relative z-10"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          ease: EASE_PREMIUM,
        }}
      >
        <motion.h1
          className="text-[32px] lg:text-[36px] font-semibold tracking-tight text-white mb-3"
          style={{
            textShadow: '0 0 40px rgba(255, 215, 0, 0.15)',
          }}
        >
          {greeting}
          {firstName && (
            <>
              ,<br />
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text">
                {firstName}
              </span>
            </>
          )}
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{
            duration: DURATION.smooth,
            delay: 0.2,
            ease: EASE_PREMIUM,
          }}
          className="text-[15px] text-white/50"
        >
          {subtext}
        </motion.p>
      </motion.div>

      {/* What's waiting */}
      <motion.div
        className="mb-8 flex flex-col gap-3 relative z-10"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.3,
          ease: EASE_PREMIUM,
        }}
      >
        <p className="text-[11px] uppercase tracking-wide text-white/30 mb-1">
          What's waiting
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {WAITING_STATS.map((stat) => (
            <motion.div
              key={stat.label}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: DURATION.smooth,
                delay: stat.delay,
                ease: EASE_PREMIUM,
              }}
              className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]"
            >
              <span className="text-[12px] text-white/50">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA - Gold */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
        animate={showContent ? { opacity: 1, scale: 1 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.6,
          ease: EASE_PREMIUM,
        }}
        className="w-full max-w-[260px] relative z-10"
      >
        <button
          onClick={handleComplete}
          disabled={isNavigating}
          className={cn(
            'w-full h-12 rounded-xl font-medium text-[15px] text-black',
            'flex items-center justify-center gap-2 group',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/50',
            'transition-all hover:brightness-110',
            isNavigating && 'opacity-70 cursor-wait'
          )}
          style={{
            background: `linear-gradient(135deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
          }}
        >
          {isNavigating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>Explore your campus</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </motion.div>

      {/* Hint */}
      <motion.p
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={showContent ? { opacity: 0.3 } : {}}
        transition={{
          duration: DURATION.smooth,
          delay: 1,
          ease: EASE_PREMIUM,
        }}
        className="mt-6 text-[11px] text-white/30 relative z-10"
      >
        Join spaces, connect with people, build tools
      </motion.p>
    </motion.div>
  );
}

ArrivalSection.displayName = 'ArrivalSection';
