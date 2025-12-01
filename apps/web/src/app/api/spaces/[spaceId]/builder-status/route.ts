import { withAuthAndErrors, type AuthenticatedRequest, getUserId } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { HttpStatus } from "@/lib/api-response-types";
import { getServerSpaceRepository } from "@hive/core/server";

/**
 * GET /api/spaces/[spaceId]/builder-status
 * Returns caller's role and abilities within a space.
 * Uses flat spaceMembers collection, with fallback to nested membership for legacy roles.
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);

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
    if (space.campusId.id !== CURRENT_CAMPUS_ID) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
    }

    // Check flat membership first
    const membershipQuery = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .limit(1)
      .get();

    let role: string | null = null;
    if (!membershipQuery.empty) {
      role = membershipQuery.docs[0].data().role || 'member';
    }

    const isMember = !!role;
    const canFeatureTools = ['owner', 'admin', 'builder'].includes(role || '');
    const canPinPosts = ['owner', 'admin', 'builder'].includes(role || '');

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
