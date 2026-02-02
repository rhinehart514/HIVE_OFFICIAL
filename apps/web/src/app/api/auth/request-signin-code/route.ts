import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * DEPRECATED: POST /api/auth/request-signin-code
 *
 * This endpoint has been deprecated in favor of /api/auth/send-code.
 * Returns 410 Gone with migration instructions.
 *
 * @deprecated Use /api/auth/send-code instead
 */
export async function POST() {
  logger.warn('Deprecated endpoint called: /api/auth/request-signin-code', {
    component: 'deprecated-auth',
    action: 'request-signin-code',
    metadata: {
      deprecatedAt: '2026-02-02',
      replacement: '/api/auth/send-code',
    },
  });

  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint has been deprecated',
      code: 'ENDPOINT_DEPRECATED',
      message: 'Please use /api/auth/send-code instead',
      migration: {
        oldEndpoint: '/api/auth/request-signin-code',
        newEndpoint: '/api/auth/send-code',
        changes: [
          'Use email field instead of handle',
          'Include schoolId in the request body',
        ],
      },
    },
    { status: 410 }
  );
}
