/**
 * Admin Activity Logs API (Alias)
 *
 * This route aliases /api/admin/logs for backwards compatibility
 * with admin dashboard components that expect /api/admin/activity-logs
 */

import { z } from 'zod';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../lib/cache-headers';

const LogQuerySchema = z.object({
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
  action: z.string().optional(),
  adminId: z.string().optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  success: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
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
  success: boolean;
  ip?: string;
  userAgent?: string;
}

interface ActivityLogStats {
  total: number;
  byAction: Record<string, number>;
  bySeverity: Record<string, number>;
  successRate: number;
}

/**
 * GET /api/admin/activity-logs
 * Fetch admin activity logs with filtering and stats
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = LogQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const { limit, offset, action, adminId, severity, dateFrom, dateTo, success } = queryResult.data;

  try {
    // Build query
    let query: FirebaseFirestore.Query = dbAdmin
      .collection('adminActivityLogs');

    // Apply filters
    if (action) {
      query = query.where('action', '==', action);
    }
    if (adminId) {
      query = query.where('adminId', '==', adminId);
    }
    if (severity) {
      query = query.where('severity', '==', severity);
    }
    if (success !== undefined) {
      query = query.where('success', '==', success);
    }

    // Date range filter (requires compound index)
    if (dateFrom) {
      query = query.where('timestamp', '>=', new Date(dateFrom));
    }
    if (dateTo) {
      query = query.where('timestamp', '<=', new Date(dateTo));
    }

    // Execute query with pagination
    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .offset(offset)
      .limit(limit)
      .get();

    const logs: ActivityLog[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        adminId: data.adminId,
        adminEmail: data.adminEmail,
        action: data.action,
        target: data.target || '',
        targetId: data.targetId,
        details: data.details,
        severity: data.severity || 'info',
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        success: data.success !== false,
        ip: data.ip,
        userAgent: data.userAgent,
      };
    });

    // Calculate stats
    const actionCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = { info: 0, warning: 0, error: 0, critical: 0 };
    let successCount = 0;

    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
      if (log.success) successCount++;
    });

    const stats: ActivityLogStats = {
      total: logs.length,
      byAction: actionCounts,
      bySeverity: severityCounts,
      successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 100,
    };

    return respond.success({
      logs,
      stats,
      pagination: {
        limit,
        offset,
        total: snapshot.size,
        hasMore: snapshot.size === limit,
      },
    });
  } catch (error) {
    // If collection doesn't exist or index missing, return empty results
    if ((error as { code?: number }).code === 9 || (error as { message?: string }).message?.includes('index')) {
      return respond.success({
        logs: [],
        stats: {
          total: 0,
          byAction: {},
          bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
          successRate: 100,
        },
        pagination: {
          limit,
          offset,
          total: 0,
          hasMore: false,
        },
      });
    }

    throw error;
  }
});

/**
 * POST /api/admin/activity-logs
 * Log an admin action (internal use)
 */
export const POST = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const authRequest = request as AuthenticatedRequest;
  const adminId = authRequest.user?.uid;

  const body = await request.json();

  const LogEntrySchema = z.object({
    action: z.string(),
    target: z.string().optional(),
    targetId: z.string().optional(),
    details: z.record(z.unknown()).optional(),
    severity: z.enum(['info', 'warning', 'error', 'critical']).optional().default('info'),
    success: z.boolean().optional().default(true),
  });

  const result = LogEntrySchema.safeParse(body);
  if (!result.success) {
    return respond.error('Invalid log entry', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: result.error.flatten(),
    });
  }

  const { action, target, targetId, details, severity, success } = result.data;

  const logEntry = {
    campusId,
    adminId,
    adminEmail: authRequest.user?.email,
    action,
    target: target || '',
    targetId,
    details,
    severity,
    success,
    timestamp: new Date(),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  };

  const docRef = await dbAdmin.collection('adminActivityLogs').add(logEntry);

  return respond.success({
    id: docRef.id,
    logged: true,
  });
});

export const GET = withCache(_GET, 'PRIVATE');
