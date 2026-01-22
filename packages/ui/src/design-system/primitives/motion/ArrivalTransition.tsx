'use client';

/**
 * ArrivalTransition — Space entry animation
 *
 * DRAMA.md Tier 1: "First entry to a space should feel like arriving"
 * Creates the feeling of walking into a room.
 *
 * Sequence:
 * 1. Header fades in (0.2s)
 * 2. Sidebar slides in from right (0.3s)
 * 3. Main content fades in (0.4s)
 * 4. Feed items stagger in (0.05s each)
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';

export interface ArrivalTransitionProps {
  children: React.ReactNode;
  className?: string;
  /** Skip animation (for returning members) */
  skipAnimation?: boolean;
  /** Called when arrival animation completes */
  onArrivalComplete?: () => void;
}

export interface ArrivalZoneProps {
  children: React.ReactNode;
  className?: string;
  /** Zone type determines animation style */
  zone: 'header' | 'sidebar' | 'content' | 'item';
  /** Index for staggered items */
  index?: number;
}

const zoneDelays = {
  header: 0,
  sidebar: 0.2,
  content: 0.3,
  item: 0.4, // Base delay, index adds stagger
};

const zoneAnimations = {
  header: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
  },
  sidebar: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
  },
  content: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  item: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
  },
};

const ArrivalContext = React.createContext<{
  skipAnimation: boolean;
}>({ skipAnimation: false });

export function ArrivalTransition({
  children,
  className,
  skipAnimation = false,
  onArrivalComplete,
}: ArrivalTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const skip = skipAnimation || !!shouldReduceMotion;

  React.useEffect(() => {
    if (onArrivalComplete) {
      const timer = setTimeout(onArrivalComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [onArrivalComplete]);

  return (
    <ArrivalContext.Provider value={{ skipAnimation: skip }}>
      <div className={className}>{children}</div>
    </ArrivalContext.Provider>
  );
}

export function ArrivalZone({
  children,
  className,
  zone,
  index = 0,
}: ArrivalZoneProps) {
  const { skipAnimation } = React.useContext(ArrivalContext);
  const animation = zoneAnimations[zone];
  const baseDelay = zoneDelays[zone];
  const staggerDelay = zone === 'item' ? index * MOTION.stagger.tight : 0;

  if (skipAnimation) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={animation.initial}
      animate={animation.animate}
      transition={{
        duration: zone === 'item' ? MOTION.duration.fast : MOTION.duration.base,
        delay: baseDelay + staggerDelay,
        ease: MOTION.ease.premium,
      }}
    >
      {children}
    </motion.div>
  );
}

ArrivalTransition.displayName = 'ArrivalTransition';
ArrivalZone.displayName = 'ArrivalZone';
