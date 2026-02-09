'use client';

/**
 * StepCounter - Progress indicator for multi-step flows
 *
 * Premium animated progress bar with step count.
 * Gold gradient fill that smoothly transitions as user progresses.
 */

import { motion } from 'framer-motion';
import { EASE_PREMIUM, DURATION } from '../motion/constants';

interface StepCounterProps {
  /** Current step (1-indexed) */
  current: number;
  /** Total number of steps */
  total: number;
  /** Optional label override (default: "Step {current} of {total}") */
  label?: string;
}

export function StepCounter({ current, total, label }: StepCounterProps) {
  const progress = (current / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-label text-white/40 whitespace-nowrap">
        {label ?? `Step ${current} of ${total}`}
      </span>
      <div className="flex-1 h-px bg-white/[0.08] overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--color-gold)]/60 to-[var(--color-gold)]/20"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: DURATION.smooth,
            ease: EASE_PREMIUM,
          }}
        />
      </div>
    </div>
  );
}

StepCounter.displayName = 'StepCounter';
