'use client';

/**
 * ProfileCompletionNudge Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Floating prompt encouraging profile completion
 * Fixed position, dismissible with 7-day cooldown
 *
 * Recipe:
 *   container: Floating card, bottom-right
 *   content: Progress bar + next action
 *   dismiss: X button with cooldown
 *   animation: Subtle slide-in from right
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass surface
const glassNudgeSurface = {
  background: 'linear-gradient(135deg, rgba(30,30,28,0.95) 0%, rgba(20,20,18,0.98) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 80px rgba(255,215,0,0.05)',
};

// LOCKED: Spring animation
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// Container variants
const nudgeContainerVariants = cva(
  [
    'fixed z-50',
    'max-w-xs w-full',
    'rounded-xl',
    'p-4',
    'shadow-2xl',
  ].join(' '),
  {
    variants: {
      position: {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-24 right-6',
        'top-left': 'top-24 left-6',
      },
    },
    defaultVariants: {
      position: 'bottom-right',
    },
  }
);

// Progress bar variants
const progressBarVariants = cva(
  [
    'h-1.5',
    'rounded-full',
    'transition-all duration-300',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-white/20',
        gold: 'bg-[#D4AF37]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Types
export interface ProfileCompletionItem {
  /** Item key */
  key: string;
  /** Display label */
  label: string;
  /** Whether this item is complete */
  complete: boolean;
  /** Action to take (e.g., route to push) */
  action?: string;
}

export interface ProfileCompletionNudgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Completion percentage (0-100) */
  completion: number;
  /** Next incomplete item */
  nextItem?: ProfileCompletionItem;
  /** All completion items */
  items?: ProfileCompletionItem[];
  /** Show/hide the nudge */
  show?: boolean;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Action click handler */
  onAction?: (item: ProfileCompletionItem) => void;
  /** Dismiss cooldown in days */
  cooldownDays?: number;
}

// Storage key for dismiss cooldown
const DISMISS_KEY = 'hive-profile-nudge-dismissed';

// Check if nudge should be shown based on cooldown
function shouldShowNudge(cooldownDays: number): boolean {
  if (typeof window === 'undefined') return false;

  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return true;

  const dismissedDate = new Date(dismissedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays >= cooldownDays;
}

// Store dismiss timestamp
function recordDismiss(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  }
}

// Checkmark icon
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

// Close icon
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
  </svg>
);

// Arrow icon
const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z" />
  </svg>
);

// Main component
const ProfileCompletionNudge = React.forwardRef<HTMLDivElement, ProfileCompletionNudgeProps>(
  (
    {
      className,
      completion,
      nextItem,
      items = [],
      show: showProp,
      position = 'bottom-right',
      onDismiss,
      onAction,
      cooldownDays = 7,
      style,
      ...props
    },
    ref
  ) => {
    const [internalShow, setInternalShow] = React.useState(false);

    // Check cooldown on mount
    React.useEffect(() => {
      const shouldShow = shouldShowNudge(cooldownDays);
      setInternalShow(shouldShow);
    }, [cooldownDays]);

    // Use prop if provided, otherwise internal state
    const isVisible = showProp !== undefined ? showProp : internalShow;

    // Don't show if profile is complete
    if (completion >= 100) return null;

    const handleDismiss = () => {
      recordDismiss();
      setInternalShow(false);
      onDismiss?.();
    };

    const handleAction = () => {
      if (nextItem) {
        onAction?.(nextItem);
      }
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            className={cn(nudgeContainerVariants({ position }), className)}
            style={{ ...glassNudgeSurface, ...style }}
            initial={{ opacity: 0, x: position.includes('right') ? 40 : -40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: position.includes('right') ? 40 : -40, y: 20 }}
            transition={springConfig}
            {...(props as any)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="text-body-sm font-semibold text-white mb-0.5">
                  Complete your profile
                </p>
                <p className="text-label-sm text-white/50">
                  {completion}% complete
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Dismiss"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="relative h-1.5 rounded-full bg-white/10 mb-4 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-[#D4AF37]"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Completion items (compact list) */}
            {items.length > 0 && (
              <div className="space-y-1.5 mb-4">
                {items.slice(0, 4).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center shrink-0',
                        item.complete
                          ? 'bg-[#D4AF37]/30 border border-[#D4AF37]/50'
                          : 'bg-white/10 border border-white/20'
                      )}
                    >
                      {item.complete && (
                        <CheckIcon className="w-2.5 h-2.5 text-[#D4AF37]" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-label',
                        item.complete ? 'text-white/50 line-through' : 'text-white/70'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Next action */}
            {nextItem && (
              <button
                onClick={handleAction}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-left transition-colors hover:bg-[#D4AF37]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <span className="text-body-sm font-medium text-[#D4AF37]">
                  Add {nextItem.label.toLowerCase()}
                </span>
                <ArrowIcon className="w-4 h-4 text-[#D4AF37]" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ProfileCompletionNudge.displayName = 'ProfileCompletionNudge';

// Hook for managing nudge state
export function useProfileCompletionNudge(cooldownDays = 7) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setShow(shouldShowNudge(cooldownDays));
  }, [cooldownDays]);

  const dismiss = React.useCallback(() => {
    recordDismiss();
    setShow(false);
  }, []);

  const reset = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DISMISS_KEY);
      setShow(true);
    }
  }, []);

  return { show, dismiss, reset };
}

export {
  ProfileCompletionNudge,
  // Export variants
  nudgeContainerVariants,
  progressBarVariants,
  // Export utilities
  shouldShowNudge,
  recordDismiss,
  // Export style helpers
  glassNudgeSurface,
};
