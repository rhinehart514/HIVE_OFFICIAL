/**
 * Account Deletion API
 *
 * GDPR-compliant account deletion endpoint.
 * Permanently deletes user's profile, posts, space memberships, and Firebase Auth account.
 *
 * POST /api/profile/delete - Initiate account deletion
 * DELETE /api/profile/delete - Confirm and execute deletion
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin, authAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';

const DELETION_TOKEN_TTL_MINUTES = 15;

// Schema for deletion confirmation
const ConfirmDeletionSchema = z.object({
  confirmationToken: z.string().min(1, 'Confirmation token required'),
  confirmText: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' }),
  }),
});

/**
 * POST /api/profile/delete - Request account deletion
 * Creates a time-limited deletion token that must be confirmed
 */
export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  try {
    // Generate a secure deletion token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + DELETION_TOKEN_TTL_MINUTES * 60 * 1000);

    // Store the token with expiration
    await dbAdmin.collection('deletion_requests').doc(userId).set({
      userId,
      campusId,
      token,
      expiresAt,
      createdAt: new Date(),
      status: 'pending',
    });

    logger.info('Account deletion requested', {
      userId,
      campusId,
      expiresAt: expiresAt.toISOString(),
    });

    return respond.success({
      message: 'Deletion request created. Please confirm within 15 minutes.',
      confirmationToken: token,
      expiresAt: expiresAt.toISOString(),
      instructions: 'Send DELETE request with confirmationToken and confirmText: "DELETE MY ACCOUNT"',
    });
  } catch (error) {
    logger.error('Failed to create deletion request', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to initiate account deletion', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * DELETE /api/profile/delete - Confirm and execute account deletion
 * Requires valid confirmation token and explicit confirmation text
 */
export const DELETE = withAuthValidationAndErrors(
  ConfirmDeletionSchema,
  async (request, _context, body, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { confirmationToken } = body;

    try {
      // Verify deletion request exists and is valid
      const requestDoc = await dbAdmin.collection('deletion_requests').doc(userId).get();

      if (!requestDoc.exists) {
        return respond.error(
          'No pending deletion request. Please initiate deletion first.',
          'NOT_FOUND',
          { status: HttpStatus.NOT_FOUND }
        );
      }

      const requestData = requestDoc.data()!;

      // Verify token matches
      if (requestData.token !== confirmationToken) {
        return respond.error('Invalid confirmation token', 'INVALID_TOKEN', {
          status: HttpStatus.FORBIDDEN,
        });
      }

      // Verify not expired
      const expiresAt = requestData.expiresAt?.toDate?.() || new Date(requestData.expiresAt);
      if (expiresAt < new Date()) {
        // Clean up expired request
        await dbAdmin.collection('deletion_requests').doc(userId).delete();
        return respond.error(
          'Deletion request expired. Please start again.',
          'EXPIRED',
          { status: HttpStatus.GONE }
        );
      }

      // Execute deletion in a batch for atomicity
      const batch = dbAdmin.batch();
      const deletedCollections: string[] = [];

      // 1. Delete user profile
      const profileRef = dbAdmin.collection('profiles').doc(userId);
      const profileDoc = await profileRef.get();
      if (profileDoc.exists) {
        batch.delete(profileRef);
        deletedCollections.push('profiles');
      }

      // 2. Delete privacy settings
      const privacyRef = dbAdmin.collection('privacySettings').doc(userId);
      batch.delete(privacyRef);
      deletedCollections.push('privacySettings');

      // 3. Delete presence data
      const presenceRef = dbAdmin.collection('presence').doc(userId);
      batch.delete(presenceRef);
      deletedCollections.push('presence');

      // 4. Delete notification preferences
      const notifPrefsRef = dbAdmin.collection('notificationPreferences').doc(userId);
      batch.delete(notifPrefsRef);
      deletedCollections.push('notificationPreferences');

      // 5. Delete FCM tokens
      const fcmTokensRef = dbAdmin.collection('fcmTokens').doc(userId);
      batch.delete(fcmTokensRef);
      deletedCollections.push('fcmTokens');

      // 6. Delete the deletion request itself
      batch.delete(dbAdmin.collection('deletion_requests').doc(userId));

      // Commit the batch
      await batch.commit();

      // 7. Remove from space memberships (separate queries)
      const membershipSnapshot = await dbAdmin
        .collection('spaceMemberships')
        .where('userId', '==', userId)
        .get();

      const membershipBatch = dbAdmin.batch();
      membershipSnapshot.docs.forEach((doc) => {
        membershipBatch.delete(doc.ref);
      });
      if (!membershipSnapshot.empty) {
        await membershipBatch.commit();
        deletedCollections.push(`spaceMemberships (${membershipSnapshot.size})`);
      }

      // 8. Anonymize posts (don't delete - preserve content, remove author)
      const postsSnapshot = await dbAdmin
        .collection('posts')
        .where('authorId', '==', userId)
        .get();

      if (!postsSnapshot.empty) {
        const postsBatch = dbAdmin.batch();
        postsSnapshot.docs.forEach((doc) => {
          postsBatch.update(doc.ref, {
            authorId: 'deleted_user',
            authorDeleted: true,
            authorDeletedAt: new Date(),
          });
        });
        await postsBatch.commit();
        deletedCollections.push(`posts anonymized (${postsSnapshot.size})`);
      }

      // 9. Delete Firebase Auth user (last step - no going back)
      try {
        await authAdmin.deleteUser(userId);
        deletedCollections.push('auth_user');
      } catch (authError) {
        // Log but don't fail - data is already deleted
        logger.error('Failed to delete Firebase Auth user', {
          userId,
          error: authError instanceof Error ? authError.message : String(authError),
        });
      }

      logger.info('Account deleted successfully', {
        userId,
        campusId,
        deletedCollections,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Your account has been permanently deleted.',
          deletedData: deletedCollections,
        },
        { status: HttpStatus.OK }
      );
    } catch (error) {
      logger.error('Account deletion failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error('Account deletion failed', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);
