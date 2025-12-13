// Onboarding Types

/**
 * 4-step onboarding flow:
 * 1. userType (The Fork) - Choose leader vs explorer
 * 2. profile (Combined) - Name, handle, major, year, residential (optional)
 * 3. interests - Pick interests from curated list + custom tags (optional, 0-10)
 * 4. spaces (Claim) - Find and claim a space
 * + completion (Celebration) - Success screen
 *
 * Legacy steps kept for backwards compatibility with saved drafts
 */
export type OnboardingStep =
  | "userType"    // Step 1: The Fork
  | "profile"     // Step 2: Combined profile
  | "interests"   // Step 3: Pick interests (new)
  | "spaces"      // Step 4: Claim space
  | "completion"  // Celebration screen
  // Legacy steps (for draft migration)
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
 * Step config for 4-step flow
 * Note: Titles/subtitles not shown in new design (big headlines in components instead)
 */
export const STEP_CONFIG: Record<OnboardingStep, { title: string; subtitle: string }> = {
  userType: {
    title: "What brings you to HIVE?",
    subtitle: "",
  },
  profile: {
    title: "Tell us about yourself",
    subtitle: "",
  },
  interests: {
    title: "What are you into?",
    subtitle: "Pick interests to personalize your experience",
  },
  spaces: {
    title: "Find your club",
    subtitle: "",
  },
  completion: {
    title: "",
    subtitle: "",
  },
  // Legacy - kept for migration
  identity: {
    title: "Choose your handle",
    subtitle: "This is how others will find you",
  },
  leader: {
    title: "One more thing",
    subtitle: "Do you lead a club or organization?",
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
