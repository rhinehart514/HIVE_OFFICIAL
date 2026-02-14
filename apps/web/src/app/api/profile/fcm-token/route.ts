/**
 * FCM Token Management API
 *
 * POST /api/profile/fcm-token - Save FCM token to user profile
 * DELETE /api/profile/fcm-token - Remove FCM token from user profile
 *
 * Tokens are stored as an array on the users document: users/{userId}.fcmTokens
 */

import { withAuthValidationAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

const FCMTokenSchema = z.object({
  token: z.string().min(10, 'Invalid FCM token'),
});

/**
 * POST - Save FCM token to user profile
 */
export const POST = withAuthValidationAndErrors(
  FCMTokenSchema,
  async (request, _context, body, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const { token } = body;

    try {
      const userRef = dbAdmin.collection('users').doc(userId);

      // Add token to array (arrayUnion avoids duplicates)
      await userRef.update({
        fcmTokens: FieldValue.arrayUnion(token),
        fcmTokensUpdatedAt: FieldValue.serverTimestamp(),
      });

      return respond.success({ registered: true });
    } catch (error) {
      // If document doesn't exist, create with merge
      if ((error as { code?: number }).code === 5) {
        await dbAdmin.collection('users').doc(userId).set(
          {
            fcmTokens: [token],
            fcmTokensUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return respond.success({ registered: true });
      }

      return respond.error('Failed to save push token', 'INTERNAL_ERROR', { status: 500 });
    }
  }
);

/**
 * DELETE - Remove FCM token from user profile
 */
export const DELETE = withAuthValidationAndErrors(
  FCMTokenSchema,
  async (request, _context, body, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const { token } = body;

    try {
      const userRef = dbAdmin.collection('users').doc(userId);

      await userRef.update({
        fcmTokens: FieldValue.arrayRemove(token),
        fcmTokensUpdatedAt: FieldValue.serverTimestamp(),
      });

      return respond.success({ removed: true });
    } catch {
      return respond.error('Failed to remove push token', 'INTERNAL_ERROR', { status: 500 });
    }
  }
);
