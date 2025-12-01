'use client';

import { motion } from 'framer-motion';
import { transitionSilk, GLOW_GOLD_SUBTLE } from '@/lib/motion-primitives';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionSilk}
          className="text-xs font-medium text-neutral-400"
        >
          Step {current} of {total}
        </motion.span>
        <motion.span
          key={`percent-${current}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transitionSilk}
          className="text-xs font-medium text-gold-500"
        >
          {Math.round(percentage)}%
        </motion.span>
      </div>
      <div className="h-1 bg-neutral-800/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-gold-500 to-[#FFC300] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ boxShadow: GLOW_GOLD_SUBTLE }}
        />
      </div>
    </div>
  );
}
