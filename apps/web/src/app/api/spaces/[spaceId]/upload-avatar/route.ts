/**
 * Space Avatar Upload API
 *
 * Allows space leaders to upload an avatar/icon for their space.
 * - POST: Upload new avatar (leaders only)
 * - DELETE: Remove avatar (leaders only)
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { checkSpacePermission } from '@/lib/space-permission-middleware';
import { mlContentAnalyzer } from '@/lib/ml-content-analyzer';

// Allowed image types for avatars
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for avatars (smaller than banners)

export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Check leader permission
  const permCheck = await checkSpacePermission(spaceId, userId, 'admin');
  if (!permCheck.hasPermission) {
    const code = permCheck.code === 'NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return respond.error('No avatar file provided', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return respond.error(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        'INVALID_INPUT',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return respond.error(
        'File too large. Maximum size is 5MB.',
        'INVALID_INPUT',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Read file buffer once (used for both moderation and upload)
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // ML Image Moderation Check
    if (mlContentAnalyzer.isImageModerationAvailable()) {
      try {
        const base64Image = fileBuffer.toString('base64');

        const imageAnalysis = await mlContentAnalyzer.analyzeImage(base64Image, {
          contextType: 'profile_photo', // Space avatars treated as profile-like images
          strictMode: true, // Space avatars are public-facing
        });

        logger.info('Space avatar moderation result', {
          spaceId,
          userId,
          isViolation: imageAnalysis.isViolation,
          suggestedAction: imageAnalysis.suggestedAction,
          confidence: imageAnalysis.confidence,
          processingTime: imageAnalysis.processingTime,
          endpoint: '/api/spaces/[spaceId]/upload-avatar',
        });

        if (imageAnalysis.suggestedAction === 'block') {
          return respond.error(
            'This image cannot be used as a space avatar due to content policy. Please choose a different image.',
            'CONTENT_POLICY_VIOLATION',
            { status: HttpStatus.BAD_REQUEST }
          );
        }

        if (imageAnalysis.suggestedAction === 'flag') {
          // Log for moderator review but allow with warning
          logger.warn('Space avatar flagged for review', {
            spaceId,
            userId,
            flags: imageAnalysis.flags,
            scores: imageAnalysis.scores,
            reasoning: imageAnalysis.reasoning,
          });
        }
      } catch (error) {
        // Don't block upload if moderation fails - log and continue
        logger.warn('Image moderation check failed, proceeding with upload', {
          spaceId,
          userId,
          error: error instanceof Error ? error.message : String(error),
          endpoint: '/api/spaces/[spaceId]/upload-avatar',
        });
      }
    }

    // Upload to Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileName = `space-avatars/${campusId}/${spaceId}/${Date.now()}-avatar${getExtension(file.type)}`;

    const fileRef = bucket.file(fileName);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
        metadata: {
          uploadedBy: userId,
          spaceId,
          campusId,
        },
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get download URL
    const iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update space document with new avatar URL
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    await spaceRef.update({
      iconUrl,
      avatarUrl: iconUrl, // Also set avatarUrl for compatibility
      avatarUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      avatarUpdatedBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log activity
    await dbAdmin.collection('spaces').doc(spaceId).collection('activity').add({
      type: 'avatar_updated',
      performedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        iconUrl,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    logger.info('Space avatar uploaded', {
      spaceId,
      userId,
      fileSize: file.size,
      endpoint: '/api/spaces/[spaceId]/upload-avatar',
    });

    return respond.success({
      iconUrl,
      avatarUrl: iconUrl,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    logger.error('Failed to upload space avatar', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/upload-avatar',
    });
    return respond.error('Failed to upload avatar', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Check leader permission
  const permCheck = await checkSpacePermission(spaceId, userId, 'admin');
  if (!permCheck.hasPermission) {
    const code = permCheck.code === 'NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    // Update space document to remove avatar
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    await spaceRef.update({
      iconUrl: admin.firestore.FieldValue.delete(),
      avatarUrl: admin.firestore.FieldValue.delete(),
      avatarUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      avatarUpdatedBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log activity
    await dbAdmin.collection('spaces').doc(spaceId).collection('activity').add({
      type: 'avatar_removed',
      performedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Space avatar removed', {
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/upload-avatar',
    });

    return respond.success({
      message: 'Avatar removed successfully',
    });
  } catch (error) {
    logger.error('Failed to remove space avatar', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/upload-avatar',
    });
    return respond.error('Failed to remove avatar', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}
