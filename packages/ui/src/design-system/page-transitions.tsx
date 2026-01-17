"use client";

/**
 * PAGE TRANSITION SYSTEM
 *
 * From SYSTEMS.md Motion System:
 * "Motion answers questions, it's not decoration."
 *
 * Four transition types:
 * - ENTER: Page appears (opacity + y-axis)
 * - EXIT: Page dismisses (opacity + scale down)
 * - SHIFT: Lateral navigation (opacity + x-axis)
 * - EXPAND: Detail view opens (scale + opacity)
 *
 * Each atmosphere has different timing:
 * - Landing: Dramatic (500-700ms)
 * - Spaces: Smooth (300ms)
 * - Workshop: Snap (100-150ms)
 */

import * as React from "react";
import { motion, AnimatePresence, type Variants, type Transition } from "framer-motion";
import { useAtmosphereOptional, type AtmosphereLevel } from "./AtmosphereProvider";
import { cn } from "../lib/utils";

// ============================================
// TYPES
// ============================================

export type TransitionType = "enter" | "exit" | "shift" | "expand" | "none";

export interface PageTransitionProps {
  children: React.ReactNode;
  /** Transition type (default: enter) */
  type?: TransitionType;
  /** Override atmosphere for timing */
  atmosphere?: AtmosphereLevel;
  /** Custom delay before animation starts */
  delay?: number;
  /** Unique key for AnimatePresence */
  transitionKey?: string;
  /** Callback when transition completes */
  onTransitionComplete?: () => void;
  /** Additional className */
  className?: string;
  /** Disable transition (instant render) */
  disabled?: boolean;
}

export interface StaggerContainerProps {
  children: React.ReactNode;
  /** Stagger delay between children (ms) */
  staggerDelay?: number;
  /** Override atmosphere */
  atmosphere?: AtmosphereLevel;
  /** Custom className */
  className?: string;
}

export interface StaggerItemProps {
  children: React.ReactNode;
  /** Override index for custom stagger order */
  index?: number;
  /** Custom className */
  className?: string;
}

// ============================================
// TIMING CONFIG
// ============================================

const TIMING_BY_ATMOSPHERE: Record<AtmosphereLevel, {
  enter: number;
  exit: number;
  shift: number;
  expand: number;
  stagger: number;
}> = {
  landing: {
    enter: 0.5,    // 500ms - dramatic
    exit: 0.15,    // 150ms - quick dismiss
    shift: 0.3,    // 300ms
    expand: 0.4,   // 400ms
    stagger: 0.1,  // 100ms between items
  },
  spaces: {
    enter: 0.3,    // 300ms - smooth
    exit: 0.15,    // 150ms
    shift: 0.2,    // 200ms
    expand: 0.3,   // 300ms
    stagger: 0.05, // 50ms between items
  },
  workshop: {
    enter: 0.15,   // 150ms - snap
    exit: 0.1,     // 100ms
    shift: 0.1,    // 100ms
    expand: 0.15,  // 150ms
    stagger: 0.03, // 30ms between items
  },
};

// Premium easing from LANGUAGE.md
const EASE_SMOOTH = [0.22, 1, 0.36, 1];
const EASE_OUT = [0, 0, 0.2, 1];
const EASE_IN_OUT = [0.4, 0, 0.2, 1];

// ============================================
// VARIANTS
// ============================================

const createEnterVariants = (duration: number): Variants => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: EASE_SMOOTH },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: duration * 0.3, ease: EASE_OUT },
  },
});

const createExitVariants = (duration: number): Variants => ({
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 1, scale: 1 },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration, ease: EASE_OUT },
  },
});

const createShiftVariants = (duration: number): Variants => ({
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration, ease: EASE_IN_OUT },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: duration * 0.5, ease: EASE_OUT },
  },
});

const createExpandVariants = (duration: number): Variants => ({
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration, ease: EASE_SMOOTH },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: duration * 0.5, ease: EASE_OUT },
  },
});

const createStaggerContainerVariants = (staggerDelay: number): Variants => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: staggerDelay * 0.5,
      staggerDirection: -1,
    },
  },
});

const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ease: EASE_SMOOTH },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: { ease: EASE_OUT },
  },
};

// ============================================
// COMPONENTS
// ============================================

/**
 * PageTransition - Wraps content with atmosphere-aware transitions
 *
 * @example
 * // Basic enter transition
 * <PageTransition>
 *   <YourContent />
 * </PageTransition>
 *
 * @example
 * // With AnimatePresence for route changes
 * <AnimatePresence mode="wait">
 *   <PageTransition key={pathname} type="shift">
 *     <YourContent />
 *   </PageTransition>
 * </AnimatePresence>
 */
export const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  (
    {
      children,
      type = "enter",
      atmosphere: atmosphereProp,
      delay = 0,
      transitionKey,
      onTransitionComplete,
      className,
      disabled = false,
    },
    ref
  ) => {
    const atmosphereContext = useAtmosphereOptional();
    const atmosphere = atmosphereProp ?? atmosphereContext?.atmosphere ?? "spaces";
    const timing = TIMING_BY_ATMOSPHERE[atmosphere];

    // Get variants based on type
    const getVariants = (): Variants => {
      switch (type) {
        case "enter":
          return createEnterVariants(timing.enter);
        case "exit":
          return createExitVariants(timing.exit);
        case "shift":
          return createShiftVariants(timing.shift);
        case "expand":
          return createExpandVariants(timing.expand);
        case "none":
        default:
          return {
            initial: { opacity: 1 },
            animate: { opacity: 1 },
            exit: { opacity: 1 },
          };
      }
    };

    if (disabled) {
      return <div ref={ref} className={className}>{children}</div>;
    }

    return (
      <motion.div
        ref={ref}
        key={transitionKey}
        className={cn("w-full", className)}
        variants={getVariants()}
        initial="initial"
        animate="animate"
        exit="exit"
        onAnimationComplete={() => onTransitionComplete?.()}
        style={{ willChange: type !== "none" ? "opacity, transform" : undefined }}
        {...(delay > 0 && {
          transition: { delay },
        })}
      >
        {children}
      </motion.div>
    );
  }
);
PageTransition.displayName = "PageTransition";

/**
 * StaggerContainer - Container for staggered child animations
 *
 * @example
 * <StaggerContainer>
 *   {items.map((item, i) => (
 *     <StaggerItem key={item.id}>
 *       <Card>{item.content}</Card>
 *     </StaggerItem>
 *   ))}
 * </StaggerContainer>
 */
export const StaggerContainer = React.forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, staggerDelay, atmosphere: atmosphereProp, className }, ref) => {
    const atmosphereContext = useAtmosphereOptional();
    const atmosphere = atmosphereProp ?? atmosphereContext?.atmosphere ?? "spaces";
    const timing = TIMING_BY_ATMOSPHERE[atmosphere];
    const delay = staggerDelay ?? timing.stagger;

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={createStaggerContainerVariants(delay)}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

/**
 * StaggerItem - Individual item within a StaggerContainer
 */
export const StaggerItem = React.forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={staggerItemVariants}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// ============================================
// HOOKS
// ============================================

/**
 * usePageTransition - Hook for programmatic transition control
 *
 * @example
 * const { variants, transition } = usePageTransition('enter');
 */
export function usePageTransition(type: TransitionType = "enter") {
  const atmosphereContext = useAtmosphereOptional();
  const atmosphere = atmosphereContext?.atmosphere ?? "spaces";
  const timing = TIMING_BY_ATMOSPHERE[atmosphere];

  const variants = React.useMemo(() => {
    switch (type) {
      case "enter":
        return createEnterVariants(timing.enter);
      case "exit":
        return createExitVariants(timing.exit);
      case "shift":
        return createShiftVariants(timing.shift);
      case "expand":
        return createExpandVariants(timing.expand);
      default:
        return createEnterVariants(timing.enter);
    }
  }, [type, timing]);

  return {
    variants,
    timing,
    atmosphere,
  };
}

/**
 * useStaggerAnimation - Hook for staggered list animations
 *
 * @example
 * const { containerVariants, itemVariants, staggerDelay } = useStaggerAnimation();
 */
export function useStaggerAnimation(customDelay?: number) {
  const atmosphereContext = useAtmosphereOptional();
  const atmosphere = atmosphereContext?.atmosphere ?? "spaces";
  const timing = TIMING_BY_ATMOSPHERE[atmosphere];
  const staggerDelay = customDelay ?? timing.stagger;

  return {
    containerVariants: createStaggerContainerVariants(staggerDelay),
    itemVariants: staggerItemVariants,
    staggerDelay,
    atmosphere,
  };
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get transition timing for a specific atmosphere and type
 */
export function getTransitionTiming(
  atmosphere: AtmosphereLevel,
  type: TransitionType
): number {
  const timing = TIMING_BY_ATMOSPHERE[atmosphere];
  switch (type) {
    case "enter":
      return timing.enter;
    case "exit":
      return timing.exit;
    case "shift":
      return timing.shift;
    case "expand":
      return timing.expand;
    default:
      return 0;
  }
}

/**
 * Create custom transition with atmosphere timing
 */
export function createTransition(
  atmosphere: AtmosphereLevel,
  type: TransitionType,
  options?: Partial<Transition>
): Transition {
  const duration = getTransitionTiming(atmosphere, type);
  const ease =
    type === "enter" || type === "expand"
      ? EASE_SMOOTH
      : type === "shift"
      ? EASE_IN_OUT
      : EASE_OUT;

  return {
    duration,
    ease,
    ...options,
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  TIMING_BY_ATMOSPHERE,
  EASE_SMOOTH,
  EASE_OUT,
  EASE_IN_OUT,
  createEnterVariants,
  createExitVariants,
  createShiftVariants,
  createExpandVariants,
  staggerItemVariants,
};
