import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * DEPRECATED: POST /api/auth/verify-signin-code
 *
 * This endpoint has been deprecated in favor of /api/auth/verify-code.
 * Returns 410 Gone with migration instructions.
 *
 * @deprecated Use /api/auth/verify-code instead
 */
export async function POST() {
  logger.warn('Deprecated endpoint called: /api/auth/verify-signin-code', {
    component: 'deprecated-auth',
    action: 'verify-signin-code',
    metadata: {
      deprecatedAt: '2026-02-02',
      replacement: '/api/auth/verify-code',
    },
  });

  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated',
      code: 'ENDPOINT_DEPRECATED',
      message: 'Please use /api/auth/verify-code instead',
      migration: {
        oldEndpoint: '/api/auth/verify-signin-code',
        newEndpoint: '/api/auth/verify-code',
        changes: [
          'Use email field instead of handle',
          'Include schoolId in the request body',
        ],
      },
    },
    { status: 410 }
  );
}
