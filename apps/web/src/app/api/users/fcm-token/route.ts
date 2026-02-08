/**
 * FCM Token Registration Endpoint
 *
 * POST /api/users/fcm-token - Register or update FCM token for push notifications
 * DELETE /api/users/fcm-token - Remove FCM token (on logout or permission revoke)
 */

import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

const registerTokenSchema = z.object({
  token: z.string().min(10).max(500),
});

const deleteTokenSchema = z.object({
  token: z.string().min(10).max(500),
});

/**
 * POST /api/users/fcm-token
 * Register FCM token for the authenticated user
 */
export const POST = withAuthValidationAndErrors(
  registerTokenSchema,
  async (request, _context, body, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const { token } = body;

    try {
      const userRef = dbAdmin.collection('profiles').doc(userId);

      // Add token to array (using arrayUnion to avoid duplicates)
      await userRef.update({
        fcmTokens: FieldValue.arrayUnion(token),
        fcmTokenUpdatedAt: FieldValue.serverTimestamp(),
      });

      return respond.success({ registered: true });
    } catch (error) {
      // If document doesn't exist, create it with the token
      if ((error as { code?: number }).code === 5) {
        // NOT_FOUND
        await dbAdmin.collection('profiles').doc(userId).set(
          {
            fcmTokens: [token],
            fcmTokenUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return respond.success({ registered: true });
      }

      return respond.error('Failed to register FCM token', 'INTERNAL_ERROR', {
        status: 500,
      });
    }
  }
);

/**
 * DELETE /api/users/fcm-token
 * Remove FCM token for the authenticated user
 */
export const DELETE = withAuthValidationAndErrors(
  deleteTokenSchema,
  async (request, _context, body, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const { token } = body;

    try {
      const userRef = dbAdmin.collection('profiles').doc(userId);

      // Remove token from array
      await userRef.update({
        fcmTokens: FieldValue.arrayRemove(token),
        fcmTokenUpdatedAt: FieldValue.serverTimestamp(),
      });

      return respond.success({ removed: true });
    } catch {
      return respond.error('Failed to remove FCM token', 'INTERNAL_ERROR', {
        status: 500,
      });
    }
  }
);
