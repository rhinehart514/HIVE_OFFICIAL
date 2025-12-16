'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '../../../lib/utils';
import { Button } from '../atoms/button';

export interface ComingSoonProps {
  /**
   * Feature name being previewed
   */
  title: string;
  /**
   * Description of what's coming
   */
  description?: string;
  /**
   * Optional icon/illustration element
   */
  icon?: React.ReactNode;
  /**
   * Primary CTA label (e.g., "Explore Spaces")
   */
  primaryActionLabel?: string;
  /**
   * Primary CTA handler
   */
  onPrimaryAction?: () => void;
  /**
   * Secondary CTA label (e.g., "Learn More")
   */
  secondaryActionLabel?: string;
  /**
   * Secondary CTA handler
   */
  onSecondaryAction?: () => void;
  /**
   * Additional class names
   */
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const pulseVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const ComingSoon = React.forwardRef<HTMLDivElement, ComingSoonProps>(
  (
    {
      title,
      description,
      icon,
      primaryActionLabel,
      onPrimaryAction,
      secondaryActionLabel,
      onSecondaryAction,
      className,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex min-h-[60vh] w-full flex-col items-center justify-center overflow-hidden px-4 py-16',
          className
        )}
      >
        {/* Animated background glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={pulseVariants}
            className="h-[400px] w-[400px] rounded-full bg-gradient-to-r from-[var(--hive-brand-primary)]/20 via-[var(--hive-gold-primary)]/10 to-[var(--hive-brand-primary)]/20 blur-3xl"
          />
        </motion.div>

        <motion.div
          className="relative z-10 flex max-w-lg flex-col items-center text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--hive-gold-primary)]/30 bg-[var(--hive-gold-primary)]/10 px-4 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--hive-gold-primary)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--hive-gold-primary)]" />
            </span>
            <span className="text-sm font-medium text-[var(--hive-gold-primary)]">
              Coming Soon
            </span>
          </motion.div>

          {/* Icon */}
          {icon && (
            <motion.div
              variants={itemVariants}
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--hive-background-secondary)] shadow-lg shadow-black/10"
            >
              {icon}
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="mb-3 text-3xl font-bold tracking-tight text-[var(--hive-text-primary)] sm:text-4xl"
          >
            {title}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              variants={itemVariants}
              className="mb-8 max-w-md text-base text-[var(--hive-text-secondary)] leading-relaxed sm:text-lg"
            >
              {description}
            </motion.p>
          )}

          {/* Actions */}
          {(primaryActionLabel || secondaryActionLabel) && (
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              {primaryActionLabel && (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={onPrimaryAction}
                  className="min-w-[140px]"
                >
                  {primaryActionLabel}
                </Button>
              )}
              {secondaryActionLabel && (
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={onSecondaryAction}
                  className="min-w-[140px]"
                >
                  {secondaryActionLabel}
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Decorative honeycomb pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="honeycomb"
                x="0"
                y="0"
                width="56"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#honeycomb)" />
          </svg>
        </div>
      </div>
    );
  }
);

ComingSoon.displayName = 'ComingSoon';
