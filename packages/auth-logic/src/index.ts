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

// NOTE: SessionManager was removed on 2024-12-09
// The app uses httpOnly JWT cookies with 30-day server-managed expiry.
// Client-side token refresh is not needed.
