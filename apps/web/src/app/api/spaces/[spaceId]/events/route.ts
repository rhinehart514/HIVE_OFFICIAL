"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { logger } from "@/lib/structured-logger";
import { HttpStatus } from "@/lib/api-response-types";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { SecurityScanner } from "@/lib/secure-input-validation";
// Ghost Mode for privacy filtering
import { GhostModeService, type GhostModeUser } from '@hive/core/domain/profile/services/ghost-mode.service';
import { ViewerContext } from '@hive/core/domain/shared/value-objects/viewer-context.value';
// Event-board auto-linking
import { autoLinkEventToBoard, findEventBoard } from "@/lib/event-board-auto-link";
import { isContentHidden } from "@/lib/content-moderation";
import { notifySpaceEventCreated } from "@/lib/notification-service";

const GetEventsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  type: z
    .enum(["academic", "social", "recreational", "cultural", "meeting", "virtual"])
    .optional(),
  upcoming: z.coerce.boolean().default(true),
});

const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  type: z.enum(["academic", "social", "recreational", "cultural", "meeting", "virtual"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().optional(),
  virtualLink: z.string().url().optional(),
  maxAttendees: z.number().positive().optional(),
  rsvpDeadline: z.string().datetime().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  requiredRSVP: z.boolean().default(false),
  cost: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
});

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  try {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // Check read access using centralized permission middleware
    const permCheck = await checkSpacePermission(spaceId, userId, 'guest');
    if (!permCheck.hasPermission) {
      const code = permCheck.code === 'NOT_FOUND' ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      return respond.error(permCheck.error ?? "Permission denied", code, { status });
    }

    const { space, membership } = permCheck;

    // For private spaces, require member access
    if (!space?.isPublic && !membership) {
      return respond.error(
        "You must be a member to view events in this private space",
        "FORBIDDEN",
        { status: HttpStatus.FORBIDDEN }
      );
    }

    const queryParams = GetEventsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    // Use flat /events collection with spaceId filter (for cross-space calendar queries)
    // First, try with campusId for performance. If empty, fall back to spaceId-only query
    // to handle imported/legacy events that may have different campusId values.
    let query: FirebaseFirestore.Query = dbAdmin
      .collection("events")
      .where("spaceId", "==", spaceId)
      .where("campusId", "==", campusId);

    const now = new Date();
    if (queryParams.upcoming) {
      query = query.where("startDate", ">=", now).orderBy("startDate", "asc");
    } else {
      query = query.where("startDate", "<", now).orderBy("startDate", "desc");
    }

    if (queryParams.type) {
      query = query.where("type", "==", queryParams.type);
    }

    query = query.offset(queryParams.offset).limit(queryParams.limit);

    let eventsSnapshot = await query.get();

    // Fallback: If no events found, try without campusId filter for imported/legacy events
    // CampusLabs imported events may have different or missing campusId
    if (eventsSnapshot.empty) {
      logger.info('No events found with campusId, trying fallback query', { spaceId, campusId });
      let fallbackQuery: FirebaseFirestore.Query = dbAdmin
        .collection("events")
        .where("spaceId", "==", spaceId);

      if (queryParams.upcoming) {
        fallbackQuery = fallbackQuery.where("startDate", ">=", now).orderBy("startDate", "asc");
      } else {
        fallbackQuery = fallbackQuery.where("startDate", "<", now).orderBy("startDate", "desc");
      }

      if (queryParams.type) {
        fallbackQuery = fallbackQuery.where("type", "==", queryParams.type);
      }

      fallbackQuery = fallbackQuery.offset(queryParams.offset).limit(queryParams.limit);
      eventsSnapshot = await fallbackQuery.get();
    }

    // Early return if no events - avoid unnecessary processing
    if (eventsSnapshot.empty) {
      return respond.success({
        events: [],
        hasMore: false,
        pagination: {
          limit: queryParams.limit,
          offset: queryParams.offset,
          nextOffset: null,
        },
      });
    }

    // COST OPTIMIZATION: Collect all unique IDs for batch fetching
    const organizerIds = new Set<string>();
    const eventIds: string[] = [];
    const validDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

    for (const doc of eventsSnapshot.docs) {
      const eventData = doc.data();
      // SECURITY: Skip events from other campuses
      if (eventData.campusId && eventData.campusId !== campusId) {
        continue;
      }
      // SECURITY: Skip hidden/moderated/removed content
      if (isContentHidden(eventData)) {
        continue;
      }
      validDocs.push(doc);
      eventIds.push(doc.id);
      if (eventData.organizerId) {
        organizerIds.add(eventData.organizerId);
      }
    }

    // COST OPTIMIZATION: Batch fetch all organizers in ONE query (N+1 → 1)
    const organizerMap = new Map<string, { id: string; data: Record<string, unknown> } | null>();
    if (organizerIds.size > 0) {
      const organizerRefs = Array.from(organizerIds).map(id => dbAdmin.collection("users").doc(id));
      const organizerDocs = await dbAdmin.getAll(...organizerRefs);
      for (const doc of organizerDocs) {
        if (doc.exists) {
          organizerMap.set(doc.id, { id: doc.id, data: doc.data() as Record<string, unknown> });
        } else {
          organizerMap.set(doc.id, null);
        }
      }
    }

    // COST OPTIMIZATION: Batch fetch user's RSVPs for all events (N+1 → 1)
    // Note: Firestore 'in' queries support up to 30 values
    const userRsvpMap = new Map<string, string>();
    if (eventIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < eventIds.length; i += 30) {
        chunks.push(eventIds.slice(i, i + 30));
      }
      for (const chunk of chunks) {
        const userRsvps = await dbAdmin
          .collection("rsvps")
          .where("eventId", "in", chunk)
          .where("userId", "==", userId)
          .get();
        for (const rsvpDoc of userRsvps.docs) {
          userRsvpMap.set(rsvpDoc.data().eventId, rsvpDoc.data().status);
        }
      }
    }

    // COST OPTIMIZATION: Batch fetch RSVP counts using aggregation or cached counts
    // For now, use the event's cached attendeeCount if available, otherwise skip live count
    // This avoids N queries for RSVP counts

    // COST OPTIMIZATION: Batch fetch linked boards (N+1 → 1)
    const linkedBoardMap = new Map<string, { boardId: string; boardName: string } | null>();
    if (eventIds.length > 0) {
      const boardsSnapshot = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("boards")
        .where("linkedEventId", "in", eventIds.slice(0, 30)) // Firestore 'in' limit
        .get();
      for (const boardDoc of boardsSnapshot.docs) {
        const boardData = boardDoc.data();
        linkedBoardMap.set(boardData.linkedEventId, {
          boardId: boardDoc.id,
          boardName: boardData.name,
        });
      }
    }

    // GHOST MODE: Build viewer context for privacy checks
    const viewerContext = ViewerContext.authenticated({
      userId,
      campusId,
      memberOfSpaceIds: [spaceId]
    });

    const events: Array<Record<string, unknown>> = [];

    for (const doc of validDocs) {
      const eventData = doc.data();
      const organizerEntry = eventData.organizerId ? organizerMap.get(eventData.organizerId) : null;
      const organizer = organizerEntry?.data || null;

      // GHOST MODE: Check if organizer's activity should be hidden
      let shouldHideOrganizer = false;
      if (organizer && organizerEntry) {
        const organizerGhostUser: GhostModeUser = {
          id: organizerEntry.id,
          ghostMode: organizer.ghostMode as GhostModeUser['ghostMode'],
          visibility: organizer.visibility as GhostModeUser['visibility']
        };
        shouldHideOrganizer = GhostModeService.shouldHideActivity(
          organizerGhostUser,
          viewerContext,
          [spaceId]
        );
      }

      events.push({
        id: doc.id,
        ...eventData,
        organizer: shouldHideOrganizer
          ? null
          : organizer
            ? {
                id: organizerEntry?.id,
                fullName: organizer.fullName,
                handle: organizer.handle,
                photoURL: organizer.photoURL,
              }
            : null,
        // Use cached count from event data, or 0 if not available (avoids N+1 RSVP queries)
        currentAttendees: eventData.attendeeCount || eventData.rsvpCount || 0,
        userRSVP: userRsvpMap.get(doc.id) || null,
        linkedBoard: linkedBoardMap.get(doc.id) || undefined,
      });
    }

    return respond.success({
      events,
      hasMore: eventsSnapshot.size === queryParams.limit,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        nextOffset:
          eventsSnapshot.size === queryParams.limit
            ? queryParams.offset + queryParams.limit
            : null,
      },
    });
  } catch (error) {
    logger.error(
      "Error fetching events at /api/spaces/[spaceId]/events",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error("Failed to fetch events", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const POST = withAuthValidationAndErrors(
  CreateEventSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    try {
      const { spaceId } = await params;
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);

      // Require leader permission to create events
      const permCheck = await checkSpacePermission(spaceId, userId, 'admin');
      if (!permCheck.hasPermission) {
        const code = permCheck.code === 'NOT_FOUND' ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
        const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
        return respond.error(permCheck.error ?? "Permission denied", code, { status });
      }

      // SECURITY: Scan event fields for XSS/injection attacks
      const fieldsToScan = [
        { name: 'title', value: body.title },
        { name: 'description', value: body.description },
        ...(body.location ? [{ name: 'location', value: body.location }] : []),
      ];

      // SecurityScanner.scanInput returns { level, threats, sanitized } - check level for dangerous content
      for (const field of fieldsToScan) {
        const scan = SecurityScanner.scanInput(field.value);
        if (scan.level === 'dangerous') {
          logger.warn("XSS attempt blocked in event creation", {
            userId,
            spaceId,
            field: field.name,
            threats: scan.threats,
          });
          return respond.error(`Event ${field.name} contains invalid content`, "INVALID_INPUT", {
            status: HttpStatus.BAD_REQUEST,
          });
        }
      }

      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      if (startDate >= endDate) {
        return respond.error("End date must be after start date", "INVALID_INPUT", {
          status: HttpStatus.BAD_REQUEST,
        });
      }

      const eventData = {
        ...body,
        spaceId: spaceId,  // Required for flat collection queries
        startDate,
        endDate,
        organizerId: userId,
        campusId: campusId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "scheduled",
        isHidden: false,
      };

      // Use flat /events collection for cross-space calendar queries
      const eventRef = await dbAdmin
        .collection("events")
        .add(eventData);

      // Auto-link: Create a chat board for this event
      const boardResult = await autoLinkEventToBoard({
        eventId: eventRef.id,
        eventTitle: body.title,
        spaceId: spaceId,
        userId: userId,
        campusId: campusId,
      });

      if (!boardResult.success) {
        // Log but don't fail the event creation
        logger.warn("Failed to auto-link event board", {
          eventId: eventRef.id,
          spaceId,
          error: boardResult.error,
        });
      } else {
        logger.info("Event board auto-linked successfully", {
          eventId: eventRef.id,
          boardId: boardResult.boardId,
          spaceId,
        });
      }

      // Notify space members about the new event (async, non-blocking)
      const spaceName = permCheck.space?.name || 'a space';
      (async () => {
        try {
          // Get creator name for notification
          const creatorDoc = await dbAdmin.collection('users').doc(userId).get();
          const creatorName = creatorDoc.exists
            ? (creatorDoc.data()?.fullName as string) || 'Someone'
            : 'Someone';

          // Get active space members, limited to 100
          const membersSnapshot = await dbAdmin.collection('spaceMembers')
            .where('spaceId', '==', spaceId)
            .where('campusId', '==', campusId)
            .where('isActive', '==', true)
            .limit(100)
            .get();

          const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);

          if (memberIds.length > 0) {
            await notifySpaceEventCreated({
              memberIds,
              creatorId: userId,
              creatorName,
              eventId: eventRef.id,
              eventTitle: body.title,
              spaceId,
              spaceName,
            });
          }
        } catch (notifyError) {
          logger.warn('Failed to send event creation notifications', {
            error: notifyError instanceof Error ? notifyError.message : String(notifyError),
            eventId: eventRef.id,
            spaceId,
          });
        }
      })();

      return respond.created({
        event: {
          id: eventRef.id,
          ...eventData,
          // Include linked board info if created
          linkedBoard: boardResult.success
            ? { id: boardResult.boardId, name: boardResult.boardName }
            : undefined,
        },
      });
    } catch (error) {
      logger.error(
        "Error creating event at /api/spaces/[spaceId]/events",
        { error: error instanceof Error ? error.message : String(error) },
      );
      return respond.error("Failed to create event", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);
