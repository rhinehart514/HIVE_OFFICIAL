'use client';

/**
 * GateScreen - Email + Code verification + Waitlist
 *
 * Phase 1 of Entry: "We don't let everyone in."
 * Purpose: Establish exclusivity, verify campus membership
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OTPInput } from '@hive/ui/design-system/primitives';
import type { UseEntryReturn } from '../hooks/useEntry';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { clashDisplay } from '../Entry';

interface GateScreenProps {
  entry: UseEntryReturn;
}

export function GateScreen({ entry }: GateScreenProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [countdown, setCountdown] = React.useState(0);

  // Auto-focus input
  React.useEffect(() => {
    inputRef.current?.focus();
  }, [entry.gateStep]);

  // Resend countdown (pauses during loading)
  React.useEffect(() => {
    if (entry.gateStep === 'code') {
      setCountdown(60);
    }
  }, [entry.gateStep]);

  React.useEffect(() => {
    if (entry.isLoading || countdown === 0) return;

    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [entry.isLoading, countdown]);

  // Auto-verify when code is complete
  const verifyTimeout = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    const codeString = entry.data.code.join('');

    if (verifyTimeout.current) {
      clearTimeout(verifyTimeout.current);
      verifyTimeout.current = null;
    }

    if (codeString.length === 6 && !entry.isLoading) {
      verifyTimeout.current = setTimeout(() => {
        entry.verifyCode();
      }, 300);
    }

    return () => {
      if (verifyTimeout.current) {
        clearTimeout(verifyTimeout.current);
      }
    };
  }, [entry.data.code, entry.isLoading]);

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !entry.isLoading) {
      entry.sendCode();
    }
  };

  const handleResend = () => {
    if (countdown === 0 && !entry.isLoading) {
      entry.resendCode();
      setCountdown(60);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        {(entry.gateStep === 'code' || entry.gateStep === 'waitlist') && !entry.waitlistSuccess && (
          <button
            onClick={entry.goBack}
            className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {entry.gateStep !== 'waitlist' && (
          <>
            {/* Section label with gold dot */}
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-white/30">
                {entry.gateStep === 'email' ? 'Prove yourself' : 'Verify'}
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
              {entry.gateStep === 'email' ? (
                <>
                  <span className="text-white">We don't let</span>
                  <br />
                  <span className="text-white/40">everyone in.</span>
                </>
              ) : (
                <>
                  <span className="text-white">Check your</span>
                  <br />
                  <span className="text-white/40">inbox.</span>
                </>
              )}
            </motion.h1>

            <motion.p
              className="text-[15px] text-white/40 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5, ease: EASE_PREMIUM }}
            >
              {entry.gateStep === 'email' ? (
                'Only builders. Prove you belong.'
              ) : (
                <>
                  Code sent to{' '}
                  <span className="text-white/60">{entry.data.email}</span>
                </>
              )}
            </motion.p>
          </>
        )}
      </div>

      {/* Email input */}
      <AnimatePresence mode="wait">
        {entry.gateStep === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: DURATION.quick, ease: EASE_PREMIUM }}
            className="space-y-5"
          >
            <input
              ref={inputRef}
              type="email"
              value={entry.data.email}
              onChange={(e) => entry.setEmail(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              placeholder="you@school.edu"
              className={cn(
                'w-full px-5 py-4 rounded-xl',
                'bg-white/[0.03] border-2 border-white/10',
                'text-[16px] text-white placeholder:text-white/25',
                'focus:outline-none focus:border-white/20 focus:bg-white/[0.05]',
                'transition-all duration-300'
              )}
            />

            {entry.error && (
              <p className="text-[13px] text-red-400">{entry.error}</p>
            )}

            <button
              onClick={entry.sendCode}
              disabled={entry.isLoading || !entry.data.email.trim()}
              className={cn(
                'group w-full py-4 rounded-xl font-medium transition-all duration-300',
                'bg-white text-[#030303]',
                'hover:bg-white/90',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              <span>{entry.isLoading ? 'Sending...' : 'Continue'}</span>
              {!entry.isLoading && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </motion.div>
        )}

        {entry.gateStep === 'code' && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: DURATION.quick, ease: EASE_PREMIUM }}
            className="space-y-8"
          >
            <OTPInput
              value={entry.data.code}
              onChange={entry.setCode}
              length={6}
              disabled={entry.isLoading}
              autoFocus
            />

            {entry.error && (
              <p className="text-[13px] text-red-400 text-center">
                {entry.error}
              </p>
            )}

            {entry.isLoading && (
              <div className="flex items-center justify-center gap-2 text-[13px] text-white/40">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white/10 animate-spin"
                  style={{ borderTopColor: '#FFD700' }}
                />
                <span>Verifying...</span>
              </div>
            )}

            {!entry.isLoading && (
              <p className="text-[13px] text-white/30 text-center">
                {countdown > 0 ? (
                  <>Resend in <span className="text-white/50">{countdown}s</span></>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-white/50 hover:text-white/70 transition-colors"
                  >
                    Resend code
                  </button>
                )}
              </p>
            )}
          </motion.div>
        )}

        {entry.gateStep === 'waitlist' && entry.waitlistSchool && (
          <motion.div
            key="waitlist"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: DURATION.quick, ease: EASE_PREMIUM }}
            className="space-y-8"
          >
            {entry.waitlistSuccess ? (
              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 mx-auto rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-[#FFD700]" />
                </motion.div>

                <div className="text-center space-y-3">
                  <h2 className={cn(clashDisplay, 'text-[1.75rem] font-medium text-white')}>
                    You're on the list
                  </h2>
                  <p className="text-[15px] text-white/40 leading-relaxed">
                    We'll notify you when {entry.waitlistSchool.name} launches on HIVE.
                  </p>
                </div>

                <button
                  onClick={entry.goBack}
                  className="w-full text-[13px] text-white/30 hover:text-white/50 transition-colors"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
                  <span className="text-[11px] uppercase tracking-[0.3em] text-white/30">
                    Coming soon
                  </span>
                </div>

                <div className="text-center space-y-4">
                  <h2 className={cn(clashDisplay, 'text-[1.75rem] md:text-[2rem] font-medium text-white leading-tight')}>
                    {entry.waitlistSchool.name} isn't<br />
                    <span className="text-white/40">on HIVE yet</span>
                  </h2>
                  <p className="text-[15px] text-white/40 leading-relaxed">
                    We'll notify you at{' '}
                    <span className="text-white/60">{entry.data.email}</span>
                    {' '}when it launches.
                  </p>
                </div>

                {entry.error && (
                  <p className="text-[13px] text-red-400 text-center">
                    {entry.error}
                  </p>
                )}

                <div className="space-y-4">
                  <button
                    onClick={entry.joinWaitlist}
                    disabled={entry.isLoading}
                    className={cn(
                      'group w-full py-4 rounded-xl font-medium transition-all duration-300',
                      'bg-[#FFD700] text-[#030303]',
                      'hover:bg-[#FFD700]/90',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'flex items-center justify-center gap-2'
                    )}
                  >
                    {entry.isLoading ? (
                      <>
                        <div
                          className="w-4 h-4 rounded-full border-2 border-black/20 animate-spin"
                          style={{ borderTopColor: '#030303' }}
                        />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        <span>Notify me</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={entry.goBack}
                    className="w-full text-[13px] text-white/30 hover:text-white/50 transition-colors py-2"
                  >
                    Try a different email
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
