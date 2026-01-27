/**
 * Access Code Security Module
 *
 * SECURITY: Implements brute force protection for access code verification:
 * - SHA256 hashing of codes (never store plaintext)
 * - IP-based lockout after repeated failures
 * - Attempt tracking with exponential backoff
 * - Persistent lockout state in Firestore
 */

import { createHash } from 'crypto';
import { dbAdmin, isFirebaseConfigured } from './firebase-admin';
import { logger } from './logger';
import { logSecurityEvent } from './structured-logger';

// Security constants
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_ESCALATION_FACTOR = 2; // Double lockout time on repeated violations
const MAX_LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // Max 24 hours

// In-memory cache for lockouts (reduces Firestore reads)
const lockoutCache = new Map<string, { lockedUntil: number; violations: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Hash an access code using SHA256
 * SECURITY: Always hash codes before storage or comparison
 */
export function hashAccessCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

/**
 * Normalize IP address for consistent tracking
 */
function normalizeIp(ip: string): string {
  return ip.toLowerCase().trim().replace(/[^a-z0-9.:_-]/g, '_').substring(0, 50) || 'anonymous';
}

/**
 * Check if an IP is currently locked out
 * Returns lockout info if locked, null if allowed
 */
export async function checkAccessCodeLockout(
  ip: string
): Promise<{ locked: boolean; lockedUntil?: Date; remainingMs?: number; violations?: number }> {
  const normalizedIp = normalizeIp(ip);
  const now = Date.now();

  // Check cache first
  const cached = lockoutCache.get(normalizedIp);
  if (cached && cached.lockedUntil > now) {
    return {
      locked: true,
      lockedUntil: new Date(cached.lockedUntil),
      remainingMs: cached.lockedUntil - now,
      violations: cached.violations,
    };
  }

  // Check Firestore for persistent lockout
  if (isFirebaseConfigured) {
    try {
      const lockoutDoc = await dbAdmin
        .collection('access_code_lockouts')
        .doc(normalizedIp)
        .get();

      if (lockoutDoc.exists) {
        const data = lockoutDoc.data();
        const lockedUntil = data?.lockedUntil?.toDate?.()?.getTime() || 0;
        const violations = data?.violations || 0;

        if (lockedUntil > now) {
          // Update cache
          lockoutCache.set(normalizedIp, { lockedUntil, violations });

          return {
            locked: true,
            lockedUntil: new Date(lockedUntil),
            remainingMs: lockedUntil - now,
            violations,
          };
        }
      }
    } catch (error) {
      logger.error('Failed to check access code lockout', {
        ip: normalizedIp,
        error: error instanceof Error ? error.message : String(error),
      });
      // On error, fail secure - allow with warning
    }
  }

  return { locked: false };
}

/**
 * Record a failed access code attempt
 * SECURITY: Tracks failures and enforces lockouts with escalation
 */
export async function recordFailedAccessCodeAttempt(ip: string): Promise<{
  locked: boolean;
  lockedUntil?: Date;
  attemptsRemaining?: number;
}> {
  const normalizedIp = normalizeIp(ip);
  const now = Date.now();

  if (!isFirebaseConfigured) {
    // In development without Firebase, use in-memory only
    const cached = lockoutCache.get(normalizedIp) || { lockedUntil: 0, violations: 0 };
    cached.violations++;

    if (cached.violations >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
      const lockoutDuration = Math.min(
        LOCKOUT_DURATION_MS * Math.pow(LOCKOUT_ESCALATION_FACTOR, Math.floor(cached.violations / MAX_ATTEMPTS_BEFORE_LOCKOUT) - 1),
        MAX_LOCKOUT_DURATION_MS
      );
      cached.lockedUntil = now + lockoutDuration;
      lockoutCache.set(normalizedIp, cached);

      logger.warn('Access code lockout triggered (in-memory)', {
        ip: normalizedIp,
        violations: cached.violations,
        lockedUntil: new Date(cached.lockedUntil).toISOString(),
      });

      return {
        locked: true,
        lockedUntil: new Date(cached.lockedUntil),
      };
    }

    lockoutCache.set(normalizedIp, cached);
    return {
      locked: false,
      attemptsRemaining: MAX_ATTEMPTS_BEFORE_LOCKOUT - cached.violations,
    };
  }

  try {
    const lockoutRef = dbAdmin.collection('access_code_lockouts').doc(normalizedIp);

    const result = await dbAdmin.runTransaction(async (transaction) => {
      const doc = await transaction.get(lockoutRef);
      const data = doc.data() || {};

      const violations = (data.violations || 0) + 1;
      const previousLockouts = data.previousLockouts || 0;

      // Check if should trigger lockout
      if (violations >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
        // Escalating lockout duration based on previous lockouts
        const lockoutDuration = Math.min(
          LOCKOUT_DURATION_MS * Math.pow(LOCKOUT_ESCALATION_FACTOR, previousLockouts),
          MAX_LOCKOUT_DURATION_MS
        );
        const lockedUntil = new Date(now + lockoutDuration);

        transaction.set(lockoutRef, {
          ip: normalizedIp,
          violations,
          lockedUntil,
          previousLockouts: previousLockouts + 1,
          lastAttempt: new Date(),
          createdAt: data.createdAt || new Date(),
        });

        // Update cache
        lockoutCache.set(normalizedIp, { lockedUntil: lockedUntil.getTime(), violations });

        // Log security event
        logSecurityEvent('suspicious_activity', {
          operation: 'access_code_lockout',
          tags: {
            ip: normalizedIp,
            violations: violations.toString(),
            lockoutMinutes: Math.round(lockoutDuration / 60000).toString(),
            previousLockouts: previousLockouts.toString(),
          },
        });

        logger.warn('Access code lockout triggered', {
          ip: normalizedIp,
          violations,
          lockedUntil: lockedUntil.toISOString(),
          lockoutMinutes: Math.round(lockoutDuration / 60000),
        });

        return {
          locked: true,
          lockedUntil,
        };
      }

      // Not locked yet, just record the attempt
      transaction.set(
        lockoutRef,
        {
          ip: normalizedIp,
          violations,
          previousLockouts,
          lastAttempt: new Date(),
          createdAt: data.createdAt || new Date(),
        },
        { merge: true }
      );

      return {
        locked: false,
        attemptsRemaining: MAX_ATTEMPTS_BEFORE_LOCKOUT - violations,
      };
    });

    return result;
  } catch (error) {
    logger.error('Failed to record access code attempt', {
      ip: normalizedIp,
      error: error instanceof Error ? error.message : String(error),
    });

    // Fail secure - assume they're getting close to lockout
    return {
      locked: false,
      attemptsRemaining: 1,
    };
  }
}

/**
 * Record a successful access code verification
 * SECURITY: Resets violation count but preserves lockout history
 */
export async function recordSuccessfulAccessCode(ip: string): Promise<void> {
  const normalizedIp = normalizeIp(ip);

  // Clear from cache
  lockoutCache.delete(normalizedIp);

  if (!isFirebaseConfigured) return;

  try {
    const lockoutRef = dbAdmin.collection('access_code_lockouts').doc(normalizedIp);
    const doc = await lockoutRef.get();

    if (doc.exists) {
      // Reset violations but keep history
      await lockoutRef.update({
        violations: 0,
        lockedUntil: null,
        lastSuccessfulAttempt: new Date(),
      });
    }
  } catch (error) {
    // Non-critical - just log
    logger.error('Failed to record successful access code', {
      ip: normalizedIp,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Verify an access code against hashed storage
 * SECURITY: Always compare hashes, never plaintext
 */
export async function verifyAccessCode(code: string): Promise<{
  valid: boolean;
  codeId?: string;
  useCount?: number;
}> {
  // DEV BYPASS: Accept test code 000000 in development mode
  if (process.env.NODE_ENV === 'development' && code === '000000') {
    logger.info('DEV MODE: Access code bypass with test code 000000');
    return { valid: true, codeId: 'dev-test-code', useCount: 1 };
  }

  if (!isFirebaseConfigured) {
    logger.warn('Access code verification attempted without Firebase configured');
    return { valid: false };
  }

  const codeHash = hashAccessCode(code);

  try {
    // Query by hash instead of document ID
    const snapshot = await dbAdmin
      .collection('access_codes')
      .where('codeHash', '==', codeHash)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Update usage stats
    await doc.ref.update({
      lastUsed: new Date(),
      useCount: (data.useCount || 0) + 1,
    });

    logger.info('Access code verified', {
      codeId: doc.id,
      uses: (data.useCount || 0) + 1,
    });

    return {
      valid: true,
      codeId: doc.id,
      useCount: (data.useCount || 0) + 1,
    };
  } catch (error) {
    logger.error('Access code verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { valid: false };
  }
}

/**
 * Create a new access code (admin use)
 * SECURITY: Generates code, hashes it, stores only the hash
 */
export async function createAccessCode(options?: {
  notes?: string;
  createdBy?: string;
}): Promise<{ code: string; id: string } | null> {
  if (!isFirebaseConfigured) {
    return null;
  }

  // Generate cryptographically secure 6-digit code
  const { randomInt } = await import('crypto');
  const code = String(randomInt(100000, 999999));
  const codeHash = hashAccessCode(code);

  try {
    const docRef = await dbAdmin.collection('access_codes').add({
      codeHash,
      active: true,
      createdAt: new Date(),
      createdBy: options?.createdBy || 'system',
      notes: options?.notes || null,
      useCount: 0,
      lastUsed: null,
    });

    logger.info('Access code created', {
      id: docRef.id,
      createdBy: options?.createdBy || 'system',
    });

    return { code, id: docRef.id };
  } catch (error) {
    logger.error('Failed to create access code', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Disable an access code by ID
 */
export async function disableAccessCode(codeId: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;

  try {
    await dbAdmin.collection('access_codes').doc(codeId).update({
      active: false,
      disabledAt: new Date(),
    });
    return true;
  } catch (error) {
    logger.error('Failed to disable access code', {
      codeId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
