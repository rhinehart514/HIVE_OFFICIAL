'use client';

/**
 * HubShell - Full-screen container for Spaces Hub
 *
 * Features:
 * - Full viewport, void background (#050504)
 * - NoiseOverlay texture (opacity 0.015)
 * - Ambient glow responds to state:
 *   - Empty: No glow
 *   - Onboarding: Gold radial from top-center
 *   - Active: Warm white radial
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  NoiseOverlay,
  MOTION,
} from '@hive/ui/design-system/primitives';
import {
  SPACES_MOTION,
  getAmbientGlow,
} from '@hive/ui/tokens';
import type { HQState } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface HubShellProps {
  children: React.ReactNode;
  /** Current hub state */
  state: HQState;
  /** Identity progress (0-3) for glow intensity */
  identityProgress: number;
  /** Optional className for extensions */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function HubShell({
  children,
  state,
  identityProgress,
  className,
}: HubShellProps) {
  const shouldReduceMotion = useReducedMotion();
  const [hasEntered, setHasEntered] = React.useState(false);

  // Mark entrance complete after animation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, SPACES_MOTION.page.shellFade * 1000);

    return () => clearTimeout(timer);
  }, []);

  // Get ambient glow based on state
  const ambientGlow = getAmbientGlow(state, identityProgress);

  return (
    <div
      className={`
        relative min-h-screen w-full overflow-hidden
        ${className || ''}
      `}
      style={{
        backgroundColor: '#050504',
      }}
    >
      {/* Ambient glow layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          background: ambientGlow,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : SPACES_MOTION.page.glowPulse,
          ease: MOTION.ease.premium,
        }}
      />

      {/* Noise texture overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.015 }}
        transition={{
          duration: shouldReduceMotion ? 0 : SPACES_MOTION.page.shellFade,
          delay: shouldReduceMotion ? 0 : SPACES_MOTION.page.noiseDelay,
          ease: MOTION.ease.premium,
        }}
      >
        <NoiseOverlay opacity={1} />
      </motion.div>

      {/* Main content with entrance animation */}
      <motion.div
        className="relative z-20 flex flex-col min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : SPACES_MOTION.page.shellFade,
          ease: MOTION.ease.premium,
        }}
      >
        {children}
      </motion.div>

      {/* Initial entrance glow pulse (one-time) */}
      {!hasEntered && state !== 'empty' && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-5"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: SPACES_MOTION.page.glowPulse,
            ease: 'easeOut',
          }}
          style={{
            background: state === 'onboarding'
              ? 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255, 215, 0, 0.15), transparent)'
              : 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255, 255, 255, 0.08), transparent)',
          }}
        />
      )}
    </div>
  );
}

HubShell.displayName = 'HubShell';
