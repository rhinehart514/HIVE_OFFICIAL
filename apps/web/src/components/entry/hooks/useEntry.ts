import * as React from 'react';

export type EntryScreen = 'prove' | 'claim' | 'enter';
export type ProveStep = 'email' | 'code' | 'waitlist';

export interface WaitlistSchoolInfo {
  id: string;
  name: string;
}

export interface EntryData {
  // Prove
  email: string;
  code: string[];

  // Claim
  firstName: string;
  lastName: string;
  handle: string;
  graduationYear: number | null;
  major: string;

  // Enter
  interests: string[];
}

export interface EntryState {
  screen: EntryScreen;
  proveStep: ProveStep;
  data: EntryData;
  isLoading: boolean;
  error: string | null;

  // Handle validation
  handleStatus: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  handleSuggestions: string[];

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
  // Prove actions
  setEmail: (email: string) => void;
  sendCode: () => Promise<void>;
  setCode: (code: string[]) => void;
  verifyCode: () => Promise<void>;
  resendCode: () => Promise<void>;

  // Waitlist actions
  joinWaitlist: () => Promise<void>;

  // Claim actions
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setHandle: (handle: string) => void;
  setGraduationYear: (year: number | null) => void;
  setMajor: (major: string) => void;
  submitClaim: () => void;

  // Enter actions
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
  handle: '',
  graduationYear: null,
  major: '',
  interests: [],
};

export function useEntry(options: UseEntryOptions): UseEntryReturn {
  const { onComplete, campusId = 'ub-buffalo', schoolId: initialSchoolId, domain: initialDomain } = options;

  const [screen, setScreen] = React.useState<EntryScreen>('prove');
  const [proveStep, setProveStep] = React.useState<ProveStep>('email');
  const [data, setData] = React.useState<EntryData>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // School ID detection (from URL params or email domain)
  const [detectedSchoolId, setDetectedSchoolId] = React.useState<string | null>(initialSchoolId || null);

  const [handleStatus, setHandleStatus] = React.useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [handleSuggestions, setHandleSuggestions] = React.useState<string[]>([]);

  // Waitlist state
  const [waitlistSchool, setWaitlistSchool] = React.useState<WaitlistSchoolInfo | null>(null);
  const [waitlistSuccess, setWaitlistSuccess] = React.useState(false);

  // Debounced handle check with abort controller for race condition prevention
  const handleCheckTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const handleCheckAbort = React.useRef<AbortController | null>(null);

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

  const setHandle = (handle: string) => {
    const normalized = handle.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setData((d) => ({ ...d, handle: normalized }));

    // Cancel pending requests and timeouts
    if (handleCheckTimeout.current) {
      clearTimeout(handleCheckTimeout.current);
    }
    if (handleCheckAbort.current) {
      handleCheckAbort.current.abort();
    }

    if (normalized.length < 3) {
      setHandleStatus('idle');
      return;
    }

    setHandleStatus('checking');
    handleCheckTimeout.current = setTimeout(async () => {
      // Create new abort controller for this request
      const abortController = new AbortController();
      handleCheckAbort.current = abortController;

      try {
        const res = await fetch(`/api/auth/check-handle?handle=${normalized}`, {
          signal: abortController.signal,
        });
        const result = await res.json();

        // Only update if this request wasn't aborted
        if (!abortController.signal.aborted) {
          if (result.status === 'available') {
            setHandleStatus('available');
            setHandleSuggestions([]);
          } else if (result.status === 'taken') {
            setHandleStatus('taken');
            setHandleSuggestions(result.suggestions || []);
          } else {
            setHandleStatus('invalid');
            setHandleSuggestions([]);
          }
        }
      } catch (err) {
        // Ignore abort errors, reset to idle for other errors
        if (err instanceof Error && err.name !== 'AbortError') {
          setHandleStatus('idle');
        }
      }
    }, 300);
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
          setProveStep('waitlist');
          return;
        }

        throw new Error(result.message || result.error || 'Failed to send code');
      }

      // Store detected schoolId
      if (result.schoolId) {
        setDetectedSchoolId(result.schoolId);
      }

      setProveStep('code');
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

      // Move to claim screen
      setScreen('claim');
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

  const submitClaim = () => {
    // Validate
    if (!data.firstName.trim() || !data.lastName.trim()) {
      setError('Enter your name');
      return;
    }

    setError(null);
    setScreen('enter');
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

    if (screen === 'enter') {
      setScreen('claim');
    } else if (screen === 'claim') {
      setScreen('prove');
      setProveStep('email');
    } else if (proveStep === 'code') {
      setProveStep('email');
    } else if (proveStep === 'waitlist') {
      setProveStep('email');
      setWaitlistSchool(null);
      setWaitlistSuccess(false);
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
    screen,
    proveStep,
    data,
    isLoading,
    error,
    handleStatus,
    handleSuggestions,
    waitlistSchool,
    waitlistSuccess,

    setEmail,
    sendCode,
    setCode,
    verifyCode,
    resendCode,
    joinWaitlist,

    setFirstName,
    setLastName,
    setHandle,
    setGraduationYear,
    setMajor,
    submitClaim,

    toggleInterest,
    completeEntry,

    goBack,
    cancelRequest,
  };
}
