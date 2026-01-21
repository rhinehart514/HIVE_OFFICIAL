'use client';

/**
 * useEvolvingEntry - State Machine for Single-Page Evolving Entry Flow
 *
 * Adapts the entry flow to work as sections on a single page that evolve:
 * school → email → code → role → identity → arrival
 *
 * Key differences from useEntryMachine:
 * - Completed sections remain visible as locked chips
 * - Role selection is an "earned moment" AFTER code verification
 * - Alumni path diverges after role selection (no separate page)
 * - All sections animate in place, no page transitions
 *
 * Flow:
 * 1. School: Select campus
 * 2. Email: Enter and submit (sends code)
 * 3. Code: Verify 6-digit OTP
 * 4. Role: Choose student/faculty/alumni (earned moment)
 * 5. Identity: Profile setup (new students only)
 * 6. Arrival: Welcome celebration
 *
 * Alumni diverges after role → shows waitlist inline
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { HandleStatus } from '@hive/ui/design-system/primitives';

// ============================================
// TYPES
// ============================================

export type UserRole = 'student' | 'faculty' | 'alumni';

export interface School {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  location: string;
  status: 'active' | 'waitlist' | 'beta';
  color: string;
}

export type SectionId =
  | 'school'
  | 'email'
  | 'code'
  | 'role'
  | 'identity'
  | 'arrival'
  | 'alumni-waitlist';

export type SectionStatus = 'hidden' | 'active' | 'locked' | 'complete';

export interface SectionState {
  id: SectionId;
  status: SectionStatus;
  error?: string;
}

export interface EntryData {
  school: School | null;
  email: string;
  code: string[];
  role: UserRole | null;
  alumniSpace: string;
  firstName: string;
  lastName: string;
  handle: string;
  major: string;
  graduationYear: number | null;
  residentialSpaceId: string;
}

export interface UseEvolvingEntryOptions {
  domain: string;
  campusId: string;
  schoolId: string;
  defaultRedirect?: string;
}

export interface UseEvolvingEntryReturn {
  // Section visibility
  sections: Record<SectionId, SectionState>;
  activeSection: SectionId | null;

  // Data
  data: EntryData;
  isNewUser: boolean;
  isReturningUser: boolean;

  // Loading states
  isSendingCode: boolean;
  isVerifyingCode: boolean;
  isSubmittingRole: boolean;
  isSubmittingIdentity: boolean;

  // Handle checking
  handleStatus: HandleStatus;
  handleSuggestions: string[];

  // Resend cooldown
  resendCooldown: number;

  // Computed
  fullEmail: string;

  // Data setters
  setSchool: (school: School) => void;
  setEmail: (email: string) => void;
  setCode: (code: string[]) => void;
  setRole: (role: UserRole) => void;
  setAlumniSpace: (space: string) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setHandle: (handle: string) => void;
  selectSuggestion: (handle: string) => void;
  setMajor: (major: string) => void;
  setGraduationYear: (year: number | null) => void;
  setResidentialSpaceId: (spaceId: string) => void;

  // Section actions
  confirmSchool: () => void;
  submitEmail: () => Promise<void>;
  verifyCode: (codeString: string) => Promise<void>;
  submitRole: () => Promise<void>;
  completeIdentity: () => Promise<void>;

  // Edit actions (go back)
  editSchool: () => void;
  editEmail: () => void;

  // Resend
  resendCode: () => Promise<void>;

  // Arrival
  handleArrivalComplete: () => void;

  // Error clearing
  clearSectionError: (sectionId: SectionId) => void;
}

// ============================================
// CONSTANTS
// ============================================

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;
const HANDLE_CHECK_DEBOUNCE = 300;
const RESEND_COOLDOWNS = [30, 60, 120, 300];
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
// INITIAL SECTION STATES
// ============================================

const createInitialSections = (): Record<SectionId, SectionState> => ({
  school: { id: 'school', status: 'active' },
  email: { id: 'email', status: 'hidden' },
  code: { id: 'code', status: 'hidden' },
  role: { id: 'role', status: 'hidden' },
  identity: { id: 'identity', status: 'hidden' },
  arrival: { id: 'arrival', status: 'hidden' },
  'alumni-waitlist': { id: 'alumni-waitlist', status: 'hidden' },
});

// ============================================
// HOOK
// ============================================

export function useEvolvingEntry(options: UseEvolvingEntryOptions): UseEvolvingEntryReturn {
  const { domain, campusId, schoolId, defaultRedirect = '/spaces' } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || defaultRedirect;

  // ============================================
  // STATE
  // ============================================

  const [sections, setSections] = useState<Record<SectionId, SectionState>>(
    createInitialSections
  );

  const [data, setData] = useState<EntryData>({
    school: null,
    email: '',
    code: ['', '', '', '', '', ''],
    role: null,
    alumniSpace: '',
    firstName: '',
    lastName: '',
    handle: '',
    major: '',
    graduationYear: null,
    residentialSpaceId: '',
  });

  // User state
  const [isNewUser, setIsNewUser] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Loading states
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);

  // Handle checking
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle');
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Refs
  const checkHandleAbortRef = useRef<AbortController | null>(null);
  const dataRef = useRef(data);

  // Keep dataRef in sync with latest data
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const activeDomain = data.school?.domain || domain;

  const fullEmail = useMemo(() => {
    if (data.email.includes('@')) return data.email;
    return `${data.email}@${activeDomain}`;
  }, [data.email, activeDomain]);

  const activeSection = useMemo(() => {
    const sectionOrder: SectionId[] = [
      'school',
      'email',
      'code',
      'role',
      'identity',
      'arrival',
      'alumni-waitlist',
    ];
    return sectionOrder.find((id) => sections[id].status === 'active') || null;
  }, [sections]);

  // ============================================
  // SECTION STATE HELPERS
  // ============================================

  const updateSection = useCallback(
    (id: SectionId, updates: Partial<SectionState>) => {
      setSections((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...updates },
      }));
    },
    []
  );

  const lockSection = useCallback(
    (id: SectionId) => {
      updateSection(id, { status: 'locked', error: undefined });
    },
    [updateSection]
  );

  const activateSection = useCallback(
    (id: SectionId) => {
      updateSection(id, { status: 'active', error: undefined });
    },
    [updateSection]
  );

  const completeSection = useCallback(
    (id: SectionId) => {
      updateSection(id, { status: 'complete', error: undefined });
    },
    [updateSection]
  );

  const setSectionError = useCallback(
    (id: SectionId, error: string) => {
      updateSection(id, { error });
    },
    [updateSection]
  );

  const clearSectionError = useCallback(
    (id: SectionId) => {
      updateSection(id, { error: undefined });
    },
    [updateSection]
  );

  // ============================================
  // EFFECTS
  // ============================================

  // Restore pending email from localStorage
  useEffect(() => {
    const pending = localStorage.getItem(PENDING_EMAIL_KEY);
    if (pending && sections.email.status === 'active') {
      const emailPart = pending.replace(`@${domain}`, '');
      setData((prev) => ({ ...prev, email: emailPart }));
    }
  }, [domain, sections.email.status]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ============================================
  // HANDLE CHECKING
  // ============================================

  const checkHandle = useCallback(
    async (handle: string) => {
      if (checkHandleAbortRef.current) {
        checkHandleAbortRef.current.abort();
      }

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
          return;
        }
        setHandleStatus('idle');
      }
    },
    [data.firstName, data.lastName]
  );

  const debouncedCheckHandle = useCallback(
    debounce(checkHandle, HANDLE_CHECK_DEBOUNCE),
    [checkHandle]
  );

  // ============================================
  // DATA SETTERS
  // ============================================

  const setSchool = useCallback((school: School) => {
    setData((prev) => ({ ...prev, school }));
    clearSectionError('school');
  }, [clearSectionError]);

  const setEmail = useCallback((email: string) => {
    setData((prev) => ({ ...prev, email }));
    clearSectionError('email');
  }, [clearSectionError]);

  const setCode = useCallback((code: string[]) => {
    setData((prev) => ({ ...prev, code }));
    clearSectionError('code');
  }, [clearSectionError]);

  const setRole = useCallback((role: UserRole) => {
    setData((prev) => ({ ...prev, role }));
    clearSectionError('role');
  }, [clearSectionError]);

  const setAlumniSpace = useCallback((alumniSpace: string) => {
    setData((prev) => ({ ...prev, alumniSpace }));
  }, []);

  const setFirstName = useCallback((firstName: string) => {
    setData((prev) => ({ ...prev, firstName }));
    clearSectionError('identity');
  }, [clearSectionError]);

  const setLastName = useCallback((lastName: string) => {
    setData((prev) => ({ ...prev, lastName }));
    clearSectionError('identity');
  }, [clearSectionError]);

  const setHandle = useCallback(
    (handle: string) => {
      const cleaned = handle.replace(/^@/, '').toLowerCase();
      setData((prev) => ({ ...prev, handle: cleaned }));
      debouncedCheckHandle(cleaned);
      clearSectionError('identity');
    },
    [debouncedCheckHandle, clearSectionError]
  );

  const selectSuggestion = useCallback(
    (handle: string) => {
      setData((prev) => ({ ...prev, handle }));
      checkHandle(handle);
    },
    [checkHandle]
  );

  const setMajor = useCallback((major: string) => {
    setData((prev) => ({ ...prev, major }));
  }, []);

  const setGraduationYear = useCallback((graduationYear: number | null) => {
    setData((prev) => ({ ...prev, graduationYear }));
  }, []);

  const setResidentialSpaceId = useCallback((residentialSpaceId: string) => {
    setData((prev) => ({ ...prev, residentialSpaceId }));
  }, []);

  // ============================================
  // SECTION ACTIONS
  // ============================================

  // School: Confirm selection and proceed to email
  const confirmSchool = useCallback(() => {
    // Use dataRef to get latest value (avoids stale closure issue)
    if (!dataRef.current.school) {
      setSectionError('school', 'Select your school');
      return;
    }

    lockSection('school');
    activateSection('email');
  }, [lockSection, activateSection, setSectionError]);

  // Email: Submit and send verification code
  const submitEmail = useCallback(async () => {
    if (!data.email.trim()) {
      setSectionError('email', 'Enter your email');
      return;
    }

    if (!fullEmail.includes('@') || !fullEmail.includes('.')) {
      setSectionError('email', 'Enter a valid email address');
      return;
    }

    const emailDomain = fullEmail.split('@')[1];
    if (emailDomain !== activeDomain) {
      setSectionError('email', `Use your ${activeDomain} email`);
      return;
    }

    // Store email for session recovery
    localStorage.setItem(PENDING_EMAIL_KEY, fullEmail);

    setIsSendingCode(true);
    clearSectionError('email');

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

      // Lock email, activate code
      lockSection('email');
      activateSection('code');
    } catch (err) {
      setSectionError('email', err instanceof Error ? err.message : 'Unable to send code');
    } finally {
      setIsSendingCode(false);
    }
  }, [
    data.email,
    data.school?.id,
    fullEmail,
    activeDomain,
    schoolId,
    resendCount,
    lockSection,
    activateSection,
    setSectionError,
    clearSectionError,
  ]);

  // Code: Verify OTP
  const verifyCode = useCallback(
    async (codeString: string) => {
      setIsVerifyingCode(true);
      clearSectionError('code');

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
          setSectionError('code', result.error || 'Invalid code');
          return;
        }

        // Check if returning user
        const needsOnboarding = result.needsOnboarding || !result.user?.handle;

        if (!needsOnboarding) {
          // Returning user - pre-fill and skip to arrival
          setIsReturningUser(true);
          setIsNewUser(false);
          setData((prev) => ({
            ...prev,
            firstName: result.user.firstName || 'there',
            handle: result.user.handle || '',
            role: result.user.role || 'student',
          }));

          lockSection('code');
          completeSection('arrival');
          activateSection('arrival');
          return;
        }

        // New user - proceed to role selection (earned moment)
        setIsNewUser(true);
        setIsReturningUser(false);
        lockSection('code');
        activateSection('role');
      } catch {
        setData((prev) => ({ ...prev, code: ['', '', '', '', '', ''] }));
        setSectionError('code', 'Verification failed');
      } finally {
        setIsVerifyingCode(false);
      }
    },
    [fullEmail, data.school?.id, schoolId, lockSection, activateSection, completeSection, setSectionError, clearSectionError]
  );

  // Role: Submit role selection
  const submitRole = useCallback(async () => {
    if (!data.role) {
      setSectionError('role', 'Select your role');
      return;
    }

    setIsSubmittingRole(true);
    clearSectionError('role');

    try {
      // Alumni flow - goes straight to waitlist
      if (data.role === 'alumni') {
        if (!data.alumniSpace.trim()) {
          setSectionError('role', 'Tell us which spaces you were part of');
          setIsSubmittingRole(false);
          return;
        }

        // Fire and forget to waitlist API
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
          // Continue anyway
        }

        lockSection('role');
        activateSection('alumni-waitlist');
        return;
      }

      // Faculty flow - skip identity, complete entry directly
      if (data.role === 'faculty') {
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

        lockSection('role');
        completeSection('arrival');
        activateSection('arrival');
        return;
      }

      // Student flow - proceed to identity
      lockSection('role');
      activateSection('identity');
    } catch (err) {
      setSectionError('role', err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsSubmittingRole(false);
    }
  }, [
    data.role,
    data.alumniSpace,
    fullEmail,
    lockSection,
    activateSection,
    completeSection,
    setSectionError,
    clearSectionError,
  ]);

  // Identity: Complete profile setup
  const completeIdentity = useCallback(async () => {
    if (!data.firstName.trim() || !data.lastName.trim()) {
      setSectionError('identity', 'Enter your name');
      return;
    }

    if (!data.handle.trim() || handleStatus !== 'available') {
      setSectionError('identity', 'Choose an available handle');
      return;
    }

    setIsSubmittingIdentity(true);
    clearSectionError('identity');

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
          major: data.major || null,
          graduationYear: data.graduationYear || null,
          residentialSpaceId: data.residentialSpaceId === 'off-campus' ? null : (data.residentialSpaceId || null),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete setup');
      }

      lockSection('identity');
      completeSection('arrival');
      activateSection('arrival');
    } catch (err) {
      setSectionError('identity', err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsSubmittingIdentity(false);
    }
  }, [
    data,
    handleStatus,
    lockSection,
    activateSection,
    completeSection,
    setSectionError,
    clearSectionError,
  ]);

  // ============================================
  // EDIT ACTIONS
  // ============================================

  const editSchool = useCallback(() => {
    // Reset everything after school
    setSections((prev) => ({
      ...prev,
      school: { id: 'school', status: 'active' },
      email: { id: 'email', status: 'hidden' },
      code: { id: 'code', status: 'hidden' },
      role: { id: 'role', status: 'hidden' },
      identity: { id: 'identity', status: 'hidden' },
      arrival: { id: 'arrival', status: 'hidden' },
      'alumni-waitlist': { id: 'alumni-waitlist', status: 'hidden' },
    }));
    setData((prev) => ({
      ...prev,
      email: '',
      code: ['', '', '', '', '', ''],
      role: null,
      alumniSpace: '',
    }));
  }, []);

  const editEmail = useCallback(() => {
    // Reset everything after email
    setSections((prev) => ({
      ...prev,
      email: { id: 'email', status: 'active' },
      code: { id: 'code', status: 'hidden' },
      role: { id: 'role', status: 'hidden' },
      identity: { id: 'identity', status: 'hidden' },
      arrival: { id: 'arrival', status: 'hidden' },
      'alumni-waitlist': { id: 'alumni-waitlist', status: 'hidden' },
    }));
    setData((prev) => ({
      ...prev,
      code: ['', '', '', '', '', ''],
      role: null,
      alumniSpace: '',
    }));
  }, []);

  // ============================================
  // RESEND
  // ============================================

  const resendCode = useCallback(async () => {
    if (resendCooldown > 0) return;

    setIsSendingCode(true);
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

      const cooldownDuration =
        RESEND_COOLDOWNS[Math.min(resendCount, RESEND_COOLDOWNS.length - 1)];
      setResendCooldown(cooldownDuration);
      setResendCount((prev) => prev + 1);
    } catch (err) {
      setSectionError('code', err instanceof Error ? err.message : 'Unable to resend code');
    } finally {
      setIsSendingCode(false);
    }
  }, [resendCooldown, fullEmail, data.school?.id, schoolId, resendCount, setSectionError]);

  // ============================================
  // ARRIVAL
  // ============================================

  const handleArrivalComplete = useCallback(() => {
    localStorage.removeItem(PENDING_EMAIL_KEY);

    // Alumni waitlist goes to home
    if (sections['alumni-waitlist'].status === 'active') {
      router.push('/');
      return;
    }

    // Set flag for first-time welcome
    if (isNewUser) {
      sessionStorage.setItem('hive-just-entered', 'true');
    }

    router.push(redirectTo);
  }, [router, redirectTo, isNewUser, sections]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Section visibility
    sections,
    activeSection,

    // Data
    data,
    isNewUser,
    isReturningUser,

    // Loading states
    isSendingCode,
    isVerifyingCode,
    isSubmittingRole,
    isSubmittingIdentity,

    // Handle checking
    handleStatus,
    handleSuggestions,

    // Resend cooldown
    resendCooldown,

    // Computed
    fullEmail,

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
    setMajor,
    setGraduationYear,
    setResidentialSpaceId,

    // Section actions
    confirmSchool,
    submitEmail,
    verifyCode,
    submitRole,
    completeIdentity,

    // Edit actions
    editSchool,
    editEmail,

    // Resend
    resendCode,

    // Arrival
    handleArrivalComplete,

    // Error clearing
    clearSectionError,
  };
}
