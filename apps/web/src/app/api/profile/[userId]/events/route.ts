import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { withCache } from '../../../../../lib/cache-headers';

/**
 * GET /api/profile/[userId]/events
 * Fetch events organized by a specific user
 *
 * Returns upcoming events where the user is the organizer.
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ userId: string }> },
  respond
) => {
  const viewerId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { userId: targetUserId } = await params;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

  try {
    // Query events where user is the organizer
    // campusId filter omitted — single-field index is exempted (FAILED_PRECONDITION).
    // organizerId is selective enough; campus isolation enforced in-memory below.
    const now = new Date();
    const eventsQuery = dbAdmin
      .collection('events')
      .where('organizerId', '==', targetUserId)
      .where('startDate', '>=', now.toISOString())
      .orderBy('startDate', 'asc')
      .limit(limit);

    const eventsSnapshot = await eventsQuery.get();

    // Get total count for this organizer
    const countQuery = dbAdmin
      .collection('events')
      .where('organizerId', '==', targetUserId)
      .where('startDate', '>=', now.toISOString());

    const countSnapshot = await countQuery.count().get();
    const totalCount = countSnapshot.data().count;

    // Transform events to ProfileEvent format
    // In-memory campus isolation (campusId Firestore filter is exempted from index)
    const events = eventsSnapshot.docs.flatMap((doc) => {
      const data = doc.data();
      if (data.campusId && data.campusId !== campusId) return [];
      const startDate = data.startDate?.toDate?.() || new Date(data.startDate);

      return {
        id: doc.id,
        title: data.title || 'Untitled Event',
        date: startDate.toISOString(),
        dateDisplay: formatEventDate(startDate),
        location: data.location || data.locationName || 'TBD',
        emoji: data.emoji || getEventTypeEmoji(data.type),
        attendeeCount: data.attendeeCount || data.goingCount || 0,
        type: data.type || 'social',
        spaceId: data.spaceId || null,
        spaceName: data.spaceName || null,
      };
    });

    logger.info('[profile/events] Fetched organizing events', {
      targetUserId,
      viewerId,
      count: events.length,
      totalCount,
    });

    return respond.success({
      events,
      totalCount,
    });
  } catch (error) {
    // GRACEFUL DEGRADATION: Profile pages can show partial data, but we must log
    // Log at warn level since this is expected degradation, not a critical error
    logger.warn('[profile/events] Failed to fetch organizing events - returning empty (graceful degradation)', {
      targetUserId,
      viewerId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return empty with degraded flag so clients know this is partial data
    return respond.success({
      events: [],
      totalCount: 0,
      _degraded: true,
      _degradedReason: 'Failed to fetch events',
    });
  }
});

/**
 * Format event date for display
 */
function formatEventDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffDays === 1) {
    return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffDays <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * Get emoji for event type
 */
function getEventTypeEmoji(type?: string): string {
  switch (type) {
    case 'academic':
      return '📚';
    case 'social':
      return '🎉';
    case 'professional':
      return '💼';
    case 'recreational':
      return '⚽';
    case 'official':
      return '🏛️';
    case 'meeting':
      return '📅';
    case 'virtual':
      return '💻';
    default:
      return '📆';
  }
}

export const GET = withCache(_GET, 'SHORT');
