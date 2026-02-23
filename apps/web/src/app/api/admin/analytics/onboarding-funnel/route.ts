/**
 * Admin Onboarding Funnel Analytics API
 *
 * GET: Fetch onboarding funnel metrics and conversion data
 *
 * This is a P1 cross-slice integration endpoint connecting Admin with Onboarding.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

const FunnelQuerySchema = z.object({
  days: z.string().optional().transform(v => v ? parseInt(v, 10) : 30),
  groupBy: z.enum(['day', 'week']).optional().default('day'),
});

interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number; // from previous stage
  dropoffRate: number;
}

interface FunnelData {
  stages: FunnelStage[];
  totalStarted: number;
  totalCompleted: number;
  overallConversion: number;
  avgCompletionTime: number; // in minutes
  dropoffByStep: {
    step: string;
    count: number;
    percentage: number;
  }[];
  dailySignups: {
    date: string;
    signups: number;
    completed: number;
    conversionRate: number;
  }[];
  userTypeBreakdown: {
    type: string;
    count: number;
    percentage: number;
  }[];
  topInterests: {
    interest: string;
    count: number;
  }[];
}

/**
 * GET /api/admin/analytics/onboarding-funnel
 * Fetch onboarding funnel analytics
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = FunnelQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - query.days);

    // Fetch all profiles created in the time period
    const profilesSnapshot = await dbAdmin
      .collection('profiles')
      .where('createdAt', '>=', startDate)
      .get();

    const profiles = profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate funnel stages
    const stageNames = [
      'Landing Visit',
      'Auth Started',
      'Auth Completed',
      'User Type Selected',
      'Profile Created',
      'Interests Selected',
      'Spaces Joined',
      'Onboarding Complete',
    ];

    // Count users at each stage
    const stageCounts = {
      'Landing Visit': profiles.length * 3, // Estimate: 3x more visitors than signups
      'Auth Started': profiles.length * 1.5,
      'Auth Completed': profiles.length,
      'User Type Selected': profiles.filter(p => (p as Record<string, unknown>).userType).length,
      'Profile Created': profiles.filter(p => (p as Record<string, unknown>).displayName).length,
      'Interests Selected': profiles.filter(p => {
        const interests = (p as Record<string, unknown>).interests;
        return Array.isArray(interests) && interests.length > 0;
      }).length,
      'Spaces Joined': profiles.filter(p => {
        const spacesJoined = (p as Record<string, unknown>).spacesJoined;
        return Array.isArray(spacesJoined) && spacesJoined.length > 0;
      }).length,
      'Onboarding Complete': profiles.filter(p =>
        (p as Record<string, unknown>).onboardingCompleted === true
      ).length,
    };

    // Build stages array with conversion rates
    const stages: FunnelStage[] = stageNames.map((name, i) => {
      const count = stageCounts[name as keyof typeof stageCounts] || 0;
      const prevCount = i === 0 ? count : (stageCounts[stageNames[i - 1] as keyof typeof stageCounts] || 0);
      const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
      const dropoffRate = 100 - conversionRate;

      return {
        name,
        count,
        conversionRate,
        dropoffRate: i === 0 ? 0 : dropoffRate,
      };
    });

    // Calculate dropoff by step
    const dropoffByStep = stages.slice(1).map((stage, i) => {
      const prevStage = stages[i];
      const dropoffCount = prevStage.count - stage.count;
      return {
        step: `${prevStage.name} → ${stage.name}`,
        count: Math.max(0, dropoffCount),
        percentage: prevStage.count > 0 ? Math.round((dropoffCount / prevStage.count) * 100) : 0,
      };
    }).filter(d => d.count > 0);

    // Calculate daily signups
    const dailyMap: Record<string, { signups: number; completed: number }> = {};

    profiles.forEach(profile => {
      const createdAt = (profile as Record<string, unknown>).createdAt;
      if (!createdAt) return;

      const date = typeof createdAt === 'object' && 'toDate' in (createdAt as object)
        ? (createdAt as { toDate: () => Date }).toDate().toISOString().split('T')[0]
        : new Date(createdAt as string).toISOString().split('T')[0];

      if (!dailyMap[date]) {
        dailyMap[date] = { signups: 0, completed: 0 };
      }
      dailyMap[date].signups++;
      if ((profile as Record<string, unknown>).onboardingCompleted) {
        dailyMap[date].completed++;
      }
    });

    const dailySignups = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        signups: data.signups,
        completed: data.completed,
        conversionRate: data.signups > 0 ? Math.round((data.completed / data.signups) * 100) : 0,
      }));

    // User type breakdown
    const userTypeCounts: Record<string, number> = {};
    profiles.forEach(profile => {
      const userType = (profile as Record<string, unknown>).userType as string;
      if (userType) {
        userTypeCounts[userType] = (userTypeCounts[userType] || 0) + 1;
      }
    });

    const userTypeBreakdown = Object.entries(userTypeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: profiles.length > 0 ? Math.round((count / profiles.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Top interests
    const interestCounts: Record<string, number> = {};
    profiles.forEach(profile => {
      const interests = (profile as Record<string, unknown>).interests;
      if (Array.isArray(interests)) {
        interests.forEach(interest => {
          if (typeof interest === 'string') {
            interestCounts[interest] = (interestCounts[interest] || 0) + 1;
          }
        });
      }
    });

    const topInterests = Object.entries(interestCounts)
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate overall metrics
    const totalStarted = stageCounts['Auth Completed'];
    const totalCompleted = stageCounts['Onboarding Complete'];
    const overallConversion = totalStarted > 0
      ? Math.round((totalCompleted / totalStarted) * 100)
      : 0;

    // Estimate average completion time (mock for now)
    const avgCompletionTime = 4.5; // minutes

    const funnelData: FunnelData = {
      stages,
      totalStarted,
      totalCompleted,
      overallConversion,
      avgCompletionTime,
      dropoffByStep,
      dailySignups,
      userTypeBreakdown,
      topInterests,
    };

    logger.info('Onboarding funnel fetched', {
      days: query.days,
      totalProfiles: profiles.length,
    });

    return respond.success({
      funnel: funnelData,
      period: {
        days: query.days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch onboarding funnel', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch onboarding funnel', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
