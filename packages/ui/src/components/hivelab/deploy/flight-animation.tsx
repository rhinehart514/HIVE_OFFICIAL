'use client';

/**
 * FlightAnimation — Card flying to space destination
 *
 * Per DRAMA plan:
 * - 0ms: User confirms deploy
 * - 100ms: Tool card begins shrinking
 * - 200ms: Card starts moving toward space icon
 * - 400ms: Particle trail follows card
 * - 600ms: Card reaches destination
 * - 800ms: Burst effect at landing point
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';

const EASE = MOTION.ease.premium;

// Colors - tokens are wired in globals.css
const COLORS = {
  gold: 'var(--life-gold)',
  textPrimary: 'var(--hivelab-text-primary)',
};

interface Space {
  id: string;
  name: string;
  handle: string;
  memberCount: number;
}

interface FlightAnimationProps {
  toolName: string;
  targetSpace: Space;
}

export function FlightAnimation({ toolName, targetSpace }: FlightAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<'shrinking' | 'flying' | 'landing' | 'burst'>('shrinking');

  // Particle trail
  const trailParticles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      delay: i * 0.05,
      size: Math.random() * 4 + 2,
      offsetX: (Math.random() - 0.5) * 20,
      offsetY: (Math.random() - 0.5) * 20,
    }));
  }, []);

  // Burst particles
  const burstParticles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      angle: (i / 12) * Math.PI * 2,
      distance: 40 + Math.random() * 30,
      size: Math.random() * 6 + 3,
      delay: Math.random() * 0.1,
    }));
  }, []);

  // Animate through phases
  useEffect(() => {
    if (shouldReduceMotion) {
      setPhase('burst');
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // 100ms: Shrinking
    timers.push(setTimeout(() => setPhase('flying'), 100));
    // 600ms: Landing
    timers.push(setTimeout(() => setPhase('landing'), 600));
    // 800ms: Burst (per DRAMA plan)
    timers.push(setTimeout(() => setPhase('burst'), 800));

    return () => timers.forEach(clearTimeout);
  }, [shouldReduceMotion]);

  return (
    <div className="relative w-full h-[400px] flex flex-col items-center justify-center">
      {/* Flying card */}
      <motion.div
        initial={{ scale: 1, y: 0 }}
        animate={{
          scale: phase === 'shrinking' ? 0.6 : phase === 'flying' ? 0.4 : 0.2,
          y: phase === 'flying' || phase === 'landing' || phase === 'burst' ? 100 : 0,
          opacity: phase === 'burst' ? 0 : 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.5,
          ease: EASE,
        }}
        className="relative z-20"
      >
        {/* Simplified card during flight */}
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: 'var(--hivelab-panel)',
            border: `2px solid ${COLORS.gold}`,
            boxShadow: `0 4px 20px ${COLORS.gold}40`,
          }}
        >
          <span className="text-xl font-bold" style={{ color: COLORS.gold }}>
            {toolName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Particle trail */}
        <AnimatePresence>
          {(phase === 'flying' || phase === 'landing') && (
            <>
              {trailParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ opacity: 0, y: -20, x: 0 }}
                  animate={{ opacity: [0, 1, 0], y: [-20, -60], x: particle.offsetX }}
                  transition={{
                    duration: 0.4,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                  className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: COLORS.gold,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Target Space Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: phase === 'burst' ? 1.2 : 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.3,
          delay: shouldReduceMotion ? 0 : 0.2,
        }}
        className="relative z-10 mt-8"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-semibold"
          style={{
            backgroundColor: `${COLORS.gold}20`,
            color: COLORS.gold,
            border: `1px solid ${COLORS.gold}40`,
          }}
        >
          {targetSpace.name.charAt(0).toUpperCase()}
        </div>

        {/* Space name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.3 }}
          className="text-center mt-3"
        >
          <div className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>
            {targetSpace.name}
          </div>
        </motion.div>

        {/* Burst effect */}
        <AnimatePresence>
          {phase === 'burst' && (
            <>
              {/* Burst particles */}
              {burstParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0.5],
                    x: Math.cos(particle.angle) * particle.distance,
                    y: Math.sin(particle.angle) * particle.distance,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: COLORS.gold,
                  }}
                />
              ))}

              {/* Central glow ring */}
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
                style={{
                  border: `2px solid ${COLORS.gold}`,
                }}
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.4 }}
        className="absolute bottom-8 text-sm font-medium"
        style={{ color: COLORS.gold }}
      >
        {phase === 'burst' ? 'Deployed!' : 'Deploying...'}
      </motion.div>
    </div>
  );
}
