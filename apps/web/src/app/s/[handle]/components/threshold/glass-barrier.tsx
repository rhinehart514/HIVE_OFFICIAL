'use client';

/**
 * GlassBarrier - Blur overlay that dissolves on join
 *
 * Features:
 * - backdrop-filter: blur(8px)
 * - Content opacity: 0.4
 * - pointer-events: none
 * - Dissolves on join (0.3s)
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  motion,
} from '@hive/ui/design-system/primitives';
import { SPACES_MOTION } from '@hive/ui/tokens';

// ============================================================
// Types
// ============================================================

interface GlassBarrierProps {
  /** Whether the barrier is active (visible) */
  active: boolean;
  /** Content to show behind the glass */
  children: React.ReactNode;
  /** Optional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function GlassBarrier({
  active,
  children,
  className,
}: GlassBarrierProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`relative ${className || ''}`}>
      {/* Content behind glass */}
      <motion.div
        className="relative"
        animate={{
          opacity: active ? SPACES_MOTION.glass.opacity : 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : SPACES_MOTION.glass.dissolve,
        }}
      >
        {children}
      </motion.div>

      {/* Glass overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : SPACES_MOTION.glass.dissolve,
            }}
            style={{
              backdropFilter: `blur(${SPACES_MOTION.glass.blur}px)`,
              WebkitBackdropFilter: `blur(${SPACES_MOTION.glass.blur}px)`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Glass Surface Variant (for cards/containers)
// ============================================================

interface GlassSurfaceProps {
  children: React.ReactNode;
  blur?: number;
  className?: string;
}

export function GlassSurface({
  children,
  blur = 8,
  className,
}: GlassSurfaceProps) {
  return (
    <div
      className={`relative overflow-hidden ${className || ''}`}
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        background: 'rgba(255, 255, 255, 0.02)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </div>
  );
}

GlassBarrier.displayName = 'GlassBarrier';
GlassSurface.displayName = 'GlassSurface';
