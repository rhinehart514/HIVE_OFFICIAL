/**
 * Motion Tokens - UI Package
 *
 * This file provides a UI-friendly API with SECONDS-based durations.
 * All values derive from @hive/tokens (the authoritative source).
 *
 * For raw millisecond values or advanced variants, import directly from @hive/tokens:
 *   import { durationSeconds, easingArrays, springPresets } from '@hive/tokens';
 */

// Re-export everything from @hive/tokens for convenience
export {
  easingArrays,
  durationSeconds,
  springPresets,
  staggerPresets,
  tinderSprings,
  motionCSS,
  motionCSS as motionTokens,
  performance,
  // HIVE signature motion
  SPRING_SNAP_NAV,
  PUNCH_TRANSITION,
  SNAP_TRANSITION,
  // HIVE signature variants (Design Principles)
  surfaceVariants,
  // Micro-interaction presets
  buttonPressVariants,
  messageEntryVariants,
  successVariants,
  errorShakeVariants,
  pageTransitionVariants,
  modalVariants,
  dropdownVariants,
  selectionVariants,
  reducedMotionVariants,
} from '@hive/tokens';

// Re-export types
export type {
  MotionToken,
  MotionEasing,
  MotionDuration,
  MotionCascade,
  EasingArray,
  DurationSeconds,
  SpringPreset,
  TinderSpring,
  StaggerPreset,
} from '@hive/tokens';

/**
 * UI-friendly MOTION object
 *
 * Provides a simplified API for common animation patterns.
 * All durations are in SECONDS (for direct use with Framer Motion).
 *
 * Maps to @hive/tokens values:
 * - instant (0.15s) = snap (150ms)
 * - fast (0.3s) = standard (300ms)
 * - base (0.6s) = gentle (600ms)
 * - slow (1.0s) = orchestrated (1000ms)
 * - slower (1.2s) = hero (1200ms)
 * - slowest (1.5s) = extended (custom)
 */
export const MOTION = {
  /**
   * Easing curves
   * Use premium for all transitions unless you have a specific reason not to
   */
  ease: {
    /** Premium easing - heavy, weighted, feels physical. Default for all transitions. */
    premium: [0.22, 1, 0.36, 1] as const,

    /** Smooth entrance - gentle acceleration/deceleration */
    smooth: [0.21, 0.47, 0.32, 0.98] as const,

    /** Bounce - playful overshoot for micro-interactions */
    bounce: [0.68, -0.55, 0.265, 1.55] as const,

    /** Sharp - instant response for immediate actions */
    sharp: [0.4, 0, 0.2, 1] as const,

    // Aliases from @hive/tokens
    /** Default easing (alias for premium) */
    default: [0.23, 1, 0.32, 1] as const,

    /** Snap easing for quick interactions */
    snap: [0.25, 0.1, 0.25, 1] as const,

    /** Dramatic easing for celebrations */
    dramatic: [0.165, 0.84, 0.44, 1] as const,
  },

  /**
   * Duration scales (SECONDS - for Framer Motion)
   * Shorter = more responsive, longer = more ceremonial
   */
  duration: {
    /** Instant feedback (150ms) - hover states, button presses */
    instant: 0.15,

    /** Fast (300ms) - dropdowns, tooltips */
    fast: 0.3,

    /** Base (600ms) - default for most animations */
    base: 0.6,

    /** Slow (1s) - section reveals, important transitions */
    slow: 1.0,

    /** Slower (1.2s) - hero animations, full-screen transitions */
    slower: 1.2,

    /** Slowest (1.5s) - border draws, narrative reveals */
    slowest: 1.5,

    // Aliases from @hive/tokens durationSeconds
    /** Micro (100ms) - micro-interactions */
    micro: 0.1,

    /** Snap (150ms) - toggles, checkboxes */
    snap: 0.15,

    /** Quick (200ms) - fast interactions */
    quick: 0.2,

    /** Standard (300ms) - default transitions */
    standard: 0.3,

    /** Smooth (400ms) - smooth movements */
    smooth: 0.4,

    /** Flowing (500ms) - layout changes */
    flowing: 0.5,

    /** Gentle (600ms) - gentle entrances */
    gentle: 0.6,

    /** Dramatic (700ms) - special moments */
    dramatic: 0.7,

    /** Hero (1200ms) - hero entrances */
    hero: 1.2,
  },

  /**
   * Stagger delays (seconds)
   * For animating lists/sequences
   */
  stagger: {
    /** Tight - rapid succession (50ms between items) */
    tight: 0.05,

    /** Base - standard rhythm (100ms between items) */
    base: 0.1,

    /** Relaxed - deliberate pacing (150ms between items) */
    relaxed: 0.15,

    /** Words - for narrative text reveals (30ms between words) */
    words: 0.03,

    /** Characters - for dramatic reveals (20ms between characters) */
    characters: 0.02,

    // Aliases from @hive/tokens
    /** Fast stagger (30ms) */
    fast: 0.03,

    /** Default stagger (50ms) */
    default: 0.05,

    /** Section stagger (80ms) */
    section: 0.08,

    /** Slow stagger (100ms) */
    slow: 0.1,
  },

  /**
   * Viewport margins for useInView
   * Controls when scroll-triggered animations fire
   */
  viewport: {
    /** Immediate - triggers as soon as element enters viewport */
    immediate: '0px',

    /** Close - triggers 50px before element enters (default for most reveals) */
    close: '-50px',

    /** Medium - triggers 100px before (staggered lists) */
    medium: '-100px',

    /** Far - triggers 150px before (large sections) */
    far: '-150px',

    /** Deep - triggers 200px before (hero animations) */
    deep: '-200px',
  },

  /**
   * Spring configurations
   * For physics-based animations (magnetic, tilt effects)
   */
  spring: {
    /** Gentle - soft, bouncy (stiffness: 150, damping: 15) */
    gentle: { stiffness: 150, damping: 15 },

    /** Base - balanced spring (stiffness: 300, damping: 30) */
    base: { stiffness: 300, damping: 30 },

    /** Snappy - tight, responsive (stiffness: 400, damping: 40) */
    snappy: { stiffness: 400, damping: 40 },

    /** Smooth cursor - for cursor-following effects (stiffness: 100, damping: 30) */
    cursor: { stiffness: 100, damping: 30 },

    // Aliases from @hive/tokens
    /** Default spring */
    default: { stiffness: 200, damping: 25 },

    /** Bouncy spring for celebrations */
    bouncy: { stiffness: 300, damping: 15 },
  },

  /**
   * Parallax speed multipliers
   * Higher = more dramatic parallax effect
   */
  parallax: {
    /** Subtle - barely noticeable depth */
    subtle: 0.05,

    /** Base - standard parallax */
    base: 0.1,

    /** Strong - dramatic depth */
    strong: 0.15,
  },
} as const;

/**
 * Type helpers for motion values
 */
export type EaseType = keyof typeof MOTION.ease;
export type DurationType = keyof typeof MOTION.duration;
export type StaggerType = keyof typeof MOTION.stagger;
export type ViewportType = keyof typeof MOTION.viewport;
export type SpringType = keyof typeof MOTION.spring;
export type ParallaxType = keyof typeof MOTION.parallax;
