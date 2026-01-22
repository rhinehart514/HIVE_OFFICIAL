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
import { withAuth, type AuthContext } from '@/lib/api-auth-middleware';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Request schema
const PersonalizedEventsSchema = z.object({
  timeRange: z.enum(['tonight', 'today', 'this-week', 'this-month']).default('tonight'),
  maxItems: z.coerce.number().min(1).max(50).default(10),
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
  request: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  const { userId, campusId } = context;

  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = PersonalizedEventsSchema.parse({
      timeRange: searchParams.get('timeRange') || 'tonight',
      maxItems: searchParams.get('maxItems') || 10,
      eventTypes: searchParams.get('eventTypes')?.split(',').filter(Boolean),
      excludeRsvped: searchParams.get('excludeRsvped') === 'true',
    });

    const { start, end } = getTimeRange(params.timeRange);

    // Step 1: Get user data (interests, connections, space memberships)
    const [userDoc, connectionsSnapshot, membershipsSnapshot] = await Promise.all([
      dbAdmin.collection('users').doc(userId).get(),
      dbAdmin.collection('users').doc(userId).collection('connections')
        .where('status', '==', 'connected')
        .limit(100)
        .get(),
      dbAdmin.collection('spaceMembers')
        .where('userId', '==', userId)
        .where('campusId', '==', campusId)
        .get(),
    ]);

    const userData = userDoc.data() || {};
    const userInterests: string[] = userData.interests || [];
    const friendIds = new Set(connectionsSnapshot.docs.map(doc => doc.id));
    const userSpaceIds = new Set(membershipsSnapshot.docs.map(doc => doc.data().spaceId));

    // Step 2: Fetch events in time range
    let eventsQuery = dbAdmin.collection('events')
      .where('campusId', '==', campusId)
      .where('state', '==', 'published')
      .where('startDate', '>=', start.toISOString())
      .where('startDate', '<=', end.toISOString())
      .orderBy('startDate', 'asc')
      .limit(100);

    const eventsSnapshot = await eventsQuery.get();
    const events = eventsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<Record<string, unknown>>;

    // Step 3: Get RSVP data for all events (batch)
    const eventIds = events.map(e => e.id as string);
    const rsvpData: Map<string, { count: number; userRsvped: boolean; friendsAttending: string[] }> = new Map();

    if (eventIds.length > 0) {
      // Get all RSVPs for these events
      const rsvpBatches = [];
      for (let i = 0; i < eventIds.length; i += 10) {
        const batch = eventIds.slice(i, i + 10);
        rsvpBatches.push(
          dbAdmin.collection('eventRsvps')
            .where('eventId', 'in', batch)
            .where('status', '==', 'going')
            .get()
        );
      }

      const rsvpSnapshots = await Promise.all(rsvpBatches);
      for (const snapshot of rsvpSnapshots) {
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const eventId = data.eventId as string;
          const rsvpUserId = data.userId as string;

          if (!rsvpData.has(eventId)) {
            rsvpData.set(eventId, { count: 0, userRsvped: false, friendsAttending: [] });
          }

          const eventRsvp = rsvpData.get(eventId)!;
          eventRsvp.count++;

          if (rsvpUserId === userId) {
            eventRsvp.userRsvped = true;
          }

          if (friendIds.has(rsvpUserId)) {
            eventRsvp.friendsAttending.push(rsvpUserId);
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
      const friendIds = Array.from(allFriendsAttending).slice(0, 30); // Limit
      for (let i = 0; i < friendIds.length; i += 10) {
        const batch = friendIds.slice(i, i + 10);
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

      // Skip if user already RSVP'd and excludeRsvped is true
      if (params.excludeRsvped && rsvp.userRsvped) {
        return null;
      }

      const matchReasons: string[] = [];
      let relevanceScore = 0;

      // Interest match (0-100 points)
      const { score: interestScore, matchedInterests } = calculateInterestMatch(
        userInterests,
        event.eventType as string | undefined,
        event.tags as string[] | undefined,
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
      const eventStart = new Date(event.startDate as string);
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
        startDate: event.startDate as string,
        endDate: event.endDate as string || event.startDate as string,
        location: event.location as string | undefined,
        eventType: event.eventType as string | undefined,
        spaceId: eventSpaceId,
        spaceName: event.spaceName as string | undefined,
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

    // Sort by relevance score (descending)
    personalizedEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply maxItems limit
    const result = personalizedEvents.slice(0, params.maxItems);

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
        totalAvailable: personalizedEvents.length,
        returned: result.length,
        userInterests: userInterests.slice(0, 5), // Include for UI display
        hasMoreEvents: personalizedEvents.length > params.maxItems,
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

export const GET = withAuth(handler);
