/**
 * Server-side App Check Token Verification
 *
 * Uses Firebase Admin SDK to cryptographically verify App Check tokens.
 * This is the proper way to verify tokens server-side - NOT just checking if a token exists.
 */

import * as admin from 'firebase-admin';
import { isFirebaseConfigured } from './firebase-admin';
import { logger } from './logger';

// Cache for App Check instance
let appCheckInstance: admin.appCheck.AppCheck | null = null;

/**
 * Get the Firebase Admin App Check instance
 */
function getAppCheck(): admin.appCheck.AppCheck | null {
  if (!isFirebaseConfigured) {
    return null;
  }

  if (!appCheckInstance) {
    try {
      appCheckInstance = admin.appCheck();
    } catch (error) {
      logger.error('Failed to initialize App Check', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  return appCheckInstance;
}

/**
 * Verify an App Check token using Firebase Admin SDK
 *
 * @param token - The App Check token from the X-Firebase-AppCheck header
 * @returns Object with verification result and claims if successful
 */
export async function verifyAppCheckToken(
  token: string | null
): Promise<{
  valid: boolean;
  appId?: string;
  error?: string;
}> {
  // No token provided
  if (!token) {
    return { valid: false, error: 'No App Check token provided' };
  }

  // Development mode - accept debug tokens
  if (process.env.NODE_ENV === 'development') {
    if (token.startsWith('debug-') || token === 'test-token') {
      logger.debug('App Check: Accepting debug token in development');
      return { valid: true, appId: 'debug-app' };
    }
  }

  // Skip verification if App Check is disabled
  if (process.env.NEXT_PUBLIC_ENABLE_APP_CHECK !== 'true') {
    // App Check not enabled - allow all requests through
    return { valid: true, appId: 'app-check-disabled' };
  }

  // Get App Check instance
  const appCheck = getAppCheck();
  if (!appCheck) {
    // Firebase not configured - in production this is an error
    if (process.env.NODE_ENV === 'production') {
      logger.error('App Check: Firebase Admin not configured in production');
      return { valid: false, error: 'App Check verification unavailable' };
    }
    // In development, allow through
    return { valid: true, appId: 'firebase-not-configured' };
  }

  try {
    // Verify the token with Firebase Admin SDK
    const decodedToken = await appCheck.verifyToken(token);

    logger.debug('App Check: Token verified successfully', {
      appId: decodedToken.appId,
      token: decodedToken.token ? 'present' : 'missing',
    });

    return {
      valid: true,
      appId: decodedToken.appId,
    };
  } catch (error) {
    // Log verification failures for monitoring
    logger.warn('App Check: Token verification failed', {
      error: error instanceof Error ? error.message : String(error),
      tokenPrefix: token.substring(0, 20) + '...',
    });

    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

/**
 * Middleware-style function to verify App Check on a request
 *
 * @param request - The incoming request
 * @returns Object with verification result
 */
export async function verifyRequestAppCheck(
  request: Request
): Promise<{
  valid: boolean;
  appId?: string;
  error?: string;
}> {
  const token = request.headers.get('X-Firebase-AppCheck');
  return verifyAppCheckToken(token);
}

/**
 * Higher-order function to protect API routes with App Check
 *
 * @param handler - The API route handler
 * @param options - Configuration options
 * @returns Wrapped handler that verifies App Check
 */
export function withAppCheck<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T,
  options: {
    required?: boolean; // If true, reject requests without valid token
    logOnly?: boolean;  // If true, only log failures but allow through
  } = {}
): T {
  const { required = false, logOnly = false } = options;

  return (async (...args: unknown[]) => {
    const request = args[0] as Request;
    const result = await verifyRequestAppCheck(request);

    if (!result.valid) {
      if (logOnly) {
        logger.warn('App Check: Request allowed despite invalid token (logOnly mode)', {
          error: result.error,
          url: request.url,
        });
      } else if (required) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: 'App Check verification failed',
              code: 'APP_CHECK_FAILED',
            },
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return handler(...args);
  }) as T;
}

export default {
  verifyAppCheckToken,
  verifyRequestAppCheck,
  withAppCheck,
};
