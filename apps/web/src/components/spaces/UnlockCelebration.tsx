'use client';

/**
 * UnlockCelebration - Major Space Unlock Modal
 *
 * Triggered when a user becomes the 10th member to join a major space,
 * unlocking it for everyone.
 *
 * Features:
 * - Full-screen overlay with blur backdrop
 * - Gold-bordered card with subtle glow
 * - Premium spring animations using MOTION tokens
 * - No emojis or decorative icons
 *
 * @version 2.0.0 - No emojis, MOTION tokens (Jan 2026)
 */

import { motion, MOTION } from '@hive/ui/design-system/primitives';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
            transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{
                duration: MOTION.duration.base,
                ease: MOTION.ease.premium,
              }}
              className="relative max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card */}
              <div
                className={cn(
                  'relative overflow-hidden',
                  'rounded-3xl border border-[var(--color-gold)]/20',
                  'bg-gradient-to-br from-[#0A0A09] to-[#0D0D0C]',
                  'p-10',
                  'shadow-2xl shadow-[var(--color-gold)]/10'
                )}
              >
                {/* Content */}
                <div className="relative z-10">
                  {/* Gold accent line instead of emoji */}
                  <motion.div
                    className="mx-auto mb-8 w-12 h-1 rounded-full bg-[var(--color-gold)]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: MOTION.duration.base,
                      delay: 0.2,
                      ease: MOTION.ease.premium,
                    }}
                  />

                  {/* Heading */}
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: MOTION.duration.base,
                      delay: 0.3,
                      ease: MOTION.ease.premium,
                    }}
                    className="text-heading-sm font-semibold text-white text-center mb-4 leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Welcome to {majorName}
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: MOTION.duration.base,
                      delay: 0.4,
                      ease: MOTION.ease.premium,
                    }}
                    className="text-body text-white/60 text-center mb-2 leading-relaxed"
                  >
                    You unlocked this major space for everyone
                  </motion.p>

                  {/* Sub-message */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: MOTION.duration.base,
                      delay: 0.5,
                      ease: MOTION.ease.premium,
                    }}
                    className="text-body-sm text-[var(--color-gold)]/60 text-center mb-10"
                  >
                    Your classmates can now join and collaborate
                  </motion.p>

                  {/* CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: MOTION.duration.base,
                      delay: 0.6,
                      ease: MOTION.ease.premium,
                    }}
                  >
                    <Link href={`/s/${spaceId}`}>
                      <Button variant="cta" size="lg" className="w-full group">
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
                      className="w-full mt-4 py-2 text-body-sm text-white/40 hover:text-white/70 transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
