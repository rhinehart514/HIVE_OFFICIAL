"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { HANDLE_REGEX } from "../shared/constants";
import type {
  OnboardingStep,
  UserType,
  HandleStatus,
  OnboardingData,
} from "../shared/types";

// Debounce utility
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

// Draft persistence constants
const ONBOARDING_DRAFT_KEY = 'hive_onboarding_draft';
const DRAFT_VERSION = 1;
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface OnboardingDraft {
  version: number;
  data: Partial<OnboardingData>;
  step: OnboardingStep;
  savedAt: number;
  userId?: string;
}

// Retry utility with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  options = { maxRetries: 3, baseDelay: 1000 }
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors (4xx)
      if (
        error instanceof Response ||
        (error as { status?: number }).status
      ) {
        const status = (error as { status?: number }).status || 0;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      // Exponential backoff
      if (attempt < options.maxRetries - 1) {
        const delay = options.baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

const INITIAL_DATA: OnboardingData = {
  userType: null,
  handle: "",
  name: "",
  major: "",
  graduationYear: null,
  interests: [],
  profilePhoto: null,
  isLeader: false,
  courseCode: "",
  alumniEmail: "",
  termsAccepted: false,
};

export function useOnboarding() {
  const router = useRouter();

  // Core state
  const [step, setStep] = useState<OnboardingStep>("userType");
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [savedDraftTime, setSavedDraftTime] = useState<number | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Handle checking state
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);
  const lastSubmitOptions = useRef<{ isLeaderOverride?: boolean; redirectTo?: string } | null>(null);

  // Network status
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Track if initial draft restore has happened
  const hasAttemptedRestore = useRef(false);

  // Network status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Restore draft on mount
  useEffect(() => {
    if (hasAttemptedRestore.current) return;
    hasAttemptedRestore.current = true;

    try {
      const savedDraft = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!savedDraft) return;

      const draft: OnboardingDraft = JSON.parse(savedDraft);

      // Validate draft version and age
      if (draft.version !== DRAFT_VERSION) {
        localStorage.removeItem(ONBOARDING_DRAFT_KEY);
        return;
      }

      if (Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) {
        localStorage.removeItem(ONBOARDING_DRAFT_KEY);
        return;
      }

      // Restore draft data
      if (draft.data) {
        setData(prev => ({ ...prev, ...draft.data }));
      }
      if (draft.step) {
        setStep(draft.step);
      }
      setSavedDraftTime(draft.savedAt);
      setHasRestoredDraft(true);
    } catch (e) {
      console.warn('Failed to restore onboarding draft:', e);
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    }
  }, []);

  // Auto-save draft on data/step changes
  useEffect(() => {
    // Don't save if we haven't started yet
    if (step === 'userType' && !data.userType) return;

    try {
      const draft: OnboardingDraft = {
        version: DRAFT_VERSION,
        data,
        step,
        savedAt: Date.now(),
      };
      localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save onboarding draft:', e);
    }
  }, [data, step]);

  // Clear draft on successful completion
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    } catch {
      // Ignore errors
    }
  }, []);

  // Discard draft and start fresh
  const discardDraft = useCallback(() => {
    clearDraft();
    setData(INITIAL_DATA);
    setStep("userType");
    setHasRestoredDraft(false);
    setSavedDraftTime(null);
  }, [clearDraft]);

  // Error modal handlers
  const dismissErrorModal = useCallback(() => {
    setShowErrorModal(false);
  }, []);

  const saveLocallyAndContinue = useCallback(() => {
    // Draft is already auto-saved, just close modal and let user know
    setShowErrorModal(false);
    setError(null);
  }, []);

  // Update data helper
  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Check handle availability

  const checkHandle = useCallback(
    debounce(async (value: string) => {
      if (!value) {
        setHandleStatus("idle");
        return;
      }

      if (!HANDLE_REGEX.test(value)) {
        setHandleStatus("invalid");
        return;
      }

      setHandleStatus("checking");

      try {
        const response = await fetch(
          `/api/auth/check-handle?handle=${encodeURIComponent(value)}`
        );
        const responseData = await response.json();

        if (responseData.available) {
          setHandleStatus("available");
          setHandleSuggestions([]);
        } else {
          setHandleStatus("taken");
          setHandleSuggestions([
            `${value}_ub`,
            `${value}${Math.floor(Math.random() * 100)}`,
            `${value.charAt(0)}_${value.slice(1)}`,
          ].slice(0, 3));
        }
      } catch {
        setHandleStatus("idle");
      }
    }, 300),
    []
  );

  // Watch handle changes
  useEffect(() => {
    checkHandle(data.handle);
  }, [data.handle, checkHandle]);

  // Step calculations
  const getStepNumber = (): number => {
    if (data.userType === "student") {
      const studentSteps: OnboardingStep[] = [
        "userType",
        "identity",
        "profile",
        "interests",
        "leader",
        "spaces",
      ];
      return studentSteps.indexOf(step) + 1;
    } else if (data.userType === "faculty") {
      const facultySteps: OnboardingStep[] = [
        "userType",
        "facultyProfile",
        "spaces",
      ];
      return facultySteps.indexOf(step) + 1;
    }
    return 1;
  };

  const getTotalSteps = (): number => {
    if (data.userType === "student") return data.isLeader ? 6 : 5;
    if (data.userType === "faculty") return 3;
    return 1;
  };

  // Navigation handlers
  const handleUserTypeSelect = (type: UserType) => {
    updateData({ userType: type });
    setError(null);
    if (type === "student") {
      setStep("identity");
    } else if (type === "alumni") {
      setStep("alumniWaitlist");
    } else if (type === "faculty") {
      setStep("facultyProfile");
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === "identity") setStep("userType");
    else if (step === "profile") setStep("identity");
    else if (step === "interests") setStep("profile");
    else if (step === "leader") setStep("interests");
    else if (step === "spaces")
      setStep(data.userType === "faculty" ? "facultyProfile" : "leader");
    else if (step === "facultyProfile") setStep("userType");
    else if (step === "alumniWaitlist") setStep("userType");
  };

  const handleNext = (nextStep: OnboardingStep) => {
    setError(null);
    setStep(nextStep);
  };

  const submitOnboarding = useCallback(async (options?: {
    isLeaderOverride?: boolean;
    redirectTo?: string;
    selectedSpaceIds?: string[];
  }) => {
    lastSubmitOptions.current = options || null;

    // Avoid duplicate submissions; still allow redirect if already completed
    if (hasSubmitted) {
      if (options?.redirectTo) {
        router.push(options.redirectTo);
      }
      return true;
    }

    if (!isOnline) {
      setError("You're offline. Please check your connection and try again.");
      return false;
    }

    const resolvedUserType = data.userType || "student";
    const resolvedIsLeader = options?.isLeaderOverride ?? data.isLeader;

    // Basic validation before hitting the API
    if (!data.handle.trim() || !data.name.trim() || !data.major.trim() || !data.graduationYear) {
      setError("Please complete all required fields.");
      return false;
    }

    if (handleStatus === "taken" || handleStatus === "invalid") {
      setError("Please choose a valid, available handle before continuing.");
      return false;
    }

    if (resolvedUserType === "student" && !data.termsAccepted) {
      setError("Please accept the terms to continue.");
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const nameParts = data.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await withRetry(async () => {
        const response = await fetch("/api/auth/complete-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: data.handle,
            firstName,
            lastName,
            fullName: data.name.trim(),
            major: data.major,
            graduationYear: data.graduationYear,
            interests: data.interests,
            userType: resolvedUserType,
            consentGiven: true,
            isLeader: resolvedIsLeader,
            // Include spaces to join during onboarding
            // Prefer options.selectedSpaceIds (passed directly) over data (may not have updated yet)
            ...(((resolvedIsLeader ? null : options?.selectedSpaceIds) || data.initialSpaceIds)?.length && {
              initialSpaceIds: (resolvedIsLeader ? null : options?.selectedSpaceIds) || data.initialSpaceIds
            }),
            // Include builder request spaces if leader
            ...((resolvedIsLeader && (options?.selectedSpaceIds?.length || (Array.isArray(data.builderRequestSpaces) && data.builderRequestSpaces.length))) && {
              builderRequestSpaces: options?.selectedSpaceIds || data.builderRequestSpaces
            }),
            ...(data.profilePhoto && { avatarUrl: data.profilePhoto }),
          }),
        });

        const responseData = await response.json();

        if (!response.ok || responseData.error) {
          const errorMessage = responseData.error || "Failed to save profile";
          const err = new Error(errorMessage) as Error & { status?: number };
          err.status = response.status;
          throw err;
        }

        return responseData;
      });

      setHasSubmitted(true);

      try {
        const existingSession = window.localStorage.getItem('hive_session');
        if (existingSession) {
          const sessionData = JSON.parse(existingSession);
          sessionData.onboardingCompleted = true;
          window.localStorage.setItem('hive_session', JSON.stringify(sessionData));
        }
      } catch {
        console.warn('Failed to update session storage after onboarding');
      }

      clearDraft();

      if (options?.redirectTo) {
        router.push(options.redirectTo);
      }

      return true;
    } catch (err) {
      const status = (err as { status?: number }).status;
      const errorMessage = err instanceof Error ? err.message : "Unable to save profile";

      // Surface handle conflicts clearly
      if (status === 409) {
        setHandleStatus("taken");
        setError("That handle is already taken. Please choose another.");
        setShowErrorModal(true);
        return false;
      }

      setError(errorMessage);
      setShowErrorModal(true);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [clearDraft, data, hasSubmitted, isOnline, router]);

  const handleLeaderChoice = async (isLeader: boolean) => {
    updateData({ isLeader });

    if (isLeader) {
      setStep("spaces");
      return;
    }

    await submitOnboarding({ isLeaderOverride: false, redirectTo: "/feed" });
  };

  // Retry submission (called from error modal)
  const retrySubmission = useCallback(async () => {
    setIsRetrying(true);
    setShowErrorModal(false);
    await submitOnboarding(lastSubmitOptions.current || undefined);
    setIsRetrying(false);
  }, [submitOnboarding]);

  return {
    // State
    step,
    data,
    error,
    isSubmitting,
    handleStatus,
    handleSuggestions,
    isOnline,
    hasRestoredDraft,
    savedDraftTime,

    // Error modal state
    showErrorModal,
    isRetrying,

    // Setters
    setError,
    setIsSubmitting,
    updateData,

    // Computed
    stepNumber: getStepNumber(),
    totalSteps: getTotalSteps(),

    // Actions
    handleUserTypeSelect,
    handleBack,
    handleNext,
    handleLeaderChoice,
    submitOnboarding,
    discardDraft,
    clearDraft,

    // Error modal actions
    retrySubmission,
    dismissErrorModal,
    saveLocallyAndContinue,
  };
}
