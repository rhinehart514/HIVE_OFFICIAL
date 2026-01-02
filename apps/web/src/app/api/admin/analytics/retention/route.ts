/**
 * Admin Retention Cohorts Analytics API
 *
 * GET: Fetch user retention cohort analysis
 *
 * Provides week-over-week retention rates showing how well users
 * are retained after their signup week.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { dbAdmin } from '@/lib/firebase-admin';

const RetentionQuerySchema = z.object({
  weeks: z.string().optional().transform(v => v ? parseInt(v, 10) : 8),
});

interface CohortWeek {
  weekStart: string;
  signups: number;
  retentionByWeek: number[]; // Percentage retained at week 1, 2, 3, etc.
}

interface RetentionData {
  cohorts: CohortWeek[];
  avgRetention: {
    week1: number;
    week2: number;
    week4: number;
    week8: number;
  };
  churnRate: number;
  bestCohort: {
    week: string;
    retention: number;
  };
  worstCohort: {
    week: string;
    retention: number;
  };
}

/**
 * GET /api/admin/analytics/retention
 * Fetch user retention cohort analysis
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const { searchParams } = new URL(request.url);
  const queryResult = RetentionQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const { weeks } = queryResult.data;

  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (weeks * 7));

    // Fetch all profiles created in the time period
    const profilesSnapshot = await dbAdmin
      .collection('profiles')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .where('createdAt', '>=', startDate)
      .get();

    const profiles = profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Group users by signup week
    const weeklySignups: Record<string, Array<{ id: string; createdAt: Date; lastActiveAt?: Date }>> = {};

    profiles.forEach(profile => {
      const createdAt = (profile as Record<string, unknown>).createdAt;
      if (!createdAt) return;

      const createdDate = typeof createdAt === 'object' && 'toDate' in (createdAt as object)
        ? (createdAt as { toDate: () => Date }).toDate()
        : new Date(createdAt as string);

      // Get week start (Monday)
      const weekStart = new Date(createdDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];

      const lastActive = (profile as Record<string, unknown>).lastActiveAt;
      const lastActiveDate = lastActive
        ? (typeof lastActive === 'object' && 'toDate' in (lastActive as object)
          ? (lastActive as { toDate: () => Date }).toDate()
          : new Date(lastActive as string))
        : undefined;

      if (!weeklySignups[weekKey]) {
        weeklySignups[weekKey] = [];
      }
      weeklySignups[weekKey].push({
        id: (profile as Record<string, unknown>).id as string,
        createdAt: createdDate,
        lastActiveAt: lastActiveDate,
      });
    });

    // Calculate retention for each cohort
    const cohorts: CohortWeek[] = [];
    const sortedWeeks = Object.keys(weeklySignups).sort();

    sortedWeeks.forEach(weekKey => {
      const users = weeklySignups[weekKey];
      const weekStart = new Date(weekKey);
      const signups = users.length;

      // Calculate retention for each subsequent week
      const retentionByWeek: number[] = [];

      for (let w = 1; w <= 8; w++) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + (w * 7));

        // Skip future weeks
        if (weekEnd > now) {
          break;
        }

        // Count users active during this week
        const activeInWeek = users.filter(user => {
          if (!user.lastActiveAt) return false;
          return user.lastActiveAt >= new Date(weekStart.getTime() + ((w - 1) * 7 * 24 * 60 * 60 * 1000)) &&
                 user.lastActiveAt <= weekEnd;
        }).length;

        const retention = signups > 0 ? Math.round((activeInWeek / signups) * 100) : 0;
        retentionByWeek.push(retention);
      }

      cohorts.push({
        weekStart: weekKey,
        signups,
        retentionByWeek,
      });
    });

    // Calculate average retention rates
    const week1Rates = cohorts.filter(c => c.retentionByWeek.length >= 1).map(c => c.retentionByWeek[0]);
    const week2Rates = cohorts.filter(c => c.retentionByWeek.length >= 2).map(c => c.retentionByWeek[1]);
    const week4Rates = cohorts.filter(c => c.retentionByWeek.length >= 4).map(c => c.retentionByWeek[3]);
    const week8Rates = cohorts.filter(c => c.retentionByWeek.length >= 8).map(c => c.retentionByWeek[7]);

    const avgRetention = {
      week1: week1Rates.length > 0 ? Math.round(week1Rates.reduce((a, b) => a + b, 0) / week1Rates.length) : 0,
      week2: week2Rates.length > 0 ? Math.round(week2Rates.reduce((a, b) => a + b, 0) / week2Rates.length) : 0,
      week4: week4Rates.length > 0 ? Math.round(week4Rates.reduce((a, b) => a + b, 0) / week4Rates.length) : 0,
      week8: week8Rates.length > 0 ? Math.round(week8Rates.reduce((a, b) => a + b, 0) / week8Rates.length) : 0,
    };

    // Calculate churn rate (100 - week1 retention)
    const churnRate = 100 - avgRetention.week1;

    // Find best and worst cohorts (by week 1 retention)
    const cohortsWithWeek1 = cohorts.filter(c => c.retentionByWeek.length >= 1);
    let bestCohort = { week: '', retention: 0 };
    let worstCohort = { week: '', retention: 100 };

    cohortsWithWeek1.forEach(cohort => {
      if (cohort.retentionByWeek[0] > bestCohort.retention) {
        bestCohort = { week: cohort.weekStart, retention: cohort.retentionByWeek[0] };
      }
      if (cohort.retentionByWeek[0] < worstCohort.retention) {
        worstCohort = { week: cohort.weekStart, retention: cohort.retentionByWeek[0] };
      }
    });

    const retentionData: RetentionData = {
      cohorts,
      avgRetention,
      churnRate,
      bestCohort,
      worstCohort,
    };

    logger.info('Retention analytics fetched', {
      weeks,
      totalCohorts: cohorts.length,
      avgWeek1Retention: avgRetention.week1,
    });

    return respond.success({
      retention: retentionData,
      period: {
        weeks,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch retention analytics', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch retention analytics', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
