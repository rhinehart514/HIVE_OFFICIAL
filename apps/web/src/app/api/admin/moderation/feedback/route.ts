/**
 * Admin Moderation Feedback API
 *
 * Endpoints for the ML feedback loop:
 * - POST: Record moderator feedback on ML decision
 * - GET: Get ML accuracy statistics
 *
 * Admin-only endpoints for improving ML moderation accuracy.
 */

import { z } from "zod";
import {
  withAdminAuthAndErrors,
  getUserId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { contentModerationService, type ContentType } from "@/lib/content-moderation-service";
import { logger } from "@/lib/structured-logger";
import { withCache } from '../../../../../lib/cache-headers';

/**
 * POST /api/admin/moderation/feedback - Record moderator feedback
 */
const RecordFeedbackSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(['post', 'comment', 'message', 'tool', 'space', 'profile', 'event']),
  mlPrediction: z.object({
    scores: z.record(z.number()),
    action: z.enum(['allow', 'flag', 'block']),
    confidence: z.number().min(0).max(1),
  }),
  humanDecision: z.object({
    action: z.enum(['allow', 'flag', 'block']),
    reason: z.string().optional(),
  }),
});

export const POST = withAdminAuthAndErrors(async (
  request,
  _context,
  respond
) => {
  const adminId = getUserId(request as AuthenticatedRequest);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond.error("Invalid JSON body", "INVALID_INPUT", { status: 400 });
  }

  const parsed = RecordFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error(
      `Validation error: ${parsed.error.errors.map(e => e.message).join(', ')}`,
      "VALIDATION_ERROR",
      { status: 400 }
    );
  }

  const { contentId, contentType, mlPrediction, humanDecision } = parsed.data;

  logger.info('Recording moderation feedback', {
    adminId,
    contentId,
    contentType,
    mlAction: mlPrediction.action,
    humanAction: humanDecision.action,
  });

  const result = await contentModerationService.recordModerationFeedback({
    contentId,
    contentType: contentType as ContentType,
    mlPrediction,
    humanDecision: {
      ...humanDecision,
      moderatorId: adminId,
    },
  });

  return respond.success({
    feedbackId: result.id,
    wasCorrect: result.wasCorrect,
    message: result.wasCorrect
      ? 'ML prediction was correct'
      : 'Feedback recorded - ML will learn from this',
  });
});

/**
 * GET /api/admin/moderation/feedback - Get ML accuracy statistics
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - contentType: Filter by content type (optional)
 * - includeErrors: Include high-confidence errors list (default: false)
 */
const _GET = withAdminAuthAndErrors(async (
  request,
  _context,
  respond
) => {
  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const contentType = searchParams.get('contentType');
  const includeErrors = searchParams.get('includeErrors') === 'true';

  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  logger.info('Fetching moderation accuracy stats', {
    startDate: startDateStr,
    endDate: endDateStr,
    contentType,
    includeErrors,
  });

  const stats = await contentModerationService.getModerationAccuracyStats({
    startDate,
    endDate,
    contentType: contentType as ContentType | undefined,
  });

  let highConfidenceErrors: Awaited<ReturnType<typeof contentModerationService.getHighConfidenceErrors>> | undefined;
  if (includeErrors) {
    highConfidenceErrors = await contentModerationService.getHighConfidenceErrors(20);
  }

  return respond.success({
    stats,
    ...(highConfidenceErrors && { highConfidenceErrors }),
    generatedAt: new Date().toISOString(),
  });
});

export const GET = withCache(_GET, 'PRIVATE');
