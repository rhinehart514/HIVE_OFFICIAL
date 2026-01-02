/**
 * Admin Panel Authentication
 *
 * SECURITY: Uses Firestore admins collection + Firebase custom claims
 * No hardcoded admin emails or test tokens
 *
 * Session Management: Uses jose for JWT session tokens stored in HTTP-only cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { auth as authAdmin, db as dbAdmin } from './firebase-admin';

// Session configuration
const SESSION_COOKIE_NAME = 'hive_admin_session';
const SESSION_DURATION_HOURS = 24;

// Get JWT secret - must be set in production
function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    // In development, use a deterministic fallback (NOT for production!)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ADMIN AUTH] Using development JWT secret - set ADMIN_JWT_SECRET in production');
      return new TextEncoder().encode('dev-only-secret-do-not-use-in-production');
    }
    throw new Error('ADMIN_JWT_SECRET environment variable is required in production');
  }
  return new TextEncoder().encode(secret);
}

interface AdminSessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: AdminUser['role'];
  permissions: string[];
  campusId?: string;
}

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
  return dbAdmin;
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
    const user = await authAdmin.getUser(userId);

    // First check: Firebase custom claims (fastest)
    if (user.customClaims?.admin === true) {
      return true;
    }

    // Second check: Firestore admins collection
    const db = getAdminDb();
    const adminDoc = await db.collection('admins').doc(userId).get();

    if (adminDoc.exists && adminDoc.data()?.active === true) {
      // Grant admin claim for faster future checks
      await authAdmin.setCustomUserClaims(userId, {
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
        await authAdmin.setCustomUserClaims(userId, {
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

    const userRecord = await authAdmin.getUser(userId);

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
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    return await getAdminUser(userId);
  } catch {
    // Token verification failed - deny access
    return null;
  }
}

/**
 * Verify admin session from cookies
 * SECURITY: Verifies JWT token from HTTP-only cookie
 */
export async function verifyAdminSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const secret = getJwtSecret();
    const { payload } = await jwtVerify(sessionCookie.value, secret, {
      algorithms: ['HS256'],
    });

    const sessionPayload = payload as AdminSessionPayload;

    // Validate required fields
    if (!sessionPayload.userId || !sessionPayload.email || !sessionPayload.role) {
      return null;
    }

    // Re-validate admin status in Firestore (ensures revoked admins can't use old sessions)
    const isStillAdmin = await isAdmin(sessionPayload.userId);
    if (!isStillAdmin) {
      return null;
    }

    return {
      id: sessionPayload.userId,
      email: sessionPayload.email,
      role: sessionPayload.role,
      permissions: sessionPayload.permissions || [],
      lastLogin: new Date(),
      campusId: sessionPayload.campusId,
    };
  } catch {
    // Session verification failed - token expired, tampered, or invalid
    return null;
  }
}

/**
 * Create admin session JWT
 * SECURITY: Creates signed JWT with admin claims
 */
export async function createAdminSession(admin: AdminUser): Promise<string> {
  const secret = getJwtSecret();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const token = await new SignJWT({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
    campusId: admin.campusId,
  } as AdminSessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setSubject(admin.id)
    .setIssuer('hive-admin')
    .setAudience('hive-admin-panel')
    .sign(secret);

  return token;
}

/**
 * Set admin session cookie on response
 * SECURITY: HTTP-only, Secure, SameSite=Strict
 */
export async function setAdminSessionCookie(
  response: NextResponse,
  admin: AdminUser
): Promise<NextResponse> {
  const token = await createAdminSession(admin);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/',
  });

  return response;
}

/**
 * Clear admin session cookie
 */
export function clearAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  });

  return response;
}

/**
 * Refresh admin session if close to expiry
 * Returns new response with refreshed cookie if needed
 */
export async function refreshAdminSessionIfNeeded(
  request: NextRequest,
  admin: AdminUser
): Promise<NextResponse | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const secret = getJwtSecret();
    const { payload } = await jwtVerify(sessionCookie.value, secret, {
      algorithms: ['HS256'],
    });

    // Check if token expires in less than 1 hour
    const exp = payload.exp;
    if (!exp) return null;

    const expiresIn = exp * 1000 - Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    if (expiresIn < ONE_HOUR) {
      // Refresh the session
      const response = NextResponse.next();
      return await setAdminSessionCookie(response, admin);
    }

    return null;
  } catch {
    return null;
  }
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
