/**
 * Secure Session Management with JWT
 * Prevents session forgery and ensures data integrity
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { nanoid } from 'nanoid';
import type { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// Session configuration
const rawSecret = process.env.SESSION_SECRET;

// Validate SESSION_SECRET in production
if (!rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET is required in production');
}
if (rawSecret && rawSecret.length < 32 && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET must be at least 32 characters in production');
}

// Generate a cryptographically secure random secret for development
// This ensures dev sessions are secure and can't be predicted
function generateDevSecret(): string {
  // Use Web Crypto API for secure random generation (available in Node.js 19+ and all modern browsers)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return `dev-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }
  // Fallback for older Node.js versions - use require('crypto')
  try {
    const nodeCrypto = require('crypto');
    return `dev-${nodeCrypto.randomBytes(32).toString('hex')}`;
  } catch {
    // Last resort fallback - only for development
    console.warn('⚠️ Using weak random generation for dev session secret. This is a security concern if NODE_ENV is not development.');
    return `dev-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  }
}

const SESSION_SECRET = rawSecret || generateDevSecret();
const SESSION_COOKIE_NAME = 'hive_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds (PRD requirement)
const ADMIN_SESSION_MAX_AGE = 4 * 60 * 60; // 4 hours for admin sessions

// Convert secret to key
const secret = new TextEncoder().encode(SESSION_SECRET);

/** Session data stored in JWT */
export interface SessionData {
  userId: string;
  email: string;
  campusId: string;
  isAdmin?: boolean;
  verifiedAt: string;
  sessionId: string;
  csrf?: string; // CSRF token for admin sessions
  onboardingCompleted?: boolean; // Track onboarding state in JWT for dev mode
}

/** Input for creating a session (without auto-generated fields) */
export interface CreateSessionInput {
  userId: string;
  email: string;
  campusId: string;
  isAdmin?: boolean;
  onboardingCompleted?: boolean; // Include in session for dev mode fallback
}

/**
 * Create a signed JWT session token
 */
export async function createSession(data: CreateSessionInput): Promise<string> {
  const sessionData: SessionData = {
    userId: data.userId,
    email: data.email,
    campusId: data.campusId,
    isAdmin: data.isAdmin,
    sessionId: nanoid(),
    verifiedAt: new Date().toISOString(),
    csrf: data.isAdmin ? nanoid() : undefined,
    onboardingCompleted: data.onboardingCompleted,
  };

  const token = await new SignJWT(sessionData as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(data.userId)
    .setIssuedAt()
    .setExpirationTime(data.isAdmin ? ADMIN_SESSION_MAX_AGE + 's' : SESSION_MAX_AGE + 's')
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    // Validate required fields exist
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.campusId === 'string' &&
      typeof payload.sessionId === 'string' &&
      typeof payload.verifiedAt === 'string'
    ) {
      // Explicitly construct SessionData for type safety
      return {
        userId: payload.userId,
        email: payload.email,
        campusId: payload.campusId,
        sessionId: payload.sessionId,
        verifiedAt: payload.verifiedAt,
        isAdmin: typeof payload.isAdmin === 'boolean' ? payload.isAdmin : undefined,
        csrf: typeof payload.csrf === 'string' ? payload.csrf : undefined,
        onboardingCompleted: typeof payload.onboardingCompleted === 'boolean' ? payload.onboardingCompleted : undefined,
      };
    }
    return null;
  } catch (error) {
    logger.error('Invalid session token', { component: 'session' }, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Get session from request cookies
 */
export async function getSession(request: NextRequest): Promise<SessionData | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }

  return verifySession(sessionCookie.value);
}

/**
 * Set session cookie with secure options
 */
export function setSessionCookie(
  response: NextResponse,
  token: string,
  options?: { isAdmin?: boolean }
): NextResponse {
  const maxAge = options?.isAdmin ? ADMIN_SESSION_MAX_AGE : SESSION_MAX_AGE;

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge,
    path: '/',
  });

  return response;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

/**
 * Validate CSRF token for admin requests
 */
export function validateCSRF(session: SessionData, csrfToken: string | null): boolean {
  if (!session.isAdmin) {
    return true; // Non-admin sessions don't need CSRF
  }

  if (!csrfToken || !session.csrf) {
    return false;
  }

  return session.csrf === csrfToken;
}

/**
 * Generate CSRF token meta tag for client
 */
export function generateCSRFMeta(session: SessionData): string | null {
  if (!session.isAdmin || !session.csrf) {
    return null;
  }

  return `<meta name="csrf-token" content="${session.csrf}" />`;
}
