"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { getServerSpaceRepository } from "@hive/core/server";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { HttpStatus } from "@/lib/api-response-types";

const GetAnalyticsSchema = z.object({
  period: z.enum(["7d", "30d", "90d"]).default("30d"),
  metrics: z.string().optional(), // comma-separated: members,posts,events,engagement
});

/**
 * Validate space and check leader permissions for analytics access
 */
async function validateSpaceAndLeaderPermission(spaceId: string, userId: string, campusId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
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
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
  }

  const membership = membershipSnapshot.docs[0].data();
  const role = membership.role;

  // Only leaders can view analytics
  if (!["owner", "admin", "moderator"].includes(role)) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Only leaders can view analytics" };
  }

  return { ok: true as const, space, membership, role };
}

/**
 * Calculate date range based on period
 */
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
}

/**
 * Group data by day for time series
 */
function groupByDay(items: Array<{ date: Date; value: number }>): Array<{ date: string; value: number }> {
  const grouped = new Map<string, number>();

  for (const item of items) {
    const dateKey = item.date.toISOString().split('T')[0];
    grouped.set(dateKey, (grouped.get(dateKey) || 0) + item.value);
  }

  return Array.from(grouped.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * GET /api/spaces/[spaceId]/analytics
 *
 * Get space analytics including:
 * - Member growth
 * - Post activity
 * - Event participation
 * - Engagement metrics
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  const validation = await validateSpaceAndLeaderPermission(spaceId, userId, campusId);
  if (!validation.ok) {
    const code = validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    return respond.error(validation.message, code, { status: validation.status });
  }

  const queryParams = GetAnalyticsSchema.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  const { startDate, endDate } = getDateRange(queryParams.period);
  const requestedMetrics = queryParams.metrics?.split(',') || ['members', 'posts', 'events', 'engagement'];

  const analytics: Record<string, unknown> = {
    period: queryParams.period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    spaceId,
  };

  // Member metrics
  if (requestedMetrics.includes('members')) {
    const membersSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .get();

    const totalMembers = membersSnapshot.size;

    // Members who joined in period
    const newMembersSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .where('joinedAt', '>=', startDate)
      .get();

    // Member growth over time
    const memberGrowth: Array<{ date: Date; value: number }> = [];
    for (const doc of newMembersSnapshot.docs) {
      const data = doc.data();
      const joinedAt = data.joinedAt?.toDate?.() || new Date(data.joinedAt);
      memberGrowth.push({ date: joinedAt, value: 1 });
    }

    // Role distribution
    const roleDistribution: Record<string, number> = {};
    for (const doc of membersSnapshot.docs) {
      const role = doc.data().role || 'member';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    }

    analytics.members = {
      total: totalMembers,
      newInPeriod: newMembersSnapshot.size,
      growth: groupByDay(memberGrowth),
      roleDistribution,
    };
  }

  // Post metrics
  if (requestedMetrics.includes('posts')) {
    const postsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('posts')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    let totalLikes = 0;
    let totalComments = 0;
    const postActivity: Array<{ date: Date; value: number }> = [];
    const postTypes: Record<string, number> = {};

    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      // Skip hidden posts
      if (data.isHidden || data.isDeleted || data.status === 'removed') continue;

      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      postActivity.push({ date: createdAt, value: 1 });

      totalLikes += Object.values(data.reactions || {}).reduce((sum: number, count) => sum + (count as number), 0);
      totalComments += data.commentCount || 0;

      const type = data.type || 'text';
      postTypes[type] = (postTypes[type] || 0) + 1;
    }

    analytics.posts = {
      total: postsSnapshot.size,
      totalLikes,
      totalComments,
      activity: groupByDay(postActivity),
      typeDistribution: postTypes,
      averageEngagement: postsSnapshot.size > 0
        ? Math.round((totalLikes + totalComments) / postsSnapshot.size * 100) / 100
        : 0,
    };
  }

  // Event metrics
  if (requestedMetrics.includes('events')) {
    const eventsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('events')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    let totalRSVPs = 0;
    const eventActivity: Array<{ date: Date; value: number }> = [];
    const eventTypes: Record<string, number> = {};

    for (const doc of eventsSnapshot.docs) {
      const data = doc.data();
      // Skip hidden events
      if (data.isHidden || data.isDeleted || data.status === 'cancelled') continue;

      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      eventActivity.push({ date: createdAt, value: 1 });

      totalRSVPs += data.currentAttendees || 0;

      const type = data.type || 'general';
      eventTypes[type] = (eventTypes[type] || 0) + 1;
    }

    // Upcoming events count
    const upcomingEventsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('events')
      .where('startDate', '>=', new Date())
      .get();

    analytics.events = {
      total: eventsSnapshot.size,
      totalRSVPs,
      upcoming: upcomingEventsSnapshot.size,
      activity: groupByDay(eventActivity),
      typeDistribution: eventTypes,
    };
  }

  // Engagement metrics (based on activity events)
  if (requestedMetrics.includes('engagement')) {
    const activitySnapshot = await dbAdmin
      .collection('activityEvents')
      .where('spaceId', '==', spaceId)
      .where('timestamp', '>=', startDate.toISOString())
      .where('timestamp', '<=', endDate.toISOString())
      .get();

    const actionTypes: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const dailyActiveUsers: Array<{ date: Date; value: Set<string> }> = [];

    for (const doc of activitySnapshot.docs) {
      const data = doc.data();
      const type = data.type || 'unknown';
      actionTypes[type] = (actionTypes[type] || 0) + 1;

      if (data.userId) {
        uniqueUsers.add(data.userId);
      }
    }

    analytics.engagement = {
      totalActions: activitySnapshot.size,
      uniqueActiveUsers: uniqueUsers.size,
      actionBreakdown: actionTypes,
      engagementRate: analytics.members
        ? Math.round((uniqueUsers.size / (analytics.members as { total: number }).total) * 100)
        : 0,
    };
  }

  // Summary metrics
  analytics.summary = {
    healthScore: calculateHealthScore(analytics),
    topInsights: generateInsights(analytics),
  };

  logger.info('Space analytics fetched', {
    spaceId,
    userId,
    period: queryParams.period,
    endpoint: '/api/spaces/[spaceId]/analytics'
  });

  return respond.success(analytics);
});

/**
 * Calculate a health score (0-100) based on metrics
 */
function calculateHealthScore(analytics: Record<string, unknown>): number {
  let score = 50; // Base score

  const members = analytics.members as { total: number; newInPeriod: number } | undefined;
  const posts = analytics.posts as { total: number; averageEngagement: number } | undefined;
  const engagement = analytics.engagement as { engagementRate: number } | undefined;

  if (members) {
    // Member growth bonus
    if (members.newInPeriod > 0) score += Math.min(20, members.newInPeriod * 2);
    // Active community size
    if (members.total >= 10) score += 10;
  }

  if (posts) {
    // Content creation activity
    if (posts.total > 0) score += Math.min(10, posts.total);
    // Engagement quality
    if (posts.averageEngagement > 2) score += 5;
  }

  if (engagement) {
    // Active user rate
    score += Math.min(10, engagement.engagementRate / 5);
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Generate actionable insights based on metrics
 */
function generateInsights(analytics: Record<string, unknown>): string[] {
  const insights: string[] = [];

  const members = analytics.members as { total: number; newInPeriod: number } | undefined;
  const posts = analytics.posts as { total: number; averageEngagement: number } | undefined;
  const events = analytics.events as { upcoming: number; total: number } | undefined;
  const engagement = analytics.engagement as { engagementRate: number } | undefined;

  if (members) {
    if (members.newInPeriod === 0) {
      insights.push("No new members this period. Consider promoting your space.");
    } else if (members.newInPeriod > 5) {
      insights.push(`Great growth! ${members.newInPeriod} new members joined.`);
    }
  }

  if (posts) {
    if (posts.total === 0) {
      insights.push("No posts this period. Encourage members to share content.");
    }
    if (posts.averageEngagement < 1) {
      insights.push("Low post engagement. Try asking questions to spark discussion.");
    }
  }

  if (events) {
    if (events.upcoming === 0) {
      insights.push("No upcoming events. Consider scheduling one to boost engagement.");
    }
  }

  if (engagement) {
    if (engagement.engagementRate < 20) {
      insights.push("Low engagement rate. Try tagging members or hosting activities.");
    } else if (engagement.engagementRate > 50) {
      insights.push("Excellent engagement! Your community is very active.");
    }
  }

  return insights.slice(0, 5); // Max 5 insights
}
