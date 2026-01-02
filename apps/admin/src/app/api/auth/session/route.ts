/**
 * Admin Session API Route
 *
 * GET /api/auth/session
 * Verifies current JWT session and returns admin info
 */

import { NextResponse } from 'next/server';
import { verifyAdminSession } from '../../../../lib/admin-auth';
// Firebase Admin is initialized via admin-auth which imports firebase-admin

export async function GET() {
  try {
    const admin = await verifyAdminSession();

    if (!admin) {
      return NextResponse.json(
        { authenticated: false, admin: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        campusId: admin.campusId,
      },
    });
  } catch (error) {
    console.error('[Admin Session] Error:', error);
    return NextResponse.json(
      { authenticated: false, admin: null, error: 'Session verification failed' },
      { status: 500 }
    );
  }
}
