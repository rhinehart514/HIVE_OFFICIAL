import { type NextRequest as _NextRequest, NextResponse } from 'next/server';
import { headers as _headers } from 'next/headers';
import { dbAdmin } from '@/lib/firebase-admin';
import { getCurrentUser as _getCurrentUser } from '@/lib/server-auth';
import { logger } from "@/lib/logger";
import { ApiResponseHelper, HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";
import { withAuth, ApiResponse as _ApiResponse, type AuthContext } from '@/lib/api-auth-middleware';
import type { QueryDocumentSnapshot, QuerySnapshot } from 'firebase-admin/firestore';

// Personal event type for calendar tool
interface PersonalEvent {
  id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isAllDay?: boolean;
  reminderMinutes?: number;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Combined event type for calendar display
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isAllDay?: boolean;
  type: 'personal' | 'space';
  source?: string;
  spaceId?: string;
  spaceName?: string;
  canEdit: boolean;
  eventType?: string;
  organizerName?: string;
}

// Fetch user's calendar events from Firebase
async function fetchUserCalendarEvents(userId: string, campusId: string): Promise<CalendarEvent[]> {
  try {
    // Get user's personal events from flat /personalEvents collection
    const personalEventsSnapshot = await dbAdmin
      .collection('personalEvents')
      .where('userId', '==', userId)
      .orderBy('startDate', 'asc')
      .get();

    // Get user's space events from spaces they're a member of
    const membershipSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .get();

    const spaceIds = membershipSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data().spaceId);

    let spaceEvents: Array<Record<string, unknown>> = [];
    if (spaceIds.length > 0) {
      // Batch query for space events from flat /events collection (Firestore has a limit of 10 for 'in' queries)
      const eventQueries = [];
      for (let i = 0; i < spaceIds.length; i += 10) {
        const batch = spaceIds.slice(i, i + 10);
        eventQueries.push(
          dbAdmin
            .collection('events')
            .where('spaceId', 'in', batch)
            .where('campusId', '==', campusId)
            .where('state', '==', 'published')
            .get()
        );
      }

      const spaceEventSnapshots = await Promise.all(eventQueries);
      spaceEvents = spaceEventSnapshots.flatMap((snapshot: QuerySnapshot) =>
        snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }))
      );
    }

    // Combine and format events
    const allEvents: CalendarEvent[] = [
      ...personalEventsSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Event',
          description: data.description || '',
          startDate: data.startDate || new Date().toISOString(),
          endDate: data.endDate || data.startDate || new Date().toISOString(),
          location: data.location,
          isAllDay: data.isAllDay || false,
          type: 'personal' as const,
          canEdit: true,
          eventType: data.eventType || 'event'
        };
      }),
      ...spaceEvents.map(data => ({
        id: data.id as string,
        title: (data.title as string) || (data.name as string) || 'Untitled Event',
        description: (data.description as string) || '',
        startDate: (data.startDate as string) || (data.startTime as string) || new Date().toISOString(),
        endDate: (data.endDate as string) || (data.endTime as string) || (data.startDate as string) || new Date().toISOString(),
        location: (data.location as string) || '',
        isAllDay: (data.isAllDay as boolean) || false,
        type: 'space' as const,
        source: (data.spaceName as string) || 'Space Event',
        spaceId: data.spaceId as string,
        spaceName: (data.spaceName as string) || '',
        canEdit: false,
        eventType: (data.eventType as string) || (data.type as string) || 'event',
        organizerName: (data.organizerName as string) || (data.creatorName as string) || ''
      }))
    ];

    return allEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch (error) {
    logger.error('Failed to fetch calendar events', { component: 'calendar-api' }, error instanceof Error ? error : undefined);
    return [];
  }
}

// GET - Fetch calendar events (personal + space events)
export const GET = withAuth(async (request, authContext: AuthContext) => {
  try {
    const userId = authContext.userId;
    const campusId = authContext.campusId;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeSpaceEvents = searchParams.get('includeSpaceEvents') !== 'false';

    // Fetch personal events
    let personalEventsQuery = dbAdmin.collection('personalEvents')
      .where('userId', '==', userId);
    
    if (startDate) {
      personalEventsQuery = personalEventsQuery.where('startDate', '>=', startDate);
    }
    if (endDate) {
      personalEventsQuery = personalEventsQuery.where('endDate', '<=', endDate);
    }
    
    personalEventsQuery = personalEventsQuery.orderBy('startDate', 'asc');
    const personalEventsSnapshot = await personalEventsQuery.get();
    const personalEvents: CalendarEvent[] = personalEventsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
      type: 'personal' as const,
      canEdit: true
    })) as CalendarEvent[];

    let spaceEvents: CalendarEvent[] = [];

    if (includeSpaceEvents) {
      // Fetch user's space memberships
      const membershipsSnapshot = await dbAdmin.collection('spaceMembers')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .where('campusId', '==', campusId)
        .get();
      const userSpaceIds = membershipsSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data().spaceId);

      if (userSpaceIds.length > 0) {
        // Fetch space events from user's spaces
        let spaceEventsQuery = dbAdmin.collection('events')
          .where('spaceId', 'in', userSpaceIds)
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
        spaceEvents = spaceEventsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
          type: 'space' as const,
          canEdit: false
        })) as CalendarEvent[];
      }
    }

    // Combine and sort events
    const allEvents = [...personalEvents, ...spaceEvents].sort((a, b) => 
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

// POST - Create personal event
export const POST = withAuth(async (request, authContext: AuthContext) => {
  try {
    const userId = authContext.userId;

    const body = await request.json();
    const { title, description, startDate, endDate, location, isAllDay, reminderMinutes } = body;

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return NextResponse.json(ApiResponseHelper.error("Missing required fields", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(ApiResponseHelper.error("End date must be after start date", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    const personalEvent: PersonalEvent = {
      title,
      description: description || '',
      startDate,
      endDate,
      location: location || '',
      isAllDay: isAllDay || false,
      reminderMinutes: reminderMinutes || 0,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await dbAdmin.collection('personalEvents').add(personalEvent);
    const createdEvent = {
      id: docRef.id,
      ...personalEvent,
      type: 'personal' as const,
      canEdit: true
    };

    return NextResponse.json({ event: createdEvent }, { status: HttpStatus.CREATED });
  } catch (error) {
    logger.error(
      `Error creating personal event at /api/calendar`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(ApiResponseHelper.error("Failed to create personal event", "INTERNAL_ERROR"), { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}, {
  operation: 'create_calendar_event'
});
