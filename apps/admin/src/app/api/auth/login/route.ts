/**
 * Admin Login API Route
 *
 * POST /api/auth/login
 * Verifies Firebase ID token and creates JWT session cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminUser,
  setAdminSessionCookie,
  logAdminActivity,
} from '../../../../lib/admin-auth';
import { auth } from '../../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Firebase ID token required' },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get admin user (also verifies admin status)
    const admin = await getAdminUser(userId);

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Log admin login
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    await logAdminActivity(admin.id, 'login', { email: admin.email }, ipAddress);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    });

    // Set JWT session cookie
    await setAdminSessionCookie(response, admin);

    return response;
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
