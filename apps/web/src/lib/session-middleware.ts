/**
 * Session Middleware
 *
 * Handles session management and authentication for API routes.
 * Uses JWT tokens stored in cookies for session validation.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from './structured-logger';

/**
 * Session claims from the JWT token
 */
export interface SessionClaims {
  uid?: string;
  email?: string;
  campusId?: string;
  isAdmin?: boolean;
  sessionId?: string;
  exp?: number;
  iat?: number;
}

/**
 * Token verification result
 */
interface TokenVerifyResult {
  valid: boolean;
  expired?: boolean;
  claims?: SessionClaims;
  error?: string;
}

/**
 * Verify session token (simplified - actual verification done by auth middleware)
 * In production, this would verify JWT signatures
 */
async function verifySessionToken(token: string): Promise<TokenVerifyResult> {
  try {
    // Decode the JWT token (base64 payload)
    // In production, use jose or similar to verify signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const payload = JSON.parse(atob(parts[1])) as SessionClaims;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, expired: true, claims: payload, error: 'Token expired' };
    }

    return { valid: true, claims: payload };
  } catch {
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Session context returned after validation
 */
export interface SessionContext {
  userId: string;
  email?: string;
  campusId: string;
  isAdmin: boolean;
  claims: SessionClaims;
  sessionId?: string;
}

/**
 * Session middleware options
 */
export interface SessionMiddlewareOptions {
  /** Require authenticated session (default: true) */
  required?: boolean;
  /** Require admin role (default: false) */
  requireAdmin?: boolean;
  /** Require specific campus (optional) */
  requireCampus?: string;
  /** Allow expired sessions with grace period (default: false) */
  allowGracePeriod?: boolean;
  /** Grace period in seconds (default: 300 = 5 minutes) */
  gracePeriodSeconds?: number;
}

/**
 * Session middleware result
 */
export interface SessionMiddlewareResult {
  success: boolean;
  context?: SessionContext;
  error?: string;
  response?: NextResponse;
}

/**
 * Session middleware function
 * Validates the session token and returns the session context
 */
export async function sessionMiddleware(
  request: NextRequest,
  options: SessionMiddlewareOptions = {}
): Promise<SessionMiddlewareResult> {
  const {
    required = true,
    requireAdmin = false,
    requireCampus,
    allowGracePeriod = false,
    gracePeriodSeconds = 300,
  } = options;

  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    // If no token and session is required, return error
    if (!sessionToken) {
      if (required) {
        return {
          success: false,
          error: 'No session token found',
          response: NextResponse.json(
            { error: 'Unauthorized', message: 'Please log in to continue' },
            { status: 401 }
          ),
        };
      }
      return { success: true };
    }

    // Verify the session token
    const verifyResult = await verifySessionToken(sessionToken);

    if (!verifyResult.valid) {
      // Check if we allow grace period for expired tokens
      if (allowGracePeriod && verifyResult.expired) {
        const expiredAt = verifyResult.claims?.exp;
        if (expiredAt) {
          const now = Math.floor(Date.now() / 1000);
          const gracePeriodEnd = expiredAt + gracePeriodSeconds;

          if (now <= gracePeriodEnd) {
            // Within grace period - allow but log
            logger.warn('Session within grace period', {
              userId: verifyResult.claims?.uid,
              expiredAt: new Date(expiredAt * 1000).toISOString(),
            });

            return {
              success: true,
              context: {
                userId: verifyResult.claims!.uid!,
                email: verifyResult.claims!.email,
                campusId: verifyResult.claims!.campusId || 'ub-buffalo',
                isAdmin: verifyResult.claims!.isAdmin || false,
                claims: verifyResult.claims!,
              },
            };
          }
        }
      }

      return {
        success: false,
        error: verifyResult.error || 'Invalid session',
        response: NextResponse.json(
          { error: 'Unauthorized', message: verifyResult.error || 'Invalid session' },
          { status: 401 }
        ),
      };
    }

    const claims = verifyResult.claims!;

    // Check admin requirement
    if (requireAdmin && !claims.isAdmin) {
      return {
        success: false,
        error: 'Admin access required',
        response: NextResponse.json(
          { error: 'Forbidden', message: 'Admin access required' },
          { status: 403 }
        ),
      };
    }

    // Check campus requirement
    if (requireCampus && claims.campusId !== requireCampus) {
      return {
        success: false,
        error: 'Campus mismatch',
        response: NextResponse.json(
          { error: 'Forbidden', message: 'Access denied for this campus' },
          { status: 403 }
        ),
      };
    }

    // Build session context
    const context: SessionContext = {
      userId: claims.uid!,
      email: claims.email,
      campusId: claims.campusId || 'ub-buffalo',
      isAdmin: claims.isAdmin || false,
      claims,
      sessionId: claims.sessionId,
    };

    return {
      success: true,
      context,
    };
  } catch (error) {
    logger.error('Session middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: 'Session validation failed',
      response: NextResponse.json(
        { error: 'Internal Server Error', message: 'Session validation failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Helper to get session from request (for use in API routes)
 */
export async function getSession(request: NextRequest): Promise<SessionContext | null> {
  const result = await sessionMiddleware(request, { required: false });
  return result.context || null;
}

/**
 * Helper to require session (throws if not authenticated)
 */
export async function requireSession(request: NextRequest): Promise<SessionContext> {
  const result = await sessionMiddleware(request, { required: true });

  if (!result.success || !result.context) {
    throw new Error(result.error || 'Unauthorized');
  }

  return result.context;
}
