'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Save, X, WifiOff, UserX, Clock } from 'lucide-react';
import { Button } from '@hive/ui';

/**
 * Error types for better UX messaging
 */
type ErrorType = 'network' | 'handle_taken' | 'validation' | 'timeout' | 'server' | 'unknown';

interface ParsedError {
  type: ErrorType;
  title: string;
  description: string;
  icon: typeof AlertTriangle;
  canRetry: boolean;
  showSaveOption: boolean;
}

/**
 * Parse error message to determine type and appropriate UI
 */
function parseError(error: string): ParsedError {
  const lowerError = error.toLowerCase();

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('offline')) {
    return {
      type: 'network',
      title: 'Connection issue',
      description: "We couldn't reach our servers. Check your internet connection.",
      icon: WifiOff,
      canRetry: true,
      showSaveOption: true,
    };
  }

  // Handle taken
  if (lowerError.includes('handle') && (lowerError.includes('taken') || lowerError.includes('already'))) {
    return {
      type: 'handle_taken',
      title: 'Handle unavailable',
      description: 'That handle is already taken. Please choose a different one.',
      icon: UserX,
      canRetry: false,
      showSaveOption: false,
    };
  }

  // Validation errors
  if (lowerError.includes('valid') || lowerError.includes('required') || lowerError.includes('invalid')) {
    return {
      type: 'validation',
      title: 'Missing information',
      description: error,
      icon: AlertTriangle,
      canRetry: false,
      showSaveOption: false,
    };
  }

  // Timeout
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return {
      type: 'timeout',
      title: 'Request timed out',
      description: 'The server is taking too long to respond. Please try again.',
      icon: Clock,
      canRetry: true,
      showSaveOption: true,
    };
  }

  // Server errors
  if (lowerError.includes('server') || lowerError.includes('500') || lowerError.includes('503')) {
    return {
      type: 'server',
      title: 'Server error',
      description: "Something went wrong on our end. We're working on it.",
      icon: AlertTriangle,
      canRetry: true,
      showSaveOption: true,
    };
  }

  // Default unknown error
  return {
    type: 'unknown',
    title: 'Something went wrong',
    description: error || "We couldn't save your profile. Please try again.",
    icon: AlertTriangle,
    canRetry: true,
    showSaveOption: true,
  };
}

interface ErrorRecoveryModalProps {
  isOpen: boolean;
  error: string;
  isRetrying: boolean;
  onRetry: () => void;
  onSaveLocally: () => void;
  onDismiss: () => void;
}

export function ErrorRecoveryModal({
  isOpen,
  error,
  isRetrying,
  onRetry,
  onSaveLocally,
  onDismiss,
}: ErrorRecoveryModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  // Parse the error for better UI
  const parsedError = useMemo(() => parseError(error), [error]);
  const ErrorIcon = parsedError.icon;

  // Focus management - focus retry button when modal opens (if can retry)
  useEffect(() => {
    if (isOpen) {
      if (parsedError.canRetry && retryButtonRef.current) {
        retryButtonRef.current.focus();
      } else if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }
  }, [isOpen, parsedError.canRetry]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onDismiss}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="error-modal-title"
            aria-describedby="error-modal-description"
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
            transition={shouldReduceMotion ? {} : { type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  ref={closeButtonRef}
                  onClick={onDismiss}
                  className="absolute top-4 right-4 p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  aria-label="Close error dialog"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    parsedError.type === 'handle_taken' ? 'bg-amber-500/20' :
                    parsedError.type === 'network' ? 'bg-blue-500/20' :
                    'bg-red-500/20'
                  }`} aria-hidden="true">
                    <ErrorIcon className={`w-6 h-6 ${
                      parsedError.type === 'handle_taken' ? 'text-amber-400' :
                      parsedError.type === 'network' ? 'text-blue-400' :
                      'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <h2 id="error-modal-title" className="text-lg font-semibold text-white">
                      {parsedError.title}
                    </h2>
                    <p className="text-sm text-neutral-400 mt-0.5">
                      {parsedError.type === 'handle_taken' ? 'Please try a different handle' :
                       parsedError.type === 'network' ? 'Check your connection' :
                       "We couldn't save your profile"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="px-6 pb-4">
                <div className={`rounded-lg p-3 ${
                  parsedError.type === 'handle_taken' ? 'bg-amber-500/10 border border-amber-500/20' :
                  parsedError.type === 'network' ? 'bg-blue-500/10 border border-blue-500/20' :
                  'bg-red-500/10 border border-red-500/20'
                }`} role="alert">
                  <p id="error-modal-description" className={`text-sm ${
                    parsedError.type === 'handle_taken' ? 'text-amber-300' :
                    parsedError.type === 'network' ? 'text-blue-300' :
                    'text-red-300'
                  }`}>{parsedError.description}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-2 space-y-3">
                {parsedError.canRetry && (
                  <Button
                    ref={retryButtonRef}
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                    aria-describedby={isRetrying ? "retry-status" : undefined}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        <span id="retry-status">Retrying...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                        Try Again
                      </>
                    )}
                  </Button>
                )}

                {parsedError.showSaveOption && (
                  <Button
                    variant="outline"
                    onClick={onSaveLocally}
                    disabled={isRetrying}
                    className="w-full border-neutral-700 text-neutral-300 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                  >
                    <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                    Save Locally & Continue Later
                  </Button>
                )}

                {/* For handle_taken errors, show dismiss as primary action */}
                {parsedError.type === 'handle_taken' && (
                  <Button
                    onClick={onDismiss}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                  >
                    Choose a Different Handle
                  </Button>
                )}

                {parsedError.showSaveOption && (
                  <p className="text-xs text-neutral-500 text-center pt-2">
                    Your progress is automatically saved. You can close this and come back anytime.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
