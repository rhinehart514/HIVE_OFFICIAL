/**
 * Admin Authentication Utilities
 *
 * SECURITY: Centralized admin verification using Firestore + Firebase custom claims
 * No hardcoded admin emails - all admins managed via Firestore 'admins' collection
 */

import { dbAdmin } from './firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { logger } from './structured-logger';

export interface AdminRecord {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  grantedAt: Date;
  grantedBy: string;
  campusId?: string;
  active: boolean;
}

/**
 * Check if a user has admin privileges
 * SECURITY: Uses Firestore admins collection + Firebase custom claims
 * No hardcoded emails - admins must be added via Firestore
 */
export async function isAdmin(
  userId: string,
  userEmail?: string | null
): Promise<boolean> {
  try {
    // First check: Firebase custom claims (fastest path)
    try {
      const auth = getAuth();
      const user = await auth.getUser(userId);
      if (user.customClaims?.admin === true) {
        return true;
      }
    } catch {
      // Auth lookup failed, continue to Firestore check
    }

    // Second check: Firestore admins collection
    const adminDoc = await dbAdmin
      .collection('admins')
      .doc(userId)
      .get();

    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      if (adminData?.active === true) {
        // Grant custom claim for faster future checks
        try {
          const auth = getAuth();
          const user = await auth.getUser(userId);
          await auth.setCustomUserClaims(userId, {
            ...user.customClaims,
            admin: true,
            adminRole: adminData.role
          });
          logger.info('Admin claim granted', { userId, role: adminData.role });
        } catch {
          // Failed to set claim, but user is still admin
        }
        return true;
      }
    }

    // Third check: By email in Firestore (if email provided)
    if (userEmail) {
      const emailQuery = await dbAdmin
        .collection('admins')
        .where('email', '==', userEmail.toLowerCase())
        .where('active', '==', true)
        .limit(1)
        .get();

      if (!emailQuery.empty) {
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
 * Get admin record from Firestore
 */
export async function getAdminRecord(userId: string): Promise<AdminRecord | null> {
  try {
    const adminDoc = await dbAdmin
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

    return {
      userId,
      email: data.email,
      role: data.role || 'viewer',
      grantedAt: data.grantedAt?.toDate() || new Date(),
      grantedBy: data.grantedBy || 'system',
      campusId: data.campusId,
      active: data.active
    };
  } catch (error) {
    logger.error('Error getting admin record', { userId, error });
    return null;
  }
}

/**
 * Check if admin has specific role or higher
 */
export function hasAdminRole(
  adminRole: AdminRecord['role'],
  requiredRole: AdminRecord['role']
): boolean {
  const roleHierarchy: Record<AdminRecord['role'], number> = {
    'viewer': 1,
    'moderator': 2,
    'admin': 3,
    'super_admin': 4
  };

  return roleHierarchy[adminRole] >= roleHierarchy[requiredRole];
}

/**
 * Require admin access - throws if not admin
 */
export async function requireAdmin(userId: string): Promise<AdminRecord> {
  const adminRecord = await getAdminRecord(userId);
  if (!adminRecord) {
    throw new Error('Admin access required');
  }
  return adminRecord;
}

/**
 * Verify admin request from Authorization header
 * Used for API routes that need admin verification
 */
export async function verifyAdminRequest(request: Request): Promise<
  | { success: true; admin: AdminRecord }
  | { success: false; error: string }
> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return { success: false, error: 'Authorization header required' };
    }

    // Extract user ID from Bearer token
    const userId = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!userId) {
      return { success: false, error: 'Invalid authorization token' };
    }

    const adminRecord = await getAdminRecord(userId);
    if (!adminRecord) {
      return { success: false, error: 'Admin access required' };
    }

    return { success: true, admin: adminRecord };
  } catch (error) {
    logger.error('Admin verification failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return { success: false, error: 'Authentication failed' };
  }
}
