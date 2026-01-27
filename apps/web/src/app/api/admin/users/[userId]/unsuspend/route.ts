/**
 * Admin User Unsuspend API
 *
 * POST: Restore a suspended user account
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminPermission,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

const UnsuspendSchema = z.object({
  note: z.string().max(500).optional(),
  notify: z.boolean().optional().default(true),
});

/**
 * POST /api/admin/users/[userId]/unsuspend
 * Restore a suspended user account
 *
 * SECURITY: Requires 'manage_users' permission (admin or super_admin only)
 */
export const POST = withAdminPermission<RouteContext>('manage_users', async (request, context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { userId } = await context.params;

  if (!userId) {
    return respond.error('User ID is required', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  try {
    const body = await request.json();
    const parseResult = UnsuspendSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const { note, notify } = parseResult.data;

    // Check if user exists
    const userDoc = await dbAdmin.collection('profiles').doc(userId).get();

    if (!userDoc.exists) {
      return respond.error('User not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const userData = userDoc.data();

    // SECURITY: Verify campus isolation - admins can only unsuspend users in their campus
    const adminCampusId = getCampusId(request as AuthenticatedRequest);
    const userCampusId = userData?.campusId;

    if (adminCampusId && userCampusId && adminCampusId !== userCampusId) {
      logger.warn('Cross-campus unsuspend attempt blocked', {
        adminId,
        adminCampus: adminCampusId,
        targetUserId: userId,
        targetCampus: userCampusId,
      });
      return respond.error('Cannot unsuspend users from a different campus', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    // Check if actually suspended
    if (userData?.status !== 'suspended') {
      return respond.error('User is not suspended', 'CONFLICT', {
        status: HttpStatus.CONFLICT,
      });
    }

    // Restore user
    await dbAdmin.collection('profiles').doc(userId).update({
      status: 'active',
      suspendedAt: null,
      suspendedBy: null,
      suspendedReason: null,
      suspendedUntil: null,
      restoredAt: new Date(),
      restoredBy: adminId,
      updatedAt: new Date(),
    });

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: 'user_unsuspended',
      targetType: 'user',
      targetId: userId,
      details: {
        note,
        previousSuspensionReason: userData?.suspendedReason,
        suspendedDuration: userData?.suspendedAt
          ? `${Math.floor((Date.now() - userData.suspendedAt.toDate().getTime()) / (1000 * 60 * 60 * 24))} days`
          : 'unknown',
      },
    });

    // TODO: Send notification email if notify is true

    logger.info('User unsuspended', {
      adminId,
      targetUserId: userId,
      note,
    });

    return respond.success({
      message: 'User restored successfully',
      userId,
    });
  } catch (error) {
    logger.error('User unsuspension failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      userId,
    });
    return respond.error('Failed to restore user', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
