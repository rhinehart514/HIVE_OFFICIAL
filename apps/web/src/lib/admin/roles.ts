/**
 * Centralized admin role helpers
 *
 * SECURITY: Multi-layer admin verification
 * 1. Bootstrap emails from env vars (initial setup only)
 * 2. Database verification in 'admins' collection
 * 3. All runtime admin checks should use verifyAdminStatus()
 *
 * Admin auto-grant is disabled by default in production.
 * Use ALLOW_ADMIN_AUTO_GRANT=true to enable (not recommended).
 */

import { logger } from '@/lib/logger';

/**
 * Check if admin auto-grant is allowed
 * SECURITY: Disabled by default in production
 */
export function isAdminAutoGrantAllowed(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const explicitlyAllowed = process.env.ALLOW_ADMIN_AUTO_GRANT === 'true';

  // In production, require explicit opt-in
  if (isProduction && !explicitlyAllowed) {
    return false;
  }

  return true;
}

/**
 * Get bootstrap admin emails from environment (for initial setup only)
 * SECURITY: These are only used to seed initial admins in Firestore
 */
export function getBootstrapAdminEmails(): string[] {
  const fromEnv = process.env.HIVE_ADMIN_EMAILS || process.env.ADMIN_EMAILS;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

/**
 * Check if email is in bootstrap admin list
 * SECURITY: For quick checks only. Does NOT grant admin status.
 * Use verifyAdminStatus() for authoritative checks.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = getBootstrapAdminEmails();
  return list.includes(email.toLowerCase());
}

/**
 * Admin role types
 */
export type AdminRole = 'super_admin' | 'admin' | 'moderator';

/**
 * Admin permissions
 */
export const ADMIN_PERMISSIONS = {
  super_admin: ['all'],
  admin: ['read', 'write', 'delete', 'moderate', 'manage_users', 'manage_spaces', 'feature_flags'],
  moderator: ['read', 'moderate'],
} as const;

/**
 * Determine admin role from email
 */
export function getAdminRoleForEmail(email: string): AdminRole {
  const superAdminEmail = (process.env.HIVE_SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (email.toLowerCase() === superAdminEmail) {
    return 'super_admin';
  }
  return 'admin';
}

/**
 * Get permissions for admin role
 */
export function getPermissionsForRole(role: AdminRole): readonly string[] {
  return ADMIN_PERMISSIONS[role] || ADMIN_PERMISSIONS.moderator;
}

/**
 * Log admin operation for audit trail
 */
export function logAdminOperation(
  operation: string,
  userId: string,
  email: string,
  details?: Record<string, unknown>
): void {
  logger.info(`ADMIN_AUDIT: ${operation}`, {
    component: 'admin-roles',
    userId,
    email: email.replace(/(.{3}).*@/, '$1***@'),
    operation,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * Check if admin grant should proceed
 * SECURITY: Returns false if auto-grant is disabled or email not in whitelist
 */
export function shouldGrantAdmin(email: string): {
  shouldGrant: boolean;
  reason: string;
  role?: AdminRole;
} {
  // Check if auto-grant is allowed
  if (!isAdminAutoGrantAllowed()) {
    return {
      shouldGrant: false,
      reason: 'Admin auto-grant is disabled. Set ALLOW_ADMIN_AUTO_GRANT=true to enable.',
    };
  }

  // Check if email is in bootstrap list
  if (!isAdminEmail(email)) {
    return {
      shouldGrant: false,
      reason: 'Email not in admin whitelist',
    };
  }

  const role = getAdminRoleForEmail(email);
  return {
    shouldGrant: true,
    reason: `Email in bootstrap admin list as ${role}`,
    role,
  };
}

/**
 * @deprecated Use getBootstrapAdminEmails() instead
 */
export const getAdminEmails = getBootstrapAdminEmails;

