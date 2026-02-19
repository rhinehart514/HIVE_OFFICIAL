/**
 * HIVE Consolidated Authentication Utilities
 *
 * Single source of truth for authentication functions.
 * Server-side auth: lib/middleware/auth.ts
 * Client-side auth: lib/secure-auth-utils.ts
 */

// Server-side auth (consolidated in middleware/auth.ts)
export {
  getCurrentUser,
  requireAuth,
  validateAuth,
  getAuthTokenFromRequest,
  verifyAuthToken,
  auditAuthEvent,
  shouldBlockRequest,
  isProductionEnvironment,
  validateApiAuth,
  ApiResponse,
  type AuthenticatedUser,
  type AuthContext,
  type AuthOptions,
} from '../middleware/auth';

// Client-side auth utils
export {
  getSecureAuthHeaders,
  secureApiFetch,
  isAuthenticated,
  clearAuthentication,
  handleAuthError,
  type SecureAuthHeaders,
} from '../secure-auth-utils';

// Re-export the primary auth hook
export { useAuth, type UseAuthReturn as AuthHook } from '@hive/auth-logic';

// Admin auth
export { isAdmin } from '../admin-auth';
