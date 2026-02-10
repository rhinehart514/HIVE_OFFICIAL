'use client';

/**
 * CrossingCeremony - Orchestrates the full join sequence
 *
 * Timeline:
 * 0.0s   API call starts (caller handles this)
 * 0.0s   Button shows gold spinner (caller handles)
 * 0.3s   API completes (caller triggers ceremony)
 * 0.3s   Glass barrier dissolves (blur 8px → 0)
 * 0.5s   GoldFlash pulses (0.2s, intensity 0.6)
 * 0.7s   Welcome card enters (border draws, content reveals)
 * 1.2s   Welcome card fades up and exits
 * 1.4s   Headerdraws in (handled by residence)
 * 1.8s   Feed items stagger in (handled by residence)
 * 2.5s   Ceremony complete → residence state
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import { SPACES_MOTION } from '@hive/ui/tokens';
import { GoldFlash } from '@/components/entry/primitives/GoldFlash';
import { WelcomeCard } from './welcome-card';

// ============================================================
// Types
// ============================================================

type CeremonyPhase =
  | 'idle'
  | 'glass-dissolve'
  | 'gold-flash'
  | 'welcome-card'
  | 'transition'
  | 'complete';

interface CrossingCeremonyProps {
  /** Whether the ceremony should play */
  isActive: boolean;
  /** Space information for welcome card */
  space: {
    name: string;
    avatarUrl?: string;
  };
  /** Callback when ceremony completes */
  onComplete: () => void;
  /** Callback when glass should dissolve */
  onGlassDissolve?: () => void;
  /** Callback when header should animate */
  onHeaderAnimate?: () => void;
}

interface CrossingCeremonyState {
  phase: CeremonyPhase;
  showGoldFlash: boolean;
  showWelcomeCard: boolean;
}

// ============================================================
// Component
// ============================================================

export function CrossingCeremony({
  isActive,
  space,
  onComplete,
  onGlassDissolve,
  onHeaderAnimate,
}: CrossingCeremonyProps) {
  const shouldReduceMotion = useReducedMotion();

  const [state, setState] = React.useState<CrossingCeremonyState>({
    phase: 'idle',
    showGoldFlash: false,
    showWelcomeCard: false,
  });

  // Run ceremony sequence
  React.useEffect(() => {
    if (!isActive) {
      setState({
        phase: 'idle',
        showGoldFlash: false,
        showWelcomeCard: false,
      });
      return;
    }

    // Skip animation for reduced motion
    if (shouldReduceMotion) {
      onComplete();
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Glass dissolve (immediate)
    setState((s) => ({ ...s, phase: 'glass-dissolve' }));
    onGlassDissolve?.();

    // Phase 2: Gold flash (after glass dissolve)
    timers.push(
      setTimeout(() => {
        setState((s) => ({
          ...s,
          phase: 'gold-flash',
          showGoldFlash: true,
        }));
      }, SPACES_MOTION.crossing.glassDissolve * 1000)
    );

    // Phase 3: Welcome card (after gold flash)
    timers.push(
      setTimeout(() => {
        setState((s) => ({
          ...s,
          phase: 'welcome-card',
          showGoldFlash: false,
          showWelcomeCard: true,
        }));
      }, (SPACES_MOTION.crossing.glassDissolve + SPACES_MOTION.crossing.goldFlash) * 1000)
    );

    // Phase 4: Header animate (during welcome card)
    const headerDelay =
      SPACES_MOTION.crossing.glassDissolve +
      SPACES_MOTION.crossing.goldFlash +
      SPACES_MOTION.crossing.welcomeCard.enter +
      SPACES_MOTION.crossing.welcomeCard.hold;

    timers.push(
      setTimeout(() => {
        setState((s) => ({ ...s, phase: 'transition' }));
        onHeaderAnimate?.();
      }, headerDelay * 1000)
    );

    // Phase 5: Complete
    timers.push(
      setTimeout(() => {
        setState({
          phase: 'complete',
          showGoldFlash: false,
          showWelcomeCard: false,
        });
        onComplete();
      }, SPACES_MOTION.crossing.total * 1000)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isActive, shouldReduceMotion, onComplete, onGlassDissolve, onHeaderAnimate]);

  return (
    <>
      {/* Gold Flash */}
      <GoldFlash
        show={state.showGoldFlash}
        duration={SPACES_MOTION.crossing.goldFlash}
        intensity={0.6}
      />

      {/* Welcome Card */}
      <WelcomeCard
        show={state.showWelcomeCard}
        space={space}
      />
    </>
  );
}

// ============================================================
// Hook for managing ceremony state
// ============================================================

interface UseCrossingCeremonyOptions {
  onComplete?: () => void;
}

export function useCrossingCeremony(options: UseCrossingCeremonyOptions = {}) {
  const [isActive, setIsActive] = React.useState(false);
  const [isGlassDissolving, setIsGlassDissolving] = React.useState(false);
  const [isHeaderAnimating, setIsHeaderAnimating] = React.useState(false);

  const startCeremony = React.useCallback(() => {
    setIsActive(true);
  }, []);

  const handleGlassDissolve = React.useCallback(() => {
    setIsGlassDissolving(true);
  }, []);

  const handleHeaderAnimate = React.useCallback(() => {
    setIsHeaderAnimating(true);
  }, []);

  const handleComplete = React.useCallback(() => {
    setIsActive(false);
    options.onComplete?.();
  }, [options]);

  return {
    isActive,
    isGlassDissolving,
    isHeaderAnimating,
    startCeremony,
    handleGlassDissolve,
    handleHeaderAnimate,
    handleComplete,
  };
}

CrossingCeremony.displayName = 'CrossingCeremony';
