import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest, ResponseFormatter } from "@/lib/middleware/index";
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/structured-logger";
import { getServerProfileRepository } from '@hive/core/server';
import { isTestUserId } from "@/lib/security-service";
import { withCache } from '../../../../lib/cache-headers';

/**
 * Get profile dashboard data
 * GET /api/profile/dashboard
 *
 * Query params:
 * - timeRange: 'day' | 'week' | 'month' | 'all'
 * - includeRecommendations: boolean
 */
const _GET = withAuthAndErrors(async (
  request: AuthenticatedRequest,
  _context: unknown,
  respond: typeof ResponseFormatter
) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || 'week';
  const includeRecommendations = searchParams.get('includeRecommendations') === 'true';

  try {
    // Development mode mock data (ONLY in development)
    if (isTestUserId(userId)) {
      return respond.success({
        dashboard: {
          quickActions: {
            favoriteSpaces: [
              {
                id: 'cs-370',
                name: 'CS 370 Study Group',
                color: '#4F46E5',
                memberCount: 45,
                lastActivity: new Date().toISOString(),
              },
              {
                id: 'ub-builders',
                name: 'UB Builders',
                color: '#EC4899',
                memberCount: 128,
                lastActivity: new Date(Date.now() - 3600000).toISOString(),
              },
            ],
            recentTools: [
              {
                id: 'study-timer',
                name: 'Pomodoro Timer',
                icon: 'clock',
                lastUsed: new Date(Date.now() - 7200000).toISOString(),
              },
            ],
          },
          recentActivity: {
            spaces: [
              {
                spaceId: 'cs-370',
                spaceName: 'CS 370 Study Group',
                action: 'joined',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
              },
              {
                spaceId: 'math-club',
                spaceName: 'Math Club',
                action: 'posted',
                timestamp: new Date(Date.now() - 172800000).toISOString(),
              },
            ],
            connections: [
              {
                userId: 'user-2',
                userName: 'Sarah Chen',
                action: 'connected',
                timestamp: new Date(Date.now() - 259200000).toISOString(),
              },
            ],
          },
          upcomingEvents: [
            {
              id: 'event-1',
              title: 'CS 370 Midterm Review',
              description: 'Group study session covering data structures and algorithms',
              startDate: new Date(Date.now() + 86400000).toISOString(),
              endDate: new Date(Date.now() + 90000000).toISOString(),
              type: 'study',
              spaceId: 'cs-370',
              spaceName: 'CS 370 Study Group',
            },
            {
              id: 'event-2',
              title: 'Hackathon Kickoff',
              description: 'Join us for the opening ceremony and team formation',
              startDate: new Date(Date.now() + 172800000).toISOString(),
              endDate: new Date(Date.now() + 176400000).toISOString(),
              type: 'event',
              spaceId: 'ub-builders',
              spaceName: 'UB Builders',
            },
          ],
          stats: {
            weeklyActivity: {
              posts: 5,
              comments: 12,
              reactions: 23,
              toolsUsed: 8,
            },
            streakInfo: {
              current: 7,
              longest: 21,
              nextMilestone: 14,
            },
          },
          recommendations: includeRecommendations ? {
            spaces: [
              {
                id: 'data-science',
                name: 'Data Science Club',
                reason: 'Based on your interests in CS and Math',
                memberCount: 89,
                matchScore: 0.85,
              },
            ],
            events: [
              {
                id: 'career-fair',
                title: 'Tech Career Fair',
                date: new Date(Date.now() + 604800000).toISOString(),
                reason: 'Popular with CS students',
              },
            ],
            connections: [
              {
                userId: 'user-3',
                userName: 'Mike Rodriguez',
                reason: 'Shares 3 spaces with you',
                sharedSpaces: ['cs-370', 'ub-builders', 'math-club'],
              },
            ],
          } : undefined,
        },
      });
    }

    // Production implementation - try DDD first for user data
    const now = new Date();
    const timeRangeMs = {
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      all: Date.now(),
    }[timeRange] || 604800000;
    const _startDate = new Date(now.getTime() - timeRangeMs);

    // Get user profile via DDD for stats
    const profileRepository = getServerProfileRepository();
    const profileResult = await profileRepository.findById(userId);

    let userProfileData: {
      activityScore: number;
      connectionCount: number;
      spaces: string[];
      currentStreak?: number;
      longestStreak?: number;
    } | null = null;

    if (profileResult.isSuccess) {
      const profile = profileResult.getValue();
      userProfileData = {
        activityScore: profile.activityScore,
        connectionCount: profile.connectionCount,
        spaces: profile.spaces,
        currentStreak: 0, // Would need to add to domain model
        longestStreak: 0,
      };
      logger.debug('Dashboard using DDD profile data', { userId, spaceCount: profile.spaces.length });
    }

    // Get user's spaces with optimized limits
    const spaceMemberships = await dbAdmin
      .collection('spaces')
      .where('members', 'array-contains', userId)
      .orderBy('lastActivityAt', 'desc')
      .limit(5) // Reduced from 10 to minimize data transfer
      .get();

    const favoriteSpaces = spaceMemberships.docs.slice(0, 3).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        color: data.color || '#4F46E5',
        memberCount: data.memberCount || 0,
        lastActivity: data.lastActivityAt || data.updatedAt || new Date().toISOString(),
      };
    });

    // Get recent activity (simplified for now)
    const recentActivity = {
      spaces: spaceMemberships.docs.slice(0, 5).map(doc => ({
        spaceId: doc.id,
        spaceName: doc.data().name,
        action: 'active',
        timestamp: doc.data().lastActivityAt || new Date().toISOString(),
      })),
      connections: [], // Would need to query connections collection
    };

    // Get upcoming events from flat /events collection
    const upcomingEvents: Array<{
      id: string;
      title: string;
      description: string;
      startDate: string;
      endDate?: string;
      type: string;
      spaceId: string;
      spaceName: string;
      spaceHandle: string;
      rsvpCount: number;
      isGoing: boolean;
      isLive: boolean;
      location?: string;
      isOnline?: boolean;
    }> = [];

    const userSpaceIds = spaceMemberships.docs.map(doc => doc.id);

    if (userSpaceIds.length > 0) {
      // Query flat /events collection for events in user's spaces
      // Firestore 'in' queries support up to 30 values
      const spaceChunks = [];
      for (let i = 0; i < userSpaceIds.length; i += 30) {
        spaceChunks.push(userSpaceIds.slice(i, i + 30));
      }

      const eventQueries = spaceChunks.map(async (spaceIds) => {
        const eventsSnapshot = await dbAdmin
          .collection('events')
          .where('spaceId', 'in', spaceIds)
          .where('startDate', '>', now.toISOString())
          .orderBy('startDate')
          .limit(10)
          .get();

        return eventsSnapshot.docs;
      });

      const eventResults = await Promise.all(eventQueries);
      const allEventDocs = eventResults.flat();

      // Get RSVP status for all events in parallel
      const eventIds = allEventDocs.map(doc => doc.id);
      const rsvpQueries = eventIds.map(async (eventId) => {
        const rsvpId = `${eventId}_${userId}`;
        const rsvpDoc = await dbAdmin.collection('rsvps').doc(rsvpId).get();
        return { eventId, isGoing: rsvpDoc.exists && rsvpDoc.data()?.status === 'going' };
      });

      // Get RSVP counts for all events
      const rsvpCountQueries = eventIds.map(async (eventId) => {
        const countSnapshot = await dbAdmin
          .collection('rsvps')
          .where('eventId', '==', eventId)
          .where('status', '==', 'going')
          .get();
        return { eventId, count: countSnapshot.size };
      });

      const [rsvpStatuses, rsvpCounts] = await Promise.all([
        Promise.all(rsvpQueries),
        Promise.all(rsvpCountQueries),
      ]);

      const rsvpStatusMap = new Map(rsvpStatuses.map(r => [r.eventId, r.isGoing]));
      const rsvpCountMap = new Map(rsvpCounts.map(r => [r.eventId, r.count]));

      // Create space lookup from memberships
      const spaceDataMap = new Map(
        spaceMemberships.docs.map(doc => [doc.id, doc.data()])
      );

      for (const eventDoc of allEventDocs) {
        const eventData = eventDoc.data();
        const spaceData = spaceDataMap.get(eventData.spaceId);
        if (!spaceData) continue;

        const startDate = new Date(eventData.startDate);
        const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

        upcomingEvents.push({
          id: eventDoc.id,
          title: eventData.title,
          description: eventData.description || '',
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          type: eventData.type || 'event',
          spaceId: eventData.spaceId,
          spaceName: spaceData.name,
          spaceHandle: spaceData.slug || spaceData.handle || eventData.spaceId,
          rsvpCount: rsvpCountMap.get(eventDoc.id) || 0,
          isGoing: rsvpStatusMap.get(eventDoc.id) || false,
          isLive: startDate <= now && (!endDate || endDate > now),
          location: eventData.location,
          isOnline: eventData.isOnline,
        });
      }

      // Sort by startDate
      upcomingEvents.sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    }

    // Get user stats - prefer DDD data, fallback to Firestore
    let userData: Record<string, unknown> = {};
    if (!userProfileData) {
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      userData = userDoc.data() || {};
    }

    const dashboard = {
      quickActions: {
        favoriteSpaces,
        recentTools: [], // Would need to query tools collection
      },
      recentActivity,
      upcomingEvents: upcomingEvents.slice(0, 5),
      stats: {
        weeklyActivity: {
          posts: (userData.weeklyPosts as number) || 0,
          comments: (userData.weeklyComments as number) || 0,
          reactions: (userData.weeklyReactions as number) || 0,
          toolsUsed: (userData.weeklyToolsUsed as number) || 0,
        },
        streakInfo: {
          current: userProfileData?.currentStreak || (userData.currentStreak as number) || 0,
          longest: userProfileData?.longestStreak || (userData.longestStreak as number) || 0,
          nextMilestone: 14,
        },
        // Add DDD-sourced stats
        activityScore: userProfileData?.activityScore || 0,
        connectionCount: userProfileData?.connectionCount || 0,
        spacesJoined: userProfileData?.spaces?.length || favoriteSpaces.length,
      },
    };

    // Add recommendations if requested
    if (includeRecommendations) {
      // Fetch user interests and major for scoring
      let userInterests: string[] = [];
      let userMajor: string | undefined;

      if (profileResult.isSuccess) {
        const profile = profileResult.getValue();
        userInterests = (profile as unknown as Record<string, unknown>).interests as string[] || [];
        userMajor = (profile as unknown as Record<string, unknown>).major as string | undefined;
      }

      // Fallback: read from user doc if DDD profile didn't have interests
      if (userInterests.length === 0) {
        const userDocForInterests = await dbAdmin.collection('users').doc(userId).get();
        const userDocData = userDocForInterests.data();
        if (userDocData) {
          userInterests = (userDocData.interests as string[]) || [];
          userMajor = userMajor || (userDocData.major as string | undefined);
        }
      }

      // Get active spaces on campus for scoring
      const allSpacesSnapshot = await dbAdmin
        .collection('spaces')
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .orderBy('memberCount', 'desc')
        .limit(30)
        .get();

      const joinedSpaceIds = new Set(spaceMemberships.docs.map(doc => doc.id));
      const normalizedInterests = userInterests.map(i => i.toLowerCase());

      const scoredSpaces = allSpacesSnapshot.docs
        .filter(doc => !joinedSpaceIds.has(doc.id))
        .map(doc => {
          const spaceData = doc.data();
          const spaceName = ((spaceData.name as string) || '').toLowerCase();
          const spaceDescription = ((spaceData.description as string) || '').toLowerCase();
          const spaceCategory = ((spaceData.category as string) || '').toLowerCase();
          const spaceText = `${spaceName} ${spaceDescription}`;

          let score = 0;
          let bestReason = '';

          // +3 if category matches an interest
          for (const interest of normalizedInterests) {
            if (spaceCategory.includes(interest) || interest.includes(spaceCategory)) {
              score += 3;
              if (!bestReason) {
                bestReason = `Matches your interest in ${userInterests[normalizedInterests.indexOf(interest)]}`;
              }
              break;
            }
          }

          // +2 if name or description contains interest keyword
          for (const interest of normalizedInterests) {
            if (spaceText.includes(interest)) {
              score += 2;
              if (!bestReason) {
                bestReason = `Matches your interest in ${userInterests[normalizedInterests.indexOf(interest)]}`;
              }
              break;
            }
          }

          // +1 if major matches category or name
          if (userMajor) {
            const normalizedMajor = userMajor.toLowerCase();
            if (spaceText.includes(normalizedMajor) || spaceCategory.includes(normalizedMajor)) {
              score += 1;
              if (!bestReason) {
                bestReason = `Popular with ${userMajor} students`;
              }
            }
          }

          // Base score from popularity (0.1-0.5 range so interest matching always wins)
          const memberCount = (spaceData.memberCount as number) || 0;
          score += Math.min(0.5, memberCount / 1000);

          if (!bestReason) {
            bestReason = memberCount > 50
              ? `Popular on campus · ${memberCount} members`
              : 'Active on campus';
          }

          return {
            id: doc.id,
            name: spaceData.name as string,
            handle: (spaceData.slug as string) || (spaceData.handle as string) || doc.id,
            reason: bestReason,
            memberCount,
            matchScore: Math.min(1, score / 6),
            category: spaceCategory,
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      (dashboard as Record<string, unknown>)['recommendations'] = {
        spaces: scoredSpaces,
        events: [],
        connections: [],
      };
    }

    return respond.success({ dashboard });
  } catch (error) {
    logger.error('Failed to fetch dashboard data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    return respond.error(
      'Failed to fetch dashboard data',
      'INTERNAL_ERROR',
      { status: 500 }
    );
  }
});

export const GET = withCache(_GET, 'PRIVATE');
