'use client';

/**
 * VerificationPending - Premium verification waiting state
 *
 * Shows animated dots that fill with gold and a manifesto moment
 * while the system verifies the user's identity.
 */

import { motion } from 'framer-motion';
import { GOLD, EASE_PREMIUM } from '../motion/constants';

interface VerificationPendingProps {
  /** Primary message */
  message?: string;
  /** Secondary submessage */
  submessage?: string;
}

export function VerificationPending({
  message = 'Verifying your identity',
  submessage = 'This keeps the hive safe',
}: VerificationPendingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center py-8"
    >
      {/* Animated dots filling */}
      <div className="flex gap-2 mb-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            animate={{
              backgroundColor: [
                'rgba(255, 255, 255, 0.15)',
                GOLD.glow,
                'rgba(255, 255, 255, 0.15)',
              ],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.15,
              repeat: Infinity,
              ease: EASE_PREMIUM,
            }}
          />
        ))}
      </div>

      {/* Manifesto moment */}
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: EASE_PREMIUM }}
        className="text-body text-white/60 mb-2"
      >
        {message}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: EASE_PREMIUM }}
        className="text-body-sm text-white/40"
      >
        {submessage}
      </motion.p>
    </motion.div>
  );
}

VerificationPending.displayName = 'VerificationPending';
