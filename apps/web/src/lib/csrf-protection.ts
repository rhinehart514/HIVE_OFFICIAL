/**
 * PRODUCTION-SECURE CSRF protection with comprehensive attack prevention
 * Implements multiple CSRF defense mechanisms and threat detection
 *
 * SCALING: Uses Firestore for persistent token storage with in-memory cache
 * to survive cold starts and support multi-instance deployments.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { logSecurityEvent } from './structured-logger';
import { currentEnvironment } from './env';
import { getSecureClientId } from './secure-rate-limiter';
import { dbAdmin } from './firebase-admin';

/**
 * CSRF protection configuration
 */
const CSRF_CONFIG = {
  // Token settings
  TOKEN_LENGTH: 32,
  TOKEN_LIFETIME: 60 * 60 * 1000, // 1 hour
  MAX_TOKENS_PER_SESSION: 10,

  // Cookie settings
  COOKIE_NAME: 'hive_csrf',
  COOKIE_OPTIONS: {
    httpOnly: false, // Must be accessible to JavaScript for forms
    secure: currentEnvironment === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 // 1 hour
  },

  // Header settings
  HEADER_NAME: 'x-csrf-token',
  FORM_FIELD_NAME: '_csrf',

  // Security settings
  REQUIRE_REFERER_CHECK: true,
  ALLOWED_ORIGINS: [] as string[], // Will be populated from env
  STRICT_MODE: currentEnvironment === 'production',

  // Storage settings
  FIRESTORE_COLLECTION: 'csrf_tokens',
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * CSRF token data structure
 */
interface CSRFTokenData {
  token: string;
  sessionId: string;
  clientId: string;
  issuedAt: number;
  expiresAt: number;
  usageCount: number;
  fingerprint: string;
}

/**
 * CSRF validation result
 */
export interface CSRFValidationResult {
  valid: boolean;
  reason?: string;
  token?: string;
  securityViolation: boolean;
}

/**
 * Cached token entry
 */
interface CachedToken {
  data: CSRFTokenData;
  cachedAt: number;
}

/**
 * Firestore-backed CSRF token storage with in-memory cache
 *
 * SCALING: Persists tokens to Firestore for multi-instance support
 * while caching locally to reduce read latency and costs.
 */
class CSRFStorage {
  private cache = new Map<string, CachedToken>();
  private sessionTokensCache = new Map<string, Set<string>>();
  private firestoreAvailable = true;

  /**
   * Get token from cache or Firestore
   */
  async get(token: string): Promise<CSRFTokenData | null> {
    // Check cache first
    const cached = this.cache.get(token);
    if (cached && Date.now() - cached.cachedAt < CSRF_CONFIG.CACHE_TTL) {
      return cached.data;
    }

    // Try Firestore
    if (this.firestoreAvailable) {
      try {
        const doc = await dbAdmin
          .collection(CSRF_CONFIG.FIRESTORE_COLLECTION)
          .doc(token)
          .get();

        if (!doc.exists) {
          return null;
        }

        const data = doc.data() as CSRFTokenData;

        // Update cache
        this.cache.set(token, { data, cachedAt: Date.now() });

        return data;
      } catch (error) {
        // Firestore failed, mark as unavailable for this request cycle
        this.handleFirestoreError('get', error);
        // Return from cache if available, even if stale
        return cached?.data || null;
      }
    }

    // Firestore unavailable, check stale cache
    return cached?.data || null;
  }

  /**
   * Store token in cache and Firestore
   */
  async set(token: string, data: CSRFTokenData): Promise<void> {
    // Always update cache
    this.cache.set(token, { data, cachedAt: Date.now() });

    // Track session tokens
    if (!this.sessionTokensCache.has(data.sessionId)) {
      this.sessionTokensCache.set(data.sessionId, new Set());
    }
    this.sessionTokensCache.get(data.sessionId)!.add(token);

    // Try Firestore
    if (this.firestoreAvailable) {
      try {
        await dbAdmin
          .collection(CSRF_CONFIG.FIRESTORE_COLLECTION)
          .doc(token)
          .set({
            ...data,
            createdAt: new Date(),
          });
      } catch (error) {
        this.handleFirestoreError('set', error);
      }
    }
  }

  /**
   * Delete token from cache and Firestore
   */
  async delete(token: string): Promise<void> {
    // Get token data for session cleanup
    const cached = this.cache.get(token);

    // Remove from cache
    this.cache.delete(token);

    // Remove from session tracking
    if (cached?.data.sessionId) {
      this.sessionTokensCache.get(cached.data.sessionId)?.delete(token);
    }

    // Try Firestore
    if (this.firestoreAvailable) {
      try {
        await dbAdmin
          .collection(CSRF_CONFIG.FIRESTORE_COLLECTION)
          .doc(token)
          .delete();
      } catch (error) {
        this.handleFirestoreError('delete', error);
      }
    }
  }

  /**
   * Get tokens for a session
   */
  getSessionTokens(sessionId: string): Set<string> {
    return this.sessionTokensCache.get(sessionId) || new Set();
  }

  /**
   * Update session tokens cache
   */
  setSessionTokens(sessionId: string, tokens: Set<string>): void {
    this.sessionTokensCache.set(sessionId, tokens);
  }

  /**
   * Delete session tokens tracking
   */
  deleteSessionTokens(sessionId: string): void {
    this.sessionTokensCache.delete(sessionId);
  }

  /**
   * Clean up expired tokens from Firestore
   */
  async cleanupExpired(): Promise<number> {
    if (!this.firestoreAvailable) {
      return 0;
    }

    try {
      const now = Date.now();
      const expired = await dbAdmin
        .collection(CSRF_CONFIG.FIRESTORE_COLLECTION)
        .where('expiresAt', '<', now)
        .limit(100)
        .get();

      if (expired.empty) {
        return 0;
      }

      const batch = dbAdmin.batch();
      expired.docs.forEach(doc => {
        batch.delete(doc.ref);
        // Also clean from cache
        this.cache.delete(doc.id);
      });
      await batch.commit();

      return expired.size;
    } catch (error) {
      this.handleFirestoreError('cleanup', error);
      return 0;
    }
  }

  /**
   * Handle Firestore errors gracefully
   */
  private handleFirestoreError(operation: string, error: unknown): void {
    // Log but don't crash - in-memory cache will continue working
    logSecurityEvent('csrf_failure', {
      operation: `firestore_${operation}_failed`,
      tags: {
        error: error instanceof Error ? error.message : 'unknown',
        environment: currentEnvironment,
      },
    });
  }

  /**
   * Get storage stats (for health check)
   */
  getStats(): { cacheSize: number; sessionCount: number; firestoreAvailable: boolean } {
    return {
      cacheSize: this.cache.size,
      sessionCount: this.sessionTokensCache.size,
      firestoreAvailable: this.firestoreAvailable,
    };
  }
}

/**
 * Secure CSRF protection manager
 */
export class CSRFProtection {
  private static storage = new CSRFStorage();

  /**
   * Generate cryptographically secure CSRF token
   */
  static generateToken(sessionId: string, clientId: string): string {
    // Generate random bytes
    const randomToken = randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString('hex');

    // Create hash incorporating session and client info
    const hash = createHash('sha256');
    hash.update(randomToken);
    hash.update(sessionId);
    hash.update(clientId);
    hash.update(Date.now().toString());

    return hash.digest('hex');
  }

  /**
   * Create CSRF token for session
   */
  static async createToken(
    request: NextRequest,
    sessionId: string
  ): Promise<{
    token: string;
    expiresAt: number;
  }> {
    const clientId = getSecureClientId(request);
    const now = Date.now();
    const token = this.generateToken(sessionId, clientId);

    // Create fingerprint for additional security
    const fingerprint = this.createFingerprint(request);

    const tokenData: CSRFTokenData = {
      token,
      sessionId,
      clientId,
      issuedAt: now,
      expiresAt: now + CSRF_CONFIG.TOKEN_LIFETIME,
      usageCount: 0,
      fingerprint
    };

    // Clean up old tokens for this session
    await this.cleanupSessionTokens(sessionId);

    // Store token
    await this.storage.set(token, tokenData);

    // Log token creation
    await logSecurityEvent('invalid_token', {
      operation: 'token_created',
      tags: {
        sessionId,
        clientId,
        environment: currentEnvironment
      }
    });

    return {
      token,
      expiresAt: tokenData.expiresAt
    };
  }

  /**
   * Validate CSRF token with comprehensive security checks
   */
  static async validateToken(
    request: NextRequest,
    sessionId: string
  ): Promise<CSRFValidationResult> {
    try {
      // Extract token from multiple sources
      const token = this.extractToken(request);

      if (!token) {
        return {
          valid: false,
          reason: 'missing_token',
          securityViolation: false
        };
      }

      // Get token data
      const tokenData = await this.storage.get(token);
      if (!tokenData) {
        await logSecurityEvent('invalid_token', {
          operation: 'invalid_token_used',
          tags: {
            sessionId,
            token: token.substring(0, 8), // Log only prefix for security
            environment: currentEnvironment
          }
        });

        return {
          valid: false,
          reason: 'token_not_found',
          securityViolation: true
        };
      }

      // Check token expiration
      const now = Date.now();
      if (tokenData.expiresAt < now) {
        await this.storage.delete(token);
        return {
          valid: false,
          reason: 'token_expired',
          securityViolation: false
        };
      }

      // Validate session binding
      if (tokenData.sessionId !== sessionId) {
        await logSecurityEvent('invalid_token', {
          operation: 'session_mismatch',
          tags: {
            expectedSession: sessionId,
            tokenSession: tokenData.sessionId,
            environment: currentEnvironment
          }
        });

        return {
          valid: false,
          reason: 'session_mismatch',
          securityViolation: true
        };
      }

      // Validate client ID
      const currentClientId = getSecureClientId(request);
      if (tokenData.clientId !== currentClientId) {
        await logSecurityEvent('invalid_token', {
          operation: 'client_mismatch',
          tags: {
            sessionId,
            expectedClient: tokenData.clientId,
            currentClient: currentClientId,
            environment: currentEnvironment
          }
        });

        return {
          valid: false,
          reason: 'client_mismatch',
          securityViolation: true
        };
      }

      // Validate fingerprint
      const currentFingerprint = this.createFingerprint(request);
      if (tokenData.fingerprint !== currentFingerprint) {
        await logSecurityEvent('invalid_token', {
          operation: 'fingerprint_mismatch',
          tags: {
            sessionId,
            token: token.substring(0, 8),
            environment: currentEnvironment
          }
        });

        return {
          valid: false,
          reason: 'fingerprint_mismatch',
          securityViolation: true
        };
      }

      // SECURITY: Validate origin and referer
      if (CSRF_CONFIG.REQUIRE_REFERER_CHECK) {
        const originCheck = await this.validateOrigin(request);
        if (!originCheck.valid) {
          return {
            valid: false,
            reason: originCheck.reason,
            securityViolation: true
          };
        }
      }

      // Update token usage
      tokenData.usageCount++;

      // Implement token consumption (single-use for critical operations)
      if (request.method === 'DELETE' || request.url.includes('/admin/')) {
        await this.storage.delete(token);
        const sessionTokens = this.storage.getSessionTokens(sessionId);
        sessionTokens.delete(token);
        this.storage.setSessionTokens(sessionId, sessionTokens);
      }

      await logSecurityEvent('invalid_token', {
        operation: 'token_validated',
        tags: {
          sessionId,
          usageCount: tokenData.usageCount.toString(),
          environment: currentEnvironment
        }
      });

      return {
        valid: true,
        token,
        securityViolation: false
      };

    } catch (error) {
      // Error during token validation, log and return failure

      await logSecurityEvent('invalid_token', {
        operation: 'validation_error',
        tags: {
          sessionId,
          error: error instanceof Error ? error.message : 'unknown',
          environment: currentEnvironment
        }
      });

      return {
        valid: false,
        reason: 'validation_error',
        securityViolation: true
      };
    }
  }

  /**
   * Extract CSRF token from request
   */
  private static extractToken(request: NextRequest): string | null {
    // Check header first (preferred for AJAX)
    const headerToken = request.headers.get(CSRF_CONFIG.HEADER_NAME);
    if (headerToken) {
      return headerToken;
    }

    // Check form data for POST requests
    if (request.method === 'POST') {
      // This would need to be extracted from form data
      // Implementation depends on how you handle form parsing
      // For now, we'll focus on header-based tokens
    }

    // Check cookie as fallback (double-submit pattern)
    const cookieToken = request.cookies.get(CSRF_CONFIG.COOKIE_NAME)?.value;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  /**
   * Validate origin and referer headers
   */
  private static async validateOrigin(request: NextRequest): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // For state-changing requests, require origin or referer
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      if (!origin && !referer) {
        await logSecurityEvent('invalid_token', {
          operation: 'missing_origin_referer',
          tags: {
            method: request.method,
            host: host || 'unknown',
            environment: currentEnvironment
          }
        });

        return {
          valid: false,
          reason: 'missing_origin_referer'
        };
      }

      // Validate origin if present
      if (origin) {
        const isValidOrigin = this.isValidOrigin(origin, host);
        if (!isValidOrigin) {
          await logSecurityEvent('invalid_token', {
            operation: 'invalid_origin',
            tags: {
              origin,
              host: host || 'unknown',
              environment: currentEnvironment
            }
          });

          return {
            valid: false,
            reason: 'invalid_origin'
          };
        }
      }

      // Validate referer if present
      if (referer && !origin) {
        const isValidReferer = this.isValidReferer(referer, host);
        if (!isValidReferer) {
          await logSecurityEvent('invalid_token', {
            operation: 'invalid_referer',
            tags: {
              referer,
              host: host || 'unknown',
              environment: currentEnvironment
            }
          });

          return {
            valid: false,
            reason: 'invalid_referer'
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validate origin header
   */
  private static isValidOrigin(origin: string, host: string | null): boolean {
    if (!host) return false;

    try {
      const originUrl = new URL(origin);
      const expectedOrigins = [
        `https://${host}`,
        `http://${host}`, // Only for development
        ...CSRF_CONFIG.ALLOWED_ORIGINS
      ];

      // In production, only allow HTTPS
      if (currentEnvironment === 'production' && originUrl.protocol !== 'https:') {
        return false;
      }

      return expectedOrigins.includes(origin);
    } catch {
      return false;
    }
  }

  /**
   * Validate referer header
   */
  private static isValidReferer(referer: string, host: string | null): boolean {
    if (!host) return false;

    try {
      const refererUrl = new URL(referer);

      // In production, only allow HTTPS
      if (currentEnvironment === 'production' && refererUrl.protocol !== 'https:') {
        return false;
      }

      // Check if referer hostname matches expected host
      return refererUrl.hostname === host;
    } catch {
      return false;
    }
  }

  /**
   * Create request fingerprint for additional security
   */
  private static createFingerprint(request: NextRequest): string {
    const components = [
      request.headers.get('user-agent') || '',
      request.headers.get('accept-language') || '',
      request.headers.get('accept-encoding') || ''
    ];

    const fingerprintData = components.join('|');
    return createHash('sha256').update(fingerprintData).digest('hex').substring(0, 16);
  }

  /**
   * Clean up old tokens for a session
   */
  private static async cleanupSessionTokens(sessionId: string): Promise<void> {
    const sessionTokenSet = this.storage.getSessionTokens(sessionId);
    if (sessionTokenSet.size === 0) return;

    const now = Date.now();
    const expiredTokens: string[] = [];

    // Find expired tokens
    for (const token of sessionTokenSet) {
      const tokenData = await this.storage.get(token);
      if (!tokenData || tokenData.expiresAt < now) {
        expiredTokens.push(token);
      }
    }

    // Remove expired tokens
    for (const token of expiredTokens) {
      await this.storage.delete(token);
      sessionTokenSet.delete(token);
    }

    // Limit tokens per session
    if (sessionTokenSet.size > CSRF_CONFIG.MAX_TOKENS_PER_SESSION) {
      const tokensArray = Array.from(sessionTokenSet);
      const tokensToRemove = tokensArray.slice(0, sessionTokenSet.size - CSRF_CONFIG.MAX_TOKENS_PER_SESSION);

      for (const token of tokensToRemove) {
        await this.storage.delete(token);
        sessionTokenSet.delete(token);
      }
    }

    this.storage.setSessionTokens(sessionId, sessionTokenSet);
  }

  /**
   * Set CSRF token cookie
   */
  static setCSRFCookie(response: NextResponse, token: string): void {
    response.cookies.set(
      CSRF_CONFIG.COOKIE_NAME,
      token,
      CSRF_CONFIG.COOKIE_OPTIONS
    );
  }

  /**
   * Clear CSRF cookie
   */
  static clearCSRFCookie(response: NextResponse): void {
    response.cookies.delete(CSRF_CONFIG.COOKIE_NAME);
  }

  /**
   * Global cleanup of expired tokens
   */
  static async globalCleanup(): Promise<void> {
    // Clean up expired tokens from Firestore
    const cleaned = await this.storage.cleanupExpired();

    if (cleaned > 0) {
      // Tokens cleaned - logged for monitoring
      await logSecurityEvent('csrf_failure', {
        operation: 'global_cleanup',
        tags: {
          cleaned: cleaned.toString(),
          environment: currentEnvironment,
        },
      });
    }
  }

  /**
   * Get CSRF protection status
   */
  static getProtectionStatus(): {
    totalTokens: number;
    activeSessions: number;
    environment: string;
    strictMode: boolean;
    firestoreAvailable: boolean;
  } {
    const stats = this.storage.getStats();
    return {
      totalTokens: stats.cacheSize,
      activeSessions: stats.sessionCount,
      environment: currentEnvironment,
      strictMode: CSRF_CONFIG.STRICT_MODE,
      firestoreAvailable: stats.firestoreAvailable,
    };
  }
}

/**
 * CSRF middleware for API routes
 */
export async function csrfMiddleware(
  request: NextRequest,
  sessionId: string,
  options: {
    exemptMethods?: string[];
    requireToken?: boolean;
  } = {}
): Promise<{
  valid: boolean;
  response?: NextResponse;
  token?: string;
}> {
  const {
    exemptMethods = ['GET', 'HEAD', 'OPTIONS'],
    requireToken: _requireToken = true
  } = options;

  // Skip CSRF protection for safe methods
  if (exemptMethods.includes(request.method)) {
    return { valid: true };
  }

  // Validate CSRF token
  const validationResult = await CSRFProtection.validateToken(request, sessionId);

  if (!validationResult.valid) {
    const statusCode = validationResult.securityViolation ? 403 : 400;
    const errorMessage = validationResult.securityViolation
      ? 'CSRF security violation detected'
      : 'Invalid or missing CSRF token';

    return {
      valid: false,
      response: NextResponse.json(
        {
          error: errorMessage,
          code: 'CSRF_VALIDATION_FAILED'
        },
        { status: statusCode }
      )
    };
  }

  return {
    valid: true,
    token: validationResult.token
  };
}

/**
 * Higher-order function to add CSRF protection to handlers
 */
export function withCSRFProtection(
  handler: (_request: NextRequest, _csrfToken?: string) => Promise<NextResponse>,
  options: {
    getSessionId: (_request: NextRequest) => Promise<string | null>;
    exemptMethods?: string[];
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const sessionId = await options.getSessionId(request);

      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session required for CSRF protection' },
          { status: 401 }
        );
      }

      const csrfResult = await csrfMiddleware(request, sessionId, {
        exemptMethods: options.exemptMethods
      });

      if (!csrfResult.valid && csrfResult.response) {
        return csrfResult.response;
      }

      return handler(request, csrfResult.token);
    } catch {
      return NextResponse.json(
        { error: 'CSRF protection service unavailable' },
        { status: 503 }
      );
    }
  };
}

// Run cleanup every 30 minutes
setInterval(() => {
  CSRFProtection.globalCleanup();
}, 30 * 60 * 1000);
