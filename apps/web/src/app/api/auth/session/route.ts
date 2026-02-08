/**
 * Session Endpoint
 * GET: Validates token and returns user session info
 * POST: Creates session from Firebase ID token
 *
 * @deprecated Use /api/auth/me instead. This endpoint validates Bearer tokens
 * while /api/auth/me uses the httpOnly session cookie (preferred pattern).
 */

import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { HttpStatus } from '@/lib/api-response-types';
import { getEncodedSessionSecret } from '@/lib/session';
import {
  withErrors,
  RATE_LIMIT_PRESETS,
  type ResponseFormatter,
} from '@/lib/middleware';

/**
 * GET /api/auth/session - Validate session (with rate limiting)
 *
 * @deprecated Use /api/auth/me instead.
 */
export const GET = withErrors(
  async (request: Request, _context: unknown, respond: typeof ResponseFormatter) => {
    // DEPRECATION WARNING
    logger.warn('Deprecated endpoint called: GET /api/auth/session - use /api/auth/me instead', {
      endpoint: '/api/auth/session',
      deprecatedSince: '2024-12-09',
      replacement: '/api/auth/me',
    });

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return respond.error(
        'Missing or invalid authorization header',
        'UNAUTHORIZED',
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const idToken = authHeader.substring(7);
    const auth = getAuth();

    // Verify the ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      logger.error('Invalid ID token at /api/auth/session', {
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error(
        'Invalid or expired token',
        'TOKEN_INVALID',
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Get user profile from Firestore
    let userProfile = null;
    try {
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userProfile = {
          id: userId,
          email: userEmail,
          fullName: userData?.fullName || '',
          handle: userData?.handle || '',
          major: userData?.major || '',
          avatarUrl: userData?.avatarUrl || '',
          schoolId: userData?.schoolId || '',
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
      logger.error('Error fetching user profile at /api/auth/session', {
        error: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
      });
      // Continue without profile data
    }

    // Return session information
    return respond.success({
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
        algorithm: decodedToken.alg || 'RS256',
        type: 'JWT',
        firebase: true,
      },
    });
  },
  { rateLimit: RATE_LIMIT_PRESETS.auth }
);

/**
 * POST /api/auth/session - Create session from Firebase ID token
 * Body: { idToken, email, schoolId }
 */
export const POST = withErrors(
  async (request: Request, _context: unknown, respond: typeof ResponseFormatter) => {
    const body = await request.json();
    const { idToken, email, schoolId } = body;

    if (!idToken) {
      return respond.error('ID token is required', 'MISSING_TOKEN', { status: HttpStatus.BAD_REQUEST });
    }

    const auth = getAuth();

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      logger.error('Invalid ID token at /api/auth/session POST', {
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error(
        'Invalid or expired token',
        'TOKEN_INVALID',
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || email;
    const campusId = schoolId || 'ub-buffalo';

    // Get or create user profile
    const userRef = dbAdmin.collection('users').doc(userId);
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
      onboardingCompleted: !needsOnboarding,
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
      data: {
        needsOnboarding,
        user: {
          id: userId,
          email: userEmail,
          campusId,
          onboardingCompleted: !needsOnboarding,
        },
      },
      meta: { timestamp: new Date().toISOString() },
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
  },
  { rateLimit: RATE_LIMIT_PRESETS.auth }
);
