/**
 * @hive/auth-logic
 *
 * Unified authentication system using JWT cookies.
 * Single source of truth - no localStorage, no Firebase client SDK for auth state.
 */

// Main auth hook - fetches from /api/auth/me
export { useAuth } from './hooks/use-auth';
export type { AuthUser, AuthError, UseAuthReturn } from './hooks/use-auth';

// Legacy exports for backward compatibility (can be removed later)
export { FirebaseErrorHandler, useFirebaseErrorHandler } from './firebase-error-handler';
export { handleAuthError } from './error-handler';
export type { AuthError as LegacyAuthError } from './error-handler';

// Session management utilities
export { SessionManager, trackUserActivity, useActivityTracking } from './session-manager';
export type { SessionInfo } from './session-manager';
