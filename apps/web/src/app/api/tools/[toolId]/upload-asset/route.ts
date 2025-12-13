/**
 * Tool Asset Upload API
 *
 * Allows tool creators to upload images and assets for their HiveLab tools.
 * - POST: Upload new asset (creator only)
 * - DELETE: Remove asset (creator only)
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
import { mlContentAnalyzer } from '@/lib/ml-content-analyzer';

// Allowed image types for tool assets
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;

  if (!toolId) {
    return respond.error('Tool ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Check tool ownership
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();

  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
  }

  const toolData = toolDoc.data()!;

  // Verify campus isolation
  if (toolData.campusId !== campusId) {
    return respond.error('Access denied', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
  }

  // Verify ownership (only creator can upload assets)
  if (toolData.createdBy !== userId) {
    return respond.error('Only the tool creator can upload assets', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('asset') as File;
    const assetType = formData.get('type') as string || 'image'; // 'image', 'icon', 'thumbnail'

    if (!file) {
      return respond.error('No asset file provided', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return respond.error(
        'Invalid file type. Only JPEG, PNG, WebP, GIF, and SVG are allowed.',
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

    // ML Image Moderation Check (skip for SVG - can't analyze vector graphics)
    const canModerate = mlContentAnalyzer.isImageModerationAvailable() && file.type !== 'image/svg+xml';
    if (canModerate) {
      try {
        const base64Image = fileBuffer.toString('base64');

        const imageAnalysis = await mlContentAnalyzer.analyzeImage(base64Image, {
          contextType: 'tool_asset',
          strictMode: false, // Tool assets can be more permissive
        });

        logger.info('Tool asset moderation result', {
          toolId,
          userId,
          assetType,
          isViolation: imageAnalysis.isViolation,
          suggestedAction: imageAnalysis.suggestedAction,
          confidence: imageAnalysis.confidence,
          processingTime: imageAnalysis.processingTime,
          endpoint: '/api/tools/[toolId]/upload-asset',
        });

        if (imageAnalysis.suggestedAction === 'block') {
          return respond.error(
            'This image cannot be used due to content policy. Please choose a different image.',
            'CONTENT_POLICY_VIOLATION',
            { status: HttpStatus.BAD_REQUEST }
          );
        }

        if (imageAnalysis.suggestedAction === 'flag') {
          // Log for moderator review but allow
          logger.warn('Tool asset flagged for review', {
            toolId,
            userId,
            assetType,
            flags: imageAnalysis.flags,
            scores: imageAnalysis.scores,
            reasoning: imageAnalysis.reasoning,
          });
        }
      } catch (error) {
        // Don't block upload if moderation fails - log and continue
        logger.warn('Image moderation check failed, proceeding with upload', {
          toolId,
          userId,
          error: error instanceof Error ? error.message : String(error),
          endpoint: '/api/tools/[toolId]/upload-asset',
        });
      }
    }

    // Upload to Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileName = `tool-assets/${campusId}/${toolId}/${assetType}-${Date.now()}${getExtension(file.type)}`;

    const fileRef = bucket.file(fileName);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
        metadata: {
          uploadedBy: userId,
          toolId,
          campusId,
          assetType,
        },
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get download URL
    const assetUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update tool document with asset URL based on type
    const toolRef = dbAdmin.collection('tools').doc(toolId);
    const updateData: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (assetType === 'thumbnail') {
      updateData.thumbnailUrl = assetUrl;
    } else if (assetType === 'icon') {
      updateData.iconUrl = assetUrl;
    } else {
      // Add to assets array
      updateData.assets = admin.firestore.FieldValue.arrayUnion({
        url: assetUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
    }

    await toolRef.update(updateData);

    logger.info('Tool asset uploaded', {
      toolId,
      userId,
      assetType,
      fileSize: file.size,
      endpoint: '/api/tools/[toolId]/upload-asset',
    });

    return respond.success({
      assetUrl,
      assetType,
      message: 'Asset uploaded successfully',
    });
  } catch (error) {
    logger.error('Failed to upload tool asset', {
      error: error instanceof Error ? error.message : String(error),
      toolId,
      userId,
      endpoint: '/api/tools/[toolId]/upload-asset',
    });
    return respond.error('Failed to upload asset', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;
  const { searchParams } = new URL(request.url);
  const assetUrl = searchParams.get('url');

  if (!toolId) {
    return respond.error('Tool ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  if (!assetUrl) {
    return respond.error('Asset URL is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Check tool ownership
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();

  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
  }

  const toolData = toolDoc.data()!;

  // Verify campus isolation
  if (toolData.campusId !== campusId) {
    return respond.error('Access denied', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
  }

  // Verify ownership
  if (toolData.createdBy !== userId) {
    return respond.error('Only the tool creator can delete assets', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
  }

  try {
    // Remove from Firestore (we don't delete from Storage to preserve links)
    const toolRef = dbAdmin.collection('tools').doc(toolId);
    const updateData: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Check which field to clear
    if (toolData.thumbnailUrl === assetUrl) {
      updateData.thumbnailUrl = admin.firestore.FieldValue.delete();
    } else if (toolData.iconUrl === assetUrl) {
      updateData.iconUrl = admin.firestore.FieldValue.delete();
    } else if (toolData.assets) {
      // Remove from assets array
      const assets = toolData.assets.filter((a: { url: string }) => a.url !== assetUrl);
      updateData.assets = assets;
    }

    await toolRef.update(updateData);

    logger.info('Tool asset removed', {
      toolId,
      userId,
      assetUrl,
      endpoint: '/api/tools/[toolId]/upload-asset',
    });

    return respond.success({
      message: 'Asset removed successfully',
    });
  } catch (error) {
    logger.error('Failed to remove tool asset', {
      error: error instanceof Error ? error.message : String(error),
      toolId,
      userId,
      endpoint: '/api/tools/[toolId]/upload-asset',
    });
    return respond.error('Failed to remove asset', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
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
    case 'image/gif':
      return '.gif';
    case 'image/svg+xml':
      return '.svg';
    default:
      return '';
  }
}
