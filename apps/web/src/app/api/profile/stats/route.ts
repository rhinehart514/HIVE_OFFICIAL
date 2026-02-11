import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { HttpStatus } from "@/lib/api-response-types";
import { getServerProfileRepository } from '@hive/core/server';
import { isTestUserId } from "@/lib/security-service";
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/profile/stats
 * Returns lightweight profile stats used by charts and insights
 * Response shape: { success, data: { ... } }
 */
const _GET = withAuthAndErrors(async (request, _ctx, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const timeRange = (searchParams.get('timeRange') || 'week').toLowerCase();

  try {
    // Dev users: return stable mock stats (ONLY in development)
    if (isTestUserId(userId)) {
      const mock = buildMockStats(timeRange);
      return respond.success({ data: mock });
    }

    const now = new Date();
    const start = new Date(now);
    switch (timeRange) {
      case 'day': start.setDate(now.getDate() - 1); break;
      case 'week': start.setDate(now.getDate() - 7); break;
      case 'month': start.setMonth(now.getMonth() - 1); break;
      case 'semester': start.setMonth(now.getMonth() - 4); break;
      case 'year': start.setFullYear(now.getFullYear() - 1); break;
      default: start.setMonth(now.getMonth() - 1); break;
    }

    // Try DDD repository first for profile data
    const profileRepository = getServerProfileRepository();
    const profileResult = await profileRepository.findById(userId);

    let dddProfileStats: {
      activityScore: number;
      connectionCount: number;
      spacesCount: number;
      completionPercentage: number;
    } | null = null;

    if (profileResult.isSuccess) {
      const profile = profileResult.getValue();
      dddProfileStats = {
        activityScore: profile.activityScore,
        connectionCount: profile.connectionCount,
        spacesCount: profile.spaces.length,
        completionPercentage: profile.getCompletionPercentage(),
      };
      logger.debug('Stats using DDD profile data', { userId, activityScore: profile.activityScore });
    }

    // Get user summary counters (if present) - fallback for non-DDD data
    const userSnap = await dbAdmin.collection('users').doc(userId).get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};

    // Count spaces
    const membershipsSnap = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .get();

    // Campus-filter memberships by checking space campus
    let totalSpaces = 0;
    try {
      const spaceChecks = await Promise.all(
        membershipsSnap.docs.map(async (doc) => {
          const spaceId = (doc.data() as { spaceId?: string }).spaceId || doc.id;
          const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
          return spaceDoc.exists && (spaceDoc.data()?.campusId === campusId);
        })
      );
      totalSpaces = spaceChecks.filter(Boolean).length;
    } catch {
      totalSpaces = membershipsSnap.size; // Fallback if spaces lookup fails
    }

    // Aggregate simple activity from summaries if available
    // Non-fatal if collections are missing
    let posts = 0, comments = 0, reactions = 0, toolsUsed = 0, timeSpent = 0;
    try {
      const summariesSnap = await dbAdmin
        .collection('activitySummaries')
        .where('userId', '==', userId)
        .where('campusId', '==', campusId)
        .where('date', '>=', start.toISOString().slice(0, 10))
        .get();
      summariesSnap.forEach(doc => {
        const d = doc.data();
        posts += d.posts || 0;
        comments += d.comments || 0;
        reactions += d.reactions || 0;
        toolsUsed += d.toolsUsed || 0;
        timeSpent += d.timeSpentMinutes || d.timeSpent || 0;
      });
    } catch (error) {
      // GRACEFUL DEGRADATION: Fall back to cached user data if activitySummaries unavailable
      logger.warn('Activity summaries unavailable - using cached user data', {
        userId,
        campusId,
        timeRange,
        error: error instanceof Error ? error.message : String(error),
      });
      posts = userData.weeklyPosts || 0;
      comments = userData.weeklyComments || 0;
      reactions = userData.weeklyReactions || 0;
      toolsUsed = userData.weeklyToolsUsed || 0;
      timeSpent = userData.weeklyTimeSpent || 0;
    }

    const streak = {
      current: userData.currentStreak || 0,
      longest: userData.longestStreak || 0,
      nextMilestone: 14,
    };

    const engagementScore = Math.min(100,
      Math.round((posts * 5) + (comments * 2) + reactions + (timeSpent / 6))
    );

    const data = {
      range: timeRange,
      totals: { posts, comments, reactions, toolsUsed, timeSpentMinutes: timeSpent },
      streak,
      spaces: { total: dddProfileStats?.spacesCount || totalSpaces },
      engagementScore,
      // DDD-sourced stats
      profile: dddProfileStats ? {
        activityScore: dddProfileStats.activityScore,
        connectionCount: dddProfileStats.connectionCount,
        completionPercentage: dddProfileStats.completionPercentage,
      } : null,
      generatedAt: new Date().toISOString(),
    };

    return respond.success({ data });
  } catch (error) {
    logger.error('Failed to fetch profile stats', { error: error instanceof Error ? error.message : String(error) });
    return respond.error('Failed to fetch profile stats', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

function buildMockStats(range: string) {
  const base = { posts: 6, comments: 14, reactions: 28, toolsUsed: 9, timeSpent: 420 };
  const factor = range === 'day' ? 0.2 : range === 'week' ? 1 : range === 'month' ? 4 : 8;
  const posts = Math.round(base.posts * factor);
  const comments = Math.round(base.comments * factor);
  const reactions = Math.round(base.reactions * factor);
  const toolsUsed = Math.round(base.toolsUsed * Math.max(1, factor * 0.8));
  const timeSpent = Math.round(base.timeSpent * factor);
  const engagementScore = Math.min(100, Math.round((posts * 5) + (comments * 2) + reactions + (timeSpent / 6)));
  return {
    range,
    totals: { posts, comments, reactions, toolsUsed, timeSpentMinutes: timeSpent },
    streak: { current: 7, longest: 21, nextMilestone: 14 },
    spaces: { total: 5 },
    engagementScore,
    generatedAt: new Date().toISOString(),
  };
}

export const GET = withCache(_GET, 'SHORT');
