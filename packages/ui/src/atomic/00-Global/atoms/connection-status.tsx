/**
 * Connection Status Component
 *
 * Displays real-time connection state with visual indicators.
 * Shows "Live", "Reconnecting", or "Offline" status.
 *
 * @module connection-status
 * @since 1.0.0
 */

'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';

export interface ConnectionStatusProps {
  /** Is real-time connection active */
  isConnected: boolean;

  /** Is reconnecting after disconnect */
  isReconnecting?: boolean;

  /** Show label text (default: true) */
  showLabel?: boolean;

  /** Compact mode (smaller indicator) */
  compact?: boolean;

  /** Custom className */
  className?: string;

  /** Position (for absolute positioning) */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Connection Status Indicator
 *
 * @example
 * ```tsx
 * const { isRealtime } = useHiveQuery({
 *   queryKey: ['feed'],
 *   queryFn: getFeed,
 *   enableRealtime: true,
 * });
 *
 * <ConnectionStatus
 *   isConnected={isRealtime}
 *   position="top-right"
 * />
 * ```
 */
export function ConnectionStatus({
  isConnected,
  isReconnecting = false,
  showLabel = true,
  compact = false,
  className,
  position,
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);

  /**
   * Monitor network status
   */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Determine current state
   */
  const state = !isOnline ? 'offline' : isReconnecting ? 'reconnecting' : isConnected ? 'live' : 'disconnected';

  /**
   * Don't show if disconnected and not relevant
   */
  if (!isConnected && !isReconnecting && isOnline) {
    return null;
  }

  const stateConfig = {
    live: {
      label: 'Live',
      color: 'bg-[#00D46A]',
      textColor: 'text-[#00D46A]',
      borderColor: 'border-[#00D46A]/20',
      pulse: true,
    },
    reconnecting: {
      label: 'Reconnecting...',
      color: 'bg-[#FFB800]',
      textColor: 'text-[#FFB800]',
      borderColor: 'border-[#FFB800]/20',
      pulse: true,
    },
    offline: {
      label: 'Offline',
      color: 'bg-[#FF3737]',
      textColor: 'text-[#FF3737]',
      borderColor: 'border-[#FF3737]/20',
      pulse: false,
    },
    disconnected: {
      label: 'Disconnected',
      color: 'bg-[#1A1A1A]',
      textColor: 'text-[#71717A]',
      borderColor: 'border-[#2A2A2A]',
      pulse: false,
    },
  };

  const config = stateConfig[state];

  const positionClasses = position
    ? {
        'top-left': 'absolute top-4 left-4',
        'top-right': 'absolute top-4 right-4',
        'bottom-left': 'absolute bottom-4 left-4',
        'bottom-right': 'absolute bottom-4 right-4',
      }[position]
    : '';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        'px-3 py-1.5 rounded-full',
        'border',
        'bg-[#0A0A0A]',
        config.borderColor,
        compact && 'px-2 py-1',
        positionClasses,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${config.label}`}
    >
      {/* Status indicator dot */}
      <div className="relative flex items-center justify-center">
        {/* Pulse animation (only for live/reconnecting) */}
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              'animate-pulse',
              config.color
            )}
            aria-hidden="true"
          />
        )}

        {/* Static dot */}
        <span
          className={cn(
            'relative inline-flex rounded-full',
            compact ? 'h-2 w-2' : 'h-2.5 w-2.5',
            config.color
          )}
          aria-hidden="true"
        />
      </div>

      {/* Status label */}
      {showLabel && (
        <span
          className={cn(
            'font-medium',
            compact ? 'text-xs' : 'text-sm',
            config.textColor
          )}
        >
          {config.label}
        </span>
      )}

      {/* Reconnecting spinner */}
      {isReconnecting && (
        <svg
          className={cn('animate-spin', compact ? 'h-3 w-3' : 'h-4 w-4', config.textColor)}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </div>
  );
}

/**
 * Floating connection status (fixed position overlay)
 *
 * @example
 * ```tsx
 * <FloatingConnectionStatus
 *   isConnected={isRealtime}
 *   position="top-right"
 * />
 * ```
 */
export function FloatingConnectionStatus({
  isConnected,
  isReconnecting,
  showLabel = true,
  compact = true,
}: Omit<ConnectionStatusProps, 'position' | 'className'>) {
  return (
    <ConnectionStatus
      isConnected={isConnected}
      isReconnecting={isReconnecting}
      showLabel={showLabel}
      compact={compact}
      position="top-right"
      className="z-50 shadow-lg"
    />
  );
}

/**
 * Inline connection badge (for use in headers, etc.)
 *
 * @example
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <h2>Feed</h2>
 *   <ConnectionBadge isConnected={isRealtime} />
 * </div>
 * ```
 */
export function ConnectionBadge({ isConnected }: { isConnected: boolean }) {
  if (!isConnected) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2 py-0.5 rounded-md',
        'bg-[#00D46A]/10',
        'text-[#00D46A]',
        'text-xs font-medium'
      )}
      role="status"
      aria-label="Live updates active"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[#00D46A] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00D46A]" />
      </span>
      Live
    </span>
  );
}
