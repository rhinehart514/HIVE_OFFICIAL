/**
 * Profile Completion Configuration
 * Single source of truth for what constitutes "complete"
 *
 * Entry gate = can access app
 * Profile complete = recommended fields filled
 */

export interface UserData {
  // Entry fields
  firstName?: string | null;
  lastName?: string | null;
  handle?: string | null;
  role?: string | null;
  userType?: string | null;
  // Profile fields
  email?: string | null;
  campusId?: string | null;
  schoolId?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  bio?: string | null;
  avatarUrl?: string | null;
  profileImageUrl?: string | null;
  pronouns?: string | null;
  housing?: string | null;
  residenceType?: string | null;
  statusMessage?: string | null;
  interests?: string[] | null;
  // Flags
  entryCompletedAt?: string | null;
  onboardingCompleted?: boolean | null;
  onboardingComplete?: boolean | null;
  isOnboarded?: boolean | null;
}

/**
 * Completion requirements configuration
 *
 * entry: Gate to access the app (required for minimal functionality)
 * profile: Full profile for optimal experience
 */
export const COMPLETION_REQUIREMENTS = {
  /**
   * Entry gate - can access app after completing these
   * firstName, lastName, handle, role + 2 interests
   */
  entry: {
    required: ['firstName', 'lastName', 'handle', 'role'] as const,
    minimums: { interests: 2 },
  },
  /**
   * Full profile completion
   * Includes entry fields + email + campusId
   * Recommended fields improve profile quality
   */
  profile: {
    required: ['firstName', 'lastName', 'handle', 'email', 'campusId'] as const,
    recommended: ['major', 'graduationYear', 'bio', 'avatarUrl'] as const,
    optional: ['pronouns', 'housing', 'statusMessage'] as const,
    minimums: { interests: 2 },
  },
} as const;

/**
 * Check if user has completed entry requirements
 * Entry = can access the main app
 */
export function isEntryComplete(user: UserData): boolean {
  // Check required fields
  for (const field of COMPLETION_REQUIREMENTS.entry.required) {
    const value = getFieldValue(user, field);
    if (!hasValue(value)) {
      return false;
    }
  }

  // Check minimums
  const interests = user.interests || [];
  if (interests.length < COMPLETION_REQUIREMENTS.entry.minimums.interests) {
    return false;
  }

  return true;
}

/**
 * Check if user profile is fully complete
 * Profile complete = all required + minimums
 */
export function isProfileComplete(user: UserData): boolean {
  // Check required fields
  for (const field of COMPLETION_REQUIREMENTS.profile.required) {
    const value = getFieldValue(user, field);
    if (!hasValue(value)) {
      return false;
    }
  }

  // Check minimums
  const interests = user.interests || [];
  if (interests.length < COMPLETION_REQUIREMENTS.profile.minimums.interests) {
    return false;
  }

  return true;
}

/**
 * Calculate profile completion percentage
 * Weights: required (60%), recommended (30%), interests (10%)
 */
export function getCompletionPercentage(user: UserData): number {
  const { profile } = COMPLETION_REQUIREMENTS;
  let score = 0;
  let maxScore = 0;

  // Required fields (60% weight)
  const requiredWeight = 60;
  const requiredPerField = requiredWeight / profile.required.length;
  maxScore += requiredWeight;

  for (const field of profile.required) {
    const value = getFieldValue(user, field);
    if (hasValue(value)) {
      score += requiredPerField;
    }
  }

  // Recommended fields (30% weight)
  const recommendedWeight = 30;
  const recommendedPerField = recommendedWeight / profile.recommended.length;
  maxScore += recommendedWeight;

  for (const field of profile.recommended) {
    const value = getFieldValue(user, field);
    if (hasValue(value)) {
      score += recommendedPerField;
    }
  }

  // Interests (10% weight)
  const interestsWeight = 10;
  maxScore += interestsWeight;
  const interests = user.interests || [];
  const interestRatio = Math.min(interests.length / profile.minimums.interests, 1);
  score += interestsWeight * interestRatio;

  return Math.round((score / maxScore) * 100);
}

/**
 * Get missing fields for profile completion
 * Returns separate arrays for required vs recommended
 */
export function getMissingFields(user: UserData): {
  required: string[];
  recommended: string[];
} {
  const { profile } = COMPLETION_REQUIREMENTS;
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  // Check required fields
  for (const field of profile.required) {
    const value = getFieldValue(user, field);
    if (!hasValue(value)) {
      missingRequired.push(field);
    }
  }

  // Check recommended fields
  for (const field of profile.recommended) {
    const value = getFieldValue(user, field);
    if (!hasValue(value)) {
      missingRecommended.push(field);
    }
  }

  // Check interests minimum
  const interests = user.interests || [];
  if (interests.length < profile.minimums.interests) {
    missingRequired.push('interests');
  }

  return { required: missingRequired, recommended: missingRecommended };
}

/**
 * Generate next steps for completing profile
 */
export function getNextSteps(user: UserData): string[] {
  const { required, recommended } = getMissingFields(user);
  const steps: string[] = [];

  const fieldLabels: Record<string, string> = {
    firstName: 'Add your first name',
    lastName: 'Add your last name',
    handle: 'Choose a unique handle',
    email: 'Verify your email address',
    campusId: 'Confirm your school',
    major: 'Select your major',
    graduationYear: 'Add your graduation year',
    bio: 'Write a brief bio about yourself',
    avatarUrl: 'Upload a profile photo',
    pronouns: 'Add your pronouns',
    housing: 'Add your housing information',
    statusMessage: 'Set a status message',
    interests: 'Add at least 2 interests',
  };

  // Required fields first
  for (const field of required) {
    if (fieldLabels[field]) {
      steps.push(fieldLabels[field]);
    }
  }

  // Then recommended
  for (const field of recommended) {
    if (fieldLabels[field]) {
      steps.push(fieldLabels[field]);
    }
  }

  if (steps.length === 0) {
    steps.push('Your profile is complete!');
  } else if (required.length === 0) {
    steps.unshift('Complete your profile by adding:');
  }

  return steps;
}

// Helper: Get field value with alias support
function getFieldValue(user: UserData, field: string): unknown {
  switch (field) {
    case 'role':
      return user.role || user.userType;
    case 'campusId':
      return user.campusId || user.schoolId;
    case 'avatarUrl':
      return user.avatarUrl || user.profileImageUrl;
    case 'housing':
      return user.housing || user.residenceType;
    default:
      return user[field as keyof UserData];
  }
}

// Helper: Check if value is present and non-empty
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}
