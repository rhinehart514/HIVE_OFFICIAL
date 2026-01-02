'use client';

/**
 * SpaceWelcomeBanner - Inline welcome for first-time visitors
 *
 * Replaces full-screen welcome modal with a dismissible banner
 * at the top of the chat area. Less intrusive, faster to dismiss.
 *
 * Features:
 * - Shows space name + description
 * - "Say hello" CTA focuses the composer
 * - X dismisses (localStorage persistence)
 * - Gold left border accent
 * - Reduced motion support
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, MessageCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

// Premium spring
const SPRING_BUTTER = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 28,
  mass: 1,
};

export interface SpaceWelcomeBannerProps {
  /** Space ID for localStorage key */
  spaceId: string;
  /** Space name */
  spaceName: string;
  /** Space description (optional) */
  description?: string;
  /** Whether the user has already seen this banner */
  hasSeenBefore?: boolean;
  /** Callback when "Say hello" is clicked */
  onSayHello?: () => void;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get localStorage key for welcome banner dismissal
 */
function getStorageKey(spaceId: string): string {
  return `hive_welcomed_${spaceId}`;
}

/**
 * Check if user has dismissed the welcome banner for this space
 */
export function hasSeenWelcome(spaceId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(getStorageKey(spaceId)) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark welcome banner as seen for this space
 */
export function markWelcomeSeen(spaceId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(spaceId), 'true');
  } catch {
    // Ignore localStorage errors
  }
}

export function SpaceWelcomeBanner({
  spaceId,
  spaceName,
  description,
  hasSeenBefore,
  onSayHello,
  onDismiss,
  className,
}: SpaceWelcomeBannerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Check localStorage on mount
  React.useEffect(() => {
    const seen = hasSeenBefore ?? hasSeenWelcome(spaceId);
    if (!seen) {
      // Small delay for smoother appearance
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [spaceId, hasSeenBefore]);

  const handleDismiss = React.useCallback(() => {
    setIsDismissed(true);
    markWelcomeSeen(spaceId);
    onDismiss?.();
  }, [spaceId, onDismiss]);

  const handleSayHello = React.useCallback(() => {
    handleDismiss();
    onSayHello?.();
  }, [handleDismiss, onSayHello]);

  // Don't render if dismissed or already seen
  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, height: 0 }}
        transition={SPRING_BUTTER}
        className={cn(
          'relative mx-4 my-3',
          'bg-white/[0.02] border border-white/[0.08] rounded-xl',
          'overflow-hidden',
          className
        )}
      >
        {/* Gold left accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FFD700] to-[#FFD700]/50" />

        <div className="px-5 py-4 pl-6">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className={cn(
              'absolute top-3 right-3',
              'w-7 h-7 flex items-center justify-center',
              'rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04]',
              'transition-colors duration-150'
            )}
            aria-label="Dismiss welcome message"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon + Content */}
          <div className="flex items-start gap-3 pr-8">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#FFD700]" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-medium text-white">
                Welcome to {spaceName}!
              </h3>
              {description && (
                <p className="text-[13px] text-white/50 mt-1 line-clamp-2">
                  {description}
                </p>
              )}

              {/* Say hello CTA */}
              {onSayHello && (
                <motion.button
                  whileHover={shouldReduceMotion ? {} : { x: 2 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  onClick={handleSayHello}
                  className={cn(
                    'mt-3 inline-flex items-center gap-1.5',
                    'text-[13px] font-medium text-[#FFD700] hover:text-[#FFE44D]',
                    'transition-colors duration-150'
                  )}
                >
                  Say hello
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SpaceWelcomeBanner;
