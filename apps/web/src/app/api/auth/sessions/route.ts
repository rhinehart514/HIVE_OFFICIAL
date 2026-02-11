/**
 * Sessions Management Endpoint
 * GET: List all active sessions for the current user
 * DELETE: Revoke all sessions (logout everywhere)
 *
 * Note: This is a privacy-sensitive endpoint, only returns current user's sessions
 */

import { type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserActiveSessions, revokeAllUserSessionsAsync } from '@/lib/session-revocation';
import { logger } from '@/lib/logger';
import { auditAuthEvent } from '@/lib/production-auth';
import {
  withAuthAndErrors,
  getUserId,
  RATE_LIMIT_PRESETS,
  type AuthenticatedRequest,
  type ResponseFormatter,
} from '@/lib/middleware';
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/auth/sessions
 * List all active sessions for the current user
 *
 * Returns:
 * - sessions: Array of active session info (id, createdAt, lastActiveAt, userAgent)
 */
const _GET = withAuthAndErrors(
  async (request: AuthenticatedRequest, _context: unknown, respond: typeof ResponseFormatter) => {
    const userId = getUserId(request);
    const session = await getSession(request as NextRequest);

    if (!session) {
      return respond.error('Unauthorized', 'UNAUTHORIZED', { status: 401 });
    }

    // Get active sessions for this user
    const sessions = await getUserActiveSessions(userId);

    // Mask the session IDs for security (only show first 8 chars)
    const maskedSessions = sessions.map((s) => ({
      ...s,
      sessionId: s.sessionId.substring(0, 8) + '...',
      isCurrent: s.sessionId === session.sessionId,
    }));

    return respond.success({
      sessions: maskedSessions,
      currentSessionId: session.sessionId.substring(0, 8) + '...',
    });
  },
  { rateLimit: RATE_LIMIT_PRESETS.standard }
);

/**
 * DELETE /api/auth/sessions
 * Revoke all sessions for the current user (logout everywhere)
 *
 * This will:
 * - Add all user sessions to the revocation list
 * - Force re-authentication on all devices
 * - Current session remains valid until page reload
 */
export const DELETE = withAuthAndErrors(
  async (request: AuthenticatedRequest, _context: unknown, respond: typeof ResponseFormatter) => {
    const userId = getUserId(request);
    const session = await getSession(request as NextRequest);

    if (!session) {
      return respond.error('Unauthorized', 'UNAUTHORIZED', { status: 401 });
    }

    // Revoke all sessions for this user
    await revokeAllUserSessionsAsync(userId);

    // Audit the operation
    await auditAuthEvent('success', request as NextRequest, {
      operation: 'revoke_all_sessions',
      userId,
    });

    logger.info('All user sessions revoked', {
      component: 'sessions-api',
      userId,
    });

    return respond.success({
      message: 'All sessions have been revoked. Please log in again on other devices.',
    });
  },
  { rateLimit: RATE_LIMIT_PRESETS.strict }
);

export const GET = withCache(_GET, 'LONG');
