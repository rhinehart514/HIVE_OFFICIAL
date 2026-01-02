// Onboarding Types

/**
 * Streamlined 3-step onboarding flow (Phase 6 - 300s → 120s):
 * 1. userType (The Fork) - Choose leader vs explorer (~20s)
 * 2. quickProfile - Name + handle combined with auto-suggestions (~25s)
 * 3. interestsCloud - Tap interests → auto-join recommended spaces (~35s)
 * → Land directly in space (~20s)
 *
 * Legacy steps kept for backwards compatibility with saved drafts
 */
export type OnboardingStep =
  | "userType"         // Step 1: The Fork
  | "quickProfile"     // Step 2: Name + handle (combined, Phase 6)
  | "interestsCloud"   // Step 3: Interests → auto-join spaces
  // Legacy steps (for draft migration to new flow)
  | "name"             // → quickProfile
  | "handleSelection"  // → quickProfile
  | "spaces"           // → auto-join in interestsCloud
  | "completion"       // → redirect to space
  | "profile"
  | "interests"
  | "identity"
  | "leader"
  | "alumniWaitlist"
  | "facultyProfile";

export type UserType = "student" | "alumni" | "faculty" | null;

export type HandleStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export type LivingSituation = "on-campus" | "off-campus" | "commuter" | "not-sure" | null;

export interface OnboardingData {
  userType: UserType;
  handle: string;
  name: string;
  major: string;
  graduationYear: number | null;
  livingSituation: LivingSituation; // Optional residential status
  interests: string[]; // Max 10 items, each max 50 chars
  profilePhoto: string | null;
  isLeader: boolean;
  courseCode: string;
  alumniEmail: string;
  termsAccepted: boolean;
  // Space selected during onboarding
  claimedSpaceId?: string;
  claimedSpaceName?: string;
  // Spaces to join (for explorers)
  initialSpaceIds?: string[];
  initialSpaceNames?: string[]; // Names for display on completion
  // Spaces user wants to lead (builder requests)
  builderRequestSpaces?: string[];
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

/**
 * Step config for streamlined 3-step flow
 * Note: Titles/subtitles not shown in new design (big headlines in components instead)
 */
export const STEP_CONFIG: Record<OnboardingStep, { title: string; subtitle: string }> = {
  // Active steps (Phase 6 streamlined flow)
  userType: {
    title: "What brings you here?",
    subtitle: "",
  },
  quickProfile: {
    title: "What should we call you?",
    subtitle: "Your name and handle are how others will find you",
  },
  interestsCloud: {
    title: "What are you into?",
    subtitle: "Tap as many as you want — we'll find your spaces",
  },
  // Legacy - kept for draft migration
  name: {
    title: "What should we call you?",
    subtitle: "",
  },
  handleSelection: {
    title: "Pick your @",
    subtitle: "This is how people will find you",
  },
  spaces: {
    title: "Find your spaces",
    subtitle: "",
  },
  completion: {
    title: "",
    subtitle: "",
  },
  profile: {
    title: "Tell us about yourself",
    subtitle: "",
  },
  interests: {
    title: "What are you into?",
    subtitle: "",
  },
  identity: {
    title: "Choose your handle",
    subtitle: "",
  },
  leader: {
    title: "One more thing",
    subtitle: "",
  },
  alumniWaitlist: {
    title: "Alumni access",
    subtitle: "Coming soon to HIVE",
  },
  facultyProfile: {
    title: "Faculty profile",
    subtitle: "",
  },
};
