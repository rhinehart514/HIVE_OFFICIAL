/**
 * School Admin Management API
 *
 * GET: List all school admins (HIVE team only)
 * POST: Invite a new school admin (HIVE team only)
 *
 * This endpoint is restricted to HIVE team members (admins without campusId).
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  withAuthValidationAndErrors,
  getCampusId,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { getAdminRecord, hasAdminRole } from '@/lib/admin-auth';
import { FieldValue } from 'firebase-admin/firestore';

const InviteSchema = z.object({
  email: z.string().email(),
  campusId: z.string().min(1),
  role: z.enum(['admin', 'moderator']),
});

interface SchoolAdmin {
  id: string;
  email: string;
  displayName?: string;
  campusId: string;
  campusName: string;
  role: 'admin' | 'moderator';
  status: 'active' | 'pending' | 'revoked';
  invitedAt: string;
  acceptedAt?: string;
  lastLoginAt?: string;
  invitedBy: string;
}

/**
 * GET /api/admin/school-admins
 * List all school admins - HIVE team only
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  // HIVE team only - admins with no campusId
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

  try {
    // Fetch all school admins (admins with a campusId)
    const adminsSnapshot = await dbAdmin
      .collection('admins')
      .where('active', '==', true)
      .get();

    // Also fetch pending invitations
    const invitesSnapshot = await dbAdmin
      .collection('schoolAdminInvitations')
      .where('status', '==', 'pending')
      .get();

    // Get campus names for lookup
    const campusIds = new Set<string>();
    adminsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.campusId) campusIds.add(data.campusId);
    });
    invitesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.campusId) campusIds.add(data.campusId);
    });

    const campusNames: Record<string, string> = {};
    for (const cId of campusIds) {
      const campusDoc = await dbAdmin.collection('campuses').doc(cId).get();
      if (campusDoc.exists) {
        const data = campusDoc.data();
        campusNames[cId] = data?.name || cId;
      } else {
        campusNames[cId] = cId;
      }
    }

    const admins: SchoolAdmin[] = [];

    // Process active school admins
    for (const doc of adminsSnapshot.docs) {
      const data = doc.data();

      // Skip HIVE team admins (no campusId)
      if (!data.campusId) continue;

      admins.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        campusId: data.campusId,
        campusName: campusNames[data.campusId] || data.campusId,
        role: data.role || 'admin',
        status: 'active',
        invitedAt: data.grantedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        acceptedAt: data.acceptedAt?.toDate?.()?.toISOString(),
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString(),
        invitedBy: data.grantedBy || 'system',
      });
    }

    // Process pending invitations
    for (const doc of invitesSnapshot.docs) {
      const data = doc.data();

      admins.push({
        id: doc.id,
        email: data.email,
        campusId: data.campusId,
        campusName: campusNames[data.campusId] || data.campusId,
        role: data.role || 'admin',
        status: 'pending',
        invitedAt: data.invitedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        invitedBy: data.invitedBy || 'system',
      });
    }

    // Sort by status (pending first) then by invitedAt
    admins.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime();
    });

    logger.info('School admins fetched', {
      adminId,
      total: admins.length,
      active: admins.filter(a => a.status === 'active').length,
      pending: admins.filter(a => a.status === 'pending').length,
    });

    return respond.success({
      admins,
      summary: {
        total: admins.length,
        active: admins.filter(a => a.status === 'active').length,
        pending: admins.filter(a => a.status === 'pending').length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch school admins', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
    });
    return respond.error('Failed to fetch school admins', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * POST /api/admin/school-admins
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
