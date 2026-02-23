import { type NextRequest } from 'next/server';
// Use admin SDK methods since we're in an API route
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { logger } from "@/lib/logger";
import { getServerProfileRepository } from '@hive/core/server';
import { withCache } from '../../../../lib/cache-headers';

// Internal membership data structure
interface MembershipData {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  lastActivity: string;
  [key: string]: unknown;
}

// Space membership interface for profile
interface ProfileSpaceMembership {
  spaceId: string;
  spaceName: string;
  spaceDescription?: string;
  spaceType: string;
  memberCount: number;
  role: 'member' | 'moderator' | 'admin' | 'builder';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  lastActivity: string;
  activityLevel: 'high' | 'medium' | 'low';
  recentActivity: {
    posts: number;
    interactions: number;
    toolUsage: number;
    timeSpent: number; // in minutes
  };
  notifications: {
    unreadCount: number;
    hasImportantUpdates: boolean;
  };
  quickStats: {
    myPosts: number;
    myTools: number;
    myInteractions: number;
  };
}

// Space activity summary
interface SpaceActivitySummary {
  totalSpaces: number;
  activeSpaces: number;
  totalTimeSpent: number;
  favoriteSpace: {
    spaceId: string;
    spaceName: string;
    timeSpent: number;
  } | null;
  activityDistribution: {
    spaceId: string;
    spaceName: string;
    percentage: number;
    timeSpent: number;
  }[];
  weeklyTrend: {
    week: string;
    activeSpaces: number;
    totalTime: number;
  }[];
}

// GET - Fetch user's space memberships for profile
const _GET = withAuthAndErrors(async (request: NextRequest, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  const { searchParams } = new URL(request.url);
  const includeActivity = searchParams.get('includeActivity') !== 'false';
  const timeRange = searchParams.get('timeRange') || 'week'; // week, month, all

  // Try DDD repository for profile data
  const profileRepository = getServerProfileRepository();
  const profileResult = await profileRepository.findById(userId);

  let dddProfileData: {
    spaceIds: string[];
    connectionCount: number;
    activityScore: number;
  } | null = null;

  if (profileResult.isSuccess) {
    const profile = profileResult.getValue();
    dddProfileData = {
      spaceIds: profile.spaces,
      connectionCount: profile.connectionCount,
      activityScore: profile.activityScore,
    };
    logger.debug('Using DDD profile for spaces endpoint', { userId, spaceCount: profile.spaces.length });
  }

  // Fetch user's memberships — campusId filter omitted (index exempted; userId scopes query)
  const membershipsSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .orderBy('joinedAt', 'desc')
    .get();
  const memberships: MembershipData[] = membershipsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const joinedAt =
      data.joinedAt?.toDate?.()?.toISOString() ||
      (typeof data.joinedAt === 'string' ? data.joinedAt : new Date().toISOString());
    const lastActivity =
      data.lastActive?.toDate?.()?.toISOString() ||
      (typeof data.lastActive === 'string' ? data.lastActive : joinedAt);
    return {
      id: data.spaceId || doc.id,
      role: data.role || 'member',
      status: data.isActive === false ? 'inactive' : 'active',
      joinedAt,
      lastActivity,
      ...data,
    };
  });

  // Fetch space details for each membership
  const spaceMemberships: (ProfileSpaceMembership | null)[] = await Promise.all(
    memberships.map(async (membership) => {
      try {
        const spaceDoc = await dbAdmin.collection('spaces').doc(membership.id).get();
        if (!spaceDoc.exists) {
          return null;
        }

        const spaceData = spaceDoc.data();
        if (!spaceData) {
          return null;
        }
        // Enforce campus isolation
        if (spaceData.campusId && spaceData.campusId !== campusId) {
          return null;
        }

        // Calculate activity level and recent activity
        const recentActivity = includeActivity ?
          await getSpaceActivityForUser(userId, membership.id, timeRange, campusId) :
          { posts: 0, interactions: 0, toolUsage: 0, timeSpent: 0 };

        const activityLevel = calculateActivityLevel(recentActivity);

        // Notifications and quick stats - return defaults until systems are built
        const notifications = { unreadCount: 0, hasImportantUpdates: false };
        const quickStats = { myPosts: 0, myTools: 0, myInteractions: 0 };

        return {
          spaceId: membership.id,
          spaceName: spaceData.name || 'Unknown Space',
          spaceDescription: spaceData.description || '',
          spaceType: spaceData.type || spaceData.category || 'general',
          memberCount:
            spaceData.metrics?.memberCount ??
            spaceData.memberCount ??
            spaceData.metrics?.activeMembers ??
            0,
          role: (membership.role || 'member') as 'member' | 'moderator' | 'admin' | 'builder',
          status: (membership.status || 'active') as 'active' | 'inactive' | 'pending',
          joinedAt: membership.joinedAt || new Date().toISOString(),
          lastActivity: membership.lastActivity || new Date().toISOString(),
          activityLevel,
          recentActivity,
          notifications,
          quickStats
        };
      } catch (error) {
        logger.error('Error fetching space data for', { spaceId: membership.id, error: { error: error instanceof Error ? error.message : String(error) }, endpoint: '/api/profile/spaces' });
        return null;
      }
    })
  );

  // Filter out null results - ensure type safety
  const validSpaceMemberships = spaceMemberships.filter((membership): membership is ProfileSpaceMembership => membership !== null);

  // Generate activity summary
  const activitySummary = includeActivity ?
    generateSpaceActivitySummary(validSpaceMemberships, timeRange) :
    null;

  return respond.success({
    memberships: validSpaceMemberships,
    activitySummary,
    totalCount: validSpaceMemberships.length,
    activeCount: validSpaceMemberships.filter(m => m.status === 'active').length,
    timeRange,
    // Include DDD profile data if available
    profile: dddProfileData ? {
      dddSpaceCount: dddProfileData.spaceIds.length,
      connectionCount: dddProfileData.connectionCount,
      activityScore: dddProfileData.activityScore,
      syncStatus: dddProfileData.spaceIds.length === validSpaceMemberships.length ? 'synced' : 'needs_sync'
    } : null
  });
});

// Helper function to get space activity for user
async function getSpaceActivityForUser(userId: string, spaceId: string, timeRange: string, campusId: string) {
  try {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'all':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get activity events for this space — campusId filter omitted (index exempted; userId+spaceId scopes query)
    const activitySnapshot = await dbAdmin.collection('activityEvents')
      .where('userId', '==', userId)
      .where('spaceId', '==', spaceId)
      .where('date', '>=', startDateStr)
      .where('date', '<=', endDateStr)
      .get();
    const activities = activitySnapshot.docs.map(doc => doc.data());

    // Aggregate activity data
    const recentActivity = {
      posts: activities.filter(a => a.type === 'content_creation').length,
      interactions: activities.filter(a => a.type === 'social_interaction').length,
      toolUsage: activities.filter(a => a.type === 'tool_interaction').length,
      timeSpent: activities.reduce((sum, a) => sum + (a.duration ? Math.round(a.duration / 60) : 0), 0)
    };

    return recentActivity;
  } catch (error) {
    logger.error(
      `Error getting space activity at /api/profile/spaces`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return { posts: 0, interactions: 0, toolUsage: 0, timeSpent: 0 };
  }
}

// Helper function to calculate activity level
function calculateActivityLevel(activity: { posts: number; interactions: number; toolUsage: number; timeSpent: number }): 'high' | 'medium' | 'low' {
  const totalActivity = activity.posts + activity.interactions + activity.toolUsage;
  const timeSpent = activity.timeSpent;

  if (totalActivity >= 10 || timeSpent >= 60) {
    return 'high';
  } else if (totalActivity >= 3 || timeSpent >= 20) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Helper function to generate space activity summary
function generateSpaceActivitySummary(memberships: ProfileSpaceMembership[], timeRange: string): SpaceActivitySummary {
  const totalSpaces = memberships.length;
  const activeSpaces = memberships.filter(m => m.activityLevel !== 'low').length;
  const totalTimeSpent = memberships.reduce((sum, m) => sum + m.recentActivity.timeSpent, 0);

  // Find favorite space (most time spent)
  const favoriteSpace = memberships.length > 0 ?
    memberships.reduce((max, current) =>
      current.recentActivity.timeSpent > max.recentActivity.timeSpent ? current : max
    ) : null;

  // Calculate activity distribution
  const activityDistribution = memberships
    .filter(m => m.recentActivity.timeSpent > 0)
    .map(m => ({
      spaceId: m.spaceId,
      spaceName: m.spaceName,
      percentage: totalTimeSpent > 0 ? Math.round((m.recentActivity.timeSpent / totalTimeSpent) * 100) : 0,
      timeSpent: m.recentActivity.timeSpent
    }))
    .sort((a, b) => b.timeSpent - a.timeSpent);

  // Generate weekly trend (simplified - would need more complex logic for real data)
  const weeklyTrend = generateWeeklyTrend(memberships, timeRange);

  return {
    totalSpaces,
    activeSpaces,
    totalTimeSpent,
    favoriteSpace: favoriteSpace ? {
      spaceId: favoriteSpace.spaceId,
      spaceName: favoriteSpace.spaceName,
      timeSpent: favoriteSpace.recentActivity.timeSpent
    } : null,
    activityDistribution,
    weeklyTrend
  };
}

// Helper function to generate weekly trend
function generateWeeklyTrend(memberships: ProfileSpaceMembership[], timeRange: string) {
  // This is a simplified version - in reality, you'd query historical data
  const weeks = [];
  const weeksToShow = timeRange === 'month' ? 4 : timeRange === 'week' ? 1 : 12;

  for (let i = weeksToShow - 1; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));

    weeks.push({
      week: weekStart.toISOString().split('T')[0],
      activeSpaces: Math.max(1, memberships.filter(m => m.activityLevel !== 'low').length - i),
      totalTime: Math.max(0, memberships.reduce((sum, m) => sum + m.recentActivity.timeSpent, 0) - (i * 10))
    });
  }

  return weeks;
}

export const GET = withCache(_GET, 'SHORT');
