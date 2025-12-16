/**
 * Session Revocation Service
 *
 * Provides ability to revoke sessions before they expire.
 * Uses in-memory cache with Firestore persistence for production.
 *
 * Use cases:
 * - User explicitly logs out from all devices
 * - Admin revokes a suspicious session
 * - Password change requires re-authentication
 * - Security incident response
 */

import { logger } from './logger';
import { dbAdmin, isFirebaseConfigured } from './firebase-admin';

// Collection names
const REVOKED_SESSIONS_COLLECTION = 'revokedSessions';
const REVOKED_USER_SESSIONS_COLLECTION = 'revokedUserSessions';

/**
 * In-memory cache of revoked session IDs
 * Key: sessionId, Value: revocation timestamp
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
let syncedFromFirestore = false;

/**
 * Sync revocations from Firestore on startup
 */
async function syncFromFirestore(): Promise<void> {
  if (!isFirebaseConfigured || syncedFromFirestore) return;

  try {
    const cutoffDate = new Date(Date.now() - MAX_REVOCATION_AGE);

    // Load revoked sessions
    const sessionsSnapshot = await dbAdmin
      .collection(REVOKED_SESSIONS_COLLECTION)
      .where('revokedAt', '>', cutoffDate)
      .get();

    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      revokedSessions.set(doc.id, data.revokedAt.toMillis());
    });

    // Load revoked user sessions
    const userSessionsSnapshot = await dbAdmin
      .collection(REVOKED_USER_SESSIONS_COLLECTION)
      .where('revokedAt', '>', cutoffDate)
      .get();

    userSessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      revokedUserSessions.set(doc.id, data.revokedAt.toMillis());
    });

    syncedFromFirestore = true;
    logger.info('Session revocation synced from Firestore', {
      component: 'session-revocation',
      sessionCount: sessionsSnapshot.size,
      userCount: userSessionsSnapshot.size,
    });
  } catch (error) {
    logger.warn('Failed to sync session revocations from Firestore', {
      component: 'session-revocation',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Trigger sync on module load (non-blocking)
syncFromFirestore().catch(() => {
  // Errors already logged in syncFromFirestore
});

/**
 * Start the cleanup timer
 */
function startCleanupTimer() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(async () => {
    const cutoff = Date.now() - MAX_REVOCATION_AGE;
    const cutoffDate = new Date(cutoff);

    // Clean up in-memory caches
    for (const [sessionId, timestamp] of revokedSessions.entries()) {
      if (timestamp < cutoff) {
        revokedSessions.delete(sessionId);
      }
    }

    for (const [userId, timestamp] of revokedUserSessions.entries()) {
      if (timestamp < cutoff) {
        revokedUserSessions.delete(userId);
      }
    }

    // Clean up Firestore (if configured)
    if (isFirebaseConfigured) {
      try {
        // Delete old session revocations
        const oldSessions = await dbAdmin
          .collection(REVOKED_SESSIONS_COLLECTION)
          .where('revokedAt', '<', cutoffDate)
          .limit(100)
          .get();

        const sessionBatch = dbAdmin.batch();
        oldSessions.docs.forEach((doc) => {
          sessionBatch.delete(doc.ref);
        });
        if (!oldSessions.empty) {
          await sessionBatch.commit();
        }

        // Delete old user session revocations
        const oldUserSessions = await dbAdmin
          .collection(REVOKED_USER_SESSIONS_COLLECTION)
          .where('revokedAt', '<', cutoffDate)
          .limit(100)
          .get();

        const userBatch = dbAdmin.batch();
        oldUserSessions.docs.forEach((doc) => {
          userBatch.delete(doc.ref);
        });
        if (!oldUserSessions.empty) {
          await userBatch.commit();
        }

        logger.debug('Session revocation Firestore cleanup completed', {
          component: 'session-revocation',
          deletedSessions: oldSessions.size,
          deletedUserSessions: oldUserSessions.size,
        });
      } catch (error) {
        logger.warn('Failed to clean up old revocations from Firestore', {
          component: 'session-revocation',
          error: error instanceof Error ? error.message : String(error),
        });
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
export async function revokeSessionAsync(sessionId: string): Promise<void> {
  const timestamp = Date.now();
  revokedSessions.set(sessionId, timestamp);

  // Persist to Firestore
  if (isFirebaseConfigured) {
    try {
      await dbAdmin.collection(REVOKED_SESSIONS_COLLECTION).doc(sessionId).set({
        revokedAt: new Date(timestamp),
        createdAt: new Date(timestamp),
      });
    } catch (error) {
      logger.warn('Failed to persist session revocation to Firestore', {
        component: 'session-revocation',
        sessionId: sessionId.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('Session revoked', {
    component: 'session-revocation',
    sessionId: sessionId.substring(0, 8) + '...',
    persisted: isFirebaseConfigured,
  });
}

/**
 * Revoke a specific session (sync version for backward compatibility)
 */
export function revokeSession(sessionId: string): void {
  revokedSessions.set(sessionId, Date.now());

  // Fire-and-forget persistence
  revokeSessionAsync(sessionId).catch(() => {
    // Errors already logged in async version
  });

  logger.info('Session revoked', {
    component: 'session-revocation',
    sessionId: sessionId.substring(0, 8) + '...',
  });
}

/**
 * Revoke all sessions for a user (async version)
 */
export async function revokeAllUserSessionsAsync(userId: string): Promise<void> {
  const timestamp = Date.now();
  revokedUserSessions.set(userId, timestamp);

  // Persist to Firestore
  if (isFirebaseConfigured) {
    try {
      await dbAdmin.collection(REVOKED_USER_SESSIONS_COLLECTION).doc(userId).set({
        revokedAt: new Date(timestamp),
        createdAt: new Date(timestamp),
      });
    } catch (error) {
      logger.warn('Failed to persist user session revocation to Firestore', {
        component: 'session-revocation',
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('All user sessions revoked', {
    component: 'session-revocation',
    userId,
    persisted: isFirebaseConfigured,
  });
}

/**
 * Revoke all sessions for a user (sync version for backward compatibility)
 */
export function revokeAllUserSessions(userId: string): void {
  revokedUserSessions.set(userId, Date.now());

  // Fire-and-forget persistence
  revokeAllUserSessionsAsync(userId).catch(() => {
    // Errors already logged in async version
  });

  logger.info('All user sessions revoked', {
    component: 'session-revocation',
    userId,
  });
}

/**
 * Check if a session is revoked (checks both memory and Firestore if needed)
 */
export function isSessionRevoked(sessionId: string): boolean {
  return revokedSessions.has(sessionId);
}

/**
 * Check if a session is revoked (async version with Firestore fallback)
 */
export async function isSessionRevokedAsync(sessionId: string): Promise<boolean> {
  // Check memory cache first
  if (revokedSessions.has(sessionId)) {
    return true;
  }

  // If Firestore is configured and we haven't synced, check Firestore
  if (isFirebaseConfigured && !syncedFromFirestore) {
    try {
      const doc = await dbAdmin
        .collection(REVOKED_SESSIONS_COLLECTION)
        .doc(sessionId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        const revokedAt = data?.revokedAt?.toMillis();
        if (revokedAt) {
          // Add to cache for future lookups
          revokedSessions.set(sessionId, revokedAt);
          return true;
        }
      }
    } catch (error) {
      logger.warn('Failed to check session revocation in Firestore', {
        component: 'session-revocation',
        sessionId: sessionId.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return false;
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
 * Check if a user's session is revoked (async with Firestore fallback)
 */
export async function isUserSessionRevokedAsync(
  userId: string,
  sessionCreatedAt: string | number
): Promise<boolean> {
  const createdAtMs = typeof sessionCreatedAt === 'string'
    ? new Date(sessionCreatedAt).getTime()
    : sessionCreatedAt;

  // Check memory cache first
  const revokedAt = revokedUserSessions.get(userId);
  if (revokedAt && createdAtMs < revokedAt) {
    return true;
  }

  // If Firestore is configured and we haven't synced, check Firestore
  if (isFirebaseConfigured && !syncedFromFirestore) {
    try {
      const doc = await dbAdmin
        .collection(REVOKED_USER_SESSIONS_COLLECTION)
        .doc(userId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        const firestoreRevokedAt = data?.revokedAt?.toMillis();
        if (firestoreRevokedAt) {
          // Add to cache for future lookups
          revokedUserSessions.set(userId, firestoreRevokedAt);
          if (createdAtMs < firestoreRevokedAt) {
            return true;
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to check user session revocation in Firestore', {
        component: 'session-revocation',
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return false;
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
 * Check if any revocation applies to a session (async with Firestore)
 */
export async function isSessionInvalidAsync(
  sessionId: string,
  userId: string,
  sessionCreatedAt: string | number
): Promise<boolean> {
  const [sessionRevoked, userRevoked] = await Promise.all([
    isSessionRevokedAsync(sessionId),
    isUserSessionRevokedAsync(userId, sessionCreatedAt),
  ]);
  return sessionRevoked || userRevoked;
}

/**
 * Get all active sessions for a user (for session management UI)
 * Note: This returns sessions from the sessions collection, not revocations
 */
export async function getUserActiveSessions(userId: string): Promise<Array<{
  sessionId: string;
  createdAt: Date;
  lastActiveAt: Date;
  userAgent?: string;
  ip?: string;
}>> {
  if (!isFirebaseConfigured) {
    return [];
  }

  try {
    const sessionsSnapshot = await dbAdmin
      .collection('userSessions')
      .where('userId', '==', userId)
      .where('expiresAt', '>', new Date())
      .orderBy('expiresAt', 'desc')
      .limit(20)
      .get();

    return sessionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        sessionId: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
        userAgent: data.userAgent,
        ip: data.ip,
      };
    });
  } catch (error) {
    logger.warn('Failed to get user active sessions', {
      component: 'session-revocation',
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Get revocation stats (for health checks)
 */
export function getRevocationStats(): {
  revokedSessionCount: number;
  revokedUserCount: number;
  syncedFromFirestore: boolean;
  firestoreEnabled: boolean;
} {
  return {
    revokedSessionCount: revokedSessions.size,
    revokedUserCount: revokedUserSessions.size,
    syncedFromFirestore,
    firestoreEnabled: isFirebaseConfigured,
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
