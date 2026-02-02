/**
 * Calendar API - Read-only space events
 *
 * Returns events from spaces the user is a member of.
 * Personal event creation removed — use Google Calendar for personal events.
 *
 * @version 2.0.0 - Spaces-first calendar (Feb 2026)
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/logger";
import { ApiResponseHelper, HttpStatus } from "@/lib/api-response-types";
import { withAuth, type AuthContext } from '@/lib/api-auth-middleware';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Event type for calendar display (space events only)
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isAllDay?: boolean;
  type: 'space';
  source?: string;
  spaceId?: string;
  spaceName?: string;
  canEdit: boolean;
  eventType?: string;
  organizerName?: string;
}

// GET - Fetch calendar events (space events only)
export const GET = withAuth(async (request, authContext: AuthContext) => {
  try {
    const userId = authContext.userId;
    const campusId = authContext.campusId;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch user's space memberships
    const membershipsSnapshot = await dbAdmin.collection('spaceMembers')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .where('campusId', '==', campusId)
      .get();

    const userSpaceIds = membershipsSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data().spaceId);

    if (userSpaceIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Batch query for space events (Firestore limit of 10 for 'in' queries)
    const allEvents: CalendarEvent[] = [];

    for (let i = 0; i < userSpaceIds.length; i += 10) {
      const batch = userSpaceIds.slice(i, i + 10);
      let spaceEventsQuery = dbAdmin.collection('events')
        .where('spaceId', 'in', batch)
        .where('campusId', '==', campusId)
        .where('state', '==', 'published');

      if (startDate) {
        spaceEventsQuery = spaceEventsQuery.where('startDate', '>=', startDate);
      }
      if (endDate) {
        spaceEventsQuery = spaceEventsQuery.where('endDate', '<=', endDate);
      }

      spaceEventsQuery = spaceEventsQuery.orderBy('startDate', 'asc');
      const spaceEventsSnapshot = await spaceEventsQuery.get();

      const batchEvents = spaceEventsSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || data.name || 'Untitled Event',
          description: data.description || '',
          startDate: data.startDate || data.startTime || new Date().toISOString(),
          endDate: data.endDate || data.endTime || data.startDate || new Date().toISOString(),
          location: data.location || '',
          isAllDay: data.isAllDay || false,
          type: 'space' as const,
          source: data.spaceName || 'Space Event',
          spaceId: data.spaceId,
          spaceName: data.spaceName || '',
          canEdit: false,
          eventType: data.eventType || data.type || 'event',
          organizerName: data.organizerName || data.creatorName || ''
        };
      });

      allEvents.push(...batchEvents);
    }

    // Sort by start date
    allEvents.sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return NextResponse.json({ events: allEvents });
  } catch (error) {
    logger.error(
      `Error fetching calendar events at /api/calendar`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(ApiResponseHelper.error("Failed to fetch calendar events", "INTERNAL_ERROR"), { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}, {
  operation: 'get_calendar_events'
});
