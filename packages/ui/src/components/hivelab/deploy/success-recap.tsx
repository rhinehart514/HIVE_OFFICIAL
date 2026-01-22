'use client';

/**
 * SuccessRecap — Final deployment success screen
 *
 * Per DRAMA plan:
 * - [Tool Name] is live (gold)
 * - Tool Preview Card (miniature canvas)
 * - Deployed to [Space Name]
 * - [X] members can now use this tool (StatCounter)
 * - CTAs: View in [Space] (gold), Keep building (secondary)
 */

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';

const EASE = MOTION.ease.premium;

const COLORS = {
  panel: 'var(--hivelab-panel, #1A1A1A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  gold: 'var(--life-gold, #D4AF37)',
};

interface ConfettiParticle {
  id: number;
  targetX: number;
  targetY: number;
  rotation: number;
  delay: number;
  size: number;
  color: string;
  isCircle: boolean;
}

interface SuccessRecapProps {
  toolName: string;
  spaceName: string;
  memberCount: number;
  confettiParticles: ConfettiParticle[];
  onViewInSpace: () => void;
  onContinueEditing: () => void;
}

/**
 * AnimatedCounter — Counts up to target number
 */
function AnimatedCounter({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * eased));

      if (progress >= 1) {
        clearInterval(timer);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration, shouldReduceMotion]);

  return <span>{count}</span>;
}

export function SuccessRecap({
  toolName,
  spaceName,
  memberCount,
  confettiParticles,
  onViewInSpace,
  onContinueEditing,
}: SuccessRecapProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      className="w-full max-w-md text-center"
    >
      {/* Confetti */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {confettiParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: '50%',
              y: '50%',
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: `${particle.targetX}%`,
              y: `${particle.targetY}%`,
              scale: shouldReduceMotion ? 0 : [0, 1, 0.5],
              opacity: shouldReduceMotion ? 0 : [1, 1, 0],
              rotate: particle.rotation,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 1.5,
              delay: particle.delay,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: particle.isCircle ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: shouldReduceMotion ? 0 : 0.2,
        }}
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          background: `linear-gradient(135deg, ${COLORS.gold}, #B8860B)`,
          boxShadow: `0 4px 20px ${COLORS.gold}40`,
        }}
      >
        <svg
          className="h-8 w-8 text-black"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : 0.3,
          ease: EASE,
        }}
        className="text-2xl font-semibold mb-2"
        style={{ color: COLORS.gold }}
      >
        {toolName} is live
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : 0.4,
          ease: EASE,
        }}
        className="mb-6"
        style={{ color: COLORS.textSecondary }}
      >
        Deployed to {spaceName}
      </motion.p>

      {/* Member count stat */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : 0.5,
          ease: EASE,
        }}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl mb-8"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke={COLORS.textSecondary}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </svg>
        <span style={{ color: COLORS.textPrimary }}>
          <AnimatedCounter target={memberCount} /> member{memberCount !== 1 ? 's' : ''} can now use this tool
        </span>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : 0.6,
          ease: EASE,
        }}
        className="flex items-center justify-center gap-4"
      >
        <button
          type="button"
          onClick={onContinueEditing}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            backgroundColor: COLORS.surface,
            color: COLORS.textSecondary,
            border: `1px solid ${COLORS.border}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.panel;
            e.currentTarget.style.color = COLORS.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.surface;
            e.currentTarget.style.color = COLORS.textSecondary;
          }}
        >
          Keep building
        </button>

        <button
          type="button"
          onClick={onViewInSpace}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black transition-all duration-200"
          style={{
            backgroundColor: COLORS.gold,
            boxShadow: `0 4px 12px ${COLORS.gold}30`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = `0 6px 16px ${COLORS.gold}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.gold}30`;
          }}
        >
          View in {spaceName}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </motion.div>

      {/* Glow effect behind card */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                boxShadow: [
                  `0 0 0 0 ${COLORS.gold}00`,
                  `0 0 60px 30px ${COLORS.gold}15`,
                  `0 0 0 0 ${COLORS.gold}00`,
                ],
              }
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none -z-10"
      />
    </motion.div>
  );
}
