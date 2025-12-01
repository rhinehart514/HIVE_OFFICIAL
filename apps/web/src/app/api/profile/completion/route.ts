import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/logger";
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { getServerProfileRepository } from '@hive/core/server';

interface ProfileCompletionCheck {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  completedFields: string[];
  requiredFields: string[];
  optionalFields: string[];
  nextSteps: string[];
}

// Required fields for basic profile completion
const REQUIRED_FIELDS = [
  'fullName',
  'handle',
  'email',
  'major',
  'schoolId',
  'consentGiven'
];

// Optional fields that improve profile completeness
const OPTIONAL_FIELDS = [
  'avatarUrl',
  'bio',
  'graduationYear',
  'isPublic',
  'builderOptIn',
  'housing',
  'pronouns',
  'statusMessage',
  'interests',
  'academicYear'
];

/**
 * Check profile completion status
 * GET /api/profile/completion
 *
 * Uses DDD EnhancedProfile.getCompletionPercentage() when available,
 * falls back to legacy field checking for additional detail.
 */
export const GET = withAuthAndErrors(async (
  request,
  _context,
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);

  // Try DDD repository first for accurate completion percentage
  const profileRepository = getServerProfileRepository();
  const profileResult = await profileRepository.findById(userId);

  if (profileResult.isSuccess) {
    const profile = profileResult.getValue();

    // Campus isolation check
    if (profile.campusId.id !== CURRENT_CAMPUS_ID) {
      return respond.error("User profile not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    // Use DDD aggregate method for completion percentage
    const dddCompletionPercentage = profile.getCompletionPercentage();
    const isProfileComplete = profile.isProfileComplete();

    // Build detailed completion info from domain model
    const completedFields: string[] = [];
    const missingFields: string[] = [];

    // Check required fields from domain model
    if (profile.firstName && profile.lastName) completedFields.push('fullName');
    else missingFields.push('fullName');

    if (profile.handle.value) completedFields.push('handle');
    else missingFields.push('handle');

    if (profile.email.value) completedFields.push('email');
    else missingFields.push('email');

    if (profile.major) completedFields.push('major');
    else missingFields.push('major');

    if (profile.campusId.id) completedFields.push('schoolId');
    else missingFields.push('schoolId');

    // Consent is implied by onboarded status
    if (profile.isOnboarded) completedFields.push('consentGiven');
    else missingFields.push('consentGiven');

    // Check optional fields
    if (profile.personalInfo.profilePhoto) completedFields.push('avatarUrl');
    if (profile.bio) completedFields.push('bio');
    if (profile.graduationYear) completedFields.push('graduationYear');
    if (profile.interests.length > 0) completedFields.push('interests');

    const completion: ProfileCompletionCheck = {
      isComplete: isProfileComplete,
      completionPercentage: dddCompletionPercentage,
      missingFields,
      completedFields,
      requiredFields: REQUIRED_FIELDS,
      optionalFields: OPTIONAL_FIELDS,
      nextSteps: generateNextSteps(missingFields, completedFields.filter(f => OPTIONAL_FIELDS.includes(f))),
    };

    logger.debug('Profile completion via DDD', {
      userId,
      percentage: dddCompletionPercentage,
      isComplete: isProfileComplete,
    });

    return respond.success({ completion });
  }

  // Fallback to legacy Firestore check if DDD fails
  logger.debug('Profile completion fallback to Firestore', { userId });

  const userDoc = await dbAdmin.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    return respond.error("User profile not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const userData = userDoc.data();
  if (userData?.campusId && userData.campusId !== CURRENT_CAMPUS_ID) {
    return respond.error("User profile not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  // Check completion status using legacy method
  const completion = checkProfileCompletion(userData, userData?.email || '');

  return respond.success({ completion });
});

/**
 * Helper function to check profile completion
 */
function checkProfileCompletion(userData: Record<string, unknown> | undefined, userEmail?: string): ProfileCompletionCheck {
  const completedFields: string[] = [];
  const missingFields: string[] = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    let value: unknown;

    // Special handling for email - can come from auth token
    if (field === 'email') {
      value = userData?.email || userEmail;
    } else {
      value = userData?.[field];
    }

    // Check if field has a meaningful value
    const isCompleted = checkFieldCompletion(field, value);

    if (isCompleted) {
      completedFields.push(field);
    } else {
      missingFields.push(field);
    }
  });

  // Check optional fields
  const completedOptionalFields: string[] = [];
  OPTIONAL_FIELDS.forEach(field => {
    const value = userData?.[field];
    const isCompleted = checkFieldCompletion(field, value);
    
    if (isCompleted) {
      completedFields.push(field);
      completedOptionalFields.push(field);
    }
  });

  // Calculate completion percentage
  const totalFields = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length;
  const completionPercentage = Math.round((completedFields.length / totalFields) * 100);
  
  // Profile is complete if all required fields are filled
  const isComplete = missingFields.length === 0;
  
  // Generate next steps
  const nextSteps = generateNextSteps(missingFields, completedOptionalFields);

  return {
    isComplete,
    completionPercentage,
    missingFields,
    completedFields,
    requiredFields: REQUIRED_FIELDS,
    optionalFields: OPTIONAL_FIELDS,
    nextSteps,
  };
}

/**
 * Check if a specific field is completed
 */
function checkFieldCompletion(field: string, value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  // String fields
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  // Boolean fields (considered complete if explicitly set)
  if (typeof value === 'boolean') {
    return true; // Both true and false are valid completion states
  }

  // Number fields
  if (typeof value === 'number') {
    return !isNaN(value) && value > 0;
  }

  // Array fields (like interests)
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  // Object fields (like ghostMode)
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0;
  }

  return false;
}

/**
 * Generate helpful next steps for profile completion
 */
function generateNextSteps(missingFields: string[], completedOptionalFields: string[]): string[] {
  const steps: string[] = [];
  
  if (missingFields.length === 0) {
    steps.push('Your profile is complete!');
    
    // Suggest additional improvements
    if (!completedOptionalFields.includes('avatarUrl')) {
      steps.push('Consider adding a profile photo to personalize your account');
    }
    if (!completedOptionalFields.includes('bio')) {
      steps.push('Add a bio to tell others about yourself');
    }
    if (!completedOptionalFields.includes('builderOptIn')) {
      steps.push('Consider joining the HIVE Builder Program');
    }
    
    return steps;
  }

  // Prioritize missing required fields
  const fieldLabels: Record<string, string> = {
    fullName: 'Add your full name',
    handle: 'Choose a unique handle',
    email: 'Verify your email address',
    major: 'Select your major',
    schoolId: 'Confirm your school',
    consentGiven: 'Accept the terms and privacy policy',
    avatarUrl: 'Upload a profile photo',
    bio: 'Write a brief bio about yourself',
    graduationYear: 'Add your graduation year',
    isPublic: 'Set your profile visibility',
    builderOptIn: 'Consider joining the Builder Program',
    housing: 'Add your housing information',
    pronouns: 'Add your pronouns',
    statusMessage: 'Set a status message',
    interests: 'Add your interests',
    academicYear: 'Select your academic year'
  };

  // Add steps for missing required fields first
  missingFields.forEach(field => {
    if (fieldLabels[field]) {
      steps.push(fieldLabels[field]);
    }
  });

  // Add encouragement
  if (missingFields.length <= 2) {
    steps.push('You\'re almost done! Just a few more steps to complete your profile.');
  } else {
    steps.push('Complete these steps to unlock all HIVE features.');
  }

  return steps;
}
