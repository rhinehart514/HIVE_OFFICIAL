/**
 * HIVE Consolidated Authentication Utilities
 *
 * This is the single source of truth for authentication functions.
 * All auth-related imports should use this file.
 *
 * @author HIVE Platform Team
 * @version 2.0.0 - Consolidated from 14 auth files
 */

// Client-side secure auth utilities (from secure-auth-utils.ts)
import {
  getSecureAuthHeaders,
  secureApiFetch,
  isAuthenticated as isAuthenticatedFn,
  clearAuthentication,
  handleAuthError,
  type SecureAuthHeaders
} from '../secure-auth-utils'

// Re-export the primary auth hook from auth-logic package
import { useAuth, type UseAuthReturn as AuthHook } from '@hive/auth-logic'

// Server-side auth utilities - imported separately to avoid circular deps
import { getCurrentUser, requireAuth as requireAuthFn, getAuthTokenFromRequest, verifyAuthToken } from '../auth-server'
import { isAdmin as isAdminFn } from '../admin-auth'

// Type for authenticated user
export interface AuthUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  displayName?: string;
}

// Re-export individual functions for direct imports
export {
  getCurrentUser,
  requireAuthFn as requireAuth,
  isAdminFn as isAdmin,
  getAuthTokenFromRequest,
  verifyAuthToken,
  getSecureAuthHeaders,
  secureApiFetch,
  isAuthenticatedFn as isAuthenticated,
  clearAuthentication,
  handleAuthError,
  useAuth,
  type SecureAuthHeaders,
  type AuthHook
}

/**
 * Legacy compatibility exports
 * These will be phased out in favor of the consolidated functions above
 */
export type { AuthUser as LegacyAuthUser }

/**
 * Consolidated auth utilities - preferred interface
 */
export const Auth = {
  // Server-side functions
  server: {
    requireAuth: requireAuthFn,
    isAdmin: isAdminFn,
    getTokenFromRequest: getAuthTokenFromRequest,
    verifyToken: verifyAuthToken,
  },

  // Client-side functions
  client: {
    getHeaders: getSecureAuthHeaders,
    fetch: secureApiFetch,
    isAuthenticated: isAuthenticatedFn,
    logout: clearAuthentication,
    handleError: handleAuthError,
  },

  // React hook
  useAuth,
} as const
