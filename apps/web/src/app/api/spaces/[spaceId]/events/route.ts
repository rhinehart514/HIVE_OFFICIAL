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

    const eventsSnapshot = await query.get();
    const events: Array<Record<string, unknown>> = [];

    // GHOST MODE: Build viewer context for privacy checks
    const viewerContext = ViewerContext.authenticated({
      userId,
      campusId,
      memberOfSpaceIds: [spaceId] // Viewer is in this space
    });

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
      const organizerDoc = await dbAdmin.collection("users").doc(eventData.organizerId).get();
      const organizer = organizerDoc.exists ? organizerDoc.data() : null;

      // GHOST MODE: Check if organizer's activity should be hidden
      let shouldHideOrganizer = false;
      if (organizer) {
        const organizerGhostUser: GhostModeUser = {
          id: organizerDoc.id,
          ghostMode: organizer.ghostMode,
          visibility: organizer.visibility
        };
        // Both viewer and organizer are in this space
        shouldHideOrganizer = GhostModeService.shouldHideActivity(
          organizerGhostUser,
          viewerContext,
          [spaceId]
        );
      }

      // RSVPs use flat /rsvps collection filtered by eventId
      const rsvpSnapshot = await dbAdmin
        .collection("rsvps")
        .where("eventId", "==", doc.id)
        .where("status", "==", "going")
        .get();

      const userRsvpQuery = await dbAdmin
        .collection("rsvps")
        .where("eventId", "==", doc.id)
        .where("userId", "==", userId)
        .limit(1)
        .get();
      const userRsvpDoc = userRsvpQuery.docs[0];

      // Find linked board for this event
      const linkedBoard = await findEventBoard(doc.id, spaceId);

      events.push({
        id: doc.id,
        ...eventData,
        // GHOST MODE: Hide organizer identity if they have ghost mode with hideActivity
        organizer: shouldHideOrganizer
          ? null  // Hide organizer identity but keep event visible
          : organizer
            ? {
                id: organizerDoc.id,
                fullName: organizer.fullName,
                handle: organizer.handle,
                photoURL: organizer.photoURL,
              }
            : null,
        currentAttendees: rsvpSnapshot.size,
        userRSVP: userRsvpDoc?.exists ? userRsvpDoc.data()?.status : null,
        // Include linked board info if exists
        linkedBoard: linkedBoard
          ? { id: linkedBoard.boardId, name: linkedBoard.boardName }
          : undefined,
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
      const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
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
