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
  type EmotionalState,
} from '@/components/entry';
import { EmailState } from '@/components/entry/states/EmailState';
import { CodeState } from '@/components/entry/states/CodeState';
import { ConfettiBurst } from '@/components/entry/motion/ConfettiBurst';
import {
  stateVariants,
  childVariants,
  EASE_PREMIUM,
  DURATION,
} from '@/components/entry/motion/entry-motion';
import { useLoginMachine } from '@/components/login/hooks/useLoginMachine';

export const dynamic = 'force-dynamic';

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
    case 'waitlist':
      return 'neutral';
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
}: {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  error: string | null;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-0">
      <EmailState
        email={email}
        onEmailChange={onEmailChange}
        onSubmit={onSubmit}
        error={error}
        isLoading={isLoading}
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
 * Waitlist state - shown when user's school isn't active yet
 */
function WaitlistState({
  email,
  schoolName,
  onJoinWaitlist,
  onBack,
  isLoading,
}: {
  email: string;
  schoolName: string;
  onJoinWaitlist: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      variants={stateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <motion.div variants={childVariants} className="space-y-3">
        <h1 className="text-heading-lg lg:text-display-sm font-semibold tracking-tight text-white">
          {schoolName} isn't on HIVE yet
        </h1>
        <p className="text-body text-white/50">
          We'll notify you at <span className="text-white/70">{email}</span> when it launches.
        </p>
      </motion.div>

      <motion.div variants={childVariants} className="space-y-4">
        <Button
          onClick={onJoinWaitlist}
          variant="cta"
          size="lg"
          className="w-full"
          disabled={isLoading}
          loading={isLoading}
        >
          Notify me
        </Button>

        <button
          onClick={onBack}
          className="w-full text-body-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Try a different email
        </button>
      </motion.div>
    </motion.div>
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
    // Waitlist
    waitlistSchool,
    // Setters
    setEmail,
    setCode,
    // Transitions
    submitEmail,
    verifyCode,
    resendCode,
    goBackToEmail,
    joinWaitlist,
    // Navigation
    handleComplete,
  } = useLoginMachine();

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
          />
        )}

        {/* WAITLIST STATE */}
        {state === 'waitlist' && waitlistSchool && (
          <WaitlistState
            key="waitlist"
            email={fullEmail}
            schoolName={waitlistSchool.name}
            onJoinWaitlist={joinWaitlist}
            onBack={goBackToEmail}
            isLoading={false}
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
