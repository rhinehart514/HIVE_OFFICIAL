'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onDismiss}
                  className="absolute top-4 right-4 p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
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
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-2 space-y-3">
                <Button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={onSaveLocally}
                  disabled={isRetrying}
                  className="w-full border-neutral-700 text-neutral-300 hover:bg-white/5"
                >
                  <Save className="w-4 h-4 mr-2" />
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
