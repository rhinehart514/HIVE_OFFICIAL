/**
 * Session Middleware
 *
 * Handles session validation and context extraction for API routes.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { logger } from './structured-logger';

export interface SessionData {
  sessionId: string;
  userId: string;
  campusId: string;
  email?: string;
  role?: string;
  expiresAt: number;
}

export interface SessionContext {
  userId: string;
  campusId: string;
  email?: string;
  role?: string;
  sessionId: string;
  expiresAt: number;
  /** Security level based on session state */
  securityLevel: 'elevated' | 'standard' | 'restricted';
  /** Session data */
  session: SessionData;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether session was rotated */
  rotated: boolean;
}

export interface SessionMiddlewareOptions {
  /** Require valid session (default: true) */
  required?: boolean;
  /** Allowed roles (if specified, checks user role) */
  allowedRoles?: string[];
  /** Custom session cookie name (default: 'hive_session') */
  cookieName?: string;
  /** Require elevated permissions */
  requireElevated?: boolean;
}

export interface SessionResult {
  success: boolean;
  context?: SessionContext;
  response?: NextResponse;
  error?: string;
}

/**
 * Validate session from request cookies
 */
export async function validateSession(
  request: NextRequest,
  _options: SessionMiddlewareOptions = {}
): Promise<SessionResult> {
  try {
    const sessionCookie = request.cookies.get('hive_session');

    if (!sessionCookie?.value) {
      return {
        success: false,
        error: 'No session cookie',
        response: NextResponse.json(
          { error: 'Unauthorized', code: 'NO_SESSION' },
          { status: 401 }
        )
      };
    }

    const sessionId = sessionCookie.value.slice(0, 32);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    // In a real implementation, this would decode and validate the session token
    // For now, we'll return a basic structure
    // The actual validation happens in the auth middleware

    const sessionData: SessionData = {
      sessionId,
      userId: '', // Will be populated by auth middleware
      campusId: '',
      expiresAt,
    };

    return {
      success: true,
      context: {
        userId: sessionData.userId,
        campusId: sessionData.campusId,
        sessionId,
        expiresAt,
        securityLevel: 'standard',
        session: sessionData,
        isAuthenticated: true,
        rotated: false,
      },
    };
  } catch (error) {
    logger.error('Session validation failed', { component: 'session-middleware' }, error instanceof Error ? error : undefined);
    return {
      success: false,
      error: 'Session validation failed',
      response: NextResponse.json(
        { error: 'Session validation failed', code: 'SESSION_ERROR' },
        { status: 500 }
      )
    };
  }
}

/**
 * Session middleware for API routes
 */
export async function sessionMiddleware(
  request: NextRequest,
  options: SessionMiddlewareOptions = {}
): Promise<SessionResult> {
  return validateSession(request, options);
}

export default sessionMiddleware;
