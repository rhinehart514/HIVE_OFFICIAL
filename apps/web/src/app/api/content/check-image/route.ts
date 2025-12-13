/**
 * Image Content Check API
 *
 * Pre-check images for content policy violations before upload.
 * This allows clients to show immediate feedback to users before
 * they commit to uploading an image.
 *
 * POST /api/content/check-image
 * Body: { imageBase64: string, contextType?: string }
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { mlContentAnalyzer, type ImageAnalysisOptions } from '@/lib/ml-content-analyzer';

const CheckImageSchema = z.object({
  imageBase64: z.string().min(100, 'Image data too short'),
  contextType: z.enum(['profile_photo', 'space_banner', 'tool_asset', 'chat_image', 'event_image']).optional(),
});

export const POST = withAuthAndErrors(async (
  request,
  _context,
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);

  // Check if image moderation is available
  if (!mlContentAnalyzer.isImageModerationAvailable()) {
    return respond.success({
      available: false,
      message: 'Image moderation is not configured. Images will be allowed by default.',
      result: null,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond.error('Invalid JSON body', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  const parsed = CheckImageSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error(
      `Validation error: ${parsed.error.errors.map(e => e.message).join(', ')}`,
      'VALIDATION_ERROR',
      { status: HttpStatus.BAD_REQUEST }
    );
  }

  const { imageBase64, contextType = 'chat_image' } = parsed.data;

  // Validate base64 format (should be raw base64 or data URL)
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  // Basic size check (base64 is ~33% larger than binary, limit to ~15MB base64 = ~10MB image)
  const MAX_BASE64_SIZE = 15 * 1024 * 1024;
  if (base64Data.length > MAX_BASE64_SIZE) {
    return respond.error(
      'Image too large for content check. Maximum size is approximately 10MB.',
      'INVALID_INPUT',
      { status: HttpStatus.BAD_REQUEST }
    );
  }

  try {
    const options: ImageAnalysisOptions = {
      contextType,
      strictMode: contextType === 'profile_photo' || contextType === 'space_banner',
    };

    const result = await mlContentAnalyzer.analyzeImage(base64Data, options);

    logger.info('Image content check completed', {
      userId,
      contextType,
      isViolation: result.isViolation,
      suggestedAction: result.suggestedAction,
      confidence: result.confidence,
      processingTime: result.processingTime,
      endpoint: '/api/content/check-image',
    });

    // Return user-friendly response
    return respond.success({
      available: true,
      result: {
        allowed: result.suggestedAction === 'allow',
        action: result.suggestedAction,
        confidence: result.confidence,
        flags: result.flags,
        reasoning: result.reasoning,
        scores: {
          adult: result.scores.adult,
          violence: result.scores.violence,
          racy: result.scores.racy,
        },
      },
      processingTimeMs: result.processingTime,
    });
  } catch (error) {
    logger.error('Image content check failed', {
      userId,
      contextType,
      error: error instanceof Error ? error.message : String(error),
      endpoint: '/api/content/check-image',
    });

    // Return graceful failure - don't block upload
    return respond.success({
      available: false,
      message: 'Image check temporarily unavailable. Proceed with upload.',
      result: null,
    });
  }
});
