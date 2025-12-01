/**
 * SparklesText Component
 * Animated sparkling text effect - premium UI pattern for achievements
 *
 * Creates sparkle particles around text for celebration/emphasis.
 * Based on Magic UI SparklesText pattern.
 *
 * @example
 * ```tsx
 * <SparklesText
 *   text="1,247 Rep"
 *   sparkleColor="#FFD700"
 *   className="text-2xl font-bold text-gold-500"
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Sparkle {
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export interface SparklesTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Text to display with sparkles */
  text: string;
  /** Color of sparkle particles (default: gold) */
  sparkleColor?: string;
  /** Number of sparkles (default: 10) */
  sparkleCount?: number;
  /** Minimum sparkle size in pixels (default: 4) */
  minSize?: number;
  /** Maximum sparkle size in pixels (default: 12) */
  maxSize?: number;
  /** Whether sparkles are active (default: true) */
  active?: boolean;
}

const generateSparkle = (
  minSize: number,
  maxSize: number
): Omit<Sparkle, 'id'> => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * (maxSize - minSize) + minSize,
  delay: Math.random() * 2,
  duration: Math.random() * 1 + 1.5,
});

/**
 * SparklesText - Text with animated sparkle particles
 *
 * Perfect for Rep scores, achievements, milestones.
 * Use sparingly for maximum impact.
 */
export function SparklesText({
  text,
  sparkleColor = '#FFD700',
  sparkleCount = 10,
  minSize = 4,
  maxSize = 12,
  active = true,
  className,
  ...props
}: SparklesTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate initial sparkles
  const initialSparkles = useMemo(() => {
    return Array.from({ length: sparkleCount }, (_, i) => ({
      id: `sparkle-${i}-${Date.now()}`,
      ...generateSparkle(minSize, maxSize),
    }));
  }, [sparkleCount, minSize, maxSize]);

  // Regenerate sparkles periodically
  const regenerateSparkle = useCallback(() => {
    setSparkles((prev) => {
      const idx = Math.floor(Math.random() * prev.length);
      const newSparkles = [...prev];
      newSparkles[idx] = {
        id: `sparkle-${idx}-${Date.now()}`,
        ...generateSparkle(minSize, maxSize),
      };
      return newSparkles;
    });
  }, [minSize, maxSize]);

  useEffect(() => {
    if (prefersReducedMotion || !active) {
      setSparkles([]);
      return;
    }

    setSparkles(initialSparkles);

    // Regenerate sparkles periodically for continuous effect
    intervalRef.current = setInterval(regenerateSparkle, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [active, prefersReducedMotion, initialSparkles, regenerateSparkle]);

  // No sparkles for reduced motion
  if (prefersReducedMotion || !active) {
    return (
      <span className={className} {...props}>
        {text}
      </span>
    );
  }

  return (
    <span
      className={cn('relative inline-block', className)}
      {...props}
    >
      {/* Sparkle particles */}
      <span className="absolute inset-0 overflow-visible pointer-events-none">
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.span
              key={sparkle.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: sparkle.duration,
                delay: sparkle.delay,
                ease: 'easeInOut',
              }}
              className="absolute block"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
                width: sparkle.size,
                height: sparkle.size,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-full h-full"
              >
                <path
                  d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
                  fill={sparkleColor}
                />
              </svg>
            </motion.span>
          ))}
        </AnimatePresence>
      </span>

      {/* Text content */}
      <span className="relative z-10">{text}</span>
    </span>
  );
}

SparklesText.displayName = 'SparklesText';

/**
 * Sparkle presets for common use cases
 */
export const sparklePresets = {
  /** Subtle gold sparkles for Rep scores */
  gold: {
    sparkleColor: '#FFD700',
    sparkleCount: 8,
    minSize: 4,
    maxSize: 10,
  },
  /** Celebration sparkles for achievements */
  celebration: {
    sparkleColor: '#FFD700',
    sparkleCount: 15,
    minSize: 6,
    maxSize: 14,
  },
  /** Subtle white sparkles */
  subtle: {
    sparkleColor: '#FFFFFF',
    sparkleCount: 6,
    minSize: 3,
    maxSize: 8,
  },
  /** Premium gradient effect (use with colorful text) */
  premium: {
    sparkleColor: '#F59E0B',
    sparkleCount: 10,
    minSize: 5,
    maxSize: 12,
  },
} as const;
