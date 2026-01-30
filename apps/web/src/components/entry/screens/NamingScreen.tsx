'use client';

/**
 * NamingScreen - THE WEDGE MOMENT
 *
 * Phase 2 of Entry: "Claim your name."
 * Purpose: Real identity, not anonymous. Make it feel significant.
 *
 * This is the differentiator - the moment users commit to real names.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseEntryReturn } from '../hooks/useEntry';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { clashDisplay } from '../Entry';

interface NamingScreenProps {
  entry: UseEntryReturn;
}

export function NamingScreen({ entry }: NamingScreenProps) {
  const firstNameRef = React.useRef<HTMLInputElement>(null);
  const lastNameRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus first name on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      firstNameRef.current?.focus();
    }, DURATION.smooth * 1000);
    return () => clearTimeout(timer);
  }, []);

  const canContinue = entry.data.firstName.trim() && entry.data.lastName.trim();

  const handleKeyDown = (e: React.KeyboardEvent, isLast: boolean) => {
    if (e.key === 'Enter') {
      if (!isLast && entry.data.firstName.trim()) {
        lastNameRef.current?.focus();
      } else if (isLast && canContinue) {
        entry.submitNaming();
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Back button */}
      <motion.button
        onClick={entry.goBack}
        className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      {/* Header */}
      <div className="space-y-4">
        {/* Section label with gold dot */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/30">
            Identity
          </span>
        </motion.div>

        <motion.h1
          className={cn(
            clashDisplay,
            'text-[2rem] md:text-[2.5rem] font-medium leading-[1.1] tracking-[-0.02em]'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: EASE_PREMIUM }}
        >
          <span className="text-white">Claim your</span>
          <br />
          <span className="text-white/40">name.</span>
        </motion.h1>

        <motion.p
          className="text-[15px] text-white/40 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5, ease: EASE_PREMIUM }}
        >
          Real names. Real trust. That's how we build.
        </motion.p>
      </div>

      {/* Name inputs - side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: DURATION.fast, duration: DURATION.quick, ease: EASE_PREMIUM }}
        >
          <input
            ref={firstNameRef}
            type="text"
            value={entry.data.firstName}
            onChange={(e) => entry.setFirstName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, false)}
            placeholder="First name"
            className={cn(
              'w-full px-5 py-4 rounded-xl',
              'bg-white/[0.03] border-2 transition-all duration-300',
              'text-[16px] text-white placeholder:text-white/25',
              'focus:outline-none',
              entry.data.firstName
                ? 'border-[#FFD700]/40 bg-[#FFD700]/[0.02]'
                : 'border-white/10 focus:border-white/25 focus:bg-white/[0.05]'
            )}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: DURATION.fast * 1.3, duration: DURATION.quick, ease: EASE_PREMIUM }}
        >
          <input
            ref={lastNameRef}
            type="text"
            value={entry.data.lastName}
            onChange={(e) => entry.setLastName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, true)}
            placeholder="Last name"
            className={cn(
              'w-full px-5 py-4 rounded-xl',
              'bg-white/[0.03] border-2 transition-all duration-300',
              'text-[16px] text-white placeholder:text-white/25',
              'focus:outline-none',
              entry.data.lastName
                ? 'border-[#FFD700]/40 bg-[#FFD700]/[0.02]'
                : 'border-white/10 focus:border-white/25 focus:bg-white/[0.05]'
            )}
          />
        </motion.div>
      </div>

      {/* Error */}
      {entry.error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[13px] text-red-400"
        >
          {entry.error}
        </motion.p>
      )}

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: DURATION.quick, duration: DURATION.fast, ease: EASE_PREMIUM }}
      >
        <button
          onClick={entry.submitNaming}
          disabled={!canContinue}
          className={cn(
            'group px-8 py-4 rounded-xl font-medium transition-all duration-300',
            'flex items-center gap-2',
            canContinue
              ? 'bg-white text-[#030303] hover:bg-white/90'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          )}
        >
          <span>Continue</span>
          <ArrowRight className={cn(
            'w-4 h-4 transition-transform',
            canContinue && 'group-hover:translate-x-0.5'
          )} />
        </button>
      </motion.div>
    </div>
  );
}
