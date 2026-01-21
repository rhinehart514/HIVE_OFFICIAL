'use client';

/**
 * UnlockCelebration - Major Space Unlock Modal
 *
 * Triggered when a user becomes the 10th member to join a major space,
 * unlocking it for everyone.
 *
 * Features:
 * - Full-screen overlay with blur backdrop
 * - Gold-bordered card with animated sparkle
 * - Premium spring animations
 * - "You unlocked this major space for everyone" messaging
 * - CTA to enter the space
 */

import { motion } from '@hive/ui/design-system/primitives';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

interface UnlockCelebrationProps {
  isOpen: boolean;
  majorName: string;
  spaceId: string;
  onClose: () => void;
}

export function UnlockCelebration({
  isOpen,
  majorName,
  spaceId,
  onClose,
}: UnlockCelebrationProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{
                duration: 0.5,
                ease: EASE,
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="relative max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card */}
              <div className={cn(
                'relative overflow-hidden',
                'rounded-3xl border-2 border-[var(--color-gold)]/30',
                'bg-gradient-to-br from-black/90 to-black/80',
                'p-8',
                'shadow-2xl shadow-[var(--color-gold)]/20'
              )}>
                {/* Animated gold glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/10 to-transparent"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Sparkle icon */}
                  <motion.div
                    className="mb-6 text-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2,
                      ease: EASE,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    <motion.div
                      className="text-[80px]"
                      animate={{
                        rotate: [0, 10, -10, 10, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 0.8,
                        ease: 'easeInOut',
                      }}
                    >
                      ✨
                    </motion.div>
                  </motion.div>

                  {/* Heading */}
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
                    className="text-[28px] font-semibold text-white text-center mb-3 leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Welcome to {majorName}!
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
                    className="text-[15px] text-white/70 text-center mb-2 leading-relaxed"
                  >
                    You unlocked this major space for everyone
                  </motion.p>

                  {/* Sub-message */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.5, ease: EASE }}
                    className="text-[13px] text-[var(--color-gold)]/70 text-center mb-8"
                  >
                    Your classmates can now join and collaborate
                  </motion.p>

                  {/* CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6, ease: EASE }}
                  >
                    <Link href={`/s/${spaceId}`}>
                      <Button
                        variant="cta"
                        size="lg"
                        className="w-full group"
                      >
                        <span>Enter Space</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="ml-2 transition-transform group-hover:translate-x-1"
                        >
                          <path
                            d="M2.66667 8H13.3333M13.3333 8L8 2.66667M13.3333 8L8 13.3333"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Button>
                    </Link>

                    <button
                      onClick={onClose}
                      className="w-full mt-3 py-2 text-[13px] text-white/50 hover:text-white/80 transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                </div>

                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[var(--color-gold)]/20 rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[var(--color-gold)]/20 rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[var(--color-gold)]/20 rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[var(--color-gold)]/20 rounded-br-3xl" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
