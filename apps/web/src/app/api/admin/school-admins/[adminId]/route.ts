/**
 * School Admin Management API - Individual Admin
 *
 * DELETE: Revoke a school admin's access or cancel pending invitation
 *
 * This endpoint is restricted to HIVE team members (admins without campusId).
 */

import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getCampusId,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { getAdminRecord, hasAdminRole } from '@/lib/admin-auth';

type RouteContext = { params: Promise<{ adminId: string }> };

/**
 * DELETE /api/admin/school-admins/[adminId]
 * Revoke a school admin's access or cancel pending invitation
 */
export const DELETE = withAdminAuthAndErrors(async (request, context: RouteContext, respond) => {
  const currentAdminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { adminId } = await context.params;

  // HIVE team only
  if (campusId) {
    return respond.error(
      'Access restricted to HIVE team members',
      'FORBIDDEN',
      { status: HttpStatus.FORBIDDEN }
    );
  }

  // Check admin permission
  const adminRecord = await getAdminRecord(currentAdminId);
  if (!adminRecord || !hasAdminRole(adminRecord.role, 'admin')) {
    return respond.error('Admin access required', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  // Prevent self-revocation
  if (adminId === currentAdminId) {
    return respond.error('Cannot revoke your own access', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  try {
    const now = new Date();

    // First check if this is an active admin record
    const adminDoc = await dbAdmin.collection('admins').doc(adminId).get();

    if (adminDoc.exists) {
      const adminData = adminDoc.data();

      // Only allow revoking school admins (those with campusId)
      if (!adminData?.campusId) {
        return respond.error(
          'Cannot revoke HIVE team member access through this endpoint',
          'FORBIDDEN',
          { status: HttpStatus.FORBIDDEN }
        );
      }

      // Soft delete - mark as inactive
      await dbAdmin.collection('admins').doc(adminId).update({
        active: false,
        revokedAt: now,
        revokedBy: currentAdminId,
        updatedAt: now,
      });

      logger.info('School admin access revoked', {
        adminId,
        email: adminData.email,
        campusId: adminData.campusId,
        revokedBy: currentAdminId,
      });

      return respond.success({
        message: 'Admin access revoked successfully',
        adminId,
        email: adminData.email,
      });
    }

    // Check if this is a pending invitation
    const inviteDoc = await dbAdmin.collection('schoolAdminInvitations').doc(adminId).get();

    if (inviteDoc.exists) {
      const inviteData = inviteDoc.data();

      // Mark invitation as cancelled
      await dbAdmin.collection('schoolAdminInvitations').doc(adminId).update({
        status: 'cancelled',
        cancelledAt: now,
        cancelledBy: currentAdminId,
        updatedAt: now,
      });

      logger.info('School admin invitation cancelled', {
        inviteId: adminId,
        email: inviteData?.email,
        campusId: inviteData?.campusId,
        cancelledBy: currentAdminId,
      });

      return respond.success({
        message: 'Invitation cancelled successfully',
        inviteId: adminId,
        email: inviteData?.email,
      });
    }

    // Not found in either collection
    return respond.error('Admin or invitation not found', 'NOT_FOUND', {
      status: HttpStatus.NOT_FOUND,
    });
  } catch (error) {
    logger.error('Failed to revoke school admin access', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      revokedBy: currentAdminId,
    });
    return respond.error('Failed to revoke access', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
