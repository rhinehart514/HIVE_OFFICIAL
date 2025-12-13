/**
 * FCM Token Management API
 *
 * POST /api/profile/fcm-token - Save FCM token to user profile
 * DELETE /api/profile/fcm-token - Remove FCM token from user profile
 */

import type { NextRequest as _NextRequest } from 'next/server';
import { withAuthValidationAndErrors } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

const FCMTokenSchema = z.object({
  token: z.string().min(100, 'Invalid FCM token'),
});

/**
 * POST - Save FCM token to user profile
 */
export const POST = withAuthValidationAndErrors(
  FCMTokenSchema,
  async (request, context, body, respond) => {
    const { token } = body;
    const userId = (context as { auth: { userId: string } }).auth?.userId;

    if (!userId) {
      return respond.error('Authentication required', 'UNAUTHORIZED', { status: 401 });
    }

    try {
      // Generate a unique token ID based on device/browser fingerprint
      // Using hash of token for simplicity
      const tokenId = `web_${hashString(token).slice(0, 16)}`;

      // Save token to user's fcmTokens map
      await dbAdmin.collection('users').doc(userId).update({
        [`fcmTokens.${tokenId}`]: token,
        fcmTokensUpdatedAt: FieldValue.serverTimestamp(),
      });

      return respond.success({ tokenId });
    } catch (error) {
      console.error('[FCM Token] Failed to save token:', error);
      return respond.error('Failed to save push token', 'INTERNAL_ERROR', { status: 500 });
    }
  }
);

/**
 * DELETE - Remove FCM token from user profile
 */
export const DELETE = withAuthValidationAndErrors(
  FCMTokenSchema,
  async (request, context, body, respond) => {
    const { token } = body;
    const userId = (context as { auth: { userId: string } }).auth?.userId;

    if (!userId) {
      return respond.error('Authentication required', 'UNAUTHORIZED', { status: 401 });
    }

    try {
      // Get current tokens to find the one to remove
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (userData?.fcmTokens) {
        // Find token ID by value
        const tokenEntry = Object.entries(userData.fcmTokens).find(
          ([, value]) => value === token
        );

        if (tokenEntry) {
          const [tokenId] = tokenEntry;
          await dbAdmin.collection('users').doc(userId).update({
            [`fcmTokens.${tokenId}`]: FieldValue.delete(),
            fcmTokensUpdatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      return respond.success({ removed: true });
    } catch (error) {
      console.error('[FCM Token] Failed to remove token:', error);
      return respond.error('Failed to remove push token', 'INTERNAL_ERROR', { status: 500 });
    }
  }
);

/**
 * Simple hash function for creating token IDs
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
