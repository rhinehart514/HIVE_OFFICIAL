/**
 * School Admin Invite API
 *
 * POST: Create a new school admin invitation
 *
 * This is a convenience endpoint that mirrors POST /api/admin/school-admins
 * for clarity in the UI code (fetch to /api/admin/school-admins/invite)
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAuthValidationAndErrors,
  getCampusId,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { getAdminRecord, hasAdminRole } from '@/lib/admin-auth';

const InviteSchema = z.object({
  email: z.string().email(),
  campusId: z.string().min(1),
  role: z.enum(['admin', 'moderator']),
});

/**
 * POST /api/admin/school-admins/invite
 * Create a new school admin invitation - HIVE team only
 */
export const POST = withAuthValidationAndErrors(
  InviteSchema,
  async (request, _context, body, respond) => {
    const adminId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // HIVE team only
    if (campusId) {
      return respond.error(
        'Access restricted to HIVE team members',
        'FORBIDDEN',
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // Check admin permission
    const adminRecord = await getAdminRecord(adminId);
    if (!adminRecord || !hasAdminRole(adminRecord.role, 'admin')) {
      return respond.error('Admin access required', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    const { email, campusId: targetCampusId, role } = body;
    const normalizedEmail = email.toLowerCase();

    try {
      // Check if campus exists
      const campusDoc = await dbAdmin.collection('campuses').doc(targetCampusId).get();
      if (!campusDoc.exists) {
        return respond.error('Campus not found', 'NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      // Check if admin already exists with this email
      const existingAdminQuery = await dbAdmin
        .collection('admins')
        .where('email', '==', normalizedEmail)
        .where('active', '==', true)
        .limit(1)
        .get();

      if (!existingAdminQuery.empty) {
        return respond.error('An admin with this email already exists', 'CONFLICT', {
          status: HttpStatus.CONFLICT,
        });
      }

      // Check if pending invitation exists
      const existingInviteQuery = await dbAdmin
        .collection('schoolAdminInvitations')
        .where('email', '==', normalizedEmail)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (!existingInviteQuery.empty) {
        return respond.error('A pending invitation already exists for this email', 'CONFLICT', {
          status: HttpStatus.CONFLICT,
        });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation
      const inviteRef = await dbAdmin.collection('schoolAdminInvitations').add({
        email: normalizedEmail,
        campusId: targetCampusId,
        role,
        status: 'pending',
        invitedAt: now,
        invitedBy: adminId,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });

      // Get campus name for response
      const campusData = campusDoc.data();
      const campusName = campusData?.name || targetCampusId;

      logger.info('School admin invitation created', {
        inviteId: inviteRef.id,
        email: normalizedEmail,
        campusId: targetCampusId,
        role,
        invitedBy: adminId,
      });

      return respond.success({
        invitation: {
          id: inviteRef.id,
          email: normalizedEmail,
          campusId: targetCampusId,
          campusName,
          role,
          status: 'pending',
          invitedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
        message: `Invitation sent to ${normalizedEmail}`,
      });
    } catch (error) {
      logger.error('Failed to create school admin invitation', {
        error: error instanceof Error ? error.message : String(error),
        adminId,
        email: normalizedEmail,
        campusId: targetCampusId,
      });
      return respond.error('Failed to create invitation', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);
