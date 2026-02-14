import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withOptionalAuth,
  withAuthValidationAndErrors,
  getUser,
  getUserId,
  getCampusId,
  ResponseFormatter,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { logger } from "@/lib/structured-logger";
import { HttpStatus } from "@/lib/api-response-types";
import { isContentHidden } from "@/lib/content-moderation";
import { SecurityScanner } from "@/lib/secure-input-validation";
import {
  getEventEndDate,
  getEventStartDate,
  toEventIso,
} from "@/lib/events/event-time";
import { withCache } from '../../../lib/cache-headers';

/**
 * Campus-wide Events API
 * Returns all public events for the user's campus, regardless of space membership.
 *
 * Supports both event schemas:
 * - Legacy/imported: startAt/endAt
 * - Current app:      startDate/endDate
 */

const GetEventsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  type: z
    .enum(["academic", "social", "professional", "recreational", "official", "meeting", "virtual"])
    .optional(),
  upcoming: z.coerce.boolean().default(true),
  myEvents: z.coerce.boolean().default(false),
  spaceId: z.string().optional(),
  campusWide: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  from: z.string().optional(), // ISO date string: filter events starting on or after this date
  to: z.string().optional(),   // ISO date string: filter events starting on or before this date
});

type GetEventsQuery = z.infer<typeof GetEventsSchema>;
type TimeField = "startDate" | "startAt";

const TIME_FIELDS: TimeField[] = ["startDate", "startAt"];
const RSVP_COLLECTIONS = ["rsvps", "eventRsvps"] as const;
const MAX_FETCH_WINDOW = 500;

function resolveSortDirection(fromDate: Date | null, toDate: Date | null, upcoming: boolean) {
  if (fromDate && toDate) return "asc" as const;
  if (fromDate) return "asc" as const;
  if (toDate) return "desc" as const;
  return upcoming ? "asc" as const : "desc" as const;
}

function matchesTimeRange(
  eventStart: Date,
  now: Date,
  fromDate: Date | null,
  toDate: Date | null,
  upcoming: boolean
) {
  if (fromDate && eventStart < fromDate) return false;
  if (toDate && eventStart > toDate) return false;
  if (!fromDate && !toDate) {
    if (upcoming && eventStart < now) return false;
    if (!upcoming && eventStart >= now) return false;
  }
  return true;
}

async function fetchDocsForTimeField({
  campusId,
  queryParams,
  now,
  fromDate,
  toDate,
  dateField,
  fetchWindow,
  includeCampusFilter,
}: {
  campusId: string;
  queryParams: GetEventsQuery;
  now: Date;
  fromDate: Date | null;
  toDate: Date | null;
  dateField: TimeField;
  fetchWindow: number;
  includeCampusFilter: boolean;
}): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  let query: FirebaseFirestore.Query = dbAdmin.collection("events");

  if (includeCampusFilter) {
    query = query.where("campusId", "==", campusId);
  }

  if (queryParams.type) {
    query = query.where("type", "==", queryParams.type);
  }

  if (queryParams.spaceId) {
    query = query.where("spaceId", "==", queryParams.spaceId);
  }

  if (queryParams.campusWide) {
    query = query.where("isCampusWide", "==", true);
  }

  const sortDirection = resolveSortDirection(fromDate, toDate, queryParams.upcoming);

  if (fromDate) {
    query = query.where(dateField, ">=", fromDate);
  } else if (queryParams.upcoming) {
    query = query.where(dateField, ">=", now);
  } else {
    query = query.where(dateField, "<", now);
  }

  if (toDate) {
    query = query.where(dateField, "<=", toDate);
  }

  query = query.orderBy(dateField, sortDirection).limit(fetchWindow);
  const snapshot = await query.get();
  return snapshot.docs;
}

async function fetchUserRsvpStatuses(eventIds: string[], userId: string) {
  const userRsvpMap = new Map<string, string>();
  if (eventIds.length === 0) return userRsvpMap;

  const chunks: string[][] = [];
  for (let i = 0; i < eventIds.length; i += 30) {
    chunks.push(eventIds.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    for (const collectionName of RSVP_COLLECTIONS) {
      try {
        const userRsvps = await dbAdmin
          .collection(collectionName)
          .where("eventId", "in", chunk)
          .where("userId", "==", userId)
          .get();

        for (const rsvpDoc of userRsvps.docs) {
          const rsvpData = rsvpDoc.data();
          const eventId = rsvpData.eventId;
          const status = rsvpData.status;
          if (typeof eventId === "string" && typeof status === "string" && !userRsvpMap.has(eventId)) {
            userRsvpMap.set(eventId, status);
          }
        }
      } catch (error) {
        logger.warn("Failed to read RSVP collection for event statuses", {
          collectionName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return userRsvpMap;
}

const _GET = withOptionalAuth(async (
  request: Request,
  _context: unknown,
  respond: typeof ResponseFormatter
) => {
  try {
    // Optional auth: get user if authenticated, null otherwise
    const user = getUser(request as import("next/server").NextRequest);
    const userId = user?.uid || null;
    const campusId = user?.campusId || "ub-buffalo"; // Default campus for public

    const queryParams = GetEventsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    const now = new Date();
    const fromDate = queryParams.from ? new Date(queryParams.from) : null;
    const toDate = queryParams.to ? new Date(queryParams.to) : null;
    const hasSearch = Boolean(queryParams.search && queryParams.search.trim().length > 0);
    const searchLower = hasSearch ? queryParams.search!.toLowerCase().trim() : "";

    // When searching, fetch more before post-query filtering.
    const fetchLimit = hasSearch ? Math.min(queryParams.limit * 5, 500) : queryParams.limit;
    const fetchWindow = Math.min(
      Math.max((queryParams.offset + fetchLimit) * 2, fetchLimit),
      MAX_FETCH_WINDOW
    );

    // Query both date fields and merge for mixed-schema compatibility.
    const docsById = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    let foundWithCampusFilter = false;

    for (const dateField of TIME_FIELDS) {
      try {
        const docs = await fetchDocsForTimeField({
          campusId,
          queryParams,
          now,
          fromDate,
          toDate,
          dateField,
          fetchWindow,
          includeCampusFilter: true,
        });
        if (docs.length > 0) {
          foundWithCampusFilter = true;
        }
        for (const doc of docs) docsById.set(doc.id, doc);
      } catch (error) {
        logger.warn("Failed to query events for date field", {
          dateField,
          campusId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Space-specific fallback for imported/legacy events that may have missing campusId.
    if (!foundWithCampusFilter && queryParams.spaceId) {
      logger.info("No events found with campus filter, trying space fallback", {
        spaceId: queryParams.spaceId,
        campusId,
      });

      for (const dateField of TIME_FIELDS) {
        try {
          const docs = await fetchDocsForTimeField({
            campusId,
            queryParams,
            now,
            fromDate,
            toDate,
            dateField,
            fetchWindow,
            includeCampusFilter: false,
          });
          for (const doc of docs) docsById.set(doc.id, doc);
        } catch (error) {
          logger.warn("Fallback event query failed for date field", {
            dateField,
            spaceId: queryParams.spaceId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const candidateDocs = Array.from(docsById.values());

    // Get user's spaces for membership-based filtering
    let userSpaceIds: Set<string> = new Set();
    if (queryParams.myEvents && userId) {
      const membershipsSnapshot = await dbAdmin
        .collection("spaceMembers")
        .where("userId", "==", userId)
        .get();
      userSpaceIds = new Set(membershipsSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.spaceId || doc.id.split("_")[0];
      }));
    }

    // Preload spaces for visibility filtering.
    const allSpaceIds = new Set<string>();
    for (const doc of candidateDocs) {
      const eventData = doc.data();
      if (typeof eventData.spaceId === "string" && eventData.spaceId.length > 0) {
        allSpaceIds.add(eventData.spaceId);
      }
    }

    const spaceMap = new Map<string, Record<string, unknown>>();
    if (allSpaceIds.size > 0) {
      const refs = Array.from(allSpaceIds).map(id => dbAdmin.collection("spaces").doc(id));
      const docs = await dbAdmin.getAll(...refs);
      for (const doc of docs) {
        if (doc.exists) spaceMap.set(doc.id, doc.data() as Record<string, unknown>);
      }
    }

    // Apply security/content/search filters in memory after merging schemas.
    const filtered: Array<{
      doc: FirebaseFirestore.QueryDocumentSnapshot;
      eventData: Record<string, unknown>;
      eventStart: Date;
    }> = [];

    for (const doc of candidateDocs) {
      const eventData = doc.data();
      const eventStart = getEventStartDate(eventData);

      // Skip events with invalid timestamps.
      if (!eventStart) continue;

      if (!matchesTimeRange(eventStart, now, fromDate, toDate, queryParams.upcoming)) {
        continue;
      }

      // SECURITY: Skip hidden/moderated content.
      if (isContentHidden(eventData)) {
        continue;
      }

      // Filter by myEvents if requested.
      if (queryParams.myEvents) {
        const spaceId = typeof eventData.spaceId === "string" ? eventData.spaceId : "";
        if (!spaceId || !userSpaceIds.has(spaceId)) continue;
      }

      // Get space to check visibility.
      const spaceId = typeof eventData.spaceId === "string" ? eventData.spaceId : "";
      const spaceData = spaceId ? spaceMap.get(spaceId) : null;

      // Skip events from private spaces unless user is a member.
      if (spaceData && spaceData.isPublic === false && !userSpaceIds.has(spaceId)) {
        continue;
      }

      // Skip private events unless user is organizer.
      if (eventData.isPrivate && eventData.organizerId !== userId) {
        continue;
      }

      // Server-side text search: title, description, tags, categories.
      if (searchLower) {
        const title = String(eventData.title || "").toLowerCase();
        const description = String(eventData.description || "").toLowerCase();
        const tags: string[] = Array.isArray(eventData.tags) ? eventData.tags : [];
        const categories: string[] = Array.isArray(eventData.categories) ? eventData.categories : [];
        const labels = [...tags, ...categories];
        const labelsMatch = labels.some((value: string) =>
          String(value).toLowerCase().includes(searchLower)
        );

        if (!title.includes(searchLower) && !description.includes(searchLower) && !labelsMatch) {
          continue;
        }
      }

      filtered.push({ doc, eventData, eventStart });
    }

    const sortDirection = resolveSortDirection(fromDate, toDate, queryParams.upcoming);
    filtered.sort((a, b) =>
      sortDirection === "asc"
        ? a.eventStart.getTime() - b.eventStart.getTime()
        : b.eventStart.getTime() - a.eventStart.getTime()
    );

    const start = queryParams.offset;
    const end = start + queryParams.limit;
    const page = filtered.slice(start, end);
    const hasMore = filtered.length > end;

    // Batch data fetch only for paginated events.
    const organizerIds = new Set<string>();
    const pageSpaceIds = new Set<string>();
    const eventIds: string[] = [];

    for (const { doc, eventData } of page) {
      eventIds.push(doc.id);
      if (typeof eventData.organizerId === "string" && eventData.organizerId.length > 0) {
        organizerIds.add(eventData.organizerId);
      }
      if (typeof eventData.spaceId === "string" && eventData.spaceId.length > 0) {
        pageSpaceIds.add(eventData.spaceId);
      }
    }

    const organizerMap = new Map<string, Record<string, unknown>>();
    if (organizerIds.size > 0) {
      const organizerRefs = Array.from(organizerIds).map(id => dbAdmin.collection("users").doc(id));
      const organizerDocs = await dbAdmin.getAll(...organizerRefs);
      for (const doc of organizerDocs) {
        if (doc.exists) organizerMap.set(doc.id, doc.data() as Record<string, unknown>);
      }
    }

    const pageSpaceMap = new Map<string, Record<string, unknown>>();
    if (pageSpaceIds.size > 0) {
      const spaceRefs = Array.from(pageSpaceIds).map(id => dbAdmin.collection("spaces").doc(id));
      const spaceDocs = await dbAdmin.getAll(...spaceRefs);
      for (const doc of spaceDocs) {
        if (doc.exists) pageSpaceMap.set(doc.id, doc.data() as Record<string, unknown>);
      }
    }

    const userRsvpMap = userId
      ? await fetchUserRsvpStatuses(eventIds, userId)
      : new Map<string, string>();

    const events = page.map(({ doc, eventData, eventStart }) => {
      const eventEnd = getEventEndDate(eventData);
      const organizer =
        typeof eventData.organizerId === "string"
          ? organizerMap.get(eventData.organizerId)
          : null;
      const spaceData =
        typeof eventData.spaceId === "string"
          ? pageSpaceMap.get(eventData.spaceId)
          : null;

      const goingCount = Number(
        eventData.attendeeCount || eventData.goingCount || eventData.rsvpCount || 0
      );

      const location = eventData.locationName || eventData.location || "TBD";
      const tags = Array.isArray(eventData.tags)
        ? eventData.tags
        : Array.isArray(eventData.categories)
          ? eventData.categories
          : [];

      return {
        id: doc.id,
        title: eventData.title,
        description: eventData.description,
        type: eventData.type || eventData.eventType || "social",
        startTime: eventStart.toISOString(),
        endTime: eventEnd?.toISOString() || null,
        timezone: eventData.timezone || "America/New_York",
        locationType: eventData.locationType || (eventData.virtualLink ? "virtual" : "physical"),
        locationName: location,
        locationAddress: eventData.address,
        virtualLink: eventData.virtualLink,
        organizer: organizer
          ? {
              id: eventData.organizerId,
              name: organizer.fullName || organizer.displayName || "Event Organizer",
              handle: organizer.handle || "organizer",
              verified: organizer.isVerified || false,
            }
          : {
              id: eventData.organizerId,
              name: "Event Organizer",
              handle: "organizer",
              verified: false,
            },
        space: spaceData
          ? {
              id: eventData.spaceId,
              name: spaceData.name || "Campus",
              type: spaceData.category || "general",
            }
          : null,
        isCampusWide: eventData.isCampusWide === true || !eventData.spaceId,
        maxCapacity: eventData.maxAttendees || 100,
        currentCapacity: goingCount,
        tags,
        visibility: eventData.isPrivate ? "invited_only" : "public",
        rsvpStatus: userRsvpMap.get(doc.id) || null,
        isBookmarked: false,
        goingCount,
        interestedCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: toEventIso(eventData.createdAt),
        updatedAt: toEventIso(eventData.updatedAt),
        theme: eventData.theme || null,
        benefits: eventData.benefits || [],
        source: eventData.source || "user-created",
        sourceUrl: eventData.sourceUrl || null,
      };
    });

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
      "Error fetching campus events",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error("Failed to fetch events", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'SHORT');

/**
 * POST /api/events — Create a campus-wide event (not tied to a specific space).
 */

const CreateCampusEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().max(500).optional(),
  category: z
    .enum(["academic", "social", "professional", "recreational", "official", "meeting", "virtual"])
    .optional(),
  imageUrl: z.string().url().optional(),
  visibility: z.enum(["public", "invited_only"]).default("public"),
});

export const POST = withAuthValidationAndErrors(
  CreateCampusEventSchema,
  async (request, _context, body, respond) => {
    try {
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);

      // Validate dates
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      const now = new Date();

      if (startDate >= endDate) {
        return respond.error("End date must be after start date", "INVALID_INPUT", {
          status: HttpStatus.BAD_REQUEST,
        });
      }

      if (startDate < now) {
        return respond.error("Start date cannot be in the past", "INVALID_INPUT", {
          status: HttpStatus.BAD_REQUEST,
        });
      }

      // Security: scan text fields for XSS/injection
      const fieldsToScan = [
        { name: "title", value: body.title },
        { name: "description", value: body.description },
        ...(body.location ? [{ name: "location", value: body.location }] : []),
      ];

      for (const field of fieldsToScan) {
        const scan = SecurityScanner.scanInput(field.value);
        if (scan.level === "dangerous") {
          logger.warn("XSS attempt blocked in campus event creation", {
            userId,
            field: field.name,
            threats: scan.threats,
          });
          return respond.error(
            `Event ${field.name} contains invalid content`,
            "INVALID_INPUT",
            { status: HttpStatus.BAD_REQUEST },
          );
        }
      }

      const eventData = {
        title: body.title,
        description: body.description,
        startDate,
        endDate,
        location: body.location || null,
        type: body.category || "social",
        imageUrl: body.imageUrl || null,
        visibility: body.visibility,
        isPrivate: body.visibility === "invited_only",
        scope: "campus" as const,
        isCampusWide: true,
        campusId,
        organizerId: userId,
        status: "scheduled",
        isHidden: false,
        attendeeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const eventRef = await dbAdmin.collection("events").add(eventData);

      logger.info("Campus-wide event created", {
        eventId: eventRef.id,
        campusId,
        userId,
      });

      return respond.created({
        event: {
          id: eventRef.id,
          ...eventData,
        },
      });
    } catch (error) {
      logger.error("Error creating campus event", {
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error("Failed to create event", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);
