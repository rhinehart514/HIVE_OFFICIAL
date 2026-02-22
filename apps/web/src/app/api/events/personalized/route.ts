/**
 * Personalized Events API
 *
 * Returns events ranked by relevance to the user based on:
 * 1. Interest match (user interests vs event category/tags)
 * 2. Social context (friends attending)
 * 3. Space membership (events from user's spaces rank higher)
 * 4. Time proximity (closer events rank higher)
 *
 * This powers the "Event for Me Tonight" hero demo.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { isContentHidden } from '@/lib/content-moderation';
import {
  getEventEndDate,
  getEventStartDate,
} from '@/lib/events/event-time';
import { withCache } from '../../../../lib/cache-headers';

// Request schema
const PersonalizedEventsSchema = z.object({
  timeRange: z.enum(['tonight', 'today', 'this-week', 'this-month', 'upcoming']).default('tonight'),
  maxItems: z.coerce.number().min(1).max(50).default(20),
  page: z.coerce.number().min(1).default(1),
  sort: z.enum(['relevance', 'newest', 'soonest']).default('relevance'),
  eventTypes: z.array(z.string()).optional(),
  excludeRsvped: z.boolean().optional().default(false),
});

// Interest category to event type mapping
const INTEREST_TO_EVENT_TYPE: Record<string, string[]> = {
  academic: ['workshop', 'study', 'lecture', 'seminar', 'academic', 'research'],
  sports: ['sports', 'fitness', 'game', 'tournament', 'intramural', 'athletic'],
  arts: ['art', 'exhibition', 'gallery', 'performance', 'theater', 'dance'],
  music: ['concert', 'music', 'performance', 'show', 'band', 'open mic'],
  gaming: ['gaming', 'esports', 'tournament', 'lan party', 'game night'],
  technology: ['tech', 'hackathon', 'workshop', 'demo', 'coding', 'startup'],
  social: ['social', 'party', 'mixer', 'networking', 'meetup', 'hangout'],
  outdoor: ['outdoor', 'hike', 'adventure', 'nature', 'camping'],
  wellness: ['wellness', 'yoga', 'meditation', 'fitness', 'health'],
  career: ['career', 'networking', 'professional', 'interview', 'internship'],
  food: ['food', 'cooking', 'dining', 'potluck', 'tasting'],
  travel: ['travel', 'culture', 'international', 'exchange'],
};

interface PersonalizedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  eventType?: string;
  spaceId?: string;
  spaceName?: string;
  organizerName?: string;
  coverImageUrl?: string;
  rsvpCount: number;
  // Personalization fields
  relevanceScore: number;
  matchReasons: string[];
  friendsAttending: number;
  friendsAttendingNames?: string[];
  isUserRsvped: boolean;
  interestMatch?: string[];
}

type TimeField = 'startDate' | 'startAt';
const TIME_FIELDS: TimeField[] = ['startDate', 'startAt'];
const RSVP_COLLECTIONS = ['rsvps', 'eventRsvps'] as const;

function isEventDiscoverable(event: Record<string, unknown>): boolean {
  if (isContentHidden(event)) {
    return false;
  }

  const rawState = String(
    event.state ??
    event.status ??
    (typeof event.source === 'object' && event.source ? (event.source as Record<string, unknown>).status : '') ??
    ''
  ).toLowerCase();

  // Only block clearly non-discoverable statuses.
  if (!rawState) return true;
  return !['cancelled', 'canceled', 'archived', 'deleted', 'draft', 'hidden'].includes(rawState);
}

function normalizeRsvpStatus(status: unknown): 'going' | 'maybe' | 'not_going' | null {
  if (typeof status !== 'string') return null;
  const normalized = status.trim().toLowerCase();
  if (normalized === 'going') return 'going';
  if (normalized === 'maybe' || normalized === 'interested') return 'maybe';
  if (normalized === 'not_going' || normalized === 'declined' || normalized === 'no') return 'not_going';
  return null;
}

async function fetchEventsForTimeField(
  campusId: string,
  start: Date,
  end: Date,
  field: TimeField,
  limit: number
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const query = dbAdmin
    .collection('events')
    .where('campusId', '==', campusId)
    .where(field, '>=', start)
    .where(field, '<=', end)
    .orderBy(field, 'asc')
    .limit(limit);

  const snapshot = await query.get();
  return snapshot.docs;
}

// Get time range boundaries
function getTimeRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (range) {
    case 'tonight':
      // Tonight = now until midnight
      start.setHours(now.getHours(), 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this-week':
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this-month':
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'upcoming':
      // Next 30 days from now
      end.setDate(end.getDate() + 30);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

// Calculate interest match score
function calculateInterestMatch(
  userInterests: string[],
  eventType?: string,
  eventTags?: string[],
  eventTitle?: string,
  eventDescription?: string
): { score: number; matchedInterests: string[] } {
  const matchedInterests: string[] = [];
  let score = 0;

  const normalizedUserInterests = userInterests.map(i => i.toLowerCase());
  const eventText = [
    eventType || '',
    ...(eventTags || []),
    eventTitle || '',
    eventDescription || '',
  ].join(' ').toLowerCase();

  for (const interest of normalizedUserInterests) {
    // Direct match
    if (eventText.includes(interest)) {
      score += 30;
      matchedInterests.push(interest);
      continue;
    }

    // Category-based match
    for (const [category, eventTypes] of Object.entries(INTEREST_TO_EVENT_TYPE)) {
      if (interest.includes(category) || category.includes(interest)) {
        for (const type of eventTypes) {
          if (eventText.includes(type)) {
            score += 20;
            matchedInterests.push(interest);
            break;
          }
        }
      }
    }
  }

  return { score: Math.min(score, 100), matchedInterests: [...new Set(matchedInterests)] };
}

async function handler(
  request: AuthenticatedRequest,
  _context: unknown,
  _respond: unknown
): Promise<Response> {
  const userId = getUserId(request);
  const campusId = getCampusId(request) || 'ub-buffalo';

  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = PersonalizedEventsSchema.parse({
      timeRange: searchParams.get('timeRange') || 'tonight',
      maxItems: searchParams.get('maxItems') || 20,
      page: searchParams.get('page') || 1,
      sort: searchParams.get('sort') || 'relevance',
      eventTypes: searchParams.get('eventTypes')?.split(',').filter(Boolean),
      excludeRsvped: searchParams.get('excludeRsvped') === 'true',
    });

    const { start, end } = getTimeRange(params.timeRange);

    // Step 1: Get user data (interests, connections, space memberships)
    // Fetch user data, connections, and space memberships in parallel.
    // Each query is wrapped so one failure doesn't crash the whole request.
    const [userDoc, connectionsSnapshot, membershipsSnapshot] = await Promise.all([
      dbAdmin.collection('users').doc(userId).get(),
      // connections live in the top-level 'connections' collection, not a subcollection
      dbAdmin.collection('connections')
        .where('userId', '==', userId)
        .where('status', '==', 'connected')
        .limit(100)
        .get()
        .catch(() => ({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] })),
      // spaceMembers has no campusId field — filter by userId only
      dbAdmin.collection('spaceMembers')
        .where('userId', '==', userId)
        .get()
        .catch(() => ({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] })),
    ]);

    const userData = userDoc.data() || {};
    const userInterests: string[] = userData.interests || [];
    // connections collection stores connectedUserId — extract that for friend matching
    const friendIds = new Set(
      connectionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return (data.connectedUserId || data.friendId || doc.id) as string;
      })
    );
    const userSpaceIds = new Set(membershipsSnapshot.docs.map(doc => doc.data().spaceId));

    // Step 2: Fetch events in time range (supports both startDate + startAt schemas)
    const rawEventDocs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    const fetchLimit = Math.max(params.maxItems * 8, 120);

    for (const field of TIME_FIELDS) {
      try {
        const docs = await fetchEventsForTimeField(campusId, start, end, field, fetchLimit);
        for (const doc of docs) rawEventDocs.set(doc.id, doc);
      } catch (error) {
        logger.warn('Personalized events query failed for date field', {
          field,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fallback: pull recent campus events and filter in memory if both indexed queries failed.
    // Note: campusId single-field index is exempted; use startDate string comparison instead.
    if (rawEventDocs.size === 0) {
      try {
        const fallbackSnapshot = await dbAdmin
          .collection('events')
          .where('startDate', '>=', start.toISOString())
          .orderBy('startDate', 'asc')
          .limit(fetchLimit)
          .get();
        for (const doc of fallbackSnapshot.docs) rawEventDocs.set(doc.id, doc);
      } catch (fallbackError) {
        logger.warn('Fallback events query also failed', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        });
      }
    }

    const events = Array.from(rawEventDocs.values())
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>)
      .filter((event) => {
        if (!isEventDiscoverable(event)) return false;

        const eventStart = getEventStartDate(event);
        if (!eventStart) return false;
        if (eventStart < start || eventStart > end) return false;

        if (params.eventTypes && params.eventTypes.length > 0) {
          const type = String(event.eventType || event.type || '').toLowerCase();
          const types = params.eventTypes.map((value) => value.toLowerCase());
          if (!types.includes(type)) return false;
        }

        return true;
      });

    // Step 3: Get RSVP data for all events (batch, supports both collections)
    const eventIds = events.map((event) => event.id as string);
    const rsvpData: Map<string, { count: number; userRsvped: boolean; friendsAttending: string[] }> = new Map();

    if (eventIds.length > 0) {
      const seenRsvps = new Set<string>();

      for (let i = 0; i < eventIds.length; i += 30) {
        const batch = eventIds.slice(i, i + 30);

        for (const collectionName of RSVP_COLLECTIONS) {
          let snapshot: FirebaseFirestore.QuerySnapshot;
          try {
            snapshot = await dbAdmin
              .collection(collectionName)
              .where('eventId', 'in', batch)
              .get();
          } catch (error) {
            logger.warn('Failed reading RSVP collection for personalized events', {
              collectionName,
              error: error instanceof Error ? error.message : String(error),
            });
            continue;
          }

          for (const doc of snapshot.docs) {
            const data = doc.data();
            const eventId = data.eventId as string;
            const rsvpUserId = data.userId as string;
            const status = normalizeRsvpStatus(data.status);

            if (!eventId || !rsvpUserId || !status) continue;

            const dedupeKey = `${eventId}:${rsvpUserId}`;
            if (seenRsvps.has(dedupeKey)) continue;
            seenRsvps.add(dedupeKey);

            if (!rsvpData.has(eventId)) {
              rsvpData.set(eventId, { count: 0, userRsvped: false, friendsAttending: [] });
            }

            const eventRsvp = rsvpData.get(eventId)!;

            if (status !== 'not_going' && rsvpUserId === userId) {
              eventRsvp.userRsvped = true;
            }

            if (status === 'going') {
              eventRsvp.count++;
              if (friendIds.has(rsvpUserId)) {
                eventRsvp.friendsAttending.push(rsvpUserId);
              }
            }
          }
        }
      }
    }

    // Step 4: Get friend names for display
    const allFriendsAttending = new Set<string>();
    for (const [, data] of rsvpData) {
      data.friendsAttending.forEach(id => allFriendsAttending.add(id));
    }

    const friendNames: Map<string, string> = new Map();
    if (allFriendsAttending.size > 0) {
      const friendIdsToLookup = Array.from(allFriendsAttending).slice(0, 30); // Limit
      for (let i = 0; i < friendIdsToLookup.length; i += 10) {
        const batch = friendIdsToLookup.slice(i, i + 10);
        const friendDocs = await dbAdmin.collection('users')
          .where('__name__', 'in', batch)
          .select('fullName', 'handle')
          .get();
        for (const doc of friendDocs.docs) {
          const data = doc.data();
          friendNames.set(doc.id, data.fullName || data.handle || 'Friend');
        }
      }
    }

    // Step 5: Calculate relevance scores and build response
    const personalizedEvents: PersonalizedEvent[] = events.map(event => {
      const eventId = event.id as string;
      const rsvp = rsvpData.get(eventId) || { count: 0, userRsvped: false, friendsAttending: [] };
      const eventStart = getEventStartDate(event);

      // Skip if user already RSVP'd and excludeRsvped is true
      if (params.excludeRsvped && rsvp.userRsvped) {
        return null;
      }

      if (!eventStart) {
        return null;
      }

      const matchReasons: string[] = [];
      let relevanceScore = 0;
      const eventType = (event.eventType || event.type) as string | undefined;
      const eventTags = [
        ...(Array.isArray(event.tags) ? event.tags : []),
        ...(Array.isArray(event.categories) ? event.categories : []),
      ] as string[];

      // Interest match (0-100 points)
      const { score: interestScore, matchedInterests } = calculateInterestMatch(
        userInterests,
        eventType,
        eventTags,
        event.title as string | undefined,
        event.description as string | undefined
      );
      relevanceScore += interestScore;
      if (interestScore > 0) {
        matchReasons.push(`Matches your interests: ${matchedInterests.join(', ')}`);
      }

      // Friends attending (0-50 points, 10 per friend up to 5)
      const friendsScore = Math.min(rsvp.friendsAttending.length * 10, 50);
      relevanceScore += friendsScore;
      if (rsvp.friendsAttending.length > 0) {
        const friendNameList = rsvp.friendsAttending
          .slice(0, 3)
          .map(id => friendNames.get(id) || 'Friend');
        const moreCount = rsvp.friendsAttending.length - 3;
        const friendText = moreCount > 0
          ? `${friendNameList.join(', ')} +${moreCount} more`
          : friendNameList.join(', ');
        matchReasons.push(`${rsvp.friendsAttending.length} friend${rsvp.friendsAttending.length > 1 ? 's' : ''} attending: ${friendText}`);
      }

      // Space membership (20 points if from user's space)
      const eventSpaceId = event.spaceId as string | undefined;
      if (eventSpaceId && userSpaceIds.has(eventSpaceId)) {
        relevanceScore += 20;
        matchReasons.push(`From your space: ${event.spaceName || 'Your community'}`);
      }

      // Time proximity bonus (0-30 points, closer = higher)
      const hoursUntil = (eventStart.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil <= 3) {
        relevanceScore += 30;
        matchReasons.push('Happening soon!');
      } else if (hoursUntil <= 6) {
        relevanceScore += 20;
      } else if (hoursUntil <= 12) {
        relevanceScore += 10;
      }

      // Popularity boost (0-20 points)
      if (rsvp.count >= 20) {
        relevanceScore += 20;
        matchReasons.push('Popular event');
      } else if (rsvp.count >= 10) {
        relevanceScore += 10;
      }

      return {
        id: eventId,
        title: event.title as string || 'Untitled Event',
        description: event.description as string | undefined,
        startDate: eventStart.toISOString(),
        endDate: (getEventEndDate(event) || eventStart).toISOString(),
        location: (event.locationName || event.location) as string | undefined,
        eventType,
        spaceId: eventSpaceId,
        spaceName: event.spaceName as string | undefined,
        spaceHandle: event.spaceHandle as string | undefined,
        spaceAvatarUrl: event.spaceAvatarUrl as string | undefined,
        organizerName: event.organizerName as string | undefined,
        coverImageUrl: event.coverImageUrl as string | undefined,
        rsvpCount: rsvp.count,
        relevanceScore,
        matchReasons,
        friendsAttending: rsvp.friendsAttending.length,
        friendsAttendingNames: rsvp.friendsAttending.slice(0, 5).map(id => friendNames.get(id) || 'Friend'),
        isUserRsvped: rsvp.userRsvped,
        interestMatch: matchedInterests.length > 0 ? matchedInterests : undefined,
      } as PersonalizedEvent;
    }).filter((e): e is PersonalizedEvent => e !== null);

    // Sort based on requested sort mode
    if (params.sort === 'newest') {
      personalizedEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    } else if (params.sort === 'soonest') {
      personalizedEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else {
      // relevance (default)
      personalizedEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Paginate
    const startIdx = (params.page - 1) * params.maxItems;
    const result = personalizedEvents.slice(startIdx, startIdx + params.maxItems);

    logger.info('Personalized events fetched', {
      component: 'events-personalized',
      userId,
      timeRange: params.timeRange,
      totalEvents: events.length,
      personalizedCount: result.length,
      userInterestsCount: userInterests.length,
      friendsCount: friendIds.size,
    });

    return NextResponse.json(ApiResponseHelper.success({
      events: result,
      meta: {
        timeRange: params.timeRange,
        sort: params.sort,
        page: params.page,
        totalAvailable: personalizedEvents.length,
        returned: result.length,
        userInterests: userInterests.slice(0, 5),
        hasMoreEvents: startIdx + params.maxItems < personalizedEvents.length,
      },
    }));
  } catch (error) {
    logger.error('Error fetching personalized events', { component: 'events-personalized' }, error instanceof Error ? error : undefined);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid request parameters', 'VALIDATION_ERROR'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    return NextResponse.json(
      ApiResponseHelper.error('Failed to fetch personalized events', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

const _GET = withAuthAndErrors(handler);

export const GET = withCache(_GET as (req: NextRequest, ctx: unknown) => Promise<Response>, 'SHORT');
