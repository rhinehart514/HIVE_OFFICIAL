'use client';

/**
 * JoinCeremony - Join button with ceremony trigger
 *
 * The gold CTA that initiates the crossing ceremony.
 * Only gold element on the threshold page.
 *
 * States:
 * - Default: Gold button
 * - Loading: Gold spinner
 * - Error: Error message with retry
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  motion,
  MOTION,
  Button,
} from '@hive/ui/design-system/primitives';
import { SPACES_GOLD } from '@hive/ui/tokens';

// ============================================================
// Types
// ============================================================

interface JoinCeremonyProps {
  /** Join action */
  onJoin: () => void;
  /** Whether joining is in progress */
  isJoining?: boolean;
  /** Error message from failed join */
  error?: string | null;
  /** Clear error callback */
  onClearError?: () => void;
  /** Delay before button appears */
  delay?: number;
}

// ============================================================
// Gold Spinner
// ============================================================

function GoldSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <Loader2 className="w-5 h-5" style={{ color: SPACES_GOLD.dark }} />
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function JoinCeremony({
  onJoin,
  isJoining = false,
  error = null,
  onClearError,
  delay = 0,
}: JoinCeremonyProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleJoin = () => {
    if (onClearError) {
      onClearError();
    }
    onJoin();
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.base,
        delay: shouldReduceMotion ? 0 : delay,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: MOTION.ease.premium }}
            className="w-full max-w-[320px] rounded-lg px-4 py-3"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300 leading-snug">
                {error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gold Join Button */}
      <motion.div
        whileHover={!isJoining ? { scale: 1.02 } : undefined}
        whileTap={!isJoining ? { scale: 0.98 } : undefined}
      >
        <Button
          size="lg"
          onClick={handleJoin}
          disabled={isJoining}
          className="w-[280px] h-12 font-medium transition-all duration-200"
          style={{
            background: isJoining
              ? SPACES_GOLD.glowSubtle
              : `linear-gradient(180deg, ${SPACES_GOLD.light} 0%, ${SPACES_GOLD.primary} 100%)`,
            color: SPACES_GOLD.dark,
            boxShadow: isJoining
              ? 'none'
              : `0 0 20px ${SPACES_GOLD.glowSubtle}, inset 0 1px 0 rgba(255,255,255,0.3)`,
          }}
        >
          {isJoining ? (
            <GoldSpinner />
          ) : (
            <>
              <span>{error ? 'Try Again' : 'Join Space'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </motion.div>

      {/* Reassurance text */}
      <motion.p
        className="text-xs text-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : delay + 0.2,
        }}
      >
        You can leave anytime. Your choice.
      </motion.p>
    </motion.div>
  );
}

JoinCeremony.displayName = 'JoinCeremony';
