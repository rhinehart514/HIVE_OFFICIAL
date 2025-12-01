/**
 * Server-side authentication utilities
 * SECURITY: All authentication uses Firebase Admin SDK token verification
 */
import 'server-only';

import { type NextRequest } from 'next/server';
import { authAdmin as adminAuth } from '@/lib/firebase-admin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  displayName?: string;
}

/**
 * Extract and verify auth token from request headers
 * SECURITY: Uses Firebase Admin SDK for cryptographic token verification
 * Returns null if authentication fails
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');

    // SECURITY: Verify Firebase ID token with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      displayName: decodedToken.name
    };
  } catch {
    return null;
  }
}

/**
 * Middleware-style auth check for API routes
 * Returns user if authenticated, throws error if not
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Alias for requireAuth for compatibility
 */
export const validateAuth = requireAuth;

/**
 * Extract auth token from request headers
 * Returns the bearer token string or null if not present
 */
export function getAuthTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}

/**
 * Verify an auth token and return the decoded token
 * Returns null if verification fails
 */
export async function verifyAuthToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      displayName: decodedToken.name
    };
  } catch {
    return null;
  }
}
