'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineWarningProps {
  isOnline: boolean;
}

export function OfflineWarning({ isOnline }: OfflineWarningProps) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-red-400" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="font-medium text-red-300">You&apos;re offline</h4>
              <p className="text-sm text-red-400/80 mt-0.5">
                Your progress is saved locally. Connect to the internet to continue.
              </p>
            </div>

            {/* Refresh indicator */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="flex-shrink-0"
            >
              <RefreshCw className="w-4 h-4 text-red-400/50" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
