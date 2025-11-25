'use client';

/**
 * RitualCompletionCelebration
 *
 * Signature celebration moment when a user completes a ritual.
 * This is designed to be memorable and screenshot-worthy.
 *
 * Features:
 * - Confetti burst
 * - Radial gold glow
 * - Trophy animation
 * - Stat reveals
 * - Share CTA
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Share2, Sparkles, Users, Flame, X } from 'lucide-react';
import * as React from 'react';
import { durationSeconds, easingArrays, springPresets, staggerPresets } from '@hive/tokens';

import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms';

export interface RitualCompletionCelebrationProps {
  /** Whether the celebration is visible */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Share callback */
  onShare?: () => void;
  /** Ritual data */
  ritual: {
    name: string;
    icon?: string;
    streak?: number; // Days completed in a row
    rank?: number; // Rank among participants
    totalParticipants?: number;
  };
  /** Additional className */
  className?: string;
}

// Confetti particle component
const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{ backgroundColor: color }}
    initial={{
      opacity: 1,
      scale: 0,
      x: 0,
      y: 0,
    }}
    animate={{
      opacity: [1, 1, 0],
      scale: [0, 1, 0.5],
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300 - 100,
      rotate: Math.random() * 720,
    }}
    transition={{
      duration: 1.5,
      delay,
      ease: easingArrays.out,
    }}
  />
);

export const RitualCompletionCelebration: React.FC<RitualCompletionCelebrationProps> = ({
  isOpen,
  onClose,
  onShare,
  ritual,
  className,
}) => {
  const confettiColors = [
    'var(--hive-brand-primary)',
    '#FFD700',
    '#FFA500',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durationSeconds.quick }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Radial gold glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3] }}
            transition={{ duration: 1.5, times: [0, 0.3, 1] }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-[var(--hive-brand-primary)]/30 via-[var(--hive-brand-primary)]/10 to-transparent blur-3xl" />
          </motion.div>

          {/* Confetti burst */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                delay={i * 0.02}
                color={confettiColors[i % confettiColors.length] ?? '#FFD700'}
              />
            ))}
          </div>

          {/* Main content */}
          <motion.div
            className="relative z-10 max-w-sm w-full mx-4"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={springPresets.bouncy}
          >
            {/* Close button */}
            <motion.button
              className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Card */}
            <div className="bg-[var(--hive-background-secondary)] border border-[var(--hive-brand-primary)]/30 rounded-3xl p-8 text-center overflow-hidden">
              {/* Trophy icon with dramatic entrance */}
              <motion.div
                className="relative mx-auto w-24 h-24 mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  ...springPresets.bouncy,
                  delay: 0.2,
                }}
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--hive-brand-primary)] to-[var(--hive-brand-secondary)]"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Icon container */}
                <div className="absolute inset-2 rounded-full bg-[var(--hive-background-primary)] flex items-center justify-center">
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {ritual.icon ? (
                      <span className="text-4xl">{ritual.icon}</span>
                    ) : (
                      <Trophy className="w-10 h-10 text-[var(--hive-brand-primary)]" />
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: durationSeconds.standard }}
              >
                <h2 className="text-2xl font-bold text-[var(--hive-text-primary)] mb-2">
                  Ritual Complete!
                </h2>
                <p className="text-[var(--hive-text-secondary)]">
                  {ritual.name}
                </p>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="grid grid-cols-2 gap-4 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {ritual.streak && (
                  <motion.div
                    className="bg-[var(--hive-background-tertiary)] rounded-xl p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, ...springPresets.snappy }}
                  >
                    <Flame className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[var(--hive-text-primary)]">
                      {ritual.streak}
                    </div>
                    <div className="text-xs text-[var(--hive-text-tertiary)] uppercase tracking-caps">
                      Day Streak
                    </div>
                  </motion.div>
                )}

                {ritual.rank && ritual.totalParticipants && (
                  <motion.div
                    className="bg-[var(--hive-background-tertiary)] rounded-xl p-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, ...springPresets.snappy }}
                  >
                    <Users className="w-5 h-5 text-[var(--hive-brand-primary)] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[var(--hive-text-primary)]">
                      #{ritual.rank}
                    </div>
                    <div className="text-xs text-[var(--hive-text-tertiary)] uppercase tracking-caps">
                      of {ritual.totalParticipants}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Actions */}
              <motion.div
                className="mt-6 space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: durationSeconds.standard }}
              >
                {onShare && (
                  <Button
                    className="w-full bg-gradient-to-r from-[var(--hive-brand-primary)] to-[var(--hive-brand-secondary)] text-black hover:opacity-90"
                    onClick={onShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Achievement
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onClose}
                >
                  Continue
                </Button>
              </motion.div>

              {/* Sparkle decorations */}
              <motion.div
                className="absolute top-4 left-4"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-[var(--hive-brand-primary)]/50" />
              </motion.div>
              <motion.div
                className="absolute bottom-4 right-4"
                animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-[var(--hive-brand-primary)]/50" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

RitualCompletionCelebration.displayName = 'RitualCompletionCelebration';
