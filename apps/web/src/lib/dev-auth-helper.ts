/**
 * Development Auth Helper
 * Creates real sessions for local development with Firebase
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { getEncodedSessionSecret } from '@/lib/session';

export interface DevUser {
  userId: string;
  email: string;
  handle: string;
  schoolId: string;
  role: string;
  displayName?: string;
}

// Mock user database for development
// NOTE: jwrhineh uses the REAL Firestore user ID to bypass onboarding check
const DEV_USERS: Record<string, DevUser> = {
  'jwrhineh@buffalo.edu': {
    userId: 'VutSwVLxPzEBoGtjqVzY', // Real Firestore user ID (has isOnboardingComplete: true)
    email: 'jwrhineh@buffalo.edu',
    handle: 'jwrhineh',
    schoolId: 'ub-buffalo',
    role: 'founder',
    displayName: 'Jacob Rhinehart',
  },
  'testuser@buffalo.edu': {
    userId: 'dev-user-001',
    email: 'testuser@buffalo.edu',
    handle: 'testuser',
    schoolId: 'ub-buffalo',
    role: 'student',
    displayName: 'Test User',
  },
  'newuser@buffalo.edu': {
    userId: '', // Will be created
    email: 'newuser@buffalo.edu',
    handle: '',
    schoolId: 'ub-buffalo',
    role: 'student',
    displayName: 'New User',
  },
};

/**
 * Get available dev users
 */
export function getDevUsers(): DevUser[] {
  return Object.values(DEV_USERS);
}

/**
 * Create a development session with proper cookies
 */
export async function createDevSession(
  email: string,
  _request: NextRequest
): Promise<{
  success: boolean;
  user?: DevUser;
  needsOnboarding?: boolean;
  error?: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();

  let userId: string;
  let needsOnboarding = true;
  let isAdmin = false;
  let campusId = 'ub-buffalo';

  // Check if it's a known dev user
  const devUser = DEV_USERS[normalizedEmail];

  if (isFirebaseConfigured) {
    // Look up real user in Firestore
    const existingUsers = await dbAdmin
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      // User exists in Firestore
      const userDoc = existingUsers.docs[0];
      userId = userDoc.id;
      const userData = userDoc.data();

      campusId = userData?.campusId || userData?.schoolId || 'ub-buffalo';
      isAdmin = userData?.isAdmin || false;

      // Check onboarding status
      needsOnboarding = !(
        userData?.onboardingCompleted ||
        userData?.onboardingComplete ||
        userData?.onboardingCompletedAt ||
        (userData?.handle && userData?.fullName)
      );

      logger.info('Dev auth: Found existing user', {
        userId,
        email: normalizedEmail.replace(/(.{3}).*@/, '$1***@'),
        needsOnboarding,
      });
    } else {
      // Create new user for testing
      const userRef = dbAdmin.collection('users').doc();
      userId = userRef.id;

      await userRef.set({
        id: userId,
        email: normalizedEmail,
        campusId,
        schoolId: campusId,
        emailVerified: true,
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      needsOnboarding = true;

      logger.info('Dev auth: Created new user', {
        userId,
        email: normalizedEmail.replace(/(.{3}).*@/, '$1***@'),
      });
    }
  } else {
    // Firebase not configured - use mock data
    userId = devUser?.userId || `dev-${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '-')}`;
    needsOnboarding = !devUser?.handle; // Need onboarding if no handle
  }

  return {
    success: true,
    user: {
      userId,
      email: normalizedEmail,
      handle: devUser?.handle || '',
      schoolId: campusId,
      role: devUser?.role || 'student',
      displayName: devUser?.displayName || normalizedEmail.split('@')[0],
    },
    needsOnboarding,
  };
}

/**
 * Handle dev auth request and return a Response with session cookie
 */
export async function handleDevAuth(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email domain
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const result = await createDevSession(normalizedEmail, request);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create session' },
        { status: 400 }
      );
    }

    // Create session token using centralized secure secret
    const secret = getEncodedSessionSecret();

    const campusId = result.user.schoolId || 'ub-buffalo';
    const isAdmin = result.user.role === 'admin' || result.user.role === 'founder';

    const sessionToken = await new SignJWT({
      userId: result.user.userId,
      email: normalizedEmail,
      campusId,
      isAdmin,
      onboardingCompleted: !result.needsOnboarding,
      verifiedAt: new Date().toISOString(),
      sessionId: `dev-session-${Date.now()}`,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(result.user.userId)
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      needsOnboarding: result.needsOnboarding,
      user: {
        id: result.user.userId,
        email: normalizedEmail,
        campusId,
        handle: result.user.handle,
        displayName: result.user.displayName,
        onboardingCompleted: !result.needsOnboarding,
      },
      devMode: true,
    });

    // Set session cookie (same as verify-code route)
    response.cookies.set('hive_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    logger.info('Dev auth: Session created', {
      userId: result.user.userId,
      email: normalizedEmail.replace(/(.{3}).*@/, '$1***@'),
      needsOnboarding: result.needsOnboarding,
    });

    return response;
  } catch (error) {
    logger.error('Dev auth error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
