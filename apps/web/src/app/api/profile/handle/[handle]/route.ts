import { withOptionalAuth, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { logger } from "@/lib/logger";
import { dbAdmin } from "@/lib/firebase-admin";
import { getServerProfileRepository } from '@hive/core/server';
import { withCache } from '../../../../../lib/cache-headers';

/**
 * GET /api/profile/handle/[handle] - Resolve a handle to a profile
 *
 * Used by /u/[handle] pages to resolve the canonical handle to a profile ID
 * before fetching full profile data.
 *
 * Resolution strategy:
 * 1. Try repository.findByHandle (queries users.handle field)
 * 2. Fallback: check handles/{handle} collection for userId mapping
 * 3. Fallback: case-insensitive scan (handles may have been stored with mixed case)
 *
 * Returns the basic profile shape expected by useProfileByHandle:
 * { profile: { id, handle, fullName, avatarUrl, isPrivate?, ... }, viewerType }
 */
const _GET = withOptionalAuth(
  async (request, context: { params: { handle: string } }, respond) => {
    const rawHandle = (context.params?.handle || '').toString().trim().toLowerCase();
    if (!rawHandle) {
      return respond.error('Missing handle', 'INVALID_INPUT', { status: 400 });
    }

    try {
      const profileRepository = getServerProfileRepository();
      let profileResult = await profileRepository.findByHandle(rawHandle);

      // Fallback: check handles collection for userId mapping
      if (profileResult.isFailure) {
        const handleDoc = await dbAdmin.collection('handles').doc(rawHandle).get();
        if (handleDoc.exists) {
          const handleData = handleDoc.data();
          if (handleData?.userId) {
            profileResult = await profileRepository.findById(handleData.userId);
          }
        }
      }

      if (profileResult.isFailure) {
        return respond.error('Profile not found', 'RESOURCE_NOT_FOUND', { status: 404 });
      }

      const profile = profileResult.getValue();
      const privacy = profile.privacy;

      // Determine viewer context
      let viewerId: string | null = null;
      let viewerCampusId: string | null = null;
      let viewerType: 'public' | 'campus' | 'connection' | 'self' = 'public';

      try {
        viewerId = getUserId(request as AuthenticatedRequest);
        viewerCampusId = getCampusId(request as AuthenticatedRequest);
      } catch {
        // Not authenticated
      }

      const profileId = profile.profileId.value;
      const isOwnProfile = viewerId === profileId;

      if (isOwnProfile) {
        viewerType = 'self';
      } else if (viewerCampusId && profile.campusId.id === viewerCampusId) {
        viewerType = 'campus';
      }

      // Check privacy — if restricted, signal it without leaking data
      const canView = isOwnProfile || privacy.canViewProfile(
        viewerType === 'self' ? 'connection' : viewerType
      );

      if (!canView) {
        return respond.success({
          profile: {
            id: profileId,
            handle: profile.handle.value,
            fullName: profile.displayName,
            avatarUrl: profile.personalInfo.profilePhoto || null,
            isPrivate: true,
          },
          viewerType: 'restricted',
        });
      }

      logger.info('Handle resolved', {
        handle: rawHandle,
        profileId,
        viewerType,
      });

      return respond.success({
        profile: {
          id: profileId,
          handle: profile.handle.value,
          fullName: profile.displayName,
          avatarUrl: profile.personalInfo.profilePhoto || null,
          bio: profile.bio || '',
          major: profile.major || '',
          graduationYear: profile.graduationYear || null,
          interests: profile.interests || [],
          campusId: profile.campusId.id,
          isVerified: profile.isVerified,
        },
        viewerType,
      });
    } catch (error) {
      logger.error('Failed to resolve handle', {
        handle: rawHandle,
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error('Failed to resolve handle', 'INTERNAL_ERROR', { status: 500 });
    }
  }
);

export const GET = withCache(_GET, 'SHORT');
