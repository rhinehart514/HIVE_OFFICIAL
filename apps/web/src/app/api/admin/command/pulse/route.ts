/**
 * Command Center - Pulse API
 *
 * Real-time platform heartbeat metrics for executive dashboard.
 * Returns current snapshot of key metrics from adminMetrics collection.
 *
 * GET: Returns real-time pulse metrics
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';

interface PulseMetrics {
  // Core numbers
  activeUsers: number;
  totalUsers: number;
  totalSpaces: number;
  totalEvents: number;
  postsToday: number;

  // Queue counts
  reportsPending: number;
  toolsPending: number;
  claimsPending: number;
  appealsPending: number;

  // Growth indicators
  weeklyGrowth: {
    users: number;
    spaces: number;
    engagement: number;
  };

  // Health
  spacesAtRisk: number;

  // Timestamp
  updatedAt: string;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'space_created' | 'event_created' | 'post_created' | 'tool_deployed';
  entityId: string;
  entityName: string;
  timestamp: string;
}

/**
 * GET /api/admin/command/pulse
 * Returns real-time pulse metrics for Command Center dashboard
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  logger.info('command_pulse_fetch', { adminId, campusId });

  try {
    // Try to get cached metrics from adminMetrics collection
    const metricsDoc = await dbAdmin
      .collection('adminMetrics')
      .doc(campusId)
      .get();

    if (metricsDoc.exists) {
      const data = metricsDoc.data();

      const pulse: PulseMetrics = {
        activeUsers: data?.activeUsers24h || 0,
        totalUsers: data?.totalUsers || 0,
        totalSpaces: data?.totalSpaces || 0,
        totalEvents: data?.totalEvents || 0,
        postsToday: data?.postsToday || 0,
        reportsPending: data?.reportsPending || 0,
        toolsPending: data?.toolsPending || 0,
        claimsPending: data?.claimsPending || 0,
        appealsPending: data?.appealsPending || 0,
        weeklyGrowth: data?.weeklyGrowth || { users: 0, spaces: 0, engagement: 0 },
        spacesAtRisk: data?.spacesAtRisk?.length || 0,
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };

      // Format recent activity
      const recentActivity: RecentActivity[] = (data?.recentActivity || [])
        .slice(0, 10)
        .map((activity: { type: string; entityId: string; entityName: string; timestamp: { toDate?: () => Date } }, index: number) => ({
          id: `${activity.type}-${index}`,
          type: activity.type as RecentActivity['type'],
          entityId: activity.entityId,
          entityName: activity.entityName,
          timestamp: activity.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));

      logger.info('command_pulse_success', {
        adminId,
        campusId,
        cached: true,
        activeUsers: pulse.activeUsers,
      });

      return respond.success({
        pulse,
        recentActivity,
        source: 'cached',
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback: Calculate metrics on the fly
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalSpaces,
      totalEvents,
      postsToday,
      reportsPending,
      toolsPending,
    ] = await Promise.all([
      dbAdmin.collection('profiles')
        .where('campusId', '==', campusId)
        .count()
        .get(),
      dbAdmin.collection('profiles')
        .where('campusId', '==', campusId)
        .where('lastActive', '>=', yesterday)
        .count()
        .get(),
      dbAdmin.collection('spaces')
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .count()
        .get(),
      dbAdmin.collection('events')
        .where('campusId', '==', campusId)
        .count()
        .get(),
      dbAdmin.collection('posts')
        .where('campusId', '==', campusId)
        .where('createdAt', '>=', today)
        .count()
        .get(),
      dbAdmin.collection('contentReports')
        .where('campusId', '==', campusId)
        .where('status', '==', 'pending')
        .count()
        .get(),
      dbAdmin.collection('toolPublishRequests')
        .where('campusId', '==', campusId)
        .where('status', '==', 'pending')
        .count()
        .get(),
    ]);

    const pulse: PulseMetrics = {
      activeUsers: activeUsers.data().count,
      totalUsers: totalUsers.data().count,
      totalSpaces: totalSpaces.data().count,
      totalEvents: totalEvents.data().count,
      postsToday: postsToday.data().count,
      reportsPending: reportsPending.data().count,
      toolsPending: toolsPending.data().count,
      claimsPending: 0,
      appealsPending: 0,
      weeklyGrowth: { users: 0, spaces: 0, engagement: 0 },
      spacesAtRisk: 0,
      updatedAt: new Date().toISOString(),
    };

    // Get recent activity
    const recentUsersSnapshot = await dbAdmin
      .collection('profiles')
      .where('campusId', '==', campusId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recentActivity: RecentActivity[] = recentUsersSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: `user-${index}`,
        type: 'user_signup' as const,
        entityId: doc.id,
        entityName: data.displayName || data.handle || 'Unknown',
        timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    logger.info('command_pulse_success', {
      adminId,
      campusId,
      cached: false,
      activeUsers: pulse.activeUsers,
    });

    return respond.success({
      pulse,
      recentActivity,
      source: 'realtime',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('command_pulse_error', {
      adminId,
      campusId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return respond.error('Failed to fetch pulse metrics', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
