/**
 * Admin User Suspend API
 *
 * POST: Suspend a user account
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
import { sendSuspensionEmail } from '@/lib/email-service';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

const SuspendSchema = z.object({
  reason: z.string().min(1).max(500),
  duration: z.enum(['1d', '7d', '30d', 'permanent']).optional().default('permanent'),
  notify: z.boolean().optional().default(true),
});

/**
 * POST /api/admin/users/[userId]/suspend
 * Suspend a user account
 *
 * SECURITY: Requires 'manage_users' permission (admin or super_admin only)
 * Viewers and moderators cannot suspend users
 */
export const POST = withAdminPermission<RouteContext>('manage_users', async (request, context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { userId } = await context.params;

  if (!userId) {
    return respond.error('User ID is required', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  // Prevent self-suspension
  if (userId === adminId) {
    return respond.error('Cannot suspend your own account', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  try {
    const body = await request.json();
    const parseResult = SuspendSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const { reason, duration, notify } = parseResult.data;

    // Check if user exists
    const userDoc = await dbAdmin.collection('profiles').doc(userId).get();

    if (!userDoc.exists) {
      return respond.error('User not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const userData = userDoc.data();

    // SECURITY: Verify campus isolation - admins can only suspend users in their campus
    const adminCampusId = getCampusId(request as AuthenticatedRequest);
    const userCampusId = userData?.campusId;

    if (adminCampusId && userCampusId && adminCampusId !== userCampusId) {
      logger.warn('Cross-campus suspend attempt blocked', {
        adminId,
        adminCampus: adminCampusId,
        targetUserId: userId,
        targetCampus: userCampusId,
      });
      return respond.error('Cannot suspend users from a different campus', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    // Check if already suspended
    if (userData?.status === 'suspended') {
      return respond.error('User is already suspended', 'CONFLICT', {
        status: HttpStatus.CONFLICT,
      });
    }

    // Check if target is an admin (only super_admin can suspend admins)
    if (userData?.role === 'admin' || userData?.role === 'super_admin') {
      // Would need to check if current admin is super_admin
      return respond.error('Cannot suspend admin accounts via this endpoint', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    // Calculate suspension end date
    let suspendedUntil: Date | null = null;
    if (duration !== 'permanent') {
      const days = duration === '1d' ? 1 : duration === '7d' ? 7 : 30;
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + days);
    }

    // Apply suspension
    await dbAdmin.collection('profiles').doc(userId).update({
      status: 'suspended',
      suspendedAt: new Date(),
      suspendedBy: adminId,
      suspendedReason: reason,
      suspendedUntil: suspendedUntil,
      updatedAt: new Date(),
    });

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: 'user_suspended',
      targetType: 'user',
      targetId: userId,
      details: {
        reason,
        duration,
        suspendedUntil: suspendedUntil?.toISOString() || 'permanent',
      },
    });

    // Send notification email if notify is true
    if (notify && userData?.email) {
      sendSuspensionEmail(
        userData.email,
        userData.fullName || userData.displayName || 'User',
        reason,
        duration,
        suspendedUntil
      ).catch(err => {
        logger.warn('Failed to send suspension email', {
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    logger.info('User suspended', {
      adminId,
      targetUserId: userId,
      reason,
      duration,
    });

    return respond.success({
      message: 'User suspended successfully',
      userId,
      suspendedUntil: suspendedUntil?.toISOString() || 'permanent',
    });
  } catch (error) {
    logger.error('User suspension failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      userId,
    });
    return respond.error('Failed to suspend user', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
