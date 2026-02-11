/**
 * Command Center - Health API
 *
 * Risk indicators and platform health status for executive dashboard.
 * Surfaces potential issues before they become problems.
 *
 * GET: Returns health indicators and risk items
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

type HealthStatus = 'healthy' | 'warning' | 'critical';

interface HealthIndicator {
  dimension: string;
  status: HealthStatus;
  score: number; // 0-100
  message: string;
  details?: Record<string, unknown>;
}

interface AtRiskItem {
  id: string;
  type: 'space' | 'user';
  name: string;
  risk: string;
  lastActivity: string;
  severity: 'low' | 'medium' | 'high';
}

interface TrendAlert {
  id: string;
  metric: string;
  direction: 'up' | 'down';
  change: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
  detectedAt: string;
}

interface HealthSummary {
  overallScore: number;
  overallStatus: HealthStatus;
  indicators: HealthIndicator[];
  atRiskSpaces: AtRiskItem[];
  atRiskUsers: AtRiskItem[];
  trendAlerts: TrendAlert[];
}

/**
 * Calculate health status from score
 */
function getStatusFromScore(score: number): HealthStatus {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

/**
 * GET /api/admin/command/health
 * Returns health indicators and risk dashboard data
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  logger.info('command_health_fetch', { adminId, campusId });

  try {
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch data for health calculations
    const [
      totalUsersResult,
      activeUsersResult,
      totalSpacesResult,
      pendingReportsResult,
      pendingToolsResult,
      spacesSnapshot,
    ] = await Promise.all([
      dbAdmin.collection('profiles')
        .where('campusId', '==', campusId)
        .count()
        .get(),
      dbAdmin.collection('profiles')
        .where('campusId', '==', campusId)
        .where('lastActive', '>=', sevenDaysAgo)
        .count()
        .get(),
      dbAdmin.collection('spaces')
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
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
      // Get spaces for at-risk calculation
      dbAdmin.collection('spaces')
        .where('campusId', '==', campusId)
        .where('isActive', '==', true)
        .get(),
    ]);

    const totalUsers = totalUsersResult.data().count;
    const activeUsers = activeUsersResult.data().count;
    const totalSpaces = totalSpacesResult.data().count;
    const pendingReports = pendingReportsResult.data().count;
    const pendingTools = pendingToolsResult.data().count;

    // Calculate health indicators
    const indicators: HealthIndicator[] = [];

    // 1. User Engagement Health
    const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const engagementScore = Math.min(100, Math.round(engagementRate * 2)); // Target: 50% WAU
    indicators.push({
      dimension: 'User Engagement',
      status: getStatusFromScore(engagementScore),
      score: engagementScore,
      message: engagementScore >= 80
        ? 'Strong weekly engagement'
        : engagementScore >= 50
        ? 'Moderate engagement - consider activation campaigns'
        : 'Low engagement - immediate attention needed',
      details: { activeUsers, totalUsers, engagementRate: Math.round(engagementRate) },
    });

    // 2. Moderation Queue Health
    const queueScore = pendingReports === 0 ? 100 : Math.max(0, 100 - pendingReports * 10);
    indicators.push({
      dimension: 'Moderation Queue',
      status: getStatusFromScore(queueScore),
      score: queueScore,
      message: queueScore >= 80
        ? 'Queue is under control'
        : queueScore >= 50
        ? 'Growing backlog - review pending items'
        : 'Critical backlog - prioritize resolution',
      details: { pendingReports, pendingTools },
    });

    // 3. Space Health
    let atRiskSpaceCount = 0;
    const atRiskSpaces: AtRiskItem[] = [];

    spacesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const lastActivity = data.lastActivityAt?.toDate?.() || data.updatedAt?.toDate?.();

      if (lastActivity && lastActivity < fourteenDaysAgo) {
        atRiskSpaceCount++;
        if (atRiskSpaces.length < 10) {
          atRiskSpaces.push({
            id: doc.id,
            type: 'space',
            name: data.name || 'Unnamed Space',
            risk: 'No activity in 14+ days',
            lastActivity: lastActivity.toISOString(),
            severity: lastActivity < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              ? 'high'
              : 'medium',
          });
        }
      }
    });

    const spaceHealthScore = totalSpaces > 0
      ? Math.round(((totalSpaces - atRiskSpaceCount) / totalSpaces) * 100)
      : 100;

    indicators.push({
      dimension: 'Space Health',
      status: getStatusFromScore(spaceHealthScore),
      score: spaceHealthScore,
      message: spaceHealthScore >= 80
        ? 'Most spaces are active'
        : spaceHealthScore >= 50
        ? 'Some spaces need attention'
        : 'Many spaces are stagnant',
      details: { totalSpaces, atRiskSpaces: atRiskSpaceCount },
    });

    // 4. Platform Operations
    const opsScore = Math.min(100, 100 - pendingTools * 5);
    indicators.push({
      dimension: 'Platform Operations',
      status: getStatusFromScore(opsScore),
      score: opsScore,
      message: opsScore >= 80
        ? 'Operations running smoothly'
        : opsScore >= 50
        ? 'Some items need review'
        : 'Backlog requires attention',
      details: { pendingTools },
    });

    // Calculate overall score
    const overallScore = Math.round(
      indicators.reduce((sum, i) => sum + i.score, 0) / indicators.length
    );
    const overallStatus = getStatusFromScore(overallScore);

    // Generate trend alerts (mock for now - would come from time series analysis)
    const trendAlerts: TrendAlert[] = [];

    if (engagementScore < 50) {
      trendAlerts.push({
        id: 'engagement-decline',
        metric: 'User Engagement',
        direction: 'down',
        change: -15,
        threshold: 50,
        severity: 'warning',
        message: 'User engagement has declined below threshold',
        detectedAt: new Date().toISOString(),
      });
    }

    if (pendingReports > 10) {
      trendAlerts.push({
        id: 'report-backlog',
        metric: 'Pending Reports',
        direction: 'up',
        change: pendingReports,
        threshold: 10,
        severity: pendingReports > 20 ? 'critical' : 'warning',
        message: `${pendingReports} reports awaiting review`,
        detectedAt: new Date().toISOString(),
      });
    }

    const healthSummary: HealthSummary = {
      overallScore,
      overallStatus,
      indicators,
      atRiskSpaces,
      atRiskUsers: [], // TODO: Implement user risk calculation
      trendAlerts,
    };

    logger.info('command_health_success', {
      adminId,
      campusId,
      overallScore,
      overallStatus,
      indicatorCount: indicators.length,
      atRiskSpaceCount: atRiskSpaces.length,
      alertCount: trendAlerts.length,
    });

    return respond.success({
      ...healthSummary,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('command_health_error', {
      adminId,
      campusId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return respond.error('Failed to fetch health data', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
