'use client';

/**
 * AnimatedCounter - Number that animates on change
 *
 * Signature HIVE moment: Numbers tick up/down smoothly
 * Used for: RSVP counts, member counts, upvotes
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import * as React from 'react';

import { cn } from '../../../lib/utils';

export interface AnimatedCounterProps {
  value: number;
  className?: string;
  /** Duration in seconds */
  duration?: number;
  /** Format number (e.g., add commas) */
  format?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  className,
  duration = 0.5,
  format = (n) => n.toLocaleString(),
}: AnimatedCounterProps) {
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) =>
    format(Math.round(current))
  );

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={cn('tabular-nums', className)}>
      {display}
    </motion.span>
  );
}

/**
 * AnimatedCounterWithLabel - Counter with label and optional delta indicator
 */
export interface AnimatedCounterWithLabelProps extends AnimatedCounterProps {
  label: string;
  showDelta?: boolean;
  previousValue?: number;
}

export function AnimatedCounterWithLabel({
  value,
  label,
  showDelta = false,
  previousValue,
  className,
  ...props
}: AnimatedCounterWithLabelProps) {
  const delta = previousValue !== undefined ? value - previousValue : 0;
  const showPositiveDelta = showDelta && delta > 0;

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-baseline gap-2">
        <AnimatedCounter
          value={value}
          className="text-2xl font-semibold text-text-primary"
          {...props}
        />
        {showPositiveDelta && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-brand-primary"
          >
            +{delta}
          </motion.span>
        )}
      </div>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  );
}
