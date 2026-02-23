import { withAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../lib/cache-headers';

/**
 * GET /api/feed
 * Global/personalized feed for the authenticated user's campus.
 * Reads from analytics_events, ordered by timestamp desc.
 * Supports cursor-based pagination via ?cursor= (ISO timestamp).
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
  const cursor = searchParams.get('cursor'); // ISO timestamp

  let query = dbAdmin.collection('analytics_events')
    .orderBy('timestamp', 'desc')
    .limit(limit + 1); // fetch one extra to detect hasMore

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!isNaN(cursorDate.getTime())) {
      query = dbAdmin.collection('analytics_events')
        .where('timestamp', '<', cursorDate)
        .orderBy('timestamp', 'desc')
        .limit(limit + 1);
    }
  }

  const snapshot = await query.get();

  const allDocs = snapshot.docs.filter(doc => {
    const data = doc.data();
    // campusId single-field index is exempted — filter in memory
    if (data.campusId && data.campusId !== campusId) return false;
    return true;
  });

  const hasMore = allDocs.length > limit;
  const docs = hasMore ? allDocs.slice(0, limit) : allDocs;

  const items = docs.map(doc => {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate?.()?.toISOString() ||
      (typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString());

    return {
      id: doc.id,
      type: (data.eventType as string) || 'unknown',
      userId: (data.userId as string) || undefined,
      spaceId: (data.spaceId as string) || undefined,
      metadata: (data.metadata as Record<string, unknown>) || {},
      timestamp,
    };
  });

  const nextCursor = items.length > 0 ? items[items.length - 1].timestamp : null;

  return respond.success({
    items,
    count: items.length,
    hasMore,
    nextCursor,
  });
});

export const GET = withCache(_GET, 'SHORT');
