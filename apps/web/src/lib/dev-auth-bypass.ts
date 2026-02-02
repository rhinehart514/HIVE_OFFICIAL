/**
 * Centralized Development Authentication Bypass
 *
 * SECURITY: This bypass requires ALL THREE conditions to be met:
 * 1. NODE_ENV === 'development'
 * 2. Firebase is NOT configured (no GOOGLE_APPLICATION_CREDENTIALS or service account)
 * 3. DEV_AUTH_BYPASS env var is explicitly set to 'true'
 *
 * This ensures the bypass:
 * - Never activates in production
 * - Never activates when Firebase is available (use real auth)
 * - Requires explicit opt-in via env var
 */

import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger, logSecurityEvent } from '@/lib/logger';

/**
 * Check if dev auth bypass is allowed
 *
 * Use this instead of scattered bypass checks across auth routes.
 * Logs all bypass attempts for security auditing.
 */
export function isDevAuthBypassAllowed(
  operation: string,
  context?: {
    email?: string;
    ip?: string;
    endpoint?: string;
  }
): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const bypassEnabled = process.env.DEV_AUTH_BYPASS === 'true';

  // ALL conditions must be true
  const allowed = isDevelopment && !isFirebaseConfigured && bypassEnabled;

  // Log all bypass attempts (both allowed and denied) for security auditing
  if (allowed) {
    logger.warn('DEV AUTH BYPASS: Active', {
      component: 'dev-auth-bypass',
      action: operation,
      metadata: {
        email: context?.email?.replace(/(.{3}).*@/, '$1***@'),
        endpoint: context?.endpoint,
        conditions: {
          isDevelopment,
          firebaseConfigured: isFirebaseConfigured,
          bypassEnabled,
        },
      },
    });
  } else if (bypassEnabled && !allowed) {
    // Someone tried to enable bypass but conditions not met - security event
    logSecurityEvent('bypass_attempt', {
      operation,
      endpoint: context?.endpoint,
      ip: context?.ip,
      reason: isDevelopment
        ? 'Firebase is configured - use real auth'
        : 'Not in development environment',
      metadata: {
        isDevelopment,
        firebaseConfigured: isFirebaseConfigured,
        bypassEnabled,
      },
    });
  }

  return allowed;
}

/**
 * Get development user ID from email
 *
 * Generates a deterministic user ID for development testing.
 * Only use when isDevAuthBypassAllowed returns true.
 */
export function getDevUserId(email: string): string {
  return `dev-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

/**
 * Development-only code logging helper
 *
 * Logs verification codes prominently in development mode.
 * Checks bypass conditions before logging.
 */
export function logDevCode(email: string, code: string): void {
  if (!isDevAuthBypassAllowed('log_code', { email })) {
    return;
  }

  logger.info('===========================================');
  logger.info(`DEV MODE: VERIFICATION CODE for ${email}: ${code}`);
  logger.info('===========================================');

  // Also log to console for visibility
  console.log('\n========================================');
  console.log(`🔑 DEV OTP CODE: ${code}`);
  console.log(`📧 Email: ${email}`);
  console.log('========================================\n');
}
