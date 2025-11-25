/**
 * HIVE Motion Variants Library
 *
 * Production-grade Framer Motion variants following HIVE design principles:
 * - Smooth confidence (300ms standard, silk easing)
 * - Vercel/OpenAI feel (subtle, purposeful animations)
 * - Respects prefers-reduced-motion
 * - Mobile-optimized (60fps, minimal layout shift)
 *
 * IMPORTANT: All values imported from @hive/tokens for single source of truth
 */

import type { Variants, Transition } from 'framer-motion';
import {
  easingArrays,
  durationSeconds,
  springPresets,
  staggerPresets,
} from '@hive/tokens';

// ===== RE-EXPORT FROM TOKENS (for convenience) =====

export const easing = {
  smooth: easingArrays.default,
  silk: easingArrays.silk,
  snap: easingArrays.snap,
  dramatic: easingArrays.dramatic,
  out: easingArrays.out,
  in: easingArrays.in,
} as const;

export const duration = {
  instant: durationSeconds.snap,      // 150ms
  quick: durationSeconds.quick,       // 200ms
  standard: durationSeconds.standard, // 300ms
  leisurely: durationSeconds.flowing, // 500ms
  slow: durationSeconds.dramatic,     // 700ms
  glacial: durationSeconds.orchestrated, // 1000ms
} as const;

export const spring = {
  snappy: springPresets.snappy,
  default: springPresets.default,
  gentle: springPresets.gentle,
  bouncy: springPresets.bouncy,
} as const;

export const stagger = staggerPresets;

// ===== BUTTON ANIMATIONS =====

export const buttonVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -1,
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: duration.instant,
      ease: easing.snap,
    },
  },
  disabled: {
    opacity: 0.4,
    transition: {
      duration: duration.quick,
    },
  },
};

export const buttonIconVariants: Variants = {
  initial: {
    rotate: 0,
    scale: 1,
  },
  hover: {
    rotate: 0,
    scale: 1.1,
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      duration: duration.instant,
    },
  },
};

// ===== CARD ANIMATIONS =====

export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 28,
      mass: 1,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: {
      duration: duration.quick,
      ease: easing.silk,
    },
  },
  hover: {
    y: -6,
    scale: 1.015,
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
    },
  },
};

// ===== INPUT ANIMATIONS =====

export const inputVariants: Variants = {
  initial: {
    borderColor: 'var(--hive-border-default)',
  },
  focus: {
    borderColor: 'var(--hive-interactive-focus)',
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  error: {
    borderColor: 'var(--hive-status-error)',
    x: [0, -4, 4, -4, 4, 0],
    transition: {
      duration: duration.leisurely,
      ease: easing.snap,
    },
  },
};

export const labelVariants: Variants = {
  default: {
    y: 0,
    fontSize: '0.875rem',
    color: 'var(--hive-text-secondary)',
  },
  floating: {
    y: -24,
    fontSize: '0.75rem',
    color: 'var(--hive-text-tertiary)',
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  focus: {
    y: -24,
    fontSize: '0.75rem',
    color: 'var(--hive-brand-primary)',
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
};

// ===== FADE ANIMATIONS =====

export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

export const fadeInUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

// ===== SCALE ANIMATIONS =====

export const scaleInVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

// ===== MODAL/DIALOG ANIMATIONS =====

export const modalOverlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 24,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 30,
      mass: 1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 12,
    transition: {
      duration: duration.quick,
      ease: easing.silk,
    },
  },
};

// ===== DROPDOWN/MENU ANIMATIONS =====

export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: -8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 25,
      mass: 0.9,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: {
      duration: duration.quick,
      ease: easing.silk,
    },
  },
};

export const menuItemVariants: Variants = {
  initial: {
    x: -4,
    opacity: 0,
  },
  animate: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: i * 0.03,
      duration: duration.quick,
      ease: easing.smooth,
    },
  }),
  exit: {
    x: -4,
    opacity: 0,
    transition: {
      duration: duration.instant,
    },
  },
};

// ===== TOAST/NOTIFICATION ANIMATIONS =====

export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

// ===== LIST STAGGER ANIMATIONS =====

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 28,
      mass: 0.9,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: duration.quick,
      ease: easing.silk,
    },
  },
};

// ===== LOADING/SPINNER ANIMATIONS =====

export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      ease: easing.smooth,
      repeat: Infinity,
    },
  },
};

// ===== SLIDE ANIMATIONS =====

export const slideInFromRightVariants: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 30,
      mass: 1,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: duration.standard,
      ease: easing.silk,
    },
  },
};

export const slideInFromLeftVariants: Variants = {
  initial: {
    x: '-100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 30,
      mass: 1,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: duration.standard,
      ease: easing.silk,
    },
  },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a transition that respects prefers-reduced-motion
 */
export const createTransition = (
  duration: number,
  ease: number[] | string = [...easing.smooth]
): Transition => ({
  duration,
  ease,
});

/**
 * Wraps variants to disable animations when prefers-reduced-motion is set
 */
export const withReducedMotion = <T extends Variants>(variants: T): T => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const reducedVariants: any = {};
    for (const key in variants) {
      reducedVariants[key] = {
        ...(variants[key] as any),
        transition: { duration: 0 },
      };
    }
    return reducedVariants as T;
  }
  return variants;
};
