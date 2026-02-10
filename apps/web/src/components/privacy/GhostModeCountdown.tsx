'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatTimeRemaining, formatTimeRemainingCompact } from '@/lib/ghost-mode-constants';

export interface GhostModeCountdownProps {
  expiresAt: Date;
  onExpired?: () => void;
  variant?: 'compact' | 'full';
  className?: string;
}

export function GhostModeCountdown({
  expiresAt,
  onExpired,
  variant = 'full',
  className,
}: GhostModeCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    return Math.max(0, expiresAt.getTime() - Date.now());
  });

  useEffect(() => {
    const updateTime = () => {
      const remaining = expiresAt.getTime() - Date.now();

      if (remaining <= 0) {
        setTimeRemaining(0);
        onExpired?.();
        return;
      }

      setTimeRemaining(remaining);
    };

    updateTime();

    // Update every second when under an hour, every minute otherwise
    const interval = setInterval(updateTime, timeRemaining < 60 * 60 * 1000 ? 1000 : 60000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired, timeRemaining]);

  if (timeRemaining <= 0) {
    return (
      <span className={cn('text-red-400', className)}>
        Expired
      </span>
    );
  }

  const isExpiringSoon = timeRemaining < 30 * 60 * 1000; // Less than 30 minutes

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'font-mono text-sm',
          isExpiringSoon ? 'text-amber-400' : 'text-white/50',
          className
        )}
      >
        {formatTimeRemainingCompact(timeRemaining)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'text-sm',
        isExpiringSoon ? 'text-amber-400' : 'text-white/50',
        className
      )}
    >
      Expires in {formatTimeRemaining(timeRemaining)}
    </span>
  );
}
