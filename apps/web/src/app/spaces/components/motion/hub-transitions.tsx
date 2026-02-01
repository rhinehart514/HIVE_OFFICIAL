'use client';

/**
 * Hub Transitions - Page-level entrance animations
 *
 * Features:
 * - Shell fade in (0.4s)
 * - Noise overlay fade in (0.2s delay)
 * - Ambient glow pulse (0.6s)
 * - Content stagger (0.1s per section)
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  motion,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { SPACES_MOTION, SPACES_GOLD } from '@hive/ui/tokens';
import type { HQState } from '../../hooks/useSpacesHQ';

// ============================================================
// State Transition Wrapper
// ============================================================

interface StateTransitionProps {
  children: React.ReactNode;
  state: HQState;
}

export function StateTransition({ children, state }: StateTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        className="flex-1 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: shouldReduceMotion ? 0 : SPACES_MOTION.state.duration,
          ease: MOTION.ease.premium,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Gold Flash for State Changes
// ============================================================

interface StateChangeFlashProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function StateChangeFlash({ trigger, onComplete }: StateChangeFlashProps) {
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (trigger && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, SPACES_MOTION.state.flashDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          exit={{ opacity: 0 }}
          transition={{
            duration: SPACES_MOTION.state.flashDuration,
            ease: 'easeOut',
          }}
          style={{
            backgroundColor: SPACES_GOLD.primary,
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Staggered Children Wrapper
// ============================================================

interface StaggeredEntranceProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggeredEntrance({
  children,
  staggerDelay = SPACES_MOTION.stagger.sections,
  className,
}: StaggeredEntranceProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        ease: MOTION.ease.premium,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
}

// ============================================================
// Page Entrance Animation
// ============================================================

interface PageEntranceProps {
  children: React.ReactNode;
  className?: string;
}

export function PageEntrance({ children, className }: PageEntranceProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.slower,
        ease: MOTION.ease.premium,
      }}
    >
      {children}
    </motion.div>
  );
}

StateTransition.displayName = 'StateTransition';
StateChangeFlash.displayName = 'StateChangeFlash';
StaggeredEntrance.displayName = 'StaggeredEntrance';
PageEntrance.displayName = 'PageEntrance';
