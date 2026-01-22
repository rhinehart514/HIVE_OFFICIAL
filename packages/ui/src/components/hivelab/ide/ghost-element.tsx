'use client';

/**
 * GhostElement — Dashed outline preview during AI generation
 *
 * Per DRAMA plan:
 * - Ghost outline appears (dashed white/10 at target position)
 * - Shows where element will materialize
 * - Subtle pulse animation while waiting
 */

import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';

const EASE = MOTION.ease.premium;

interface GhostElementProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  label?: string;
}

export function GhostElement({ position, size, label }: GhostElementProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
        ease: EASE,
      }}
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      {/* Dashed border outline */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          border: '2px dashed rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
        animate={
          shouldReduceMotion
            ? {}
            : {
                borderColor: [
                  'rgba(255, 255, 255, 0.1)',
                  'rgba(255, 255, 255, 0.15)',
                  'rgba(255, 255, 255, 0.1)',
                ],
              }
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Label */}
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute -top-6 left-0 text-xs text-white/30"
        >
          {label}
        </motion.div>
      )}

      {/* Corner dots for visual reference */}
      {[
        { top: -2, left: -2 },
        { top: -2, right: -2 },
        { bottom: -2, left: -2 },
        { bottom: -2, right: -2 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            ...pos,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2],
                }
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </motion.div>
  );
}
