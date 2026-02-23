/**
 * Admin Activity Logs Export API
 *
 * GET: Export activity logs as CSV
 */

import { z } from 'zod';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

const ExportQuerySchema = z.object({
  action: z.string().optional(),
  adminId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['csv', 'json']).optional().default('csv'),
});

/**
 * GET /api/admin/activity-logs/export
 * Export activity logs as CSV or JSON
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = ExportQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const { action, adminId, dateFrom, dateTo, format } = queryResult.data;

  try {
    // Build query (max 1000 for export)
    let query = dbAdmin
      .collection('adminActivityLogs')
      // campusId single-field index is exempted — skip Firestore filter;

    if (action) {
      query = query.where('action', '==', action);
    }
    if (adminId) {
      query = query.where('adminId', '==', adminId);
    }
    if (dateFrom) {
      query = query.where('timestamp', '>=', new Date(dateFrom));
    }
    if (dateTo) {
      query = query.where('timestamp', '<=', new Date(dateTo));
    }

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        adminId: data.adminId,
        adminEmail: data.adminEmail || '',
        action: data.action,
        target: data.target || '',
        targetId: data.targetId || '',
        severity: data.severity || 'info',
        success: data.success !== false,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || '',
        ip: data.ip || '',
      };
    });

    if (format === 'json') {
      return new Response(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Generate CSV
    const headers = ['ID', 'Admin ID', 'Admin Email', 'Action', 'Target', 'Target ID', 'Severity', 'Success', 'Timestamp', 'IP'];
    const rows = logs.map(log => [
      log.id,
      log.adminId,
      log.adminEmail,
      log.action,
      log.target,
      log.targetId,
      log.severity,
      log.success.toString(),
      log.timestamp,
      log.ip,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    // If collection doesn't exist, return empty CSV
    if ((error as { code?: number }).code === 9 || (error as { message?: string }).message?.includes('index')) {
      const emptyCSV = 'ID,Admin ID,Admin Email,Action,Target,Target ID,Severity,Success,Timestamp,IP\n';
      return new Response(emptyCSV, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    throw error;
  }
});

export const GET = withCache(_GET, 'PRIVATE');
