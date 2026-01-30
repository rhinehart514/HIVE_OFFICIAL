import * as React from 'react';

/**
 * Entry Flow State Machine
 *
 * 4-phase flow: Gate → Naming → Field → Crossing
 *
 * Gate: Email verification (email → code → waitlist)
 * Naming: THE WEDGE - Real identity claim (first/last name)
 * Field: Year (required) + Major (optional)
 * Crossing: Interests selection (2-5 required)
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
}

export interface EntryState {
  phase: EntryPhase;
  gateStep: GateStep;
  fieldStep: FieldStep;
  data: EntryData;
  isLoading: boolean;
  error: string | null;

  // Waitlist
  waitlistSchool: WaitlistSchoolInfo | null;
  waitlistSuccess: boolean;
}

export interface UseEntryOptions {
  onComplete: () => void;
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

  // Waitlist actions
  joinWaitlist: () => Promise<void>;

  // Naming actions
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  submitNaming: () => void;

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
};

export function useEntry(options: UseEntryOptions): UseEntryReturn {
  const { onComplete, campusId = 'ub-buffalo', schoolId: initialSchoolId } = options;

  const [phase, setPhase] = React.useState<EntryPhase>('gate');
  const [gateStep, setGateStep] = React.useState<GateStep>('email');
  const [fieldStep, setFieldStep] = React.useState<FieldStep>('year');
  const [data, setData] = React.useState<EntryData>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // School ID detection (from URL params or email domain)
  const [detectedSchoolId, setDetectedSchoolId] = React.useState<string | null>(initialSchoolId || null);

  // Waitlist state
  const [waitlistSchool, setWaitlistSchool] = React.useState<WaitlistSchoolInfo | null>(null);
  const [waitlistSuccess, setWaitlistSuccess] = React.useState(false);

  // Main request abort controller (for canceling in-flight API calls)
  const requestAbort = React.useRef<AbortController | null>(null);

  // Cancel any in-flight request
  const cancelRequest = React.useCallback(() => {
    if (requestAbort.current) {
      requestAbort.current.abort();
      requestAbort.current = null;
      setIsLoading(false);
    }
  }, []);

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
      return;
    }

    if (!data.email.includes('@') || !data.email.includes('.')) {
      setError('Enter a valid email address');
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
      setError(err instanceof Error ? err.message : 'Invalid code');
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

    try {
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
        }),
        signal: abortController.signal,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to complete entry');
      }

      onComplete();
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
    } else if (phase === 'gate') {
      if (gateStep === 'code') {
        setGateStep('email');
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
    waitlistSchool,
    waitlistSuccess,

    // Gate actions
    setEmail,
    sendCode,
    setCode,
    verifyCode,
    resendCode,
    joinWaitlist,

    // Naming actions
    setFirstName,
    setLastName,
    submitNaming,

    // Field actions
    setGraduationYear,
    setMajor,
    submitYear,
    submitField,

    // Crossing actions
    toggleInterest,
    completeEntry,

    // Navigation
    goBack,
    cancelRequest,

    // Legacy aliases
    submitClaim,
  };
}
