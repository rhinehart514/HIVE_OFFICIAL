import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/logger";
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { getServerProfileRepository } from '@hive/core/server';
import {
  COMPLETION_REQUIREMENTS,
  isEntryComplete,
  isProfileCompletionComplete as checkProfileComplete,
  getCompletionPercentage,
  getMissingFields,
  getNextSteps,
  type ProfileUserData as UserData,
} from '@hive/core';

interface ProfileCompletionCheck {
  isComplete: boolean;
  entryComplete: boolean;
  profileComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  missingRequired: string[];
  missingRecommended: string[];
  completedFields: string[];
  requiredFields: readonly string[];
  recommendedFields: readonly string[];
  optionalFields: readonly string[];
  nextSteps: string[];
}

/**
 * Check profile completion status
 * GET /api/profile/completion
 *
 * Uses centralized COMPLETION_REQUIREMENTS from @hive/core
 */
export const GET = withAuthAndErrors(async (
  request,
  _context,
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  // Try DDD repository first for accurate completion percentage
  const profileRepository = getServerProfileRepository();
  const profileResult = await profileRepository.findById(userId);

  if (profileResult.isSuccess) {
    const profile = profileResult.getValue();

    // Campus isolation check
    if (profile.campusId.id !== campusId) {
      return respond.error("User profile not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    // Build UserData for completion checks
    const userData: UserData = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      handle: profile.handle.value,
      email: profile.email.value,
      campusId: profile.campusId.id,
      role: profile.userType.value,
      major: profile.major,
      graduationYear: profile.graduationYear,
      bio: profile.bio,
      avatarUrl: profile.personalInfo.profilePhoto,
      interests: profile.interests,
      isOnboarded: profile.isOnboarded,
    };

    // Use centralized completion checks
    const entryComplete = isEntryComplete(userData);
    const profileComplete = checkProfileComplete(userData);
    const completionPercentage = getCompletionPercentage(userData);
    const { required: missingRequired, recommended: missingRecommended } = getMissingFields(userData);
    const nextSteps = getNextSteps(userData);

    // Build completed/missing fields for backward compatibility
    const completedFields: string[] = [];
    const missingFields: string[] = [...missingRequired];

    // Check all profile required fields
    for (const field of COMPLETION_REQUIREMENTS.profile.required) {
      if (!missingRequired.includes(field)) {
        completedFields.push(field);
      }
    }

    // Check recommended fields
    for (const field of COMPLETION_REQUIREMENTS.profile.recommended) {
      if (!missingRecommended.includes(field)) {
        completedFields.push(field);
      }
    }

    // Interests check
    if ((userData.interests?.length || 0) >= COMPLETION_REQUIREMENTS.profile.minimums.interests) {
      completedFields.push('interests');
    }

    const completion: ProfileCompletionCheck = {
      isComplete: profileComplete,
      entryComplete,
      profileComplete,
      completionPercentage,
      missingFields,
      missingRequired,
      missingRecommended,
      completedFields,
      requiredFields: COMPLETION_REQUIREMENTS.profile.required,
      recommendedFields: COMPLETION_REQUIREMENTS.profile.recommended,
      optionalFields: COMPLETION_REQUIREMENTS.profile.optional,
      nextSteps,
    };

    logger.debug('Profile completion via DDD', {
      userId,
      percentage: completionPercentage,
      entryComplete,
      profileComplete,
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
  if (userData?.campusId && userData.campusId !== campusId) {
    return respond.error("User profile not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  // Build UserData from Firestore document
  const firestoreUserData: UserData = {
    firstName: userData?.firstName,
    lastName: userData?.lastName,
    handle: userData?.handle,
    email: userData?.email,
    campusId: userData?.campusId || userData?.schoolId,
    role: userData?.role || userData?.userType,
    major: userData?.major,
    graduationYear: userData?.graduationYear,
    bio: userData?.bio,
    avatarUrl: userData?.avatarUrl || userData?.profileImageUrl,
    interests: userData?.interests,
    entryCompletedAt: userData?.entryCompletedAt,
    onboardingCompleted: userData?.onboardingCompleted,
  };

  // Use centralized completion checks
  const entryComplete = isEntryComplete(firestoreUserData);
  const profileComplete = checkProfileComplete(firestoreUserData);
  const completionPercentage = getCompletionPercentage(firestoreUserData);
  const { required: missingRequired, recommended: missingRecommended } = getMissingFields(firestoreUserData);
  const nextSteps = getNextSteps(firestoreUserData);

  // Build completed/missing fields
  const completedFields: string[] = [];
  const missingFields: string[] = [...missingRequired];

  for (const field of COMPLETION_REQUIREMENTS.profile.required) {
    if (!missingRequired.includes(field)) {
      completedFields.push(field);
    }
  }

  for (const field of COMPLETION_REQUIREMENTS.profile.recommended) {
    if (!missingRecommended.includes(field)) {
      completedFields.push(field);
    }
  }

  if ((firestoreUserData.interests?.length || 0) >= COMPLETION_REQUIREMENTS.profile.minimums.interests) {
    completedFields.push('interests');
  }

  const completion: ProfileCompletionCheck = {
    isComplete: profileComplete,
    entryComplete,
    profileComplete,
    completionPercentage,
    missingFields,
    missingRequired,
    missingRecommended,
    completedFields,
    requiredFields: COMPLETION_REQUIREMENTS.profile.required,
    recommendedFields: COMPLETION_REQUIREMENTS.profile.recommended,
    optionalFields: COMPLETION_REQUIREMENTS.profile.optional,
    nextSteps,
  };

  return respond.success({ completion });
});
