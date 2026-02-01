/**
 * Admin Space Analytics API
 *
 * GET: Fetch platform-level space analytics
 *
 * Returns:
 * - creationTrend: spaces created per day/week
 * - activationFunnel: count of ghost/gathering/open spaces
 * - engagement: aggregate messages/week, events/week
 * - topSpaces: top 10 by engagement
 * - categoryBreakdown: count by category
 * - campusComparison: (HIVE team only) stats per campus
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';

const AnalyticsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d']).optional().default('30d'),
});

interface AnalyticsData {
  creationTrend: Array<{
    date: string;
    count: number;
  }>;
  activationFunnel: {
    ghost: number;
    gathering: number;
    open: number;
    conversionRate: number;
  };
  engagement: {
    totalMessages: number;
    messagesPerWeek: number;
    totalEvents: number;
    eventsPerWeek: number;
  };
  topSpaces: Array<{
    id: string;
    name: string;
    memberCount: number;
    engagementScore: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  campusComparison?: Array<{
    campusId: string;
    campusName: string;
    totalSpaces: number;
    activeSpaces: number;
    avgHealth: number;
  }>;
}

/**
 * GET /api/admin/spaces/analytics
 * Fetch space analytics
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = AnalyticsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const { range } = queryResult.data;
  const isHiveTeam = !campusId;

  try {
    // Calculate date range
    const now = new Date();
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    // Base query - filter by campus if school admin
    let spacesQuery = dbAdmin.collection('spaces').where('isActive', '==', true);
    if (campusId) {
      spacesQuery = spacesQuery.where('campusId', '==', campusId);
    }

    const spacesSnapshot = await spacesQuery.get();
    const spaces = spacesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 1. Creation Trend - spaces created in date range
    const creationTrend: AnalyticsData['creationTrend'] = [];
    const creationByDate = new Map<string, number>();

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      creationByDate.set(dateKey, 0);
    }

    // Count spaces by creation date
    spaces.forEach(space => {
      const createdAt = (space as { createdAt?: { toDate?: () => Date } }).createdAt?.toDate?.();
      if (createdAt && createdAt >= startDate) {
        const dateKey = createdAt.toISOString().split('T')[0];
        creationByDate.set(dateKey, (creationByDate.get(dateKey) || 0) + 1);
      }
    });

    // Convert to array
    creationByDate.forEach((count, date) => {
      creationTrend.push({ date, count });
    });
    creationTrend.sort((a, b) => a.date.localeCompare(b.date));

    // 2. Activation Funnel
    let ghost = 0;
    let gathering = 0;
    let open = 0;

    spaces.forEach(space => {
      const s = space as { activationStatus?: string; memberCount?: number; activationThreshold?: number };
      if (s.activationStatus === 'open') {
        open++;
      } else if (s.activationStatus === 'gathering') {
        gathering++;
      } else {
        // Default to ghost or calculate based on member count
        const memberCount = s.memberCount || 0;
        const threshold = s.activationThreshold || 10;
        if (memberCount >= threshold) {
          open++;
        } else if (memberCount > 0) {
          gathering++;
        } else {
          ghost++;
        }
      }
    });

    const totalForFunnel = ghost + gathering + open;
    const conversionRate = totalForFunnel > 0
      ? Math.round((open / totalForFunnel) * 100)
      : 0;

    // 3. Engagement metrics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let totalMessages = 0;
    let messagesLast7d = 0;
    let totalEvents = 0;

    // Count messages per space
    for (const space of spaces) {
      // Total messages
      const totalMsgSnapshot = await dbAdmin
        .collection('spaces')
        .doc(space.id)
        .collection('messages')
        .count()
        .get();
      totalMessages += totalMsgSnapshot.data().count;

      // Messages last 7 days
      const recentMsgSnapshot = await dbAdmin
        .collection('spaces')
        .doc(space.id)
        .collection('messages')
        .where('createdAt', '>=', sevenDaysAgo)
        .count()
        .get();
      messagesLast7d += recentMsgSnapshot.data().count;

      // Events count (using tools/events subcollection)
      const eventsSnapshot = await dbAdmin
        .collection('spaces')
        .doc(space.id)
        .collection('events')
        .count()
        .get();
      totalEvents += eventsSnapshot.data().count;
    }

    // Calculate weekly average based on range
    const weeksInRange = daysBack / 7;
    const messagesPerWeek = Math.round(messagesLast7d); // Already 7 days
    const eventsPerWeek = Math.round(totalEvents / weeksInRange);

    // 4. Top Spaces by engagement
    const spaceEngagement: Array<{
      id: string;
      name: string;
      memberCount: number;
      messageCount: number;
      engagementScore: number;
    }> = [];

    for (const space of spaces) {
      const s = space as { name?: string; memberCount?: number };
      const msgSnapshot = await dbAdmin
        .collection('spaces')
        .doc(space.id)
        .collection('messages')
        .where('createdAt', '>=', sevenDaysAgo)
        .count()
        .get();
      const recentMessages = msgSnapshot.data().count;

      // Engagement score = messages per member (normalized)
      const memberCount = s.memberCount || 1;
      const engagementScore = Math.round((recentMessages / memberCount) * 10);

      spaceEngagement.push({
        id: space.id,
        name: s.name || 'Unknown',
        memberCount,
        messageCount: recentMessages,
        engagementScore,
      });
    }

    // Sort by engagement and take top 10
    const topSpaces = spaceEngagement
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10)
      .map(({ id, name, memberCount, engagementScore }) => ({
        id,
        name,
        memberCount,
        engagementScore,
      }));

    // 5. Category Breakdown
    const categoryCount = new Map<string, number>();
    spaces.forEach(space => {
      const s = space as { category?: string };
      const category = s.category || 'uncategorized';
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    const totalSpaces = spaces.length;
    const categoryBreakdown: AnalyticsData['categoryBreakdown'] = [];
    categoryCount.forEach((count, category) => {
      categoryBreakdown.push({
        category: formatCategoryName(category),
        count,
        percentage: totalSpaces > 0 ? Math.round((count / totalSpaces) * 100) : 0,
      });
    });
    categoryBreakdown.sort((a, b) => b.count - a.count);

    // 6. Campus Comparison (HIVE team only)
    let campusComparison: AnalyticsData['campusComparison'] | undefined;

    if (isHiveTeam) {
      const campusStats = new Map<string, {
        totalSpaces: number;
        activeSpaces: number;
        totalReadiness: number;
      }>();

      // Group by campus
      spaces.forEach(space => {
        const s = space as { campusId?: string; isActive?: boolean; readinessScore?: number };
        const cId = s.campusId || 'unknown';
        const existing = campusStats.get(cId) || {
          totalSpaces: 0,
          activeSpaces: 0,
          totalReadiness: 0,
        };

        existing.totalSpaces++;
        if (s.isActive !== false) {
          existing.activeSpaces++;
        }
        existing.totalReadiness += s.readinessScore || 50;

        campusStats.set(cId, existing);
      });

      // Fetch campus names
      const campusIds = Array.from(campusStats.keys());
      const campusNames = new Map<string, string>();

      for (const cId of campusIds) {
        const campusDoc = await dbAdmin.collection('campuses').doc(cId).get();
        if (campusDoc.exists) {
          const data = campusDoc.data();
          campusNames.set(cId, data?.name || cId);
        } else {
          campusNames.set(cId, cId);
        }
      }

      campusComparison = [];
      campusStats.forEach((stats, cId) => {
        campusComparison!.push({
          campusId: cId,
          campusName: campusNames.get(cId) || cId,
          totalSpaces: stats.totalSpaces,
          activeSpaces: stats.activeSpaces,
          avgHealth: stats.totalSpaces > 0
            ? Math.round(stats.totalReadiness / stats.totalSpaces)
            : 0,
        });
      });
      campusComparison.sort((a, b) => b.totalSpaces - a.totalSpaces);
    }

    const analytics: AnalyticsData = {
      creationTrend,
      activationFunnel: {
        ghost,
        gathering,
        open,
        conversionRate,
      },
      engagement: {
        totalMessages,
        messagesPerWeek,
        totalEvents,
        eventsPerWeek,
      },
      topSpaces,
      categoryBreakdown,
      campusComparison,
    };

    logger.info('Space analytics fetched', {
      range,
      campusId,
      totalSpaces,
      isHiveTeam,
    });

    return respond.success(analytics);
  } catch (error) {
    logger.error('Failed to fetch space analytics', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch space analytics', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * Format category name for display
 */
function formatCategoryName(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
