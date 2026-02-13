'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button, Input } from '@hive/ui/design-system/primitives';
import { useOnboardingAnalytics } from '@hive/hooks';
import { InterestPicker } from './InterestPicker';

type Step = 'email' | 'code' | 'interests';

const SCREEN_FADE = { duration: 0.15, ease: 'easeOut' } as const;
const NAME_FADE = { duration: 0.2, ease: 'easeOut' } as const;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function EntryFlowV2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [step, setStep] = React.useState<Step>('email');
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = React.useState(false);

  const [code, setCode] = React.useState<string[]>(['', '', '', '', '', '']);
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = React.useState(false);
  const [isCodeVerified, setIsCodeVerified] = React.useState(false);
  const [needsOnboarding, setNeedsOnboarding] = React.useState<boolean | null>(null);
  const [shakeCode, setShakeCode] = React.useState(false);
  const [codeErrorFlash, setCodeErrorFlash] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState(0);

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSubmittingName, setIsSubmittingName] = React.useState(false);

  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedCode = React.useRef('');

  // Analytics
  const analytics = useOnboardingAnalytics();
  const analyticsInitRef = React.useRef(false);

  // Track flow_started on mount
  React.useEffect(() => {
    if (!analyticsInitRef.current) {
      analyticsInitRef.current = true;
      analytics.trackOnboardingStarted();
      analytics.trackStepStarted('welcome');
    }
  }, [analytics]);

  // Track step transitions
  const prevStepRef = React.useRef<Step>(step);
  React.useEffect(() => {
    const prev = prevStepRef.current;
    if (prev === step) return;

    if (prev === 'email' && step === 'code') {
      analytics.trackStepCompleted('welcome');
      analytics.trackStepStarted('name');
    } else if (prev === 'code' && step === 'interests') {
      analytics.trackStepCompleted('name');
      analytics.trackStepStarted('handle');
    } else if (step === 'email' && prev === 'code') {
      // Going back — track abandonment of current step
      analytics.trackOnboardingAbandoned('name', 'user_went_back');
      analytics.trackStepStarted('welcome');
    }

    prevStepRef.current = step;
  }, [step, analytics]);

  // Track flow_abandoned on unmount if not completed
  const flowCompletedRef = React.useRef(false);
  React.useEffect(() => {
    return () => {
      if (!flowCompletedRef.current && analyticsInitRef.current) {
        const lastStep = prevStepRef.current === 'email' ? 'welcome' : prevStepRef.current === 'code' ? 'name' : 'handle';
        analytics.trackOnboardingAbandoned(lastStep, 'component_unmounted');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetOtpState = React.useCallback(() => {
    setCode(['', '', '', '', '', '']);
    setCodeError(null);
    setIsCodeVerified(false);
    setNeedsOnboarding(null);
    lastSubmittedCode.current = '';
  }, []);

  const focusOtpIndex = React.useCallback((index: number) => {
    otpRefs.current[index]?.focus();
    otpRefs.current[index]?.select();
  }, []);

  React.useEffect(() => {
    if (step === 'code') {
      focusOtpIndex(0);
    }
  }, [step, focusOtpIndex]);

  React.useEffect(() => {
    if (step !== 'code' || resendCountdown <= 0 || isCodeVerified) return;

    const id = window.setInterval(() => {
      setResendCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [step, resendCountdown, isCodeVerified]);

  const goToApp = React.useCallback((fallback = '/discover') => {
    router.push(redirectParam || fallback);
  }, [router, redirectParam]);

  const sendCode = React.useCallback(async () => {
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email');
      analytics.trackValidationError('welcome', 'email', 'invalid_email');
      return;
    }

    setIsSendingCode(true);
    setEmailError(null);
    setNameError(null);
    resetOtpState();

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to send code');
      }

      setStep('code');
      setResendCountdown(30);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to send code';
      setEmailError(msg);
      analytics.trackValidationError('welcome', 'email', msg);
    } finally {
      setIsSendingCode(false);
    }
  }, [email, resetOtpState, analytics]);

  const triggerCodeError = React.useCallback((message: string) => {
    setCodeError(message);
    setShakeCode(true);
    setCodeErrorFlash(true);
    window.setTimeout(() => setShakeCode(false), 200);
    window.setTimeout(() => setCodeErrorFlash(false), 320);
  }, []);

  const verifyCode = React.useCallback(async (codeString: string) => {
    if (isVerifyingCode || isCodeVerified) return;

    setIsVerifyingCode(true);
    setCodeError(null);
    setNameError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: codeString,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setCode(['', '', '', '', '', '']);
        lastSubmittedCode.current = '';
        focusOtpIndex(0);
        triggerCodeError('Wrong code. Try again.');
        analytics.trackValidationError('name', 'code', 'wrong_code');
        return;
      }

      const onboardingRequired = Boolean(result.needsOnboarding || !result.user?.onboardingCompleted);

      if (!onboardingRequired) {
        goToApp('/spaces');
        return;
      }

      setIsCodeVerified(true);
      setNeedsOnboarding(true);
    } catch {
      setCode(['', '', '', '', '', '']);
      lastSubmittedCode.current = '';
      focusOtpIndex(0);
      triggerCodeError('Wrong code. Try again.');
      analytics.trackValidationError('name', 'code', 'verification_failed');
    } finally {
      setIsVerifyingCode(false);
    }
  }, [email, focusOtpIndex, goToApp, isCodeVerified, isVerifyingCode, triggerCodeError, analytics]);

  React.useEffect(() => {
    const codeString = code.join('');
    if (
      step === 'code' &&
      !isCodeVerified &&
      !isVerifyingCode &&
      codeString.length === 6 &&
      /^\d{6}$/.test(codeString) &&
      codeString !== lastSubmittedCode.current
    ) {
      lastSubmittedCode.current = codeString;
      verifyCode(codeString);
    }
  }, [code, step, isCodeVerified, isVerifyingCode, verifyCode]);

  const resendCode = React.useCallback(async () => {
    if (resendCountdown > 0 || isSendingCode || isCodeVerified) return;

    setIsSendingCode(true);
    setCodeError(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to resend code');
      }

      setCode(['', '', '', '', '', '']);
      setResendCountdown(30);
      lastSubmittedCode.current = '';
      focusOtpIndex(0);
    } catch {
      setCodeError('Unable to resend. Try again.');
    } finally {
      setIsSendingCode(false);
    }
  }, [resendCountdown, isSendingCode, isCodeVerified, email, focusOtpIndex]);

  const goToInterests = React.useCallback(() => {
    if (!firstName.trim() || !lastName.trim()) {
      setNameError('Enter your first and last name');
      analytics.trackValidationError('name', 'name', 'missing_name');
      return;
    }
    setNameError(null);
    setStep('interests');
  }, [firstName, lastName, analytics]);

  const submitProfile = React.useCallback(async (interestData: { interests: string[]; major?: string; residentialSpaceId?: string; residenceType?: string }) => {
    setIsSubmittingName(true);
    setNameError(null);

    try {
      const response = await fetch('/api/auth/complete-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: 'student',
          interests: interestData.interests,
          major: interestData.major,
          residentialSpaceId: interestData.residentialSpaceId,
          residenceType: interestData.residenceType,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete entry');
      }

      // Track completion
      flowCompletedRef.current = true;
      analytics.trackStepCompleted('handle', { interestCount: interestData.interests.length });
      analytics.trackOnboardingCompleted(0, ['welcome', 'name', 'handle']);

      goToApp(result.redirect || '/discover');
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Failed to complete entry');
      // Go back to name step if submission fails
      setStep('code');
    } finally {
      setIsSubmittingName(false);
    }
  }, [firstName, lastName, goToApp, analytics]);

  const updateOtpAtIndex = React.useCallback((index: number, nextChar: string) => {
    if (!/^\d?$/.test(nextChar) || isVerifyingCode || isCodeVerified) return;

    setCode(prev => {
      const updated = [...prev];
      updated[index] = nextChar;
      return updated;
    });

    if (nextChar && index < 5) {
      focusOtpIndex(index + 1);
    }
  }, [focusOtpIndex, isCodeVerified, isVerifyingCode]);

  const handleOtpKeyDown = React.useCallback((index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isVerifyingCode || isCodeVerified) return;

    if (event.key === 'Backspace' && !code[index] && index > 0) {
      focusOtpIndex(index - 1);
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusOtpIndex(index - 1);
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      focusOtpIndex(index + 1);
    }
  }, [code, focusOtpIndex, isCodeVerified, isVerifyingCode]);

  const handleOtpPaste = React.useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    if (isVerifyingCode || isCodeVerified) return;

    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const filled = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    setCode(filled);
    if (pasted.length < 6) {
      focusOtpIndex(Math.max(0, pasted.length));
    }
  }, [focusOtpIndex, isCodeVerified, isVerifyingCode]);

  const onEnterEmail = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isSendingCode) {
      sendCode();
    }
  }, [isSendingCode, sendCode]);

  const onEnterName = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      goToInterests();
    }
  }, [goToInterests]);

  return (
    <div className="min-h-dvh bg-[#000000] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              step === 'email' || step === 'code' || step === 'interests' ? 'bg-white' : 'bg-white/20'
            }`}
          />
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              step === 'code' || step === 'interests' ? 'bg-white' : 'bg-white/20'
            }`}
          />
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              step === 'interests' ? 'bg-white' : 'bg-white/20'
            }`}
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="entry-email"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
              className="space-y-5"
            >
              <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                What&apos;s your email?
              </h1>

              <div className="space-y-3">
                <Input
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@buffalo.edu"
                  value={email}
                  onChange={event => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  onKeyDown={onEnterEmail}
                  className="w-full"
                  error={Boolean(emailError)}
                />

                {emailError && (
                  <p className="text-[13px] text-[#EF4444]">{emailError}</p>
                )}

                <Button
                  variant="primary"
                  size="default"
                  className="w-full"
                  onClick={sendCode}
                  loading={isSendingCode}
                  disabled={isSendingCode}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          ) : step === 'code' ? (
            <motion.div
              key="entry-code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
              className="space-y-5"
            >
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  resetOtpState();
                  setFirstName('');
                  setLastName('');
                  setNameError(null);
                }}
                className="text-[13px] font-sans text-white/50 hover:text-white/80 transition-colors"
              >
                ← Back
              </button>

              <div className="space-y-2">
                <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                  Check your email.
                </h1>
                <p className="font-sans text-[14px] text-white/50">{email}</p>
              </div>

              <motion.div
                animate={shakeCode ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-6 gap-2 flex-1">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => {
                          otpRefs.current[index] = el;
                        }}
                        value={digit}
                        maxLength={1}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        disabled={isVerifyingCode || isCodeVerified}
                        onChange={event => updateOtpAtIndex(index, event.target.value.replace(/\D/g, ''))}
                        onKeyDown={event => handleOtpKeyDown(index, event)}
                        onPaste={handleOtpPaste}
                        className={[
                          'h-12 w-full rounded-[12px] bg-[#0A0A0A] text-center text-[18px] text-white',
                          'outline-none transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
                          'focus:border-white/[0.2]',
                          codeErrorFlash
                            ? 'border-[#EF4444]'
                            : isCodeVerified
                              ? 'border-[#22C55E]'
                              : 'border-white/[0.06]',
                          (isVerifyingCode || isCodeVerified) ? 'cursor-not-allowed opacity-80' : '',
                        ].join(' ')}
                      />
                    ))}
                  </div>

                  {isCodeVerified && (
                    <div className="h-8 w-8 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center">
                      <Check size={16} />
                    </div>
                  )}
                </div>

                {codeError && (
                  <p className="text-[13px] text-[#EF4444]">{codeError}</p>
                )}

                {!isCodeVerified && resendCountdown === 0 && (
                  <p className="text-[13px] text-white/50">
                    Didn&apos;t get it?{' '}
                    <button
                      type="button"
                      onClick={resendCode}
                      className="text-white/50 hover:text-white/80 transition-colors"
                    >
                      Resend
                    </button>
                  </p>
                )}
              </motion.div>

              <AnimatePresence>
                {isCodeVerified && needsOnboarding && (
                  <motion.div
                    key="name-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="border-t border-dashed border-white/[0.16] pt-4"
                    />

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...NAME_FADE, delay: 0.06 }}
                      className="space-y-3"
                    >
                      <div className="space-y-2">
                        <label className="font-sans text-[13px] text-white/50">First name</label>
                        <Input
                          value={firstName}
                          onChange={event => {
                            setFirstName(event.target.value);
                            if (nameError) setNameError(null);
                          }}
                          onKeyDown={onEnterName}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="font-sans text-[13px] text-white/50">Last name</label>
                        <Input
                          value={lastName}
                          onChange={event => {
                            setLastName(event.target.value);
                            if (nameError) setNameError(null);
                          }}
                          onKeyDown={onEnterName}
                        />
                      </div>

                      {nameError && (
                        <p className="text-[13px] text-[#EF4444]">{nameError}</p>
                      )}

                      <Button
                        variant="primary"
                        size="default"
                        className="w-full"
                        onClick={goToInterests}
                      >
                        Next
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="entry-interests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
              className="space-y-5"
            >
              <button
                type="button"
                onClick={() => setStep('code')}
                className="text-[13px] font-sans text-white/50 hover:text-white/80 transition-colors"
              >
                ← Back
              </button>

              <InterestPicker
                onComplete={submitProfile}
                isSubmitting={isSubmittingName}
              />

              {nameError && (
                <p className="text-[13px] text-[#EF4444]">{nameError}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
