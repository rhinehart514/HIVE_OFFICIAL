import { withAuthAndErrors, type AuthenticatedRequest, getUserId, getCampusId } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { HttpStatus } from "@/lib/api-response-types";
import { getServerSpaceRepository } from "@hive/core/server";
import { withCache } from '../../../../../lib/cache-headers';

/**
 * GET /api/spaces/[spaceId]/builder-status
 * Returns caller's role and abilities within a space.
 * Uses flat spaceMembers collection, with fallback to nested membership for legacy roles.
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  try {
    // Use DDD repository for space validation
    const spaceRepo = getServerSpaceRepository();
    const spaceResult = await spaceRepo.findById(spaceId);

    if (spaceResult.isFailure) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
    }

    const space = spaceResult.getValue();

    // Enforce campus isolation
    if (space.campusId.id !== campusId) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
    }

    // Check flat membership first
    const membershipQuery = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .limit(1)
      .get();

    let role: string | null = null;
    if (!membershipQuery.empty) {
      role = membershipQuery.docs[0].data().role || 'member';
    }

    const isMember = !!role;
    // Valid roles: owner, admin, moderator, member, guest
    const canFeatureTools = ['owner', 'admin', 'moderator'].includes(role || '');
    const canPinPosts = ['owner', 'admin', 'moderator'].includes(role || '');

    return respond.success({
      isMember,
      role: role || 'guest',
      permissions: {
        canFeatureTools,
        canPinPosts,
      },
      space: {
        id: space.spaceId.value,
        name: space.name.value,
        slug: space.slug?.value,
        isVerified: space.isVerified,
      }
    });
  } catch (error) {
    logger.error('Error fetching builder status', {
      spaceId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    return respond.error('Failed to fetch builder status', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

export const GET = withCache(_GET, 'SHORT');
