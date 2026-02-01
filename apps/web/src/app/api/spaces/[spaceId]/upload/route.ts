/**
 * Space Chat File Upload API
 *
 * POST: Upload file attachment for chat messages
 * - Members can upload images to include in chat messages
 * - 10MB limit, image/* only
 * - Returns URL, filename, size, mimeType
 */

import { getStorage } from 'firebase-admin/storage';
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

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per CLAUDE.md spec

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

  // Check member permission (members can upload attachments)
  const permCheck = await checkSpacePermission(spaceId, userId, 'member');
  if (!permCheck.hasPermission) {
    // Check if it's a public space (guests can't upload)
    if (permCheck.code === 'NOT_MEMBER') {
      return respond.error('Join this space to share files', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
    }
    const code = permCheck.code === 'NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return respond.error('No file provided', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return respond.error(
        'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.',
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

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // ML Image Moderation Check
    if (mlContentAnalyzer.isImageModerationAvailable()) {
      try {
        const base64Image = fileBuffer.toString('base64');

        const imageAnalysis = await mlContentAnalyzer.analyzeImage(base64Image, {
          contextType: 'chat_image',
          strictMode: false, // Chat attachments are semi-private
        });

        logger.info('Chat attachment moderation result', {
          spaceId,
          userId,
          isViolation: imageAnalysis.isViolation,
          suggestedAction: imageAnalysis.suggestedAction,
          confidence: imageAnalysis.confidence,
          processingTime: imageAnalysis.processingTime,
          endpoint: '/api/spaces/[spaceId]/upload',
        });

        if (imageAnalysis.suggestedAction === 'block') {
          return respond.error(
            'This image cannot be shared due to content policy. Please choose a different image.',
            'CONTENT_POLICY_VIOLATION',
            { status: HttpStatus.BAD_REQUEST }
          );
        }

        if (imageAnalysis.suggestedAction === 'flag') {
          logger.warn('Chat attachment flagged for review', {
            spaceId,
            userId,
            flags: imageAnalysis.flags,
            scores: imageAnalysis.scores,
            reasoning: imageAnalysis.reasoning,
          });
        }
      } catch (error) {
        logger.warn('Image moderation check failed, proceeding with upload', {
          spaceId,
          userId,
          error: error instanceof Error ? error.message : String(error),
          endpoint: '/api/spaces/[spaceId]/upload',
        });
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `chat-attachments/${campusId}/${spaceId}/${userId}/${timestamp}-${sanitizedFilename}`;

    // Upload to Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);

    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
        metadata: {
          uploadedBy: userId,
          spaceId,
          campusId,
          originalFilename: file.name,
        },
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get download URL
    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Track upload in space analytics (non-blocking)
    dbAdmin.collection('spaces').doc(spaceId).collection('analytics').add({
      type: 'file_upload',
      userId,
      timestamp: new Date().toISOString(),
      fileSize: file.size,
      fileType: file.type,
    }).catch(() => {
      // Silent fail - analytics are non-critical
    });

    logger.info('Chat attachment uploaded', {
      spaceId,
      userId,
      fileSize: file.size,
      fileType: file.type,
      endpoint: '/api/spaces/[spaceId]/upload',
    });

    return respond.success({
      url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    logger.error('Failed to upload chat attachment', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/upload',
    });
    return respond.error('Failed to upload file', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});
