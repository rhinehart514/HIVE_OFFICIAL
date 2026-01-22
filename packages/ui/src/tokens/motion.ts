/**
 * Motion Tokens
 *
 * Premium motion design tokens for HIVE.
 * Based on patterns from /about page - the gold standard for motion design.
 *
 * Philosophy:
 * - Every transition has physical weight (premium easing)
 * - Motion explains causality (parallax = depth, reveals = earning visibility)
 * - Consistency signals confidence (same easing everywhere)
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
  },

  /**
   * Duration scales (seconds)
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
