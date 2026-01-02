/**
 * Admin Users Export API
 *
 * GET: Export users data as CSV or JSON
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';

const ExportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).optional().default('csv'),
  includeEmail: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  status: z.enum(['active', 'suspended', 'all']).optional().default('all'),
  role: z.enum(['user', 'builder', 'admin', 'all']).optional().default('all'),
});

/**
 * GET /api/admin/users/export
 * Export users data
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);

  const { searchParams } = new URL(request.url);
  const queryResult = ExportQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Build Firestore query
    let usersQuery = dbAdmin
      .collection('profiles')
      .where('campusId', '==', CURRENT_CAMPUS_ID);

    if (query.status !== 'all') {
      usersQuery = usersQuery.where('status', '==', query.status);
    }

    if (query.role !== 'all') {
      usersQuery = usersQuery.where('role', '==', query.role);
    }

    const snapshot = await usersQuery.get();

    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      const user: Record<string, unknown> = {
        id: doc.id,
        displayName: data.displayName || '',
        handle: data.handle || '',
        role: data.role || 'user',
        status: data.status || 'active',
        onboardingCompleted: data.onboardingCompleted || false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
        lastActive: data.lastActive?.toDate?.()?.toISOString() || '',
        spaceCount: (data.spaceMemberships || []).length,
      };

      // Only include email if explicitly requested (privacy consideration)
      if (query.includeEmail) {
        user.email = data.email || '';
      }

      return user;
    });

    // Log the export
    await logAdminActivity({
      adminId,
      action: 'users_exported',
      targetType: 'users',
      targetId: 'export',
      details: {
        format: query.format,
        userCount: users.length,
        filters: {
          status: query.status,
          role: query.role,
          includeEmail: query.includeEmail,
        },
      },
    });

    logger.info('Users exported', {
      adminId,
      format: query.format,
      userCount: users.length,
    });

    if (query.format === 'csv') {
      // Generate CSV
      const headers = Object.keys(users[0] || {});
      const csvRows = [
        headers.join(','),
        ...users.map(user =>
          headers.map(h => {
            const value = user[h];
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value ?? '');
          }).join(',')
        ),
      ];
      const csv = csvRows.join('\n');

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="hive-users-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // JSON format
    return new Response(JSON.stringify({ users, exportedAt: new Date().toISOString() }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="hive-users-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    logger.error('Users export failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
    });
    return respond.error('Failed to export users', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
