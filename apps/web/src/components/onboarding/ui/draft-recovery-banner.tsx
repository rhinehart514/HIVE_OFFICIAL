'use client';

import { motion } from 'framer-motion';
import { Clock, ArrowRight, X } from 'lucide-react';
import { Button } from '@hive/ui';

interface DraftRecoveryBannerProps {
  savedAt: number;
  onContinue: () => void;
  onDiscard: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export function DraftRecoveryBanner({
  savedAt,
  onContinue,
  onDiscard,
}: DraftRecoveryBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="bg-gradient-to-r from-amber-500/10 to-gold-500/10 border border-amber-500/30 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white">Continue where you left off?</h4>
          <p className="text-sm text-neutral-400 mt-0.5">
            You have an unfinished profile from {formatTimeAgo(savedAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onDiscard}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
            aria-label="Start fresh"
          >
            <X className="w-4 h-4" />
          </button>

          <Button
            size="sm"
            onClick={onContinue}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
