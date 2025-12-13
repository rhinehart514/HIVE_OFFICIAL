/**
 * Development Auth Helper
 * Creates mock sessions for local development without Firebase
 */

import type { NextRequest } from 'next/server';

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
    schoolId: 'ub',
    role: 'student',
    displayName: 'Test User',
  },
  'student@test.edu': {
    userId: 'dev-student-001',
    email: 'student@test.edu',
    handle: 'teststudent',
    schoolId: 'test-campus',
    role: 'student',
    displayName: 'Test Student',
  },
  'faculty@test.edu': {
    userId: 'dev-faculty-001',
    email: 'faculty@test.edu',
    handle: 'testfaculty',
    schoolId: 'test-campus',
    role: 'faculty',
    displayName: 'Test Faculty',
  },
  'admin@test.edu': {
    userId: 'dev-admin-001',
    email: 'admin@test.edu',
    handle: 'testadmin',
    schoolId: 'test-campus',
    role: 'admin',
    displayName: 'Test Admin',
  },
  'admin@buffalo.edu': {
    userId: 'dev-ubadmin-001',
    email: 'admin@buffalo.edu',
    handle: 'ubadmin',
    schoolId: 'ub',
    role: 'admin',
    displayName: 'UB Admin',
  },
  'sarah.chen@buffalo.edu': {
    userId: 'dev-sarah-001',
    email: 'sarah.chen@buffalo.edu',
    handle: 'sarahchen',
    schoolId: 'ub',
    role: 'student',
    displayName: 'Sarah Chen',
  },
};

/**
 * Create a development session for testing
 */
export async function createDevSession(
  email: string,
  _request: NextRequest
): Promise<{
  success: boolean;
  user?: DevUser;
  tokens?: { accessToken: string };
  error?: string;
}> {
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists in mock database
  let user = DEV_USERS[normalizedEmail];

  // If not found, create a new mock user based on email
  if (!user) {
    // Extract handle from email
    const handle = normalizedEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
    const domain = normalizedEmail.split('@')[1];

    // Determine school from domain
    let schoolId = 'unknown';
    if (domain?.includes('buffalo.edu')) {
      schoolId = 'ub';
    } else if (domain?.includes('test.edu')) {
      schoolId = 'test-campus';
    }

    user = {
      userId: `dev-${handle}-${Date.now()}`,
      email: normalizedEmail,
      handle,
      schoolId,
      role: 'student',
      displayName: handle.charAt(0).toUpperCase() + handle.slice(1),
    };
  }

  // Generate a mock access token
  const accessToken = `dev-token-${user.userId}-${Date.now()}`;

  return {
    success: true,
    user,
    tokens: { accessToken },
  };
}

/**
 * Get available dev users
 */
export function getDevUsers(): DevUser[] {
  return Object.values(DEV_USERS);
}

/**
 * Handle dev auth request and return a Response
 */
export async function handleDevAuth(request: NextRequest): Promise<Response> {
  const { NextResponse } = await import('next/server');

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await createDevSession(email, request);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
