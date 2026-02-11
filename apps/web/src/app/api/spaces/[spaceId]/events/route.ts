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
import { getEventStartDate, toEventDate } from "@/lib/events/event-time";
// Ghost Mode for privacy filtering
import { GhostModeService, type GhostModeUser } from '@hive/core/domain/profile/services/ghost-mode.service';
import { ViewerContext } from '@hive/core/domain/shared/value-objects/viewer-context.value';
// Event-board auto-linking
import { autoLinkEventToBoard } from "@/lib/event-board-auto-link";
import { isContentHidden } from "@/lib/content-moderation";
import { notifySpaceEventCreated } from "@/lib/notification-service";
import { withCache } from '../../../../../lib/cache-headers';

const GetEventsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  type: z
    .enum(["academic", "social", "recreational", "cultural", "meeting", "virtual"])
    .optional(),
  upcoming: z.coerce.boolean().default(true),
});

type GetEventsQuery = z.infer<typeof GetEventsSchema>;
type TimeField = "startDate" | "startAt";

const TIME_FIELDS: TimeField[] = ["startDate", "startAt"];
const MAX_FETCH_WINDOW = 300;

function matchesUpcomingFilter(eventStart: Date, now: Date, upcoming: boolean) {
  return upcoming ? eventStart >= now : eventStart < now;
}

async function fetchSpaceEventDocsForTimeField({
  spaceId,
  campusId,
  queryParams,
  now,
  dateField,
  fetchWindow,
  includeCampusFilter,
}: {
  spaceId: string;
  campusId: string;
  queryParams: GetEventsQuery;
  now: Date;
  dateField: TimeField;
  fetchWindow: number;
  includeCampusFilter: boolean;
}): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  let query: FirebaseFirestore.Query = dbAdmin
    .collection("events")
    .where("spaceId", "==", spaceId);

  if (includeCampusFilter) {
    query = query.where("campusId", "==", campusId);
  }

  if (queryParams.type) {
    query = query.where("type", "==", queryParams.type);
  }

  if (queryParams.upcoming) {
    query = query.where(dateField, ">=", now).orderBy(dateField, "asc");
  } else {
    query = query.where(dateField, "<", now).orderBy(dateField, "desc");
  }

  query = query.limit(fetchWindow);
  const snapshot = await query.get();
  return snapshot.docs;
}

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

const _GET = withAuthAndErrors(async (
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

    const now = new Date();
    const fetchWindow = Math.min(
      Math.max((queryParams.offset + queryParams.limit) * 2, queryParams.limit),
      MAX_FETCH_WINDOW
    );

    // Query both startDate and startAt fields, then merge.
    const docsById = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    let foundWithCampusFilter = false;

    for (const dateField of TIME_FIELDS) {
      try {
        const docs = await fetchSpaceEventDocsForTimeField({
          spaceId,
          campusId,
          queryParams,
          now,
          dateField,
          fetchWindow,
          includeCampusFilter: true,
        });
        if (docs.length > 0) {
          foundWithCampusFilter = true;
        }
        for (const doc of docs) docsById.set(doc.id, doc);
      } catch (error) {
        logger.warn("Space events query failed for date field", {
          spaceId,
          dateField,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fallback: If no events found with campus filter, try space-only for imported legacy docs.
    if (!foundWithCampusFilter) {
      logger.info("No events found with campusId, trying fallback query", { spaceId, campusId });
      for (const dateField of TIME_FIELDS) {
        try {
          const docs = await fetchSpaceEventDocsForTimeField({
            spaceId,
            campusId,
            queryParams,
            now,
            dateField,
            fetchWindow,
            includeCampusFilter: false,
          });
          for (const doc of docs) docsById.set(doc.id, doc);
        } catch (error) {
          logger.warn("Fallback space events query failed for date field", {
            spaceId,
            dateField,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const candidateDocs = Array.from(docsById.values());
    if (candidateDocs.length === 0) {
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

    const validDocs: Array<{
      doc: FirebaseFirestore.QueryDocumentSnapshot;
      eventData: Record<string, unknown>;
      eventStart: Date;
    }> = [];

    for (const doc of candidateDocs) {
      const eventData = doc.data();

      const eventStart = getEventStartDate(eventData);
      if (!eventStart) continue;
      if (!matchesUpcomingFilter(eventStart, now, queryParams.upcoming)) continue;

      // SECURITY: Skip events from other campuses
      if (eventData.campusId && eventData.campusId !== campusId) {
        continue;
      }
      // SECURITY: Skip hidden/moderated/removed content
      if (isContentHidden(eventData)) {
        continue;
      }
      validDocs.push({ doc, eventData, eventStart });
    }

    validDocs.sort((a, b) =>
      queryParams.upcoming
        ? a.eventStart.getTime() - b.eventStart.getTime()
        : b.eventStart.getTime() - a.eventStart.getTime()
    );

    const pagedDocs = validDocs.slice(
      queryParams.offset,
      queryParams.offset + queryParams.limit
    );
    const hasMore = validDocs.length > queryParams.offset + queryParams.limit;

    // COST OPTIMIZATION: Collect IDs for batch fetching
    const organizerIds = new Set<string>();
    const eventIds: string[] = [];

    for (const { doc, eventData } of pagedDocs) {
      eventIds.push(doc.id);
      const organizerId =
        typeof eventData.organizerId === "string" ? eventData.organizerId : null;
      if (organizerId) organizerIds.add(organizerId);
    }

    // Batch fetch all organizers
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

    // Batch fetch user's RSVPs
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

    // Batch fetch linked boards (chunked for Firestore 'in' query limit)
    const linkedBoardMap = new Map<string, { boardId: string; boardName: string } | null>();
    if (eventIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < eventIds.length; i += 30) {
        chunks.push(eventIds.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const boardsSnapshot = await dbAdmin
          .collection("spaces")
          .doc(spaceId)
          .collection("boards")
          .where("linkedEventId", "in", chunk)
          .get();
        for (const boardDoc of boardsSnapshot.docs) {
          const boardData = boardDoc.data();
          linkedBoardMap.set(boardData.linkedEventId, {
            boardId: boardDoc.id,
            boardName: boardData.name,
          });
        }
      }
    }

    // GHOST MODE: Build viewer context for privacy checks
    const viewerContext = ViewerContext.authenticated({
      userId,
      campusId,
      memberOfSpaceIds: [spaceId]
    });

    const events: Array<Record<string, unknown>> = [];

    for (const { doc, eventData, eventStart } of pagedDocs) {
      const organizerId =
        typeof eventData.organizerId === "string" ? eventData.organizerId : null;
      const organizerEntry = organizerId ? organizerMap.get(organizerId) : null;
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
        startDate: toEventDate(eventData.startDate) || toEventDate(eventData.startAt) || eventStart,
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
      hasMore,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        nextOffset: hasMore ? queryParams.offset + queryParams.limit : null,
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

export const GET = withCache(_GET, 'SHORT');
