/**
 * Admin Logout API Route
 *
 * POST /api/auth/logout
 * Clears JWT session cookie
 */

import { NextResponse } from 'next/server';
import {
  verifyAdminSession,
  clearAdminSessionCookie,
  logAdminActivity,
} from '../../../../lib/admin-auth';

export async function POST() {
  try {
    // Get current admin before clearing session (for logging)
    const admin = await verifyAdminSession();

    // Log logout if we have a valid session
    if (admin) {
      await logAdminActivity(admin.id, 'logout', { email: admin.email });
    }

    // Create response and clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    clearAdminSessionCookie(response);

    return response;
  } catch (error) {
    console.error('[Admin Logout] Error:', error);

    // Even on error, clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out',
    });

    clearAdminSessionCookie(response);

    return response;
  }
}
