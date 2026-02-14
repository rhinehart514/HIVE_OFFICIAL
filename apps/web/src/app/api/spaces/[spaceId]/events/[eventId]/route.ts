import { z } from 'zod';
import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { SecurityScanner } from '@/lib/secure-input-validation';
import { HttpStatus } from '@/lib/api-response-types';
import { isContentHidden } from '@/lib/content-moderation';
import { getServerSpaceRepository } from '@hive/core/server';
import { withCache } from '../../../../../../lib/cache-headers';
import { enforceSpaceRules } from '@/lib/space-rules-middleware';

const UpdateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  type: z.enum(['academic', 'social', 'recreational', 'cultural', 'meeting', 'virtual']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().optional(),
  virtualLink: z.string().url().optional(),
  maxAttendees: z.number().positive().optional(),
  rsvpDeadline: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  requiredRSVP: z.boolean().optional(),
  cost: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).optional(),
  // CampusLabs imported event metadata (editable by leaders)
  theme: z.string().max(50).optional(),
  benefits: z.array(z.string().max(100)).max(10).optional(),
});

/**
 * Validate space and membership using DDD repository
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
    logger.error('SECURITY: Cross-campus event access blocked', {
      eventId,
      spaceId,
      eventCampusId: eventData.campusId,
      currentCampusId: campusId,
    });
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: 'Access denied' };
  }

  // SECURITY: Don't allow access to hidden/moderated events
  if (isContentHidden(eventData)) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: 'Event not found' };
  }

  return { ok: true as const, eventDoc, eventData };
}

async function serializeEvent(
  spaceId: string,
  eventDoc: DocumentSnapshot<DocumentData>,
  eventData: DocumentData,
  userId: string,
) {
  const organizerDoc = await dbAdmin.collection('users').doc(eventData.organizerId).get();
  const organizer = organizerDoc.exists ? organizerDoc.data() : null;

  const rsvpCollection = dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('events')
    .doc(eventDoc.id)
    .collection('rsvps');

  const rsvpSnapshot = await rsvpCollection.where('status', '==', 'going').get();
  const userRsvpDoc = await rsvpCollection.doc(userId).get();

  return {
    id: eventDoc.id,
    ...eventData,
    organizer: organizer
      ? {
          id: organizerDoc.id,
          fullName: organizer.fullName,
          handle: organizer.handle,
          photoURL: organizer.photoURL,
        }
      : null,
    currentAttendees: rsvpSnapshot.size,
    userRSVP: userRsvpDoc.exists ? userRsvpDoc.data()?.status : null,
    // CampusLabs imported event metadata
    theme: eventData.theme || null,
    benefits: eventData.benefits || [],
    source: eventData.source || 'user-created',
    sourceUrl: eventData.sourceUrl || null,
  };
}

const _GET = withAuthAndErrors(async (
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
      const code = validation.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
      return respond.error(validation.message, code, { status: validation.status });
    }

    const event = await loadEvent(spaceId, eventId, campusId);
    if (!event.ok) {
      const code = event.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
      return respond.error(event.message, code, { status: event.status });
    }

    const serialized = await serializeEvent(spaceId, event.eventDoc, event.eventData, userId);

    return respond.success({ event: serialized });
  } catch (error) {
    logger.error(
      `Error fetching event at /api/spaces/[spaceId]/events/[eventId]`,
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error('Failed to fetch event', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const PATCH = withAuthValidationAndErrors(
  UpdateEventSchema,
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
        const code = validation.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
        return respond.error(validation.message, code, { status: validation.status });
      }

      const load = await loadEvent(spaceId, eventId, campusId);
      if (!load.ok) {
        const code = load.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
        return respond.error(load.message, code, { status: load.status });
      }

      const eventData = load.eventData;
      const canEditAny = await enforceSpaceRules(spaceId, userId, 'events:edit_any');
      if (!canEditAny.allowed) {
        const canEditOwn = await enforceSpaceRules(spaceId, userId, 'events:edit_own');
        if (!canEditOwn.allowed) {
          return respond.error(canEditOwn.reason || 'Insufficient permissions to edit this event', 'FORBIDDEN', {
            status: HttpStatus.FORBIDDEN,
          });
        }
        if (eventData.organizerId !== userId) {
          return respond.error('You can only edit your own events', 'FORBIDDEN', {
            status: HttpStatus.FORBIDDEN,
          });
        }
      }

      // Managing event status/featured flags requires elevated manage permission
      if (body.status !== undefined || body.isFeatured !== undefined) {
        const managePermission = await enforceSpaceRules(spaceId, userId, 'events:manage');
        if (!managePermission.allowed) {
          return respond.error(managePermission.reason || 'Insufficient permissions to manage events', 'FORBIDDEN', {
            status: HttpStatus.FORBIDDEN,
          });
        }
      }

      // SECURITY: Scan event fields for XSS/injection attacks
      const fieldsToScan: Array<{ name: string; value: string }> = [];
      if (body.title) fieldsToScan.push({ name: 'title', value: body.title });
      if (body.description) fieldsToScan.push({ name: 'description', value: body.description });
      if (body.location) fieldsToScan.push({ name: 'location', value: body.location });

      for (const field of fieldsToScan) {
        const scan = SecurityScanner.scanInput(field.value);
        if (scan.level === 'dangerous') {
          logger.warn('XSS attempt blocked in event update', {
            userId,
            spaceId,
            eventId,
            field: field.name,
            threats: scan.threats,
          });
          return respond.error(`Event ${field.name} contains invalid content`, 'INVALID_INPUT', {
            status: HttpStatus.BAD_REQUEST,
          });
        }
      }

      if (body.startDate && body.endDate) {
        const startDate = new Date(body.startDate);
        const endDate = new Date(body.endDate);
        if (endDate <= startDate) {
          return respond.error('End date must be after start date', 'INVALID_INPUT', {
            status: HttpStatus.BAD_REQUEST,
          });
        }
      }

      const updateData: Record<string, unknown> = {
        ...body,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      if (body.startDate) {
        updateData.startDate = new Date(body.startDate);
      }
      if (body.endDate) {
        updateData.endDate = new Date(body.endDate);
      }
      if (body.rsvpDeadline) {
        updateData.rsvpDeadline = new Date(body.rsvpDeadline);
      }

      await load.eventDoc.ref.update(updateData);

      await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('activity')
        .add({
          type: 'event_updated',
          performedBy: userId,
          targetEventId: eventId,
          details: {
            updatedFields: Object.keys(body),
          },
          timestamp: new Date(),
        });

      logger.info(`Event updated: ${eventId} in space ${spaceId} by ${userId}`);

      return respond.success({
        message: 'Event updated successfully',
        eventId,
      });
    } catch (error) {
      logger.error('Error updating event', { error: error instanceof Error ? error.message : String(error) });
      return respond.error('Failed to update event', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export const DELETE = withAuthAndErrors(async (
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
      const code = validation.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
      return respond.error(validation.message, code, { status: validation.status });
    }

    const load = await loadEvent(spaceId, eventId, campusId);
    if (!load.ok) {
      const code = load.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
      return respond.error(load.message, code, { status: load.status });
    }

    const canDeleteAny = await enforceSpaceRules(spaceId, userId, 'events:delete_any');
    if (!canDeleteAny.allowed) {
      const canDeleteOwn = await enforceSpaceRules(spaceId, userId, 'events:delete_own');
      if (!canDeleteOwn.allowed) {
        return respond.error(canDeleteOwn.reason || 'Insufficient permissions to delete this event', 'FORBIDDEN', {
          status: HttpStatus.FORBIDDEN,
        });
      }
      if (load.eventData.organizerId !== userId) {
        return respond.error('You can only delete your own events', 'FORBIDDEN', {
          status: HttpStatus.FORBIDDEN,
        });
      }
    }

    const rsvps = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('events')
      .doc(eventId)
      .collection('rsvps')
      .get();

    const batch = dbAdmin.batch();
    for (const doc of rsvps.docs) {
      batch.delete(doc.ref);
    }
    batch.delete(load.eventDoc.ref);

    await batch.commit();

    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('activity')
      .add({
        type: 'event_deleted',
        performedBy: userId,
        targetEventId: eventId,
        details: {
          eventTitle: load.eventData.title,
          eventType: load.eventData.type,
        },
        timestamp: new Date(),
      });

    logger.info(`Event deleted: ${eventId} from space ${spaceId} by ${userId}`);

    return respond.success({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting event', { error: error instanceof Error ? error.message : String(error) });
    return respond.error('Failed to delete event', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'SHORT');
