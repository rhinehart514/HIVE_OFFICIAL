'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Calendar, Vote, Users, Clock, ClipboardList } from 'lucide-react';
import { Button, Input } from '@hive/ui/design-system/primitives';
import { useOnboardingAnalytics } from '@hive/hooks';
import { InterestPicker } from './InterestPicker';

type Step = 'email' | 'code' | 'name' | 'interests' | 'campusLive' | 'create' | 'spaces';

const SCREEN_FADE = { duration: 0.15, ease: 'easeOut' } as const;

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

// ─────────────────────────────────────────────────────────────────
// Progress Dots — shown on screens 2-5 (4 dots)
// ─────────────────────────────────────────────────────────────────
function ProgressDots({ step }: { step: Step }) {
  if (step === 'email') return null;
  const steps: Step[] = ['code', 'name', 'interests', 'campusLive', 'create', 'spaces'];
  const currentIndex = steps.indexOf(step);

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
// Space Card for screen 5
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
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-sm shrink-0">
          {space.emoji || space.name.charAt(0).toUpperCase()}
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
        {joined ? 'Joined ✓' : 'Join'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Entry Flow
// ─────────────────────────────────────────────────────────────────
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
  const [shakeCode, setShakeCode] = React.useState(false);
  const [codeErrorFlash, setCodeErrorFlash] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState(0);

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSubmittingName, setIsSubmittingName] = React.useState(false);

  // Screen 5 state (interests data)
  const [savedInterestData, setSavedInterestData] = React.useState<{
    interests: string[];
    major?: string;
    residentialSpaceId?: string;
    residenceType?: string;
    greekLife?: { affiliated: boolean; chapterId?: string };
    studentOrgs?: string[];
  } | null>(null);

  // Campus live screen state
  const [campusEvents, setCampusEvents] = React.useState<Array<{
    id: string;
    title: string;
    startDate?: string;
    startAt?: string;
    spaceName?: string;
  }>>([]);
  const [campusEventCount, setCampusEventCount] = React.useState(0);
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);

  // Create step state
  const [isCreatingTool, setIsCreatingTool] = React.useState(false);
  const [createdToolId, setCreatedToolId] = React.useState<string | null>(null);

  // Spaces state
  const [joinedSpaces, setJoinedSpaces] = React.useState<string[]>([]);
  const [recommendedSpaces, setRecommendedSpaces] = React.useState<RecommendedSpace[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = React.useState(false);

  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedCode = React.useRef('');
  const [showSpamHint, setShowSpamHint] = React.useState(false);

  // Analytics
  const analytics = useOnboardingAnalytics();
  const analyticsInitRef = React.useRef(false);
  const flowCompletedRef = React.useRef(false);
  const prevStepRef = React.useRef<Step>(step);

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

    const stepAnalyticsMap = {
      email: 'welcome',
      code: 'verify',
      name: 'name',
      interests: 'interests',
      campusLive: 'campus_live',
      create: 'create',
      spaces: 'spaces',
    } as const;

    analytics.trackStepCompleted(stepAnalyticsMap[prev]);
    analytics.trackStepStarted(stepAnalyticsMap[step]);
    prevStepRef.current = step;
  }, [step, analytics]);

  React.useEffect(() => {
    return () => {
      if (!flowCompletedRef.current && analyticsInitRef.current) {
        const stepMap = {
          email: 'welcome',
          code: 'verify',
          name: 'name',
          interests: 'interests',
          campusLive: 'campus_live',
          create: 'create',
          spaces: 'spaces',
        } as const;
        analytics.trackOnboardingAbandoned(stepMap[prevStepRef.current], 'component_unmounted');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ──────────────────────────────────────────────────

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
    router.push(redirectParam || fallback);
  }, [router, redirectParam]);

  // ── OTP focus on step enter ─────────────────────────────────

  React.useEffect(() => {
    if (step === 'code') {
      focusOtpIndex(0);
      setShowSpamHint(false);
    }
  }, [step, focusOtpIndex]);

  // ── Spam folder hint after 10s on verify screen ─────────────

  React.useEffect(() => {
    if (step !== 'code' || isCodeVerified) return;
    const timer = window.setTimeout(() => {
      const hasEnteredCode = code.some(d => d !== '');
      if (!hasEnteredCode) setShowSpamHint(true);
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [step, isCodeVerified, code]);

  // ── Resend countdown ────────────────────────────────────────

  React.useEffect(() => {
    if (step !== 'code' || resendCountdown <= 0 || isCodeVerified) return;
    const id = window.setInterval(() => {
      setResendCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, resendCountdown, isCodeVerified]);

  // ── Auto-advance after verification ─────────────────────────

  React.useEffect(() => {
    if (isCodeVerified && step === 'code') {
      const timer = window.setTimeout(() => setStep('name'), 500);
      return () => window.clearTimeout(timer);
    }
  }, [isCodeVerified, step]);

  // ── Fetch recommended spaces when entering screen 5 ─────────

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
            // Pre-select the first 2-3 popular spaces so "Enter HIVE" gives a non-empty experience
            const preSelected = spaces
              .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0))
              .slice(0, Math.min(3, spaces.length))
              .map(s => s.id);
            setJoinedSpaces(prev => prev.length === 0 ? preSelected : prev);
          }
        }
      } catch {
        // Silently fail — user can skip
      } finally {
        if (!cancelled) setIsLoadingSpaces(false);
      }
    })();

    return () => { cancelled = true; };
  }, [step, recommendedSpaces.length]);

  // ── Fetch campus events when entering campusLive step ──────

  React.useEffect(() => {
    if (step !== 'campusLive') return;

    let cancelled = false;
    setIsLoadingEvents(true);

    (async () => {
      try {
        const res = await fetch('/api/events?campusId=ub-buffalo&upcoming=true&limit=10', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const events = (data.events || data.data || []).slice(0, 3).map((e: Record<string, unknown>) => ({
            id: e.id || e.eventId,
            title: e.title || e.name,
            startDate: e.startDate,
            startAt: e.startAt,
            spaceName: e.spaceName || e.organizerName,
          }));
          const totalCount = data.totalCount || data.total || events.length;
          if (!cancelled) {
            setCampusEvents(events);
            setCampusEventCount(totalCount);
          }
        }
      } catch {
        // Silently fail — screen still works without events
      } finally {
        if (!cancelled) setIsLoadingEvents(false);
      }
    })();

    return () => { cancelled = true; };
  }, [step]);

  // ── Actions ─────────────────────────────────────────────────

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
        goToApp('/spaces');
        return;
      }

      setIsCodeVerified(true);
      // Auto-advance handled by effect above
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

  const submitProfile = React.useCallback(async () => {
    if (!savedInterestData) return;

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
          interests: savedInterestData.interests,
          major: savedInterestData.major,
          residentialSpaceId: savedInterestData.residentialSpaceId,
          residenceType: savedInterestData.residenceType,
          greekLife: savedInterestData.greekLife,
          studentOrgs: savedInterestData.studentOrgs,
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
      analytics.trackStepCompleted('spaces', {
        interestCount: savedInterestData.interests.length,
        spacesJoined: joinedSpaces.length,
      });
      analytics.trackOnboardingCompleted(0, ['welcome', 'verify', 'name', 'interests', 'campus_live', 'create', 'spaces']);

      // If user created a tool during onboarding, send them to it
      const onboardingToolId = typeof window !== 'undefined'
        ? sessionStorage.getItem('hive_onboarding_tool')
        : null;
      if (onboardingToolId) {
        sessionStorage.removeItem('hive_onboarding_tool');
        goToApp(`/t/${onboardingToolId}?just_created=true`);
      } else {
        goToApp(result.redirect || '/discover');
      }
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Failed to complete entry');
      setStep('name');
    } finally {
      setIsSubmittingName(false);
    }
  }, [firstName, lastName, savedInterestData, joinedSpaces, goToApp, analytics]);

  // ── Quick create from onboarding ────────────────────────────

  const handleOnboardingCreate = React.useCallback(async (templateType: string) => {
    setIsCreatingTool(true);
    try {
      const { getQuickTemplate, createToolFromTemplate } = await import('@hive/ui');
      const template = getQuickTemplate(templateType);
      if (!template) {
        setStep('spaces');
        return;
      }

      const composition = createToolFromTemplate(template);
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          status: 'draft',
          type: 'visual',
          templateId: template.id,
          elements: composition.elements.map((el: { elementId: string; instanceId: string; config: Record<string, unknown>; position?: { x: number; y: number }; size?: { width: number; height: number } }) => ({
            elementId: el.elementId,
            instanceId: el.instanceId,
            config: el.config,
            position: el.position,
            size: el.size,
          })),
          connections: composition.connections?.map((conn: { from: { instanceId: string; output?: string }; to: { instanceId: string; input?: string } }) => ({
            id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            sourceElementId: conn.from.instanceId,
            sourceOutput: conn.from.output || 'output',
            targetElementId: conn.to.instanceId,
            targetInput: conn.to.input || 'input',
          })) || [],
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const toolId = (result.data?.tool?.id) || result.id;
        setCreatedToolId(toolId);
        // Store so it persists across profile submission
        sessionStorage.setItem('hive_onboarding_tool', toolId);
      }
    } catch {
      // Creation failed silently — still proceed
    } finally {
      setIsCreatingTool(false);
      setStep('spaces');
    }
  }, []);

  // ── OTP Handlers ────────────────────────────────────────────

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

  // ── Key handlers ────────────────────────────────────────────

  const onEnterEmail = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isSendingCode) sendCode();
  }, [isSendingCode, sendCode]);

  const onEnterName = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && validateName()) setStep('interests');
  }, [validateName]);

  // ── Toggle space join ───────────────────────────────────────

  const toggleSpace = React.useCallback((spaceId: string) => {
    setJoinedSpaces(prev =>
      prev.includes(spaceId)
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId]
    );
  }, []);

  // ── Render ──────────────────────────────────────────────────

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

          {/* ── Screen 2: Verify Code ────────────────────────── */}
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
                ← Back
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
            </motion.div>
          )}

          {/* ── Screen 3: Name ───────────────────────────────── */}
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
                ← Back
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
              className="space-y-5"
            >
              <button
                type="button"
                onClick={() => setStep('name')}
                className="text-[13px] font-sans text-white/30 hover:text-white/50 transition-colors"
              >
                ← Back
              </button>

              <InterestPicker
                onComplete={(data) => {
                  setSavedInterestData(data);
                  setStep('campusLive');
                }}
                isSubmitting={false}
              />
            </motion.div>
          )}

          {/* ── Screen 5: Your Campus is Live (O3) ─────────── */}
          {step === 'campusLive' && (
            <motion.div
              key="entry-campus-live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="font-display text-[28px] font-semibold leading-tight text-white">
                  Your campus is live.
                </h1>
                {campusEventCount > 0 && (
                  <p className="text-sm text-white/40">
                    {campusEventCount} events happening at UB this week.
                  </p>
                )}
              </div>

              {isLoadingEvents ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 animate-pulse">
                      <div className="h-4 w-48 bg-white/[0.04] rounded" />
                      <div className="h-3 w-32 bg-white/[0.03] rounded mt-2" />
                    </div>
                  ))}
                </div>
              ) : campusEvents.length > 0 ? (
                <div className="space-y-3">
                  {campusEvents.map((event, i) => {
                    const eventDate = event.startAt || event.startDate;
                    const formatted = eventDate
                      ? new Date(eventDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : null;
                    return (
                      <motion.div
                        key={event.id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.08 }}
                        className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/[0.04] mt-0.5">
                            <Calendar className="w-4 h-4 text-white/30" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">
                              {event.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {formatted && (
                                <span className="text-[11px] text-white/30">{formatted}</span>
                              )}
                              {event.spaceName && (
                                <>
                                  <span className="text-white/10">·</span>
                                  <span className="text-[11px] text-white/20">{event.spaceName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
                  <p className="text-sm text-white/30">Events are being added every day</p>
                </div>
              )}

              <Button
                variant="primary"
                size="default"
                className="w-full"
                onClick={() => setStep('create')}
              >
                <span className="flex items-center gap-2">
                  Now let&apos;s make something
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </motion.div>
          )}

          {/* ── Screen 6: Create (O4) ─────────────────────────── */}
          {step === 'create' && (
            <motion.div
              key="entry-create"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCREEN_FADE}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="font-display text-[28px] font-semibold leading-tight text-white">
                  What do you want to make?
                </h1>
                <p className="text-sm text-white/40">
                  Pick one — you can always make more later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'quick-poll', label: 'Poll', desc: 'Ask a question', icon: Vote },
                  { id: 'event-rsvp', label: 'RSVP', desc: 'Plan something', icon: Calendar },
                  { id: 'resource-signup', label: 'Signup', desc: 'Collect names', icon: ClipboardList },
                  { id: 'event-countdown', label: 'Countdown', desc: 'Count down to it', icon: Clock },
                ].map(({ id, label, desc, icon: Icon }, i) => (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.06 }}
                    onClick={() => handleOnboardingCreate(id)}
                    disabled={isCreatingTool}
                    className="group rounded-2xl bg-white/[0.03] border border-white/[0.06]
                      hover:border-white/[0.10] hover:bg-white/[0.05]
                      p-5 text-left transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-2.5 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.06]
                      transition-colors w-fit mb-3">
                      <Icon className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{desc}</p>
                  </motion.button>
                ))}
              </div>

              {isCreatingTool && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full"
                  />
                  <span className="text-sm text-white/40">Creating...</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep('spaces')}
                disabled={isCreatingTool}
                className="w-full text-center text-[12px] text-white/20 hover:text-white/40 transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {/* ── Screen 7: Space Recommendations ──────────────── */}
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
                {createdToolId ? 'Where should it live?' : 'Spaces for you'}
              </h1>
              <p className="text-sm text-white/30">
                {createdToolId
                  ? 'Join spaces to share your tools with their members'
                  : 'Join a few to get started'}
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
