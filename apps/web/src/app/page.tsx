'use client';

/**
 * HIVE Landing Page — 6-Digit Entry Code
 * UPDATED: Jan 2026
 *
 * Simple entry: user enters 6-digit code to create session
 * and proceed to onboarding at /enter
 *
 * - "Enter your code" headline
 * - 6-digit OTP input
 * - Redirects to /enter on success for role/identity setup
 * - "What is HIVE?" link
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  motion,
  NoiseOverlay,
  Logo,
  OTPInput,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { Lock, Clock } from 'lucide-react';

const EASE_PREMIUM = MOTION.ease.premium;

interface EntryCodeLockout {
  locked: boolean;
  remainingMinutes: number;
  attemptsRemaining?: number;
}

export default function LandingPage() {
  const router = useRouter();

  // Entry code state
  const [entryCode, setEntryCode] = useState<string[]>(['', '', '', '', '', '']);
  const [entryCodeError, setEntryCodeError] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [entryCodeLockout, setEntryCodeLockout] = useState<EntryCodeLockout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Word-by-word reveal for headline
  const headlineWords = ['Enter', 'your', 'code'];

  // Handle entry code verification
  const handleCodeComplete = useCallback(async (codeString: string) => {
    if (isVerifyingCode || entryCodeLockout?.locked) return;

    setIsVerifyingCode(true);
    setEntryCodeError('');

    try {
      const response = await fetch('/api/auth/verify-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: codeString }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle lockout
        if (result.code === 'LOCKED_OUT') {
          const remainingMinutes = parseInt(
            response.headers.get('Retry-After') || '0',
            10
          ) / 60;
          setEntryCodeLockout({
            locked: true,
            remainingMinutes: Math.ceil(remainingMinutes) || 15,
          });
          setEntryCode(['', '', '', '', '', '']);
          return;
        }

        // Handle attempts remaining
        const attemptsMatch = result.error?.match(/(\d+) attempt/);
        const attemptsRemaining = attemptsMatch ? parseInt(attemptsMatch[1], 10) : undefined;

        if (attemptsRemaining !== undefined) {
          setEntryCodeLockout({
            locked: false,
            remainingMinutes: 0,
            attemptsRemaining,
          });
        }

        setEntryCodeError(result.error || 'Invalid code');
        setEntryCode(['', '', '', '', '', '']);
        return;
      }

      // Success - session created, redirect to complete onboarding
      setEntryCodeLockout(null);

      // Check if user needs onboarding
      if (result.needsOnboarding) {
        router.push('/enter');
      } else {
        // Returning user - go to spaces
        router.push('/spaces');
      }
    } catch {
      setEntryCodeError('Unable to verify code');
      setEntryCode(['', '', '', '', '', '']);
    } finally {
      setIsVerifyingCode(false);
    }
  }, [isVerifyingCode, entryCodeLockout?.locked, router]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)] flex flex-col overflow-hidden">
      <NoiseOverlay />

      {/* Background gradient - subtle gold glow from top */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,215,0,0.03) 0%, transparent 50%)',
        }}
      />

      {/* Main — vertically centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_PREMIUM }}
          className="mb-16"
        >
          <Logo variant="mark" size="lg" />
        </motion.div>

        {/* Headline with word-by-word reveal */}
        <h1
          className="text-center text-[clamp(28px,6vw,48px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white max-w-[600px] mb-12"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {headlineWords.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.25em]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: MOTION.duration.slow,
                delay: 0.4 + i * 0.1,
                ease: EASE_PREMIUM,
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Entry Code Input */}
        {mounted && (
          <motion.div
            className="w-full max-w-[400px] space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: EASE_PREMIUM }}
          >
            <p className="text-[14px] text-white/50 text-center">
              Enter the 6-digit code you received to continue.
            </p>

            {/* Lockout State */}
            {entryCodeLockout?.locked && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Lock size={18} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] text-red-400 font-medium">
                    Too many attempts
                  </p>
                  <p className="text-[13px] text-white/50 flex items-center gap-1.5 mt-0.5">
                    <Clock size={12} />
                    Try again in {entryCodeLockout.remainingMinutes} minute
                    {entryCodeLockout.remainingMinutes !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>
            )}

            {/* OTP Input */}
            {!entryCodeLockout?.locked && (
              <div className="space-y-4">
                <motion.div
                  animate={entryCodeError ? { x: [-8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <OTPInput
                    value={entryCode}
                    onChange={setEntryCode}
                    onComplete={handleCodeComplete}
                    error={!!entryCodeError}
                    disabled={isVerifyingCode}
                    autoFocus
                    reduceMotion={false}
                  />
                </motion.div>

                {/* Error or loading */}
                {entryCodeError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[13px] text-red-400 text-center"
                  >
                    {entryCodeError}
                  </motion.p>
                )}
                {isVerifyingCode && !entryCodeError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    <span className="text-[13px] text-white/50">Verifying...</span>
                  </motion.div>
                )}

                {/* Attempts remaining indicator */}
                {entryCodeLockout && !entryCodeLockout.locked && entryCodeLockout.attemptsRemaining !== undefined && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[13px] text-amber-400/80 text-center"
                  >
                    {entryCodeLockout.attemptsRemaining} attempt
                    {entryCodeLockout.attemptsRemaining !== 1 ? 's' : ''} remaining
                  </motion.p>
                )}
              </div>
            )}

            {/* Help text */}
            <p className="text-[13px] text-white/40 text-center">
              Don&apos;t have a code? Contact your campus ambassador.
            </p>

            {/* Sign in link */}
            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-[13px] text-white/40 text-center">
                Already have an account?{' '}
                <Link
                  href="/signin"
                  className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        )}

        {/* What is HIVE? link */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2, ease: EASE_PREMIUM }}
        >
          <Link
            href="/about"
            className="text-[14px] text-white/40 hover:text-white/60 transition-colors"
          >
            What is HIVE?
          </Link>
        </motion.div>
      </main>

      {/* Footer — minimal */}
      <footer className="py-6 px-6 flex justify-between items-center text-[12px] text-white/30">
        <span>HIVE</span>
        <div className="flex gap-4">
          <Link
            href="/legal/terms"
            className="hover:text-white/50 transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/legal/privacy"
            className="hover:text-white/50 transition-colors"
          >
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
