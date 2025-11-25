// Onboarding Types

export type OnboardingStep =
  | "userType"
  | "identity"
  | "profile"
  | "interests"
  | "leader"
  | "spaces"
  | "alumniWaitlist"
  | "facultyProfile";

export type UserType = "student" | "alumni" | "faculty" | null;

export type HandleStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export interface OnboardingData {
  userType: UserType;
  handle: string;
  name: string;
  major: string;
  graduationYear: number | null;
  interests: string[];
  profilePhoto: string | null;
  isLeader: boolean;
  courseCode: string;
  alumniEmail: string;
  termsAccepted: boolean;
}

export interface StepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export const STEP_CONFIG: Record<OnboardingStep, { title: string; subtitle: string }> = {
  userType: {
    title: "Welcome to HIVE",
    subtitle: "How will you be using the platform?",
  },
  identity: {
    title: "Choose your handle",
    subtitle: "This is how others will find you",
  },
  profile: {
    title: "Your details",
    subtitle: "Help us personalize your experience",
  },
  interests: {
    title: "Your interests",
    subtitle: "We'll curate content based on these",
  },
  leader: {
    title: "One more thing",
    subtitle: "Do you lead a club or organization?",
  },
  spaces: {
    title: "Claim your space",
    subtitle: "Set up your club or organization on HIVE",
  },
  alumniWaitlist: {
    title: "Alumni access",
    subtitle: "Coming soon to HIVE",
  },
  facultyProfile: {
    title: "Faculty profile",
    subtitle: "Set up your organization",
  },
};
