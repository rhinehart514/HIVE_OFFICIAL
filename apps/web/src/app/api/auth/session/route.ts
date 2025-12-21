import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { ApiResponseHelper, HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";
import { enforceRateLimit } from "@/lib/secure-rate-limiter";
import { getEncodedSessionSecret } from "@/lib/session";

/**
 * Session validation endpoint - verifies token and returns user session info
 * GET /api/auth/session
 */
async function handleSessionRequest(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(ApiResponseHelper.error("Missing or invalid authorization header", "UNAUTHORIZED"), { status: HttpStatus.UNAUTHORIZED });
    }

    const idToken = authHeader.substring(7);
    
    // SECURITY: Development token bypass removed for production safety
    // All tokens must be validated through Firebase Auth

    const auth = getAuth();

    // Verify the ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      logger.error(
      `Invalid ID token at /api/auth/session`,
      { error: error instanceof Error ? error.message : String(error) }
    );
      return NextResponse.json(
        { 
          valid: false,
          error: "Invalid or expired token",
          code: "TOKEN_INVALID"
        },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Get user profile from Firestore
    let userProfile = null;
    try {
      const userDoc = await dbAdmin.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userProfile = {
          id: userId,
          email: userEmail,
          fullName: userData?.fullName || "",
          handle: userData?.handle || "",
          major: userData?.major || "",
          avatarUrl: userData?.avatarUrl || "",
          schoolId: userData?.schoolId || "",
          emailVerified: userData?.emailVerified || false,
          builderOptIn: userData?.builderOptIn || false,
          onboardingCompleted: !!(
            userData?.onboardingCompleted ||
            userData?.onboardingComplete ||
            userData?.onboardingCompletedAt ||
            (userData?.handle && userData?.fullName)
          ),
          createdAt: userData?.createdAt,
          updatedAt: userData?.updatedAt,
        };
      }
    } catch (firestoreError) {
      logger.error(
        `Error fetching user profile at /api/auth/session`,
        { error: { error: firestoreError instanceof Error ? firestoreError.message : String(firestoreError) } }
      );
      // Continue without profile data
    }

    // Return session information
    return NextResponse.json({
      valid: true,
      user: userProfile || {
        id: userId,
        email: userEmail,
        emailVerified: decodedToken.email_verified || false,
        onboardingCompleted: false,
      },
      session: {
        issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
        expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
        authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
        issuer: decodedToken.iss,
        audience: decodedToken.aud,
      },
      token: {
        algorithm: decodedToken.alg || "RS256",
        type: "JWT",
        firebase: true,
      } });

  } catch (error) {
    logger.error(
      `Error validating session at /api/auth/session`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(
      { 
        valid: false,
        error: "Failed to validate session",
        code: "VALIDATION_ERROR"
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * GET /api/auth/session - with rate limiting
 *
 * @deprecated Use /api/auth/me instead. This endpoint validates Bearer tokens
 * while /api/auth/me uses the httpOnly session cookie (preferred pattern).
 */
export async function GET(request: NextRequest) {
  // DEPRECATION WARNING: Use /api/auth/me for session validation
  logger.warn('Deprecated endpoint called: GET /api/auth/session - use /api/auth/me instead', {
    endpoint: '/api/auth/session',
    deprecatedSince: '2024-12-09',
    replacement: '/api/auth/me'
  });

  // Rate limit: 100 requests per minute for session checks
  const rateLimitResult = await enforceRateLimit('apiGeneral', request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { valid: false, error: rateLimitResult.error },
      { status: rateLimitResult.status, headers: rateLimitResult.headers }
    );
  }
  return handleSessionRequest(request);
}

/**
 * Create session from Firebase ID token
 * POST /api/auth/session
 * Body: { idToken, email, schoolId }
 */
export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimitResult = await enforceRateLimit('apiGeneral', request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: rateLimitResult.error },
      { status: rateLimitResult.status, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { idToken, email, schoolId } = body;

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "ID token is required" },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const auth = getAuth();

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      logger.error(
        `Invalid ID token at /api/auth/session POST`,
        { error: error instanceof Error ? error.message : String(error) }
      );
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || email;
    const campusId = schoolId || 'ub-buffalo';

    // Get or create user profile
    const userRef = dbAdmin.collection("users").doc(userId);
    const userDoc = await userRef.get();

    let needsOnboarding = true;
    let userData = userDoc.data();

    if (!userDoc.exists) {
      // Create new user
      const newUser = {
        id: userId,
        email: userEmail,
        campusId,
        schoolId: campusId,
        emailVerified: true,
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await userRef.set(newUser);
      userData = newUser;
      needsOnboarding = true;
    } else {
      // Update existing user
      await userRef.update({
        emailVerified: true,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      needsOnboarding = !(
        userData?.onboardingCompleted ||
        userData?.onboardingComplete ||
        userData?.onboardingCompletedAt ||
        (userData?.handle && userData?.fullName)
      );
    }

    // Create session cookie using centralized secure secret
    const { SignJWT } = await import('jose');
    const secret = getEncodedSessionSecret();

    const sessionToken = await new SignJWT({
      userId,
      email: userEmail,
      campusId,
      isAdmin: userData?.isAdmin || false,
      onboardingCompleted: !needsOnboarding, // CRITICAL: Include onboarding status in JWT
      verifiedAt: new Date().toISOString(),
      sessionId: `session-${Date.now()}`,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      needsOnboarding,
      user: {
        id: userId,
        email: userEmail,
        campusId,
        onboardingCompleted: !needsOnboarding,
      },
    });

    response.cookies.set('hive_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    logger.info('Session created successfully', {
      userId,
      needsOnboarding,
      endpoint: '/api/auth/session',
    });

    return response;

  } catch (error) {
    logger.error(
      `Error creating session at /api/auth/session POST`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}