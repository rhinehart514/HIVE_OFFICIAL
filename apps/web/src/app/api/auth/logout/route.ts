import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { logger } from "@/lib/logger";
import { ApiResponseHelper as _ApiResponseHelper, HttpStatus as _HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";
import { clearAllSessionCookies, getSession } from '@/lib/session';
import { enforceRateLimit } from "@/lib/secure-rate-limiter";
import { auditAuthEvent } from "@/lib/production-auth";
import { revokeSession } from '@/lib/session-revocation';

/**
 * Logout endpoint - revokes user session and clears all auth cookies
 * POST /api/auth/logout
 *
 * Clears:
 * - Access token cookie (hive_session)
 * - Refresh token cookie (hive_refresh)
 * - Revokes Firebase refresh tokens (if possible)
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute for logout (strict - prevent abuse)
  const rateLimitResult = await enforceRateLimit('authentication', request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: rateLimitResult.error },
      { status: rateLimitResult.status, headers: rateLimitResult.headers }
    );
  }

  let userId: string | null = null;

  try {
    // Try to get session info for logging and revocation
    const session = await getSession(request);
    userId = session?.userId || null;

    // Revoke the JWT session so it can't be reused even if cookie isn't cleared
    if (session?.sessionId) {
      revokeSession(session.sessionId);
      logger.info('JWT session revoked', {
        component: 'auth-logout',
        sessionId: session.sessionId.substring(0, 8) + '...',
        userId,
      });
    }

    // Create base response
    const baseResponse = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Best-effort: revoke Firebase refresh tokens when a valid Bearer token is provided
    const authHeader = request.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (idToken) {
      const auth = getAuth();
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        userId = decodedToken.uid;
        try {
          await auth.revokeRefreshTokens(userId);
          logger.info('Successfully revoked Firebase refresh tokens', {
            userId,
            component: 'auth-logout',
          });
        } catch (revokeError) {
          logger.warn('Failed to revoke Firebase refresh tokens', {
            component: 'auth-logout',
            userId,
            error: revokeError instanceof Error ? revokeError.message : String(revokeError),
          });
        }
      } catch (error) {
        logger.debug('Token invalid or missing during logout; proceeding with cookie clear', {
          component: 'auth-logout',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Audit the logout event
    await auditAuthEvent('success', request, {
      operation: 'logout',
      userId: userId || 'unknown',
    });

    // Clear all session cookies (both access and refresh tokens)
    return clearAllSessionCookies(baseResponse);

  } catch (error) {
    logger.error('Error during logout', {
      component: 'auth-logout',
      userId: userId || 'unknown',
      error: error instanceof Error ? error.message : String(error),
    });

    // Return success and clear cookies even on error (fail-safe logout)
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    return clearAllSessionCookies(response);
  }
}
