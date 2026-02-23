import { withAuthAndErrors, type AuthenticatedRequest, getUserId, getCampusId } from '@/lib/middleware';
import { getServerSpaceRepository } from '@hive/core/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/spaces/mine - Get spaces where user has specific roles
 *
 * Query params:
 *   roles: comma-separated list of roles (default: 'owner,admin,moderator')
 *
 * Uses DDD repository for space data, but still needs spaceMembers
 * for role filtering since roles aren't in the EnhancedSpace aggregate.
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);
  const { searchParams } = new URL(request.url);
  const rolesParam = searchParams.get('roles');
  // Valid roles: owner, admin, moderator, member, guest
  const targetRoles = (rolesParam ? rolesParam.split(',') : ['owner', 'admin', 'moderator'])
    .map(r => r.trim().toLowerCase());

  // Query membership records for this user at current campus
  // Note: spaceMembers is a separate collection from spaces - not part of aggregate
  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
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
      if (space.campusId.id === campusId) {
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

export const GET = withCache(_GET, 'SHORT');
