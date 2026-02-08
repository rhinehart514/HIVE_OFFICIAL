import * as React from 'react';
import { useOnboardingAnalytics } from '@hive/hooks';

/**
 * Entry Flow State Machine
 *
 * 4-phase flow: Gate → Naming → Field → Crossing
 *
 * Gate: Email verification (email → code → waitlist)
 * Naming: THE WEDGE - Real identity claim (first/last name)
 * Field: Year (required) + Major (optional)
 * Crossing: Interests selection (2-5 required)
 *
 * Community identities + residence collected later via progressive profiling in settings.
 *
 * Analytics mapping:
 * - gate (email/code) → 'welcome'
 * - naming → 'name'
 * - field → 'academics'
 * - crossing → 'handle'
 */

export type EntryPhase = 'gate' | 'naming' | 'field' | 'crossing';
export type GateStep = 'email' | 'code' | 'waitlist';
export type FieldStep = 'year' | 'major';

export interface WaitlistSchoolInfo {
  id: string;
  name: string;
}

export interface EntryData {
  // Gate
  email: string;
  code: string[];

  // Naming
  firstName: string;
  lastName: string;

  // Field
  graduationYear: number | null;
  major: string;

  // Crossing
  interests: string[];

  // Handle override (if user selects a suggested handle)
  handleOverride: string | null;
}

export interface HandlePreviewState {
  preview: string;
  isAvailable: boolean | null; // null = checking or not checked yet
  isChecking: boolean;
  error: string | null;
}

export interface EntryState {
  phase: EntryPhase;
  gateStep: GateStep;
  fieldStep: FieldStep;
  data: EntryData;
  isLoading: boolean;
  error: string | null;

  // Handle preview (shown in naming phase)
  handlePreview: HandlePreviewState;

  // Handle suggestions (shown on collision in crossing phase)
  suggestedHandles: string[];

  // Waitlist
  waitlistSchool: WaitlistSchoolInfo | null;
  waitlistSuccess: boolean;
}

export interface UseEntryOptions {
  onComplete: (redirect: string) => void;
  campusId?: string;
  schoolId?: string;
  domain?: string;
}

export interface UseEntryReturn extends EntryState {
  // Gate actions
  setEmail: (email: string) => void;
  sendCode: () => Promise<void>;
  setCode: (code: string[]) => void;
  verifyCode: () => Promise<void>;
  resendCode: () => Promise<void>;

  // Code expiry
  codeExpiresAt: Date | null;

  // Waitlist actions
  joinWaitlist: () => Promise<void>;
  setWaitlistSuccess: (success: boolean) => void;

  // Naming actions
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  submitNaming: () => void;
  checkHandleAvailability: () => Promise<void>;

  // Field actions
  setGraduationYear: (year: number | null) => void;
  setMajor: (major: string) => void;
  submitYear: () => void;
  submitField: () => void;

  // Legacy aliases (for backward compatibility)
  /** @deprecated Use submitField instead */
  submitClaim: () => void;

  // Crossing actions
  toggleInterest: (interest: string) => void;
  completeEntry: () => Promise<void>;
  selectSuggestedHandle: (handle: string) => void;
  clearSuggestedHandles: () => void;

  // Navigation
  goBack: () => void;
  cancelRequest: () => void;
}

const initialData: EntryData = {
  email: '',
  code: ['', '', '', '', '', ''],
  firstName: '',
  lastName: '',
  graduationYear: null,
  major: '',
  interests: [],
  handleOverride: null,
};

const ENTRY_STATE_KEY = 'hive_entry_state';

/** Fields safe to persist (excludes OTP code and verification status) */
interface PersistedEntryState {
  phase: EntryPhase;
  gateStep: GateStep;
  fieldStep: FieldStep;
  email: string;
  firstName: string;
  lastName: string;
  graduationYear: number | null;
  major: string;
  interests: string[];
}

function loadPersistedState(): PersistedEntryState | null {
  try {
    const saved = sessionStorage.getItem(ENTRY_STATE_KEY);
    if (!saved) return null;
    const state = JSON.parse(saved) as PersistedEntryState;
    // Only restore if user got past the gate phase (has a session cookie)
    if (state.phase === 'gate') return null;
    return state;
  } catch {
    return null;
  }
}

export function useEntry(options: UseEntryOptions): UseEntryReturn {
  const { onComplete, schoolId: initialSchoolId } = options;
  const campusId = initialSchoolId || options.campusId || 'ub-buffalo';

  // Try to restore persisted state on initial render
  const restoredState = React.useRef(loadPersistedState());

  const [phase, setPhase] = React.useState<EntryPhase>(restoredState.current?.phase ?? 'gate');
  const [gateStep, setGateStep] = React.useState<GateStep>(restoredState.current?.gateStep ?? 'email');
  const [fieldStep, setFieldStep] = React.useState<FieldStep>(restoredState.current?.fieldStep ?? 'year');
  const [data, setData] = React.useState<EntryData>(() => {
    const r = restoredState.current;
    if (!r) return initialData;
    return {
      ...initialData,
      email: r.email || '',
      firstName: r.firstName || '',
      lastName: r.lastName || '',
      graduationYear: r.graduationYear ?? null,
      major: r.major || '',
      interests: r.interests || [],
    };
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Code expiry tracking
  const [codeExpiresAt, setCodeExpiresAt] = React.useState<Date | null>(null);

  // Analytics
  const analytics = useOnboardingAnalytics();
  const analyticsInitialized = React.useRef(false);

  // School ID detection (from URL params or email domain)
  const [detectedSchoolId, setDetectedSchoolId] = React.useState<string | null>(initialSchoolId || null);

  // Handle preview state
  const [handlePreview, setHandlePreview] = React.useState<HandlePreviewState>({
    preview: '',
    isAvailable: null,
    isChecking: false,
    error: null,
  });

  // Suggested handles (on collision)
  const [suggestedHandles, setSuggestedHandles] = React.useState<string[]>([]);

  // Waitlist state
  const [waitlistSchool, setWaitlistSchool] = React.useState<WaitlistSchoolInfo | null>(null);
  const [waitlistSuccess, setWaitlistSuccess] = React.useState(false);

  // Main request abort controller (for canceling in-flight API calls)
  const requestAbort = React.useRef<AbortController | null>(null);

  // Handle check abort controller (separate from main request)
  const handleCheckAbort = React.useRef<AbortController | null>(null);
  const handleCheckTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Cancel any in-flight request
  const cancelRequest = React.useCallback(() => {
    if (requestAbort.current) {
      requestAbort.current.abort();
      requestAbort.current = null;
      setIsLoading(false);
    }
  }, []);

  // Generate handle from name
  const generateHandleFromName = React.useCallback((firstName: string, lastName: string): string => {
    const base = `${firstName}${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    return base;
  }, []);

  // Check handle availability (debounced)
  const checkHandleAvailability = React.useCallback(async () => {
    const handle = generateHandleFromName(data.firstName, data.lastName);

    if (!handle || handle.length < 3) {
      setHandlePreview((prev) => ({
        ...prev,
        preview: handle,
        isAvailable: null,
        isChecking: false,
        error: null,
      }));
      return;
    }

    // Cancel any previous check
    if (handleCheckAbort.current) {
      handleCheckAbort.current.abort();
    }

    const abortController = new AbortController();
    handleCheckAbort.current = abortController;

    setHandlePreview((prev) => ({
      ...prev,
      preview: handle,
      isChecking: true,
      error: null,
    }));

    try {
      const res = await fetch(`/api/auth/check-handle?handle=${encodeURIComponent(handle)}`, {
        signal: abortController.signal,
      });

      const result = await res.json();

      if (!abortController.signal.aborted) {
        setHandlePreview({
          preview: result.handle || handle,
          isAvailable: result.available === true,
          isChecking: false,
          error: result.available ? null : (result.reason || 'Handle not available'),
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (!abortController.signal.aborted) {
        setHandlePreview((prev) => ({
          ...prev,
          isChecking: false,
          isAvailable: null,
          error: 'Could not check availability',
        }));
      }
    }
  }, [data.firstName, data.lastName, generateHandleFromName]);

  // Persist entry state to sessionStorage after phase/step transitions
  const persistState = React.useCallback(() => {
    try {
      const state: PersistedEntryState = {
        phase, gateStep, fieldStep,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        graduationYear: data.graduationYear,
        major: data.major,
        interests: data.interests,
      };
      sessionStorage.setItem(ENTRY_STATE_KEY, JSON.stringify(state));
    } catch {
      // sessionStorage unavailable — ignore
    }
  }, [phase, gateStep, fieldStep, data]);

  // Auto-persist whenever phase or step changes (skip the initial gate phase)
  React.useEffect(() => {
    if (phase !== 'gate') {
      persistState();
    }
  }, [phase, gateStep, fieldStep, persistState]);

  // Analytics: Track phase transitions
  React.useEffect(() => {
    // Initialize onboarding tracking on first render
    if (!analyticsInitialized.current) {
      analyticsInitialized.current = true;
      analytics.trackOnboardingStarted();
    }
  }, [analytics]);

  // Analytics: Track step changes
  const prevPhase = React.useRef<EntryPhase>(phase);
  const prevGateStep = React.useRef<GateStep>(gateStep);

  React.useEffect(() => {
    // Gate step: email → code transition (entering code entry)
    if (phase === 'gate' && gateStep === 'code' && prevGateStep.current === 'email') {
      analytics.trackStepStarted('welcome');
    }

    // Gate → naming transition (code verified)
    if (phase === 'naming' && prevPhase.current === 'gate') {
      analytics.trackStepCompleted('welcome');
      analytics.trackStepStarted('name');
    }

    // Naming → field transition
    if (phase === 'field' && prevPhase.current === 'naming') {
      analytics.trackStepCompleted('name');
      analytics.trackStepStarted('academics');
    }

    // Field → crossing transition
    if (phase === 'crossing' && prevPhase.current === 'field') {
      analytics.trackStepCompleted('academics');
      analytics.trackStepStarted('handle');
    }

    prevPhase.current = phase;
    prevGateStep.current = gateStep;
  }, [phase, gateStep, analytics]);

  // Check if user is already on waitlist when entering waitlist step
  React.useEffect(() => {
    if (gateStep === 'waitlist' && waitlistSchool && data.email && !waitlistSuccess) {
      // Check if already on waitlist
      const checkWaitlist = async () => {
        try {
          const params = new URLSearchParams({
            email: data.email,
            ...(waitlistSchool.id && { schoolId: waitlistSchool.id }),
          });
          const res = await fetch(`/api/waitlist/check?${params}`);
          if (res.ok) {
            const result = await res.json();
            if (result.data?.onWaitlist) {
              setWaitlistSuccess(true);
            }
          }
        } catch {
          // Silent fail - just show normal waitlist UI
        }
      };
      checkWaitlist();
    }
  }, [gateStep, waitlistSchool, data.email, waitlistSuccess]);

  // Debounced handle check when name changes
  React.useEffect(() => {
    if (phase !== 'naming') return;

    // Clear existing timeout
    if (handleCheckTimeout.current) {
      clearTimeout(handleCheckTimeout.current);
    }

    const handle = generateHandleFromName(data.firstName, data.lastName);

    // Update preview immediately
    setHandlePreview((prev) => ({
      ...prev,
      preview: handle,
      isAvailable: null,
      isChecking: handle.length >= 3,
    }));

    // Debounce the API call
    if (handle.length >= 3) {
      handleCheckTimeout.current = setTimeout(() => {
        checkHandleAvailability();
      }, 400);
    }

    return () => {
      if (handleCheckTimeout.current) {
        clearTimeout(handleCheckTimeout.current);
      }
    };
  }, [phase, data.firstName, data.lastName, generateHandleFromName, checkHandleAvailability]);

  // Data setters
  const setEmail = (email: string) => {
    setData((d) => ({ ...d, email }));
    setError(null);
  };

  const setCode = (code: string[]) => {
    setData((d) => ({ ...d, code }));
    setError(null);
  };

  const setFirstName = (firstName: string) => {
    setData((d) => ({ ...d, firstName }));
  };

  const setLastName = (lastName: string) => {
    setData((d) => ({ ...d, lastName }));
  };

  const setGraduationYear = (graduationYear: number | null) => {
    setData((d) => ({ ...d, graduationYear }));
  };

  const setMajor = (major: string) => {
    setData((d) => ({ ...d, major }));
  };

  const toggleInterest = (interest: string) => {
    setData((d) => {
      if (d.interests.includes(interest)) {
        return { ...d, interests: d.interests.filter((i) => i !== interest) };
      }
      if (d.interests.length >= 5) {
        return d;
      }
      return { ...d, interests: [...d.interests, interest] };
    });
  };

  // API actions
  const sendCode = async () => {
    if (!data.email.trim()) {
      setError('Enter your email');
      analytics.trackValidationError('welcome', 'email', 'empty_email');
      return;
    }

    if (!data.email.includes('@') || !data.email.includes('.')) {
      setError('Enter a valid email address');
      analytics.trackValidationError('welcome', 'email', 'invalid_email_format');
      return;
    }

    // Cancel any previous request
    cancelRequest();

    const abortController = new AbortController();
    requestAbort.current = abortController;

    setIsLoading(true);
    setError(null);
    setWaitlistSchool(null);
    setWaitlistSuccess(false);
    setCodeExpiresAt(null);

    // Derive schoolId from email domain if not already set
    const emailDomain = data.email.split('@')[1]?.toLowerCase() || '';
    const schoolIdFromDomain = emailDomain.split('.')[0];
    const schoolIdToUse = detectedSchoolId || schoolIdFromDomain || campusId;

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          schoolId: schoolIdToUse,
        }),
        signal: abortController.signal,
      });

      const result = await res.json();

      if (!res.ok) {
        // Handle SCHOOL_NOT_ACTIVE - show waitlist UI
        if (result.code === 'SCHOOL_NOT_ACTIVE' || result.error === 'SCHOOL_NOT_ACTIVE') {
          setWaitlistSchool({
            id: result.schoolId,
            name: result.schoolName,
          });
          setDetectedSchoolId(result.schoolId);
          setGateStep('waitlist');
          return;
        }

        throw new Error(result.message || result.error || 'Failed to send code');
      }

      // Store detected schoolId
      if (result.schoolId) {
        setDetectedSchoolId(result.schoolId);
      }

      // Store code expiry time for countdown
      if (result.data?.expiresAt) {
        setCodeExpiresAt(new Date(result.data.expiresAt));
      } else if (result.expiresAt) {
        setCodeExpiresAt(new Date(result.expiresAt));
      }

      setGateStep('code');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      }
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const verifyCode = async () => {
    const codeString = data.code.join('');
    if (codeString.length !== 6) {
      setError('Enter the 6-digit code');
      analytics.trackValidationError('welcome', 'code', 'incomplete_code');
      return;
    }

    // Cancel any previous request
    cancelRequest();

    const abortController = new AbortController();
    requestAbort.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          code: codeString,
          schoolId: campusId,
        }),
        signal: abortController.signal,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || 'Invalid code');
      }

      // Move to naming phase (the wedge moment)
      setPhase('naming');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      }
      const errorMsg = err instanceof Error ? err.message : 'Invalid code';
      setError(errorMsg);
      analytics.trackValidationError('welcome', 'code', errorMsg);
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const resendCode = async () => {
    await sendCode();
  };

  // Naming phase: Submit first/last name
  const submitNaming = () => {
    if (!data.firstName.trim() || !data.lastName.trim()) {
      setError('Enter your name');
      return;
    }

    // Only block while checking - don't block on unavailable
    // API auto-generates variants if the preferred handle is taken
    if (handlePreview.isChecking) {
      setError('Checking handle availability...');
      return;
    }

    setError(null);
    setPhase('field');
    setFieldStep('year');
  };

  // Field phase: Submit year (required), advance to major
  const submitYear = () => {
    if (data.graduationYear === null) {
      setError('Select your graduation year');
      return;
    }

    setError(null);
    setFieldStep('major');
  };

  // Field phase: Submit field (major optional), advance to crossing
  const submitField = () => {
    // Year is required, major is optional
    if (data.graduationYear === null) {
      setError('Select your graduation year');
      return;
    }

    setError(null);
    setPhase('crossing');
  };

  // Legacy alias: submitClaim advances to crossing (used by legacy ClaimScreen)
  const submitClaim = () => {
    if (!data.firstName.trim() || !data.lastName.trim()) {
      setError('Enter your name');
      return;
    }
    setError(null);
    setPhase('crossing');
  };

  const selectSuggestedHandle = (handle: string) => {
    setData((d) => ({ ...d, handleOverride: handle }));
    setSuggestedHandles([]);
    setError(null);
  };

  const clearSuggestedHandles = () => {
    setSuggestedHandles([]);
    setError(null);
  };

  const completeEntry = async () => {
    if (data.interests.length < 2) {
      setError('Pick at least 2 interests');
      return;
    }

    // Cancel any previous request
    cancelRequest();

    const abortController = new AbortController();
    requestAbort.current = abortController;

    setIsLoading(true);
    setError(null);
    setSuggestedHandles([]);

    try {
      // Refresh token before final submission to prevent expiry
      // (user may have spent >15 min on naming/field/crossing phases)
      try {
        await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      } catch {
        // Refresh failed — continue anyway, the main call will handle auth errors
      }

      const res = await fetch('/api/auth/complete-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'student',
          major: data.major || null,
          graduationYear: data.graduationYear || null,
          interests: data.interests,
          // Use override handle if user selected a suggestion
          ...(data.handleOverride && { handle: data.handleOverride }),
        }),
        signal: abortController.signal,
      });

      const result = await res.json();

      if (!res.ok) {
        // Handle collision - show suggested handles
        if (result.code === 'HANDLE_COLLISION' && result.suggestedHandles) {
          setSuggestedHandles(result.suggestedHandles);
          setError('That handle was just taken. Pick one of these:');
          return;
        }
        throw new Error(result.error || 'Failed to complete entry');
      }

      // Clear persisted entry state on success
      try { sessionStorage.removeItem(ENTRY_STATE_KEY); } catch {}

      // Track completion
      analytics.trackStepCompleted('handle');
      analytics.trackOnboardingCompleted(0, ['welcome', 'name', 'academics', 'handle']);

      // Use the server-provided redirect (first auto-joined space or /home)
      const redirect = (result.redirect as string) || '/home';
      onComplete(redirect);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      }
      setError(err instanceof Error ? err.message : 'Failed to complete entry');
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const goBack = () => {
    // Cancel any in-flight request when navigating back
    cancelRequest();

    if (phase === 'crossing') {
      // Back to field (major step)
      setPhase('field');
      setFieldStep('major');
    } else if (phase === 'field') {
      if (fieldStep === 'major') {
        // Back to year step
        setFieldStep('year');
      } else {
        // Back to naming
        setPhase('naming');
      }
    } else if (phase === 'naming') {
      // Back to gate (email step)
      setPhase('gate');
      setGateStep('email');
      setCodeExpiresAt(null);
    } else if (phase === 'gate') {
      if (gateStep === 'code') {
        setGateStep('email');
        setCodeExpiresAt(null);
      } else if (gateStep === 'waitlist') {
        setGateStep('email');
        setWaitlistSchool(null);
        setWaitlistSuccess(false);
      }
    }
    setError(null);
  };

  // Join waitlist for school not yet on HIVE
  const joinWaitlist = async () => {
    if (!waitlistSchool) return;

    // Cancel any previous request
    cancelRequest();

    const abortController = new AbortController();
    requestAbort.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/waitlist/school-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          schoolName: waitlistSchool.name,
          schoolId: waitlistSchool.id,
        }),
        signal: abortController.signal,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to join waitlist');
      }

      setWaitlistSuccess(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to join waitlist');
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  return {
    phase,
    gateStep,
    fieldStep,
    data,
    isLoading,
    error,
    handlePreview,
    suggestedHandles,
    waitlistSchool,
    waitlistSuccess,

    // Code expiry
    codeExpiresAt,

    // Gate actions
    setEmail,
    sendCode,
    setCode,
    verifyCode,
    resendCode,
    joinWaitlist,
    setWaitlistSuccess,

    // Naming actions
    setFirstName,
    setLastName,
    submitNaming,
    checkHandleAvailability,

    // Field actions
    setGraduationYear,
    setMajor,
    submitYear,
    submitField,

    // Crossing actions
    toggleInterest,
    completeEntry,
    selectSuggestedHandle,
    clearSuggestedHandles,

    // Navigation
    goBack,
    cancelRequest,

    // Legacy aliases
    submitClaim,
  };
}
