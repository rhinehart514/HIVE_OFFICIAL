/**
 * Admin Users Bulk Operations API
 *
 * POST: Execute bulk operations on multiple users
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminPermission,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';

const BulkOperationSchema = z.object({
  operation: z.enum(['suspend', 'unsuspend', 'updateRole', 'delete']),
  userIds: z.array(z.string()).min(1).max(100),
  params: z.object({
    role: z.enum(['user', 'builder']).optional(),
    reason: z.string().max(500).optional(),
    duration: z.enum(['1d', '7d', '30d', 'permanent']).optional(),
  }).optional(),
});

interface BulkResult {
  userId: string;
  success: boolean;
  error?: string;
}

/**
 * POST /api/admin/users/bulk
 * Execute bulk operations on multiple users
 *
 * SECURITY: Requires 'manage_users' permission (admin or super_admin only)
 * Bulk operations are powerful and should not be accessible to viewers or moderators
 */
export const POST = withAdminPermission('manage_users', async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);

  try {
    const body = await request.json();
    const parseResult = BulkOperationSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const { operation, userIds, params } = parseResult.data;

    // Filter out admin's own ID
    const targetIds = userIds.filter(id => id !== adminId);

    if (targetIds.length === 0) {
      return respond.error('No valid users to process', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const results: BulkResult[] = [];
    const batch = dbAdmin.batch();

    // Process in batches of 50 (Firestore limit)
    const batchSize = 50;
    for (let i = 0; i < targetIds.length; i += batchSize) {
      const batchIds = targetIds.slice(i, i + batchSize);

      for (const userId of batchIds) {
        try {
          const userRef = dbAdmin.collection('profiles').doc(userId);
          const userDoc = await userRef.get();

          if (!userDoc.exists) {
            results.push({ userId, success: false, error: 'User not found' });
            continue;
          }

          const userData = userDoc.data();

          // Prevent operations on admins
          if (userData?.role === 'admin' || userData?.role === 'super_admin') {
            results.push({ userId, success: false, error: 'Cannot modify admin accounts' });
            continue;
          }

          switch (operation) {
            case 'suspend':
              batch.update(userRef, {
                status: 'suspended',
                suspendedAt: new Date(),
                suspendedBy: adminId,
                suspendedReason: params?.reason || 'Bulk suspension',
                updatedAt: new Date(),
              });
              results.push({ userId, success: true });
              break;

            case 'unsuspend':
              if (userData?.status !== 'suspended') {
                results.push({ userId, success: false, error: 'User not suspended' });
                continue;
              }
              batch.update(userRef, {
                status: 'active',
                suspendedAt: null,
                suspendedBy: null,
                suspendedReason: null,
                restoredBy: adminId,
                restoredAt: new Date(),
                updatedAt: new Date(),
              });
              results.push({ userId, success: true });
              break;

            case 'updateRole':
              if (!params?.role) {
                results.push({ userId, success: false, error: 'Role not specified' });
                continue;
              }
              batch.update(userRef, {
                role: params.role,
                updatedAt: new Date(),
                updatedBy: adminId,
              });
              results.push({ userId, success: true });
              break;

            case 'delete':
              // Soft delete - mark as deleted rather than hard delete
              batch.update(userRef, {
                status: 'deleted',
                deletedAt: new Date(),
                deletedBy: adminId,
                updatedAt: new Date(),
              });
              results.push({ userId, success: true });
              break;
          }
        } catch (error) {
          results.push({
            userId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Commit the batch
    await batch.commit();

    // Log bulk activity
    await logAdminActivity({
      adminId,
      action: `bulk_${operation}`,
      targetType: 'users',
      targetId: 'bulk',
      details: {
        operation,
        totalUsers: targetIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        params,
      },
    });

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info('Bulk user operation completed', {
      adminId,
      operation,
      successful,
      failed,
    });

    return respond.success({
      message: `Bulk operation completed: ${successful} successful, ${failed} failed`,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    logger.error('Bulk user operation failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
    });
    return respond.error('Failed to execute bulk operation', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
