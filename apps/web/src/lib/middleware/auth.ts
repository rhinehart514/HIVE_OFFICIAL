// @ts-nocheck
// TODO: Fix type issues
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";
import { ApiResponseHelper, HttpStatus } from "@/lib/api-response-types";
import { logger } from "@/lib/structured-logger";
import { verifySession, type SessionData } from "@/lib/session";

/**
 * Authenticated Request Handler Type
 * Handlers receive verified user info instead of raw request
 */
export interface AuthenticatedRequest extends NextRequest {
  user: {
    uid: string;
    email: string;
    campusId?: string;
    decodedToken: DecodedIdToken;
  };
}

export interface RouteParams {
  params?: Record<string, string>;
}

export type AuthenticatedHandler<T extends RouteParams = object> = (
  request: AuthenticatedRequest,
  context: T
) => Promise<Response>;

export type NextRouteHandler = (
  request: NextRequest,
  context: RouteParams
) => Promise<Response>;

/**
 * Convert SessionData to DecodedIdToken format for API compatibility
 */
function sessionToDecodedToken(session: SessionData): DecodedIdToken {
  return {
    uid: session.userId,
    email: session.email,
    email_verified: true,
    aud: 'hive-session',
    auth_time: new Date(session.verifiedAt).getTime() / 1000,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    iat: new Date(session.verifiedAt).getTime() / 1000,
    iss: 'hive-session',
    sub: session.userId,
    firebase: {
      identities: {},
      sign_in_provider: 'custom'
    }
  } as DecodedIdToken;
}

/**
 * Auth Middleware - Secure Authentication for API Routes
 *
 * SECURITY: All authentication paths use cryptographic verification
 * - Session cookies: Verified with jose jwtVerify
 * - Bearer tokens: Verified with Firebase Admin SDK
 *
 * NO DEVELOPMENT BYPASSES - Use real Firebase Auth with test accounts
 */
export function withAuth<T extends RouteParams>(
  handler: AuthenticatedHandler<T>
): NextRouteHandler {
  return async (request: NextRequest, context: T): Promise<Response> => {
    try {
      // Check for session cookie (primary auth method for web app)
      const sessionCookie = request.cookies.get('hive_session');

      if (sessionCookie?.value) {
        // SECURITY: Use proper JWT verification with signature validation
        const session = await verifySession(sessionCookie.value);

        if (session && session.userId && session.email) {
          // Create authenticated request with verified session info
          const authenticatedRequest = request as AuthenticatedRequest;
          authenticatedRequest.user = {
            uid: session.userId,
            email: session.email,
            campusId: session.campusId,
            decodedToken: sessionToDecodedToken(session)
          };

          return await handler(authenticatedRequest, context);
        }

        // Session verification failed - log and continue to Bearer token check
        logger.warn('Session cookie verification failed', {
          endpoint: request.url,
          reason: 'invalid_signature_or_expired'
        });
      }

      // Check for Bearer token (Firebase ID token)
      const authHeader = request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json(
          ApiResponseHelper.error("Authentication required", "UNAUTHORIZED"),
          { status: HttpStatus.UNAUTHORIZED }
        );
      }

      const idToken = authHeader.substring(7);

      // SECURITY: Verify Firebase ID token with Firebase Admin SDK
      // This performs cryptographic signature verification
      const auth = getAuth();
      let decodedToken: DecodedIdToken;

      try {
        decodedToken = await auth.verifyIdToken(idToken);
      } catch (error) {
        logger.error('Firebase ID token verification failed', {
          error: error instanceof Error ? error.message : 'unknown',
          endpoint: request.url
        });
        return NextResponse.json(
          ApiResponseHelper.error("Invalid or expired token", "UNAUTHORIZED"),
          { status: HttpStatus.UNAUTHORIZED }
        );
      }

      // Validate token contains required fields
      if (!decodedToken?.uid || !decodedToken?.email) {
        return NextResponse.json(
          ApiResponseHelper.error("Invalid token data", "UNAUTHORIZED"),
          { status: HttpStatus.UNAUTHORIZED }
        );
      }

      // Create authenticated request with user info
      const authenticatedRequest = request as AuthenticatedRequest;

      // Derive campusId from email for Bearer token auth
      let campusId: string | undefined;
      if (decodedToken.email) {
        const domain = decodedToken.email.split('@')[1]?.toLowerCase();
        if (domain === 'buffalo.edu' || domain === 'ub.edu') {
          campusId = 'ub-buffalo';
        }
        // Add more domains here as campuses are added
      }

      authenticatedRequest.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        campusId,
        decodedToken
      };

      // Call the actual handler with authenticated request
      return await handler(authenticatedRequest, context);

    } catch (error) {
      logger.error('Auth middleware error', {
        error: error instanceof Error ? error.message : 'unknown',
        endpoint: request.url
      });

      return NextResponse.json(
        ApiResponseHelper.error("Authentication failed", "INTERNAL_ERROR"),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }
  };
}

/**
 * Admin-only auth wrapper for admin routes
 * Extends withAuth to verify admin privileges
 */
export function withAdminAuth<T extends RouteParams>(
  handler: AuthenticatedHandler<T>
): NextRouteHandler {
  return withAuth(async (request: AuthenticatedRequest, context: T) => {
    try {
      // Check if user has admin claims in Firebase token
      const customClaims = request.user.decodedToken?.customClaims;
      const hasAdminClaim = customClaims?.admin === true || customClaims?.role === 'admin';

      // Also check session-based admin flag (for session cookie auth)
      const sessionCookie = request.cookies.get('hive_session');
      let hasSessionAdmin = false;

      if (sessionCookie?.value) {
        const session = await verifySession(sessionCookie.value);
        hasSessionAdmin = session?.isAdmin === true;
      }

      if (!hasAdminClaim && !hasSessionAdmin) {
        return NextResponse.json(
          ApiResponseHelper.error("Admin access required", "FORBIDDEN"),
          { status: HttpStatus.FORBIDDEN }
        );
      }

      return await handler(request, context);

    } catch (error) {
      logger.error('Admin auth middleware error', {
        error: error instanceof Error ? error.message : 'unknown',
        endpoint: request.url
      });

      return NextResponse.json(
        ApiResponseHelper.error("Admin authorization failed", "INTERNAL_ERROR"),
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }
  });
}

/**
 * Utility function to get user ID from authenticated request
 */
export function getUserId(request: AuthenticatedRequest): string {
  return request.user.uid;
}

/**
 * Utility function to get user email from authenticated request
 */
export function getUserEmail(request: AuthenticatedRequest): string {
  return request.user.email;
}

/**
 * Utility function to get campus ID from authenticated request
 * Falls back to deriving from email or default campus
 */
export function getCampusId(request: AuthenticatedRequest): string {
  // Return from session if available
  if (request.user.campusId) {
    return request.user.campusId;
  }

  // Fallback: derive from email domain
  const email = request.user.email;
  if (email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain === 'buffalo.edu' || domain === 'ub.edu') {
      return 'ub-buffalo';
    }
    // Add more domains here as campuses are added
  }

  // Ultimate fallback for existing users
  return 'ub-buffalo';
}
