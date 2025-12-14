'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Cloud, CloudOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOffline } from '@/hooks/use-offline';

interface OfflineStatusBarProps {
  className?: string;
  /** Position of the status bar */
  position?: 'top' | 'bottom';
  /** Whether to show pending action count */
  showPendingCount?: boolean;
}

/**
 * OfflineStatusBar - Shows connection status and sync progress
 *
 * Features:
 * - Shows when user is offline
 * - Shows pending action count
 * - Shows sync progress when reconnecting
 * - Auto-dismisses when fully synced
 */
export function OfflineStatusBar({
  className,
  position = 'top',
  showPendingCount = true,
}: OfflineStatusBarProps) {
  const {
    isOnline,
    wasOffline,
    isSyncing,
    syncProgress,
    pendingActions,
    hasPendingActions,
  } = useOffline();

  // Determine what to show
  const showOffline = !isOnline;
  const showSyncing = isOnline && isSyncing;
  const showPending = isOnline && !isSyncing && hasPendingActions;
  const showReconnected = isOnline && wasOffline && !hasPendingActions;

  const shouldShow = showOffline || showSyncing || showPending || showReconnected;

  const getStatusConfig = () => {
    if (showOffline) {
      return {
        icon: WifiOff,
        iconColor: 'text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/30',
        title: "You're offline",
        description: hasPendingActions
          ? `${pendingActions.length} action${pendingActions.length === 1 ? '' : 's'} will sync when connected`
          : 'Changes will be saved locally',
      };
    }

    if (showSyncing) {
      return {
        icon: Loader2,
        iconColor: 'text-blue-400 animate-spin',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
        title: 'Syncing...',
        description: `${syncProgress}% complete`,
      };
    }

    if (showPending) {
      return {
        icon: CloudOff,
        iconColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        title: 'Sync pending',
        description: `${pendingActions.length} action${pendingActions.length === 1 ? '' : 's'} waiting`,
      };
    }

    if (showReconnected) {
      return {
        icon: Check,
        iconColor: 'text-green-400',
        bgColor: 'bg-green-500/10 border-green-500/30',
        title: 'Back online',
        description: 'All changes synced',
      };
    }

    return null;
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      {shouldShow && config && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={cn(
            'fixed left-1/2 -translate-x-1/2 z-50',
            position === 'top' ? 'top-4' : 'bottom-20',
            'px-4 py-2.5 rounded-full border shadow-lg backdrop-blur-sm',
            config.bgColor,
            className
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <config.icon
              className={cn('w-4 h-4', config.iconColor)}
              aria-hidden="true"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {config.title}
              </span>
              {config.description && (
                <>
                  <span className="text-white/30">|</span>
                  <span className="text-sm text-white/70">
                    {config.description}
                  </span>
                </>
              )}
            </div>

            {/* Progress bar for syncing */}
            {showSyncing && (
              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden ml-2">
                <motion.div
                  className="h-full bg-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${syncProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Minimal offline indicator for use in headers/navs
 */
export function OfflineIndicator({ className }: { className?: string }) {
  const { isOnline, hasPendingActions, pendingActions } = useOffline();

  if (isOnline && !hasPendingActions) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        !isOnline
          ? 'bg-red-500/10 text-red-400'
          : 'bg-amber-500/10 text-amber-400',
        className
      )}
      role="status"
      aria-label={!isOnline ? 'Offline' : `${pendingActions.length} pending actions`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </>
      ) : (
        <>
          <Cloud className="w-3 h-3" />
          <span>{pendingActions.length}</span>
        </>
      )}
    </div>
  );
}

export default OfflineStatusBar;
