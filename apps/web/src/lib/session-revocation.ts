/**
 * Session Revocation Service
 *
 * Provides ability to revoke sessions before they expire.
 * Uses in-memory cache with optional Firestore persistence for production.
 *
 * Use cases:
 * - User explicitly logs out from all devices
 * - Admin revokes a suspicious session
 * - Password change requires re-authentication
 * - Security incident response
 */

import { logger } from './logger';

/**
 * In-memory cache of revoked session IDs
 * Key: sessionId, Value: revocation timestamp
 *
 * In production, this should be backed by Redis or Firestore
 * for multi-instance deployments
 */
const revokedSessions = new Map<string, number>();

/**
 * In-memory cache of revoked user sessions (all sessions for a user)
 * Key: userId, Value: timestamp after which all sessions are invalid
 */
const revokedUserSessions = new Map<string, number>();

// Clean up old entries periodically (every 10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000;
const MAX_REVOCATION_AGE = 8 * 24 * 60 * 60 * 1000; // 8 days (longer than refresh token)

let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start the cleanup timer
 */
function startCleanupTimer() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - MAX_REVOCATION_AGE;

    // Clean up old session revocations
    for (const [sessionId, timestamp] of revokedSessions.entries()) {
      if (timestamp < cutoff) {
        revokedSessions.delete(sessionId);
      }
    }

    // Clean up old user revocations
    for (const [userId, timestamp] of revokedUserSessions.entries()) {
      if (timestamp < cutoff) {
        revokedUserSessions.delete(userId);
      }
    }

    logger.debug('Session revocation cleanup completed', {
      component: 'session-revocation',
      sessionCount: revokedSessions.size,
      userCount: revokedUserSessions.size,
    });
  }, CLEANUP_INTERVAL);

  // Don't prevent process exit
  cleanupTimer.unref();
}

// Start cleanup on module load
startCleanupTimer();

/**
 * Revoke a specific session
 */
export function revokeSession(sessionId: string): void {
  revokedSessions.set(sessionId, Date.now());
  logger.info('Session revoked', {
    component: 'session-revocation',
    sessionId: sessionId.substring(0, 8) + '...',
  });
}

/**
 * Revoke all sessions for a user
 * Sessions created before this timestamp will be invalid
 */
export function revokeAllUserSessions(userId: string): void {
  revokedUserSessions.set(userId, Date.now());
  logger.info('All user sessions revoked', {
    component: 'session-revocation',
    userId,
  });
}

/**
 * Check if a session is revoked
 */
export function isSessionRevoked(sessionId: string): boolean {
  return revokedSessions.has(sessionId);
}

/**
 * Check if a user's session is revoked
 * @param userId - The user ID
 * @param sessionCreatedAt - When the session was created (ISO string or timestamp)
 */
export function isUserSessionRevoked(userId: string, sessionCreatedAt: string | number): boolean {
  const revokedAt = revokedUserSessions.get(userId);
  if (!revokedAt) return false;

  const createdAtMs = typeof sessionCreatedAt === 'string'
    ? new Date(sessionCreatedAt).getTime()
    : sessionCreatedAt;

  // Session is revoked if it was created before the revocation timestamp
  return createdAtMs < revokedAt;
}

/**
 * Check if any revocation applies to a session
 */
export function isSessionInvalid(
  sessionId: string,
  userId: string,
  sessionCreatedAt: string | number
): boolean {
  return isSessionRevoked(sessionId) || isUserSessionRevoked(userId, sessionCreatedAt);
}

/**
 * Get revocation stats (for health checks)
 */
export function getRevocationStats(): {
  revokedSessionCount: number;
  revokedUserCount: number;
} {
  return {
    revokedSessionCount: revokedSessions.size,
    revokedUserCount: revokedUserSessions.size,
  };
}

/**
 * Clear all revocations (for testing only)
 */
export function clearAllRevocations(): void {
  if (process.env.NODE_ENV !== 'test') {
    logger.warn('clearAllRevocations called outside of test environment', {
      component: 'session-revocation',
    });
  }
  revokedSessions.clear();
  revokedUserSessions.clear();
}
