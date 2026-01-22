'use client';

/**
 * HIVE Landing Page — Access Gate + Email Hero
 * REDESIGNED: Jan 2026
 *
 * Entry point that respects access code gate:
 * - If NEXT_PUBLIC_ACCESS_GATE_ENABLED=true and not passed, show access code
 * - After access code verified (or if disabled), show email input
 * - "Your campus is already here." headline with word reveal
 * - "What is HIVE?" link
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  motion,
  NoiseOverlay,
  Logo,
  Button,
  OTPInput,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { Lock, Clock } from 'lucide-react';

const EASE_PREMIUM = MOTION.ease.premium;

// Campus configuration
const CAMPUS_CONFIG = {
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
};

const ACCESS_GATE_ENABLED = process.env.NEXT_PUBLIC_ACCESS_GATE_ENABLED === 'true';
const ACCESS_GATE_PASSED_KEY = 'hive_access_gate_passed';

interface AccessCodeLockout {
  locked: boolean;
  remainingMinutes: number;
  attemptsRemaining?: number;
}

export default function LandingPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Access code state - start with gate active, check localStorage on mount
  const [accessCodePassed, setAccessCodePassed] = useState(!ACCESS_GATE_ENABLED);
  const [accessCode, setAccessCode] = useState<string[]>(['', '', '', '', '', '']);
  const [accessCodeError, setAccessCodeError] = useState('');
  const [isVerifyingAccessCode, setIsVerifyingAccessCode] = useState(false);
  const [accessCodeLockout, setAccessCodeLockout] = useState<AccessCodeLockout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Waitlist state
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const waitlistInputRef = useRef<HTMLInputElement>(null);

  // Check localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (ACCESS_GATE_ENABLED) {
      const passed = localStorage.getItem(ACCESS_GATE_PASSED_KEY) === 'true';
      setAccessCodePassed(passed);
    }
  }, []);

  // Word-by-word reveal for headline
  const headlineWords = accessCodePassed
    ? ['Your', 'campus', 'is', 'already', 'here.']
    : ['Enter', 'access', 'code'];

  // Handle waitlist signup
  const handleWaitlistSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!waitlistEmail.trim() || waitlistSubmitting) return;

    setWaitlistSubmitting(true);
    setWaitlistError('');

    try {
      const response = await fetch('/api/waitlist/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setWaitlistSuccess(true);
      } else {
        setWaitlistError(result.error || 'Something went wrong');
      }
    } catch {
      setWaitlistError('Unable to join waitlist');
    } finally {
      setWaitlistSubmitting(false);
    }
  }, [waitlistEmail, waitlistSubmitting]);

  // Focus waitlist input when shown
  useEffect(() => {
    if (showWaitlist && waitlistInputRef.current) {
      waitlistInputRef.current.focus();
    }
  }, [showWaitlist]);

  // Handle access code verification
  const handleAccessCodeComplete = useCallback(async (codeString: string) => {
    if (isVerifyingAccessCode || accessCodeLockout?.locked) return;

    setIsVerifyingAccessCode(true);
    setAccessCodeError('');

    try {
      const response = await fetch('/api/auth/verify-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeString }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle lockout
        if (result.lockout) {
          setAccessCodeLockout({
            locked: true,
            remainingMinutes: result.lockout.remainingMinutes ?? 15,
          });
          setAccessCode(['', '', '', '', '', '']);
          return;
        }

        // Handle attempts remaining
        const attemptsRemaining = result.attemptsRemaining;
        if (typeof attemptsRemaining === 'number') {
          setAccessCodeLockout({
            locked: false,
            remainingMinutes: 0,
            attemptsRemaining,
          });
        }

        setAccessCodeError(result.error || 'Invalid code');
        setAccessCode(['', '', '', '', '', '']);
        return;
      }

      // Success - persist and transition
      localStorage.setItem(ACCESS_GATE_PASSED_KEY, 'true');
      setAccessCodeLockout(null);
      setAccessCodePassed(true);
    } catch {
      setAccessCodeError('Unable to verify code');
      setAccessCode(['', '', '', '', '', '']);
    } finally {
      setIsVerifyingAccessCode(false);
    }
  }, [isVerifyingAccessCode, accessCodeLockout?.locked]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');

    const fullEmail = `${email.trim()}@${CAMPUS_CONFIG.domain}`;

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to /enter with email state
        const params = new URLSearchParams({
          email: fullEmail,
          state: 'code',
        });
        router.push(`/enter?${params.toString()}`);
      } else {
        setError(data.error || 'Unable to send verification code');
        setIsSubmitting(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Focus input on mount (after animation) - only for email input
  useEffect(() => {
    if (!accessCodePassed) return; // Don't auto-focus if access code needed
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 1200);
    return () => clearTimeout(timer);
  }, [accessCodePassed]);

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

        {/* Access Code Input - shown when gate enabled and not passed */}
        {mounted && !accessCodePassed && (
          <motion.div
            className="w-full max-w-[400px] space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: EASE_PREMIUM }}
          >
            <p className="text-[14px] text-white/50 text-center">
              HIVE is currently invite-only. Enter your 6-digit access code to continue.
            </p>

            {/* Lockout State */}
            {accessCodeLockout?.locked && (
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
                    Try again in {accessCodeLockout.remainingMinutes} minute
                    {accessCodeLockout.remainingMinutes !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>
            )}

            {/* OTP Input */}
            {!accessCodeLockout?.locked && (
              <div className="space-y-4">
                <motion.div
                  animate={accessCodeError ? { x: [-8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <OTPInput
                    value={accessCode}
                    onChange={setAccessCode}
                    onComplete={handleAccessCodeComplete}
                    error={!!accessCodeError}
                    disabled={isVerifyingAccessCode}
                    autoFocus
                    reduceMotion={false}
                  />
                </motion.div>

                {/* Error or loading */}
                {accessCodeError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[13px] text-red-400 text-center"
                  >
                    {accessCodeError}
                  </motion.p>
                )}
                {isVerifyingAccessCode && !accessCodeError && (
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
                {accessCodeLockout && !accessCodeLockout.locked && accessCodeLockout.attemptsRemaining !== undefined && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[13px] text-amber-400/80 text-center"
                  >
                    {accessCodeLockout.attemptsRemaining} attempt
                    {accessCodeLockout.attemptsRemaining !== 1 ? 's' : ''} remaining
                  </motion.p>
                )}
              </div>
            )}

            {/* Waitlist section */}
            <div className="space-y-3">
              {!showWaitlist && !waitlistSuccess && (
                <p className="text-[13px] text-white/40 text-center">
                  Don&apos;t have a code?{' '}
                  <button
                    type="button"
                    onClick={() => setShowWaitlist(true)}
                    className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Get notified when we open
                  </button>
                </p>
              )}

              {/* Waitlist success state */}
              {waitlistSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 py-3"
                >
                  <span className="text-[14px] text-emerald-400">You&apos;re on the list</span>
                </motion.div>
              )}

              {/* Waitlist form */}
              {showWaitlist && !waitlistSuccess && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleWaitlistSubmit}
                  className="space-y-3"
                >
                  <p className="text-[13px] text-white/50 text-center">
                    We&apos;ll let you know when HIVE opens up.
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={waitlistInputRef}
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => {
                        setWaitlistEmail(e.target.value);
                        setWaitlistError('');
                      }}
                      placeholder="your@email.com"
                      disabled={waitlistSubmitting}
                      className="flex-1 h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 disabled:opacity-50"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={waitlistSubmitting || !waitlistEmail.trim()}
                      loading={waitlistSubmitting}
                      className="h-11 px-4"
                    >
                      Notify me
                    </Button>
                  </div>
                  {waitlistError && (
                    <p className="text-[12px] text-red-400 text-center">{waitlistError}</p>
                  )}
                </motion.form>
              )}
            </div>
          </motion.div>
        )}

        {/* Email input form - shown after access code passed */}
        {mounted && accessCodePassed && (
          <motion.form
            onSubmit={handleSubmit}
            className="w-full max-w-[400px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: EASE_PREMIUM }}
          >
            {/* Email input with domain suffix */}
            <motion.div
              className={`
                flex items-center h-14 rounded-2xl border transition-all duration-200
                ${isFocused ? 'bg-white/[0.06] border-white/20' : 'bg-white/[0.03] border-white/[0.08]'}
                ${error ? 'border-red-500/50 bg-red-500/[0.03]' : ''}
              `}
              animate={error ? { x: [-8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <input
                ref={inputRef}
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="you"
                disabled={isSubmitting}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 h-full px-5 bg-transparent text-[16px] text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
              />
              <span className="pr-5 text-[16px] text-white/40 select-none">
                @{CAMPUS_CONFIG.domain}
              </span>
            </motion.div>

            {/* Error message */}
            {error && (
              <motion.p
                className="mt-3 text-[13px] text-red-400"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit button */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0, ease: EASE_PREMIUM }}
            >
              <Button
                type="submit"
                variant="cta"
                size="lg"
                disabled={isSubmitting || !email.trim()}
                loading={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Sending...' : 'Enter →'}
              </Button>
            </motion.div>
          </motion.form>
        )}

        {/* Different school link - only show after access code */}
        {mounted && accessCodePassed && (
          <motion.p
            className="mt-6 text-[14px] text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1, ease: EASE_PREMIUM }}
          >
            Not at {CAMPUS_CONFIG.domain.split('.')[0].toUpperCase()}?{' '}
            <Link
              href="/schools"
              className="text-white/60 hover:text-white/80 transition-colors underline-offset-2 hover:underline"
            >
              Find your campus
            </Link>
          </motion.p>
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
