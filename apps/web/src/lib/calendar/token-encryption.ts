/**
 * Token Encryption for Calendar OAuth
 *
 * Encrypts and decrypts OAuth tokens using AES-256-GCM.
 * Tokens are stored encrypted in Firestore.
 *
 * @author HIVE Backend Team
 * @version 1.0.0
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;

  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CALENDAR_TOKEN_ENCRYPTION_KEY is required in production');
    }
    // Development fallback - use a derived key from SESSION_SECRET
    const fallback = process.env.SESSION_SECRET || 'dev-calendar-encryption-key-32ch';
    return Buffer.from(fallback.padEnd(32, '0').slice(0, 32));
  }

  // Key should be 32 bytes (256 bits) for AES-256
  if (key.length < 32) {
    throw new Error('CALENDAR_TOKEN_ENCRYPTION_KEY must be at least 32 characters');
  }

  return Buffer.from(key.slice(0, 32));
}

/**
 * Encrypt sensitive token data
 * Returns base64 encoded string: IV + AuthTag + Ciphertext
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString('base64');
}

/**
 * Decrypt token data
 * Expects base64 encoded string: IV + AuthTag + Ciphertext
 */
export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(ciphertext, 'base64');

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Encrypt OAuth token object
 */
export function encryptTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}): string {
  return encryptToken(JSON.stringify(tokens));
}

/**
 * Decrypt OAuth token object
 */
export function decryptTokens(encrypted: string): {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} {
  const json = decryptToken(encrypted);
  return JSON.parse(json);
}
