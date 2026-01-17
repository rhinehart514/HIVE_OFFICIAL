'use client';

/**
 * PageTransition - Route-level animation system
 * Source: docs/design-system/TEMPLATES.md
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Design Philosophy:
 * - Subtle, purposeful transitions (YC/SF aesthetic)
 * - Atmosphere-aware - adapts to page context
 * - Performance-first - respects reduced motion
 * - Route-aware - different transitions for different navigations
 *
 * TRANSITION MODES:
 *
 * 1. FADE (default for most pages)
 *    ┌─────────────┐    ┌─────────────┐
 *    │ Page A      │ -> │ Page B      │
 *    │ opacity: 1  │    │ opacity: 0->1│
 *    └─────────────┘    └─────────────┘
 *
 * 2. SLIDE (for sequential flows like onboarding)
 *    ┌─────────────┐ ────────────────> ┌─────────────┐
 *    │ Step 1      │                   │ Step 2      │
 *    │ x: 0        │                   │ x: 100%->0  │
 *    └─────────────┘                   └─────────────┘
 *
 * 3. SCALE (for modal-like pages)
 *    ┌───────────────┐
 *    │   ┌───────┐   │
 *    │   │ Page  │   │  scale: 0.95->1
 *    │   └───────┘   │  opacity: 0->1
 *    └───────────────┘
 *
 * 4. MORPH (for related content transitions)
 *    Uses layoutId for shared element transitions
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// TYPES
// ============================================

export type TransitionMode = 'fade' | 'slide' | 'slideUp' | 'scale' | 'none';
export type TransitionDirection = 'forward' | 'backward';

export interface PageTransitionProps {
  /** Unique key for the page (usually pathname) */
  pageKey: string;
  /** Content to animate */
  children: React.ReactNode;
  /** Transition mode */
  mode?: TransitionMode;
  /** Direction for slide transitions */
  direction?: TransitionDirection;
  /** Custom duration in seconds */
  duration?: number;
  /** Additional delay before animation starts */
  delay?: number;
  /** Callback when enter animation starts */
  onEnterStart?: () => void;
  /** Callback when enter animation completes */
  onEnterComplete?: () => void;
  /** Callback when exit animation starts */
  onExitStart?: () => void;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Disable animation (for reduced motion) */
  disabled?: boolean;
}

export interface PageTransitionContextValue {
  mode: TransitionMode;
  direction: TransitionDirection;
  setMode: (mode: TransitionMode) => void;
  setDirection: (direction: TransitionDirection) => void;
  isAnimating: boolean;
}

// ============================================
// MOTION TOKENS (aligned with presets)
// ============================================

const DURATION = {
  standard: 0.3,
  smooth: 0.4,
  quick: 0.15,
};

const EASING = {
  default: [0.25, 0.1, 0.25, 1],
  silk: [0.43, 0.13, 0.23, 0.96],
  snap: [0.2, 0, 0, 1],
};

// ============================================
// TRANSITION VARIANTS
// ============================================

const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideVariants = (direction: TransitionDirection): Variants => ({
  initial: {
    opacity: 0,
    x: direction === 'forward' ? 40 : -40
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: direction === 'forward' ? -40 : 40
  },
});

const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

const noneVariants: Variants = {
  initial: {},
  animate: {},
  exit: {},
};

// ============================================
// CONTEXT
// ============================================

const PageTransitionContext = React.createContext<PageTransitionContextValue | null>(null);

export function usePageTransition() {
  const context = React.useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

export interface PageTransitionProviderProps {
  children: React.ReactNode;
  defaultMode?: TransitionMode;
  defaultDirection?: TransitionDirection;
}

export function PageTransitionProvider({
  children,
  defaultMode = 'fade',
  defaultDirection = 'forward',
}: PageTransitionProviderProps) {
  const [mode, setMode] = React.useState<TransitionMode>(defaultMode);
  const [direction, setDirection] = React.useState<TransitionDirection>(defaultDirection);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const value = React.useMemo(
    () => ({
      mode,
      direction,
      setMode,
      setDirection,
      isAnimating,
    }),
    [mode, direction, isAnimating]
  );

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
    </PageTransitionContext.Provider>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * PageTransition - Wraps page content with enter/exit animations
 *
 * @example
 * ```tsx
 * // In a Next.js layout
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   const pathname = usePathname();
 *
 *   return (
 *     <PageTransition pageKey={pathname} mode="fade">
 *       {children}
 *     </PageTransition>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Onboarding flow with directional slides
 * <PageTransition
 *   pageKey={currentStep}
 *   mode="slide"
 *   direction={stepIncreased ? 'forward' : 'backward'}
 * >
 *   <OnboardingStep />
 * </PageTransition>
 * ```
 */
export function PageTransition({
  pageKey,
  children,
  mode = 'fade',
  direction = 'forward',
  duration = DURATION.standard,
  delay = 0,
  onEnterStart,
  onEnterComplete,
  onExitStart,
  onExitComplete,
  className,
  disabled = false,
}: PageTransitionProps) {
  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const shouldAnimate = !disabled && !prefersReducedMotion;

  // Get variants based on mode
  const getVariants = (): Variants => {
    if (!shouldAnimate) return noneVariants;

    switch (mode) {
      case 'slide':
        return slideVariants(direction);
      case 'slideUp':
        return slideUpVariants;
      case 'scale':
        return scaleVariants;
      case 'none':
        return noneVariants;
      case 'fade':
      default:
        return fadeVariants;
    }
  };

  const variants = getVariants();

  const transitionConfig = shouldAnimate
    ? {
        duration,
        delay,
        ease: EASING.silk,
      }
    : { duration: 0 };

  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      <motion.div
        key={pageKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transitionConfig}
        onAnimationStart={() => {
          onEnterStart?.();
        }}
        onAnimationComplete={() => {
          onEnterComplete?.();
        }}
        className={cn('w-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// UTILITY COMPONENTS
// ============================================

/**
 * FadeTransition - Simple fade in/out wrapper
 */
export interface FadeTransitionProps {
  children: React.ReactNode;
  show?: boolean;
  duration?: number;
  className?: string;
}

export function FadeTransition({
  children,
  show = true,
  duration = DURATION.quick,
  className,
}: FadeTransitionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: EASING.default }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * SlideTransition - Directional slide wrapper
 */
export interface SlideTransitionProps {
  children: React.ReactNode;
  show?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  offset?: number;
  duration?: number;
  className?: string;
}

export function SlideTransition({
  children,
  show = true,
  direction = 'up',
  offset = 20,
  duration = DURATION.standard,
  className,
}: SlideTransitionProps) {
  const getOffset = () => {
    switch (direction) {
      case 'left':
        return { x: -offset, y: 0 };
      case 'right':
        return { x: offset, y: 0 };
      case 'up':
        return { x: 0, y: offset };
      case 'down':
        return { x: 0, y: -offset };
    }
  };

  const initialOffset = getOffset();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, ...initialOffset }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...initialOffset }}
          transition={{ duration, ease: EASING.silk }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ScaleTransition - Scale in/out wrapper
 */
export interface ScaleTransitionProps {
  children: React.ReactNode;
  show?: boolean;
  initialScale?: number;
  duration?: number;
  className?: string;
}

export function ScaleTransition({
  children,
  show = true,
  initialScale = 0.95,
  duration = DURATION.standard,
  className,
}: ScaleTransitionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: initialScale }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: initialScale }}
          transition={{ duration, ease: EASING.default }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * StaggerContainer - Staggers children animations
 */
export interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.05,
  className,
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.standard,
        ease: EASING.default,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
}

/**
 * StaggerItem - Child of StaggerContainer (for manual control)
 */
export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.standard,
        ease: EASING.default,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================
// PRESETS (for common page types)
// ============================================

export const pageTransitionPresets = {
  /** Standard page navigation */
  default: {
    mode: 'fade' as const,
    duration: DURATION.standard,
  },
  /** Onboarding/wizard flows */
  wizard: {
    mode: 'slide' as const,
    duration: DURATION.standard,
  },
  /** Modal-like full-page overlays */
  overlay: {
    mode: 'scale' as const,
    duration: DURATION.smooth,
  },
  /** Quick transitions for tabs */
  tab: {
    mode: 'fade' as const,
    duration: DURATION.quick,
  },
  /** No transition */
  none: {
    mode: 'none' as const,
    duration: 0,
  },
};

export default PageTransition;
