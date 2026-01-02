/**
 * Motion Rhythm - Rap Video Energy
 *
 * This isn't smooth corporate motion.
 * This is rhythm. Beats. Cuts.
 *
 * Things don't float in. They ARRIVE.
 * Things don't fade out. They CUT.
 *
 * The timing has rhythm:
 * - SNAP (instant) - thing appears
 * - HOLD (600-800ms) - let it breathe
 * - SNAP - next thing
 * - repeat
 *
 * Like a beat drop. You feel it before you understand it.
 */

import { Variants, Transition } from 'framer-motion';

// ============================================
// CORE TIMING - The Beat
// ============================================

export const BEAT = {
  /** Instant appearance - no easing, just there */
  SNAP: 0,
  /** Impact moment - very quick punch */
  PUNCH: 0.1,
  /** Hold for reading/appreciation */
  HOLD: 0.6,
  /** Extended hold for hero moments */
  BREATHE: 0.8,
  /** Between fragments */
  GAP: 0.4,
} as const;

// ============================================
// TRANSITIONS - How Things Move
// ============================================

/** Instant - no animation, just appears */
export const INSTANT: Transition = {
  duration: 0,
};

/** Snap - appears with micro-impact */
export const SNAP: Transition = {
  duration: 0.08,
  ease: [0.32, 0, 0.67, 0],
};

/** Punch - quick with weight */
export const PUNCH: Transition = {
  duration: 0.12,
  ease: [0.22, 0, 0.36, 1],
};

/** Cut - hard transition out */
export const CUT: Transition = {
  duration: 0.05,
  ease: 'linear',
};

/** Breathe - slow subtle movement for ambient */
export const BREATHE: Transition = {
  duration: 2,
  ease: 'linear',
  repeat: Infinity,
  repeatType: 'reverse' as const,
};

// ============================================
// VARIANTS - Reusable Animation States
// ============================================

/** Fragment appearing - snaps in with slight scale punch */
export const fragmentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.15,
      ease: [0.22, 0, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: CUT,
  },
};

/** Message bubble - appears with slight push */
export const messageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.12,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

/** Space card - snaps in */
export const spaceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SNAP,
  },
};

/** Tool card - punches in with slight overshoot */
export const toolVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
};

/** Entrance field - fades up from the chaos */
export const entranceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.2,
    },
  },
};

/** Gold pulse - the status indicator */
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

/** Ambient float - subtle movement for background elements */
export const floatVariants: Variants = {
  float: {
    y: [0, -4, 0],
    rotate: [0, 0.5, 0],
    transition: {
      duration: 4,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// ============================================
// STAGGER ORCHESTRATION
// ============================================

/** Container that orchestrates child animations */
export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.4,
      delayChildren: 0.3,
    },
  },
};

/** Rapid-fire stagger for quick sequences */
export const rapidContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

// ============================================
// POSITION TRANSFORMS
// ============================================

export type FragmentPosition =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'center-left'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Get CSS position for fragment
 * Positions are percentage-based for responsiveness
 * Spread out to avoid overlap with centered entrance
 */
export function getFragmentPosition(position: FragmentPosition): {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
} {
  const positions: Record<FragmentPosition, ReturnType<typeof getFragmentPosition>> = {
    'top-left': { top: '8%', left: '4%' },
    'top-right': { top: '10%', right: '4%' },
    'top-center': { top: '6%', left: '50%' }, // Will need transform to center
    'center-left': { top: '38%', left: '3%' },
    'center-right': { top: '35%', right: '3%' },
    'bottom-left': { bottom: '15%', left: '5%' },
    'bottom-right': { bottom: '12%', right: '4%' },
  };

  return positions[position];
}

/** Activity notification - slides in from top */
export const activityVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ============================================
// TIMING UTILITIES
// ============================================

/**
 * Calculate cumulative delay for a sequence index
 * Based on the BEAT timing constants
 */
export function getSequenceDelay(index: number): number {
  // First item: small delay to let page settle
  if (index === 0) return 0.3;

  // Alternating rhythm: SNAP - HOLD - SNAP - HOLD
  // Items appear at: 0.3, 0.7, 1.2, 1.7, 2.2...
  return 0.3 + index * BEAT.GAP;
}

/**
 * Generate keyframe timing for CSS animations
 * Returns string like "0%, 25%, 50%, 75%, 100%"
 */
export function generateRhythmKeyframes(beats: number): string {
  const step = 100 / beats;
  return Array.from({ length: beats + 1 }, (_, i) => `${i * step}%`).join(', ');
}

// ============================================
// SOUND SYNC (Optional - for future)
// ============================================

/** BPM for rhythm timing (70-80 feels right) */
export const RHYTHM_BPM = 75;

/** Milliseconds per beat */
export const MS_PER_BEAT = 60000 / RHYTHM_BPM; // 800ms at 75 BPM

/**
 * Snap timing to beat grid
 * Makes animations feel more musical
 */
export function snapToBeat(ms: number): number {
  return Math.round(ms / MS_PER_BEAT) * MS_PER_BEAT;
}
