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
import { withCache } from '../../../lib/cache-headers';

// 15-minute buffer for close proximity detection
const CLOSE_BUFFER_MS = 15 * 60 * 1000;

/**
 * Detect conflicts between events
 * - overlap: Events whose time ranges overlap
 * - adjacent: Events that end/start at the exact same time
 * - close: Events within 15 minutes of each other
 */
function detectConflicts(events: CalendarEvent[]): CalendarEvent[] {
  const conflictMap = new Map<string, { ids: string[]; severity: 'overlap' | 'adjacent' | 'close' }>();

  for (let i = 0; i < events.length; i++) {
    const eventA = events[i];
    const aStart = new Date(eventA.startDate).getTime();
    const aEnd = new Date(eventA.endDate).getTime();

    for (let j = i + 1; j < events.length; j++) {
      const eventB = events[j];
      const bStart = new Date(eventB.startDate).getTime();
      const bEnd = new Date(eventB.endDate).getTime();

      let severity: 'overlap' | 'adjacent' | 'close' | null = null;

      // Check for overlap (A starts before B ends AND A ends after B starts)
      if (aStart < bEnd && aEnd > bStart) {
        severity = 'overlap';
      }
      // Check for adjacent (A ends exactly when B starts or vice versa)
      else if (aEnd === bStart || bEnd === aStart) {
        severity = 'adjacent';
      }
      // Check for close proximity (within 15 minutes)
      else if (
        (aEnd + CLOSE_BUFFER_MS >= bStart && aEnd <= bStart) ||
        (bEnd + CLOSE_BUFFER_MS >= aStart && bEnd <= aStart)
      ) {
        severity = 'close';
      }

      if (severity) {
        // Record conflict for event A
        const existingA = conflictMap.get(eventA.id);
        if (existingA) {
          existingA.ids.push(eventB.id);
          // Upgrade severity if needed (overlap > adjacent > close)
          if (severity === 'overlap' || (severity === 'adjacent' && existingA.severity === 'close')) {
            existingA.severity = severity;
          }
        } else {
          conflictMap.set(eventA.id, { ids: [eventB.id], severity });
        }

        // Record conflict for event B
        const existingB = conflictMap.get(eventB.id);
        if (existingB) {
          existingB.ids.push(eventA.id);
          if (severity === 'overlap' || (severity === 'adjacent' && existingB.severity === 'close')) {
            existingB.severity = severity;
          }
        } else {
          conflictMap.set(eventB.id, { ids: [eventA.id], severity });
        }
      }
    }
  }

  // Apply conflict data to events
  return events.map(event => {
    const conflict = conflictMap.get(event.id);
    if (conflict) {
      return {
        ...event,
        isConflict: true,
        conflictsWith: conflict.ids,
        conflictSeverity: conflict.severity,
      };
    }
    return event;
  });
}

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
  // Conflict detection fields
  isConflict?: boolean;
  conflictsWith?: string[];
  conflictSeverity?: 'overlap' | 'adjacent' | 'close';
}

// GET - Fetch calendar events (space events only)
const _GET = withAuth(async (request, authContext: AuthContext) => {
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

    // Detect conflicts between events
    const eventsWithConflicts = detectConflicts(allEvents);

    return NextResponse.json({ events: eventsWithConflicts });
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

export const GET = withCache(_GET, 'PRIVATE');
