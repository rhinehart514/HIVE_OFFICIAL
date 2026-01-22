import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";
import { ApiResponseHelper, HttpStatus } from "@/lib/api-response-types";
import { logger } from "@/lib/structured-logger";
import { verifySession, type SessionData } from "@/lib/session";

/**
 * Type-safe user attachment using Symbol to avoid property mutation issues
 * This eliminates the need for `(request as any).user` casts throughout the codebase
 */
const USER_SYMBOL = Symbol.for('hive.authenticated.user');

export interface UserContext {
  uid: string;
  email: string;
  campusId: string; // Required - enforced at auth boundary
  decodedToken: DecodedIdToken;
}

/**
 * Attach user context to a request (internal use only)
 */
export function attachUser(request: NextRequest, user: UserContext): void {
  (request as unknown as { [USER_SYMBOL]: UserContext })[USER_SYMBOL] = user;
}

/**
 * Get user context from an authenticated request
 * Returns undefined if no user is attached (use getUserId/getCampusId for guaranteed access)
 */
export function getUser(request: NextRequest): UserContext | undefined {
  return (request as unknown as { [USER_SYMBOL]?: UserContext })[USER_SYMBOL];
}

/**
 * Authenticated Request Handler Type
 * Handlers receive verified user info instead of raw request
 * Note: campusId is now REQUIRED - enforced by middleware in production
 */
export interface AuthenticatedRequest extends NextRequest {
  user: {
    uid: string;
    email: string;
    campusId: string; // Required - no longer optional
    decodedToken: DecodedIdToken;
  };
}

export interface RouteParams {
  params?: Record<string, string>;
}

/**
 * Derive campus ID from email domain
 * Add new campus domains here as they onboard
 */
export function deriveCampusFromEmail(email: string): string | undefined {
  const domain = email.split('@')[1]?.toLowerCase();

  // UB Buffalo domains
  if (domain === 'buffalo.edu' || domain === 'ub.edu') {
    return 'ub-buffalo';
  }

  // Add more campus domains here as they onboard:
  // if (domain === 'example.edu') return 'example-campus';

  return undefined;
}

/**
 * Enforce that user's campus matches the resource's campus
 * Throws a structured error if mismatch - catches cross-campus data access attempts
 *
 * Usage:
 *   requireCampusMatch(request, space.campusId);
 */
export function requireCampusMatch(request: AuthenticatedRequest, resourceCampusId: string): void {
  const userCampusId = getCampusId(request);
  if (userCampusId !== resourceCampusId) {
    logger.warn('Campus mismatch attempt', {
      userId: getUserId(request),
      userCampus: userCampusId,
      resourceCampus: resourceCampusId,
    });
    const error = new Error('Campus mismatch - you do not have access to this resource');
    (error as Error & { status: number; code: string }).status = 403;
    (error as Error & { status: number; code: string }).code = 'CAMPUS_MISMATCH';
    throw error;
  }
}

export type AuthenticatedHandler<T extends RouteParams = object> = (
  request: AuthenticatedRequest,
  context: T
) => Promise<Response>;

export type NextRouteHandler<T extends RouteParams = RouteParams> = (
  request: NextRequest,
  context: T
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
 * Resolve campus ID with enforcement
 * In production: rejects if no campus can be determined
 * In development: warns and falls back to 'ub-buffalo'
 */
function resolveCampusId(
  sessionCampusId: string | undefined,
  email: string,
  userId: string
): { campusId: string | null; error?: Response } {
  // 1. Use session campusId if available
  if (sessionCampusId) {
    return { campusId: sessionCampusId };
  }

  // 2. Try deriving from email
  const derivedCampus = deriveCampusFromEmail(email);
  if (derivedCampus) {
    return { campusId: derivedCampus };
  }

  // 3. No campus could be determined
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    logger.error('SECURITY: No campus context for authenticated user', {
      userId,
      email,
      reason: 'email_domain_not_recognized'
    });
    return {
      campusId: null,
      error: NextResponse.json(
        ApiResponseHelper.error(
          "Campus identification required. Your email domain is not associated with a registered campus.",
          "CAMPUS_REQUIRED"
        ),
        { status: HttpStatus.FORBIDDEN }
      )
    };
  }

  // Development fallback with warning
  logger.warn('DEV: Using fallback campus for user without recognized domain', {
    userId,
    email,
  });
  return { campusId: 'ub-buffalo' };
}

/**
 * Auth Middleware - Secure Authentication for API Routes
 *
 * SECURITY: All authentication paths use cryptographic verification
 * - Session cookies: Verified with jose jwtVerify
 * - Bearer tokens: Verified with Firebase Admin SDK
 *
 * CAMPUS ISOLATION: Campus ID is now REQUIRED
 * - Production: Rejects users without determinable campus
 * - Development: Warns and falls back to 'ub-buffalo'
 *
 * NO DEVELOPMENT BYPASSES - Use real Firebase Auth with test accounts
 */
export function withAuth<T extends RouteParams>(
  handler: AuthenticatedHandler<T>
): NextRouteHandler<T> {
  return async (request: NextRequest, context: T): Promise<Response> => {
    try {
      // Check for session cookie (primary auth method for web app)
      const sessionCookie = request.cookies.get('hive_session');

      if (sessionCookie?.value) {
        // SECURITY: Use proper JWT verification with signature validation
        const session = await verifySession(sessionCookie.value);

        if (session && session.userId && session.email) {
          // Resolve campus with enforcement
          const { campusId, error } = resolveCampusId(
            session.campusId,
            session.email,
            session.userId
          );

          if (error) {
            return error;
          }

          // Create user context
          const userContext: UserContext = {
            uid: session.userId,
            email: session.email,
            campusId: campusId!, // Safe - checked above
            decodedToken: sessionToDecodedToken(session)
          };

          // Attach via symbol for type-safe access
          attachUser(request, userContext);

          // Also attach to .user for backward compatibility
          const authenticatedRequest = request as AuthenticatedRequest;
          authenticatedRequest.user = userContext;

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

      // Resolve campus with enforcement
      const { campusId, error } = resolveCampusId(
        undefined, // Bearer token doesn't have session campusId
        decodedToken.email,
        decodedToken.uid
      );

      if (error) {
        return error;
      }

      // Create user context
      const userContext: UserContext = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        campusId: campusId!, // Safe - checked above
        decodedToken
      };

      // Attach via symbol for type-safe access
      attachUser(request, userContext);

      // Also attach to .user for backward compatibility
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = userContext;

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
): NextRouteHandler<T> {
  return withAuth(async (request: AuthenticatedRequest, context: T) => {
    try {
      // Check if user has admin claims in Firebase token
      // DecodedIdToken doesn't have customClaims, but the token itself may have custom claims
      const decodedToken = request.user.decodedToken as DecodedIdToken & { admin?: boolean; role?: string };
      const hasAdminClaim = decodedToken?.admin === true || decodedToken?.role === 'admin';

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
 * Campus ID is now GUARANTEED by the auth middleware - no fallback needed
 */
export function getCampusId(request: AuthenticatedRequest): string {
  // Campus is guaranteed by middleware enforcement
  return request.user.campusId;
}
