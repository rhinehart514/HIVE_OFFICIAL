'use client';

/**
 * Skeleton Canvas - Optimistic rendering for instant feedback
 *
 * Shows immediately when generation starts to create perception of speed.
 * Displays placeholder elements that suggest the tool structure.
 */

import { motion } from 'framer-motion';
import { durationSeconds, easingArrays, staggerPresets } from '@hive/tokens';

export interface SkeletonCanvasProps {
  /** Number of skeleton elements to show */
  elementCount?: number;
}

/**
 * SkeletonCanvas Component
 *
 * Instant feedback canvas that appears while AI generates.
 * Creates perception that generation is faster than reality.
 */
export function SkeletonCanvas({ elementCount = 3 }: SkeletonCanvasProps) {
  return (
    <div className="relative h-[600px] lg:h-[700px] rounded-lg border border-white/[0.06] bg-white/[0.01] p-8 overflow-y-auto">
      {/* Skeleton elements */}
      <div className="space-y-6">
        {Array.from({ length: elementCount }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: durationSeconds.smooth,
              delay: index * durationSeconds.snap,
              ease: easingArrays.default
            }}
            className="relative"
          >
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-sm">
              {/* Skeleton header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[var(--hive-gold-cta)] animate-pulse" />
                <div className="h-4 w-32 bg-white/[0.08] rounded animate-pulse" />
              </div>

              {/* Skeleton content */}
              <div className="space-y-3">
                <div className="h-10 bg-white/[0.06] rounded-lg animate-pulse" />
                <div className="h-10 bg-white/[0.06] rounded-lg animate-pulse w-3/4" />
                {index === 0 && (
                  <>
                    <div className="h-10 bg-white/[0.06] rounded-lg animate-pulse w-1/2" />
                    <div className="flex gap-2 mt-4">
                      <div className="h-10 w-24 bg-[var(--hive-gold-cta)]/20 rounded-lg animate-pulse" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Connection line hint */}
            {index < elementCount - 1 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: durationSeconds.standard, delay: (index + 1) * durationSeconds.snap }}
                className="absolute left-1/2 -bottom-3 w-0.5 h-6 bg-gradient-to-b from-[var(--hive-gold-cta)]/30 to-transparent"
                style={{ transformOrigin: 'top' }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Pulsing overlay to indicate processing */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-[var(--hive-gold-cta)]/5 to-transparent pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
