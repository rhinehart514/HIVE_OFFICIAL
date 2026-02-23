/**
 * Builder Permission Check API
 *
 * Validates if a user has builder permissions for a specific space.
 * Used by the frontend to gate access to HiveLab IDE context selection.
 */

import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { withCache } from '../../../../../lib/cache-headers';

/**
 * GET /api/spaces/[spaceId]/builder-permission
 *
 * Check if the authenticated user has builder permission for a space.
 *
 * @returns {object} response
 * @returns {boolean} response.hasPermission - Whether user has builder permission
 * @returns {string|null} response.role - User's role in the space
 * @returns {object|null} response.space - Basic space info if user has permission
 */
const _GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await (context as unknown as { params: Promise<{ spaceId: string }> }).params;

  logger.info('Checking builder permission', {
    userId,
    spaceId,
    endpoint: '/api/spaces/[spaceId]/builder-permission',
  });

  try {
    // Check if space exists
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();

    if (!spaceDoc.exists) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: 404 });
    }

    const spaceData = spaceDoc.data();

    // Validate campus access
    const campusId = getCampusId(request as AuthenticatedRequest);
    if (spaceData?.campusId && spaceData.campusId !== campusId) {
      return respond.error('Access denied for this campus', 'FORBIDDEN', { status: 403 });
    }

    // Check user membership with builder role
    // Builder roles: owner, admin, leader, builder
    const memberSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('spaceId', '==', spaceId)
      .where('status', '==', 'active')
      .where('role', 'in', ['owner', 'admin', 'leader', 'builder'])
      .limit(1)
      .get();

    const hasPermission = !memberSnapshot.empty;

    if (!hasPermission) {
      logger.info('Builder permission denied', {
        userId,
        spaceId,
        reason: 'User does not have builder role',
      });

      return respond.success({
        hasPermission: false,
        role: null,
        space: null,
      });
    }

    const memberData = memberSnapshot.docs[0].data();
    const userRole = memberData.role;

    logger.info('Builder permission granted', {
      userId,
      spaceId,
      role: userRole,
    });

    return respond.success({
      hasPermission: true,
      role: userRole,
      space: {
        id: spaceId,
        name: spaceData?.name || 'Unknown Space',
        spaceType: spaceData?.spaceType || 'general',
        visibility: spaceData?.visibility || 'private',
      },
    });
  } catch (error) {
    logger.error('Error checking builder permission', {
      userId,
      spaceId,
      error: error instanceof Error ? error.message : String(error),
    });

    return respond.error(
      'Failed to check builder permission',
      'INTERNAL_ERROR',
      { status: 500 }
    );
  }
});

export const GET = withCache(_GET, 'SHORT');
