import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, type SessionData } from "@/lib/session";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { enforceRateLimit } from "@/lib/secure-rate-limiter";
import { decodeJwt } from 'jose';

/**
 * Unified Session Endpoint
 *
 * This is the SINGLE source of truth for authentication state.
 * It reads the httpOnly JWT cookie and returns user data.
 *
 * Features:
 * - Works identically in dev and production
 * - No localStorage, no Bearer tokens, no Firebase client SDK
 * - Stateless JWT verification (scalable)
 * - Returns token expiration info for proactive client-side refresh
 */

const SESSION_COOKIE_NAME = 'hive_session';
const REFRESH_COOKIE_NAME = 'hive_refresh';

/**
 * Extract token expiration time from JWT without full verification
 * (verification already done by verifySession)
 */
function getTokenExpirationInfo(token: string): { expiresAt: number; expiresIn: number } | null {
  try {
    const payload = decodeJwt(token);
    if (payload.exp) {
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const expiresIn = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)); // Seconds until expiry
      return { expiresAt, expiresIn };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Rate limit: 100 requests per minute for session checks
  const rateLimitResult = await enforceRateLimit('apiGeneral', request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { authenticated: false, user: null, error: rateLimitResult.error },
      { status: rateLimitResult.status, headers: rateLimitResult.headers }
    );
  }

  try {
    // Read session cookie
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 } // 200, not 401 - client needs to know state
      );
    }

    // Verify JWT
    const session = await verifySession(sessionCookie.value);

    if (!session) {
      // Invalid/expired token - clear the bad cookie
      const response = NextResponse.json(
        { authenticated: false, user: null, error: "Session expired" },
        { status: 200 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Fetch fresh user data from Firestore
    const userData = await fetchUserProfile(session);

    // Get token expiration info for client-side refresh scheduling
    const tokenExpiration = getTokenExpirationInfo(sessionCookie.value);
    const hasRefreshToken = !!request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    return NextResponse.json({
      authenticated: true,
      user: userData,
      session: {
        sessionId: session.sessionId,
        verifiedAt: session.verifiedAt,
        isAdmin: session.isAdmin || false,
        // Token expiration info for proactive refresh
        ...(tokenExpiration && {
          expiresAt: tokenExpiration.expiresAt,
          expiresIn: tokenExpiration.expiresIn,
        }),
        // Whether refresh is possible (refresh token exists)
        canRefresh: hasRefreshToken,
      }
    });

  } catch (error) {
    logger.error(
      "Session verification failed",
      { error: { error: error instanceof Error ? error.message : String(error) }, endpoint: "/api/auth/me" }
    );

    return NextResponse.json(
      { authenticated: false, user: null, error: "Session verification failed" },
      { status: 200 }
    );
  }
}

/**
 * Fetch user profile from Firestore
 * Falls back to session data if Firestore unavailable
 */
async function fetchUserProfile(session: SessionData) {
  try {
    // Try to get fresh data from Firestore
    const userDoc = await dbAdmin.collection("users").doc(session.userId).get();

    if (userDoc.exists) {
      const data = userDoc.data();
      return {
        id: session.userId,
        uid: session.userId, // Alias for compatibility
        email: session.email,
        fullName: data?.fullName || null,
        handle: data?.handle || null,
        bio: data?.bio || null,
        major: data?.major || null,
        graduationYear: data?.graduationYear || null,
        avatarUrl: data?.avatarUrl || null,
        schoolId: data?.schoolId || session.campusId,
        campusId: data?.campusId || session.campusId,
        isBuilder: data?.builderOptIn || false,
        builderOptIn: data?.builderOptIn || false,
        onboardingCompleted: !!(
          data?.onboardingCompleted ||
          data?.onboardingComplete ||
          data?.onboardingCompletedAt ||
          (data?.handle && data?.fullName)
        ),
        isAdmin: session.isAdmin || false,
        createdAt: data?.createdAt || null,
      };
    }
  } catch {
    // Firestore unavailable (dev mode without emulator)
    logger.warn("Firestore unavailable, using session data", {
      metadata: { userId: session.userId, endpoint: "/api/auth/me" }
    });
  }

  // Fallback to session data
  return {
    id: session.userId,
    uid: session.userId,
    email: session.email,
    fullName: null,
    handle: null,
    bio: null,
    major: null,
    graduationYear: null,
    avatarUrl: null,
    schoolId: session.campusId,
    campusId: session.campusId,
    isBuilder: false,
    builderOptIn: false,
    onboardingCompleted: session.onboardingCompleted || false, // Use session value as fallback
    isAdmin: session.isAdmin || false,
    createdAt: null,
  };
}

/**
 * POST - Refresh session (extends expiry)
 * Called periodically by client to keep session alive
 */
export async function POST(request: NextRequest) {
  // Rate limit: 100 requests per minute for session checks
  const rateLimitResult = await enforceRateLimit('apiGeneral', request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { authenticated: false, user: null, error: rateLimitResult.error },
      { status: rateLimitResult.status, headers: rateLimitResult.headers }
    );
  }

  // For now, just validate - could add token refresh logic here
  return GET(request);
}
