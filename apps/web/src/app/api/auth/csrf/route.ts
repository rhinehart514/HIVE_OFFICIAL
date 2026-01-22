/**
 * CSRF Token Endpoint
 * Returns the CSRF token for the current session
 *
 * GET /api/auth/csrf
 */

import { type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import {
  withAuthAndErrors,
  RATE_LIMIT_PRESETS,
  type AuthenticatedRequest,
  type ResponseFormatter,
} from '@/lib/middleware';

/**
 * GET handler - returns CSRF token for admin sessions
 * Uses auth middleware for session validation + stricter rate limiting
 */
export const GET = withAuthAndErrors(
  async (request: AuthenticatedRequest, _context: unknown, respond: typeof ResponseFormatter) => {
    // Get session data for CSRF token
    const session = await getSession(request as NextRequest);

    if (!session) {
      return respond.error('Not authenticated', 'UNAUTHORIZED', { status: 401 });
    }

    // Build response with CSRF token in header for admin sessions
    const responseData = { success: true };

    if (session.isAdmin && session.csrf) {
      return respond.success(responseData, {
        headers: { 'X-CSRF-Token': session.csrf },
      });
    }

    return respond.success(responseData);
  },
  { rateLimit: RATE_LIMIT_PRESETS.auth, skipCSRF: true }
);
