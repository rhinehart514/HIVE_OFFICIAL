'use client';

/**
 * OfflineBanner - Shows when user is offline
 *
 * Non-intrusive banner at the bottom of entry sections.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-500/10 border border-amber-500/20"
        >
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span className="text-body-sm text-amber-400">
            You're offline. Reconnect to continue.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

OfflineBanner.displayName = 'OfflineBanner';
