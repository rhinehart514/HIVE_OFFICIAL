/**
 * Admin Panel Authentication
 *
 * SECURITY: Uses Firestore admins collection + Firebase custom claims
 * No hardcoded admin emails or test tokens
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  permissions: string[];
  lastLogin: Date;
  campusId?: string;
}

// Get Firestore instance for admin checks
function getAdminDb() {
  return getFirestore();
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
 * Check if user is an admin
 * SECURITY: Uses Firestore admins collection + Firebase custom claims
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = await auth.getUser(userId);

    // First check: Firebase custom claims (fastest)
    if (user.customClaims?.admin === true) {
      return true;
    }

    // Second check: Firestore admins collection
    const db = getAdminDb();
    const adminDoc = await db.collection('admins').doc(userId).get();

    if (adminDoc.exists && adminDoc.data()?.active === true) {
      // Grant admin claim for faster future checks
      await auth.setCustomUserClaims(userId, {
        ...user.customClaims,
        admin: true,
        adminRole: adminDoc.data()?.role
      });
      return true;
    }

    // Third check: By email in Firestore
    if (user.email) {
      const emailQuery = await db
        .collection('admins')
        .where('email', '==', user.email.toLowerCase())
        .where('active', '==', true)
        .limit(1)
        .get();

      if (!emailQuery.empty) {
        const adminData = emailQuery.docs[0].data();
        await auth.setCustomUserClaims(userId, {
          ...user.customClaims,
          admin: true,
          adminRole: adminData.role
        });
        return true;
      }
    }

    return false;
  } catch {
    // Admin status check failed - deny access
    return false;
  }
}

/**
 * Get admin user details
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const hasAdmin = await isAdmin(userId);
    if (!hasAdmin) {
      return null;
    }

    const auth = getAuth();
    const userRecord = await auth.getUser(userId);

    // Get admin details from Firestore
    const db = getAdminDb();
    const adminDoc = await db.collection('admins').doc(userId).get();

    const adminData = adminDoc.exists ? adminDoc.data() : {};
    const role = (adminData?.role || userRecord.customClaims?.adminRole || 'admin') as AdminUser['role'];
    const permissions = getPermissionsForRole(role);

    return {
      id: userId,
      email: userRecord.email || '',
      role,
      permissions,
      lastLogin: new Date(),
      campusId: adminData?.campusId
    };
  } catch {
    // Failed to get admin user - return null
    return null;
  }
}

/**
 * Verify admin token from request
 * SECURITY: Verifies Firebase ID token, then checks admin status
 */
export async function verifyAdminToken(request: NextRequest): Promise<AdminUser | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // SECURITY: Always verify token with Firebase Admin
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    return await getAdminUser(userId);
  } catch {
    // Token verification failed - deny access
    return null;
  }
}

/**
 * Verify admin session from cookies
 */
export async function verifyAdminSession(): Promise<AdminUser | null> {
  // TODO: Implement proper session cookie verification with jose
  // For now, require API token authentication
  return null;
}

/**
 * Create admin session
 */
export function createAdminSession(userId: string): string {
  // TODO: Implement proper JWT session creation with jose
  return userId;
}

/**
 * Check if admin has permission
 */
export function hasPermission(admin: AdminUser, permission: string): boolean {
  return admin.permissions.includes(permission) || admin.role === 'super_admin';
}

/**
 * Admin authentication middleware
 */
export async function requireAdmin(request: NextRequest): Promise<{
  success: boolean;
  admin?: AdminUser;
  error?: string;
  status?: number;
}> {
  const admin = await verifyAdminToken(request);

  if (!admin) {
    return {
      success: false,
      error: 'Admin access required',
      status: 403
    };
  }

  return {
    success: true,
    admin
  };
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: string,
  details?: Record<string, unknown>,
  ipAddress?: string
) {
  try {
    const db = getAdminDb();
    await db.collection('admin_logs').add({
      adminId,
      action,
      details,
      ipAddress,
      timestamp: new Date()
    });
  } catch {
    // Activity logging is non-critical - fail silently
  }
}
