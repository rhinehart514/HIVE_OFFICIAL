/**
 * Admin Authentication with Firebase Admin SDK
 *
 * SECURITY: Uses Firestore admins collection + Firebase custom claims
 * No hardcoded admin emails - all admins managed via Firestore
 */
import 'server-only';

import { auth } from 'firebase-admin';
import { dbAdmin as adminDb } from './firebase-admin';
import { logger } from './structured-logger';

export interface AdminUser {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  permissions: string[];
  grantedAt: Date;
  grantedBy: string;
  campusId?: string;
  active: boolean;
}

/**
 * Check if a user has admin privileges
 * SECURITY: Uses custom claims + Firestore - no hardcoded emails
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // First check: Firebase Auth custom claims (fastest)
    const user = await auth().getUser(userId);
    if (user.customClaims?.admin === true) {
      return true;
    }

    // Second check: Firestore admins collection
    const adminDoc = await adminDb
      .collection('admins')
      .doc(userId)
      .get();

    if (adminDoc.exists && adminDoc.data()?.active === true) {
      // Grant admin claim for faster future checks
      await auth().setCustomUserClaims(userId, {
        ...user.customClaims,
        admin: true,
        adminRole: adminDoc.data()?.role
      });
      logger.info('Admin claim granted to user', { userId, role: adminDoc.data()?.role });
      return true;
    }

    // Third check: By email in Firestore
    if (user.email) {
      const emailQuery = await adminDb
        .collection('admins')
        .where('email', '==', user.email.toLowerCase())
        .where('active', '==', true)
        .limit(1)
        .get();

      if (!emailQuery.empty) {
        const adminData = emailQuery.docs[0].data();
        // Grant admin claim
        await auth().setCustomUserClaims(userId, {
          ...user.customClaims,
          admin: true,
          adminRole: adminData.role
        });
        logger.info('Admin claim granted by email', { userId, email: user.email });
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('Error checking admin status', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Get full admin user details
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const adminDoc = await adminDb
      .collection('admins')
      .doc(userId)
      .get();

    if (!adminDoc.exists) {
      return null;
    }

    const data = adminDoc.data();
    if (!data?.active) {
      return null;
    }

    // Get role-based permissions
    const permissions = getPermissionsForRole(data.role || 'viewer');

    return {
      userId,
      email: data.email,
      role: data.role || 'viewer',
      permissions,
      grantedAt: data.grantedAt?.toDate() || new Date(),
      grantedBy: data.grantedBy || 'system',
      campusId: data.campusId,
      active: data.active
    };
  } catch (error) {
    logger.error('Error getting admin user', { userId, error });
    return null;
  }
}

/**
 * Get permissions based on admin role
 */
function getPermissionsForRole(role: AdminUser['role']): string[] {
  const rolePermissions: Record<AdminUser['role'], string[]> = {
    'viewer': ['read'],
    'moderator': ['read', 'moderate', 'delete_content'],
    'admin': ['read', 'write', 'moderate', 'delete_content', 'manage_users'],
    'super_admin': ['read', 'write', 'moderate', 'delete_content', 'manage_users', 'manage_admins', 'system_config']
  };

  return rolePermissions[role] || rolePermissions['viewer'];
}

/**
 * Require admin access for a request
 */
export async function requireAdmin(userId: string): Promise<AdminUser> {
  const admin = await getAdminUser(userId);
  if (!admin) {
    throw new Error('Admin access required');
  }
  return admin;
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  target: unknown,
  metadata?: unknown
) {
  try {
    await adminDb.collection('admin_logs').add({
      adminId,
      action,
      target,
      metadata,
      timestamp: new Date(),
      campusId: 'ub-buffalo' // TODO: Get from admin record
    });
  } catch (error) {
    logger.error('Failed to log admin action', {
      metadata: { adminId, action },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Grant admin access to a user
 * Only super_admins can do this
 */
export async function grantAdminAccess(
  granterId: string,
  targetUserId: string,
  targetEmail: string,
  role: AdminUser['role'] = 'viewer',
  campusId?: string
): Promise<boolean> {
  try {
    // Verify granter is super_admin
    const granterAdmin = await getAdminUser(granterId);
    if (!granterAdmin || granterAdmin.role !== 'super_admin') {
      throw new Error('Only super admins can grant admin access');
    }

    // Create admin record
    await adminDb.collection('admins').doc(targetUserId).set({
      email: targetEmail.toLowerCase(),
      role,
      grantedAt: new Date(),
      grantedBy: granterId,
      campusId,
      active: true
    });

    // Set Firebase custom claims
    const user = await auth().getUser(targetUserId);
    await auth().setCustomUserClaims(targetUserId, {
      ...user.customClaims,
      admin: true,
      adminRole: role
    });

    await logAdminAction(granterId, 'grant_admin', { targetUserId, role });
    logger.info('Admin access granted', { granterId, targetUserId, role });

    return true;
  } catch (error) {
    logger.error('Failed to grant admin access', { granterId, targetUserId, error });
    return false;
  }
}

/**
 * Revoke admin access from a user
 */
export async function revokeAdminAccess(
  revokerId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // Verify revoker is super_admin
    const revokerAdmin = await getAdminUser(revokerId);
    if (!revokerAdmin || revokerAdmin.role !== 'super_admin') {
      throw new Error('Only super admins can revoke admin access');
    }

    // Update Firestore record
    await adminDb.collection('admins').doc(targetUserId).update({
      active: false,
      revokedAt: new Date(),
      revokedBy: revokerId
    });

    // Remove Firebase custom claims
    const user = await auth().getUser(targetUserId);
    const newClaims = { ...user.customClaims };
    delete newClaims.admin;
    delete newClaims.adminRole;
    await auth().setCustomUserClaims(targetUserId, newClaims);

    await logAdminAction(revokerId, 'revoke_admin', { targetUserId });
    logger.info('Admin access revoked', { revokerId, targetUserId });

    return true;
  } catch (error) {
    logger.error('Failed to revoke admin access', { revokerId, targetUserId, error });
    return false;
  }
}
