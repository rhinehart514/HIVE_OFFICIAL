import { withAuthAndErrors, type AuthenticatedRequest, getUserId } from '@/lib/middleware';
import { getServerSpaceRepository } from '@hive/core/server';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { dbAdmin } from '@/lib/firebase-admin';

/**
 * GET /api/spaces/mine - Get spaces where user has specific roles
 *
 * Query params:
 *   roles: comma-separated list of roles (default: 'builder,admin')
 *
 * Uses DDD repository for space data, but still needs spaceMembers
 * for role filtering since roles aren't in the EnhancedSpace aggregate.
 */
export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const rolesParam = searchParams.get('roles');
  const targetRoles = (rolesParam ? rolesParam.split(',') : ['builder', 'admin', 'owner'])
    .map(r => r.trim().toLowerCase());

  // Query membership records for this user at current campus
  // Note: spaceMembers is a separate collection from spaces - not part of aggregate
  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .where('isActive', '==', true)
    .get();

  // Filter memberships by target roles
  const membershipsBySpaceId = new Map<string, { role: string }>();
  for (const doc of membershipSnapshot.docs) {
    const data = doc.data();
    const role = ((data.role as string) || 'member').toLowerCase();
    if (targetRoles.includes(role) && data.spaceId) {
      membershipsBySpaceId.set(data.spaceId as string, { role });
    }
  }

  if (membershipsBySpaceId.size === 0) {
    return respond.success({ spaces: [], count: 0 });
  }

  // Use DDD repository to fetch space details
  const spaceRepo = getServerSpaceRepository();
  const spaces: Array<{ id: string; name: string; role: string; slug?: string }> = [];

  for (const [spaceId, membership] of membershipsBySpaceId) {
    const result = await spaceRepo.findById(spaceId);
    if (result.isSuccess) {
      const space = result.getValue();
      // Enforce campus isolation
      if (space.campusId.id === CURRENT_CAMPUS_ID) {
        spaces.push({
          id: space.spaceId.value,
          name: space.name.value,
          role: membership.role,
          slug: space.slug?.value
        });
      }
    }
  }

  return respond.success({ spaces, count: spaces.length });
});
