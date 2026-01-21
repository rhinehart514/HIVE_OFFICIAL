/**
 * Entry Flow Motion System - LOCKED 2026-01-14
 *
 * Centralized motion variants for the /enter flow
 * Maximum craft: Stripe/Linear polish level
 *
 * All entry components should import motion configs from here
 * to ensure consistency and avoid duplication.
 */

import { type Variants, type Transition } from 'framer-motion';

// ============================================
// CORE TIMING CONSTANTS
// ============================================

/** Premium deceleration curve - the HIVE default */
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

/** Quick deceleration for exits */
export const EASE_OUT = [0, 0, 0.2, 1] as const;

/** Smooth in-out for looping animations */
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

/** Spring config for snappy interactions — slower, more deliberate */
export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 28,
};

/** Spring config for bouncy celebrations — gentler bounce */
export const SPRING_BOUNCY = {
  type: 'spring' as const,
  stiffness: 150,
  damping: 18,
};

/** Spring config for gentle movements — slow and smooth */
export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 22,
};

// ============================================
// DURATION CONSTANTS
// ============================================

export const DURATION = {
  instant: 0,
  snap: 0.2,
  fast: 0.25,
  quick: 0.35,
  smooth: 0.5,      // THE DEFAULT — luxuriously slow
  gentle: 0.7,
  slow: 0.9,
  dramatic: 1.2,
  breathe: 4,
} as const;

// ============================================
// STATE TRANSITION VARIANTS
// ============================================

/** Page/state transition - luxuriously slow with depth */
export const stateVariants: Variants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: DURATION.dramatic,  // 1.2s - luxuriously slow
      ease: EASE_PREMIUM,
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: {
      duration: DURATION.gentle,  // 0.7s - graceful exit
      ease: EASE_OUT,
    },
  },
};

/** Child element variants for stagger - silky entrance */
export const childVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,  // 0.5s - slower child animations
      ease: EASE_PREMIUM,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: DURATION.smooth,  // 0.3s
      ease: EASE_OUT,
    },
  },
};

// ============================================
// ELEMENT-SPECIFIC VARIANTS
// ============================================

/** Fade up animation for standalone elements */
export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Scale fade for buttons, badges */
export const scaleFadeVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/** Error message animation */
export const errorVariants: Variants = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

// ============================================
// ARRIVAL CELEBRATION VARIANTS
// ============================================

/** Checkmark scale entrance */
export const checkmarkVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      scale: SPRING_BOUNCY,
      opacity: { duration: DURATION.quick },
    },
  },
};

/** Particle burst animation factory */
export const createParticleVariants = (
  index: number,
  totalParticles: number,
  radius: number = 100
): Variants => {
  const angle = (index / totalParticles) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return {
    initial: {
      scale: 0,
      opacity: 1,
      x: 0,
      y: 0,
    },
    animate: {
      scale: [0, 1, 0.5],
      opacity: [1, 1, 0],
      x,
      y,
      transition: {
        duration: 1.2,
        ease: 'easeOut',
        delay: index * 0.02,
      },
    },
  };
};

/** Text reveal character animation */
export const createCharVariants = (delay: number = 0): Variants => ({
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.gentle,
      delay,
      ease: EASE_PREMIUM,
    },
  },
});

// ============================================
// AMBIENT GLOW VARIANTS
// ============================================

/** Glow color configurations for emotional states */
export const GLOW_COLORS = {
  neutral: 'rgba(255, 255, 255, 0.02)',
  anticipation: 'rgba(255, 215, 0, 0.04)',
  celebration: 'rgba(255, 215, 0, 0.12)',
} as const;

export type EmotionalState = keyof typeof GLOW_COLORS;

/** Ambient glow transition */
export const glowVariants: Variants = {
  neutral: {
    background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${GLOW_COLORS.neutral}, transparent)`,
  },
  anticipation: {
    background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${GLOW_COLORS.anticipation}, transparent)`,
  },
  celebration: {
    background: `radial-gradient(ellipse 100% 60% at 50% 100%, ${GLOW_COLORS.celebration}, transparent)`,
  },
};

export const glowTransition: Transition = {
  duration: DURATION.slow,
  ease: EASE_PREMIUM,
};

// ============================================
// GOLD PALETTE
// ============================================

export const GOLD = {
  primary: '#FFD700',
  light: '#FFDF33',
  dark: '#B8860B',
  glow: 'rgba(255, 215, 0, 0.4)',
  glowSubtle: 'rgba(255, 215, 0, 0.15)',
  glowSoft: 'rgba(255, 215, 0, 0.08)',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Create stagger delay based on index */
export const staggerDelay = (index: number, baseDelay: number = 0.12): number =>
  index * baseDelay;

/** Create transition with premium easing */
export const premiumTransition = (duration: number = DURATION.smooth): Transition => ({
  duration,
  ease: EASE_PREMIUM,
});

/** Create spring transition */
export const springTransition = (config = SPRING_SNAPPY): Transition => config;
