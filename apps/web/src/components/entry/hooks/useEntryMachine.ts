'use client';

/**
 * useEntryMachine - State Machine for /enter Flow
 *
 * Manages the entry state machine:
 * email → sending → code → verifying → [identity → submitting] → arrival
 *
 * New users go through identity step, returning users skip to arrival
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { HandleStatus } from '@hive/ui/design-system/primitives';

// ============================================
// TYPES
// ============================================

export type EntryState =
  | 'email'
  | 'sending'
  | 'code'
  | 'verifying'
  | 'identity'
  | 'submitting'
  | 'arrival';

export interface EntryData {
  email: string;
  code: string[];
  firstName: string;
  lastName: string;
  handle: string;
}

export interface UseEntryMachineOptions {
  /** Campus email domain (e.g., "buffalo.edu") */
  domain: string;
  /** Campus ID */
  campusId: string;
  /** School ID */
  schoolId: string;
  /** Default redirect after completion */
  defaultRedirect?: string;
}

export interface UseEntryMachineReturn {
  // State
  state: EntryState;
  data: EntryData;
  error: string | null;
  isNewUser: boolean;

  // Handle checking
  handleStatus: HandleStatus;
  handleSuggestions: string[];

  // Resend cooldown
  resendCooldown: number;

  // Actions
  setEmail: (email: string) => void;
  setCode: (code: string[]) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setHandle: (handle: string) => void;
  selectSuggestion: (handle: string) => void;

  // Transitions
  sendCode: () => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  completeEntry: () => Promise<void>;
  goBackToEmail: () => void;
  resendCode: () => Promise<void>;

  // Navigation
  redirectTo: string;
  handleArrivalComplete: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;
const HANDLE_CHECK_DEBOUNCE = 300;
const RESEND_COOLDOWNS = [30, 60, 120, 300]; // Progressive cooldowns

// Pending email storage key
const PENDING_EMAIL_KEY = 'hive_pending_email';

// ============================================
// UTILITIES
// ============================================

function debounce<T extends (...args: string[]) => void | Promise<void>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function generateHandleSuggestions(
  base: string,
  firstName: string,
  lastName: string
): string[] {
  const suggestions: string[] = [];
  const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (clean.length >= 3) {
    suggestions.push(`${clean}_1`);
    suggestions.push(`${clean}${Math.floor(Math.random() * 100)}`);
  }

  if (firstName && lastName) {
    const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
    if (first && last) {
      suggestions.push(`${first}_${last.charAt(0)}`);
      suggestions.push(`${first}${last.charAt(0)}${Math.floor(Math.random() * 10)}`);
    }
  }

  return suggestions.slice(0, 3);
}

// ============================================
// HOOK
// ============================================

export function useEntryMachine(options: UseEntryMachineOptions): UseEntryMachineReturn {
  const { domain, campusId, schoolId, defaultRedirect = '/spaces/browse' } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect from URL params or use default
  const redirectTo = searchParams.get('redirect') || defaultRedirect;

  // Initial state from URL
  const initialState = (searchParams.get('state') as EntryState) || 'email';

  // ============================================
  // STATE
  // ============================================

  const [state, setState] = useState<EntryState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const [data, setData] = useState<EntryData>({
    email: '',
    code: ['', '', '', '', '', ''],
    firstName: '',
    lastName: '',
    handle: '',
  });

  // Handle checking
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle');
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Refs for cleanup
  const checkHandleAbortRef = useRef<AbortController | null>(null);

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

  // Handle availability checking (debounced)
  const checkHandle = useCallback(
    async (handle: string) => {
      // Cancel previous request
      if (checkHandleAbortRef.current) {
        checkHandleAbortRef.current.abort();
      }

      // Validate format first
      if (!handle.trim()) {
        setHandleStatus('idle');
        setHandleSuggestions([]);
        return;
      }

      if (!HANDLE_REGEX.test(handle)) {
        setHandleStatus('invalid');
        setHandleSuggestions([]);
        return;
      }

      setHandleStatus('checking');

      try {
        const controller = new AbortController();
        checkHandleAbortRef.current = controller;

        const response = await fetch(
          `/api/auth/check-handle?handle=${encodeURIComponent(handle)}`,
          { signal: controller.signal }
        );

        const result = await response.json();

        if (result.available) {
          setHandleStatus('available');
          setHandleSuggestions([]);
        } else {
          setHandleStatus('taken');
          setHandleSuggestions(
            generateHandleSuggestions(handle, data.firstName, data.lastName)
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignored - request was cancelled
        }
        console.error('Handle check failed:', err);
        setHandleStatus('idle'); // Fail silently, let user try
      }
    },
    [data.firstName, data.lastName]
  );

  // Debounced handle check
  const debouncedCheckHandle = useCallback(
    debounce(checkHandle, HANDLE_CHECK_DEBOUNCE),
    [checkHandle]
  );

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

  const setFirstName = useCallback((firstName: string) => {
    setData((prev) => ({ ...prev, firstName }));
  }, []);

  const setLastName = useCallback((lastName: string) => {
    setData((prev) => ({ ...prev, lastName }));
  }, []);

  const setHandle = useCallback(
    (handle: string) => {
      const cleaned = handle.replace(/^@/, '').toLowerCase();
      setData((prev) => ({ ...prev, handle: cleaned }));
      debouncedCheckHandle(cleaned);
    },
    [debouncedCheckHandle]
  );

  const selectSuggestion = useCallback(
    (handle: string) => {
      setData((prev) => ({ ...prev, handle }));
      checkHandle(handle); // Check immediately
    },
    [checkHandle]
  );

  // ============================================
  // TRANSITIONS
  // ============================================

  const sendCode = useCallback(async () => {
    // Validate email
    if (!data.email.trim()) {
      setError('Enter your email');
      return;
    }

    const emailToSend = fullEmail;
    if (!emailToSend.includes('@') || !emailToSend.includes('.')) {
      setError('Enter a valid email address');
      return;
    }

    const emailDomain = emailToSend.split('@')[1];
    if (emailDomain !== domain) {
      setError(`Use your ${domain} email`);
      return;
    }

    setState('sending');
    setError(null);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToSend,
          schoolId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send code');
      }

      // Store email for session
      localStorage.setItem(PENDING_EMAIL_KEY, emailToSend);

      // Set cooldown
      const cooldownDuration =
        RESEND_COOLDOWNS[Math.min(resendCount, RESEND_COOLDOWNS.length - 1)];
      setResendCooldown(cooldownDuration);
      setResendCount((prev) => prev + 1);

      setState('code');
    } catch (err) {
      console.error('Send code error:', err);
      setError(err instanceof Error ? err.message : 'Unable to send code');
      setState('email');
    }
  }, [data.email, fullEmail, domain, schoolId, resendCount]);

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

        // Determine if new or returning user
        const needsIdentity = result.needsOnboarding || !result.user?.handle;
        setIsNewUser(needsIdentity);

        if (needsIdentity) {
          // Pre-fill name if available
          if (result.user?.firstName) {
            setData((prev) => ({
              ...prev,
              firstName: result.user.firstName || '',
              lastName: result.user.lastName || '',
              handle: result.user.handle || '',
            }));
          }
          setState('identity');
        } else {
          // Pre-fill for arrival message
          setData((prev) => ({
            ...prev,
            firstName: result.user.firstName || 'there',
            handle: result.user.handle || '',
          }));
          setState('arrival');
        }
      } catch (err) {
        console.error('Verify error:', err);
        setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''] }));
        setError('Verification failed');
        setState('code');
      }
    },
    [fullEmail, schoolId]
  );

  const completeEntry = useCallback(async () => {
    // Validate
    if (!data.firstName.trim() || !data.lastName.trim()) {
      setError('Enter your name');
      return;
    }

    if (!data.handle.trim() || handleStatus !== 'available') {
      setError('Choose an available handle');
      return;
    }

    setState('submitting');
    setError(null);

    try {
      const response = await fetch('/api/auth/complete-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          handle: data.handle.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete setup');
      }

      setState('arrival');
    } catch (err) {
      console.error('Complete entry error:', err);
      setError(err instanceof Error ? err.message : 'Setup failed');
      setState('identity');
    }
  }, [data.firstName, data.lastName, data.handle, handleStatus]);

  const goBackToEmail = useCallback(() => {
    setState('email');
    setError(null);
    setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''] }));
  }, []);

  const resendCode = useCallback(async () => {
    if (resendCooldown > 0) return;
    await sendCode();
  }, [resendCooldown, sendCode]);

  const handleArrivalComplete = useCallback(() => {
    // Clear pending email
    localStorage.removeItem(PENDING_EMAIL_KEY);
    // Set flag for first-time welcome on browse page
    if (isNewUser) {
      sessionStorage.setItem('hive-just-entered', 'true');
    }
    // Navigate to redirect
    router.push(redirectTo);
  }, [router, redirectTo, isNewUser]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    state,
    data,
    error,
    isNewUser,

    // Handle checking
    handleStatus,
    handleSuggestions,

    // Resend
    resendCooldown,

    // Data setters
    setEmail,
    setCode,
    setFirstName,
    setLastName,
    setHandle,
    selectSuggestion,

    // Transitions
    sendCode,
    verifyCode,
    completeEntry,
    goBackToEmail,
    resendCode,

    // Navigation
    redirectTo,
    handleArrivalComplete,
  };
}
