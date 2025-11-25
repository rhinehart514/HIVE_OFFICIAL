"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-500">
          Step {current} of {total}
        </span>
        <span className="text-xs text-neutral-500">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-0.5 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#FFD700] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
