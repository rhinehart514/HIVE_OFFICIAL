/**
 * Production-ready API authentication middleware
 * SECURITY: No development bypasses - all auth uses cryptographic verification
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifySession } from './session';
import { logSecurityEvent, logger } from './structured-logger';
import { authAdmin } from './firebase-admin';

export interface AuthContext {
  userId: string;
  token: string;
  isAdmin?: boolean;
  email?: string;
  campusId: string; // Required - enforced at auth boundary
}

/**
 * Derive campus ID from email domain
 * Add new campus domains here as they onboard
 */
function deriveCampusFromEmail(email: string): string | undefined {
  const domain = email.split('@')[1]?.toLowerCase();

  // UB Buffalo domains
  if (domain === 'buffalo.edu' || domain === 'ub.edu') {
    return 'ub-buffalo';
  }

  // Add more campus domains here as they onboard
  return undefined;
}

export interface AuthOptions {
  requireAdmin?: boolean;
  operation?: string;
}

/**
 * Validate API request authentication
 * SECURITY: Uses proper JWT verification via jose library
 */
export async function validateApiAuth(
  request: NextRequest,
  options: AuthOptions = {}
): Promise<AuthContext> {
  const { requireAdmin = false, operation } = options;

  // Check for session cookie first (primary auth for web app)
  const sessionCookie = request.cookies.get('hive_session');

  if (sessionCookie?.value) {
    // SECURITY: Use proper JWT verification with signature validation
    const session = await verifySession(sessionCookie.value);

    if (session && session.userId && session.email) {
      // Check admin requirements
      if (requireAdmin) {
        const isAdmin = await isAdminUser(session.userId, session.email);
        if (!isAdmin) {
          await logSecurityEvent('admin_access', {
            ip: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
            path: new URL(request.url).pathname,
            operation: operation || '',
            tags: { userId: session.userId, reason: 'insufficient_permissions' }
          });

          throw new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { 'content-type': 'application/json' } }
          );
        }
      }

      // Resolve campus ID
      let campusId = session.campusId;
      if (!campusId && session.email) {
        campusId = deriveCampusFromEmail(session.email);
      }

      // Enforce campus in production
      if (!campusId) {
        if (process.env.NODE_ENV === 'production') {
          logger.error('SECURITY: No campus context for authenticated user', {
            component: 'api-auth-middleware',
            userId: session.userId,
            email: session.email,
          });
          throw new Response(
            JSON.stringify({ error: 'Campus identification required' }),
            { status: 403, headers: { 'content-type': 'application/json' } }
          );
        }
        // Development fallback
        logger.warn('DEV: Using fallback campus for user without recognized domain', {
          component: 'api-auth-middleware',
          userId: session.userId,
        });
        campusId = 'ub-buffalo';
      }

      return {
        userId: session.userId,
        token: sessionCookie.value,
        isAdmin: session.isAdmin || await isAdminUser(session.userId, session.email),
        email: session.email,
        campusId
      };
    }
  }

  // Check for Bearer token (Firebase ID token)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await logSecurityEvent('invalid_token', {
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      path: new URL(request.url).pathname,
      operation: operation || '',
      tags: { reason: 'missing_auth_header' }
    });

    throw new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  const token = authHeader.replace('Bearer ', '');

  // SECURITY: Verify Firebase ID token with Firebase Admin SDK
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);

    if (!decodedToken?.uid) {
      throw new Error('Invalid token data');
    }

    // Check admin requirements
    if (requireAdmin) {
      const isAdmin = await isAdminUser(decodedToken.uid, decodedToken.email);
      if (!isAdmin) {
        await logSecurityEvent('admin_access', {
          ip: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          path: new URL(request.url).pathname,
          operation: operation || '',
          tags: { userId: decodedToken.uid, reason: 'insufficient_permissions' }
        });

        throw new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // Resolve campus ID from email
    let campusId = decodedToken.email ? deriveCampusFromEmail(decodedToken.email) : undefined;

    // Enforce campus in production
    if (!campusId) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('SECURITY: No campus context for authenticated user', {
          component: 'api-auth-middleware',
          userId: decodedToken.uid,
          email: decodedToken.email,
        });
        throw new Response(
          JSON.stringify({ error: 'Campus identification required' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
      // Development fallback
      logger.warn('DEV: Using fallback campus for user without recognized domain', {
        component: 'api-auth-middleware',
        userId: decodedToken.uid,
      });
      campusId = 'ub-buffalo';
    }

    return {
      userId: decodedToken.uid,
      token,
      isAdmin: await isAdminUser(decodedToken.uid, decodedToken.email),
      email: decodedToken.email,
      campusId
    };
  } catch (error) {
    await logSecurityEvent('invalid_token', {
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      path: new URL(request.url).pathname,
      operation: operation || '',
      tags: { reason: error instanceof Error ? error.message : 'token_verification_failed' }
    });

    throw new Response(
      JSON.stringify({ error: 'Invalid authentication token' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
}

/**
 * Check if user has admin privileges
 * Uses Firestore admin collection for dynamic admin management
 */
async function isAdminUser(userId: string, userEmail?: string): Promise<boolean> {
  try {
    // Import the isAdmin function from admin-auth
    const { isAdmin } = await import('./admin-auth');
    return await isAdmin(userId, userEmail);
  } catch (error) {
    logger.error('Admin check failed', { component: 'api-auth-middleware', userId }, error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Wrapper for API routes that need authentication
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, context: AuthContext, ...args: T) => Promise<Response> | Response,
  options: AuthOptions = {}
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const authContext = await validateApiAuth(request, options);
      return await handler(request, authContext, ...args);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      logger.error('Auth middleware error', { component: 'api-auth-middleware' }, error instanceof Error ? error : undefined);
      return new Response(
        JSON.stringify({ error: 'Authentication service error' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }
  };
}

/**
 * Enhanced wrapper that combines auth and error handling
 */
export function withAuthAndErrors<T extends unknown[]>(
  handler: (request: NextRequest, context: AuthContext, ...args: T) => Promise<Response> | Response,
  options: AuthOptions = {}
) {
  return withAuth(async (request: NextRequest, context: AuthContext, ...args: T): Promise<Response> => {
    try {
      return await handler(request, context, ...args);
    } catch (error) {
      logger.error('Handler error', { component: 'api-auth-middleware' }, error instanceof Error ? error : undefined);

      if (error instanceof Response) {
        return error;
      }

      if (error && typeof error === 'object' && 'status' in error) {
        const err = error as { status?: number; message?: string; code?: string };
        return ApiResponse.error(
          err.message || 'Operation failed',
          err.code || 'UNKNOWN_ERROR',
          err.status ?? 500
        );
      }

      return ApiResponse.error(
        'Internal server error',
        'INTERNAL_ERROR',
        500
      );
    }
  }, options);
}

/**
 * Create standardized API responses
 */
export class ApiResponse {
  static success(data: unknown, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
  }

  static error(message: string, code?: string, status = 400) {
    return NextResponse.json({
      success: false,
      error: { message, code }
    }, { status });
  }

  static unauthorized(message = 'Authentication required') {
    return NextResponse.json({
      success: false,
      error: { message, code: 'UNAUTHORIZED' }
    }, { status: 401 });
  }

  static forbidden(message = 'Access denied') {
    return NextResponse.json({
      success: false,
      error: { message, code: 'FORBIDDEN' }
    }, { status: 403 });
  }
}
