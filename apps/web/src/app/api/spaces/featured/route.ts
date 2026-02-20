import { withOptionalAuth, getUser } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../lib/cache-headers';
import type { NextRequest } from 'next/server';

/**
 * GET /api/spaces/featured
 * Returns featured/popular public spaces for discovery.
 * Sorted by memberCount descending, filtered by campus if authenticated.
 */
const _GET = withOptionalAuth(async (request, _context, respond) => {
  const user = getUser(request as NextRequest);
  const campusId = user?.campusId;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const category = searchParams.get('category');

  let query = dbAdmin.collection('spaces')
    .where('visibility', '==', 'public')
    .orderBy('memberCount', 'desc')
    .limit(limit);

  // Filter by campus if user is authenticated
  if (campusId) {
    query = dbAdmin.collection('spaces')
      .where('visibility', '==', 'public')
      .where('campusId', '==', campusId)
      .orderBy('memberCount', 'desc')
      .limit(limit);
  }

  const snapshot = await query.get();

  let spaces = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: (data.name as string) || '',
      handle: (data.handle as string) || '',
      description: (data.description as string) || '',
      memberCount: (data.memberCount as number) ?? (data.metrics as { memberCount?: number })?.memberCount ?? 0,
      iconURL: (data.iconURL as string) || (data.iconUrl as string) || '',
      category: (data.category as string) || (data.type as string) || 'general',
      bannerImage: (data.bannerImage as string) || '',
      campusId: (data.campusId as string) || '',
    };
  });

  // Client-side category filter (Firestore compound index may not exist)
  if (category) {
    spaces = spaces.filter(s => s.category === category);
  }

  return respond.success({
    spaces,
    count: spaces.length,
  });
});

export const GET = withCache(_GET as (req: NextRequest, ctx: unknown) => Promise<Response>, 'SHORT');
