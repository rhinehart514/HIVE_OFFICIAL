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
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, AtSign } from 'lucide-react';
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

  const hasName = entry.data.firstName.trim() && entry.data.lastName.trim();
  // Don't block on handle availability - API auto-generates variants if taken
  // Only block while checking to avoid race conditions
  const canContinue = hasName && !entry.handlePreview.isChecking;

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
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500/60" />
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
                ? 'border-gold-500/40 bg-gold-500/[0.02]'
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
                ? 'border-gold-500/40 bg-gold-500/[0.02]'
                : 'border-white/10 focus:border-white/25 focus:bg-white/[0.05]'
            )}
          />
        </motion.div>
      </div>

      {/* Handle Preview */}
      <AnimatePresence>
        {entry.handlePreview.preview.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE_PREMIUM }}
            className="overflow-hidden"
          >
            <div className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'border-2 transition-all duration-300',
              entry.handlePreview.isChecking
                ? 'bg-white/[0.02] border-white/10'
                : entry.handlePreview.isAvailable
                  ? 'bg-gold-500/[0.03] border-gold-500/30'
                  : 'bg-amber-500/[0.03] border-amber-500/30' // Warning, not error
            )}>
              <AtSign className={cn(
                'w-4 h-4 flex-shrink-0',
                entry.handlePreview.isChecking
                  ? 'text-white/30'
                  : entry.handlePreview.isAvailable
                    ? 'text-gold-500/60'
                    : 'text-amber-400/60'
              )} />

              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-[15px] font-medium truncate',
                  entry.handlePreview.isChecking
                    ? 'text-white/50'
                    : 'text-white'
                )}>
                  @{entry.handlePreview.preview}
                </p>
                <p
                  aria-live="polite"
                  className={cn(
                    'text-[12px]',
                    entry.handlePreview.isChecking
                      ? 'text-white/30'
                      : entry.handlePreview.isAvailable
                        ? 'text-gold-500/60'
                        : 'text-amber-400/70'
                  )}
                >
                  {entry.handlePreview.isChecking
                    ? 'Checking availability...'
                    : entry.handlePreview.isAvailable
                      ? 'Available! This will be your handle.'
                      : "Taken — we'll pick a variant for you"}
                </p>
              </div>

              <div className="flex-shrink-0">
                {entry.handlePreview.isChecking ? (
                  <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                ) : entry.handlePreview.isAvailable ? (
                  <Check className="w-4 h-4 text-gold-500" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              ? 'bg-white text-neutral-950 hover:bg-white/90'
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
