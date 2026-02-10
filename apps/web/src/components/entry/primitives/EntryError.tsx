'use client';

/**
 * EntryError - Error taxonomy system for entry flow
 *
 * Error categories with distinct UI:
 * - USER_ERROR: Red text, no icon, fix instruction
 * - NETWORK_ERROR: WifiOff icon, amber, retry button
 * - SERVER_ERROR: AlertCircle icon, red, "We're having issues"
 * - TIMEOUT_ERROR: Clock icon, amber, auto-retry countdown
 * - RATE_LIMITED: Clock icon, amber, "Wait X seconds"
 * - EXPIRED: RefreshCw icon, amber, "Request new code"
 */

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorInlineVariants } from '../motion/variants';

// ============================================
// ERROR TYPES
// ============================================

export type ErrorCategory =
  | 'USER_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMITED'
  | 'EXPIRED';

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  retryAfter?: number; // seconds
  canRetry: boolean;
}

// ============================================
// ERROR CLASSIFICATION
// ============================================

const NETWORK_PATTERNS = [
  'network',
  'fetch',
  'connection',
  'offline',
  'failed to fetch',
  'could not connect',
  'net::err',
];

const TIMEOUT_PATTERNS = ['timeout', 'timed out', 'request took too long'];

const RATE_LIMIT_PATTERNS = [
  'rate limit',
  'too many requests',
  'slow down',
  'try again in',
  'wait',
];

const SERVER_PATTERNS = [
  'server error',
  '500',
  '502',
  '503',
  'service unavailable',
  'internal error',
];

const EXPIRED_PATTERNS = ['expired', 'no longer valid', 'code expired', 'link expired'];

/**
 * Classify an error message into a category
 */
export function classifyError(error: string | null | undefined): ClassifiedError | null {
  if (!error) return null;

  const lowerError = error.toLowerCase();

  // Extract retry-after seconds if present (e.g., "try again in 30 seconds")
  const retryMatch = lowerError.match(/(\d+)\s*(second|sec|s)/);
  const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : undefined;

  // Check patterns in order of specificity
  if (RATE_LIMIT_PATTERNS.some((p) => lowerError.includes(p))) {
    return {
      category: 'RATE_LIMITED',
      message: error,
      retryAfter: retryAfter || 30,
      canRetry: false,
    };
  }

  if (TIMEOUT_PATTERNS.some((p) => lowerError.includes(p))) {
    return {
      category: 'TIMEOUT_ERROR',
      message: error,
      canRetry: true,
    };
  }

  if (EXPIRED_PATTERNS.some((p) => lowerError.includes(p))) {
    return {
      category: 'EXPIRED',
      message: error,
      canRetry: false,
    };
  }

  if (NETWORK_PATTERNS.some((p) => lowerError.includes(p))) {
    return {
      category: 'NETWORK_ERROR',
      message: error,
      canRetry: true,
    };
  }

  if (SERVER_PATTERNS.some((p) => lowerError.includes(p))) {
    return {
      category: 'SERVER_ERROR',
      message: error,
      canRetry: true,
    };
  }

  // Default: user error (validation, wrong input, etc.)
  return {
    category: 'USER_ERROR',
    message: error,
    canRetry: false,
  };
}

// ============================================
// ERROR CONFIG
// ============================================

interface ErrorConfig {
  icon: React.ComponentType<{ className?: string }> | null;
  iconColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

const ERROR_CONFIG: Record<ErrorCategory, ErrorConfig> = {
  USER_ERROR: {
    icon: null,
    iconColor: '',
    textColor: 'text-red-400',
    bgColor: 'bg-transparent',
    borderColor: 'border-transparent',
  },
  NETWORK_ERROR: {
    icon: WifiOff,
    iconColor: 'text-amber-400',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
  },
  SERVER_ERROR: {
    icon: AlertCircle,
    iconColor: 'text-red-400',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500/20',
  },
  TIMEOUT_ERROR: {
    icon: Clock,
    iconColor: 'text-amber-400',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
  },
  RATE_LIMITED: {
    icon: Clock,
    iconColor: 'text-amber-400',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
  },
  EXPIRED: {
    icon: RefreshCw,
    iconColor: 'text-amber-400',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
  },
};

// ============================================
// COUNTDOWN COMPONENT
// ============================================

interface CountdownProps {
  seconds: number;
  onComplete: () => void;
  prefix?: string;
}

function Countdown({ seconds, onComplete, prefix = 'Wait ' }: CountdownProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, onComplete]);

  return (
    <span className="tabular-nums">
      {prefix}
      {remaining}s
    </span>
  );
}

// ============================================
// ENTRY ERROR COMPONENT
// ============================================

interface EntryErrorProps {
  error: string | null | undefined;
  onRetry?: () => void;
  onResend?: () => void;
  isRetrying?: boolean;
  autoRetry?: boolean;
  autoRetryDelay?: number; // seconds
  className?: string;
}

export function EntryError({
  error,
  onRetry,
  onResend,
  isRetrying = false,
  autoRetry = false,
  autoRetryDelay = 3,
  className,
}: EntryErrorProps) {
  const [autoRetryCountdown, setAutoRetryCountdown] = useState<number | null>(null);

  const classified = classifyError(error);

  // Start auto-retry countdown for timeout errors
  useEffect(() => {
    if (!classified || !autoRetry || isRetrying) {
      setAutoRetryCountdown(null);
      return;
    }

    if (classified.category === 'TIMEOUT_ERROR' && onRetry) {
      setAutoRetryCountdown(autoRetryDelay);
    }
  }, [classified, autoRetry, autoRetryDelay, onRetry, isRetrying]);

  const handleAutoRetryComplete = useCallback(() => {
    setAutoRetryCountdown(null);
    onRetry?.();
  }, [onRetry]);

  const handleRateLimitComplete = useCallback(() => {
    // Rate limit expired - error should be cleared by parent
  }, []);

  if (!classified) return null;

  const config = ERROR_CONFIG[classified.category];
  const Icon = config.icon;
  const showRetryButton =
    classified.canRetry && onRetry && classified.category !== 'TIMEOUT_ERROR';
  const showResendButton = classified.category === 'EXPIRED' && onResend;
  const isCompact = classified.category === 'USER_ERROR';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={classified.category}
        variants={errorInlineVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          'flex items-start gap-2',
          !isCompact && 'p-3 rounded-lg border',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', config.iconColor)} />}

        <div className="flex-1 min-w-0 space-y-1">
          {/* Error message */}
          <p className={cn('text-body-sm', config.textColor)}>
            {classified.category === 'SERVER_ERROR'
              ? "We're having issues. Please try again."
              : classified.message}
          </p>

          {/* Rate limit countdown */}
          {classified.category === 'RATE_LIMITED' && classified.retryAfter && (
            <p className={cn('text-body-sm', config.textColor)}>
              <Countdown
                seconds={classified.retryAfter}
                onComplete={handleRateLimitComplete}
              />
            </p>
          )}

          {/* Auto-retry countdown */}
          {autoRetryCountdown !== null && (
            <p className="text-body-sm text-white/50">
              Auto-retrying in{' '}
              <Countdown seconds={autoRetryCountdown} onComplete={handleAutoRetryComplete} />
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Retry button */}
            {showRetryButton && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className={cn(
                  'inline-flex items-center gap-1.5 text-body-sm',
                  'text-white/50 hover:text-white transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isRetrying ? 'Retrying...' : 'Try again'}</span>
              </button>
            )}

            {/* Resend button for expired codes */}
            {showResendButton && (
              <button
                type="button"
                onClick={onResend}
                disabled={isRetrying}
                className={cn(
                  'inline-flex items-center gap-1.5 text-body-sm',
                  'text-white/50 hover:text-white transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <RefreshCw className="w-3 h-3" />
                <span>Request new code</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

EntryError.displayName = 'EntryError';

// Export error classification for external use
export { classifyError as classifyEntryError };
