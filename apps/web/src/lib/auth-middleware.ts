// API Authentication Middleware
// Provides authentication context for API routes

import { type NextRequest } from 'next/server';
import { getCurrentUser, type AuthenticatedUser } from './auth-server';

/**
 * Authentication configuration for API routes
 */
export interface AuthConfig {
  /** Require authentication (default: true) */
  required?: boolean;
  /** Required roles for access */
  roles?: string[];
  /** Skip authentication entirely */
  skip?: boolean;
}

/**
 * Authentication context passed to handlers
 */
export interface AuthContext {
  /** Authenticated user information */
  user: AuthenticatedUser;
  /** User ID (shorthand) */
  uid: string;
  /** User ID (alias for uid, used by api-wrapper) */
  userId: string;
  /** User email */
  email?: string;
  /** Authentication method used */
  method: 'firebase' | 'api-key';
  /** Request timestamp */
  timestamp: number;
  /** Whether this is a test user */
  isTestUser?: boolean;
}

/**
 * Authenticate an incoming request
 * Returns auth context if authenticated, null otherwise
 */
export async function authenticateRequest(
  request: NextRequest,
  config: AuthConfig = {}
): Promise<AuthContext | null> {
  // Skip authentication if configured
  if (config.skip) {
    return null;
  }

  try {
    const user = await getCurrentUser(request);

    if (!user) {
      if (config.required !== false) {
        return null;
      }
      return null;
    }

    // Create auth context
    const authContext: AuthContext = {
      user,
      uid: user.uid,
      userId: user.uid, // Alias for uid
      email: user.email,
      method: detectAuthMethod(request),
      timestamp: Date.now(),
      isTestUser: user.email?.includes('test') || user.email?.includes('dev') || false,
    };

    return authContext;
  } catch (error) {
    console.error('[Auth Middleware] Authentication error:', error);
    return null;
  }
}

/**
 * Detect the authentication method used
 * SECURITY: Only firebase and api-key methods are valid in production
 */
function detectAuthMethod(request: NextRequest): 'firebase' | 'api-key' {
  if (request.headers.get('x-api-key')) {
    return 'api-key';
  }

  return 'firebase';
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message = 'Forbidden') {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
