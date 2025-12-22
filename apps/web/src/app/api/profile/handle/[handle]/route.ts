import { withOptionalAuth, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { getServerProfileRepository } from '@hive/core/server';

/**
 * GET /api/profile/handle/[handle] - Lookup profile by handle
 *
 * Returns public profile data for the given handle.
 * Privacy rules are enforced based on viewer's relationship.
 */
export const GET = withOptionalAuth(
  async (request, context: { params: Promise<{ handle: string }> }, respond) => {
    const { handle } = await context.params;

    if (!handle) {
      return respond.error('Missing handle', 'INVALID_INPUT', { status: 400 });
    }

    try {
      const profileRepository = getServerProfileRepository();

      // Find profile by handle
      const profileResult = await profileRepository.findByHandle(handle.toLowerCase());

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
        viewerId = getUserId(request as AuthenticatedRequest);
        viewerCampusId = getCampusId(request as AuthenticatedRequest);
      } catch {
        // Not authenticated - viewer is public
      }

      const isOwnProfile = viewerId === profile.id;

      if (!isOwnProfile && viewerId) {
        if (viewerCampusId && profile.campusId.id === viewerCampusId) {
          viewerType = 'campus';

          // Check if they're connected
          const connectionsResult = await profileRepository.findConnectionsOf(profile.id);
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
        return respond.success({
          profile: {
            id: profile.id,
            handle: profile.handle.value,
            displayName: profile.displayName,
            isPrivate: true,
          },
          isOwnProfile: false,
          viewerType: 'restricted',
        });
      }

      // Build full profile response
      // Note: EnhancedProfile stores avatar in personalInfo.profilePhoto
      // Privacy level affects what we show to public/campus/connection viewers
      const showSensitiveFields = isOwnProfile || viewerType === 'connection';

      return respond.success({
        profile: {
          id: profile.id,
          handle: profile.handle.value,
          displayName: profile.displayName,
          avatarUrl: profile.personalInfo.profilePhoto || null,
          bio: showSensitiveFields ? profile.bio : null,
          pronouns: null, // EnhancedProfile doesn't track pronouns yet
          major: showSensitiveFields ? profile.major : null,
          graduationYear: showSensitiveFields ? profile.graduationYear : null,
          campusId: profile.campusId.id,
          isVerified: profile.isVerified,
          badges: profile.badges,
          interests: showSensitiveFields ? profile.interests : [],
          stats: {
            spacesCount: profile.spaces.length,
            connectionsCount: profile.connectionCount,
            toolsCreated: 0, // TODO: Track tools created per user
          },
          createdAt: profile.createdAt?.toISOString(),
        },
        isOwnProfile,
        viewerType,
      });
    } catch (error) {
      console.error('Error fetching profile by handle:', error);
      return respond.error('Failed to fetch profile', 'INTERNAL_ERROR', { status: 500 });
    }
  }
);
