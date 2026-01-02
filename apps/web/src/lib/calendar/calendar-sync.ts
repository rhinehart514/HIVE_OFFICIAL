/**
 * Calendar Sync Service
 *
 * Syncs user's calendar busy/free times to Firestore.
 * Only stores aggregated availability data (no event details).
 *
 * Privacy-first approach:
 * - Only free/busy times are stored (no event titles, descriptions, etc.)
 * - Users control which spaces see their availability
 * - Availability data expires and must be refreshed
 *
 * @author HIVE Backend Team
 * @version 1.0.0
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { decryptTokens, encryptTokens } from './token-encryption';
import { getFreeBusy, refreshAccessToken, type BusySlot } from './google-oauth';
import { logger } from '@/lib/structured-logger';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Sync result with error context for better caller handling
 */
export interface SyncResult {
  success: boolean;
  error?: 'no_connection' | 'inactive' | 'token_refresh_failed' | 'google_api_error' | 'firestore_error';
  message?: string;
}

/**
 * Retry with exponential backoff for Firestore operations
 */
async function withFirestoreRetry<T>(
  operation: () => Promise<T>,
  options: { operationName?: string; maxRetries?: number } = {}
): Promise<T> {
  const { operationName = 'operation', maxRetries = 3 } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) break;

      const isRetryable =
        lastError.message.includes('DEADLINE_EXCEEDED') ||
        lastError.message.includes('UNAVAILABLE') ||
        lastError.message.includes('INTERNAL');

      if (!isRetryable) break;

      const delay = Math.min(100 * Math.pow(2, attempt), 2000);
      logger.debug(`Retrying ${operationName} after ${delay}ms`, {
        component: 'calendar-sync',
        attempt: attempt + 1,
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Sync configuration
const SYNC_WINDOW_DAYS = 14; // Sync 2 weeks ahead
const AVAILABILITY_TTL_HOURS = 4; // Availability data expires after 4 hours

/**
 * Time slot for availability grid
 */
export interface TimeSlot {
  /** Hour of day (0-23) */
  hour: number;
  /** Day of week (0-6, Sunday = 0) */
  dayOfWeek: number;
  /** Whether the user is busy during this hour */
  busy: boolean;
}

/**
 * User availability data stored in Firestore
 */
export interface UserAvailability {
  userId: string;
  /** Weekly availability grid (7 days x 24 hours) */
  weeklyGrid: boolean[][]; // [dayOfWeek][hour] = true if busy
  /** Specific busy slots in the next 2 weeks */
  upcomingBusy: BusySlot[];
  /** When this data was last updated */
  updatedAt: FirebaseFirestore.Timestamp;
  /** When this data expires */
  expiresAt: FirebaseFirestore.Timestamp;
}

/**
 * Sync a user's calendar availability
 * Returns structured result with success status and error context
 */
export async function syncUserAvailability(userId: string): Promise<SyncResult> {
  try {
    // Get calendar connection with retry
    const connectionDoc = await withFirestoreRetry(
      () => dbAdmin.collection('calendar_connections').doc(userId).get(),
      { operationName: 'getCalendarConnection' }
    );

    if (!connectionDoc.exists) {
      logger.debug('No calendar connection found', {
        userId,
        component: 'calendar-sync',
      });
      return { success: false, error: 'no_connection', message: 'No calendar connected' };
    }

    const connectionData = connectionDoc.data();
    if (!connectionData?.isActive || !connectionData.encryptedTokens) {
      return { success: false, error: 'inactive', message: 'Calendar connection is inactive' };
    }

    // Decrypt tokens
    let tokens = decryptTokens(connectionData.encryptedTokens);

    // Check if access token needs refresh
    if (tokens.expiresAt < Date.now()) {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      if (!refreshed) {
        // Mark connection as inactive if refresh fails
        await withFirestoreRetry(
          () => connectionDoc.ref.update({ isActive: false }),
          { operationName: 'markConnectionInactive' }
        );
        logger.warn('Failed to refresh calendar token', {
          userId,
          component: 'calendar-sync',
        });
        return { success: false, error: 'token_refresh_failed', message: 'Could not refresh access token. Please reconnect your calendar.' };
      }

      // Update tokens
      tokens = {
        accessToken: refreshed.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: refreshed.expiresAt,
      };

      // Store updated tokens with retry
      await withFirestoreRetry(
        () => connectionDoc.ref.update({ encryptedTokens: encryptTokens(tokens) }),
        { operationName: 'updateTokens' }
      );
    }

    // Calculate time range
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(
      now.getTime() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // Fetch busy slots from Google Calendar (already has retry)
    const busySlots = await getFreeBusy(tokens.accessToken, timeMin, timeMax);
    if (!busySlots) {
      logger.warn('Failed to fetch free/busy data', {
        userId,
        component: 'calendar-sync',
      });
      return { success: false, error: 'google_api_error', message: 'Could not fetch calendar data from Google' };
    }

    // Generate weekly availability grid
    const weeklyGrid = generateWeeklyGrid(busySlots);

    // Calculate expiration time
    const expiresAt = new Date(
      now.getTime() + AVAILABILITY_TTL_HOURS * 60 * 60 * 1000
    );

    // Store availability in Firestore with retry
    await withFirestoreRetry(
      () => dbAdmin.collection('availability').doc(userId).set({
        userId,
        weeklyGrid,
        upcomingBusy: busySlots,
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt,
      }),
      { operationName: 'storeAvailability' }
    );

    // Update last synced timestamp on connection
    await withFirestoreRetry(
      () => connectionDoc.ref.update({ lastSyncedAt: FieldValue.serverTimestamp() }),
      { operationName: 'updateLastSynced' }
    );

    logger.info('Calendar synced successfully', {
      userId,
      busySlots: busySlots.length,
      component: 'calendar-sync',
    });

    return { success: true };
  } catch (error) {
    logger.error('Calendar sync error', { userId, component: 'calendar-sync' }, error instanceof Error ? error : undefined);
    return { success: false, error: 'firestore_error', message: 'Database error during sync' };
  }
}

/**
 * Generate a weekly availability grid from busy slots
 * Grid is [dayOfWeek][hour] = true if typically busy
 */
function generateWeeklyGrid(busySlots: BusySlot[]): boolean[][] {
  // Initialize grid (7 days x 24 hours)
  const grid: boolean[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => false)
  );

  // Count busy occurrences for each day/hour
  const busyCounts: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );
  const totalCounts: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  // Process each busy slot
  for (const slot of busySlots) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);

    // Mark each hour in the range
    let current = new Date(start);
    current.setMinutes(0, 0, 0);

    while (current < end) {
      const dayOfWeek = current.getDay();
      const hour = current.getHours();

      busyCounts[dayOfWeek][hour]++;
      totalCounts[dayOfWeek][hour]++;

      current = new Date(current.getTime() + 60 * 60 * 1000);
    }
  }

  // Mark hours as busy if they're busy more than 50% of the time
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      if (totalCounts[day][hour] > 0) {
        grid[day][hour] =
          busyCounts[day][hour] / totalCounts[day][hour] >= 0.5;
      }
    }
  }

  return grid;
}

/**
 * Get user's availability data if it exists and is not expired
 */
export async function getUserAvailability(
  userId: string
): Promise<UserAvailability | null> {
  try {
    const doc = await withFirestoreRetry(
      () => dbAdmin.collection('availability').doc(userId).get(),
      { operationName: 'getUserAvailability' }
    );

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Check if expired
    if (data?.expiresAt && data.expiresAt.toDate() < new Date()) {
      return null;
    }

    return data as UserAvailability;
  } catch (error) {
    logger.error('Get availability error', { userId, component: 'calendar-sync' }, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Check if user's availability needs to be synced
 */
export async function needsSync(userId: string): Promise<boolean> {
  const availability = await getUserAvailability(userId);
  return !availability;
}

/**
 * Trigger sync for a user if needed
 */
export async function ensureUserSynced(userId: string): Promise<void> {
  if (await needsSync(userId)) {
    await syncUserAvailability(userId);
  }
}
