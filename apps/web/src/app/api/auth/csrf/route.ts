/**
 * CSRF Token Endpoint
 * Returns the CSRF token for the current session
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { enforceRateLimit } from "@/lib/secure-rate-limiter";

export async function GET(request: NextRequest) {
  // Rate limit: 100 requests per minute for CSRF token requests
  const rateLimitResult = await enforceRateLimit('apiGeneral', request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { status: rateLimitResult.status, headers: rateLimitResult.headers }
    );
  }

  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Return CSRF token in header for admin sessions
  const response = NextResponse.json({ success: true });

  if (session.isAdmin && session.csrf) {
    response.headers.set('X-CSRF-Token', session.csrf);
  }

  return response;
}