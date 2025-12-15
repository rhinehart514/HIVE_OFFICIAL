/**
 * Session Middleware
 *
 * Validates session tokens and provides session context for API routes.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession, type SessionData } from './session';

export interface SessionMiddlewareOptions {
  required?: boolean;
  requireElevated?: boolean;
}

export interface SessionContext {
  session: SessionData | null;
  isAuthenticated: boolean;
  securityLevel: 'safe' | 'elevated' | 'restricted';
  rotated?: boolean;
}

export interface SessionMiddlewareResult {
  success: boolean;
  response?: NextResponse;
  context: SessionContext;
}

/**
 * Session middleware for validating authentication
 *
 * @param request - NextRequest object
 * @param options - Middleware options
 * @returns Session validation result
 */
export async function sessionMiddleware(
  request: NextRequest,
  options: SessionMiddlewareOptions = {}
): Promise<SessionMiddlewareResult> {
  const { required = true, requireElevated = false } = options;

  const session = await getSession(request);

  // No session found
  if (!session) {
    if (required) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
        context: {
          session: null,
          isAuthenticated: false,
          securityLevel: 'restricted',
        },
      };
    }

    return {
      success: true,
      context: {
        session: null,
        isAuthenticated: false,
        securityLevel: 'safe',
      },
    };
  }

  // Require elevated (admin) session
  if (requireElevated && !session.isAdmin) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Elevated access required' },
        { status: 403 }
      ),
      context: {
        session,
        isAuthenticated: true,
        securityLevel: 'restricted',
      },
    };
  }

  // Determine security level based on session type
  const securityLevel: SessionContext['securityLevel'] = session.isAdmin
    ? 'elevated'
    : 'safe';

  return {
    success: true,
    context: {
      session,
      isAuthenticated: true,
      securityLevel,
    },
  };
}
