'use client';

/**
 * useLoginMachine - Simplified State Machine for /login Flow
 *
 * Streamlined login for returning users:
 * email → sending → code → verifying → complete
 *
 * Skips school/role selection - uses configured default schoolId.
 * If user doesn't exist, redirects to /enter for full onboarding.
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================
// TYPES
// ============================================

export type LoginState =
  | 'email'
  | 'sending'
  | 'code'
  | 'verifying'
  | 'waitlist'
  | 'complete';

export interface LoginData {
  email: string;
  code: string[];
}

export interface WaitlistSchool {
  id: string;
  name: string;
}

export interface UseLoginMachineOptions {
  /** Default redirect after completion */
  defaultRedirect?: string;
}

export interface UseLoginMachineReturn {
  // State
  state: LoginState;
  data: LoginData;
  error: string | null;

  // User info (populated on success)
  userName: string | null;

  // Resend cooldown
  resendCooldown: number;

  // Computed
  fullEmail: string;

  // Waitlist info (populated when SCHOOL_NOT_ACTIVE)
  waitlistSchool: WaitlistSchool | null;

  // Actions
  setEmail: (email: string) => void;
  setCode: (code: string[]) => void;

  // Transitions
  submitEmail: () => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  goBackToEmail: () => void;
  joinWaitlist: () => Promise<void>;

  // Navigation
  redirectTo: string;
  handleComplete: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const RESEND_COOLDOWNS = [30, 60, 120, 300]; // Progressive cooldowns
const PENDING_EMAIL_KEY = 'hive_pending_email';

// ============================================
// HOOK
// ============================================

export function useLoginMachine(options: UseLoginMachineOptions = {}): UseLoginMachineReturn {
  const { defaultRedirect = '/spaces' } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect from URL params or use default
  const redirectTo = searchParams.get('redirect') || defaultRedirect;

  // ============================================
  // STATE
  // ============================================

  const [state, setState] = useState<LoginState>('email');
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [waitlistSchool, setWaitlistSchool] = useState<WaitlistSchool | null>(null);
  const [detectedSchoolId, setDetectedSchoolId] = useState<string | null>(null);

  const [data, setData] = useState<LoginData>({
    email: '',
    code: ['', '', '', '', '', ''],
  });

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Email should include @ - if not, it's invalid but we still store it
  const fullEmail = data.email;

  // ============================================
  // EFFECTS
  // ============================================

  // Restore pending email from localStorage
  useEffect(() => {
    const pending = localStorage.getItem(PENDING_EMAIL_KEY);
    if (pending && state === 'email') {
      setData((prev) => ({ ...prev, email: pending }));
    }
  }, [state]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ============================================
  // DATA SETTERS
  // ============================================

  const setEmail = useCallback((email: string) => {
    setData((prev) => ({ ...prev, email }));
    setError(null);
  }, []);

  const setCode = useCallback((code: string[]) => {
    setData((prev) => ({ ...prev, code }));
    setError(null);
  }, []);

  // ============================================
  // TRANSITIONS
  // ============================================

  // Send verification code
  const submitEmail = useCallback(async () => {
    // Validate email
    if (!data.email.trim()) {
      setError('Enter your email');
      return;
    }

    const emailToValidate = data.email;
    if (!emailToValidate.includes('@') || !emailToValidate.includes('.')) {
      setError('Enter a valid email address');
      return;
    }

    // Extract domain and derive schoolId from domain
    const emailDomain = emailToValidate.split('@')[1].toLowerCase();
    // Use domain as schoolId hint - API will validate
    const schoolIdFromDomain = emailDomain.split('.')[0]; // e.g., 'buffalo' from 'buffalo.edu'

    // Store email for session
    localStorage.setItem(PENDING_EMAIL_KEY, emailToValidate);

    setState('sending');
    setError(null);
    setWaitlistSchool(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToValidate,
          schoolId: detectedSchoolId || schoolIdFromDomain,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle SCHOOL_NOT_ACTIVE - show waitlist UI
        if (result.code === 'SCHOOL_NOT_ACTIVE' || result.error === 'SCHOOL_NOT_ACTIVE') {
          setWaitlistSchool({
            id: result.schoolId,
            name: result.schoolName,
          });
          setDetectedSchoolId(result.schoolId);
          setState('waitlist');
          return;
        }

        throw new Error(result.message || result.error || 'Failed to send code');
      }

      // Store detected schoolId for verify call
      if (result.schoolId) {
        setDetectedSchoolId(result.schoolId);
      }

      // Set cooldown
      const cooldownDuration =
        RESEND_COOLDOWNS[Math.min(resendCount, RESEND_COOLDOWNS.length - 1)];
      setResendCooldown(cooldownDuration);
      setResendCount((prev) => prev + 1);

      setState('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send code');
      setState('email');
    }
  }, [data.email, detectedSchoolId, resendCount]);

  // Verify code
  const verifyCode = useCallback(
    async (codeString: string) => {
      setState('verifying');
      setError(null);

      // Extract schoolId from email domain if not already detected
      const emailDomain = data.email.split('@')[1]?.toLowerCase() || '';
      const schoolIdFromDomain = emailDomain.split('.')[0];
      const schoolIdToUse = detectedSchoolId || schoolIdFromDomain;

      try {
        const response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: data.email,
            code: codeString,
            schoolId: schoolIdToUse,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Reset code on error
          setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''] }));
          setError(result.error || 'Invalid code');
          setState('code');
          return;
        }

        // Check if user needs onboarding (new user)
        const needsOnboarding = result.needsOnboarding || !result.user?.handle;

        if (needsOnboarding) {
          // New user - redirect to /enter to complete profile
          // Pass state=identity to skip straight to profile setup
          localStorage.removeItem(PENDING_EMAIL_KEY);
          router.push('/enter?state=identity');
          return;
        }

        // Returning user - store name and complete
        setUserName(result.user?.firstName || 'there');
        setState('complete');
      } catch {
        setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''] }));
        setError('Verification failed');
        setState('code');
      }
    },
    [data.email, detectedSchoolId, router]
  );

  // Resend code
  const resendCode = useCallback(async () => {
    if (resendCooldown > 0) return;
    await submitEmail();
  }, [resendCooldown, submitEmail]);

  // Go back to email
  const goBackToEmail = useCallback(() => {
    setState('email');
    setError(null);
    setWaitlistSchool(null);
    setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''] }));
  }, []);

  // Join waitlist for school not yet on HIVE
  const joinWaitlist = useCallback(async () => {
    if (!waitlistSchool) return;

    setError(null);

    try {
      const response = await fetch('/api/waitlist/school-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          schoolName: waitlistSchool.name,
          schoolId: waitlistSchool.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to join waitlist');
        return;
      }

      // Show success and redirect to landing
      localStorage.removeItem(PENDING_EMAIL_KEY);
      // Just stay on waitlist state with success message - parent component handles UI
    } catch {
      setError('Unable to join waitlist. Please try again.');
    }
  }, [data.email, waitlistSchool]);

  // Handle successful login
  const handleComplete = useCallback(() => {
    // Clear pending email
    localStorage.removeItem(PENDING_EMAIL_KEY);

    // Navigate to redirect
    router.push(redirectTo);
  }, [router, redirectTo]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    state,
    data,
    error,

    // User info
    userName,

    // Resend
    resendCooldown,

    // Computed
    fullEmail,

    // Waitlist
    waitlistSchool,

    // Data setters
    setEmail,
    setCode,

    // Transitions
    submitEmail,
    verifyCode,
    resendCode,
    goBackToEmail,
    joinWaitlist,

    // Navigation
    redirectTo,
    handleComplete,
  };
}
