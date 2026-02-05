'use client';

/**
 * CountdownTimer Primitive - LOCKED 2026-01-14
 *
 * Countdown display for cooldowns (e.g., resend code timer)
 * Shows formatted time remaining, triggers callback on complete
 *
 * Formats: 'mm:ss' (1:30), 'ss' (90), 'verbose' (1 min 30 sec)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { easingArrays } from '@hive/tokens';

export interface CountdownTimerProps {
  /** Seconds remaining */
  seconds: number;
  /** Callback when countdown reaches 0 */
  onComplete?: () => void;
  /** Display format */
  format?: 'mm:ss' | 'ss' | 'verbose';
  /** Prefix text (e.g., "Resend in ") */
  prefix?: string;
  /** Text/component to show when complete */
  completedContent?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Text class names */
  textClassName?: string;
}

/**
 * Format seconds into display string
 */
function formatTime(seconds: number, format: 'mm:ss' | 'ss' | 'verbose'): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  switch (format) {
    case 'mm:ss':
      return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `0:${secs.toString().padStart(2, '0')}`;
    case 'ss':
      return `${seconds}`;
    case 'verbose':
      if (mins > 0 && secs > 0) {
        return `${mins} min ${secs} sec`;
      } else if (mins > 0) {
        return `${mins} min`;
      }
      return `${secs} sec`;
    default:
      return `${seconds}`;
  }
}

function CountdownTimer({
  seconds,
  onComplete,
  format = 'mm:ss',
  prefix = '',
  completedContent,
  className,
  textClassName,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = React.useState(seconds);
  const [isComplete, setIsComplete] = React.useState(seconds <= 0);

  // Update when seconds prop changes
  React.useEffect(() => {
    setRemaining(seconds);
    setIsComplete(seconds <= 0);
  }, [seconds]);

  // Countdown effect
  React.useEffect(() => {
    if (remaining <= 0) {
      if (!isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsComplete(true);
          onComplete?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, isComplete, onComplete]);

  const formattedTime = formatTime(remaining, format);

  return (
    <div className={cn('inline-flex items-center', className)}>
      <AnimatePresence mode="wait">
        {isComplete && completedContent ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: easingArrays.default }}
          >
            {completedContent}
          </motion.div>
        ) : (
          <motion.span
            key="counting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn('text-white/40 tabular-nums', textClassName)}
          >
            {prefix}
            <motion.span
              key={remaining}
              initial={{ opacity: 0.5, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
            >
              {formattedTime}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

CountdownTimer.displayName = 'CountdownTimer';

export { CountdownTimer, formatTime };
