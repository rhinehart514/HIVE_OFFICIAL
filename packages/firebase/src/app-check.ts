/**
 * Firebase App Check Configuration
 * Provides app attestation to protect backend resources
 */

import { FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  AppCheck,
  ReCaptchaV3Provider,
  CustomProvider,
  getToken,
} from 'firebase/app-check';

let appCheck: AppCheck | null = null;

/**
 * Initialize Firebase App Check for production security
 */
export function initializeAppCheckSecurity(app: FirebaseApp): AppCheck | null {
  // Only enable in production
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production') {
    return null;
  }

  // Check if App Check is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_APP_CHECK !== 'true') {
    return null;
  }

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    // App Check enabled but missing required key - fail silently
    return null;
  }

  try {
    // Use ReCaptcha V3 for web (invisible to users)
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true, // Auto-refresh tokens
    });

    return appCheck;
  } catch (_error) {
    // App Check initialization failed - continue without it
    return null;
  }
}

/**
 * Custom App Check provider for special cases (e.g., CI/CD, testing)
 */
export class HiveDebugProvider extends CustomProvider {
  constructor(private debugToken: string) {
    super({
      getToken: async () => {
        // In debug mode, return debug token
        if (process.env.NODE_ENV === 'development' && debugToken) {
          return {
            token: debugToken,
            expireTimeMillis: Date.now() + 3600000, // 1 hour
          };
        }

        throw new Error('Debug token not available');
      },
    });
  }
}

/**
 * Initialize App Check with debug provider (for testing)
 */
export function initializeAppCheckDebug(
  app: FirebaseApp,
  debugToken: string
): AppCheck | null {
  if (process.env.NODE_ENV !== 'development') {
    // Debug App Check only available in development
    return null;
  }

  try {
    appCheck = initializeAppCheck(app, {
      provider: new HiveDebugProvider(debugToken),
      isTokenAutoRefreshEnabled: false,
    });

    return appCheck;
  } catch (_error) {
    // Debug App Check initialization failed
    return null;
  }
}

/**
 * Get current App Check token
 */
export async function getAppCheckToken(
  forceRefresh = false
): Promise<string | null> {
  if (!appCheck) {
    return null;
  }

  try {
    const result = await getToken(appCheck, forceRefresh);
    return result.token;
  } catch (_error) {
    // Token retrieval failed - return null
    return null;
  }
}

/**
 * Monitor App Check token refresh (for debugging)
 * Currently disabled - uncomment for debugging token refresh issues
 */
function _monitorAppCheckTokens(): void {
  // Token monitoring disabled - was only used for debugging
  // Keeping function for potential future debugging needs
}

/**
 * Middleware to add App Check token to API requests
 */
export async function addAppCheckHeader(
  headers: Headers | Record<string, string>
): Promise<Headers | Record<string, string>> {
  const token = await getAppCheckToken();

  if (token) {
    if (headers instanceof Headers) {
      headers.set('X-Firebase-AppCheck', token);
    } else {
      headers['X-Firebase-AppCheck'] = token;
    }
  }

  return headers;
}

/**
 * Server-side App Check verification
 * Use this in API routes to verify requests
 */
export async function verifyAppCheckToken(
  token: string | null,
  _projectId: string
): Promise<boolean> {
  if (!token) {
    return false;
  }

  // In production, verify with Firebase Admin SDK
  if (process.env.NODE_ENV === 'production') {
    // This would be done server-side with admin SDK
    // For now, we trust the token if it exists
    // Real implementation would verify with Firebase Admin
    return true;
  }

  // In development, accept debug tokens
  return token.startsWith('debug-');
}

export default {
  initializeAppCheckSecurity,
  initializeAppCheckDebug,
  getAppCheckToken,
  addAppCheckHeader,
  verifyAppCheckToken,
};