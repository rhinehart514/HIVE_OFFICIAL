import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, type SessionData } from "@/lib/session";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";

/**
 * Unified Session Endpoint
 *
 * This is the SINGLE source of truth for authentication state.
 * It reads the httpOnly JWT cookie and returns user data.
 *
 * - Works identically in dev and production
 * - No localStorage, no Bearer tokens, no Firebase client SDK
 * - Stateless JWT verification (scalable)
 */

const SESSION_COOKIE_NAME = 'hive_session';

export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      authenticated: true,
      user: userData,
      session: {
        sessionId: session.sessionId,
        verifiedAt: session.verifiedAt,
        isAdmin: session.isAdmin || false,
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
        onboardingCompleted: !!(data?.handle && data?.fullName),
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
    onboardingCompleted: false,
    isAdmin: session.isAdmin || false,
    createdAt: null,
  };
}

/**
 * POST - Refresh session (extends expiry)
 * Called periodically by client to keep session alive
 */
export async function POST(request: NextRequest) {
  // For now, just validate - could add token refresh logic here
  return GET(request);
}
