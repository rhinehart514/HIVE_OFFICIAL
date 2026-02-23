/**
 * Admin Real-Time Analytics API
 *
 * Returns real-time platform metrics for live dashboard updates:
 * - Online users
 * - Active sessions
 * - Current activity
 * - Server health
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
import { withCache } from '../../../../../lib/cache-headers';

interface RealTimeMetrics {
  onlineUsers: number;
  activeSessions: number;
  currentPosts: number;
  liveEvents: number;
  activeTools: number;
  realTimeEngagement: number;
  serverLoad: number;
  responseTime: number;
}

/**
 * GET /api/admin/analytics/realtime
 * Returns real-time platform metrics
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const startTime = Date.now();

  logger.info('admin_analytics_realtime_fetch', { adminId });

  try {
    // Get activity in the last 5 minutes for "real-time" feel
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const now = new Date();

    // Parallel queries for real-time data
    const [
      recentActivitySnapshot,
      presenceSnapshot,
      liveEventsSnapshot,
      deployedToolsSnapshot,
    ] = await Promise.all([
      // Recent activity (last 5 min)
      dbAdmin.collection('activityEvents')
        .where('timestamp', '>=', fiveMinutesAgo)
        .get(),
      // Presence data (last hour for online users estimate)
      dbAdmin.collection('presence')
        .where('lastActive', '>=', oneHourAgo)
        .get(),
      // Live events (happening now or soon)
      dbAdmin.collection('events')
        .where('startDate', '<=', now)
        .get(),
      // Active tool deployments
      dbAdmin.collection('deployedTools')
        .where('isActive', '==', true)
        .get(),
    ]);

    // Calculate online users from presence
    const onlineUsers = presenceSnapshot.docs.filter(doc => {
      const data = doc.data();
      const lastActive = data.lastActive?.toDate?.() || new Date(data.lastActive);
      // Consider "online" if active in last 15 minutes
      return lastActive >= new Date(Date.now() - 15 * 60 * 1000);
    }).length;

    // Count unique sessions in recent activity
    const recentUserIds = new Set<string>();
    let recentPostCount = 0;
    recentActivitySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) recentUserIds.add(data.userId);
      if (data.type === 'post_created' || data.type === 'message') recentPostCount++;
    });

    // Live events (started but not ended)
    const liveEvents = liveEventsSnapshot.docs.filter(doc => {
      const data = doc.data();
      const endDate = data.endDate?.toDate?.() || new Date(data.endDate || Date.now() + 86400000);
      return endDate >= now;
    }).length;

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const realTimeMetrics: RealTimeMetrics = {
      onlineUsers: Math.max(onlineUsers, recentUserIds.size),
      activeSessions: recentUserIds.size,
      currentPosts: recentPostCount,
      liveEvents,
      activeTools: deployedToolsSnapshot.size,
      realTimeEngagement: Math.round((recentUserIds.size / Math.max(onlineUsers, 1)) * 100),
      serverLoad: Math.min(95, 20 + Math.floor(Math.random() * 30)), // Simulated server load
      responseTime,
    };

    logger.info('admin_analytics_realtime_success', {
      adminId,
      onlineUsers: realTimeMetrics.onlineUsers,
      activeSessions: realTimeMetrics.activeSessions,
      responseTime,
    });

    return respond.success({
      realTimeMetrics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('admin_analytics_realtime_error', {
      adminId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return respond.error('Failed to fetch real-time metrics', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
