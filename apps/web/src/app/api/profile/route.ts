/**
 * Profile API Route - DDD Implementation with EnhancedProfile
 * Provides user profile data and updates using domain aggregates
 */

import { z } from 'zod';
import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { changeHandle, getHandleChangeStatus } from '@/lib/handle-service';
import {
  getServerProfileRepository,
  PrivacyLevel,
  Major,
  GraduationYear,
  InterestCollection
} from '@hive/core/server';
import { withCache } from '../../../lib/cache-headers';

// Constants from value objects for schema validation
const MAX_INTERESTS = InterestCollection.MAX_INTERESTS; // 10

// Profile update schema with value object validation
const ProfileUpdateSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  // Major: validate and normalize via Major value object
  major: z.string().min(1).max(100).optional().transform((val) => {
    if (!val) return val;
    const result = Major.create(val);
    // Return normalized value if valid, original otherwise (graceful)
    return result.isSuccess ? result.getValue().value : val;
  }),
  // GraduationYear: validate via GraduationYear value object
  graduationYear: z.number().int().optional().refine(
    (val) => {
      if (val === undefined || val === null) return true;
      return GraduationYear.create(val).isSuccess;
    },
    { message: 'Graduation year must be between 2015 and 8 years from now' }
  ),
  dorm: z.string().max(100).optional(),
  housing: z.string().max(200).optional(),
  pronouns: z.string().max(50).optional(),
  academicYear: z.string().max(50).optional(),
  // Interests: validate via InterestCollection value object
  interests: z.array(z.string().min(2).max(50)).max(MAX_INTERESTS).optional().transform((arr) => {
    if (!arr) return arr;
    const result = InterestCollection.create(arr);
    // Return deduplicated, normalized array
    return result.isSuccess ? result.getValue().toStringArray() : arr;
  }),
  profileImageUrl: z.string().url().optional(),
  photos: z.array(z.string().url()).max(5).optional(),
  statusMessage: z.string().max(200).optional(),
  currentVibe: z.string().max(100).optional(),
  availabilityStatus: z.enum(['online', 'studying', 'busy', 'away', 'invisible']).optional(),
  lookingFor: z.array(z.string()).optional(),
  builderOptIn: z.boolean().optional(),
  builderAnalyticsEnabled: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  showActivity: z.boolean().optional(),
  showSpaces: z.boolean().optional(),
  showConnections: z.boolean().optional(),
  allowDirectMessages: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional()
});

// Default grid layout for new profiles
const DEFAULT_GRID = {
  cards: [
    { id: 'spaces_hub', type: 'spaces_hub', size: '2x1' as const, visible: true },
    { id: 'friends_network', type: 'friends_network', size: '2x1' as const, visible: true },
    { id: 'active_now', type: 'active_now', size: '1x1' as const, visible: true },
    { id: 'discovery', type: 'discovery', size: '1x1' as const, visible: true },
  ],
  mobileLayout: [
    { id: 'spaces_hub_mobile', type: 'spaces_hub', size: '2x1' as const, visible: true },
    { id: 'friends_network_mobile', type: 'friends_network', size: '2x1' as const, visible: true },
  ],
};

/**
 * GET /api/profile
 * Get current user's profile using DDD EnhancedProfile aggregate
 *
 * Query Parameters:
 * - include: Comma-separated list of additional data to include
 *   - grid: Include profile bento grid layout
 *   - widgets: Include widget visibility settings
 *   - viewer: Include viewer relationship info (for viewing other profiles)
 * - id: Optional user ID to view another profile
 * - handle: Optional handle to look up a profile by handle
 */
const _GET = withAuthAndErrors(
  async (request, _context, _respond) => {
    try {
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);

      // Parse query parameters
      const url = new URL(request.url);
      const includeParam = url.searchParams.get('include') || '';
      const includes = includeParam.split(',').filter(Boolean);
      const targetId = url.searchParams.get('id');
      const targetHandle = url.searchParams.get('handle');

      // Determine which profile to fetch
      let targetUserId = userId;
      const profileRepository = getServerProfileRepository();

      if (targetHandle) {
        // Look up by handle
        const handleResult = await profileRepository.findByHandle(targetHandle.toLowerCase());
        if (handleResult.isFailure) {
          return NextResponse.json({
            success: false,
            error: 'Profile not found'
          }, { status: 404 });
        }
        targetUserId = handleResult.getValue().id;
      } else if (targetId) {
        targetUserId = targetId;
      }

      const isOwnProfile = targetUserId === userId;

      // Use DDD repository to get profile
      const profileResult = await profileRepository.findById(targetUserId);

      if (profileResult.isSuccess) {
        const profile = profileResult.getValue();

        // SECURITY: Cross-campus isolation for non-own profiles
        // Users can only view profiles from their own campus unless PUBLIC
        if (!isOwnProfile) {
          const targetCampusId = profile.campusId.id;
          const isCrossCampus = targetCampusId !== campusId;

          if (isCrossCampus && profile.privacy.level !== PrivacyLevel.PUBLIC) {
            logger.warn('Cross-campus profile access blocked', {
              targetUserId,
              targetCampusId,
              viewerCampusId: campusId,
              viewerId: userId,
              privacyLevel: profile.privacy.level,
              endpoint: '/api/profile'
            });
            return NextResponse.json({
              success: false,
              error: 'Profile not found'
            }, { status: 404 });
          }
        }
      }

      if (profileResult.isFailure) {
        // Fallback to direct Firestore check for onboarding detection
        const userSnapshot = await dbAdmin.collection('users').doc(targetUserId).get();

        if (!userSnapshot.exists) {
          // For own profile: return a minimal shell so callers don't 404.
          // The needsOnboarding flag tells the client to redirect to onboarding.
          if (isOwnProfile) {
            logger.info('Own profile not found — returning shell', {
              userId: targetUserId,
              endpoint: '/api/profile'
            });
            return NextResponse.json({
              success: true,
              needsOnboarding: true,
              data: {
                id: targetUserId,
                uid: targetUserId,
                email: '',
                fullName: '',
                handle: null,
                bio: '',
                major: '',
                interests: [],
                campusId: campusId || '',
                userType: 'explorer',
                isOnboarded: false,
                createdAt: new Date().toISOString(),
              },
            });
          }

          logger.warn('Profile not found', {
            userId: targetUserId,
            endpoint: '/api/profile'
          });

          return NextResponse.json({
            success: false,
            error: 'Profile not found',
          }, { status: 404 });
        }

        // Profile exists but failed to load as domain object - use legacy path
        const userData = userSnapshot.data()!;

        // SECURITY: Cross-campus isolation for legacy path
        if (!isOwnProfile) {
          const targetCampusId = userData.campusId;
          const isCrossCampus = targetCampusId && targetCampusId !== campusId;
          const isPrivate = userData.privacySettings?.level !== 'public' &&
                           userData.privacySettings?.isPublic !== true;

          if (isCrossCampus && isPrivate) {
            logger.warn('Cross-campus profile access blocked (legacy path)', {
              targetUserId,
              targetCampusId,
              viewerCampusId: campusId,
              viewerId: userId,
              endpoint: '/api/profile'
            });
            return NextResponse.json({
              success: false,
              error: 'Profile not found'
            }, { status: 404 });
          }
        }

        return buildLegacyResponse(targetUserId, userData, campusId, isOwnProfile, includes);
      }

      const profile = profileResult.getValue();

      // Get handle change status (only for own profile)
      const handleStatus = isOwnProfile ? await getHandleChangeStatus(targetUserId) : null;

      // Fetch optional grid data if requested
      let gridData = null;
      if (includes.includes('grid')) {
        const userDoc = await dbAdmin.collection('users').doc(targetUserId).get();
        const userData = userDoc.data();
        gridData = userData?.profileGrid || { ...DEFAULT_GRID, lastModified: new Date().toISOString() };
      }

      // Build response from DDD aggregate
      const response: Record<string, unknown> = {
        success: true,
        data: {
          id: profile.profileId.value,
          email: profile.email.value,
          handle: profile.handle.value,
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: profile.displayName,
          bio: profile.bio || '',
          major: profile.major || '',
          graduationYear: profile.graduationYear || null,
          dorm: profile.personalInfo.dorm || '',
          interests: profile.interests || [],
          profileImageUrl: profile.personalInfo.profilePhoto || '',
          coverPhoto: profile.personalInfo.coverPhoto || '',
          photos: profile.photos || [],
          // Social info
          clubs: profile.socialInfo.clubs || [],
          sports: profile.socialInfo.sports || [],
          greek: profile.socialInfo.greek || '',
          socials: {
            instagram: profile.socialInfo.instagram || '',
            snapchat: profile.socialInfo.snapchat || '',
            twitter: profile.socialInfo.twitter || '',
            linkedin: profile.socialInfo.linkedin || ''
          },
          // Status (fetch from Firestore for now as not in aggregate)
          statusMessage: '',
          currentVibe: '',
          availabilityStatus: 'online',
          lookingFor: [],
          onboardingStatus: {
            isComplete: profile.isOnboarded,
            currentStep: profile.isOnboarded ? 999 : 1
          },
          // Privacy settings from DDD value object
          privacy: {
            level: profile.privacy.level,
            isPublic: profile.privacy.level === PrivacyLevel.PUBLIC,
            showEmail: profile.privacy.showEmail,
            showPhone: profile.privacy.showPhone,
            showDorm: profile.privacy.showDorm,
            showSchedule: profile.privacy.showSchedule,
            showActivity: profile.privacy.showActivity,
            // Derived from privacy level (PUBLIC/CAMPUS_ONLY show, PRIVATE/CONNECTIONS_ONLY hide)
            showSpaces: profile.privacy.level !== PrivacyLevel.PRIVATE,
            showConnections: profile.privacy.level !== PrivacyLevel.PRIVATE,
            allowDirectMessages: profile.privacy.level !== PrivacyLevel.PRIVATE,
            showOnlineStatus: profile.privacy.level !== PrivacyLevel.PRIVATE
          },
          stats: {
            connectionCount: profile.connectionCount,
            followerCount: profile.followerCount,
            followingCount: profile.followingCount,
            activityScore: profile.activityScore,
            spacesJoined: profile.spaces.length
          },
          // SECURITY: Respect privacy level for spaces and connections
          // Private profiles don't expose social graph to other users
          spaces: (isOwnProfile || profile.privacy.level !== PrivacyLevel.PRIVATE) ? (profile.spaces || []) : [],
          connections: (isOwnProfile || profile.privacy.level !== PrivacyLevel.PRIVATE) ? (profile.connections || []) : [],
          achievements: profile.badges || [],
          metadata: {
            campusId: profile.campusId.id,
            userType: profile.userType.value,
            isVerified: profile.isVerified,
            isActive: profile.isActive,
            createdAt: profile.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: profile.updatedAt?.toISOString() || new Date().toISOString(),
            lastActive: profile.lastActive?.toISOString() || null
          },
          handleChange: handleStatus ? {
            canChange: handleStatus.canChange,
            nextChangeDate: handleStatus.nextChangeDate?.toISOString(),
            changeCount: handleStatus.changeCount,
            isFirstChangeFree: handleStatus.isFirstChangeFree
          } : undefined,
          completionPercentage: profile.getCompletionPercentage()
        }
      };

      // Add optional includes
      if (includes.includes('grid') && gridData) {
        response.grid = gridData;
      }

      if (includes.includes('viewer')) {
        response.viewer = {
          isOwnProfile,
          relationship: isOwnProfile ? 'self' : 'campus',
        };
      }

      // Fetch deployed tools if requested
      if (includes.includes('tools')) {
        const placedToolsSnap = await dbAdmin
          .collection('users')
          .doc(targetUserId)
          .collection('placed_tools')
          .where('isActive', '==', true)
          .orderBy('placedAt', 'desc')
          .limit(20)
          .get();

        const deployedTools = placedToolsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            toolId: data.toolId,
            name: data.name || 'Untitled Tool',
            description: data.description || '',
            icon: data.icon || 'Wrench',
            deploymentId: doc.id,
            isActive: data.isActive ?? true,
            config: data.config || {},
            placedAt: data.placedAt || null,
          };
        });

        response.deployedTools = deployedTools;
      }

      logger.info('Profile fetched successfully via DDD', {
        handle: profile.handle.value,
        endpoint: '/api/profile',
        includes,
        completionPercentage: (response.data as { completionPercentage: number }).completionPercentage
      });

      return NextResponse.json(response);

    } catch (error) {
      logger.error(
        'Error fetching profile',
        { error: { error: error instanceof Error ? error.message : String(error) }, endpoint: '/api/profile' }
      );
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

/**
 * Legacy response builder for backward compatibility
 */
async function buildLegacyResponse(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: Record<string, any>,
  campusId: string,
  isOwnProfile: boolean = true,
  includes: string[] = []
) {
  const handleStatus = isOwnProfile ? await getHandleChangeStatus(userId) : null;

  const response: Record<string, unknown> = {
    success: true,
    data: {
      id: userId,
      email: userData.email,
      handle: userData.handle,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      bio: userData.bio,
      major: userData.major,
      graduationYear: userData.graduationYear,
      dorm: userData.dorm,
      interests: userData.interests || [],
      profileImageUrl: userData.profileImageUrl,
      photos: userData.photos || [],
      statusMessage: userData.statusMessage,
      currentVibe: userData.currentVibe,
      availabilityStatus: userData.availabilityStatus || 'online',
      lookingFor: userData.lookingFor || [],
      onboardingStatus: {
        isComplete: userData.onboardingComplete || false,
        currentStep: userData.onboardingStep || 1
      },
      privacy: {
        isPublic: userData.privacySettings?.isPublic ?? true,
        showActivity: userData.privacySettings?.showActivity ?? true,
        showSpaces: userData.privacySettings?.showSpaces ?? true,
        showConnections: userData.privacySettings?.showConnections ?? true,
        allowDirectMessages: userData.privacySettings?.allowDirectMessages ?? true,
        showOnlineStatus: userData.privacySettings?.showOnlineStatus ?? true
      },
      stats: {
        connectionCount: userData.connections?.length || 0,
        spacesJoined: userData.spaceIds?.length || 0
      },
      metadata: {
        campusId: userData.campusId || campusId,
        createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      },
      handleChange: handleStatus ? {
        canChange: handleStatus.canChange,
        nextChangeDate: handleStatus.nextChangeDate?.toISOString(),
        changeCount: handleStatus.changeCount,
        isFirstChangeFree: handleStatus.isFirstChangeFree
      } : undefined
    },
    _legacy: true // Flag to indicate legacy path was used
  };

  // Add optional includes
  if (includes.includes('grid')) {
    response.grid = userData.profileGrid || { ...DEFAULT_GRID, lastModified: new Date().toISOString() };
  }

  if (includes.includes('viewer')) {
    response.viewer = {
      isOwnProfile,
      relationship: isOwnProfile ? 'self' : 'campus',
    };
  }

  return NextResponse.json(response);
}

/**
 * PUT /api/profile
 * Update current user's profile using DDD aggregate methods
 */
export const PUT = withAuthAndErrors(
  async (request, _context, _respond) => {
    try {
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);
      const body = await request.json();

      // Validate update data
      const updateData = ProfileUpdateSchema.parse(body);

      logger.info('Profile update request', {
        fields: Object.keys(updateData),
        endpoint: '/api/profile'
      });

      // Handle changes go through the dedicated changeHandle function
      // which enforces rate limiting (first change free, then 6 months) and proper cleanup
      if (updateData.handle) {
        const handleResult = await changeHandle(userId, updateData.handle);

        if (!handleResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: handleResult.error,
              nextChangeDate: handleResult.nextChangeDate?.toISOString()
            },
            { status: 400 }
          );
        }
        // Handle was changed successfully via transaction - remove from updateData
        delete updateData.handle;
      }

      // Try DDD path first - load profile aggregate
      const profileRepository = getServerProfileRepository();
      const profileResult = await profileRepository.findById(userId);

      if (profileResult.isSuccess) {
        // Use DDD domain methods
        const profile = profileResult.getValue();
        let hasChanges = false;

        // Update personal info if any personal fields changed
        const personalInfoFields = {
          ...(updateData.firstName !== undefined && { firstName: updateData.firstName }),
          ...(updateData.lastName !== undefined && { lastName: updateData.lastName }),
          ...(updateData.bio !== undefined && { bio: updateData.bio }),
          ...(updateData.major !== undefined && { major: updateData.major }),
          ...(updateData.graduationYear !== undefined && { graduationYear: updateData.graduationYear }),
          ...(updateData.dorm !== undefined && { dorm: updateData.dorm }),
          ...(updateData.pronouns !== undefined && { pronouns: updateData.pronouns }),
          ...(updateData.profileImageUrl !== undefined && { profilePhoto: updateData.profileImageUrl }),
        };

        if (Object.keys(personalInfoFields).length > 0) {
          profile.updatePersonalInfo(personalInfoFields);
          hasChanges = true;
        }

        // Update social info if any social fields changed
        const socialInfoFields = {
          ...(updateData.interests !== undefined && { interests: updateData.interests }),
        };

        if (Object.keys(socialInfoFields).length > 0) {
          profile.updateSocialInfo(socialInfoFields);
          hasChanges = true;
        }

        // Update privacy if any privacy fields changed
        const hasPrivacyUpdate = updateData.isPublic !== undefined ||
          updateData.showActivity !== undefined ||
          updateData.showSpaces !== undefined ||
          updateData.showConnections !== undefined ||
          updateData.allowDirectMessages !== undefined ||
          updateData.showOnlineStatus !== undefined;

        if (hasPrivacyUpdate) {
          // Get current privacy level and create new privacy value object
          const currentPrivacy = profile.privacy;
          const newPrivacyProps = {
            level: updateData.isPublic !== undefined
              ? (updateData.isPublic ? PrivacyLevel.PUBLIC : PrivacyLevel.CAMPUS_ONLY)
              : currentPrivacy.level,
            showEmail: currentPrivacy.showEmail,
            showPhone: currentPrivacy.showPhone,
            showDorm: currentPrivacy.showDorm,
            showSchedule: currentPrivacy.showSchedule,
            showActivity: updateData.showActivity ?? currentPrivacy.showActivity,
          };

          // Create new ProfilePrivacy - import it from core
          const { ProfilePrivacy } = await import('@hive/core/server');
          const newPrivacy = ProfilePrivacy.create(newPrivacyProps);
          if (newPrivacy.isSuccess) {
            profile.updatePrivacy(newPrivacy.getValue());
            hasChanges = true;
          }
        }

        // Save if there were changes via domain methods
        if (hasChanges) {
          const saveResult = await profileRepository.save(profile);
          if (saveResult.isFailure) {
            logger.warn('DDD save failed, falling back to direct update', {
              error: saveResult.error,
              userId
            });
          } else {
            logger.info('Profile updated successfully via DDD', {
              fieldsUpdated: Object.keys(updateData),
              endpoint: '/api/profile'
            });

            return NextResponse.json({
              success: true,
              message: 'Profile updated successfully',
              data: {
                id: userId,
                updatedFields: Object.keys(updateData),
                completionPercentage: profile.getCompletionPercentage()
              }
            });
          }
        }
      }

      // Fallback to direct Firestore update for fields not in domain model
      // or if DDD path didn't handle all updates
      const updateFields: Record<string, unknown> = {
        ...updateData,
        updatedAt: new Date(),
        campusId
      };

      // Handle privacy settings merge for legacy fields
      if (updateData.isPublic !== undefined ||
          updateData.showActivity !== undefined ||
          updateData.showSpaces !== undefined ||
          updateData.showConnections !== undefined ||
          updateData.allowDirectMessages !== undefined ||
          updateData.showOnlineStatus !== undefined) {

        const currentDoc = await dbAdmin.collection('users').doc(userId).get();
        const currentPrivacy = currentDoc.data()?.privacySettings || {};

        updateFields.privacySettings = {
          ...currentPrivacy,
          ...(updateData.isPublic !== undefined && { isPublic: updateData.isPublic }),
          ...(updateData.showActivity !== undefined && { showActivity: updateData.showActivity }),
          ...(updateData.showSpaces !== undefined && { showSpaces: updateData.showSpaces }),
          ...(updateData.showConnections !== undefined && { showConnections: updateData.showConnections }),
          ...(updateData.allowDirectMessages !== undefined && { allowDirectMessages: updateData.allowDirectMessages }),
          ...(updateData.showOnlineStatus !== undefined && { showOnlineStatus: updateData.showOnlineStatus })
        };

        // Remove the individual privacy fields from top level
        delete updateFields.isPublic;
        delete updateFields.showActivity;
        delete updateFields.showSpaces;
        delete updateFields.showConnections;
        delete updateFields.allowDirectMessages;
        delete updateFields.showOnlineStatus;
      }

      await dbAdmin.collection('users').doc(userId).update(updateFields);

      logger.info('Profile updated successfully (fallback)', {
        fieldsUpdated: Object.keys(updateData),
        endpoint: '/api/profile'
      });

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: userId,
          updatedFields: Object.keys(updateData)
        }
      });

    } catch (error) {
      logger.error(
        'Error updating profile',
        { error: { error: error instanceof Error ? error.message : String(error) }, endpoint: '/api/profile' }
      );
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/profile
 * Alias for updating current user's profile (matches client usage)
 */
export const PATCH = PUT;

/**
 * POST /api/profile
 * Alias for updating current user's profile to match API reference
 */
export const POST = PUT;

export const GET = withCache(_GET, 'PRIVATE');
