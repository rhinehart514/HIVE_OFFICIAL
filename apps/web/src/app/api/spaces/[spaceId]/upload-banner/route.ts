/**
 * Space Banner Upload API
 *
 * Allows space leaders to upload a banner image for their space.
 * - POST: Upload new banner (leaders only)
 * - DELETE: Remove banner (leaders only)
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { checkSpacePermission } from '@/lib/space-permission-middleware';
import { mlContentAnalyzer } from '@/lib/ml-content-analyzer';

// Allowed image types for banners
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for banners (larger than profile photos)

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
    const file = formData.get('banner') as File;

    if (!file) {
      return respond.error('No banner file provided', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
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
        'File too large. Maximum size is 10MB.',
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
          contextType: 'space_banner',
          strictMode: true, // Space banners are public-facing
        });

        logger.info('Space banner moderation result', {
          spaceId,
          userId,
          isViolation: imageAnalysis.isViolation,
          suggestedAction: imageAnalysis.suggestedAction,
          confidence: imageAnalysis.confidence,
          processingTime: imageAnalysis.processingTime,
          endpoint: '/api/spaces/[spaceId]/upload-banner',
        });

        if (imageAnalysis.suggestedAction === 'block') {
          return respond.error(
            'This image cannot be used as a space banner due to content policy. Please choose a different image.',
            'CONTENT_POLICY_VIOLATION',
            { status: HttpStatus.BAD_REQUEST }
          );
        }

        if (imageAnalysis.suggestedAction === 'flag') {
          // Log for moderator review but allow with warning
          logger.warn('Space banner flagged for review', {
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
          endpoint: '/api/spaces/[spaceId]/upload-banner',
        });
      }
    }

    // Upload to Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileName = `space-banners/${campusId}/${spaceId}/${Date.now()}-banner${getExtension(file.type)}`;

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
    const bannerUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update space document with new banner URL
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    await spaceRef.update({
      bannerUrl,
      bannerUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      bannerUpdatedBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log activity
    await dbAdmin.collection('spaces').doc(spaceId).collection('activity').add({
      type: 'banner_updated',
      performedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        bannerUrl,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    logger.info('Space banner uploaded', {
      spaceId,
      userId,
      fileSize: file.size,
      endpoint: '/api/spaces/[spaceId]/upload-banner',
    });

    return respond.success({
      bannerUrl,
      message: 'Banner uploaded successfully',
    });
  } catch (error) {
    logger.error('Failed to upload space banner', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/upload-banner',
    });
    return respond.error('Failed to upload banner', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
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
    // Update space document to remove banner
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    await spaceRef.update({
      bannerUrl: admin.firestore.FieldValue.delete(),
      bannerUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      bannerUpdatedBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log activity
    await dbAdmin.collection('spaces').doc(spaceId).collection('activity').add({
      type: 'banner_removed',
      performedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Space banner removed', {
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/upload-banner',
    });

    return respond.success({
      message: 'Banner removed successfully',
    });
  } catch (error) {
    logger.error('Failed to remove space banner', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/upload-banner',
    });
    return respond.error('Failed to remove banner', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
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
