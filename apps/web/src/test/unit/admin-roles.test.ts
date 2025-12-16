/**
 * Unit tests for admin role helpers
 *
 * Tests the centralized admin role functions used for
 * authentication and authorization.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAdminEmail,
  getBootstrapAdminEmails,
  isAdminAutoGrantAllowed,
  shouldGrantAdmin,
  getAdminRoleForEmail,
  getPermissionsForRole,
} from '@/lib/admin/roles';

describe('Admin Roles', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAdminEmail', () => {
    it('returns false for undefined email', () => {
      expect(isAdminEmail(undefined)).toBe(false);
    });

    it('returns false for null email', () => {
      expect(isAdminEmail(null)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isAdminEmail('')).toBe(false);
    });

    it('returns false when no admin emails configured', () => {
      delete process.env.HIVE_ADMIN_EMAILS;
      delete process.env.ADMIN_EMAILS;
      expect(isAdminEmail('test@example.com')).toBe(false);
    });

    it('returns true for email in HIVE_ADMIN_EMAILS list', () => {
      process.env.HIVE_ADMIN_EMAILS = 'admin@buffalo.edu,super@buffalo.edu';
      // Re-import to pick up new env
      const { isAdminEmail: checkAdmin } = require('@/lib/admin/roles');
      expect(checkAdmin('admin@buffalo.edu')).toBe(true);
    });

    it('is case-insensitive', () => {
      process.env.HIVE_ADMIN_EMAILS = 'admin@buffalo.edu';
      const { isAdminEmail: checkAdmin } = require('@/lib/admin/roles');
      expect(checkAdmin('ADMIN@BUFFALO.EDU')).toBe(true);
      expect(checkAdmin('Admin@Buffalo.Edu')).toBe(true);
    });

    it('handles whitespace in admin list', () => {
      process.env.HIVE_ADMIN_EMAILS = '  admin@buffalo.edu , super@buffalo.edu  ';
      const { isAdminEmail: checkAdmin } = require('@/lib/admin/roles');
      expect(checkAdmin('admin@buffalo.edu')).toBe(true);
      expect(checkAdmin('super@buffalo.edu')).toBe(true);
    });
  });

  describe('getBootstrapAdminEmails', () => {
    it('returns empty array when no env vars set', () => {
      delete process.env.HIVE_ADMIN_EMAILS;
      delete process.env.ADMIN_EMAILS;
      const { getBootstrapAdminEmails: getEmails } = require('@/lib/admin/roles');
      expect(getEmails()).toEqual([]);
    });

    it('prefers HIVE_ADMIN_EMAILS over ADMIN_EMAILS', () => {
      process.env.HIVE_ADMIN_EMAILS = 'hive@buffalo.edu';
      process.env.ADMIN_EMAILS = 'admin@buffalo.edu';
      const { getBootstrapAdminEmails: getEmails } = require('@/lib/admin/roles');
      expect(getEmails()).toContain('hive@buffalo.edu');
    });

    it('falls back to ADMIN_EMAILS when HIVE_ADMIN_EMAILS not set', () => {
      delete process.env.HIVE_ADMIN_EMAILS;
      process.env.ADMIN_EMAILS = 'fallback@buffalo.edu';
      const { getBootstrapAdminEmails: getEmails } = require('@/lib/admin/roles');
      expect(getEmails()).toContain('fallback@buffalo.edu');
    });

    it('returns lowercase emails', () => {
      process.env.HIVE_ADMIN_EMAILS = 'UPPER@BUFFALO.EDU,Mixed@Buffalo.edu';
      const { getBootstrapAdminEmails: getEmails } = require('@/lib/admin/roles');
      const emails = getEmails();
      expect(emails).toContain('upper@buffalo.edu');
      expect(emails).toContain('mixed@buffalo.edu');
    });

    it('filters out empty entries', () => {
      process.env.HIVE_ADMIN_EMAILS = 'admin@buffalo.edu,,  ,super@buffalo.edu';
      const { getBootstrapAdminEmails: getEmails } = require('@/lib/admin/roles');
      const emails = getEmails();
      expect(emails).toEqual(['admin@buffalo.edu', 'super@buffalo.edu']);
    });
  });

  describe('isAdminAutoGrantAllowed', () => {
    it('returns false in production without explicit opt-in', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_ADMIN_AUTO_GRANT;
      const { isAdminAutoGrantAllowed: checkAllowed } = require('@/lib/admin/roles');
      expect(checkAllowed()).toBe(false);
    });

    it('returns true in production with explicit opt-in', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_ADMIN_AUTO_GRANT = 'true';
      const { isAdminAutoGrantAllowed: checkAllowed } = require('@/lib/admin/roles');
      expect(checkAllowed()).toBe(true);
    });

    it('returns true in development by default', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.ALLOW_ADMIN_AUTO_GRANT;
      const { isAdminAutoGrantAllowed: checkAllowed } = require('@/lib/admin/roles');
      expect(checkAllowed()).toBe(true);
    });

    it('returns false in production even with invalid ALLOW_ADMIN_AUTO_GRANT value', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_ADMIN_AUTO_GRANT = 'yes'; // Not 'true'
      const { isAdminAutoGrantAllowed: checkAllowed } = require('@/lib/admin/roles');
      expect(checkAllowed()).toBe(false);
    });
  });

  describe('shouldGrantAdmin', () => {
    it('returns shouldGrant=false when auto-grant disabled', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_ADMIN_AUTO_GRANT;
      process.env.HIVE_ADMIN_EMAILS = 'admin@buffalo.edu';
      const { shouldGrantAdmin: checkGrant } = require('@/lib/admin/roles');
      const result = checkGrant('admin@buffalo.edu');
      expect(result.shouldGrant).toBe(false);
      expect(result.reason).toContain('disabled');
    });

    it('returns shouldGrant=false when email not in list', () => {
      process.env.NODE_ENV = 'development';
      process.env.HIVE_ADMIN_EMAILS = 'admin@buffalo.edu';
      const { shouldGrantAdmin: checkGrant } = require('@/lib/admin/roles');
      const result = checkGrant('notadmin@buffalo.edu');
      expect(result.shouldGrant).toBe(false);
      expect(result.reason).toContain('whitelist');
    });

    it('returns shouldGrant=true with role when conditions met', () => {
      process.env.NODE_ENV = 'development';
      process.env.HIVE_ADMIN_EMAILS = 'admin@buffalo.edu';
      const { shouldGrantAdmin: checkGrant } = require('@/lib/admin/roles');
      const result = checkGrant('admin@buffalo.edu');
      expect(result.shouldGrant).toBe(true);
      expect(result.role).toBeDefined();
    });
  });

  describe('getAdminRoleForEmail', () => {
    it('returns super_admin for super admin email', () => {
      process.env.HIVE_SUPER_ADMIN_EMAIL = 'super@buffalo.edu';
      const { getAdminRoleForEmail: getRole } = require('@/lib/admin/roles');
      expect(getRole('super@buffalo.edu')).toBe('super_admin');
    });

    it('returns admin for regular admin email', () => {
      process.env.HIVE_SUPER_ADMIN_EMAIL = 'super@buffalo.edu';
      const { getAdminRoleForEmail: getRole } = require('@/lib/admin/roles');
      expect(getRole('regular@buffalo.edu')).toBe('admin');
    });

    it('is case-insensitive for super admin', () => {
      process.env.HIVE_SUPER_ADMIN_EMAIL = 'super@buffalo.edu';
      const { getAdminRoleForEmail: getRole } = require('@/lib/admin/roles');
      expect(getRole('SUPER@BUFFALO.EDU')).toBe('super_admin');
    });
  });

  describe('getPermissionsForRole', () => {
    it('returns all permissions for super_admin', () => {
      expect(getPermissionsForRole('super_admin')).toContain('all');
    });

    it('returns expected permissions for admin', () => {
      const perms = getPermissionsForRole('admin');
      expect(perms).toContain('read');
      expect(perms).toContain('write');
      expect(perms).toContain('moderate');
    });

    it('returns limited permissions for moderator', () => {
      const perms = getPermissionsForRole('moderator');
      expect(perms).toContain('read');
      expect(perms).toContain('moderate');
      expect(perms).not.toContain('delete');
    });
  });
});
