import { type Transition, type Variants } from 'framer-motion';

export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT = [0, 0, 0.2, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 28,
};

export const SPRING_BOUNCY = {
  type: 'spring' as const,
  stiffness: 150,
  damping: 18,
};

export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 22,
};

export const DURATION = {
  instant: 0.15,
  snap: 0.2,
  fast: 0.3,
  quick: 0.4,
  smooth: 0.6,
  gentle: 0.8,
  slow: 1,
  dramatic: 1.2,
  epic: 1.5,
  breathe: 4,
} as const;

export const GOLD = {
  primary: '#FFD700',
  light: '#FFE680',
  dark: '#7A5E00',
  glow: 'rgba(255, 215, 0, 0.20)',
  glowSubtle: 'rgba(255, 215, 0, 0.10)',
} as const;

export const GLOW_COLORS = {
  neutral: 'rgba(255, 255, 255, 0.02)',
  anticipation: 'rgba(255, 215, 0, 0.04)',
  celebration: 'rgba(255, 215, 0, 0.12)',
} as const;

export type EntryTone = keyof typeof GLOW_COLORS;

export const stateVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.smooth,
      ease: EASE_PREMIUM,
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

export const childVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.quick, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const scaleFadeVariants: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const errorVariants: Variants = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

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

export const lineDrawVariants: Variants = {
  initial: { opacity: 0.4, scaleX: 0 },
  animate: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: DURATION.slow, ease: EASE_PREMIUM },
  },
};
