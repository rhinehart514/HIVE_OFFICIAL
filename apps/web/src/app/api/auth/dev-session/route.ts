/**
 * Development Session API Route
 * Creates a test session for local development without Firebase
 */

import { type NextRequest, NextResponse } from 'next/server';
import { currentEnvironment } from '@/lib/env';
import { createSession, setSessionCookie } from '@/lib/session';

// User type from dev-auth-helper
interface DevUser {
  userId: string;
  email: string;
  handle: string;
  schoolId: string;
  role: string;
  displayName?: string;
}

// Conditionally import dev-auth-helper only in development
let createDevSession: ((email: string, request: NextRequest) => Promise<{ success: boolean; user?: DevUser; tokens?: { accessToken: string }; error?: string }>) | null = null;

async function loadDevAuthHelper() {
  if (process.env.NODE_ENV !== 'production' && !createDevSession) {
    const devAuthHelper = await import('@/lib/dev-auth-helper');
    createDevSession = devAuthHelper.createDevSession;
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (currentEnvironment !== 'development') {
    return NextResponse.json(
      { error: 'Development authentication not available' },
      { status: 403 }
    );
  }

  try {
    // Load dev auth helper
    await loadDevAuthHelper();

    // Use jwrhineh as default for quick testing (founder account)
    const body = await request.json().catch(() => ({}));
    const email = body?.email || 'jwrhineh@buffalo.edu';
    if (!createDevSession) {
      return NextResponse.json(
        { error: 'Development session helper unavailable' },
        { status: 503 }
      );
    }
    const result = await createDevSession(email, request);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Create proper hive_session JWT token using session.ts
    // Normalize schoolId to campusId format (ub -> ub-buffalo)
    const campusId = result.user.schoolId === 'ub' ? 'ub-buffalo' : (result.user.schoolId || 'ub-buffalo');

    // Dev users are always considered as having completed onboarding
    // This bypasses the middleware onboarding redirect
    const sessionToken = await createSession({
      userId: result.user.userId,
      email: result.user.email,
      campusId,
      isAdmin: result.user.role === 'admin' || result.user.role === 'founder',
      onboardingCompleted: true, // Always true for dev users to bypass onboarding
    });

    // Create response with session - redirect to feed (not onboarding)
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Development session created',
      redirectUrl: '/feed'
    });

    // Set proper hive_session cookie using session.ts
    setSessionCookie(response, sessionToken);

    // Also set dev-mode indicator (non-httpOnly for client detection)
    response.cookies.set('dev-mode', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Dev session error:', error);
    return NextResponse.json(
      { error: 'Failed to create development session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (currentEnvironment !== 'development') {
    return NextResponse.json(
      { error: 'Development authentication not available' },
      { status: 403 }
    );
  }

  // Return available test users
  return NextResponse.json({
    message: 'Development session endpoint',
    testUsers: [
      'jwrhineh@buffalo.edu (founder - default)',
      'student@test.edu',
      'faculty@test.edu',
      'admin@test.edu',
      'jacob@test.edu',
      'sarah.chen@buffalo.edu',
      'admin@buffalo.edu'
    ],
    usage: 'POST to this endpoint to create a test session. Pass { "email": "..." } to use a specific user.'
  });
}
