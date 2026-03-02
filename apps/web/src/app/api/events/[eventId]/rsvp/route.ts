/**
 * Public Event RSVP — POST /api/events/[eventId]/rsvp
 *
 * Allows authenticated users to RSVP to any event by eventId
 * (without needing spaceId in the URL). For the /e/[eventId] public page.
 */

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { isContentHidden } from '@/lib/content-moderation';

const RSVPSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']),
});

export const POST = withAuthValidationAndErrors(
  RSVPSchema,
  async (
    request,
    { params }: { params: Promise<{ eventId: string }> },
    body,
    respond,
  ) => {
    try {
      const { eventId } = await params;
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);

      // Load event
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

      // Campus isolation
      if (eventData.campusId && eventData.campusId !== campusId) {
        return respond.error('Access denied', 'FORBIDDEN', {
          status: HttpStatus.FORBIDDEN,
        });
      }

      // Check capacity
      if (body.status === 'going' && eventData.maxAttendees) {
        const currentGoing = await dbAdmin
          .collection('rsvps')
          .where('eventId', '==', eventId)
          .where('status', '==', 'going')
          .get();

        if (currentGoing.size >= eventData.maxAttendees) {
          return respond.error('Event is at full capacity', 'INVALID_INPUT', {
            status: HttpStatus.BAD_REQUEST,
          });
        }
      }

      // Upsert RSVP with composite key
      const rsvpId = `${eventId}_${userId}`;
      const rsvpRef = dbAdmin.collection('rsvps').doc(rsvpId);
      const existing = await rsvpRef.get();
      const timestamp = new Date();

      const rsvpData = {
        userId,
        eventId,
        spaceId: eventData.spaceId ?? null,
        status: body.status,
        campusId,
        updatedAt: timestamp,
        ...(existing.exists ? {} : { createdAt: timestamp }),
      };

      await rsvpRef.set(rsvpData, { merge: true });

      // Get updated count
      const updatedCount = await dbAdmin
        .collection('rsvps')
        .where('eventId', '==', eventId)
        .where('status', '==', 'going')
        .get();

      return respond.success({
        rsvp: rsvpData,
        currentAttendees: updatedCount.size,
      });
    } catch (error) {
      logger.error('Error creating RSVP at /api/events/[eventId]/rsvp', {
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error('Failed to RSVP', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);
