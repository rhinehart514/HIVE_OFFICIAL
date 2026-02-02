import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { HttpStatus } from "@/lib/api-response-types";
import { isTestUserId } from "@/lib/security-service";

/**
 * GET /api/profile/[userId]/activity
 *
 * Returns daily activity contributions for the profile heatmap.
 * Data sourced from activitySummaries collection.
 *
 * Query params:
 * - days: number of days to fetch (default: 365)
 *
 * Response: { success, data: { contributions: ActivityContribution[], totalCount, currentStreak } }
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ userId: string }> },
  respond
) => {
  const viewerId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);

  const { userId: targetUserId } = await params;
  const days = Math.min(parseInt(searchParams.get('days') || '365', 10), 365);

  if (!targetUserId) {
    return respond.error('User ID required', 'INVALID_REQUEST', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  try {
    // Check if target user exists and is on same campus
    const targetUserDoc = await dbAdmin.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return respond.error('User not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const targetUserData = targetUserDoc.data() || {};

    // Campus isolation: only show activity for same-campus users
    if (targetUserData.campusId !== campusId && !isTestUserId(viewerId)) {
      return respond.error('User not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0, 10);

    // For dev/test users, return mock data
    if (isTestUserId(targetUserId)) {
      const mockContributions = generateMockContributions(days);
      return respond.success({
        data: {
          contributions: mockContributions,
          totalCount: mockContributions.reduce((sum, c) => sum + c.count, 0),
          currentStreak: 7,
        },
      });
    }

    // Fetch activity summaries for the date range
    let contributions: Array<{ date: string; count: number }> = [];

    try {
      const summariesSnap = await dbAdmin
        .collection('activitySummaries')
        .where('userId', '==', targetUserId)
        .where('campusId', '==', campusId)
        .where('date', '>=', startDateStr)
        .orderBy('date', 'asc')
        .get();

      contributions = summariesSnap.docs.map((doc) => {
        const data = doc.data();
        // Count total activities: posts + comments + reactions + toolsUsed
        const count =
          (data.posts || 0) +
          (data.comments || 0) +
          (data.reactions || 0) +
          (data.toolsUsed || 0) +
          (data.messagesCount || 0);

        return {
          date: data.date as string,
          count,
        };
      });
    } catch (activityError) {
      // GRACEFUL DEGRADATION: If activitySummaries doesn't exist or query fails,
      // return empty contributions rather than erroring
      logger.warn('Activity summaries unavailable - returning empty contributions', {
        userId: targetUserId,
        campusId,
        error: activityError instanceof Error ? activityError.message : String(activityError),
      });
      contributions = [];
    }

    // Get streak from user data
    const currentStreak = targetUserData.currentStreak || 0;

    // Calculate total count
    const totalCount = contributions.reduce((sum, c) => sum + c.count, 0);

    return respond.success({
      data: {
        contributions,
        totalCount,
        currentStreak,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch profile activity', {
      userId: targetUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch activity data', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * Generate mock activity data for dev/test users
 */
function generateMockContributions(days: number): Array<{ date: string; count: number }> {
  const contributions: Array<{ date: string; count: number }> = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    // Generate realistic-looking activity pattern
    // More active on weekdays, some variance
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseActivity = isWeekend ? 2 : 5;

    // Add some randomness based on date hash for consistency
    const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variance = (hash % 10) - 5;
    const count = Math.max(0, baseActivity + variance);

    // Only include days with activity (sparse data like GitHub)
    if (count > 0) {
      contributions.push({ date: dateStr, count });
    }
  }

  return contributions;
}
