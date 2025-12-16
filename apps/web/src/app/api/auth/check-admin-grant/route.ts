import { NextRequest as _NextRequest, NextResponse as _NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { withAuthAndErrors, getUserId, type AuthenticatedRequest, type ResponseFormatter } from '@/lib/middleware/index';
import {
  shouldGrantAdmin,
  getPermissionsForRole,
  logAdminOperation,
  type AdminRole,
} from '@/lib/admin/roles';

/**
 * Check and grant pending admin permissions
 *
 * SECURITY:
 * - Uses centralized admin role helpers for consistent security checks
 * - Admin auto-grant is DISABLED by default in production
 * - Requires ALLOW_ADMIN_AUTO_GRANT=true env var to enable in production
 * - All grants are audited with operation logging
 *
 * POST /api/auth/check-admin-grant
 */

export const POST = withAuthAndErrors(async (request, _context: Record<string, string | string[]>, respond: typeof ResponseFormatter) => {
  try {
    const userId = getUserId(request as AuthenticatedRequest);

    // Get user from Firebase Auth
    const auth = getAuth();
    const userRecord = await auth.getUser(userId);
    const userEmail = userRecord.email;

    if (!userEmail) {
      return respond.success({
        granted: false,
        reason: 'No email associated with account'
      });
    }

    const normalizedEmail = userEmail.toLowerCase();

    // Use centralized admin grant check (includes production guard)
    const grantCheck = shouldGrantAdmin(normalizedEmail);

    if (!grantCheck.shouldGrant) {
      // Log the rejection for audit
      logAdminOperation('admin_grant_rejected', userId, normalizedEmail, {
        reason: grantCheck.reason,
      });

      return respond.success({
        granted: false,
        reason: grantCheck.reason
      });
    }

    // Check if already has admin claims
    if (userRecord.customClaims?.isAdmin === true) {
      logger.info('User already has admin claims', {
        userId,
        email: normalizedEmail.replace(/(.{3}).*@/, '$1***@'),
        endpoint: '/api/auth/check-admin-grant'
      });

      return respond.success({
        granted: false,
        reason: 'Already admin',
        isAdmin: true
      });
    }

    // Get role and permissions from centralized config
    const role = grantCheck.role as AdminRole;
    const permissions = getPermissionsForRole(role);

    // Log the grant operation BEFORE executing
    logAdminOperation('admin_grant_initiated', userId, normalizedEmail, {
      role,
      permissions: permissions.slice(),
      grantedBy: 'auto-grant',
      userAgent: request.headers.get('user-agent')?.substring(0, 100),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Set Firebase custom claims
    const customClaims = {
      role,
      permissions: permissions.slice(),
      isAdmin: true,
      adminSince: new Date().toISOString()
    };

    await auth.setCustomUserClaims(userId, customClaims);

    // Update Firestore user document
    const userUpdateData = {
      isAdmin: true,
      adminRole: role,
      adminPermissions: permissions.slice(),
      adminGrantedAt: new Date().toISOString(),
      adminGrantedBy: 'auto-grant',
      email: normalizedEmail
    };

    await dbAdmin.collection('users').doc(userId).set(userUpdateData, { merge: true });

    // Add to admins collection with full audit info
    await dbAdmin.collection('admins').doc(userId).set({
      uid: userId,
      email: normalizedEmail,
      name: userRecord.displayName || normalizedEmail.split('@')[0],
      role,
      permissions: permissions.slice(),
      active: true,
      createdAt: new Date().toISOString(),
      grantedBy: 'auto-grant',
      grantedVia: 'check-admin-grant-endpoint',
      userAgent: request.headers.get('user-agent')?.substring(0, 200),
      grantedFromIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    // Remove from pending grants if exists
    try {
      await dbAdmin.collection('pendingAdminGrants').doc(normalizedEmail).delete();
    } catch {
      // Ignore if doesn't exist
    }

    // Log successful grant
    logAdminOperation('admin_grant_success', userId, normalizedEmail, {
      role,
      permissions: permissions.slice(),
    });

    return respond.success({
      granted: true,
      role,
      permissions: permissions.slice(),
      message: 'Admin permissions granted successfully. Please refresh to access admin features.'
    });

  } catch (error) {
    logger.error(
      `Error granting admin permissions at /api/auth/check-admin-grant`,
      { error: error instanceof Error ? error.message : String(error) }
    );

    return respond.error(
      'Failed to check/grant admin permissions',
      'INTERNAL_ERROR'
    );
  }
});