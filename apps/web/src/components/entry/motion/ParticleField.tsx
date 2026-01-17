'use client';

/**
 * ParticleField - Arrival Celebration Effect
 *
 * Gold particle burst that radiates outward from center
 * Creates a magical "you made it" moment
 *
 * GOLD BUDGET: This is an allowed gold use (celebration)
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GOLD, EASE_PREMIUM } from './entry-motion';

export interface ParticleFieldProps {
  /** Whether to trigger the animation */
  trigger: boolean;
  /** Number of particles */
  particleCount?: number;
  /** Radius of particle spread */
  radius?: number;
  /** Duration of animation */
  duration?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional class names */
  className?: string;
}

interface Particle {
  id: number;
  angle: number;
  size: number;
  color: string;
  delay: number;
  distance: number;
}

// Generate particles with varied properties
function generateParticles(count: number, radius: number): Particle[] {
  const colors = [GOLD.primary, GOLD.light, GOLD.dark];
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
    particles.push({
      id: i,
      angle,
      size: 3 + Math.random() * 4, // 3-7px
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: i * 0.015,
      distance: radius * (0.7 + Math.random() * 0.3), // 70-100% of radius
    });
  }

  return particles;
}

export function ParticleField({
  trigger,
  particleCount = 24,
  radius = 120,
  duration = 1.2,
  onComplete,
  className,
}: ParticleFieldProps) {
  const shouldReduceMotion = useReducedMotion();
  const [particles] = React.useState(() =>
    generateParticles(particleCount, radius)
  );
  const [hasCompleted, setHasCompleted] = React.useState(false);

  const handleAnimationComplete = React.useCallback(() => {
    if (!hasCompleted) {
      setHasCompleted(true);
      onComplete?.();
    }
  }, [hasCompleted, onComplete]);

  // Don't render if reduced motion or not triggered
  if (shouldReduceMotion || !trigger) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        className
      )}
    >
      <div className="relative w-full h-full">
        {/* Origin point for particles - centered */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {particles.map((particle, index) => {
            const x = Math.cos(particle.angle) * particle.distance;
            const y = Math.sin(particle.angle) * particle.distance;

            return (
              <motion.div
                key={particle.id}
                className="absolute rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                  marginLeft: -particle.size / 2,
                  marginTop: -particle.size / 2,
                }}
                initial={{
                  scale: 0,
                  opacity: 1,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  scale: [0, 1.2, 0.6],
                  opacity: [1, 1, 0],
                  x: [0, x * 0.6, x],
                  y: [0, y * 0.6, y],
                }}
                transition={{
                  duration,
                  ease: EASE_PREMIUM,
                  delay: particle.delay,
                }}
                onAnimationComplete={
                  index === particles.length - 1 ? handleAnimationComplete : undefined
                }
              />
            );
          })}

          {/* Center burst glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 60,
              height: 60,
              marginLeft: -30,
              marginTop: -30,
              background: `radial-gradient(circle, ${GOLD.glow} 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 2, 2.5],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: duration * 0.8,
              ease: EASE_PREMIUM,
            }}
          />
        </div>
      </div>
    </div>
  );
}

ParticleField.displayName = 'ParticleField';
