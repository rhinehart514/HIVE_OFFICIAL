'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Save, X } from 'lucide-react';
import { Button } from '@hive/ui';

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

  // Focus management - focus retry button when modal opens
  useEffect(() => {
    if (isOpen && retryButtonRef.current) {
      retryButtonRef.current.focus();
    }
  }, [isOpen]);

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
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center" aria-hidden="true">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 id="error-modal-title" className="text-lg font-semibold text-white">
                      Something went wrong
                    </h2>
                    <p className="text-sm text-neutral-400 mt-0.5">
                      We couldn't save your profile
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="px-6 pb-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3" role="alert">
                  <p id="error-modal-description" className="text-sm text-red-300">{error}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-2 space-y-3">
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

                <Button
                  variant="outline"
                  onClick={onSaveLocally}
                  disabled={isRetrying}
                  className="w-full border-neutral-700 text-neutral-300 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                >
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  Save Locally & Continue Later
                </Button>

                <p className="text-xs text-neutral-500 text-center pt-2">
                  Your progress is automatically saved. You can close this and come back anytime.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
