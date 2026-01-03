'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import { toast } from '@hive/ui';
import { AuthShell, AuthShellStatic } from '@/components/auth/auth-shell';

export const dynamic = 'force-dynamic';

// Campus configuration
const CAMPUS_CONFIG = {
  id: process.env.NEXT_PUBLIC_CAMPUS_ID || 'ub-buffalo',
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
  name: process.env.NEXT_PUBLIC_CAMPUS_NAME || 'UB',
  fullName: process.env.NEXT_PUBLIC_CAMPUS_FULL_NAME || 'University at Buffalo',
  schoolId: process.env.NEXT_PUBLIC_SCHOOL_ID || 'ub-buffalo',
};

/**
 * Parse API error responses for better user feedback
 */
function parseApiError(error: string, status?: number): string {
  const lowerError = error.toLowerCase();

  // Rate limiting
  if (status === 429 || lowerError.includes('rate limit') || lowerError.includes('too many')) {
    return 'Too many attempts. Please wait a minute before trying again.';
  }

  // Domain mismatch
  if (lowerError.includes('domain') || lowerError.includes('buffalo.edu')) {
    return `Please use your ${CAMPUS_CONFIG.domain} email`;
  }

  // School not found
  if (lowerError.includes('school') && (lowerError.includes('not found') || lowerError.includes('inactive'))) {
    return 'This school is not currently supported';
  }

  // Service unavailable
  if (status === 503 || lowerError.includes('service') || lowerError.includes('unavailable')) {
    return 'Service temporarily unavailable. Please try again in a few minutes.';
  }

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }

  // Invalid code
  if (lowerError.includes('invalid') && lowerError.includes('code')) {
    // Extract remaining attempts if present
    const attemptsMatch = error.match(/(\d+)\s*attempt/i);
    if (attemptsMatch) {
      return `Invalid code. ${attemptsMatch[1]} attempt${attemptsMatch[1] === '1' ? '' : 's'} remaining.`;
    }
    return 'Invalid code. Please try again.';
  }

  // Expired code
  if (lowerError.includes('expired')) {
    return 'Code expired. Please request a new one.';
  }

  // Max attempts
  if (lowerError.includes('max') || lowerError.includes('locked')) {
    return 'Too many failed attempts. Please request a new code.';
  }

  // Default
  return error || 'Something went wrong. Please try again.';
}

type LoginState = 'input' | 'sending' | 'code' | 'verifying' | 'success';

// Resend cooldowns - capped at 60s to avoid punishing users for typos
const RESEND_COOLDOWNS = [30, 45, 60, 60]; // seconds (max 60s)

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// Animation variants
const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_PREMIUM },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const successVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_PREMIUM },
  },
};

function LoginPageFallback() {
  return (
    <AuthShellStatic>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1
            className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em]"
            style={{ color: '#FFFFFF' }}
          >
            Enter HIVE
          </h1>
          <p
            className="text-[14px]"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            Loading...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          />
        </div>
      </div>
    </AuthShellStatic>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/spaces/browse';
  const isNewUser = searchParams.get('new') === 'true';
  const sessionExpired = searchParams.get('expired') === 'true';
  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState('');

  // Show session expiry toast on mount if redirected due to expired session
  useEffect(() => {
    if (sessionExpired) {
      toast.info('Session expired. Please sign in again.');
      // Clean up URL without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('expired');
      window.history.replaceState({}, '', url.toString());
    }
  }, [sessionExpired]);
  const [error, setError] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<LoginState>('input');

  // OTP state
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Resend state
  const [resendCount, setResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Refs
  const emailInputRef = useRef<HTMLInputElement>(null);

  const fullEmail = email.includes('@') ? email : `${email}@${CAMPUS_CONFIG.domain}`;

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle sending verification code
  const handleSendCode = async () => {
    if (!email) {
      setError('Enter your email');
      return;
    }

    const emailToSend = fullEmail;
    if (!emailToSend.includes('@') || !emailToSend.includes('.')) {
      setError('Enter a valid email address');
      return;
    }

    const emailDomain = emailToSend.split('@')[1];
    if (emailDomain !== CAMPUS_CONFIG.domain) {
      setError(`Please use your ${CAMPUS_CONFIG.domain} email`);
      return;
    }

    setLoginState('sending');
    setError(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToSend,
          schoolId: CAMPUS_CONFIG.schoolId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = parseApiError(data.error || 'Failed to send code', response.status);
        throw new Error(errorMessage);
      }

      // Store email for reference
      window.localStorage.setItem('hive_pending_email', emailToSend);

      // Set cooldown for resend
      const cooldownDuration = RESEND_COOLDOWNS[Math.min(resendCount, RESEND_COOLDOWNS.length - 1)];
      setResendCooldown(cooldownDuration);
      setResendCount((prev) => prev + 1);

      setLoginState('code');
    } catch (err) {
      console.error('Send code error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unable to send code';
      setError(parseApiError(errorMessage));
      setLoginState('input');
    }
  };

  // Handle code verification
  const handleVerifyCode = async (codeString: string) => {
    setLoginState('verifying');
    setCodeError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: fullEmail,
          code: codeString,
          schoolId: CAMPUS_CONFIG.schoolId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCode(['', '', '', '', '', '']);
        setCodeError(parseApiError(data.error || 'Invalid code', response.status));
        setLoginState('code');
        return;
      }

      // Success!
      setLoginState('success');

      // Redirect after success animation
      // New users → onboarding, returning users → feed (or redirect URL)
      setTimeout(() => {
        if (data.needsOnboarding) {
          router.push(`/onboarding?redirect=${encodeURIComponent(redirectTo)}`);
        } else {
          router.push(redirectTo);
        }
      }, 1800);

    } catch (err) {
      console.error('Verify error:', err);
      setCode(['', '', '', '', '', '']);
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setCodeError(parseApiError(errorMessage));
      setLoginState('code');
    }
  };

  // Handle OTP input change
  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setCodeError(null);

    // Auto-focus next input
    if (digit && index < 5) {
      const nextInput = document.querySelector<HTMLInputElement>(`input[data-index="${index + 1}"]`);
      nextInput?.focus();
    }

    // Auto-submit when all 6 digits entered
    const codeString = newCode.join('');
    if (codeString.length === 6 && !newCode.includes('')) {
      handleVerifyCode(codeString);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.querySelector<HTMLInputElement>(`input[data-index="${index - 1}"]`);
      prevInput?.focus();
    }
  };

  const handleBackToInput = () => {
    setLoginState('input');
    setError(null);
    setCode(['', '', '', '', '', '']);
    setCodeError(null);
  };

  // Format cooldown as mm:ss
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
          {/* Success State - Minimal */}
          {loginState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              {/* Simple text with inline check */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE_PREMIUM }}
                className="space-y-6"
              >
                {/* Main headline with check */}
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                      delay: 0.2
                    }}
                  >
                    <Check
                      className="w-7 h-7"
                      strokeWidth={3}
                      style={{ color: '#FFD700' }}
                    />
                  </motion.div>
                  <h1
                    className="text-3xl font-semibold tracking-[-0.02em]"
                    style={{ color: '#FFFFFF' }}
                  >
                    You&apos;re in
                  </h1>
                </div>

                {/* Subtext */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="text-[15px]"
                  style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                >
                  {isNewUser ? 'Setting up your account...' : 'Taking you home...'}
                </motion.p>

                {/* Minimal loading dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center gap-1.5 pt-4"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                      }}
                      className="w-1 h-1 rounded-full bg-white/60"
                    />
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Code Entry State */}
          {(loginState === 'code' || loginState === 'verifying') && (
            <motion.div
              key="code"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="text-center space-y-4">
                <h1
                  className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em]"
                  style={{ color: 'var(--hive-text-primary)' }}
                >
                  Check your email
                </h1>
                <p className="text-[15px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  We sent a 6-digit code to{' '}
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{fullEmail}</span>
                </p>
              </motion.div>

              {/* OTP Input - Buttery Animated */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const isFilled = !!code[index];
                    const filledCount = code.filter(Boolean).length;
                    // Progressive gold intensity based on how many digits filled
                    const goldIntensity = filledCount / 6;

                    return (
                      <motion.div
                        key={index}
                        initial={shouldReduceMotion ? {} : { opacity: 0, y: 12, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: index * 0.06,
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        className="relative"
                      >
                        {/* Glow effect behind filled inputs */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{
                            opacity: isFilled ? 0.4 + (goldIntensity * 0.3) : 0,
                            scale: isFilled ? 1.2 : 0.8
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                          }}
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{
                            background: `radial-gradient(circle, rgba(255, 215, 0, ${0.15 + goldIntensity * 0.1}) 0%, transparent 70%)`,
                            filter: 'blur(8px)',
                          }}
                        />

                        <motion.input
                          data-index={index}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={code[index]}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          disabled={loginState === 'verifying'}
                          autoFocus={index === 0}
                          aria-label={`Digit ${index + 1} of 6`}
                          animate={{
                            scale: isFilled ? [1, 1.1, 1] : 1,
                            backgroundColor: isFilled
                              ? `rgba(255, 215, 0, ${0.08 + goldIntensity * 0.04})`
                              : 'rgba(255, 255, 255, 0.03)',
                            borderColor: codeError
                              ? 'var(--hive-status-error)'
                              : isFilled
                                ? `rgba(255, 215, 0, ${0.4 + goldIntensity * 0.3})`
                                : 'rgba(255, 255, 255, 0.1)',
                          }}
                          transition={{
                            scale: {
                              type: "spring",
                              stiffness: 500,
                              damping: 15,
                              mass: 0.5
                            },
                            backgroundColor: {
                              duration: 0.3,
                              ease: [0.22, 1, 0.36, 1]
                            },
                            borderColor: {
                              duration: 0.2,
                              ease: "easeOut"
                            }
                          }}
                          className="relative w-11 sm:w-12 h-14 sm:h-16 text-center text-2xl sm:text-3xl font-semibold rounded-xl outline-none border disabled:opacity-50 disabled:cursor-not-allowed focus:border-white/40"
                          style={{
                            color: isFilled
                              ? `rgb(255, ${215 + (1 - goldIntensity) * 40}, ${(1 - goldIntensity) * 100})`
                              : 'rgba(255, 255, 255, 0.8)',
                            textShadow: isFilled
                              ? `0 0 ${8 + goldIntensity * 12}px rgba(255, 215, 0, ${0.3 + goldIntensity * 0.3})`
                              : 'none',
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-1.5 pt-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <motion.div
                      key={index}
                      animate={{
                        backgroundColor: code[index]
                          ? '#FFD700'
                          : 'rgba(255, 255, 255, 0.15)',
                        scale: code[index] ? 1 : 0.8,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25
                      }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {codeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-sm text-center"
                      style={{ color: 'var(--hive-status-error)' }}
                    >
                      {codeError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {loginState === 'verifying' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2"
                    style={{ color: 'var(--hive-gold)' }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Verifying</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Resend + Back */}
              <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
                {resendCooldown > 0 ? (
                  <p className="text-sm" style={{ color: 'var(--hive-text-disabled)' }}>
                    Resend in {formatCooldown(resendCooldown)}
                  </p>
                ) : (
                  <button
                    onClick={handleSendCode}
                    disabled={loginState === 'verifying'}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: 'var(--hive-gold)' }}
                  >
                    Resend code
                  </button>
                )}
                <button
                  onClick={handleBackToInput}
                  disabled={loginState === 'verifying'}
                  className="text-sm transition-colors inline-flex items-center gap-1 hover:opacity-100"
                  style={{ color: 'var(--hive-text-subtle)' }}
                  aria-label="Go back to email input"
                >
                  <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                  Different email
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Email Input State */}
          {(loginState === 'input' || loginState === 'sending') && (
            <motion.div
              key="input"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              {/* Header - Unified, confident */}
              <motion.div variants={itemVariants} className="text-center space-y-2">
                <h1
                  className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em]"
                  style={{ color: '#FFFFFF' }}
                >
                  Enter HIVE
                </h1>
                <p className="text-[14px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  Your <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{CAMPUS_CONFIG.name}</span> email is your key
                </p>
              </motion.div>

              {/* Form - Tighter */}
              <motion.div variants={itemVariants} className="space-y-4">
                {/* Email Input - Clean box style */}
                <div className="space-y-2">
                  <div
                    className="relative flex items-center rounded-xl transition-all duration-200"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: error
                        ? '1px solid var(--hive-status-error)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <input
                      ref={emailInputRef}
                      type="text"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && loginState === 'input') {
                          handleSendCode();
                        }
                      }}
                      placeholder="yourname"
                      disabled={loginState === 'sending'}
                      aria-label="Email username"
                      aria-describedby="email-domain"
                      className="flex-1 bg-transparent px-4 py-3.5 text-[15px] outline-none transition-all duration-200 disabled:opacity-50 placeholder:text-white/25"
                      style={{ color: 'var(--hive-text-primary)' }}
                    />
                    <span
                      id="email-domain"
                      className="pr-4 text-[15px] pointer-events-none select-none"
                      style={{ color: 'rgba(255, 255, 255, 0.35)' }}
                    >
                      @{CAMPUS_CONFIG.domain}
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-[13px] px-1"
                        style={{ color: 'var(--hive-status-error)' }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit Button - White Pill */}
                <button
                  onClick={handleSendCode}
                  disabled={loginState === 'sending' || !email.trim()}
                  className="group w-full py-3.5 px-6 rounded-xl font-medium text-[15px] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: email.trim() ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.06)',
                    color: email.trim() ? '#000' : 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {loginState === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <svg
                        className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </motion.div>

              {/* Footer - Minimal */}
              <motion.div variants={itemVariants} className="text-center pt-2">
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                  By continuing, you agree to our{' '}
                  <a
                    href="/legal/terms"
                    className="transition-colors hover:text-white/50"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    Terms
                  </a>{' '}
                  and{' '}
                  <a
                    href="/legal/privacy"
                    className="transition-colors hover:text-white/50"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    Privacy
                  </a>
                </p>
              </motion.div>

              {/* Dev Login - Only in development */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div
                  variants={itemVariants}
                  className="pt-6 border-t"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
                >
                  <p className="text-[10px] text-center mb-2 font-mono" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
                    DEV
                  </p>
                  <div className="flex gap-2 justify-center">
                    {[
                      { email: 'jwrhineh@buffalo.edu', label: 'Existing' },
                      { email: 'newuser@buffalo.edu', label: 'New' },
                    ].map(({ email: devEmail, label }) => (
                      <button
                        key={devEmail}
                        onClick={async () => {
                          setLoginState('sending');
                          try {
                            const res = await fetch('/api/dev-auth', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ email: devEmail }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              setLoginState('success');
                              setTimeout(() => {
                                if (data.needsOnboarding) {
                                  router.push(`/onboarding?redirect=${encodeURIComponent(redirectTo)}`);
                                } else {
                                  router.push(redirectTo);
                                }
                              }, 1800);
                            } else {
                              setError(data.error || 'Dev login failed');
                              setLoginState('input');
                            }
                          } catch (err) {
                            setError('Dev login failed');
                            setLoginState('input');
                          }
                        }}
                        disabled={loginState === 'sending'}
                        className="px-3 py-1.5 text-[11px] rounded-lg transition-all hover:bg-white/[0.06] disabled:opacity-50"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          color: 'rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
      </AnimatePresence>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}
