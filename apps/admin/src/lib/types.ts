/**
 * Shared types for admin authentication
 * These are safe to import on client and server
 */

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  permissions: string[];
  lastLogin: Date;
  campusId?: string;
}
