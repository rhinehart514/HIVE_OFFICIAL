/**
 * FCM Token Registration API
 *
 * POST /api/notifications/register-token — Register a browser push token
 * DELETE /api/notifications/register-token — Remove a token (logout/revoke)
 */

import { z } from 'zod';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

const TokenSchema = z.object({
  token: z.string().min(10).max(500),
});

// POST — Register FCM token
export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const body = await request.json();

  const parsed = TokenSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error('Invalid token', 'INVALID_INPUT', { status: 400 });
  }

  const { token } = parsed.data;

  // Add token to user's fcmTokens array (dedup via arrayUnion)
  await dbAdmin.collection('users').doc(userId).update({
    fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
    pushNotificationsEnabled: true,
    lastTokenRegisteredAt: new Date().toISOString(),
  });

  return respond.success({ registered: true });
});

// DELETE — Remove FCM token
export const DELETE = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const body = await request.json();

  const parsed = TokenSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error('Invalid token', 'INVALID_INPUT', { status: 400 });
  }

  const { token } = parsed.data;

  await dbAdmin.collection('users').doc(userId).update({
    fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
  });

  return respond.success({ removed: true });
});
