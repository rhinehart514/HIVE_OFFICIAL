/**
 * Production Auth Utilities
 *
 * Security and audit logging for authentication events
 */

import { type NextRequest } from 'next/server';
import { logger } from './logger';

/**
 * Check if running in production environment
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

type AuthEventType = 'success' | 'failure' | 'suspicious' | 'forbidden';

interface AuthEventContext {
  operation: string;
  error?: string;
  threats?: string;
  securityLevel?: string;
  [key: string]: unknown;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Get user agent from request
 */
function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Audit authentication events for security monitoring
 *
 * Events are logged with appropriate severity:
 * - success: Info level (successful auth operations)
 * - failure: Warn level (failed auth attempts)
 * - suspicious: Warn level (potential security concerns)
 * - forbidden: Error level (blocked malicious attempts)
 */
export async function auditAuthEvent(
  eventType: AuthEventType,
  request: NextRequest,
  context: AuthEventContext
): Promise<void> {
  const timestamp = new Date().toISOString();
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  const auditLog = {
    timestamp,
    eventType,
    ip,
    userAgent,
    path: request.nextUrl.pathname,
    requestId,
    ...context,
  };

  // Log based on event severity
  switch (eventType) {
    case 'success':
      logger.info(`Auth event: ${context.operation} succeeded`, {
        action: 'auth_audit',
        metadata: auditLog,
      });
      break;

    case 'failure':
      logger.warn(`Auth event: ${context.operation} failed`, {
        action: 'auth_audit',
        metadata: auditLog,
      });
      break;

    case 'suspicious':
      logger.warn(`Auth event: suspicious activity in ${context.operation}`, {
        action: 'auth_audit',
        metadata: auditLog,
      });
      break;

    case 'forbidden':
      logger.error(`Auth event: ${context.operation} blocked`, {
        action: 'auth_audit',
        metadata: auditLog,
      });
      break;
  }

  // In production, could send to external security monitoring
  if (process.env.NODE_ENV === 'production' && (eventType === 'suspicious' || eventType === 'forbidden')) {
    // TODO: Send to security monitoring service (e.g., Datadog, Sentry)
    // await sendToSecurityMonitoring(auditLog);
  }
}

/**
 * Check if request should be blocked based on security heuristics
 */
export function shouldBlockRequest(request: NextRequest): { blocked: boolean; reason?: string } {
  const userAgent = getUserAgent(request);
  const _ip = getClientIP(request);

  // Block requests without user agent (likely bots)
  if (userAgent === 'unknown' || userAgent.length < 10) {
    return { blocked: true, reason: 'missing_user_agent' };
  }

  // Block known malicious patterns
  const maliciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /python-requests\/.*attack/i,
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(userAgent)) {
      return { blocked: true, reason: 'malicious_user_agent' };
    }
  }

  return { blocked: false };
}

/**
 * Validate a Firebase ID token in production
 *
 * Returns the decoded token if valid, throws error if invalid
 */
export async function validateProductionToken(
  token: string,
  _request: NextRequest,
  context?: { operation?: string }
): Promise<{ uid: string; email?: string }> {
  // Dynamic import to avoid loading firebase-admin at module level
  const { getAuth } = await import('firebase-admin/auth');

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken.uid) {
      throw Object.assign(
        new Error('Token missing uid'),
        { httpStatus: 401 }
      );
    }

    // Log successful validation in production
    if (isProductionEnvironment()) {
      logger.info('Production token validated', {
        action: 'token_validation',
        operation: context?.operation,
        uid: decodedToken.uid
      });
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
  } catch (error) {
    // Re-throw with standardized format
    const message = error instanceof Error ? error.message : 'Token validation failed';
    throw Object.assign(
      new Error(message),
      { httpStatus: 401 }
    );
  }
}
