'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, Check, Mail } from 'lucide-react';
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

// Progressive resend cooldowns
const RESEND_COOLDOWNS = [30, 60, 120, 300]; // seconds

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
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Sign in
          </h1>
          <p className="text-sm text-zinc-500">
            Loading...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      </div>
    </AuthShellStatic>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/feed';
  const isNewUser = searchParams.get('new') === 'true';
  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState('');
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
      }, 1200);

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
          {/* Success State */}
          {loginState === 'success' && (
            <motion.div
              key="success"
              variants={successVariants}
              initial="initial"
              animate="animate"
              className="text-center space-y-8"
            >
              {/* Animated checkmark with gold ring */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE_PREMIUM }}
                className="relative w-20 h-20 mx-auto"
              >
                {/* Outer ring with glow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute inset-0 rounded-full border-2 border-gold-500/40"
                  style={{ boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)' }}
                />
                {/* Inner filled circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: EASE_PREMIUM }}
                  className="absolute inset-2 rounded-full bg-gold-500/10 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: EASE_PREMIUM }}
                  >
                    <Check className="w-8 h-8 text-gold-500" strokeWidth={2.5} />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Welcome text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-2"
              >
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  You&apos;re in.
                </h1>
                <p className="text-zinc-500 text-sm">
                  {isNewUser ? 'Let\'s get you set up' : 'Welcome back'}
                </p>
              </motion.div>

              {/* Subtle loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-1.5 pt-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-gold-500"
                  />
                ))}
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
              <motion.div variants={itemVariants} className="text-center space-y-3">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-gold-500" />
                  </div>
                </div>
                <h1 className="text-2xl font-semibold text-white">
                  Check your email
                </h1>
                <p className="text-sm text-zinc-500">
                  We sent a code to <span className="text-zinc-400">{fullEmail}</span>
                </p>
              </motion.div>

              {/* OTP Input */}
              <motion.div variants={itemVariants} className="space-y-4">
                {/* Responsive: smaller gap and inputs on small screens */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <motion.input
                      key={index}
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
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
                      className={`
                        w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-semibold
                        bg-zinc-900/50 border rounded-xl
                        text-white
                        outline-none transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${code[index] ? 'border-gold-500 bg-gold-500/5' : 'border-zinc-800'}
                        focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20
                        focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                        ${codeError ? 'border-red-500 shake' : ''}
                      `}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {codeError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-sm text-red-400 text-center"
                    >
                      {codeError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {loginState === 'verifying' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 text-gold-500"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Verifying</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Resend + Back */}
              <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-zinc-600">
                    Resend in {formatCooldown(resendCooldown)}
                  </p>
                ) : (
                  <button
                    onClick={handleSendCode}
                    disabled={loginState === 'verifying'}
                    className="text-sm text-gold-500 hover:text-gold-400 transition-colors"
                  >
                    Resend code
                  </button>
                )}
                <button
                  onClick={handleBackToInput}
                  disabled={loginState === 'verifying'}
                  className="text-sm text-zinc-500 hover:text-white transition-colors inline-flex items-center gap-1"
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
              className="space-y-8"
            >
              {/* Header */}
              <motion.div variants={itemVariants} className="text-center space-y-2">
                <h1 className="text-3xl font-semibold text-white tracking-tight">
                  {isNewUser ? 'Join HIVE' : 'Sign in to HIVE'}
                </h1>
                <p className="text-sm text-zinc-500">
                  {isNewUser ? (
                    <>Your <span className="text-zinc-400">{CAMPUS_CONFIG.name}</span> email is your key</>
                  ) : (
                    <>Use your <span className="text-zinc-400">{CAMPUS_CONFIG.name}</span> email</>
                  )}
                </p>
              </motion.div>

              {/* Form */}
              <motion.div variants={itemVariants} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <div className={`
                    flex items-center bg-zinc-900/50 border rounded-xl
                    transition-all duration-200
                    ${error ? 'border-red-500' : 'border-zinc-800'}
                    focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/20
                  `}>
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
                      placeholder="you"
                      disabled={loginState === 'sending'}
                      aria-label="Email username"
                      aria-describedby="email-domain"
                      className="
                        flex-1 bg-transparent px-4 py-3.5 text-white text-base
                        placeholder:text-zinc-600
                        outline-none disabled:opacity-50
                      "
                    />
                    <span id="email-domain" className="pr-4 text-zinc-500 text-sm">
                      @{CAMPUS_CONFIG.domain}
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm text-red-400 px-1"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit Button */}
                <motion.button
                  onClick={handleSendCode}
                  disabled={loginState === 'sending' || !email.trim()}
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  className={`
                    w-full flex items-center justify-center gap-2
                    font-medium py-3.5 rounded-xl
                    transition-all duration-200
                    disabled:cursor-not-allowed
                    ${email.trim()
                      ? 'bg-white text-black hover:bg-zinc-100'
                      : 'bg-zinc-800 text-zinc-500'
                    }
                  `}
                >
                  {loginState === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Footer */}
              <motion.div variants={itemVariants} className="text-center space-y-3">
                <p className="text-xs text-zinc-600 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <a href="/legal/terms" className="text-zinc-500 hover:text-white transition-colors underline-offset-2 hover:underline">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/legal/privacy" className="text-zinc-500 hover:text-white transition-colors underline-offset-2 hover:underline">
                    Privacy Policy
                  </a>
                </p>
                {isNewUser ? (
                  <p className="text-xs text-zinc-600">
                    Already have an account?{' '}
                    <a href="/auth/login" className="text-gold-500 hover:text-gold-400 transition-colors">
                      Sign in
                    </a>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-600">
                    New to HIVE?{' '}
                    <a href="/auth/login?new=true" className="text-gold-500 hover:text-gold-400 transition-colors">
                      Get started
                    </a>
                  </p>
                )}
              </motion.div>
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
