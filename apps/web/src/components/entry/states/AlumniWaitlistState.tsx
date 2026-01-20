'use client';

/**
 * AlumniWaitlistState - Alumni Waitlist Confirmation
 *
 * Shown after alumni submit their information.
 * Warm, encouraging message about being notified when alumni access opens.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Bell, Heart } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  stateVariants,
  childVariants,
  EASE_PREMIUM,
  DURATION,
  GOLD,
} from '../motion/entry-motion';

export interface AlumniWaitlistStateProps {
  /** Alumni's past spaces */
  spaces: string;
  /** Callback to continue (go to landing) */
  onComplete: () => void;
}

export function AlumniWaitlistState({
  spaces,
  onComplete,
}: AlumniWaitlistStateProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showContent, setShowContent] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      variants={stateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center text-center py-8"
    >
      {/* Icon */}
      <motion.div
        variants={childVariants}
        className="mb-6"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
        animate={showContent ? { opacity: 1, scale: 1 } : {}}
        transition={{
          duration: DURATION.gentle,
          ease: EASE_PREMIUM,
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)`,
            boxShadow: `0 0 30px rgba(255,215,0,0.1)`,
          }}
        >
          <Bell className="w-7 h-7 text-[#FFD700]" />
        </div>
      </motion.div>

      {/* Message */}
      <motion.div
        variants={childVariants}
        className="mb-8"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.1,
          ease: EASE_PREMIUM,
        }}
      >
        <h1 className="text-[28px] font-semibold tracking-tight text-white mb-3">
          You're on the list
        </h1>
        <p className="text-[15px] text-white/50 max-w-[320px] mx-auto">
          We'll notify you when alumni access opens. Your communities will be
          excited to reconnect.
        </p>
      </motion.div>

      {/* Past spaces reminder */}
      {spaces && (
        <motion.div
          variants={childVariants}
          className="mb-8 w-full max-w-[320px]"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: DURATION.gentle,
            delay: 0.2,
            ease: EASE_PREMIUM,
          }}
        >
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-[12px] text-white/40 mb-1">
                  Spaces you mentioned
                </p>
                <p className="text-[14px] text-white/70">{spaces}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info */}
      <motion.div
        variants={childVariants}
        className="mb-8 text-left w-full max-w-[320px]"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.3,
          ease: EASE_PREMIUM,
        }}
      >
        <p className="text-[13px] text-white/40">
          When we launch alumni access, you'll be able to connect with current
          members, share your experience, and stay involved with your campus
          community.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        variants={childVariants}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
        animate={showContent ? { opacity: 1, scale: 1 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.4,
          ease: EASE_PREMIUM,
        }}
        className="w-full max-w-[280px]"
      >
        <Button
          onClick={onComplete}
          variant="secondary"
          size="lg"
          className="w-full gap-2"
        >
          <span>Got it</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

AlumniWaitlistState.displayName = 'AlumniWaitlistState';
