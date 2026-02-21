import { type NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { dbAdmin } from "@/lib/firebase-admin";
import { getServerProfileRepository } from '@hive/core/server';
import { verifySession } from '@/lib/session';
import { deriveCampusFromEmail } from '@/lib/middleware';
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
 *
 * Auth: reads hive_session cookie directly (withOptionalAuth doesn't support cookies)
 */
async function _GET(request: NextRequest, context: { params: Promise<{ handle: string }> }) {
  const { handle: handleParam } = await context.params;
  const rawHandle = (handleParam || '').toString().trim().toLowerCase();
  if (!rawHandle) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Missing handle' } },
      { status: 400 }
    );
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
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    const profile = profileResult.getValue();
    const privacy = profile.privacy;

    // Read auth from session cookie (same as withAuth)
    let viewerId: string | null = null;
    let viewerCampusId: string | null = null;
    let viewerType: 'public' | 'campus' | 'connection' | 'self' = 'public';

    try {
      const sessionCookie = request.cookies.get('hive_session');
      if (sessionCookie?.value) {
        const session = await verifySession(sessionCookie.value);
        if (session?.userId) {
          viewerId = session.userId;
          viewerCampusId = session.email ? deriveCampusFromEmail(session.email) ?? null : null;
        }
      }
    } catch {
      // Not authenticated — continue as public
    }

    const profileId = profile.profileId.value;
    const isOwnProfile = viewerId === profileId;

    if (isOwnProfile) {
      viewerType = 'self';
    } else if (viewerCampusId && profile.campusId.id === viewerCampusId) {
      viewerType = 'campus';
    }

    // Check privacy — if restricted, return minimal data with privacy flag
    const canView = isOwnProfile || privacy.canViewProfile(
      viewerType === 'self' ? 'connection' : viewerType
    );

    if (!canView) {
      return NextResponse.json({
        success: true,
        data: {
          profile: {
            id: profileId,
            handle: profile.handle.value,
            fullName: profile.displayName,
            avatarUrl: profile.personalInfo.profilePhoto || null,
            isPrivate: true,
          },
          viewerType: 'restricted',
        },
      });
    }

    logger.info('Handle resolved', {
      handle: rawHandle,
      profileId,
      viewerType,
    });

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    logger.error('Failed to resolve handle', {
      handle: rawHandle,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve handle' } },
      { status: 500 }
    );
  }
}

export const GET = withCache(_GET, 'SHORT');
