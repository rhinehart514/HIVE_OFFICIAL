/**
 * Logout Endpoint
 * Revokes user session and clears all auth cookies
 *
 * POST /api/auth/logout
 *
 * Clears:
 * - Access token cookie (hive_session)
 * - Refresh token cookie (hive_refresh)
 * - Revokes Firebase refresh tokens (if possible)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '@/lib/logger';
import { clearAllSessionCookies, getSession } from '@/lib/session';
import { auditAuthEvent } from '@/lib/production-auth';
import { revokeSession, revokeAllUserSessionsAsync } from '@/lib/session-revocation';
import {
  withErrors,
  RATE_LIMIT_PRESETS,
  type ResponseFormatter,
} from '@/lib/middleware';

/**
 * POST handler - logout and clear all sessions
 * Uses withErrors (not withAuthAndErrors) because logout should work
 * even with expired/invalid tokens - fail-safe logout
 */
export const POST = withErrors(
  async (request: Request, _context: unknown, respond: typeof ResponseFormatter) => {
    const nextRequest = request as NextRequest;
    const globalLogout = nextRequest.nextUrl.searchParams.get('global') === 'true';
    let userId: string | null = null;

    // Try to get session info for logging and revocation
    const session = await getSession(nextRequest);
    userId = session?.userId || null;

    if (globalLogout && userId) {
      // Revoke ALL sessions for this user across all devices
      await revokeAllUserSessionsAsync(userId);
      logger.info('All user sessions revoked (global sign-out)', {
        component: 'auth-logout',
        userId,
      });
    } else if (session?.sessionId) {
      // Revoke only the current session
      revokeSession(session.sessionId);
      logger.info('JWT session revoked', {
        component: 'auth-logout',
        sessionId: session.sessionId.substring(0, 8) + '...',
        userId: userId ?? undefined,
      });
    }

    // Create base response
    const baseResponse = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
      meta: { timestamp: new Date().toISOString() },
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
    await auditAuthEvent('success', nextRequest, {
      operation: globalLogout ? 'logout_global' : 'logout',
      userId: userId || 'unknown',
    });

    // Clear all session cookies (both access and refresh tokens)
    return clearAllSessionCookies(baseResponse);
  },
  { rateLimit: RATE_LIMIT_PRESETS.auth }
);
