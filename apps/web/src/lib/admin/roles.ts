/**
 * Centralized admin role helpers
 *
 * SECURITY: Admin checks use Firestore 'admins' collection
 * Environment variables provide bootstrap admins only
 * All runtime admin checks go through isAdmin() from admin-auth.ts
 */

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
 * SECURITY: For quick checks only. Use isAdmin() for authoritative checks.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = getBootstrapAdminEmails();
  return list.includes(email.toLowerCase());
}

/**
 * @deprecated Use getBootstrapAdminEmails() instead
 */
export const getAdminEmails = getBootstrapAdminEmails;

