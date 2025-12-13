import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { notifyEventRsvp } from '@/lib/notification-service';
import { getServerSpaceRepository } from '@hive/core/server';

const RSVPSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']),
});

/**
 * Validate space using DDD repository and check membership
 */
async function validateSpaceAndMembership(spaceId: string, userId: string, campusId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: 'Space not found' };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: 'Access denied' };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    if (!space.isPublic) {
      return { ok: false as const, status: HttpStatus.FORBIDDEN, message: 'Membership required' };
    }
    return { ok: true as const, space, membership: { role: 'guest' } };
  }

  return { ok: true as const, space, membership: membershipSnapshot.docs[0].data() };
}

async function loadEvent(spaceId: string, eventId: string, campusId: string) {
  const eventDoc = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('events')
    .doc(eventId)
    .get();

  if (!eventDoc.exists) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: 'Event not found' };
  }

  const eventData = eventDoc.data();
  if (!eventData) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: 'Event data missing' };
  }

  if (eventData.campusId && eventData.campusId !== campusId) {
    logger.error('SECURITY: Cross-campus event RSVP attempt blocked', {
      eventId,
      spaceId,
      eventCampusId: eventData.campusId,
      currentCampusId: campusId,
    });
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: 'Access denied' };
  }

  return { ok: true as const, eventDoc, eventData };
}

export const POST = withAuthValidationAndErrors(
  RSVPSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; eventId: string }> },
    body,
    respond,
  ) => {
    try {
      const { spaceId, eventId } = await params;
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);

      const validation = await validateSpaceAndMembership(spaceId, userId, campusId);
      if (!validation.ok) {
        const code =
          validation.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
        return respond.error(validation.message, code, { status: validation.status });
      }

      const load = await loadEvent(spaceId, eventId, campusId);
      if (!load.ok) {
        const code = load.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
        return respond.error(load.message, code, { status: load.status });
      }

      if (load.eventData.rsvpDeadline) {
        const deadline =
          load.eventData.rsvpDeadline instanceof Date
            ? load.eventData.rsvpDeadline
            : load.eventData.rsvpDeadline.toDate?.() ?? new Date(load.eventData.rsvpDeadline);
        if (deadline && new Date() > deadline) {
          return respond.error('RSVP deadline has passed', 'INVALID_INPUT', {
            status: HttpStatus.BAD_REQUEST,
          });
        }
      }

      if (body.status === 'going' && load.eventData.maxAttendees) {
        const currentGoing = await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('events')
          .doc(eventId)
          .collection('rsvps')
          .where('status', '==', 'going')
          .get();

        if (currentGoing.size >= load.eventData.maxAttendees) {
          return respond.error('Event is at full capacity', 'INVALID_INPUT', {
            status: HttpStatus.BAD_REQUEST,
          });
        }
      }

      const rsvpRef = dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('events')
        .doc(eventId)
        .collection('rsvps')
        .doc(userId);

      const existing = await rsvpRef.get();
      const timestamp = new Date();
      const rsvpData = {
        userId,
        eventId,
        spaceId,
        status: body.status,
        campusId,
        updatedAt: timestamp,
        ...(existing.exists ? {} : { createdAt: timestamp }),
      };

      await rsvpRef.set(rsvpData, { merge: true });

      const updatedCount = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('events')
        .doc(eventId)
        .collection('rsvps')
        .where('status', '==', 'going')
        .get();

      // Notify event organizer about RSVP (only for 'going' or 'maybe')
      if (body.status !== 'not_going' && load.eventData.organizerId) {
        try {
          // Get user's name for notification
          const userDoc = await dbAdmin.collection('users').doc(userId).get();
          const userName = userDoc.data()?.fullName || 'Someone';

          await notifyEventRsvp({
            organizerId: load.eventData.organizerId,
            attendeeId: userId,
            attendeeName: userName,
            eventId,
            eventTitle: load.eventData.title || 'an event',
            spaceId,
            rsvpStatus: body.status === 'going' ? 'going' : 'interested',
          });
        } catch (notifyError) {
          // Don't fail the RSVP if notification fails
          logger.warn('Failed to send RSVP notification', {
            error: notifyError instanceof Error ? notifyError.message : String(notifyError),
            eventId,
            spaceId,
          });
        }
      }

      return respond.success({
        rsvp: rsvpData,
        currentAttendees: updatedCount.size,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respond.error('Invalid RSVP data', 'VALIDATION_ERROR', {
          status: HttpStatus.BAD_REQUEST,
          details: error.errors,
        });
      }

      logger.error(
        `Error creating RSVP at /api/spaces/[spaceId]/events/[eventId]/rsvp`,
        { error: error instanceof Error ? error.message : String(error) },
      );
      return respond.error('Failed to RSVP to event', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; eventId: string }> },
  respond,
) => {
  try {
    const { spaceId, eventId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    const validation = await validateSpaceAndMembership(spaceId, userId, campusId);
    if (!validation.ok) {
      const code =
        validation.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
      return respond.error(validation.message, code, { status: validation.status });
    }

    const load = await loadEvent(spaceId, eventId, campusId);
    if (!load.ok) {
      const code = load.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
      return respond.error(load.message, code, { status: load.status });
    }

    const rsvpDoc = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('events')
      .doc(eventId)
      .collection('rsvps')
      .doc(userId)
      .get();

    const rsvpStatus = rsvpDoc.exists ? rsvpDoc.data()?.status : null;

    return respond.success({ userRSVP: rsvpStatus });
  } catch (error) {
    logger.error(
      `Error fetching RSVP status at /api/spaces/[spaceId]/events/[eventId]/rsvp`,
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error('Failed to fetch RSVP status', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
