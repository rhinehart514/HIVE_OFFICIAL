/**
 * Secure Session Management with JWT
 * Prevents session forgery and ensures data integrity
 *
 * Security Features:
 * - Short-lived access tokens (15 min) with refresh tokens (7 days)
 * - httpOnly cookies prevent XSS token theft
 * - Secure flag ensures HTTPS-only in production
 * - SameSite=lax provides CSRF protection
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { nanoid } from 'nanoid';
import type { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { isSessionInvalid } from './session-revocation';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Session configuration
const rawSecret = process.env.SESSION_SECRET;

// Validate SESSION_SECRET in production
if (!rawSecret && isProduction) {
  throw new Error('SESSION_SECRET is required in production');
}
if (rawSecret && rawSecret.length < 32 && isProduction) {
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

// Log session secret source on startup (only in development)
if (isDevelopment) {
  console.warn(`Session secret: ${rawSecret ? 'using .env.local (persistent)' : 'generated random (sessions will NOT persist)'}`);
}

// Cookie names
const SESSION_COOKIE_NAME = 'hive_session';
const REFRESH_COOKIE_NAME = 'hive_refresh';

// Token expiration times
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes for access tokens
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days for refresh tokens
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds (PRD requirement for backward compat)
const ADMIN_SESSION_MAX_AGE = 4 * 60 * 60; // 4 hours for admin sessions

// Convert secret to key
const secret = new TextEncoder().encode(SESSION_SECRET);

/**
 * Get the encoded session secret for JWT signing
 * This ensures all auth routes use the same validated secret
 */
export function getEncodedSessionSecret(): Uint8Array {
  return secret;
}

/** Session data stored in JWT */
export interface SessionData {
  userId: string;
  email: string;
  campusId?: string; // Optional - users can sign up without campus
  isAdmin?: boolean;
  verifiedAt: string;
  sessionId: string;
  csrf?: string; // CSRF token for admin sessions
  onboardingCompleted?: boolean; // Track onboarding state in JWT for dev mode
  tokenType?: 'access' | 'refresh'; // Token type for refresh token flow
}

/** Refresh token data - minimal data for security */
export interface RefreshTokenData {
  userId: string;
  sessionId: string;
  tokenType: 'refresh';
  issuedAt: string;
}

/** Input for creating a session (without auto-generated fields) */
export interface CreateSessionInput {
  userId: string;
  email: string;
  campusId?: string; // Optional - users can sign up without campus
  isAdmin?: boolean;
  onboardingCompleted?: boolean; // Include in session for dev mode fallback
}

/** Token pair returned from authentication */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
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
 * Also checks if the session has been revoked
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    // Validate required fields exist
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      (typeof payload.campusId === 'string' || typeof payload.campusId === 'undefined') &&
      typeof payload.sessionId === 'string' &&
      typeof payload.verifiedAt === 'string'
    ) {
      // Check if session has been revoked
      if (isSessionInvalid(payload.sessionId, payload.userId, payload.verifiedAt)) {
        logger.info('Session rejected - revoked', {
          component: 'session',
          sessionId: payload.sessionId.substring(0, 8) + '...',
          userId: payload.userId,
        });
        return null;
      }

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

/**
 * Create a token pair (access + refresh tokens)
 * Access token: Short-lived (15 min), contains full session data
 * Refresh token: Long-lived (7 days), contains minimal data
 */
export async function createTokenPair(data: CreateSessionInput): Promise<TokenPair> {
  const sessionId = nanoid();
  const now = new Date();

  // Create access token with full session data
  const sessionData: SessionData = {
    userId: data.userId,
    email: data.email,
    campusId: data.campusId,
    isAdmin: data.isAdmin,
    sessionId,
    verifiedAt: now.toISOString(),
    csrf: data.isAdmin ? nanoid() : undefined,
    onboardingCompleted: data.onboardingCompleted,
    tokenType: 'access',
  };

  const accessToken = await new SignJWT(sessionData as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(data.userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_MAX_AGE + 's')
    .sign(secret);

  // Create refresh token with minimal data
  const refreshData: RefreshTokenData = {
    userId: data.userId,
    sessionId,
    tokenType: 'refresh',
    issuedAt: now.toISOString(),
  };

  const refreshToken = await new SignJWT(refreshData as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(data.userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_MAX_AGE + 's')
    .sign(secret);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_MAX_AGE,
    refreshTokenExpiresIn: REFRESH_TOKEN_MAX_AGE,
  };
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenData | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    // Validate it's a refresh token
    if (payload.tokenType !== 'refresh') {
      logger.warn('Invalid token type in refresh token', { component: 'session' });
      return null;
    }

    if (
      typeof payload.userId === 'string' &&
      typeof payload.sessionId === 'string' &&
      typeof payload.issuedAt === 'string'
    ) {
      return {
        userId: payload.userId,
        sessionId: payload.sessionId,
        tokenType: 'refresh',
        issuedAt: payload.issuedAt,
      };
    }
    return null;
  } catch (error) {
    logger.error('Invalid refresh token', { component: 'session' }, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Set both access and refresh cookies
 */
export function setTokenPairCookies(
  response: NextResponse,
  tokens: TokenPair,
  options?: { isAdmin?: boolean }
): NextResponse {
  const accessMaxAge = options?.isAdmin ? ADMIN_SESSION_MAX_AGE : ACCESS_TOKEN_MAX_AGE;

  // Set access token cookie
  response.cookies.set(SESSION_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: accessMaxAge,
    path: '/',
  });

  // Set refresh token cookie.
  // NOTE: middleware reads this cookie on page routes for graceful recovery when access tokens expire,
  // so scope must include page requests.
  response.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict', // Stricter for refresh token
    maxAge: tokens.refreshTokenExpiresIn,
    path: '/',
  });

  return response;
}

/**
 * Get refresh token from request cookies
 */
export function getRefreshToken(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_COOKIE_NAME)?.value || null;
}

/**
 * Clear both session and refresh cookies
 */
export function clearAllSessionCookies(response: NextResponse): NextResponse {
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  return response;
}

/**
 * Check if we're in a secure production environment
 * Used to gate development-only features
 */
export function isSecureEnvironment(): boolean {
  return isProduction && !!rawSecret;
}

/**
 * Export constants for use in other modules
 */
export const SESSION_CONFIG = {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  SESSION_MAX_AGE,
  ADMIN_SESSION_MAX_AGE,
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  isProduction,
  isDevelopment,
} as const;
