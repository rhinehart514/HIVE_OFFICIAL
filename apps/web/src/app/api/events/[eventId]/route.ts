/**
 * Public Event API — GET /api/events/[eventId]
 *
 * Returns a single event by ID. Supports optional auth:
 * - Unauthenticated: returns event data without user RSVP status
 * - Authenticated: includes user's RSVP status and friends attending
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withOptionalAuth,
  getUser,
  ResponseFormatter,
} from '@/lib/middleware';
import type { NextRequest } from 'next/server';
import { HttpStatus } from '@/lib/api-response-types';
import { isContentHidden } from '@/lib/content-moderation';
import { getEventStartDate, getEventEndDate, toEventIso } from '@/lib/events/event-time';
import { withCache } from '../../../../lib/cache-headers';

const RSVP_COLLECTIONS = ['rsvps', 'eventRsvps'] as const;

const _GET = withOptionalAuth(async (
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
  respond: typeof ResponseFormatter,
) => {
  try {
    const { eventId } = await params;
    const user = getUser(request as NextRequest);
    const userId = user?.uid ?? null;

    // Fetch event
    const eventDoc = await dbAdmin.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return respond.error('Event not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const eventData = eventDoc.data()!;

    if (isContentHidden(eventData)) {
      return respond.error('Event not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    // Skip private events for unauthenticated users
    if (eventData.isPrivate && !userId) {
      return respond.error('Event not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const eventStart = getEventStartDate(eventData);
    const eventEnd = getEventEndDate(eventData);

    // Fetch space info
    const spaceId = typeof eventData.spaceId === 'string' ? eventData.spaceId : null;
    let space: { id: string; name: string; handle?: string; avatarUrl?: string } | null = null;
    if (spaceId) {
      const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
      if (spaceDoc.exists) {
        const sd = spaceDoc.data()!;
        space = {
          id: spaceId,
          name: (sd.name as string) ?? 'Community',
          handle: (sd.handle as string) ?? (sd.slug as string) ?? undefined,
          avatarUrl: (sd.avatarUrl as string) ?? (sd.bannerUrl as string) ?? undefined,
        };
      }
    }

    // Fetch organizer info
    let organizer: { id: string; name: string; handle?: string; photoURL?: string } | null = null;
    if (typeof eventData.organizerId === 'string') {
      const organizerDoc = await dbAdmin.collection('users').doc(eventData.organizerId).get();
      if (organizerDoc.exists) {
        const od = organizerDoc.data()!;
        organizer = {
          id: eventData.organizerId,
          name: (od.fullName as string) ?? (od.displayName as string) ?? 'Organizer',
          handle: (od.handle as string) ?? undefined,
          photoURL: (od.photoURL as string) ?? undefined,
        };
      }
    }

    // Fetch RSVP counts + attendee list
    let goingCount = 0;
    let maybeCount = 0;
    const attendees: Array<{ userId: string; status: string; name?: string; photoURL?: string }> = [];
    let userRsvpStatus: string | null = null;

    // Collect RSVPs from both collections
    for (const collectionName of RSVP_COLLECTIONS) {
      try {
        const rsvpSnap = await dbAdmin
          .collection(collectionName)
          .where('eventId', '==', eventId)
          .get();

        for (const doc of rsvpSnap.docs) {
          const rsvp = doc.data();
          const status = typeof rsvp.status === 'string' ? rsvp.status : null;
          const rsvpUserId = typeof rsvp.userId === 'string' ? rsvp.userId : null;
          if (!status || !rsvpUserId) continue;

          if (status === 'going') goingCount++;
          if (status === 'maybe') maybeCount++;

          if (status === 'going' || status === 'maybe') {
            attendees.push({
              userId: rsvpUserId,
              status,
            });
          }

          if (rsvpUserId === userId) {
            userRsvpStatus = status;
          }
        }
      } catch {
        // Non-critical; skip collection
      }
    }

    // Fetch attendee names/photos (limit to 20 for display)
    const attendeeIds = attendees.slice(0, 20).map(a => a.userId);
    if (attendeeIds.length > 0) {
      const refs = attendeeIds.map(id => dbAdmin.collection('users').doc(id));
      const userDocs = await dbAdmin.getAll(...refs);
      for (const doc of userDocs) {
        if (!doc.exists) continue;
        const ud = doc.data()!;
        const attendee = attendees.find(a => a.userId === doc.id);
        if (attendee) {
          attendee.name = (ud.fullName as string) ?? (ud.displayName as string) ?? undefined;
          attendee.photoURL = (ud.photoURL as string) ?? undefined;
        }
      }
    }

    // Fetch related events from same space (up to 4)
    let relatedEvents: Array<Record<string, unknown>> = [];
    if (spaceId) {
      try {
        const now = new Date();
        const relatedSnap = await dbAdmin
          .collection('events')
          .where('spaceId', '==', spaceId)
          .where('startDate', '>=', now.toISOString())
          .orderBy('startDate', 'asc')
          .limit(5)
          .get();

        relatedEvents = relatedSnap.docs
          .filter(doc => doc.id !== eventId && !isContentHidden(doc.data()))
          .slice(0, 4)
          .map(doc => {
            const d = doc.data();
            const rStart = getEventStartDate(d);
            return {
              id: doc.id,
              title: d.title,
              startDate: rStart?.toISOString() ?? null,
              location: d.locationName ?? d.location ?? null,
              rsvpCount: d.attendeeCount ?? d.rsvpCount ?? 0,
            };
          });
      } catch {
        // Non-critical
      }
    }

    // Friends attending (only for authenticated users)
    let friendsAttending: Array<{ userId: string; name: string; photoURL?: string }> = [];
    if (userId) {
      try {
        // Canonical connection schema: profileId1/profileId2 + isActive
        const [connAsId1, connAsId2] = await Promise.all([
          dbAdmin.collection('connections')
            .where('profileId1', '==', userId)
            .where('isActive', '==', true)
            .limit(100)
            .get()
            .catch(() => ({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] })),
          dbAdmin.collection('connections')
            .where('profileId2', '==', userId)
            .where('isActive', '==', true)
            .limit(100)
            .get()
            .catch(() => ({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] })),
        ]);

        const friendIds = new Set<string>();
        for (const doc of connAsId1.docs) { const d = doc.data(); if (d.profileId2) friendIds.add(d.profileId2 as string); }
        for (const doc of connAsId2.docs) { const d = doc.data(); if (d.profileId1) friendIds.add(d.profileId1 as string); }

        const goingAttendeeIds = new Set(
          attendees.filter(a => a.status === 'going').map(a => a.userId)
        );

        const friendsGoing = [...friendIds].filter(id => goingAttendeeIds.has(id));
        friendsAttending = friendsGoing.slice(0, 5).map(id => {
          const attendee = attendees.find(a => a.userId === id);
          return {
            userId: id,
            name: attendee?.name ?? 'Friend',
            photoURL: attendee?.photoURL,
          };
        });
      } catch {
        // Non-critical
      }
    }

    const location = (eventData.locationName ?? eventData.location ?? null) as string | null;

    return respond.success({
      event: {
        id: eventDoc.id,
        title: eventData.title ?? 'Untitled Event',
        description: eventData.description ?? null,
        startDate: eventStart?.toISOString() ?? null,
        endDate: eventEnd?.toISOString() ?? null,
        location,
        locationType: eventData.locationType ?? (eventData.virtualLink ? 'virtual' : 'physical'),
        virtualLink: eventData.virtualLink ?? null,
        type: eventData.type ?? eventData.eventType ?? 'social',
        imageUrl: eventData.imageUrl ?? eventData.coverImageUrl ?? null,
        maxAttendees: eventData.maxAttendees ?? null,
        tags: Array.isArray(eventData.tags) ? eventData.tags : [],
        createdAt: toEventIso(eventData.createdAt),
        space,
        organizer,
        rsvp: {
          goingCount,
          maybeCount,
          userStatus: userRsvpStatus,
        },
        attendees: attendees.slice(0, 20).map(a => ({
          userId: a.userId,
          name: a.name ?? null,
          photoURL: a.photoURL ?? null,
          status: a.status,
        })),
        friendsAttending,
        relatedEvents,
      },
    });
  } catch (error) {
    logger.error('Error fetching event by ID', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch event', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'SHORT');
