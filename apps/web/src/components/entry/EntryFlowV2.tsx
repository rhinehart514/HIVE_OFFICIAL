'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button, Input } from '@hive/ui/design-system/primitives';
import { useOnboardingAnalytics } from '@hive/hooks';
import { InterestPicker } from './InterestPicker';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type Step = 'email' | 'code' | 'name' | 'interests' | 'spaces';

const SCREEN_FADE = { duration: 0.15, ease: 'easeOut' } as const;

const PERSISTENCE_KEY = 'hive_onboarding_state';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

interface RecommendedSpace {
  id: string;
  name: string;
  handle: string;
  emoji?: string;
  avatarUrl?: string;
  memberCount?: number;
}

interface CampusActivity {
  spaces: number;
  students: number;
  apps: number;
}

interface PersistedState {
  step: Step;
  email: string;
  firstName: string;
  lastName: string;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────
// Persistence helpers
// ─────────────────────────────────────────────────────────────────

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded or private mode */ }
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(PERSISTENCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // Expire after 1 hour
    if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
      localStorage.removeItem(PERSISTENCE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearState() {
  try {
    localStorage.removeItem(PERSISTENCE_KEY);
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────
// Progress Dots
// ─────────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: Step }) {
  if (step === 'email') return null;

  const steps: Step[] = ['code', 'name', 'interests', 'spaces'];
  const currentIndex = steps.indexOf(step);
  if (currentIndex === -1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            i <= currentIndex ? 'bg-white' : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Space Card for recommendation screen
// ─────────────────────────────────────────────────────────────────

function SpaceCard({
  space,
  joined,
  onToggle,
}: {
  space: RecommendedSpace;
  joined: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-sm shrink-0 overflow-hidden">
          {space.avatarUrl ? (
            <img src={space.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            space.emoji || space.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white truncate">{space.name}</div>
          {space.memberCount != null && (
            <div className="text-[11px] text-white/20 font-sans">
              {space.memberCount > 0 ? `${space.memberCount} members` : 'Be the first to join'}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-150 ${
          joined
            ? 'bg-[#FFD700] text-black'
            : 'bg-white/[0.06] text-white hover:bg-white/[0.1]'
        }`}
      >
        {joined ? 'Joined' : 'Join'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Redirect persistence for path-aware entry (5.4)
// ─────────────────────────────────────────────────────────────────

const REDIRECT_KEY = 'hive_entry_redirect';

function storeRedirect(url: string) {
  try { localStorage.setItem(REDIRECT_KEY, url); } catch { /* ignore */ }
}

function consumeRedirect(): string | null {
  try {
    const val = localStorage.getItem(REDIRECT_KEY);
    if (val) localStorage.removeItem(REDIRECT_KEY);
    return val;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────
// Main Entry Flow
// ─────────────────────────────────────────────────────────────────

export function EntryFlowV2() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Path-aware entry (5.4): capture redirect params on mount ──
  const redirectRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const redirect = searchParams.get('redirect');
    const fromTool = searchParams.get('from_tool');

    if (redirect) {
      storeRedirect(redirect);
      redirectRef.current = redirect;
    } else if (fromTool) {
      const toolPath = `/t/${fromTool}`;
      storeRedirect(toolPath);
      redirectRef.current = toolPath;
    } else {
      // Check if there's a stored redirect from before auth
      redirectRef.current = consumeRedirect();
    }
  }, [searchParams]);

  // ── Core state ─────────────────────────────────────────────
  const [step, setStep] = React.useState<Step>('email');
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = React.useState(false);

  // OTP state
  const [code, setCode] = React.useState<string[]>(['', '', '', '', '', '']);
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = React.useState(false);
  const [isCodeVerified, setIsCodeVerified] = React.useState(false);
  const [shakeCode, setShakeCode] = React.useState(false);
  const [codeErrorFlash, setCodeErrorFlash] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState(0);

  // Ambient campus activity for OTP screen (5.3)
  const [campusActivity, setCampusActivity] = React.useState<CampusActivity | null>(null);

  // Name state
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSubmittingName, setIsSubmittingName] = React.useState(false);

  // Interests
  const [interestData, setInterestData] = React.useState<{
    interests: string[];
    major?: string;
  }>({ interests: [] });

  // Spaces
  const [joinedSpaces, setJoinedSpaces] = React.useState<string[]>([]);
  const [recommendedSpaces, setRecommendedSpaces] = React.useState<RecommendedSpace[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = React.useState(false);

  // Refs
  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedCode = React.useRef('');
  const [showSpamHint, setShowSpamHint] = React.useState(false);

  // Analytics
  const analytics = useOnboardingAnalytics();
  const analyticsInitRef = React.useRef(false);
  const flowCompletedRef = React.useRef(false);
  const prevStepRef = React.useRef<Step>(step);

  // ── Persistence: save on every step change ─────────────────

  React.useEffect(() => {
    if (step === 'email' || step === 'code') return;
    saveState({
      step,
      email,
      firstName,
      lastName,
      timestamp: Date.now(),
    });
  }, [step, email, firstName, lastName]);

  // ── Persistence: restore on mount ──────────────────────────

  React.useEffect(() => {
    const saved = loadState();
    if (saved && saved.step !== 'email' && saved.step !== 'code') {
      setEmail(saved.email);
      setFirstName(saved.firstName);
      setLastName(saved.lastName);
      setStep(saved.step);
    }
  }, []);

  // ── Analytics ──────────────────────────────────────────────

  React.useEffect(() => {
    if (!analyticsInitRef.current) {
      analyticsInitRef.current = true;
      analytics.trackOnboardingStarted();
      analytics.trackStepStarted('welcome');
    }
  }, [analytics]);

  React.useEffect(() => {
    const prev = prevStepRef.current;
    if (prev === step) return;

    const stepAnalyticsMap: Record<Step, string> = {
      email: 'welcome',
      code: 'verify',
      name: 'name',
      interests: 'interests',
      spaces: 'spaces',
    };

    analytics.trackStepCompleted(stepAnalyticsMap[prev] as any);
    analytics.trackStepStarted(stepAnalyticsMap[step] as any);
    prevStepRef.current = step;
  }, [step, analytics]);

  React.useEffect(() => {
    return () => {
      if (!flowCompletedRef.current && analyticsInitRef.current) {
        const stepMap: Record<Step, string> = {
          email: 'welcome', code: 'verify',
          name: 'name', interests: 'interests', spaces: 'spaces',
        };
        analytics.trackOnboardingAbandoned(stepMap[prevStepRef.current] as any, 'component_unmounted');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ────────────────────────────────────────────────

  const resetOtpState = React.useCallback(() => {
    setCode(['', '', '', '', '', '']);
    setCodeError(null);
    setIsCodeVerified(false);
    lastSubmittedCode.current = '';
  }, []);

  const focusOtpIndex = React.useCallback((index: number) => {
    otpRefs.current[index]?.focus();
  }, []);

  const goToApp = React.useCallback((fallback = '/discover') => {
    clearState();
    const storedRedirect = consumeRedirect();
    router.push(redirectRef.current || storedRedirect || fallback);
  }, [router]);

  // ── OTP focus on step enter ────────────────────────────────

  React.useEffect(() => {
    if (step === 'code') {
      focusOtpIndex(0);
      setShowSpamHint(false);
    }
  }, [step, focusOtpIndex]);

  // ── Fetch campus activity when entering OTP screen (5.3) ───

  React.useEffect(() => {
    if (step !== 'code') return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/campus/stats');
        if (res.ok) {
          const data = await res.json();
          const stats = data.data || data;
          if (!cancelled) {
            setCampusActivity({
              spaces: stats.spaces ?? 0,
              students: stats.students ?? 0,
              apps: stats.apps ?? 0,
            });
          }
        }
      } catch { /* best effort */ }
    })();

    return () => { cancelled = true; };
  }, [step]);

  // ── Spam folder hint after 10s ─────────────────────────────

  React.useEffect(() => {
    if (step !== 'code' || isCodeVerified) return;
    const timer = window.setTimeout(() => {
      const hasEnteredCode = code.some(d => d !== '');
      if (!hasEnteredCode) setShowSpamHint(true);
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [step, isCodeVerified, code]);

  // ── Resend countdown ──────────────────────────────────────

  React.useEffect(() => {
    if (step !== 'code' || resendCountdown <= 0 || isCodeVerified) return;
    const id = window.setInterval(() => {
      setResendCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, resendCountdown, isCodeVerified]);

  // ── Auto-advance after verification → name step ───────────

  React.useEffect(() => {
    if (isCodeVerified && step === 'code') {
      const timer = window.setTimeout(() => setStep('name'), 500);
      return () => window.clearTimeout(timer);
    }
  }, [isCodeVerified, step]);

  // ── Fetch recommended spaces when entering spaces step ─────

  React.useEffect(() => {
    if (step !== 'spaces' || recommendedSpaces.length > 0) return;

    let cancelled = false;
    setIsLoadingSpaces(true);

    (async () => {
      try {
        let res = await fetch('/api/spaces/recommended', { credentials: 'include' });
        if (!res.ok) {
          res = await fetch('/api/spaces?limit=8', { credentials: 'include' });
        }
        if (res.ok) {
          const data = await res.json();
          const spaces: RecommendedSpace[] = (data.spaces || data || []).slice(0, 8).map((s: Record<string, unknown>) => ({
            id: s.id || s.spaceId,
            name: s.name || s.displayName,
            handle: s.handle || s.slug || '',
            emoji: s.emoji,
            avatarUrl: s.avatarUrl,
            memberCount: s.memberCount,
          }));
          if (!cancelled) {
            setRecommendedSpaces(spaces);
            const preSelected = spaces
              .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0))
              .slice(0, Math.min(3, spaces.length))
              .map(s => s.id);
            setJoinedSpaces(prev => prev.length === 0 ? preSelected : prev);
          }
        }
      } catch { /* Silently fail */ }
      finally { if (!cancelled) setIsLoadingSpaces(false); }
    })();

    return () => { cancelled = true; };
  }, [step, recommendedSpaces.length]);

  // ── Actions ────────────────────────────────────────────────

  const sendCode = React.useCallback(async () => {
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email');
      analytics.trackValidationError('welcome', 'email', 'invalid_email');
      return;
    }

    setIsSendingCode(true);
    setEmailError(null);
    resetOtpState();

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to send code');

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

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: codeString }),
      });

      const result = await response.json();
      if (!response.ok) {
        setCode(['', '', '', '', '', '']);
        lastSubmittedCode.current = '';
        focusOtpIndex(0);
        triggerCodeError('Wrong code. Try again.');
        analytics.trackValidationError('verify', 'code', 'wrong_code');
        return;
      }

      const onboardingRequired = Boolean(result.needsOnboarding || !result.user?.onboardingCompleted);
      if (!onboardingRequired) {
        goToApp('/discover');
        return;
      }

      setIsCodeVerified(true);
      // Auto-advance handled by effect above → goes to name
    } catch {
      setCode(['', '', '', '', '', '']);
      lastSubmittedCode.current = '';
      focusOtpIndex(0);
      triggerCodeError('Wrong code. Try again.');
      analytics.trackValidationError('verify', 'code', 'verification_failed');
    } finally {
      setIsVerifyingCode(false);
    }
  }, [email, focusOtpIndex, goToApp, isCodeVerified, isVerifyingCode, triggerCodeError, analytics]);

  // Auto-verify when 6 digits entered
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
      if (!response.ok) throw new Error(result.message || result.error || 'Failed to resend code');

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

  const validateName = React.useCallback(() => {
    if (!firstName.trim() || !lastName.trim()) {
      setNameError('Enter your first and last name');
      analytics.trackValidationError('name', 'name', 'missing_name');
      return false;
    }
    setNameError(null);
    return true;
  }, [firstName, lastName, analytics]);

  // ── Submit profile ──────────────────────────────────────────

  const submitProfile = React.useCallback(async () => {
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
          major: interestData.major ?? null,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to complete entry');

      // Join selected spaces
      if (joinedSpaces.length > 0) {
        await Promise.allSettled(
          joinedSpaces.map(spaceId =>
            fetch(`/api/spaces/${spaceId}/join`, {
              method: 'POST',
              credentials: 'include',
            })
          )
        );
      }

      flowCompletedRef.current = true;
      clearState();
      analytics.trackStepCompleted('spaces', {
        spacesJoined: joinedSpaces.length,
      });
      analytics.trackOnboardingCompleted(0, ['welcome', 'verify', 'name', 'interests', 'spaces']);

      goToApp(result.redirect || '/discover');
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Failed to complete entry');
      setStep('name');
    } finally {
      setIsSubmittingName(false);
    }
  }, [firstName, lastName, joinedSpaces, interestData, goToApp, analytics]);

  // ── OTP Handlers ───────────────────────────────────────────

  const updateOtpAtIndex = React.useCallback((index: number, nextChar: string) => {
    if (!/^\d?$/.test(nextChar) || isVerifyingCode || isCodeVerified) return;

    setCode(prev => {
      const updated = [...prev];
      updated[index] = nextChar;
      return updated;
    });

    if (nextChar && index < 5) {
      window.requestAnimationFrame(() => focusOtpIndex(index + 1));
    }
  }, [focusOtpIndex, isCodeVerified, isVerifyingCode]);

  const handleOtpKeyDown = React.useCallback((index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isVerifyingCode || isCodeVerified) return;

    if (event.key === 'Backspace' && !code[index] && index > 0) focusOtpIndex(index - 1);
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); focusOtpIndex(index - 1); }
    if (event.key === 'ArrowRight' && index < 5) { event.preventDefault(); focusOtpIndex(index + 1); }
  }, [code, focusOtpIndex, isCodeVerified, isVerifyingCode]);

  const handleOtpPaste = React.useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    if (isVerifyingCode || isCodeVerified) return;

    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const filled = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    setCode(filled);
    focusOtpIndex(Math.min(pasted.length, 5));
  }, [focusOtpIndex, isCodeVerified, isVerifyingCode]);

  // ── Key handlers ───────────────────────────────────────────

  const onEnterEmail = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isSendingCode) sendCode();
  }, [isSendingCode, sendCode]);

  const onEnterName = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && validateName()) setStep('interests');
  }, [validateName]);

  const toggleSpace = React.useCallback((spaceId: string) => {
    setJoinedSpaces(prev =>
      prev.includes(spaceId)
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId]
    );
  }, []);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[#000000] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <ProgressDots step={step} />

        <AnimatePresence mode="wait">
          {/* ── Screen 1: Email ──────────────────────────────── */}
          {step === 'email' && (
            <motion.div
              key="entry-email"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
              className="space-y-6"
            >
              <div className="text-center mb-10">
                <h1 className="font-display text-[48px] font-semibold tracking-tight text-[#FFD700]">
                  HIVE
                </h1>
                <p className="text-sm text-white/30 mt-1">The platform for UB</p>
              </div>

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

              <p className="text-[11px] text-white/20 uppercase tracking-[0.15em] font-sans text-center mt-4">
                @buffalo.edu required
              </p>
            </motion.div>
          )}

          {/* ── Screen 2: Verify Code + Ambient Activity ─────── */}
          {step === 'code' && (
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
                }}
                className="text-[13px] font-sans text-white/30 hover:text-white/50 transition-colors"
              >
                &larr; Back
              </button>

              <div className="space-y-2">
                <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                  Check your inbox
                </h1>
                <p className="text-sm text-white/30">{email}</p>
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
                        ref={el => { otpRefs.current[index] = el; }}
                        value={digit}
                        maxLength={1}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        disabled={isVerifyingCode || isCodeVerified}
                        onChange={event => updateOtpAtIndex(index, event.target.value.replace(/\D/g, ''))}
                        onKeyDown={event => handleOtpKeyDown(index, event)}
                        onPaste={handleOtpPaste}
                        className={[
                          'h-12 w-full rounded-[12px] border bg-[#080808] text-center text-[18px] text-white',
                          'outline-none transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
                          'focus:border-white/[0.15]',
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
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-8 w-8 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center"
                    >
                      <Check size={16} />
                    </motion.div>
                  )}
                </div>

                {codeError && (
                  <p className="text-[13px] text-[#EF4444]">{codeError}</p>
                )}

                {!isCodeVerified && resendCountdown === 0 && (
                  <p className="text-[13px] text-white/30">
                    Didn&apos;t get it?{' '}
                    <button
                      type="button"
                      onClick={resendCode}
                      className="text-white/30 hover:text-white/50 transition-colors"
                    >
                      Resend
                    </button>
                  </p>
                )}

                {!isCodeVerified && resendCountdown > 0 && (
                  <p className="text-[13px] text-white/20 font-sans">
                    Resend in {resendCountdown}s
                  </p>
                )}

                {showSpamHint && !isCodeVerified && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[13px] text-white/30"
                  >
                    Not seeing it? Check your spam folder.
                  </motion.p>
                )}
              </motion.div>

              {/* ── Ambient campus activity (5.3) ─────────────── */}
              {campusActivity && !isCodeVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.4 }}
                  className="mt-6 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
                >
                  <p className="text-[11px] text-white/20 uppercase tracking-[0.15em] font-sans mb-3">
                    Happening at UB
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {campusActivity.spaces > 0 && (
                      <div>
                        <div className="text-[20px] font-semibold text-white font-display">
                          {campusActivity.spaces.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-white/25 font-sans">Spaces</div>
                      </div>
                    )}
                    {campusActivity.students > 0 && (
                      <div>
                        <div className="text-[20px] font-semibold text-white font-display">
                          {campusActivity.students.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-white/25 font-sans">Students</div>
                      </div>
                    )}
                    {campusActivity.apps > 0 && (
                      <div>
                        <div className="text-[20px] font-semibold text-white font-display">
                          {campusActivity.apps.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-white/25 font-sans">Apps</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Screen 3: Name ──────────────────────────────── */}
          {step === 'name' && (
            <motion.div
              key="entry-name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
              className="space-y-5"
            >
              <button
                type="button"
                onClick={() => setStep('code')}
                className="text-[13px] font-sans text-white/30 hover:text-white/50 transition-colors"
              >
                &larr; Back
              </button>

              <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                What should we call you?
              </h1>

              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-white/30">First name</label>
                    <Input
                      autoFocus
                      value={firstName}
                      onChange={event => {
                        setFirstName(event.target.value);
                        if (nameError) setNameError(null);
                      }}
                      onKeyDown={onEnterName}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-white/30">Last name</label>
                    <Input
                      value={lastName}
                      onChange={event => {
                        setLastName(event.target.value);
                        if (nameError) setNameError(null);
                      }}
                      onKeyDown={onEnterName}
                    />
                  </div>
                </div>

                {nameError && (
                  <p className="text-[13px] text-[#EF4444]">{nameError}</p>
                )}

                <Button
                  variant="primary"
                  size="default"
                  className="w-full"
                  onClick={() => {
                    if (validateName()) setStep('interests');
                  }}
                >
                  Next
                </Button>
              </div>

              <p className="text-[11px] text-white/20 text-center mt-3">
                This is how you appear in spaces
              </p>
            </motion.div>
          )}

          {/* ── Screen 4: Interests ──────────────────────────── */}
          {step === 'interests' && (
            <motion.div
              key="entry-interests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
            >
              <InterestPicker
                onComplete={(data) => {
                  setInterestData({
                    interests: data.interests,
                    major: data.major,
                  });
                  analytics.trackStepCompleted('interests', {
                    interestCount: data.interests.length,
                    hasMajor: !!data.major,
                  });
                  setStep('spaces');
                }}
                isSubmitting={false}
                campusId="ub-buffalo"
              />
            </motion.div>
          )}

          {/* ── Screen 5: Space Recommendations ──────────────── */}
          {step === 'spaces' && (
            <motion.div
              key="entry-spaces"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
              className="space-y-5"
            >
              <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                Spaces for you
              </h1>
              <p className="text-sm text-white/30">
                Join a few to get started
              </p>

              {isLoadingSpaces ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 h-[120px] animate-pulse" />
                  ))}
                </div>
              ) : recommendedSpaces.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {recommendedSpaces.map(space => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      joined={joinedSpaces.includes(space.id)}
                      onToggle={() => toggleSpace(space.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 text-center">
                  <p className="text-sm text-white/30">No spaces to show yet</p>
                </div>
              )}

              <Button
                variant="primary"
                size="default"
                className="w-full"
                onClick={submitProfile}
                loading={isSubmittingName}
                disabled={isSubmittingName}
              >
                <span className="flex items-center gap-2">
                  Enter HIVE
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>

              <button
                type="button"
                onClick={submitProfile}
                disabled={isSubmittingName}
                className="w-full text-center text-[11px] text-white/20 hover:text-white/40 transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
