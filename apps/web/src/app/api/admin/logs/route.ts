/**
 * Admin Activity Logs API
 *
 * GET: Fetch admin activity logs with filtering
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';

const LogQuerySchema = z.object({
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
  action: z.string().optional(),
  adminId: z.string().optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
});

interface ActivityLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  target: string;
  targetId?: string;
  details?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

/**
 * GET /api/admin/logs
 * Fetch admin activity logs
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = LogQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    let logsQuery = dbAdmin
      .collection('adminActivityLogs')
      .where('campusId', '==', campusId)
      .orderBy('timestamp', 'desc');

    if (query.action) {
      logsQuery = logsQuery.where('action', '==', query.action);
    }

    if (query.adminId) {
      logsQuery = logsQuery.where('adminId', '==', query.adminId);
    }

    if (query.severity) {
      logsQuery = logsQuery.where('severity', '==', query.severity);
    }

    const snapshot = await logsQuery.limit(query.limit + query.offset).get();

    const logs: ActivityLog[] = snapshot.docs.slice(query.offset).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        adminId: data.adminId,
        adminEmail: data.adminEmail,
        action: data.action,
        target: data.target,
        targetId: data.targetId,
        details: data.details,
        severity: data.severity || 'info',
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        ip: data.ip,
        userAgent: data.userAgent,
      };
    });

    // Get unique actions for filter dropdown
    const actionsSnapshot = await dbAdmin
      .collection('adminActivityLogs')
      .where('campusId', '==', campusId)
      .select('action')
      .limit(100)
      .get();

    const uniqueActions = [...new Set(actionsSnapshot.docs.map(d => d.data().action))];

    // Get log counts by severity
    const severityCounts = {
      info: logs.filter(l => l.severity === 'info').length,
      warning: logs.filter(l => l.severity === 'warning').length,
      error: logs.filter(l => l.severity === 'error').length,
      critical: logs.filter(l => l.severity === 'critical').length,
    };

    logger.info('Activity logs fetched', {
      count: logs.length,
      filters: { action: query.action, severity: query.severity },
    });

    return respond.success({
      logs,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: snapshot.size,
        hasMore: snapshot.size > query.limit + query.offset,
      },
      filters: {
        availableActions: uniqueActions,
        severities: ['info', 'warning', 'error', 'critical'],
      },
      stats: {
        severityCounts,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch activity logs', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch activity logs', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
