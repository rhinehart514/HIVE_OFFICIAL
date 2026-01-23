'use client';

/**
 * Sign In Page — Returning Users
 *
 * Two-step flow:
 * 1. Enter handle → sends magic code to school email
 * 2. Enter 6-digit code → creates session
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  motion,
  NoiseOverlay,
  Logo,
  OTPInput,
  Button,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { ArrowLeft, Mail, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE_PREMIUM = MOTION.ease.premium;

type SignInStep = 'handle' | 'code';

interface Lockout {
  locked: boolean;
  remainingMinutes: number;
  attemptsRemaining?: number;
}

export default function SignInPage() {
  const router = useRouter();

  // State
  const [step, setStep] = useState<SignInStep>('handle');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockout, setLockout] = useState<Lockout | null>(null);

  // Request magic code
  const handleRequestCode = useCallback(async () => {
    if (!handle.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/request-signin-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim().toLowerCase() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Unable to send code');
        return;
      }

      // Success - move to code entry
      setEmail(result.email); // Masked email like "j***@buffalo.edu"
      setStep('code');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [handle, isLoading]);

  // Verify magic code
  const handleVerifyCode = useCallback(async (codeString: string) => {
    if (isLoading || lockout?.locked) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-signin-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          handle: handle.trim().toLowerCase(),
          code: codeString,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle lockout
        if (result.code === 'LOCKED_OUT') {
          const remainingMinutes = parseInt(
            response.headers.get('Retry-After') || '0',
            10
          ) / 60;
          setLockout({
            locked: true,
            remainingMinutes: Math.ceil(remainingMinutes) || 15,
          });
          setCode(['', '', '', '', '', '']);
          return;
        }

        // Handle attempts remaining
        const attemptsMatch = result.error?.match(/(\d+) attempt/);
        const attemptsRemaining = attemptsMatch ? parseInt(attemptsMatch[1], 10) : undefined;

        if (attemptsRemaining !== undefined) {
          setLockout({
            locked: false,
            remainingMinutes: 0,
            attemptsRemaining,
          });
        }

        setError(result.error || 'Invalid code');
        setCode(['', '', '', '', '', '']);
        return;
      }

      // Success - redirect to spaces
      router.push('/spaces');
    } catch {
      setError('Something went wrong. Try again.');
      setCode(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  }, [handle, isLoading, lockout?.locked, router]);

  // Go back to handle step
  const handleBack = useCallback(() => {
    setStep('handle');
    setCode(['', '', '', '', '', '']);
    setError('');
    setLockout(null);
  }, []);

  // Handle input keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && handle.trim()) {
        handleRequestCode();
      }
    },
    [handle, handleRequestCode]
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-[var(--color-text-primary)] flex flex-col overflow-hidden">
      <NoiseOverlay />

      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,215,0,0.03) 0%, transparent 50%)',
        }}
      />

      {/* Main */}
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

        {/* Content */}
        <motion.div
          className="w-full max-w-[400px] space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE_PREMIUM }}
        >
          {step === 'handle' ? (
            <>
              {/* Handle step */}
              <div className="text-center space-y-2">
                <h1
                  className="text-[clamp(24px,5vw,32px)] font-semibold text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Welcome back
                </h1>
                <p className="text-[14px] text-white/50">
                  Enter your handle to sign in
                </p>
              </div>

              {/* Handle input */}
              <div className="space-y-4">
                <div
                  className={cn(
                    'flex items-center h-14 rounded-2xl border transition-all duration-200',
                    'bg-white/[0.03] border-white/[0.08]',
                    'focus-within:bg-white/[0.05] focus-within:border-white/20',
                    error && 'border-red-500/30 bg-red-500/[0.03]'
                  )}
                >
                  <span className="pl-4 text-white/30">@</span>
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    onKeyDown={handleKeyDown}
                    placeholder="yourhandle"
                    disabled={isLoading}
                    autoFocus
                    className={cn(
                      'w-full h-full px-2 bg-transparent text-[16px] text-white',
                      'placeholder:text-white/25',
                      'focus:outline-none',
                      'disabled:opacity-50'
                    )}
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[13px] text-red-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  variant="default"
                  size="lg"
                  onClick={handleRequestCode}
                  disabled={!handle.trim() || isLoading}
                  loading={isLoading}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>

              {/* Help text */}
              <p className="text-[13px] text-white/40 text-center">
                We&apos;ll send a code to your school email
              </p>

              {/* Back to entry */}
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-[13px] text-white/40 text-center">
                  New to HIVE?{' '}
                  <Link
                    href="/"
                    className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Enter with a code
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Code step */}
              <div className="text-center space-y-2">
                <h1
                  className="text-[clamp(24px,5vw,32px)] font-semibold text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Check your email
                </h1>
                <p className="text-[14px] text-white/50">
                  We sent a code to{' '}
                  <span className="text-white/70">{email}</span>
                </p>
              </div>

              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/60 transition-colors"
              >
                <ArrowLeft size={14} />
                Use a different handle
              </button>

              {/* Lockout state */}
              {lockout?.locked && (
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
                      Try again in {lockout.remainingMinutes} minute
                      {lockout.remainingMinutes !== 1 ? 's' : ''}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* OTP Input */}
              {!lockout?.locked && (
                <div className="space-y-4">
                  <motion.div
                    animate={error ? { x: [-8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <OTPInput
                      value={code}
                      onChange={setCode}
                      onComplete={handleVerifyCode}
                      error={!!error}
                      disabled={isLoading}
                      autoFocus
                      reduceMotion={false}
                    />
                  </motion.div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[13px] text-red-400 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                  {isLoading && !error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                      <span className="text-[13px] text-white/50">Verifying...</span>
                    </motion.div>
                  )}

                  {/* Attempts remaining */}
                  {lockout && !lockout.locked && lockout.attemptsRemaining !== undefined && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[13px] text-amber-400/80 text-center"
                    >
                      {lockout.attemptsRemaining} attempt
                      {lockout.attemptsRemaining !== 1 ? 's' : ''} remaining
                    </motion.p>
                  )}
                </div>
              )}

              {/* Resend code */}
              <p className="text-[13px] text-white/40 text-center">
                Didn&apos;t receive it?{' '}
                <button
                  onClick={handleRequestCode}
                  disabled={isLoading}
                  className="text-white/60 hover:text-white transition-colors underline underline-offset-2 disabled:opacity-50"
                >
                  Resend code
                </button>
              </p>
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
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
