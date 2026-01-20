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
  | 'complete';

export interface LoginData {
  email: string;
  code: string[];
}

export interface UseLoginMachineOptions {
  /** Campus email domain (e.g., "buffalo.edu") */
  domain: string;
  /** School ID for API calls */
  schoolId: string;
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

  // Actions
  setEmail: (email: string) => void;
  setCode: (code: string[]) => void;

  // Transitions
  submitEmail: () => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  goBackToEmail: () => void;

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

export function useLoginMachine(options: UseLoginMachineOptions): UseLoginMachineReturn {
  const { domain, schoolId, defaultRedirect = '/spaces' } = options;

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

  const fullEmail = data.email.includes('@')
    ? data.email
    : `${data.email}@${domain}`;

  // ============================================
  // EFFECTS
  // ============================================

  // Restore pending email from localStorage
  useEffect(() => {
    const pending = localStorage.getItem(PENDING_EMAIL_KEY);
    if (pending && state === 'email') {
      const emailPart = pending.replace(`@${domain}`, '');
      setData((prev) => ({ ...prev, email: emailPart }));
    }
  }, [domain, state]);

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

    const emailToValidate = fullEmail;
    if (!emailToValidate.includes('@') || !emailToValidate.includes('.')) {
      setError('Enter a valid email address');
      return;
    }

    const emailDomain = emailToValidate.split('@')[1];
    if (emailDomain !== domain) {
      setError(`Use your ${domain} email`);
      return;
    }

    // Store email for session
    localStorage.setItem(PENDING_EMAIL_KEY, emailToValidate);

    setState('sending');
    setError(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fullEmail,
          schoolId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send code');
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
  }, [data.email, fullEmail, domain, schoolId, resendCount]);

  // Verify code
  const verifyCode = useCallback(
    async (codeString: string) => {
      setState('verifying');
      setError(null);

      try {
        const response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: fullEmail,
            code: codeString,
            schoolId,
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
    [fullEmail, schoolId, router]
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
    setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''] }));
  }, []);

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

    // Data setters
    setEmail,
    setCode,

    // Transitions
    submitEmail,
    verifyCode,
    resendCode,
    goBackToEmail,

    // Navigation
    redirectTo,
    handleComplete,
  };
}
