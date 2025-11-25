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
  LottieAnimation,
  LottieCelebration,
  LottieLoading,
  LottieSuccess,
  lottiePresets,
  type LottieAnimationProps,
} from './lottie-animation';
