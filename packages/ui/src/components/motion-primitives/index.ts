/**
 * Motion Primitives
 * Production-ready animation components using HIVE motion tokens
 *
 * Built with:
 * - Framer Motion (layout animations, gestures)
 * - AutoAnimate (zero-config list animations)
 * - Lottie (After Effects imports)
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
export { GlowEffect, AnimatedGoldIcon, type GlowEffectProps } from './glow-effect';
export { SwipeableCarousel, type SwipeableCarouselProps } from './swipeable-carousel';

// Premium Card Effects (Nov 2025 - Billion-Dollar UI)
export {
  ShineBorder,
  ShineBorderCard,
  type ShineBorderProps,
  type ShineBorderCardProps,
} from './shine-border';
export {
  BorderBeam,
  BorderBeamCard,
  type BorderBeamProps,
  type BorderBeamCardProps,
} from './border-beam';
export {
  SparklesText,
  sparklePresets,
  type SparklesTextProps,
} from './sparkles-text';

// Space Celebrations (Nov 2025 - Motion-Rich Premium)
export {
  GoldConfettiBurst,
  JoinCelebration,
  FirstPostCelebration,
  MilestoneBadge,
} from './space-celebrations';
export type {
  GoldConfettiBurstProps,
  JoinCelebrationProps,
  FirstPostCelebrationProps,
  MilestoneBadgeProps,
} from './space-celebrations';

// Brand Spinner (Dec 2025 - Design Elevation)
export { GoldSpinner, GoldSpinnerInline, type GoldSpinnerProps } from './gold-spinner';
