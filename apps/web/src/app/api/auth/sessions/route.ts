import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserActiveSessions, revokeAllUserSessionsAsync } from '@/lib/session-revocation';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';
import { auditAuthEvent } from '@/lib/production-auth';

/**
 * GET /api/auth/sessions
 * List all active sessions for the current user
 *
 * Returns:
 * - sessions: Array of active session info (id, createdAt, lastActiveAt, userAgent)
 *
 * Note: This is a privacy-sensitive endpoint, only returns current user's sessions
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit
    const rateLimitResult = await enforceRateLimit('api', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: rateLimitResult.status }
      );
    }

    // Verify session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get active sessions for this user
    const sessions = await getUserActiveSessions(session.userId);

    // Mask the session IDs for security (only show first 8 chars)
    const maskedSessions = sessions.map((s) => ({
      ...s,
      sessionId: s.sessionId.substring(0, 8) + '...',
      isCurrent: s.sessionId === session.sessionId,
    }));

    return NextResponse.json({
      success: true,
      sessions: maskedSessions,
      currentSessionId: session.sessionId.substring(0, 8) + '...',
    });
  } catch (error) {
    logger.error('Failed to list sessions', {
      component: 'sessions-api',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to list sessions', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/sessions
 * Revoke all sessions for the current user (logout everywhere)
 *
 * This will:
 * - Add all user sessions to the revocation list
 * - Force re-authentication on all devices
 * - Current session remains valid until page reload
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit (strict - sensitive operation)
    const rateLimitResult = await enforceRateLimit('authStrict', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error || 'Rate limit exceeded' },
        { status: rateLimitResult.status }
      );
    }

    // Verify session
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Revoke all sessions for this user
    await revokeAllUserSessionsAsync(session.userId);

    // Audit the operation
    await auditAuthEvent('success', request, {
      operation: 'revoke_all_sessions',
      userId: session.userId,
    });

    logger.info('All user sessions revoked', {
      component: 'sessions-api',
      userId: session.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'All sessions have been revoked. Please log in again on other devices.',
    });
  } catch (error) {
    logger.error('Failed to revoke all sessions', {
      component: 'sessions-api',
      error: error instanceof Error ? error.message : String(error),
    });

    await auditAuthEvent('failure', request, {
      operation: 'revoke_all_sessions',
      error: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.json(
      { error: 'Failed to revoke sessions', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
