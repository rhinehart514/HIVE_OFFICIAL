/**
 * Admin Growth Analytics API
 *
 * GET: Fetch user growth metrics (DAU, WAU, MAU, trends)
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

const GrowthQuerySchema = z.object({
  days: z.string().optional().transform(v => v ? parseInt(v, 10) : 30),
});

interface DailyMetric {
  date: string;
  value: number;
}

interface GrowthData {
  // Current metrics
  dau: number; // Daily Active Users
  wau: number; // Weekly Active Users
  mau: number; // Monthly Active Users
  totalUsers: number;

  // Trends (percentage change)
  dauTrend: number;
  wauTrend: number;
  mauTrend: number;
  growthRate: number; // New users this period vs last

  // Historical data
  dailyActiveUsers: DailyMetric[];
  dailySignups: DailyMetric[];
  cumulativeUsers: DailyMetric[];

  // Engagement
  avgSessionsPerUser: number;
  avgMessagesPerUser: number;
  activeRatio: number; // DAU/MAU ratio
}

/**
 * GET /api/admin/analytics/growth
 * Fetch user growth and engagement metrics
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = GrowthQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const { days } = queryResult.data;

  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Get all profiles for analysis
    const allProfilesSnapshot = await dbAdmin
      .collection('profiles')
      .where('campusId', '==', campusId)
      .get();

    const profiles = allProfilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalUsers = profiles.length;

    // Calculate DAU, WAU, MAU based on lastActiveAt
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    let dau = 0, dauPrev = 0;
    let wau = 0, wauPrev = 0;
    let mau = 0, mauPrev = 0;

    profiles.forEach(profile => {
      const lastActive = (profile as Record<string, unknown>).lastActiveAt;
      if (!lastActive) return;

      const lastActiveDate = typeof lastActive === 'object' && 'toDate' in (lastActive as object)
        ? (lastActive as { toDate: () => Date }).toDate()
        : new Date(lastActive as string);

      // Current period
      if (lastActiveDate >= oneDayAgo) dau++;
      if (lastActiveDate >= oneWeekAgo) wau++;
      if (lastActiveDate >= oneMonthAgo) mau++;

      // Previous period (for trend calculation)
      if (lastActiveDate >= twoDaysAgo && lastActiveDate < oneDayAgo) dauPrev++;
      if (lastActiveDate >= twoWeeksAgo && lastActiveDate < oneWeekAgo) wauPrev++;
      if (lastActiveDate >= twoMonthsAgo && lastActiveDate < oneMonthAgo) mauPrev++;
    });

    // Calculate trends
    const dauTrend = dauPrev > 0 ? Math.round(((dau - dauPrev) / dauPrev) * 100) : 0;
    const wauTrend = wauPrev > 0 ? Math.round(((wau - wauPrev) / wauPrev) * 100) : 0;
    const mauTrend = mauPrev > 0 ? Math.round(((mau - mauPrev) / mauPrev) * 100) : 0;

    // Calculate daily metrics
    const dailyActiveUsers: DailyMetric[] = [];
    const dailySignups: DailyMetric[] = [];
    const cumulativeUsers: DailyMetric[] = [];

    // Build daily maps
    const signupsByDate: Record<string, number> = {};
    const activeByDate: Record<string, Set<string>> = {};

    profiles.forEach(profile => {
      const createdAt = (profile as Record<string, unknown>).createdAt;
      const lastActive = (profile as Record<string, unknown>).lastActiveAt;

      if (createdAt) {
        const date = typeof createdAt === 'object' && 'toDate' in (createdAt as object)
          ? (createdAt as { toDate: () => Date }).toDate().toISOString().split('T')[0]
          : new Date(createdAt as string).toISOString().split('T')[0];

        if (new Date(date) >= startDate) {
          signupsByDate[date] = (signupsByDate[date] || 0) + 1;
        }
      }

      if (lastActive) {
        const date = typeof lastActive === 'object' && 'toDate' in (lastActive as object)
          ? (lastActive as { toDate: () => Date }).toDate().toISOString().split('T')[0]
          : new Date(lastActive as string).toISOString().split('T')[0];

        if (new Date(date) >= startDate) {
          if (!activeByDate[date]) activeByDate[date] = new Set();
          activeByDate[date].add((profile as Record<string, unknown>).id as string);
        }
      }
    });

    // Generate date range
    let cumulative = profiles.filter(p => {
      const createdAt = (p as Record<string, unknown>).createdAt;
      if (!createdAt) return false;
      const date = typeof createdAt === 'object' && 'toDate' in (createdAt as object)
        ? (createdAt as { toDate: () => Date }).toDate()
        : new Date(createdAt as string);
      return date < startDate;
    }).length;

    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      const signups = signupsByDate[dateStr] || 0;
      cumulative += signups;

      dailySignups.push({ date: dateStr, value: signups });
      dailyActiveUsers.push({ date: dateStr, value: activeByDate[dateStr]?.size || 0 });
      cumulativeUsers.push({ date: dateStr, value: cumulative });
    }

    // Calculate growth rate
    const signupsThisPeriod = Object.values(signupsByDate).reduce((a, b) => a + b, 0);
    const signupsPreviousPeriod = profiles.filter(p => {
      const createdAt = (p as Record<string, unknown>).createdAt;
      if (!createdAt) return false;
      const date = typeof createdAt === 'object' && 'toDate' in (createdAt as object)
        ? (createdAt as { toDate: () => Date }).toDate()
        : new Date(createdAt as string);
      return date >= previousStartDate && date < startDate;
    }).length;

    const growthRate = signupsPreviousPeriod > 0
      ? Math.round(((signupsThisPeriod - signupsPreviousPeriod) / signupsPreviousPeriod) * 100)
      : signupsThisPeriod > 0 ? 100 : 0;

    // Calculate engagement metrics
    const activeRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0;

    // Mock session and message data (would come from actual analytics)
    const avgSessionsPerUser = 3.2;
    const avgMessagesPerUser = 12.5;

    const growthData: GrowthData = {
      dau,
      wau,
      mau,
      totalUsers,
      dauTrend,
      wauTrend,
      mauTrend,
      growthRate,
      dailyActiveUsers,
      dailySignups,
      cumulativeUsers,
      avgSessionsPerUser,
      avgMessagesPerUser,
      activeRatio,
    };

    logger.info('Growth analytics fetched', {
      days,
      totalUsers,
      dau,
      wau,
      mau,
    });

    return respond.success({
      growth: growthData,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch growth analytics', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch growth analytics', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
