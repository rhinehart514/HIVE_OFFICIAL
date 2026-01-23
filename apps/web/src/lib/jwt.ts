/**
 * JWT Utilities for Session Signing
 *
 * Uses jose library for secure JWT operations.
 * The session secret is shared with session.ts for consistency.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getEncodedSessionSecret } from './session';

/**
 * Sign a JWT with the given payload and expiration
 *
 * @param payload - The data to encode in the JWT
 * @param expiresIn - Expiration time (e.g., '30d', '15m', '1h')
 * @returns Signed JWT string
 */
export async function signJwt(
  payload: Record<string, unknown>,
  expiresIn: string = '30d'
): Promise<string> {
  const secret = getEncodedSessionSecret();

  const token = await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT
 *
 * @param token - The JWT to verify
 * @returns The decoded payload or null if invalid
 */
export async function verifyJwt<T extends Record<string, unknown>>(
  token: string
): Promise<T | null> {
  try {
    const secret = getEncodedSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    return null;
  }
}
