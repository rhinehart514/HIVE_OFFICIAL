import { withOptionalAuth, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { logger } from "@/lib/logger";
import {
  getServerProfileRepository,
  PrivacyLevel
} from '@hive/core/server';
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/profile/[userId] - Public profile with 4-tier privacy enforcement
 *
 * Privacy Levels:
 * - PUBLIC: Anyone can view
 * - CAMPUS_ONLY: Only users from same campus
 * - CONNECTIONS_ONLY: Only connected users
 * - PRIVATE: Only the user themselves
 *
 * The endpoint determines viewer type and enforces field-level privacy.
 */
const _GET = withOptionalAuth(
  async (request, context: { params: { userId: string } }, respond) => {
    const targetUserId = (context.params?.userId || '').toString();
    if (!targetUserId) {
      return respond.error('Missing userId', 'INVALID_INPUT', { status: 400 });
    }

    try {
      const profileRepository = getServerProfileRepository();

      // Get target profile using DDD repository
      const profileResult = await profileRepository.findById(targetUserId);

      if (profileResult.isFailure) {
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }

      const profile = profileResult.getValue();
      const privacy = profile.privacy;

      // Determine viewer type
      let viewerId: string | null = null;
      let viewerCampusId: string | null = null;
      let viewerType: 'public' | 'campus' | 'connection' = 'public';

      try {
        // Try to get authenticated viewer info
        viewerId = getUserId(request as AuthenticatedRequest);
        viewerCampusId = getCampusId(request as AuthenticatedRequest);
      } catch {
        // Not authenticated - viewer is public
      }

      // Check if viewer is the profile owner (always full access)
      const isOwnProfile = viewerId === targetUserId;

      // SECURITY: Cross-campus isolation
      // Non-public profiles from different campuses are not accessible
      const targetCampusId = profile.campusId.id;
      const isCrossCampus = viewerCampusId && targetCampusId !== viewerCampusId;

      if (isCrossCampus && !isOwnProfile && privacy.level !== PrivacyLevel.PUBLIC) {
        logger.warn('Cross-campus profile access blocked', {
          targetUserId,
          targetCampusId,
          viewerCampusId,
          viewerId,
          privacyLevel: privacy.level
        });
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }

      if (!isOwnProfile && viewerId) {
        // Determine viewer type based on relationship
        if (viewerCampusId && targetCampusId === viewerCampusId) {
          viewerType = 'campus';

          // Check if they're connected
          const connectionsResult = await profileRepository.findConnectionsOf(targetUserId);
          if (connectionsResult.isSuccess) {
            const connections = connectionsResult.getValue();
            if (connections.some((c: { profileId: { value: string } }) => c.profileId.value === viewerId)) {
              viewerType = 'connection';
            }
          }
        }
      }

      // Check if viewer can access this profile
      const canView = isOwnProfile || privacy.canViewProfile(viewerType);

      if (!canView) {
        // Return minimal data for private profiles
        return respond.success({
          profile: {
            id: targetUserId,
            handle: profile.handle.value,
            fullName: profile.displayName,
            avatarUrl: profile.personalInfo.profilePhoto || null,
            isPrivate: true,
            privacyLevel: privacy.level,
            message: getPrivacyMessage(privacy.level, viewerType)
          },
          viewerType,
          canView: false
        });
      }

      // Build response based on privacy settings
      const publicData = buildProfileResponse(profile, privacy, isOwnProfile, viewerType);

      logger.info('Public profile fetched', {
        targetUserId,
        viewerId,
        viewerType,
        privacyLevel: privacy.level,
        isOwnProfile
      });

      return respond.success({
        profile: publicData,
        viewerType,
        canView: true
      });

    } catch (error) {
      logger.error('Failed to fetch public profile', {
        error: error instanceof Error ? error.message : String(error),
        targetUserId
      });
      return respond.error('Failed to fetch profile', 'INTERNAL_ERROR', { status: 500 });
    }
  }
);

/**
 * Build profile response with field-level privacy gating
 */
function buildProfileResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  privacy: any,
  isOwnProfile: boolean,
  viewerType: 'public' | 'campus' | 'connection'
) {
  // Owner always sees everything
  if (isOwnProfile) {
    return {
      id: profile.profileId.value,
      handle: profile.handle.value,
      email: profile.email.value,
      fullName: profile.displayName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.personalInfo.profilePhoto || null,
      coverPhoto: profile.personalInfo.coverPhoto || null,
      bio: profile.bio || '',
      major: profile.major || '',
      graduationYear: profile.graduationYear || null,
      dorm: profile.personalInfo.dorm || null,
      interests: profile.interests || [],
      clubs: profile.socialInfo.clubs || [],
      sports: profile.socialInfo.sports || [],
      socials: {
        instagram: profile.socialInfo.instagram,
        snapchat: profile.socialInfo.snapchat,
        twitter: profile.socialInfo.twitter,
        linkedin: profile.socialInfo.linkedin
      },
      spaces: profile.spaces || [],
      connections: profile.connections || [],
      achievements: profile.badges || [],
      stats: {
        connectionCount: profile.connectionCount,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        activityScore: profile.activityScore
      },
      privacy: {
        level: privacy.level,
        showEmail: privacy.showEmail,
        showPhone: privacy.showPhone,
        showDorm: privacy.showDorm,
        showSchedule: privacy.showSchedule,
        showActivity: privacy.showActivity
      },
      campusId: profile.campusId.id,
      isVerified: profile.isVerified,
      isOnboarded: profile.isOnboarded,
      createdAt: profile.createdAt,
      lastActive: profile.lastActive
    };
  }

  // Build response for other viewers based on privacy settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: Record<string, any> = {
    id: profile.profileId.value,
    handle: profile.handle.value,
    fullName: profile.displayName,
    avatarUrl: profile.personalInfo.profilePhoto || null,
    campusId: profile.campusId.id,
    isVerified: profile.isVerified
  };

  // Always visible fields (basic identity)
  response.firstName = profile.firstName;
  response.lastName = profile.lastName;
  response.coverPhoto = profile.personalInfo.coverPhoto || null;

  // Bio - always visible if profile is accessible
  response.bio = profile.bio || '';

  // Academic info
  response.major = profile.major || '';
  response.graduationYear = profile.graduationYear || null;

  // Interests and activities - always visible
  response.interests = profile.interests || [];
  response.clubs = profile.socialInfo.clubs || [];
  response.sports = profile.socialInfo.sports || [];

  // Dorm/housing - privacy gated
  if (privacy.showDorm || viewerType === 'connection') {
    response.dorm = profile.personalInfo.dorm || null;
  }

  // Social links - campus+ visibility
  if (viewerType !== 'public') {
    response.socials = {
      instagram: profile.socialInfo.instagram,
      snapchat: profile.socialInfo.snapchat,
      twitter: profile.socialInfo.twitter,
      linkedin: profile.socialInfo.linkedin
    };
  }

  // Activity score - privacy gated
  if (privacy.showActivity) {
    response.stats = {
      connectionCount: profile.connectionCount,
      activityScore: profile.activityScore
    };
  }

  // Spaces - always visible (public membership)
  response.spaces = profile.spaces || [];

  // Connection count only, not the actual connections
  response.connectionCount = profile.connectionCount;

  // Achievements/badges - always visible
  response.achievements = profile.badges || [];

  return response;
}

/**
 * Get user-friendly privacy message
 */
function getPrivacyMessage(level: PrivacyLevel, viewerType: 'public' | 'campus' | 'connection'): string {
  switch (level) {
    case PrivacyLevel.CAMPUS_ONLY:
      if (viewerType === 'public') {
        return 'This profile is only visible to campus members. Sign in with your .edu email to view.';
      }
      return 'This profile is only visible to campus members.';

    case PrivacyLevel.CONNECTIONS_ONLY:
      if (viewerType === 'connection') {
        return 'This profile is visible to connections only.';
      }
      return 'This profile is only visible to connections. Send a connection request to view.';

    case PrivacyLevel.PRIVATE:
      return 'This profile is private.';

    default:
      return 'Unable to view this profile.';
  }
}

export const GET = withCache(_GET, 'SHORT');
