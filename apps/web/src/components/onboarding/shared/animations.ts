/**
 * Onboarding Animation Variants
 * Re-exports from the central motion primitives for consistency
 */

export {
  // Variants
  fadeSlideUp as fadeSlideVariants,
  fadeSlideSubtle,
  scaleFade,
  staggerContainer,
  staggerItem,

  // Transitions
  transitionSilk as transition,
  transitionSpring as springTransition,
  transitionSpringBounce,

  // Easing
  EASE_SILK,
  EASE_SNAP,

  // Duration
  DURATION,

  // Glows
  GLOW_GOLD,
  GLOW_GOLD_SUBTLE,
  GLOW_GOLD_STRONG,
} from '@/lib/motion-primitives';
