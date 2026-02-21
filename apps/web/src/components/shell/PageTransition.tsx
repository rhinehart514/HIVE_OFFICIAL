'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { pageTransitionVariants } from '@hive/tokens';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition — wraps page content with fade + subtle y shift.
 *
 * Uses `pageTransitionVariants` from @hive/tokens:
 *   enter: opacity 0→1, y 8→0 over 400ms
 *   exit:  opacity 1→0, y 0→-8 over 250ms
 *
 * Keyed by pathname so every navigation triggers the animation.
 * Respects prefers-reduced-motion (fade only, no y movement).
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduce = useReducedMotion();

  const variants = shouldReduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : pageTransitionVariants;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
