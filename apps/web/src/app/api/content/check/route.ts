import { z } from "zod";
import { logger } from "@/lib/structured-logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { mlContentAnalyzer } from "@/lib/ml-content-analyzer";

/**
 * Content Check API
 *
 * Fast pre-submission content validation using ML analysis.
 * Returns whether content is allowed and any warnings/suggestions.
 *
 * POST /api/content/check
 */

const ContentCheckSchema = z.object({
  content: z.string().min(1).max(10000),
  context: z.enum(['chat', 'post', 'profile', 'event', 'space']).optional().default('post'),
  userTrustScore: z.number().min(0).max(1).optional().default(0.5),
  isFirstPost: z.boolean().optional().default(false),
});

type ContentCheckData = z.output<typeof ContentCheckSchema>;

export const POST = withAuthValidationAndErrors(
  ContentCheckSchema as z.ZodType<ContentCheckData>,
  async (
    request,
    _context,
    data: ContentCheckData,
    respond
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    try {
      // Quick check for urgent content (fast path)
      const quickResult = mlContentAnalyzer.quickCheck(data.content);

      if (quickResult.isUrgent) {
        logger.warn('Content check blocked urgent content', {
          userId,
          campusId,
          reason: quickResult.reason,
        });

        return respond.success({
          isAllowed: false,
          blockedReason: getBlockedReasonMessage(quickResult.reason),
          warnings: [],
          confidence: 0.95,
          processingTime: 0,
        });
      }

      // Full ML analysis
      const analysis = await mlContentAnalyzer.analyze(data.content, {
        checkToxicity: true,
        checkSpam: true,
        checkPII: true,
        contextType: data.context,
        userTrustScore: data.userTrustScore,
        isFirstPost: data.isFirstPost,
      });

      // Map ML result to API response
      const isAllowed = analysis.suggestedAction === 'no_action' || analysis.suggestedAction === 'flag';
      const warnings: string[] = [];
      let blockedReason: string | undefined;

      // Convert flags to user-friendly warnings
      if (analysis.flags.includes('spam_detected')) {
        warnings.push('This message may be flagged as spam.');
      }
      if (analysis.toxicityScores.profanity > 0.5) {
        warnings.push('This message contains strong language.');
      }
      if (analysis.toxicityScores.toxicity > 0.4 && analysis.toxicityScores.toxicity < 0.7) {
        warnings.push('This message may be perceived as hostile.');
      }
      if (analysis.metadata.capsPercentage > 0.5) {
        warnings.push('Consider using less caps lock.');
      }
      if (analysis.metadata.repeatPatterns) {
        warnings.push('Please avoid repetitive text.');
      }

      // Set blocked reason if not allowed
      if (!isAllowed) {
        blockedReason = getBlockedReasonFromAnalysis(analysis);
      }

      // Log for moderation review if concerning
      if (analysis.riskScore > 0.5) {
        logger.info('Content check flagged for review', {
          userId,
          campusId,
          riskScore: analysis.riskScore,
          suggestedAction: analysis.suggestedAction,
          isAllowed,
        });
      }

      return respond.success({
        isAllowed,
        blockedReason,
        warnings,
        confidence: analysis.confidence,
        processingTime: analysis.processingTime,
        // Include detailed scores for debugging in development
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            riskScore: analysis.riskScore,
            toxicityScores: analysis.toxicityScores,
            categories: analysis.categories,
            flags: analysis.flags,
          },
        }),
      });
    } catch (error) {
      logger.error('Content check failed', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });

      // Fail open - allow content if check fails
      return respond.success({
        isAllowed: true,
        warnings: ['Content check temporarily unavailable.'],
        confidence: 0,
        processingTime: 0,
      });
    }
  }
);

/**
 * Get user-friendly blocked reason from quick check reason
 */
function getBlockedReasonMessage(reason?: string): string {
  switch (reason) {
    case 'slur_detected':
      return 'This message contains prohibited language that violates our community guidelines.';
    case 'threat_detected':
      return 'This message contains threatening language. Please communicate respectfully.';
    case 'self_harm_content':
      return 'We care about your wellbeing. If you are struggling, please reach out for support.';
    default:
      return 'This message violates our community guidelines.';
  }
}

/**
 * Get user-friendly blocked reason from ML analysis
 */
function getBlockedReasonFromAnalysis(analysis: {
  suggestedAction: string;
  categories: { category: string; matched: boolean }[];
  toxicityScores: { threat: number; identityAttack: number };
}): string {
  // Check for specific categories
  const matchedCategories = analysis.categories.filter(c => c.matched);

  for (const cat of matchedCategories) {
    switch (cat.category) {
      case 'hate_speech':
        return 'This message contains hate speech which is not allowed.';
      case 'violence':
        return 'This message contains violent content which is not allowed.';
      case 'self_harm':
        return 'We care about your wellbeing. Please reach out for support if needed.';
      case 'spam':
        return 'This message appears to be spam.';
      case 'pii_exposure':
        return 'This message may contain personal information. Please avoid sharing sensitive data.';
    }
  }

  // Fallback based on toxicity scores
  if (analysis.toxicityScores.threat > 0.7) {
    return 'This message contains threatening language.';
  }
  if (analysis.toxicityScores.identityAttack > 0.7) {
    return 'This message may be perceived as targeting a group or identity.';
  }

  return 'This message does not meet our community guidelines.';
}
