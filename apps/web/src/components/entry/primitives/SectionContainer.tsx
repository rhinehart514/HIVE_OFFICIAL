'use client';

/**
 * SectionContainer - Animated wrapper for entry sections
 *
 * Handles enter/exit animations for sections in the evolving entry flow.
 * Each section appears below completed sections and animates in.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { sectionEnterVariants } from '../motion/section-motion';

interface SectionContainerProps {
  /** Unique key for AnimatePresence */
  id: string;
  /** Whether this section is visible */
  isVisible: boolean;
  /** Section content */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Custom animation variants */
  variants?: typeof sectionEnterVariants;
  /** Delay before animating in */
  delay?: number;
}

export function SectionContainer({
  id,
  isVisible,
  children,
  className = '',
  variants = sectionEnterVariants,
  delay = 0,
}: SectionContainerProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={id}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={className}
          style={{ originY: 0 }}
          custom={delay}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * SimpleSectionContainer - Non-animated wrapper for layout consistency
 */
export function SimpleSectionContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
