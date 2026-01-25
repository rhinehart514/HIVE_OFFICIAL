'use client';

/**
 * /login - Streamlined Login for Returning Users
 *
 * Simple flow: email → code → redirect to /spaces
 * No school/role selection - uses default campus config.
 *
 * If user needs onboarding (new account), redirects to /enter.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import {
  EntryShell,
  EntryShellStatic,
  EmailState,
  CodeState,
  type EmotionalState,
} from '@/components/entry';
import { ConfettiBurst } from '@/components/entry/motion/ConfettiBurst';
import {
  stateVariants,
  childVariants,
  EASE_PREMIUM,
  DURATION,
} from '@/components/entry/motion/entry-motion';
import { useLoginMachine } from '@/components/login/hooks/useLoginMachine';

export const dynamic = 'force-dynamic';

// Campus configuration - use defaults
const CAMPUS_CONFIG = {
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
  schoolId: process.env.NEXT_PUBLIC_SCHOOL_ID || 'ub-buffalo',
};

/**
 * Map login state to emotional state for ambient glow
 */
function getEmotionalState(state: string): EmotionalState {
  switch (state) {
    case 'email':
    case 'sending':
      return 'neutral';
    case 'code':
    case 'verifying':
      return 'anticipation';
    case 'complete':
      return 'celebration';
    default:
      return 'neutral';
  }
}

/**
 * Welcome back state - simplified arrival for returning users
 */
function WelcomeBackState({
  firstName,
  onComplete,
}: {
  firstName: string | null;
  onComplete: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showContent, setShowContent] = React.useState(false);

  // Staggered reveal
  React.useEffect(() => {
    const timers = [
      setTimeout(() => setShowConfetti(true), 200),
      setTimeout(() => setShowContent(true), 400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const name = firstName || 'there';

  return (
    <motion.div
      variants={stateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center text-center relative py-8"
    >
      {/* Confetti burst */}
      <ConfettiBurst trigger={showConfetti} />

      {/* Main message */}
      <motion.div
        variants={childVariants}
        className="mb-10"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          ease: EASE_PREMIUM,
        }}
      >
        <motion.h1
          className="text-heading-lg lg:text-display-sm font-semibold tracking-tight text-white mb-3"
          style={{
            textShadow: '0 0 40px rgba(255, 215, 0, 0.15)',
          }}
        >
          Welcome back,
          <br />
          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text">
            {name}
          </span>
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{
            duration: DURATION.smooth,
            delay: 0.2,
            ease: EASE_PREMIUM,
          }}
          className="text-body text-white/50"
        >
          Good to see you again.
        </motion.p>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        variants={childVariants}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
        animate={showContent ? { opacity: 1, scale: 1 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.4,
          ease: EASE_PREMIUM,
        }}
        className="w-full max-w-[280px]"
      >
        <Button
          onClick={onComplete}
          variant="cta"
          size="lg"
          className="w-full gap-2 group"
        >
          <span>Continue to HIVE</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Need React for useState/useEffect in WelcomeBackState
import * as React from 'react';

/**
 * Custom EmailState for login - adds "New here?" link
 */
function LoginEmailState({
  email,
  onEmailChange,
  onSubmit,
  error,
  isLoading,
  domain,
}: {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  error: string | null;
  isLoading: boolean;
  domain: string;
}) {
  return (
    <div className="space-y-0">
      <EmailState
        email={email}
        onEmailChange={onEmailChange}
        onSubmit={onSubmit}
        error={error}
        isLoading={isLoading}
        domain={domain}
        isReturning
      />

      {/* New here link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: DURATION.smooth }}
        className="mt-6 text-center"
      >
        <p className="text-sm text-white/40">
          New here?{' '}
          <Link
            href="/enter"
            className="text-white/60 hover:text-white underline underline-offset-2 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Static loading fallback
 */
function LoginPageFallback() {
  return (
    <EntryShellStatic>
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-heading font-semibold tracking-tight text-white">
            Sign in
          </h1>
          <div className="flex items-center gap-2 text-white/50">
            <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="text-body">Loading</span>
          </div>
        </div>
      </div>
    </EntryShellStatic>
  );
}

/**
 * Main login content with state machine
 */
function LoginContent() {
  const {
    // State
    state,
    data,
    error,
    userName,
    // Resend
    resendCooldown,
    // Computed
    fullEmail,
    // Setters
    setEmail,
    setCode,
    // Transitions
    submitEmail,
    verifyCode,
    resendCode,
    goBackToEmail,
    // Navigation
    handleComplete,
  } = useLoginMachine({
    domain: CAMPUS_CONFIG.domain,
    schoolId: CAMPUS_CONFIG.schoolId,
  });

  const emotionalState = getEmotionalState(state);

  return (
    <EntryShell
      emotionalState={emotionalState}
      showProgress={false}
    >
      <AnimatePresence mode="wait" initial={false}>
        {/* EMAIL STATE */}
        {(state === 'email' || state === 'sending') && (
          <LoginEmailState
            key="email"
            email={data.email}
            onEmailChange={setEmail}
            onSubmit={submitEmail}
            error={error}
            isLoading={state === 'sending'}
            domain={CAMPUS_CONFIG.domain}
          />
        )}

        {/* CODE STATE */}
        {(state === 'code' || state === 'verifying') && (
          <div key="code">
            <CodeState
              email={fullEmail}
              code={data.code}
              onCodeChange={setCode}
              onComplete={verifyCode}
              onResend={resendCode}
              onChangeEmail={goBackToEmail}
              error={error}
              isLoading={state === 'verifying'}
              resendCooldown={resendCooldown}
            />

            {/* New here link on code state too */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: DURATION.smooth }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-white/40">
                New here?{' '}
                <Link
                  href="/enter"
                  className="text-white/60 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </motion.div>
          </div>
        )}

        {/* COMPLETE STATE - Welcome back */}
        {state === 'complete' && (
          <WelcomeBackState
            key="complete"
            firstName={userName}
            onComplete={handleComplete}
          />
        )}
      </AnimatePresence>
    </EntryShell>
  );
}

/**
 * Login page with Suspense boundary
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}
