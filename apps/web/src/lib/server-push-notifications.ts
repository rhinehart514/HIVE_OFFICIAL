/**
 * Server-Side Push Notification Service
 *
 * Uses firebase-admin messaging to send push notifications server-side.
 * Handles token validation, batch sending, and stale token cleanup.
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

export interface PushPayload {
  title: string;
  body?: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface SendResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

/**
 * Send a push notification to a single FCM token
 */
export async function sendPushToToken(
  token: string,
  payload: PushPayload
): Promise<{ success: boolean; invalidToken: boolean }> {
  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body || undefined,
        imageUrl: payload.imageUrl || undefined,
      },
      data: payload.data || undefined,
      webpush: {
        fcmOptions: {
          link: payload.data?.actionUrl || '/',
        },
      },
    };

    await admin.messaging().send(message);
    return { success: true, invalidToken: false };
  } catch (error) {
    const code = (error as { code?: string }).code;
    const isInvalidToken =
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered';

    if (isInvalidToken) {
      logger.info('FCM token is invalid/expired', { tokenPrefix: token.slice(0, 10) });
    } else {
      logger.error('FCM send failed', {
        error: error instanceof Error ? error.message : String(error),
        code,
      });
    }

    return { success: false, invalidToken: isInvalidToken };
  }
}

/**
 * Send a push notification to multiple FCM tokens
 */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload
): Promise<SendResult> {
  if (tokens.length === 0) {
    return { success: false, successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body || undefined,
        imageUrl: payload.imageUrl || undefined,
      },
      data: payload.data || undefined,
      webpush: {
        fcmOptions: {
          link: payload.data?.actionUrl || '/',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    logger.error('FCM multicast send failed', {
      error: error instanceof Error ? error.message : String(error),
      tokenCount: tokens.length,
    });
    return { success: false, successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }
}

/**
 * Send push notification to a user by looking up their FCM tokens
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<SendResult> {
  const tokens = await getUserFCMTokens(userId);
  if (tokens.length === 0) {
    logger.debug('No FCM tokens for user', { userId });
    return { success: false, successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const result = await sendPushToTokens(tokens, payload);

  // Clean up invalid tokens
  if (result.invalidTokens.length > 0) {
    await removeInvalidTokens(userId, result.invalidTokens);
  }

  return result;
}

/**
 * Send push notifications to multiple users (batch)
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ totalSuccess: number; totalFailure: number }> {
  let totalSuccess = 0;
  let totalFailure = 0;

  // Process in batches of 10 users
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((uid) => sendPushToUser(uid, payload))
    );
    for (const r of results) {
      totalSuccess += r.successCount;
      totalFailure += r.failureCount;
    }
  }

  return { totalSuccess, totalFailure };
}

/**
 * Get FCM tokens for a user from Firestore
 * Tokens are stored as an array on the users document
 */
async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    if (!userDoc.exists) return [];

    const data = userDoc.data();
    const tokens = data?.fcmTokens;

    // Support both array and map formats for backward compatibility
    if (Array.isArray(tokens)) {
      return tokens;
    }
    if (tokens && typeof tokens === 'object') {
      return Object.values(tokens) as string[];
    }

    return [];
  } catch (error) {
    logger.error('Failed to get FCM tokens', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return [];
  }
}

/**
 * Remove invalid/expired FCM tokens from a user's document
 */
async function removeInvalidTokens(
  userId: string,
  invalidTokens: string[]
): Promise<void> {
  try {
    const userRef = dbAdmin.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return;

    const data = userDoc.data();
    const tokens = data?.fcmTokens;

    if (Array.isArray(tokens)) {
      const { FieldValue } = await import('firebase-admin/firestore');
      for (const token of invalidTokens) {
        await userRef.update({ fcmTokens: FieldValue.arrayRemove(token) });
      }
    } else if (tokens && typeof tokens === 'object') {
      const updates: Record<string, admin.firestore.FieldValue> = {};
      const { FieldValue } = await import('firebase-admin/firestore');
      for (const [key, value] of Object.entries(tokens)) {
        if (invalidTokens.includes(value as string)) {
          updates[`fcmTokens.${key}`] = FieldValue.delete();
        }
      }
      if (Object.keys(updates).length > 0) {
        await userRef.update(updates);
      }
    }

    logger.info('Removed invalid FCM tokens', {
      userId,
      count: invalidTokens.length,
    });
  } catch (error) {
    logger.warn('Failed to remove invalid FCM tokens', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
  }
}
