"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { HANDLE_REGEX } from "../shared/constants";
import { logger } from "@/lib/logger";
import { useOnboardingAnalytics } from "@hive/hooks";
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

// Migrate legacy steps to new 4-step flow
function migrateLegacyStep(step: OnboardingStep): OnboardingStep {
  switch (step) {
    case 'userType':
      return 'userType';
    case 'identity':
    case 'profile':
      return 'profile'; // Both merge into profile
    case 'interests':
      return 'interests'; // Interests is now its own step
    case 'leader':
    case 'spaces':
      return 'spaces'; // Leader merged into spaces
    case 'completion':
      return 'completion';
    case 'alumniWaitlist':
    case 'facultyProfile':
      return 'profile'; // Legacy paths → profile
    default:
      return 'userType';
  }
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
  livingSituation: null,
  interests: [],
  profilePhoto: null,
  isLeader: false,
  courseCode: "",
  alumniEmail: "",
  termsAccepted: false,
};

// Map OnboardingStep to analytics step names
function mapStepToAnalyticsName(step: OnboardingStep): 'welcome' | 'name' | 'academics' | 'handle' | 'photo' | 'builder' | 'legal' {
  switch (step) {
    case 'userType': return 'welcome';
    case 'profile': return 'handle'; // Profile step is primarily about handle
    case 'spaces': return 'builder';
    case 'completion': return 'legal';
    default: return 'welcome';
  }
}

export function useOnboarding() {
  const router = useRouter();
  const analytics = useOnboardingAnalytics();
  const hasTrackedStart = useRef(false);
  const previousStep = useRef<OnboardingStep | null>(null);

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

  // Track onboarding started on mount
  useEffect(() => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      analytics.trackOnboardingStarted();
      analytics.trackStepStarted(mapStepToAnalyticsName('userType'));
    }
  }, [analytics]);

  // Track step changes
  useEffect(() => {
    if (previousStep.current !== null && previousStep.current !== step) {
      // Track completion of previous step
      analytics.trackStepCompleted(mapStepToAnalyticsName(previousStep.current));
      // Track start of new step
      analytics.trackStepStarted(mapStepToAnalyticsName(step));
    }
    previousStep.current = step;
  }, [step, analytics]);

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
        // Migrate legacy steps to new flow
        const migratedStep = migrateLegacyStep(draft.step);
        setStep(migratedStep);
      }
      setSavedDraftTime(draft.savedAt);
      setHasRestoredDraft(true);
    } catch (e) {
      logger.warn('Failed to restore onboarding draft', { component: 'useOnboarding' });
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
      logger.warn('Failed to save onboarding draft', { component: 'useOnboarding' });
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

  // Step calculations - new 4-step flow
  const getStepNumber = (): number => {
    // New flow: userType → profile → interests → spaces → completion
    const steps: OnboardingStep[] = ["userType", "profile", "interests", "spaces"];
    const index = steps.indexOf(step);
    // For completion or legacy steps, return 4
    return index === -1 ? 4 : index + 1;
  };

  const getTotalSteps = (): number => {
    // Always 4 steps in new flow
    return 4;
  };

  // Navigation handlers - new 4-step flow
  const handleUserTypeSelect = (type: UserType, isLeader: boolean) => {
    // isLeader is now explicit from the button clicked:
    // - "I run a club" passes true
    // - "Looking around" passes false
    updateData({ userType: type, isLeader });
    setError(null);
    // All paths go to profile step
    setStep("profile");
  };

  const handleBack = () => {
    setError(null);
    // New 4-step navigation
    if (step === "profile") setStep("userType");
    else if (step === "interests") setStep("profile");
    else if (step === "spaces") setStep("interests");
    else if (step === "completion") setStep("spaces");
    // Legacy step migration - redirect to new flow
    else if (step === "identity") setStep("userType");
    else if (step === "leader") setStep("interests");
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
            livingSituation: data.livingSituation,
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

      // Track successful completion
      // Using valid OnboardingStepName values: welcome, name, academics, handle, photo, builder, legal
      analytics.trackOnboardingCompleted(
        Date.now(), // Duration calculated by analytics hook
        ['welcome', 'handle', 'builder', 'legal'] // Map to analytics step names
      );

      // Note: Server-side session cookie is updated by complete-onboarding API
      // No need to update localStorage - using secure httpOnly cookies

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
        // Track handle conflict error
        analytics.trackValidationError(mapStepToAnalyticsName(step), 'handle', 'handle_taken');
        return false;
      }

      // Track submission error
      analytics.trackValidationError(mapStepToAnalyticsName(step), 'submission', errorMessage);

      setError(errorMessage);
      setShowErrorModal(true);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [analytics, clearDraft, data, hasSubmitted, isOnline, router, step]);

  const handleLeaderChoice = async (isLeader: boolean) => {
    updateData({ isLeader });
    // Go directly to spaces step (leader step removed in new flow)
    setStep("spaces");
  };

  // Set leader status directly (for new flow)
  const setIsLeader = (isLeader: boolean) => {
    updateData({ isLeader });
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
    setStep,
    setIsLeader,

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
