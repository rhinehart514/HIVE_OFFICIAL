// Motion tokens — HIVE Motion System
// Max 100ms transitions. Ease-out only. No decorative motion.

export const MOTION = {
  duration: {
    instant: 50,
    micro: 100,
    snap: 100,      // backward compat — used in AppSidebar
    quick: 100,     // backward compat — used in AppSidebar, territory-header
    standard: 100,  // default
    smooth: 100,    // backward compat
    flowing: 100,   // backward compat
    fast: 100,      // backward compat — used in SpaceJoinModal, build pages
    base: 100,      // backward compat — used in SpaceJoinModal, EmptyCanvas
    gentle: 100,    // backward compat — used in new-user-layout
    slow: 100,      // backward compat — used in ThresholdReveal
    dramatic: 100,  // backward compat
    hero: 100,      // backward compat
  },
  ease: {
    default: [0.0, 0.0, 0.2, 1.0] as const,
    premium: [0.0, 0.0, 0.2, 1.0] as const, // backward compat — heavily used
    snap: [0.0, 0.0, 0.2, 1.0] as const,    // backward compat
  },
  spring: {
    snappy: { stiffness: 400, damping: 30 },
    default: { stiffness: 200, damping: 25 },
    gentle: { stiffness: 100, damping: 20 },
    bouncy: { stiffness: 300, damping: 15 }, // used in BracketCard
  },
} as const;

// Framer Motion easing arrays
export const easingArrays = {
  default: [0.0, 0.0, 0.2, 1.0] as const,
  out: [0.0, 0.0, 0.2, 1.0] as const,
} as const;

// Durations in seconds (Framer Motion) — all capped at 0.1s
export const durationSeconds = {
  instant: 0.05,
  micro: 0.1,
  snap: 0.1,
  quick: 0.1,
  standard: 0.1,
  smooth: 0.1,
  flowing: 0.1,
  gentle: 0.1,
  dramatic: 0.1,
  slow: 0.1,
  orchestrated: 0.1,
  hero: 0.1,
} as const;

// Spring presets (Framer Motion)
export const springPresets = {
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  default: { type: 'spring' as const, stiffness: 200, damping: 25 },
  gentle: { type: 'spring' as const, stiffness: 100, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 15 },
} as const;

// Nav spring — alias for springPresets.snappy, used by TopBar/AppSidebar
export const SPRING_SNAP_NAV = springPresets.snappy;

// Stagger presets — kept for SignupGateModal
export const staggerPresets = { fast: 0.03, default: 0.05, slow: 0.1 } as const;

// CSS motion values (used by tailwind-config + css generators)
export const motion = {
  easing: {
    default: 'cubic-bezier(0, 0, 0.2, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  duration: {
    instant: '0.05s',
    standard: '0.1s',
    quick: '0.1s',
    smooth: '0.1s',
    liquid: '0.1s',
    flowing: '0.1s',
  },
} as const;

// Gold pulse: opacity 0.6 -> 1.0, 3s ease-in-out infinite
export const goldPulse = {
  animate: {
    opacity: [0.6, 1.0, 0.6],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
  },
} as const;

// Hover lift: translateY(-2px), 100ms ease-out
export const hoverLift = {
  whileHover: {
    y: -2,
    transition: { duration: 0.1, ease: [0.0, 0.0, 0.2, 1.0] },
  },
} as const;

// Page transition
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.1, ease: [0.0, 0.0, 0.2, 1.0] },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: 0.1, ease: [0.0, 0.0, 0.2, 1.0] },
  },
} as const;

// Modal entrance
export const modalVariants = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: {
      opacity: 1, scale: 1, y: 0,
      transition: { duration: 0.1, ease: [0.0, 0.0, 0.2, 1.0] },
    },
    exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.1 } },
  },
} as const;

// Message entry
export const messageEntryVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.1, ease: [0.0, 0.0, 0.2, 1.0] },
  },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.1 } },
} as const;

// Reduced motion fallbacks
export const reducedMotionVariants = {
  fadeOnly: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  },
  instant: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
} as const;

// Types
export type MotionToken = keyof typeof motion;
export type MotionEasing = keyof typeof motion.easing;
export type MotionDuration = keyof typeof motion.duration;
export type MotionCascade = string;
export type EasingArray = keyof typeof easingArrays;
export type DurationSeconds = keyof typeof durationSeconds;
export type SpringPreset = keyof typeof springPresets;
export type TinderSpring = string;
export type StaggerPreset = keyof typeof staggerPresets;
