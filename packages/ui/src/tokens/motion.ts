/**
 * Motion Tokens - UI Package
 *
 * Re-exports from @hive/tokens (the authoritative source).
 */

export {
  easingArrays,
  durationSeconds,
  springPresets,
  motionCSS,
  motionCSS as motionTokens,
  pageTransitionVariants,
  modalVariants,
  messageEntryVariants,
  reducedMotionVariants,
  goldPulse,
  hoverLift,
} from '@hive/tokens';

export type {
  MotionToken,
  MotionEasing,
  MotionDuration,
  MotionCascade,
  EasingArray,
  DurationSeconds,
  SpringPreset,
} from '@hive/tokens';

// Re-export MOTION from @hive/tokens as the canonical source
export { MOTION } from '@hive/tokens';
