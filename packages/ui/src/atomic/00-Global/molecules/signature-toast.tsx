'use client';

/**
 * SignatureToast - HIVE's confident toast messages
 *
 * Signature moments with attitude:
 * - "You're in." (RSVP confirmed)
 * - "Done." (action completed)
 * - "Nice." (first post)
 * - "That didn't work." (error)
 */

import { motion } from 'framer-motion';
import * as React from 'react';

import { cn } from '../../../lib/utils';

export type SignatureToastType =
  | 'youreIn'      // RSVP confirmed
  | 'done'         // Generic success
  | 'nice'         // Achievement/first action
  | 'welcome'      // Joined space
  | 'error'        // Something failed
  | 'custom';

export interface SignatureToastProps {
  type: SignatureToastType;
  message?: string;
  /** Optional detail text */
  detail?: string;
  /** Show confetti burst */
  confetti?: boolean;
  className?: string;
}

const toastContent: Record<Exclude<SignatureToastType, 'custom'>, { message: string; icon?: string }> = {
  youreIn: { message: "You're in.", icon: '✓' },
  done: { message: 'Done.' },
  nice: { message: 'Nice.', icon: '★' },
  welcome: { message: 'Welcome.' },
  error: { message: "That didn't work." },
};

export function SignatureToast({
  type,
  message,
  detail,
  confetti = false,
  className,
}: SignatureToastProps) {
  const content = type === 'custom'
    ? { message: message || '' }
    : toastContent[type];

  const isSuccess = type === 'youreIn' || type === 'done' || type === 'nice' || type === 'welcome';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
      className={cn(
        'relative flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg',
        isSuccess
          ? 'border-border-default bg-background-secondary'
          : 'border-status-error/30 bg-status-error/10',
        className
      )}
    >
      {/* Icon with gold accent for success */}
      {content.icon && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
          className={cn(
            'text-lg',
            isSuccess ? 'text-brand-primary' : 'text-status-error'
          )}
        >
          {content.icon}
        </motion.span>
      )}

      <div className="flex flex-col">
        <span className="text-sm font-medium text-text-primary">
          {message || content.message}
        </span>
        {detail && (
          <span className="text-xs text-text-secondary">{detail}</span>
        )}
      </div>

      {/* Confetti burst for celebrations */}
      {confetti && isSuccess && <ConfettiBurst />}
    </motion.div>
  );
}

/**
 * Simple confetti burst animation
 */
function ConfettiBurst() {
  const particles = Array.from({ length: 4 }, (_, i) => i);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      {particles.map((i) => (
        <motion.div
          key={i}
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
          }}
          animate={{
            x: `${50 + (Math.random() - 0.5) * 100}%`,
            y: `${50 + (Math.random() - 0.5) * 100}%`,
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
            delay: i * 0.02,
          }}
          className="absolute h-1.5 w-1.5 rounded-full bg-brand-primary"
        />
      ))}
    </div>
  );
}

/**
 * Hook to show signature toasts
 * Usage: const { showToast } = useSignatureToast();
 *        showToast('youreIn', { detail: 'CS Study Group event' });
 */
export function useSignatureToast() {
  const [toast, setToast] = React.useState<SignatureToastProps | null>(null);

  const showToast = React.useCallback((
    type: SignatureToastType,
    options?: Partial<Omit<SignatureToastProps, 'type'>>
  ) => {
    setToast({ type, ...options });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const hideToast = React.useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
