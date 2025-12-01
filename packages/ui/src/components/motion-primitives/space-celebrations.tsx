'use client';

/**
 * Space Celebrations - Animation components for Space interactions
 *
 * Provides celebration effects for:
 * - Joining a space (gold confetti burst)
 * - First post in a space (success check)
 * - Milestone achievements
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Sparkles, Star, Zap } from 'lucide-react';

import { cn } from '../../lib/utils';
import {
  spaceJoinCelebrationVariants,
  goldGlowPulseVariants,
  confettiParticleVariants,
  successCheckVariants,
  withReducedMotion,
} from '../../lib/motion-variants-spaces';

// ============================================
// GOLD CONFETTI BURST
// ============================================

interface ConfettiParticle {
  id: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'star';
}

const GOLD_COLORS = [
  '#FFD700', // Gold
  '#FFA500', // Orange-gold
  '#FFDF00', // Golden yellow
  '#F0E68C', // Khaki gold
  '#DAA520', // Goldenrod
];

function generateParticles(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
    size: Math.random() * 8 + 4, // 4-12px
    shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
  }));
}

export interface GoldConfettiBurstProps {
  /** Whether to show the confetti */
  isActive: boolean;
  /** Number of particles */
  particleCount?: number;
  /** Duration in seconds before auto-hide */
  duration?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional className */
  className?: string;
}

export function GoldConfettiBurst({
  isActive,
  particleCount = 30,
  duration = 1.5,
  onComplete,
  className,
}: GoldConfettiBurstProps) {
  const shouldReduceMotion = useReducedMotion();
  const [particles, setParticles] = React.useState<ConfettiParticle[]>([]);

  React.useEffect(() => {
    if (isActive && !shouldReduceMotion) {
      setParticles(generateParticles(particleCount));
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive, particleCount, duration, onComplete, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            custom={particle.id}
            variants={confettiParticleVariants}
            initial="initial"
            animate="animate"
            className="absolute left-1/2 top-1/2"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: particle.shape === 'circle' ? '50%' : particle.shape === 'star' ? '0' : '2px',
              transform: particle.shape === 'star' ? 'rotate(45deg)' : undefined,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// JOIN CELEBRATION OVERLAY
// ============================================

export interface JoinCelebrationProps {
  /** Whether to show the celebration */
  isActive: boolean;
  /** Space name for message */
  spaceName: string;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional className */
  className?: string;
}

export function JoinCelebration({
  isActive,
  spaceName,
  onComplete,
  className,
}: JoinCelebrationProps) {
  const shouldReduceMotion = useReducedMotion();
  const celebrationVariants = withReducedMotion(spaceJoinCelebrationVariants, shouldReduceMotion ?? false);

  React.useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-black/60 backdrop-blur-sm',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti layer */}
          <GoldConfettiBurst isActive={isActive} particleCount={40} />

          {/* Central celebration card */}
          <motion.div
            variants={celebrationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'relative z-10 flex flex-col items-center gap-4 p-8',
              'bg-neutral-900/90 backdrop-blur-xl rounded-3xl',
              'border border-gold-500/20 shadow-2xl'
            )}
          >
            {/* Gold glow pulse */}
            <motion.div
              variants={goldGlowPulseVariants}
              animate="animate"
              className="absolute inset-0 rounded-3xl"
            />

            {/* Success icon */}
            <motion.div
              variants={shouldReduceMotion ? undefined : successCheckVariants}
              initial="initial"
              animate="animate"
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full',
                'bg-gradient-to-br from-gold-400 to-gold-600'
              )}
            >
              <Check className="h-8 w-8 text-black" strokeWidth={3} />
            </motion.div>

            {/* Message */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-1">
                Welcome to {spaceName}!
              </h3>
              <p className="text-sm text-neutral-400">
                You're now a member of this space
              </p>
            </div>

            {/* Sparkle decorations */}
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-6 w-6 text-gold-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Star className="h-5 w-5 text-gold-500 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// FIRST POST CELEBRATION
// ============================================

export interface FirstPostCelebrationProps {
  /** Whether to show the celebration */
  isActive: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional className */
  className?: string;
}

export function FirstPostCelebration({
  isActive,
  onComplete,
  className,
}: FirstPostCelebrationProps) {
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive, onComplete]);

  if (shouldReduceMotion) {
    return isActive ? (
      <div className={cn('flex items-center gap-2 text-gold-400', className)}>
        <Zap className="h-4 w-4" />
        <span className="text-sm font-medium">First post!</span>
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className={cn('flex items-center gap-2', className)}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/20"
            animate={{
              scale: [1, 1.2, 1],
              boxShadow: [
                '0 0 0 0 rgba(255,215,0,0)',
                '0 0 20px 10px rgba(255,215,0,0.3)',
                '0 0 0 0 rgba(255,215,0,0)',
              ],
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Zap className="h-4 w-4 text-gold-400" />
          </motion.div>
          <span className="text-sm font-medium text-gold-400">
            First post! 🎉
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MILESTONE BADGE
// ============================================

export interface MilestoneBadgeProps {
  /** Milestone type */
  type: 'posts' | 'members' | 'days' | 'tools';
  /** Milestone value */
  value: number;
  /** Whether to show celebration animation */
  celebrate?: boolean;
  /** Additional className */
  className?: string;
}

const MILESTONE_ICONS = {
  posts: Zap,
  members: Sparkles,
  days: Star,
  tools: Star,
};

const MILESTONE_LABELS = {
  posts: 'posts',
  members: 'members',
  days: 'days active',
  tools: 'tools used',
};

export function MilestoneBadge({
  type,
  value,
  celebrate = false,
  className,
}: MilestoneBadgeProps) {
  const Icon = MILESTONE_ICONS[type];
  const label = MILESTONE_LABELS[type];

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'bg-gold-500/10 border border-gold-500/20',
        className
      )}
      animate={celebrate ? {
        scale: [1, 1.1, 1],
        boxShadow: [
          '0 0 0 0 rgba(255,215,0,0)',
          '0 0 15px 5px rgba(255,215,0,0.2)',
          '0 0 0 0 rgba(255,215,0,0)',
        ],
      } : undefined}
      transition={{ duration: 0.6 }}
    >
      <Icon className="h-3.5 w-3.5 text-gold-400" />
      <span className="text-xs font-semibold text-gold-400">
        {value.toLocaleString()} {label}
      </span>
    </motion.div>
  );
}
