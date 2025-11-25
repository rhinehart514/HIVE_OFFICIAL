"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HANDLE_REGEX } from "../shared/constants";
import type {
  OnboardingStep,
  UserType,
  HandleStatus,
  OnboardingData,
} from "../shared/types";

// Debounce utility
function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
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

  // Handle checking state
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);

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

  const handleLeaderChoice = async (isLeader: boolean) => {
    updateData({ isLeader });
    if (isLeader) {
      setStep("spaces");
    } else {
      router.push("/feed");
    }
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Split name into first/last
      const nameParts = data.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

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
          userType: "student",
          consentGiven: true,
          ...(data.profilePhoto && { avatarUrl: data.profilePhoto }),
        }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.error) {
        throw new Error(responseData.error || "Failed to save profile");
      }

      // Move to leader question
      setStep("leader");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    step,
    data,
    error,
    isSubmitting,
    handleStatus,
    handleSuggestions,

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
  };
}
