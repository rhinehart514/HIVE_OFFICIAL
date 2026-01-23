'use client';

/**
 * useEvolvingEntry - State Machine for Single-Page Evolving Entry Flow
 *
 * Adapts the entry flow to work as sections on a single page that evolve:
 * school → email → code → role → identity → arrival
 *
 * Flow:
 * 1. School: Select campus
 * 2. Email: Collect .edu email, send verification code
 * 3. Code: Verify 6-digit email code (creates session)
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
  verificationCode: string[];
  role: UserRole | null;
  alumniSpace: string;
  firstName: string;
  lastName: string;
  handle: string;
  major: string;
  graduationYear: number | null;
  residenceType: 'on-campus' | 'off-campus' | 'commuter' | '';
  residentialSpaceId: string;
  interests: string[];
  communityIdentities: {
    international?: boolean;
    transfer?: boolean;
    firstGen?: boolean;
    commuter?: boolean;
    graduate?: boolean;
    veteran?: boolean;
  };
}

export interface UseEvolvingEntryOptions {
  domain: string;
  campusId: string;
  schoolId: string;
  defaultRedirect?: string;
}

// Resend cooldown duration in seconds
const RESEND_COOLDOWN_SECONDS = 60;

export interface UseEvolvingEntryReturn {
  // Section visibility
  sections: Record<SectionId, SectionState>;
  activeSection: SectionId | null;

  // Data
  data: EntryData;
  fullEmail: string;
  isNewUser: boolean;
  isReturningUser: boolean;

  // Loading states
  isSubmittingEmail: boolean;
  isVerifyingCode: boolean;
  isSubmittingRole: boolean;
  isSubmittingIdentity: boolean;

  // Email cooldown
  resendCooldown: number;

  // Handle checking
  handleStatus: HandleStatus;
  handleSuggestions: string[];

  // Data setters
  setSchool: (school: School) => void;
  setEmail: (email: string) => void;
  setVerificationCode: (code: string[]) => void;
  setRole: (role: UserRole) => void;
  setAlumniSpace: (space: string) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setHandle: (handle: string) => void;
  selectSuggestion: (handle: string) => void;
  setMajor: (major: string) => void;
  setGraduationYear: (year: number | null) => void;
  setResidenceType: (type: 'on-campus' | 'off-campus' | 'commuter') => void;
  setResidentialSpaceId: (spaceId: string) => void;
  setInterests: (interests: string[]) => void;
  setCommunityIdentities: (identities: { international?: boolean; transfer?: boolean; firstGen?: boolean; commuter?: boolean; graduate?: boolean; veteran?: boolean }) => void;

  // Section actions
  confirmSchool: () => void;
  submitEmail: () => Promise<void>;
  verifyEmailCode: (codeString: string) => Promise<void>;
  resendCode: () => Promise<void>;
  submitRole: () => Promise<void>;
  completeIdentity: () => Promise<void>;

  // Edit actions (go back)
  editSchool: () => void;
  editEmail: () => void;

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

const createInitialSections = (): Record<SectionId, SectionState> => {
  // Flow: school → email → code → role → identity → arrival
  return {
    school: { id: 'school', status: 'active' },
    email: { id: 'email', status: 'hidden' },
    code: { id: 'code', status: 'hidden' },
    role: { id: 'role', status: 'hidden' },
    identity: { id: 'identity', status: 'hidden' },
    arrival: { id: 'arrival', status: 'hidden' },
    'alumni-waitlist': { id: 'alumni-waitlist', status: 'hidden' },
  };
};

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

  const [sections, setSections] = useState<Record<SectionId, SectionState>>(createInitialSections);

  const [data, setData] = useState<EntryData>({
    school: null,
    email: '',
    verificationCode: ['', '', '', '', '', ''],
    role: null,
    alumniSpace: '',
    firstName: '',
    lastName: '',
    handle: '',
    major: '',
    graduationYear: null,
    residenceType: '',
    residentialSpaceId: '',
    interests: [],
    communityIdentities: {},
  });

  // User state
  const [isNewUser, setIsNewUser] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Loading states
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);

  // Email resend cooldown (seconds remaining)
  const [resendCooldown, setResendCooldown] = useState(0);

  // Handle checking
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle');
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);

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

  // Computed: full email with domain
  const fullEmail = useMemo(() => {
    if (!data.email || !domain) return '';
    return `${data.email}@${domain}`;
  }, [data.email, domain]);

  // Effect: Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  // No email-related effects needed - entry is code-based

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

  const setVerificationCode = useCallback((verificationCode: string[]) => {
    setData((prev) => ({ ...prev, verificationCode }));
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

  const setResidenceType = useCallback((residenceType: 'on-campus' | 'off-campus' | 'commuter') => {
    setData((prev) => ({ ...prev, residenceType }));
  }, []);

  const setResidentialSpaceId = useCallback((residentialSpaceId: string) => {
    setData((prev) => ({ ...prev, residentialSpaceId }));
  }, []);

  const setInterests = useCallback((interests: string[]) => {
    setData((prev) => ({ ...prev, interests }));
  }, []);

  const setCommunityIdentities = useCallback((communityIdentities: { international?: boolean; transfer?: boolean; firstGen?: boolean; commuter?: boolean; graduate?: boolean; veteran?: boolean }) => {
    setData((prev) => ({ ...prev, communityIdentities }));
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

  // Email: Submit email and send verification code
  const submitEmail = useCallback(async () => {
    const email = dataRef.current.email.trim();
    if (!email) {
      setSectionError('email', 'Enter your email');
      return;
    }

    setIsSubmittingEmail(true);
    clearSectionError('email');

    const activeSchoolId = data.school?.id || schoolId;
    const emailWithDomain = `${email}@${domain}`;

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: emailWithDomain,
          schoolId: activeSchoolId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSectionError('email', result.error || 'Failed to send code');
        return;
      }

      // Success - move to code section and start cooldown
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      lockSection('email');
      activateSection('code');
    } catch {
      setSectionError('email', 'Failed to send code');
    } finally {
      setIsSubmittingEmail(false);
    }
  }, [data.school?.id, schoolId, domain, lockSection, activateSection, setSectionError, clearSectionError]);

  // Code: Verify email code and create session
  const verifyEmailCode = useCallback(
    async (codeString: string) => {
      setIsVerifyingCode(true);
      clearSectionError('code');

      const activeSchoolId = data.school?.id || schoolId;
      const emailWithDomain = `${dataRef.current.email}@${domain}`;

      try {
        const response = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: emailWithDomain,
            code: codeString,
            schoolId: activeSchoolId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Reset code on error
          setData((prev) => ({ ...prev, verificationCode: ['', '', '', '', '', ''] }));
          setSectionError('code', result.error || 'Invalid code');
          return;
        }

        // Success - check if returning user
        const needsOnboarding = result.needsOnboarding || !result.user?.handle;

        if (!needsOnboarding) {
          // Returning user - pre-fill and skip to arrival
          setIsReturningUser(true);
          setIsNewUser(false);
          setData((prev) => ({
            ...prev,
            firstName: result.user?.firstName || 'there',
            handle: result.user?.handle || '',
            role: result.user?.role || 'student',
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
        setData((prev) => ({ ...prev, verificationCode: ['', '', '', '', '', ''] }));
        setSectionError('code', 'Verification failed');
      } finally {
        setIsVerifyingCode(false);
      }
    },
    [data.school?.id, schoolId, domain, lockSection, activateSection, completeSection, setSectionError, clearSectionError]
  );

  // Resend: Send a new verification code
  const resendCode = useCallback(async () => {
    if (resendCooldown > 0) return;

    setIsSubmittingEmail(true);
    clearSectionError('code');

    const activeSchoolId = data.school?.id || schoolId;
    const emailWithDomain = `${dataRef.current.email}@${domain}`;

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: emailWithDomain,
          schoolId: activeSchoolId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSectionError('code', result.error || 'Failed to resend code');
        return;
      }

      // Success - reset code and start cooldown
      setData((prev) => ({ ...prev, verificationCode: ['', '', '', '', '', ''] }));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setSectionError('code', 'Failed to resend code');
    } finally {
      setIsSubmittingEmail(false);
    }
  }, [resendCooldown, data.school?.id, schoolId, domain, clearSectionError, setSectionError]);

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
          residenceType: data.residenceType || 'off-campus',
          residentialSpaceId: data.residentialSpaceId === 'off-campus' ? null : (data.residentialSpaceId || null),
          interests: data.interests || [],
          communityIdentities: data.communityIdentities || {},
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
    setSections({
      school: { id: 'school', status: 'active' },
      email: { id: 'email', status: 'hidden' },
      code: { id: 'code', status: 'hidden' },
      role: { id: 'role', status: 'hidden' },
      identity: { id: 'identity', status: 'hidden' },
      arrival: { id: 'arrival', status: 'hidden' },
      'alumni-waitlist': { id: 'alumni-waitlist', status: 'hidden' },
    });
    setData((prev) => ({
      ...prev,
      email: '',
      verificationCode: ['', '', '', '', '', ''],
      role: null,
      alumniSpace: '',
    }));
    setResendCooldown(0);
  }, []);

  const editEmail = useCallback(() => {
    // Go back to email section
    setSections((prev) => ({
      ...prev,
      email: { id: 'email', status: 'active' },
      code: { id: 'code', status: 'hidden' },
    }));
    setData((prev) => ({
      ...prev,
      verificationCode: ['', '', '', '', '', ''],
    }));
    setResendCooldown(0);
  }, []);

  // ============================================
  // ARRIVAL
  // ============================================

  const handleArrivalComplete = useCallback(() => {
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
    fullEmail,
    isNewUser,
    isReturningUser,

    // Loading states
    isSubmittingEmail,
    isVerifyingCode,
    isSubmittingRole,
    isSubmittingIdentity,

    // Email cooldown
    resendCooldown,

    // Handle checking
    handleStatus,
    handleSuggestions,

    // Data setters
    setSchool,
    setEmail,
    setVerificationCode,
    setRole,
    setAlumniSpace,
    setFirstName,
    setLastName,
    setHandle,
    selectSuggestion,
    setMajor,
    setGraduationYear,
    setResidenceType,
    setResidentialSpaceId,
    setInterests,
    setCommunityIdentities,

    // Section actions
    confirmSchool,
    submitEmail,
    verifyEmailCode,
    resendCode,
    submitRole,
    completeIdentity,

    // Edit actions
    editSchool,
    editEmail,

    // Arrival
    handleArrivalComplete,

    // Error clearing
    clearSectionError,
  };
}
