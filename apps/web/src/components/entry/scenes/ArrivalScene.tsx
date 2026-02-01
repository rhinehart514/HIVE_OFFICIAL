'use client';

/**
 * ArrivalScene - The Crossing
 *
 * Act III, Scene 2: Final Arrival
 * The culmination of the narrative - identity card, manifesto, gold CTA.
 *
 * For new users: Full ceremony with identity card and manifesto
 * For returning users: Simple "Welcome back" with direct entry
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@hive/ui/design-system/primitives';
import { ManifestoLine } from '../primitives/ManifestoLine';
import { IdentityCard } from '../primitives/IdentityCard';
import { GoldFlash } from '../primitives/GoldFlash';
import {
  sceneMorphVariants,
  sceneChildVariants,
  headlineVariants,
} from '../motion/scene-transitions';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';

interface ArrivalSceneProps {
  firstName: string;
  lastName?: string;
  handle: string;
  major?: string;
  graduationYear?: number | null;
  interests?: string[];
  isNewUser: boolean;
  isReturningUser: boolean;
  onComplete: () => void;
}

export function ArrivalScene({
  firstName,
  lastName,
  handle,
  major,
  graduationYear,
  interests = [],
  isNewUser,
  isReturningUser,
  onComplete,
}: ArrivalSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<'preparing' | 'revealing' | 'ready'>('preparing');
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [showFlash, setShowFlash] = React.useState(false);

  // Phased reveal
  React.useEffect(() => {
    // Phase 1: Brief pause
    const preparingTimer = setTimeout(() => {
      setPhase('revealing');
    }, 400);

    // Phase 2: Ready after card animation
    const readyTimer = setTimeout(() => {
      setPhase('ready');
    }, 2000);

    return () => {
      clearTimeout(preparingTimer);
      clearTimeout(readyTimer);
    };
  }, []);

  const handleComplete = () => {
    setIsNavigating(true);
    setShowFlash(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const manifestoWords = 'We stopped waiting for institutions.';
  const isRevealing = phase === 'revealing' || phase === 'ready';

  // Returning user - simple welcome
  if (isReturningUser) {
    return (
      <motion.div
        variants={sceneMorphVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex flex-col items-center text-center py-8"
      >
        <GoldFlash show={showFlash} duration={0.3} intensity={0.6} />

        <motion.h1
          variants={headlineVariants}
          className="text-heading-lg font-semibold text-white mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Welcome back, {firstName || 'friend'}
        </motion.h1>

        <motion.p
          variants={sceneChildVariants}
          className="text-body-lg text-white/50 mb-10"
        >
          Your campus is ready.
        </motion.p>

        <motion.div
          variants={sceneChildVariants}
          className="w-full max-w-[300px]"
        >
          <Button
            variant="cta"
            size="lg"
            onClick={handleComplete}
            disabled={isNavigating}
            loading={isNavigating}
            className="w-full"
          >
            {isNavigating ? 'Loading...' : 'Enter HIVE'}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // New user - The Crossing ceremony
  return (
    <motion.div
      variants={sceneMorphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center text-center relative py-8"
    >
      <GoldFlash show={showFlash} duration={0.3} intensity={0.6} />

      {/* Background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none -z-10"
        initial={{ opacity: 0 }}
        animate={isRevealing ? { opacity: 1 } : {}}
        transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% 20%, ${GOLD.glow}, transparent 60%)`,
        }}
      />

      {/* Preparing state */}
      {phase === 'preparing' && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center"
            animate={{
              borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,215,0,0.3)', 'rgba(255,255,255,0.2)'],
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-white/40"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Reveal state */}
      {isRevealing && (
        <>
          {/* Identity Card */}
          <motion.div
            className="w-full max-w-[340px] mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <IdentityCard
              handle={handle}
              firstName={firstName}
              lastName={lastName}
              major={major}
              graduationYear={graduationYear}
              interests={interests}
              animate={true}
              delay={0.1}
            />
          </motion.div>

          {/* Manifesto */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.4 }}
          >
            <p
              className="text-body-lg text-white/60 leading-relaxed"
              style={{
                fontFamily: 'var(--font-display)',
                textShadow: `0 0 40px ${GOLD.glowSubtle}`,
              }}
            >
              <ManifestoLine delay={1.5} stagger={0.08}>
                {manifestoWords}
              </ManifestoLine>
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.gentle,
              delay: 2.2,
              ease: EASE_PREMIUM,
            }}
            className="w-full max-w-[300px]"
          >
            <motion.div
              animate={
                phase === 'ready' && !isNavigating
                  ? {
                      boxShadow: [
                        `0 0 20px ${GOLD.glowSubtle}`,
                        `0 0 40px ${GOLD.glow}`,
                        `0 0 20px ${GOLD.glowSubtle}`,
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="rounded-xl"
            >
              <Button
                variant="cta"
                size="lg"
                onClick={handleComplete}
                disabled={isNavigating}
                loading={isNavigating}
                className="w-full text-body-lg"
              >
                {isNavigating ? 'Loading...' : 'Enter HIVE'}
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

ArrivalScene.displayName = 'ArrivalScene';
