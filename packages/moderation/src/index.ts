/**
 * @hive/moderation
 *
 * HIVE Content Moderation Package
 *
 * This package provides shared types and utilities for content moderation
 * across the HIVE platform. It includes:
 *
 * - Type definitions for text and image analysis results
 * - Moderation decision types
 * - Configuration types and thresholds
 *
 * Services (MLContentAnalyzer, ContentModerationService) are implemented
 * in apps/web/src/lib/ and can be imported directly in server components.
 *
 * @example
 * ```typescript
 * import type {
 *   ContentAnalysisResult,
 *   ImageAnalysisResult,
 *   ModerationDecision,
 * } from '@hive/moderation';
 * ```
 */

// Export all types
export * from './types';

// Export constants
export {
  DEFAULT_THRESHOLDS,
  LIKELIHOOD_SCORES,
  SEVERITY_WEIGHTS,
} from './constants';

// Export utilities
export {
  likelihoodToScore,
  scoreToLikelihood,
  calculateRiskScore,
  isViolation,
  getSuggestedAction,
} from './utils';
