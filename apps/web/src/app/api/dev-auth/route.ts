/**
 * DEVELOPMENT-ONLY Authentication Endpoint
 * Provides secure testing access while maintaining production security
 */

import { type NextRequest } from 'next/server';
import { currentEnvironment } from '@/lib/env';
import { NextResponse } from 'next/server';

import { ApiResponseHelper, HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";

// Conditionally import dev-auth-helper only in development
let handleDevAuth: ((request: NextRequest) => Promise<Response> | Response) | null = null;

async function loadDevAuthHelper() {
  if (process.env.NODE_ENV !== 'production' && !handleDevAuth) {
    const devAuthHelper = await import('@/lib/dev-auth-helper');
    handleDevAuth = devAuthHelper.handleDevAuth;
  }
}

/**
 * Development authentication endpoint
 * ONLY WORKS IN DEVELOPMENT - BLOCKED IN PRODUCTION
 */
export async function POST(request: NextRequest) {
  // SECURITY: Block completely in production
  if (currentEnvironment !== 'development') {
    return NextResponse.json(ApiResponseHelper.error("Development authentication not available in production", "FORBIDDEN"), { status: HttpStatus.FORBIDDEN });
  }

  // Load dev auth helper
  await loadDevAuthHelper();

  if (!handleDevAuth) {
    return NextResponse.json(ApiResponseHelper.error("Dev auth handler unavailable", "SERVICE_UNAVAILABLE"), { status: HttpStatus.SERVICE_UNAVAILABLE });
  }
  return handleDevAuth(request);
}

/**
 * Get development users list
 */
export async function GET() {
  // SECURITY: Block completely in production  
  if (currentEnvironment !== 'development') {
    return NextResponse.json(ApiResponseHelper.error("Development authentication not available in production", "FORBIDDEN"), { status: HttpStatus.FORBIDDEN });
  }

  const { getDevUsers } = await import('@/lib/dev-auth-helper');
  
  return NextResponse.json({
    users: getDevUsers(),
    message: 'Development users available for testing'
  });
}
