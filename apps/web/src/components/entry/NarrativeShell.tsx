'use client';

/**
 * NarrativeShell - Full-Screen Shell for Narrative Entry
 *
 * Premium void aesthetic with act-level ambient glow:
 * - Act I (Invitation): Neutral - no gold until code verified
 * - Act II (Claiming): Subtle gold anticipation
 * - Act III (Crossing): Full celebration glow
 *
 * Also handles the act transition overlay with gold line draw.
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Logo, NoiseOverlay } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  EASE_PREMIUM,
  DURATION,
  GOLD,
  lineDrawVariants,
} from './motion/entry-motion';
import {
  ACT_TRANSITION,
  goldLineVariants,
  getGoldLineStyle,
} from './motion/act-transitions';
import type { ActId, EmotionalState } from './hooks/useNarrativeEntry';

// Content max-width
const NARRATIVE_MAX_WIDTH = 'max-w-[460px]';

export interface NarrativeShellProps {
  children: React.ReactNode;
  /** Current act for ambient glow */
  act: ActId;
  /** Emotional state for glow intensity */
  emotionalState: EmotionalState;
  /** Whether an act transition is in progress */
  isTransitioning?: boolean;
  /** Show loading overlay */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

export function NarrativeShell({
  children,
  act,
  emotionalState,
  isTransitioning = false,
  isLoading = false,
  className,
}: NarrativeShellProps) {
  const shouldReduceMotion = useReducedMotion();

  // Glow configuration based on act and emotional state
  const glowConfig = React.useMemo(() => {
    // During transition, neutral glow
    if (isTransitioning) {
      return {
        opacity: 0.3,
        gradient: `radial-gradient(ellipse 80% 50% at 50% 20%, ${GOLD.glowSubtle}, transparent 70%)`,
      };
    }

    // Celebration state overrides act
    if (emotionalState === 'celebration') {
      return {
        opacity: 1,
        gradient: `radial-gradient(ellipse 100% 60% at 50% 20%, ${GOLD.glow}, transparent 70%)`,
      };
    }

    // Act-based glow
    switch (act) {
      case 'invitation':
        // Neutral until code verified
        if (emotionalState === 'anticipation') {
          return {
            opacity: 0.4,
            gradient: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,215,0,0.06), transparent 60%)`,
          };
        }
        return { opacity: 0, gradient: 'transparent' };

      case 'claiming':
        // Subtle gold anticipation
        if (emotionalState === 'anticipation') {
          return {
            opacity: 0.6,
            gradient: `radial-gradient(ellipse 70% 45% at 50% 25%, rgba(255,215,0,0.08), transparent 65%)`,
          };
        }
        return {
          opacity: 0.3,
          gradient: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,215,0,0.04), transparent 60%)`,
        };

      case 'crossing':
        // Full celebration glow
        return {
          opacity: 0.8,
          gradient: `radial-gradient(ellipse 80% 50% at 50% 20%, ${GOLD.glowSubtle}, transparent 70%)`,
        };

      default:
        return { opacity: 0, gradient: 'transparent' };
    }
  }, [act, emotionalState, isTransitioning]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[var(--color-bg-void)] text-white relative overflow-hidden">
      <NoiseOverlay />

      {/* Top line (about-page style) */}
      <motion.div
        className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={lineDrawVariants}
        initial="initial"
        animate="animate"
      />

      {/* Ambient glow - responds to act and emotional state */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: glowConfig.opacity }}
        transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
        style={{ background: glowConfig.gradient }}
      />

      {/* Act transition overlay */}
      <ActTransitionOverlay show={isTransitioning} />

      {/* Loading overlay */}
      <LoadingOverlay show={isLoading} />

      {/* Header */}
      <motion.header
        className="relative z-10 px-6 py-6 flex items-center justify-between"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
      >
        <Link href="/" className="transition-opacity hover:opacity-70">
          <Logo variant="mark" size="sm" color="gold" />
        </Link>
        <Link
          href="/"
          className="text-body-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Back
        </Link>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: DURATION.dramatic, ease: EASE_PREMIUM }
          }
          className={cn(
            'w-full mx-auto',
            NARRATIVE_MAX_WIDTH,
            className
          )}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="relative z-10 px-6 py-6 flex items-center justify-center gap-4 text-label text-white/30"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.gentle, delay: 0.5, ease: EASE_PREMIUM }}
      >
        <Link href="/legal/terms" className="hover:text-white/50 transition-colors">
          Terms
        </Link>
        <span className="text-white/20">·</span>
        <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">
          Privacy
        </Link>
      </motion.footer>
    </div>
  );
}

// ============================================
// ACT TRANSITION OVERLAY
// ============================================

interface ActTransitionOverlayProps {
  show: boolean;
}

function ActTransitionOverlay({ show }: ActTransitionOverlayProps) {
  const [phase, setPhase] = React.useState<'idle' | 'draw' | 'complete'>('idle');

  React.useEffect(() => {
    if (!show) {
      setPhase('idle');
      return;
    }

    // Start draw immediately
    setPhase('draw');

    // Complete after line draw
    const completeTimer = setTimeout(() => {
      setPhase('complete');
    }, ACT_TRANSITION.fadeOut * 1000 + ACT_TRANSITION.lineDraw * 1000);

    return () => clearTimeout(completeTimer);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[var(--color-bg-void)]" />

          {/* Gold line */}
          <motion.div
            className="relative z-10 w-full max-w-[300px] h-px mx-6"
            variants={goldLineVariants}
            initial="initial"
            animate={phase === 'draw' ? 'draw' : phase === 'complete' ? 'complete' : 'initial'}
            style={{
              ...getGoldLineStyle(),
              transformOrigin: 'center',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// LOADING OVERLAY
// ============================================

interface LoadingOverlayProps {
  show: boolean;
}

function LoadingOverlay({ show }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[var(--color-bg-void)]/80 backdrop-blur-sm" />

          {/* Spinner */}
          <motion.div
            className="relative z-10"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div
              className="w-10 h-10 rounded-full border-2 border-white/10 animate-spin"
              style={{ borderTopColor: GOLD.primary }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

NarrativeShell.displayName = 'NarrativeShell';
