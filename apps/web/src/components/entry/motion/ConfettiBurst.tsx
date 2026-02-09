'use client';

/**
 * ConfettiBurst - Dramatic Celebration Effect
 *
 * Multi-colored confetti that bursts upward then falls with gravity.
 * More dramatic than ParticleField - this is the "wow" moment.
 *
 * GOLD BUDGET: Primary celebration, gold included with other colors
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GOLD, EASE_PREMIUM } from './constants';

export interface ConfettiBurstProps {
  /** Whether to trigger the animation */
  trigger: boolean;
  /** Number of confetti pieces */
  count?: number;
  /** Spread radius */
  spread?: number;
  /** Duration of burst animation */
  duration?: number;
  /** Additional class names */
  className?: string;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  type: 'circle' | 'square' | 'line';
}

// Celebration color palette
const CONFETTI_COLORS = [
  GOLD.primary,
  GOLD.light,
  '#FFFFFF',
  '#E8E8E8',
  '#FFE4B5', // Moccasin (warm)
  '#87CEEB', // Sky blue accent
];

// Generate confetti with varied properties
function generateConfetti(count: number, spread: number): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  const types: ConfettiPiece['type'][] = ['circle', 'square', 'line'];

  for (let i = 0; i < count; i++) {
    // Random horizontal spread
    const angle = (Math.random() - 0.5) * Math.PI * 0.8; // -72° to 72°
    const distance = spread * (0.5 + Math.random() * 0.5);

    pieces.push({
      id: i,
      x: Math.sin(angle) * distance,
      y: -(Math.random() * spread * 0.8 + spread * 0.2), // Burst upward
      rotation: Math.random() * 720 - 360, // -360 to 360 degrees
      scale: 0.5 + Math.random() * 0.8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.15,
      type: types[Math.floor(Math.random() * types.length)],
    });
  }

  return pieces;
}

export function ConfettiBurst({
  trigger,
  count = 40,
  spread = 200,
  duration = 2.5,
  className,
}: ConfettiBurstProps) {
  const shouldReduceMotion = useReducedMotion();
  const [pieces] = React.useState(() => generateConfetti(count, spread));

  // Don't render if reduced motion or not triggered
  if (shouldReduceMotion || !trigger) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden z-50',
        className
      )}
    >
      {/* Origin point - top center of container */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: [0, piece.x * 0.3, piece.x],
              y: [0, piece.y, piece.y * -0.5 + 300], // Up then down (gravity)
              scale: [0, piece.scale, piece.scale * 0.3],
              opacity: [1, 1, 0],
              rotate: [0, piece.rotation * 0.5, piece.rotation],
            }}
            transition={{
              duration,
              ease: [0.23, 1, 0.32, 1], // Custom bounce-out
              delay: piece.delay,
              times: [0, 0.3, 1], // Keyframe timing
            }}
          >
            {piece.type === 'circle' && (
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: piece.color,
                  boxShadow: `0 0 8px ${piece.color}`,
                }}
              />
            )}
            {piece.type === 'square' && (
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{
                  backgroundColor: piece.color,
                  boxShadow: `0 0 6px ${piece.color}`,
                }}
              />
            )}
            {piece.type === 'line' && (
              <div
                className="w-4 h-1 rounded-full"
                style={{
                  backgroundColor: piece.color,
                  boxShadow: `0 0 4px ${piece.color}`,
                }}
              />
            )}
          </motion.div>
        ))}

        {/* Initial flash/burst */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 100,
            height: 100,
            marginLeft: -50,
            marginTop: -50,
            background: `radial-gradient(circle, ${GOLD.glow} 0%, transparent 60%)`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 2],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 0.6,
            ease: EASE_PREMIUM,
          }}
        />
      </div>
    </div>
  );
}

ConfettiBurst.displayName = 'ConfettiBurst';
