"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { logger } from "@/lib/structured-logger";
import { HttpStatus } from "@/lib/api-response-types";
import { isContentHidden } from "@/lib/content-moderation";

/**
 * Campus-wide Events API
 * Returns all public events for the user's campus, regardless of space membership
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
  campusWide: z.coerce.boolean().optional(), // Filter for campus-wide events only
});

export const GET = withAuthAndErrors(async (
  request,
  _context,
  respond,
) => {
  try {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    const queryParams = GetEventsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    // Build query for campus-wide events
    // First try with campusId filter, then fall back to include imported events
    let query: FirebaseFirestore.Query = dbAdmin
      .collection("events")
      .where("campusId", "==", campusId);

    // Filter by upcoming/past
    const now = new Date();
    if (queryParams.upcoming) {
      query = query.where("startDate", ">=", now).orderBy("startDate", "asc");
    } else {
      query = query.where("startDate", "<", now).orderBy("startDate", "desc");
    }

    // Filter by type if provided
    if (queryParams.type) {
      query = query.where("type", "==", queryParams.type);
    }

    // Filter by space if provided
    if (queryParams.spaceId) {
      query = query.where("spaceId", "==", queryParams.spaceId);
    }

    // Filter for campus-wide events (events without a space)
    if (queryParams.campusWide) {
      query = query.where("isCampusWide", "==", true);
    }

    query = query.offset(queryParams.offset).limit(queryParams.limit);

    let eventsSnapshot = await query.get();

    // Fallback: If querying for a specific space and no events found,
    // try without campusId filter to include imported/legacy events
    if (eventsSnapshot.empty && queryParams.spaceId) {
      logger.info('No events found with campusId, trying fallback query for space', {
        spaceId: queryParams.spaceId,
        campusId,
      });
      let fallbackQuery: FirebaseFirestore.Query = dbAdmin
        .collection("events")
        .where("spaceId", "==", queryParams.spaceId);

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
    // Get user's spaces for membership-based filtering
    let userSpaceIds: Set<string> = new Set();
    if (queryParams.myEvents) {
      const membershipsSnapshot = await dbAdmin
        .collection("spaceMembers")
        .where("userId", "==", userId)
        .get();
      userSpaceIds = new Set(membershipsSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.spaceId || doc.id.split('_')[0];
      }));
    }

    // COST OPTIMIZATION: Collect all unique IDs for batch fetching
    const organizerIds = new Set<string>();
    const spaceIds = new Set<string>();
    const eventIds: string[] = [];

    for (const doc of eventsSnapshot.docs) {
      const eventData = doc.data();
      eventIds.push(doc.id);
      if (eventData.organizerId) organizerIds.add(eventData.organizerId);
      if (eventData.spaceId) spaceIds.add(eventData.spaceId);
    }

    // COST OPTIMIZATION: Batch fetch all organizers in ONE call (N+1 → 1)
    const organizerMap = new Map<string, Record<string, unknown>>();
    if (organizerIds.size > 0) {
      const organizerRefs = Array.from(organizerIds).map(id => dbAdmin.collection("users").doc(id));
      const organizerDocs = await dbAdmin.getAll(...organizerRefs);
      for (const doc of organizerDocs) {
        if (doc.exists) {
          organizerMap.set(doc.id, doc.data() as Record<string, unknown>);
        }
      }
    }

    // COST OPTIMIZATION: Batch fetch all spaces in ONE call (N+1 → 1)
    const spaceMap = new Map<string, Record<string, unknown>>();
    if (spaceIds.size > 0) {
      const spaceRefs = Array.from(spaceIds).map(id => dbAdmin.collection("spaces").doc(id));
      const spaceDocs = await dbAdmin.getAll(...spaceRefs);
      for (const doc of spaceDocs) {
        if (doc.exists) {
          spaceMap.set(doc.id, doc.data() as Record<string, unknown>);
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
          const rsvpData = rsvpDoc.data();
          userRsvpMap.set(rsvpData.eventId, rsvpData.status);
        }
      }
    }

    // COST OPTIMIZATION: Use cached RSVP counts from event data instead of N+1 queries
    // Events should store attendeeCount/goingCount that gets updated on RSVP changes
    // This avoids N queries for RSVP counts

    const events: Array<Record<string, unknown>> = [];

    for (const doc of eventsSnapshot.docs) {
      const eventData = doc.data();

      // SECURITY: Skip hidden/moderated content
      if (isContentHidden(eventData)) {
        continue;
      }

      // Filter by myEvents if requested
      if (queryParams.myEvents && !userSpaceIds.has(eventData.spaceId)) {
        continue;
      }

      // Get space to check visibility
      const spaceData = eventData.spaceId ? spaceMap.get(eventData.spaceId) : null;

      // Skip events from private spaces unless user is a member
      if (spaceData && spaceData.isPublic === false && !userSpaceIds.has(eventData.spaceId)) {
        continue;
      }

      // Skip private events unless user is organizing or RSVP'd
      if (eventData.isPrivate && eventData.organizerId !== userId) {
        continue;
      }

      const organizer = eventData.organizerId ? organizerMap.get(eventData.organizerId) : null;

      // Use batch-fetched RSVP status (no per-event query)
      const userRsvpStatus = userRsvpMap.get(doc.id) || null;

      // Use cached count from event data (avoids N+1 RSVP count queries)
      const goingCount = eventData.attendeeCount || eventData.goingCount || eventData.rsvpCount || 0;

      events.push({
        id: doc.id,
        title: eventData.title,
        description: eventData.description,
        type: eventData.type || 'social',
        startTime: eventData.startDate?.toDate?.()?.toISOString() || eventData.startDate,
        endTime: eventData.endDate?.toDate?.()?.toISOString() || eventData.endDate,
        timezone: eventData.timezone || 'America/New_York',
        locationType: eventData.locationType || (eventData.virtualLink ? 'virtual' : 'physical'),
        locationName: eventData.location || 'TBD',
        locationAddress: eventData.address,
        virtualLink: eventData.virtualLink,
        organizer: organizer
          ? {
              id: eventData.organizerId,
              name: organizer.fullName || organizer.displayName || 'Event Organizer',
              handle: organizer.handle || 'organizer',
              verified: organizer.isVerified || false,
            }
          : {
              id: eventData.organizerId,
              name: 'Event Organizer',
              handle: 'organizer',
              verified: false,
            },
        space: spaceData
          ? {
              id: eventData.spaceId,
              name: spaceData.name || 'Campus',
              type: spaceData.category || 'general',
            }
          : null,
        isCampusWide: eventData.isCampusWide === true || !eventData.spaceId,
        maxCapacity: eventData.maxAttendees || 100,
        currentCapacity: goingCount,
        tags: eventData.tags || [],
        visibility: eventData.isPrivate ? 'invited_only' : 'public',
        rsvpStatus: userRsvpStatus,
        isBookmarked: false, // Would need separate bookmarks collection
        goingCount: goingCount,
        interestedCount: 0, // Would need separate collection/cached field
        commentsCount: 0, // Would need separate collection/cached field
        sharesCount: 0,
        createdAt: eventData.createdAt?.toDate?.()?.toISOString() || eventData.createdAt,
        updatedAt: eventData.updatedAt?.toDate?.()?.toISOString() || eventData.updatedAt,
        // CampusLabs imported event metadata
        theme: eventData.theme || null,
        benefits: eventData.benefits || [],
        source: eventData.source || 'user-created',
        sourceUrl: eventData.sourceUrl || null,
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
      "Error fetching campus events",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error("Failed to fetch events", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
