import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import type { DecodedIdToken } from "firebase-admin/auth";
import { ApiResponseHelper, HttpStatus } from "@/lib/api-response-types";
import { logger } from "@/lib/structured-logger";
import { verifySession, type SessionData } from "@/lib/session";
import { jwtVerify } from 'jose';

// Admin session verification (matches admin app's JWT secret)
const ADMIN_SESSION_COOKIE_NAME = 'hive_admin_session';

function getAdminJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'development') {
    // Must match admin app's dev fallback
    return new TextEncoder().encode('dev-only-secret-do-not-use-in-production');
  }
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET required for admin session verification');
  }
  return new TextEncoder().encode(secret);
}

interface AdminSessionPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  campusId?: string;
}

async function verifyAdminSessionCookie(token: string): Promise<AdminSessionPayload | null> {
  try {
    const secret = getAdminJwtSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });

    if (payload.userId && payload.email && payload.role) {
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string,
        permissions: (payload.permissions as string[]) || [],
        campusId: payload.campusId as string | undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

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

        // Session verification failed - log and continue to admin session check
        logger.warn('Session cookie verification failed', {
          endpoint: request.url,
          reason: 'invalid_signature_or_expired'
        });
      }

      // Check for admin session cookie (from admin dashboard)
      const adminSessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME);

      if (adminSessionCookie?.value) {
        const adminSession = await verifyAdminSessionCookie(adminSessionCookie.value);

        if (adminSession && adminSession.userId && adminSession.email) {
          // Resolve campus - admin users may have explicit campusId or derive from email
          const { campusId, error } = resolveCampusId(
            adminSession.campusId,
            adminSession.email,
            adminSession.userId
          );

          if (error) {
            return error;
          }

          // Create user context from admin session
          const userContext: UserContext = {
            uid: adminSession.userId,
            email: adminSession.email,
            campusId: campusId!,
            decodedToken: {
              uid: adminSession.userId,
              email: adminSession.email,
              email_verified: true,
              aud: 'hive-admin-session',
              auth_time: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 86400,
              iat: Math.floor(Date.now() / 1000),
              iss: 'hive-admin-session',
              sub: adminSession.userId,
              firebase: {
                identities: {},
                sign_in_provider: 'custom'
              }
            } as DecodedIdToken
          };

          // Attach via symbol for type-safe access
          attachUser(request, userContext);

          // Also attach to .user for backward compatibility
          const authenticatedRequest = request as AuthenticatedRequest;
          authenticatedRequest.user = userContext;

          logger.info('Admin session authenticated', {
            userId: adminSession.userId,
            role: adminSession.role,
            endpoint: request.url
          });

          return await handler(authenticatedRequest, context);
        }

        // Admin session verification failed
        logger.warn('Admin session cookie verification failed', {
          endpoint: request.url
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

// SECURITY FIX: Cache admin status with short TTL to prevent zombie sessions
// This prevents deleted admins from retaining access while avoiding Firestore lookup on every request
const adminStatusCache = new Map<string, { isAdmin: boolean; expiry: number }>();
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify admin status in Firestore with caching
 * This catches the "zombie admin" case where an admin is removed but their session is still valid
 */
async function verifyAdminStatusInFirestore(userId: string): Promise<boolean> {
  // Check cache first
  const cached = adminStatusCache.get(userId);
  if (cached && Date.now() < cached.expiry) {
    return cached.isAdmin;
  }

  try {
    // Lazy import to avoid circular dependency
    const { dbAdmin } = await import('@/lib/firebase-admin');

    // Check if user exists in admins collection with active status
    const adminDoc = await dbAdmin.collection('admins').doc(userId).get();
    const isAdmin = adminDoc.exists && adminDoc.data()?.isActive !== false;

    // Cache the result
    adminStatusCache.set(userId, {
      isAdmin,
      expiry: Date.now() + ADMIN_CACHE_TTL_MS
    });

    return isAdmin;
  } catch (error) {
    logger.warn('Failed to verify admin status in Firestore', {
      userId,
      error: error instanceof Error ? error.message : 'unknown'
    });
    // On error, deny access (fail secure)
    return false;
  }
}

/**
 * Admin-only auth wrapper for admin routes
 * Extends withAuth to verify admin privileges
 *
 * SECURITY: Now includes real-time Firestore verification (with caching)
 * to prevent "zombie admin" sessions where removed admins retain access.
 */
export function withAdminAuth<T extends RouteParams>(
  handler: AuthenticatedHandler<T>
): NextRouteHandler<T> {
  return withAuth(async (request: AuthenticatedRequest, context: T) => {
    try {
      const userId = request.user.uid;

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

      // Check for admin session cookie (from admin dashboard)
      // Users authenticated via hive_admin_session are always admins
      const adminSessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME);
      let hasAdminSessionCookie = false;

      if (adminSessionCookie?.value) {
        const adminSession = await verifyAdminSessionCookie(adminSessionCookie.value);
        // If admin session is valid and has admin/super_admin role, grant access
        hasAdminSessionCookie = adminSession !== null &&
          ['admin', 'super_admin', 'moderator'].includes(adminSession.role);
      }

      // First check: Must have some form of admin claim/session
      if (!hasAdminClaim && !hasSessionAdmin && !hasAdminSessionCookie) {
        return NextResponse.json(
          ApiResponseHelper.error("Admin access required", "FORBIDDEN"),
          { status: HttpStatus.FORBIDDEN }
        );
      }

      // SECURITY FIX: Second check - verify admin status in Firestore
      // This catches "zombie admins" who have valid tokens but were removed from admin list
      const firestoreAdminStatus = await verifyAdminStatusInFirestore(userId);
      if (!firestoreAdminStatus) {
        logger.warn('Admin access denied - not found in admins collection', {
          userId,
          hadAdminClaim: hasAdminClaim,
          hadSessionAdmin: hasSessionAdmin,
          hadAdminSessionCookie: hasAdminSessionCookie,
          endpoint: request.url
        });
        return NextResponse.json(
          ApiResponseHelper.error("Admin access revoked", "FORBIDDEN"),
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
  return request.user.campusId;
}

/**
 * Require campus ID from user email - returns campusId or null
 * Use in routes that manually authenticate (not using withAuth middleware).
 * Returns null when campus cannot be determined, caller should return 401.
 */
export function requireCampusFromEmail(email: string | undefined): string | null {
  if (!email) return null;
  return deriveCampusFromEmail(email) || null;
}
