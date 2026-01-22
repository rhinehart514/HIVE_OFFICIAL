'use client';

/**
 * HIVE Landing Page — Inline Email Hero
 * REDESIGNED: Jan 2026
 *
 * Simple, confident entry point:
 * - "Your campus is already here." headline with word reveal
 * - Inline email input with domain suffix
 * - "Enter →" button
 * - "What is HIVE?" link
 * - No stats, no code gate
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  motion,
  NoiseOverlay,
  Logo,
  Button,
  MOTION,
} from '@hive/ui/design-system/primitives';

const EASE_PREMIUM = MOTION.ease.premium;

// Campus configuration
const CAMPUS_CONFIG = {
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
};

export default function LandingPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Word-by-word reveal for headline
  const headlineWords = ['Your', 'campus', 'is', 'already', 'here.'];

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

  // Focus input on mount (after animation)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

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

        {/* Email input form */}
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

        {/* Different school link */}
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
