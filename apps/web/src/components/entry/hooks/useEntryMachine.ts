'use client';

/**
 * useEntryMachine - State Machine for /enter Flow
 * UPDATED: Jan 18, 2026
 *
 * Manages the entry state machine:
 * school → email → role → sending → code → verifying → [identity → submitting] → arrival
 *
 * Role-based flows:
 * - Student: Full flow with identity/profile setup
 * - Faculty: Skip identity, go straight to arrival after verification
 * - Alumni: Skip verification entirely, go to waitlist
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { HandleStatus } from '@hive/ui/design-system/primitives';
import type { UserRole } from '../states/RoleState';
import type { School } from '../states/SchoolState';

// ============================================
// TYPES
// ============================================

export type EntryState =
  | 'school'
  | 'email'
  | 'sending'
  | 'code'
  | 'verifying'
  | 'role'
  | 'identity'
  | 'submitting'
  | 'arrival'
  | 'alumni-waitlist';

export interface EntryData {
  school: School | null;
  email: string;
  code: string[];
  role: UserRole | null;
  alumniSpace: string;
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
  setSchool: (school: School) => void;
  setEmail: (email: string) => void;
  setCode: (code: string[]) => void;
  setRole: (role: UserRole) => void;
  setAlumniSpace: (space: string) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setHandle: (handle: string) => void;
  selectSuggestion: (handle: string) => void;

  // Transitions
  selectSchool: (school: School) => void;
  proceedToRole: () => void;
  verifyCode: (code: string) => Promise<void>;
  submitRole: () => Promise<void>;
  completeEntry: () => Promise<void>;
  goBackToSchool: () => void;
  goBackToEmail: () => void;
  goBackToRole: () => void;
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
  const { domain, campusId, schoolId, defaultRedirect = '/spaces' } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect from URL params or use default
  const redirectTo = searchParams.get('redirect') || defaultRedirect;

  // Initial state from URL
  const initialState = (searchParams.get('state') as EntryState) || 'school';

  // ============================================
  // STATE
  // ============================================

  const [state, setState] = useState<EntryState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const [data, setData] = useState<EntryData>({
    school: null,
    email: '',
    code: ['', '', '', '', '', ''],
    role: null,
    alumniSpace: '',
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

  // Use selected school domain or fall back to default
  const activeDomain = data.school?.domain || domain;

  const fullEmail = data.email.includes('@')
    ? data.email
    : `${data.email}@${activeDomain}`;

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

  const setSchool = useCallback((school: School) => {
    setData((prev) => ({ ...prev, school }));
    setError(null);
  }, []);

  const setEmail = useCallback((email: string) => {
    setData((prev) => ({ ...prev, email }));
    setError(null);
  }, []);

  const setCode = useCallback((code: string[]) => {
    setData((prev) => ({ ...prev, code }));
    setError(null);
  }, []);

  const setRole = useCallback((role: UserRole) => {
    setData((prev) => ({ ...prev, role }));
    setError(null);
  }, []);

  const setAlumniSpace = useCallback((alumniSpace: string) => {
    setData((prev) => ({ ...prev, alumniSpace }));
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

  // Select school and proceed to email
  const selectSchool = useCallback((school: School) => {
    setData((prev) => ({ ...prev, school }));
    setError(null);
    setState('email');
  }, []);

  // Validate and proceed to role selection
  const proceedToRole = useCallback(() => {
    // Validate school is selected
    if (!data.school) {
      setError('Select your school first');
      return;
    }

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
    if (emailDomain !== activeDomain) {
      setError(`Use your ${activeDomain} email`);
      return;
    }

    // Store email for session
    localStorage.setItem(PENDING_EMAIL_KEY, emailToValidate);

    setError(null);
    setState('role');
  }, [data.email, data.school, fullEmail, activeDomain]);

  // Send verification code (called after role selection for student/faculty)
  const sendCode = useCallback(async () => {
    setState('sending');
    setError(null);

    // Use selected school ID or fall back to default
    const activeSchoolId = data.school?.id || schoolId;

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fullEmail,
          schoolId: activeSchoolId,
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
      setState('role');
    }
  }, [fullEmail, data.school?.id, schoolId, resendCount]);

  const verifyCode = useCallback(
    async (codeString: string) => {
      setState('verifying');
      setError(null);

      // Use selected school ID or fall back to default
      const activeSchoolId = data.school?.id || schoolId;

      try {
        const response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: fullEmail,
            code: codeString,
            schoolId: activeSchoolId,
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
        const needsOnboarding = result.needsOnboarding || !result.user?.handle;
        setIsNewUser(needsOnboarding);

        if (!needsOnboarding) {
          // Returning user - pre-fill and go to arrival
          setData((prev) => ({
            ...prev,
            firstName: result.user.firstName || 'there',
            handle: result.user.handle || '',
            role: result.user.role || data.role || 'student',
          }));
          setState('arrival');
          return;
        }

        // New user - route based on role (already selected before code)
        if (data.role === 'faculty') {
          // Faculty skip identity, complete entry directly
          setState('submitting');

          const completeResponse = await fetch('/api/auth/complete-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              firstName: '',
              lastName: '',
              handle: '',
              role: 'faculty',
            }),
          });

          const completeResult = await completeResponse.json();

          if (!completeResponse.ok) {
            throw new Error(completeResult.error || 'Failed to complete setup');
          }

          setData((prev) => ({
            ...prev,
            firstName: completeResult.user?.firstName || 'there',
            handle: completeResult.user?.handle || '',
          }));

          setState('arrival');
        } else {
          // Student - go to identity for profile setup
          setState('identity');
        }
      } catch {
        setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''] }));
        setError('Verification failed');
        setState('code');
      }
    },
    [fullEmail, data.school?.id, schoolId, data.role]
  );

  const submitRole = useCallback(async () => {
    if (!data.role) {
      setError('Select your role');
      return;
    }

    setError(null);

    // Alumni flow - goes straight to waitlist (no verification needed)
    if (data.role === 'alumni') {
      if (!data.alumniSpace.trim()) {
        setError('Tell us which spaces you were part of');
        return;
      }

      // Submit to waitlist
      try {
        await fetch('/api/auth/alumni-waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: fullEmail,
            spaces: data.alumniSpace,
          }),
        });
      } catch {
        // Continue anyway - we don't want to block them
      }

      setState('alumni-waitlist');
      return;
    }

    // Student/Faculty - send verification code
    // Routing after verification is handled in verifyCode based on role
    await sendCode();
  }, [data.role, data.alumniSpace, fullEmail, sendCode]);

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
          role: data.role || 'student',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete setup');
      }

      setState('arrival');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setState('identity');
    }
  }, [data.firstName, data.lastName, data.handle, data.role, handleStatus]);

  const goBackToSchool = useCallback(() => {
    setState('school');
    setError(null);
    setData((prev) => ({ ...prev, school: null, email: '', code: ['', '', '', '', '', ''], role: null, alumniSpace: '' }));
  }, []);

  const goBackToEmail = useCallback(() => {
    setState('email');
    setError(null);
    setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''], role: null, alumniSpace: '' }));
  }, []);

  const goBackToRole = useCallback(() => {
    setState('role');
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

    // Handle alumni waitlist differently
    if (state === 'alumni-waitlist') {
      router.push('/');
      return;
    }

    // Set flag for first-time welcome on browse page
    if (isNewUser) {
      sessionStorage.setItem('hive-just-entered', 'true');
    }

    // Navigate to redirect
    router.push(redirectTo);
  }, [router, redirectTo, isNewUser, state]);

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
    setSchool,
    setEmail,
    setCode,
    setRole,
    setAlumniSpace,
    setFirstName,
    setLastName,
    setHandle,
    selectSuggestion,

    // Transitions
    selectSchool,
    proceedToRole,
    verifyCode,
    submitRole,
    completeEntry,
    goBackToSchool,
    goBackToEmail,
    goBackToRole,
    resendCode,

    // Navigation
    redirectTo,
    handleArrivalComplete,
  };
}
