'use client';

/**
 * ErrorWithRetry - Error display with optional retry button
 *
 * Distinguishes between network errors and validation errors.
 * Shows retry button for recoverable errors.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorInlineVariants } from '../motion/variants';

interface ErrorWithRetryProps {
  error: string | null | undefined;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

/**
 * Check if error message indicates a network error.
 */
function isNetworkError(error: string): boolean {
  const networkPatterns = [
    'network',
    'fetch',
    'connection',
    'offline',
    'timeout',
    'failed to fetch',
    'service unavailable',
    'could not connect',
  ];
  const lowerError = error.toLowerCase();
  return networkPatterns.some((pattern) => lowerError.includes(pattern));
}

export function ErrorWithRetry({
  error,
  onRetry,
  isRetrying = false,
  className,
}: ErrorWithRetryProps) {
  if (!error) return null;

  const isNetwork = isNetworkError(error);
  const showRetry = isNetwork && onRetry;

  return (
    <motion.div
      variants={errorInlineVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('flex items-center gap-2 flex-wrap', className)}
    >
      {isNetwork && (
        <WifiOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      )}
      <span className="text-body-sm text-red-400">{error}</span>
      {showRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-body-sm',
            'text-white/50 hover:text-white transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw
            className="w-3 h-3"
          />
          <span>{isRetrying ? 'Retrying...' : 'Try again'}</span>
        </button>
      )}
    </motion.div>
  );
}

ErrorWithRetry.displayName = 'ErrorWithRetry';
