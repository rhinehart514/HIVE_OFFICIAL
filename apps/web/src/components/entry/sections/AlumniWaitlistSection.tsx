'use client';

/**
 * AlumniWaitlistSection - Inline waitlist confirmation
 *
 * Terminal section for alumni path.
 * Shows confirmation that they're on the waitlist.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Bell, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  arrivalRevealVariants,
  sectionChildVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface AlumniWaitlistSectionProps {
  section: SectionState;
  spaces: string;
  onComplete: () => void;
}

export function AlumniWaitlistSection({
  section,
  spaces,
  onComplete,
}: AlumniWaitlistSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showContent, setShowContent] = React.useState(false);

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Delay content reveal
  React.useEffect(() => {
    if (section.status === 'active') {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [section.status]);

  return (
    <motion.div
      variants={arrivalRevealVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center text-center py-6"
    >
      {/* Icon */}
      <motion.div
        className="mb-6"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
        animate={showContent ? { opacity: 1, scale: 1 } : {}}
        transition={{
          duration: DURATION.gentle,
          ease: EASE_PREMIUM,
        }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${GOLD.glowSubtle} 0%, transparent 100%)`,
            boxShadow: `0 0 30px ${GOLD.glowSoft}`,
          }}
        >
          <Bell className="w-6 h-6" style={{ color: GOLD.primary }} />
        </div>
      </motion.div>

      {/* Message */}
      <motion.div
        className="mb-6"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.1,
          ease: EASE_PREMIUM,
        }}
      >
        <h2 className="text-[24px] font-semibold tracking-tight text-white mb-2">
          You're on the list
        </h2>
        <p className="text-[14px] text-white/50 max-w-[280px] mx-auto">
          We'll notify you when alumni access opens. Your communities will be
          excited to reconnect.
        </p>
      </motion.div>

      {/* Past spaces reminder */}
      {spaces && (
        <motion.div
          className="mb-6 w-full max-w-[280px]"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: DURATION.gentle,
            delay: 0.2,
            ease: EASE_PREMIUM,
          }}
        >
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-[11px] text-white/40 mb-0.5">
                  Spaces you mentioned
                </p>
                <p className="text-[13px] text-white/70">{spaces}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info */}
      <motion.div
        className="mb-6 text-left w-full max-w-[280px]"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.3,
          ease: EASE_PREMIUM,
        }}
      >
        <p className="text-[12px] text-white/40 leading-relaxed">
          When we launch alumni access, you'll be able to connect with current
          members, share your experience, and stay involved with your campus
          community.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
        animate={showContent ? { opacity: 1, scale: 1 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.4,
          ease: EASE_PREMIUM,
        }}
        className="w-full max-w-[240px]"
      >
        <button
          onClick={onComplete}
          className={cn(
            'w-full h-11 rounded-xl font-medium text-[14px]',
            'flex items-center justify-center gap-2',
            'bg-white/10 text-white hover:bg-white/15',
            'transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
          )}
        >
          <span>Got it</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

AlumniWaitlistSection.displayName = 'AlumniWaitlistSection';
