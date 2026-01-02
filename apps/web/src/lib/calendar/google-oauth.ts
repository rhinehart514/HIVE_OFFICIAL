/**
 * Google OAuth2 Client for Calendar Integration
 *
 * Handles Google OAuth2 flow for calendar access.
 * We only request freebusy.read scope to minimize permissions.
 *
 * @author HIVE Backend Team
 * @version 1.0.0
 */

import { nanoid } from 'nanoid';
import { logger } from '@/lib/structured-logger';

/**
 * Retry with exponential backoff for Google API calls
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 200,
    maxDelayMs = 5000,
    operationName = 'operation'
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable (network/rate limit issues)
      const isRetryable =
        lastError.message.includes('ECONNRESET') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('ENOTFOUND') ||
        lastError.message.includes('fetch failed') ||
        lastError.message.includes('network') ||
        lastError.message.includes('429') || // Rate limited
        lastError.message.includes('503'); // Service unavailable

      if (!isRetryable) {
        break;
      }

      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      logger.debug(`Retrying ${operationName} after ${Math.round(delay)}ms`, {
        component: 'calendar-oauth',
        attempt: attempt + 1,
        maxRetries,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Google OAuth2 endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';

// Scopes - only request what we need (freebusy.read)
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.freebusy',
].join(' ');

/**
 * Get OAuth configuration from environment
 */
function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Google Calendar OAuth credentials are required in production');
    }
    // Return null for development - calendar features disabled
    return null;
  }

  return { clientId, clientSecret };
}

/**
 * Get the OAuth redirect URI based on environment
 */
export function getRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/calendar/callback`;
}

/**
 * Generate OAuth authorization URL
 * Returns null if OAuth is not configured
 */
export function getAuthorizationUrl(userId: string): string | null {
  const config = getOAuthConfig();
  if (!config) return null;

  // State includes user ID for callback validation + CSRF protection
  const state = Buffer.from(
    JSON.stringify({
      userId,
      nonce: nanoid(),
      timestamp: Date.now(),
    })
  ).toString('base64');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: CALENDAR_SCOPES,
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Always show consent screen
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Parse state from callback
 */
export function parseState(state: string): {
  userId: string;
  nonce: string;
  timestamp: number;
} | null {
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    // Validate state is recent (within 10 minutes)
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
} | null> {
  const config = getOAuthConfig();
  if (!config) return null;

  try {
    const result = await withRetry(
      async () => {
        const response = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: getRedirectUri(),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Non-retryable OAuth errors
          if (response.status === 400 || response.status === 401) {
            logger.warn('Token exchange rejected by Google', {
              component: 'calendar-oauth',
              status: response.status,
              error: errorText.substring(0, 200),
            });
            return null;
          }
          // Throw for retry on transient errors
          throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        };
      },
      { operationName: 'exchangeCodeForTokens', maxRetries: 2 }
    );

    return result;
  } catch (error) {
    logger.error('Token exchange error', { component: 'calendar-oauth' }, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: number;
} | null> {
  const config = getOAuthConfig();
  if (!config) return null;

  try {
    const result = await withRetry(
      async () => {
        const response = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (!response.ok) {
          // Refresh token revoked or expired - not retryable
          if (response.status === 400 || response.status === 401) {
            logger.warn('Refresh token invalid or revoked', {
              component: 'calendar-oauth',
              status: response.status,
            });
            return null;
          }
          // Throw for retry on transient errors
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = await response.json();
        return {
          accessToken: data.access_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        };
      },
      { operationName: 'refreshAccessToken', maxRetries: 3 }
    );

    return result;
  } catch (error) {
    logger.error('Token refresh error', { component: 'calendar-oauth' }, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * FreeBusy time slot
 */
export interface BusySlot {
  start: string; // ISO timestamp
  end: string; // ISO timestamp
}

/**
 * Fetch free/busy information from Google Calendar
 * Returns busy time slots for the specified time range
 */
export async function getFreeBusy(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<BusySlot[] | null> {
  try {
    const result = await withRetry(
      async () => {
        const response = await fetch(GOOGLE_FREEBUSY_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeMin,
            timeMax,
            items: [{ id: 'primary' }], // Primary calendar
          }),
        });

        if (!response.ok) {
          // Token expired or invalid - caller should refresh
          if (response.status === 401) {
            logger.debug('FreeBusy token expired', { component: 'calendar-oauth' });
            return null;
          }
          // Rate limited - throw for retry
          if (response.status === 429) {
            throw new Error('429 Rate limited by Google Calendar API');
          }
          // Service error - throw for retry
          if (response.status >= 500) {
            throw new Error(`${response.status} Google Calendar service error`);
          }
          // Other client errors are not retryable
          logger.warn('FreeBusy request failed', {
            component: 'calendar-oauth',
            status: response.status,
          });
          return null;
        }

        const data = await response.json();
        const busySlots = data.calendars?.primary?.busy || [];

        return busySlots.map((slot: { start: string; end: string }) => ({
          start: slot.start,
          end: slot.end,
        }));
      },
      { operationName: 'getFreeBusy', maxRetries: 3, baseDelayMs: 500 }
    );

    return result;
  } catch (error) {
    logger.error('FreeBusy fetch error', { component: 'calendar-oauth' }, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Check if Google Calendar OAuth is configured
 */
export function isCalendarOAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  );
}
