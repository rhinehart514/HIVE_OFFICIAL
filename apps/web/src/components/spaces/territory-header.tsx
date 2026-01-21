'use client';

/**
 * TerritoryHeader - Premium discovery page header
 * CREATED: Jan 21, 2026
 *
 * Territory narrative for Spaces discovery:
 * - Clash Display headline
 * - Live stats (total, claimed, waiting)
 * - About-page motion patterns
 *
 * "423 Spaces. 67 claimed. Yours waiting."
 */

import * as React from 'react';
import { motion, useInView } from 'framer-motion';

// Premium easing (from about page)
const EASE = [0.22, 1, 0.36, 1] as const;

// Duration scale
const DURATION = {
  fast: 0.15,
  quick: 0.25,
  smooth: 0.4,
  gentle: 0.6,
  slow: 0.8,
  dramatic: 1.0,
  hero: 1.2,
} as const;

export interface TerritoryHeaderProps {
  totalSpaces?: number;
  claimedSpaces?: number;
  yourSpaceCount?: number;
  isAuthenticated?: boolean;
  className?: string;
}

// Word-by-word reveal
function WordReveal({
  children,
  className,
  stagger = 0.1,
  delay = 0,
}: {
  children: string;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const words = children.split(' ');

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.gentle, delay: delay + i * stagger, ease: EASE }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Animated line that draws in
function AnimatedLine({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className={className}>
      <motion.div
        className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: DURATION.hero, delay, ease: EASE }}
        style={{ transformOrigin: 'left' }}
      />
    </div>
  );
}

// Animated stat counter
function StatCounter({
  value,
  suffix,
  delay = 0,
  highlight = false,
}: {
  value: number;
  suffix: string;
  delay?: number;
  highlight?: boolean;
}) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 1200; // ms
    const startTime = Date.now();
    const delayMs = delay * 1000;

    const timer = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - delayMs;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(eased * value));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.span
      className={highlight ? 'text-[var(--color-gold)]' : 'text-white/60'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.smooth, delay, ease: EASE }}
    >
      {displayValue.toLocaleString()}
      <span className="text-white/40 ml-1">{suffix}</span>
    </motion.span>
  );
}

export function TerritoryHeader({
  totalSpaces = 423,
  claimedSpaces = 67,
  yourSpaceCount = 0,
  isAuthenticated = false,
  className,
}: TerritoryHeaderProps) {
  const waitingSpaces = totalSpaces - claimedSpaces;

  return (
    <motion.header
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.gentle, ease: EASE }}
    >
      {/* Main headline - Clash Display */}
      <motion.h1
        className="text-[36px] md:text-[48px] font-semibold leading-[1.0] tracking-tight text-white mb-4"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.hero, ease: EASE }}
      >
        <WordReveal stagger={0.12}>Your campus, mapped.</WordReveal>
      </motion.h1>

      {/* Stats line - territory narrative */}
      <motion.div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.gentle, delay: 0.4, ease: EASE }}
      >
        <StatCounter value={totalSpaces} suffix="spaces" delay={0.5} />
        <span className="text-white/20">·</span>
        <StatCounter value={claimedSpaces} suffix="claimed" delay={0.6} highlight />
        <span className="text-white/20">·</span>
        <motion.span
          className="text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.smooth, delay: 0.7, ease: EASE }}
        >
          <span className="text-white">{waitingSpaces.toLocaleString()}</span>
          <span className="text-white/40 ml-1">waiting for leaders</span>
        </motion.span>
      </motion.div>

      {/* Subtext based on auth state */}
      <motion.p
        className="text-[16px] text-white/40 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.gentle, delay: 0.8, ease: EASE }}
      >
        {isAuthenticated ? (
          yourSpaceCount > 0 ? (
            <>
              You're in{' '}
              <span className="text-white/60">{yourSpaceCount}</span>{' '}
              {yourSpaceCount === 1 ? 'space' : 'spaces'}.
              Explore more or claim your territory.
            </>
          ) : (
            <>Find your people. Claim your org.</>
          )
        ) : (
          <>Every org has a home waiting. Find yours.</>
        )}
      </motion.p>

      {/* Animated separator */}
      <AnimatedLine className="mt-8" delay={0.9} />
    </motion.header>
  );
}

TerritoryHeader.displayName = 'TerritoryHeader';
