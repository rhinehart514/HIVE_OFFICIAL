/**
 * LottieAnimation Component
 * Wrapper for Lottie animations with HIVE integration
 *
 * @example
 * ```tsx
 * import confettiData from './confetti.json';
 *
 * <LottieAnimation
 *   animationData={confettiData}
 *   loop={false}
 *   autoplay={true}
 * />
 * ```
 */

'use client';

import Lottie, { type LottieComponentProps } from 'lottie-react';
import { type CSSProperties } from 'react';
import { cn } from '../../lib/utils';

export interface LottieAnimationProps extends Omit<LottieComponentProps, 'style'> {
  /** Lottie animation JSON data */
  animationData: unknown;

  /** Loop the animation (default: true) */
  loop?: boolean;

  /** Autoplay on mount (default: true) */
  autoplay?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Custom styles */
  style?: CSSProperties;

  /** Callback when animation completes */
  onComplete?: () => void;

  /** Callback on each frame */
  onLoopComplete?: () => void;
}

/**
 * LottieAnimation - Lottie wrapper component
 *
 * Renders Lottie animations exported from After Effects.
 * Perfect for complex animations, celebrations, and micro-interactions.
 */
export function LottieAnimation({
  animationData,
  loop = true,
  autoplay = true,
  className,
  style,
  onComplete,
  onLoopComplete,
  ...props
}: LottieAnimationProps) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={style}
      className={cn('w-full h-full', className)}
      onComplete={onComplete}
      onLoopComplete={onLoopComplete}
      {...props}
    />
  );
}

LottieAnimation.displayName = 'LottieAnimation';

/**
 * Preset Lottie configurations for common use cases
 */
export const lottiePresets = {
  /** Achievement/success celebration (play once) */
  celebration: {
    loop: false,
    autoplay: true,
  },

  /** Loading spinner (loop continuously) */
  loading: {
    loop: true,
    autoplay: true,
  },

  /** Background ambient animation (slow loop) */
  ambient: {
    loop: true,
    autoplay: true,
  },

  /** Error state (play once) */
  error: {
    loop: false,
    autoplay: true,
  },

  /** Success checkmark (play once) */
  success: {
    loop: false,
    autoplay: true,
  },
} as const;

/**
 * Quick preset wrapper components
 */
export const LottieCelebration = (props: Omit<LottieAnimationProps, 'loop' | 'autoplay'>) => (
  <LottieAnimation {...lottiePresets.celebration} {...props} />
);

export const LottieLoading = (props: Omit<LottieAnimationProps, 'loop' | 'autoplay'>) => (
  <LottieAnimation {...lottiePresets.loading} {...props} />
);

export const LottieSuccess = (props: Omit<LottieAnimationProps, 'loop' | 'autoplay'>) => (
  <LottieAnimation {...lottiePresets.success} {...props} />
);
