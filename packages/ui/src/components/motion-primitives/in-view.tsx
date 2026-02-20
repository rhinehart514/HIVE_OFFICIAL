/**
 * InView Component
 * Scroll-triggered animations using Framer Motion + Intersection Observer
 *
 * Uses motion tokens from @hive/tokens for consistent animations
 *
 * @example
 * ```tsx
 * <InView
 *   variants={{
 *     hidden: { opacity: 0, y: 20 },
 *     visible: { opacity: 1, y: 0 }
 *   }}
 *   transition={{ duration: 0.5 }}
 *   once={true}
 * >
 *   <Card>Content fades in when scrolled into view</Card>
 * </InView>
 * ```
 */

'use client';

import { motion, type Transition, type Variants, type HTMLMotionProps } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { type ReactNode, forwardRef } from 'react';
import { motionTokens } from '@hive/tokens';

export interface InViewProps extends Omit<HTMLMotionProps<'div'>, 'variants' | 'transition' | 'initial' | 'animate'> {
  /** Child elements to animate */
  children: ReactNode;

  /** Animation variants for hidden and visible states */
  variants?: Variants;

  /** Transition configuration */
  transition?: Transition;

  /** HTML element to render as (default: 'div') */
  as?: keyof typeof motion;

  /** Only animate once when entering viewport (default: true) */
  once?: boolean;

  /** Viewport configuration for intersection observer */
  viewOptions?: {
    /** Trigger only once */
    once?: boolean;
    /** Margin around viewport (e.g., '0px 0px -100px 0px') */
    margin?: string;
    /** Percentage of element visible to trigger (0-1) */
    amount?: number;
  };
}

/**
 * Default animation variants matching HIVE motion tokens
 */
const defaultVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

/**
 * Default transition using HIVE motion tokens
 */
const defaultTransition: Transition = {
  duration: parseFloat(motionTokens.duration.liquid) || 0.35,
  ease: motionTokens.easing.default,
};

/**
 * InView - Scroll-triggered animation component
 *
 * Animates elements when they enter the viewport using Intersection Observer.
 * Integrates with HIVE motion token system for consistent timing.
 */
export const InView = forwardRef<HTMLDivElement, InViewProps>(
  (
    {
      children,
      variants = defaultVariants,
      transition = defaultTransition,
      as = 'div',
      once = true,
      viewOptions,
      className,
      ...props
    },
    ref
  ) => {
    const { ref: inViewRef, inView } = useInView({
      triggerOnce: viewOptions?.once ?? once,
      rootMargin: viewOptions?.margin ?? '0px 0px -100px 0px',
      threshold: viewOptions?.amount ?? 0.1,
    });

    const MotionComponent = motion[as] as typeof motion.div;

    // Combine refs
    const setRefs = (node: HTMLDivElement | null) => {
      inViewRef(node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const motionProps = {
      initial: "hidden" as const,
      animate: inView ? ("visible" as const) : ("hidden" as const),
      variants,
      transition,
      className,
      ...props,
    };

    return (
      <MotionComponent ref={setRefs} {...motionProps}>
        {children}
      </MotionComponent>
    );
  }
);

InView.displayName = 'InView';
