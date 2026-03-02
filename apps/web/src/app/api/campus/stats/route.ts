import { dbAdmin } from '@/lib/firebase-admin';
import { withErrors } from '@/lib/middleware';

/**
 * GET /api/campus/stats — Public campus statistics
 *
 * Returns aggregate stats for the landing page.
 * Public endpoint (no auth). Cached for 5 minutes.
 */
export const GET = withErrors(async (request, _context, respond) => {
  const db = dbAdmin;
  const { searchParams } = new URL(request.url);
  const campusId = searchParams.get('campusId');

  // Build queries — filter by campusId when provided
  const usersQuery = campusId
    ? db.collection('users').where('campusId', '==', campusId).count()
    : db.collection('users').count();
  const spacesQuery = campusId
    ? db.collection('spaces').where('campusId', '==', campusId).where('isActive', '==', true).count()
    : db.collection('spaces').where('isActive', '==', true).count();
  const toolsQuery = campusId
    ? db.collection('deployed_tools').where('campusId', '==', campusId).where('isActive', '==', true).count()
    : db.collection('deployed_tools').where('isActive', '==', true).count();

  const [usersSnap, spacesSnap, toolsSnap] = await Promise.all([
    usersQuery.get(),
    spacesQuery.get(),
    toolsQuery.get(),
  ]);

  const stats = {
    students: usersSnap.data().count,
    spaces: spacesSnap.data().count,
    apps: toolsSnap.data().count,
  };

  const response = respond.success(stats);

  // Cache for 5 minutes (public, CDN-cacheable)
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  return response;
});
