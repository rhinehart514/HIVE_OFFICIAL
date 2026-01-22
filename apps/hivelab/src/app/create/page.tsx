'use client';

/**
 * HiveLab Create Page - Dramatic Canvas Preparation
 *
 * Per DRAMA plan Phase 4.3:
 * Sequence (800ms total):
 * 0ms    - "Preparing your canvas..."
 * 200ms  - Animated grid lines draw in (like blueprint)
 * 400ms  - "Ready to build."
 * 600ms  - Grid fades, redirect begins
 * 800ms  - Arrive at IDE
 */

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '@hive/ui/tokens/motion';

const EASE = MOTION.ease.premium;

// Colors matching HiveLab theme
const COLORS = {
  bg: '#0A0A0A',
  gold: '#D4AF37',
  textPrimary: '#FAF9F7',
  textSecondary: '#8A8A8A',
  gridLine: 'rgba(212, 175, 55, 0.15)',
  gridLineBright: 'rgba(212, 175, 55, 0.3)',
};

// Animated grid line component
function GridLine({
  x1,
  y1,
  x2,
  y2,
  delay,
  duration,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
  duration: number;
}) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x1}
      y2={y1}
      animate={{ x2, y2 }}
      transition={{
        duration,
        delay,
        ease: EASE,
      }}
      stroke={COLORS.gridLine}
      strokeWidth={1}
    />
  );
}

// Blueprint grid animation
function BlueprintGrid({ isAnimating }: { isAnimating: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  // Generate grid lines
  const lines = useMemo(() => {
    const result: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      delay: number;
      isHorizontal: boolean;
    }> = [];

    // Horizontal lines
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * 100;
      result.push({
        id: `h-${i}`,
        x1: 0,
        y1: y,
        x2: 100,
        y2: y,
        delay: 0.05 + i * 0.02,
        isHorizontal: true,
      });
    }

    // Vertical lines
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * 100;
      result.push({
        id: `v-${i}`,
        x1: x,
        y1: 0,
        x2: x,
        y2: 100,
        delay: 0.1 + i * 0.015,
        isHorizontal: false,
      });
    }

    return result;
  }, []);

  if (shouldReduceMotion || !isAnimating) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 pointer-events-none"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {lines.map((line) => (
          <GridLine
            key={line.id}
            x1={line.isHorizontal ? 0 : line.x1}
            y1={line.isHorizontal ? line.y1 : 0}
            x2={line.x2}
            y2={line.y2}
            delay={line.delay}
            duration={0.4}
          />
        ))}

        {/* Center crosshair */}
        <motion.circle
          cx={50}
          cy={50}
          r={0}
          animate={{ r: 3 }}
          transition={{ delay: 0.25, duration: 0.2, ease: EASE }}
          fill="none"
          stroke={COLORS.gridLineBright}
          strokeWidth={1}
        />
        <motion.circle
          cx={50}
          cy={50}
          r={0}
          animate={{ r: 8 }}
          transition={{ delay: 0.3, duration: 0.3, ease: EASE }}
          fill="none"
          stroke={COLORS.gridLine}
          strokeWidth={1}
        />
      </svg>
    </motion.div>
  );
}

export default function CreateToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<'preparing' | 'ready' | 'launching'>('preparing');
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    const context = searchParams.get('context'); // 'space' or 'profile'
    const spaceId = searchParams.get('spaceId');
    const spaceName = searchParams.get('spaceName');

    // Enforce context requirement - redirect to selection if missing
    if (!context || (context === 'space' && !spaceId)) {
      router.replace('/select-context');
      return;
    }

    // Generate a unique tool ID for the new tool
    const newToolId = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Build URL with context preserved
    const params = new URLSearchParams({
      new: 'true',
      context,
    });

    if (context === 'space' && spaceId) {
      params.set('spaceId', spaceId);
      if (spaceName) params.set('spaceName', spaceName);
    }

    const targetUrl = `/${newToolId}?${params.toString()}`;

    if (shouldReduceMotion) {
      // Skip animation for reduced motion
      router.replace(targetUrl);
      return;
    }

    // Animation sequence
    // 0ms - Show "Preparing your canvas..."
    setPhase('preparing');

    // 200ms - Show grid animation
    const gridTimer = setTimeout(() => {
      setShowGrid(true);
    }, 200);

    // 400ms - Show "Ready to build."
    const readyTimer = setTimeout(() => {
      setPhase('ready');
    }, 400);

    // 600ms - Begin launch animation
    const launchTimer = setTimeout(() => {
      setPhase('launching');
    }, 600);

    // 800ms - Navigate to IDE
    const redirectTimer = setTimeout(() => {
      router.replace(targetUrl);
    }, 800);

    return () => {
      clearTimeout(gridTimer);
      clearTimeout(readyTimer);
      clearTimeout(launchTimer);
      clearTimeout(redirectTimer);
    };
  }, [router, searchParams, shouldReduceMotion]);

  return (
    <div
      className="h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Blueprint grid */}
      <BlueprintGrid isAnimating={showGrid} />

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: phase === 'launching' ? 0 : 1,
          scale: phase === 'launching' ? 1.1 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: EASE,
        }}
        className="relative z-10 text-center"
      >
        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: phase === 'ready' ? 90 : 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
          className="w-16 h-16 mx-auto mb-6 relative"
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2"
            style={{ borderColor: COLORS.gold }}
            animate={{
              rotate: [0, 90],
              borderRadius: ['25%', '50%'],
            }}
            transition={{
              duration: 0.6,
              ease: EASE,
            }}
          />

          {/* Inner shape */}
          <motion.div
            className="absolute inset-2 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.gold}20` }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: phase !== 'launching' ? Infinity : 0,
              repeatDelay: 0.5,
            }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: COLORS.gold }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Status text */}
        <div className="h-8 relative">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="text-lg font-medium"
            style={{
              color: phase === 'ready' ? COLORS.gold : COLORS.textPrimary,
            }}
          >
            {phase === 'preparing' && 'Preparing your canvas...'}
            {phase === 'ready' && 'Ready to build.'}
            {phase === 'launching' && 'Launching...'}
          </motion.p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                backgroundColor:
                  (phase === 'preparing' && i === 0) ||
                  (phase === 'ready' && i <= 1) ||
                  (phase === 'launching' && i <= 2)
                    ? COLORS.gold
                    : `${COLORS.gold}30`,
              }}
              transition={{
                scale: { delay: i * 0.1, duration: 0.2 },
                backgroundColor: { duration: 0.15 },
              }}
              className="w-2 h-2 rounded-full"
            />
          ))}
        </div>
      </motion.div>

      {/* Corner decorations */}
      {showGrid && (
        <>
          <motion.div
            initial={{ opacity: 0, x: -20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2"
            style={{ borderColor: COLORS.gridLineBright }}
          />
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2"
            style={{ borderColor: COLORS.gridLineBright }}
          />
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2"
            style={{ borderColor: COLORS.gridLineBright }}
          />
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.45, duration: 0.3 }}
            className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2"
            style={{ borderColor: COLORS.gridLineBright }}
          />
        </>
      )}
    </div>
  );
}
