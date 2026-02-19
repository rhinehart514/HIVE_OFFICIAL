/**
 * Motion Primitives
 * Production-ready animation components using HIVE motion tokens
 *
 * Built with:
 * - Framer Motion (layout animations, gestures)
 * - AutoAnimate (zero-config list animations)
 * - Lottie (After Effects imports)
 *
 * Design Philosophy:
 * - Neutral colors by default (white/gray)
 * - Gold reserved for achievements and CTAs only
 * - Respects prefers-reduced-motion
 * - Accessible with proper ARIA labels
 *
 * @see packages/tokens/src/motion.ts - Motion token system
 */

export { InView, type InViewProps } from './in-view';
export { AutoAnimated, useAutoAnimate, type AutoAnimatedProps } from './auto-animated';
export {
  AnimatedNumber,
  numberSpringPresets,
  type AnimatedNumberProps,
} from './animated-number';
export {
  LottieAnimation,
  LottieCelebration,
  LottieLoading,
  LottieSuccess,
  lottiePresets,
  type LottieAnimationProps,
} from './lottie-animation';
export {
  GlowEffect,
  AnimatedGoldIcon,
  GLOW_COLORS,
  type GlowEffectProps,
} from './glow-effect';
export { SwipeableCarousel, type SwipeableCarouselProps } from './swipeable-carousel';

// Space Celebrations (for achievement moments - gold is appropriate here)
// Space celebrations - REMOVED Feb 2026

// Brand Spinner (configurable colors, neutral by default)
export {
  BrandSpinner,
  BrandSpinnerInline,
  GoldSpinner, // deprecated alias
  GoldSpinnerInline, // deprecated alias
  SPINNER_VARIANTS,
  type BrandSpinnerProps,
  type GoldSpinnerProps, // deprecated alias
} from './gold-spinner';
