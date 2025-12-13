/**
 * Moderation Utilities
 *
 * Helper functions for content moderation scoring and decisions.
 */

import type {
  SafeSearchLikelihood,
  ToxicityScores,
  ModerationAction,
  ContentCategory,
} from './types';
import { LIKELIHOOD_SCORES, SEVERITY_WEIGHTS, DEFAULT_THRESHOLDS } from './constants';

// =============================================================================
// Likelihood Conversion
// =============================================================================

/**
 * Convert SafeSearch likelihood to numeric score
 */
export function likelihoodToScore(likelihood: SafeSearchLikelihood): number {
  return LIKELIHOOD_SCORES[likelihood] ?? 0;
}

/**
 * Convert numeric score to SafeSearch likelihood
 */
export function scoreToLikelihood(score: number): SafeSearchLikelihood {
  if (score >= 0.9) return 'VERY_LIKELY';
  if (score >= 0.7) return 'LIKELY';
  if (score >= 0.4) return 'POSSIBLE';
  if (score >= 0.2) return 'UNLIKELY';
  if (score > 0) return 'VERY_UNLIKELY';
  return 'UNKNOWN';
}

// =============================================================================
// Risk Score Calculation
// =============================================================================

/**
 * Calculate overall risk score from toxicity scores
 */
export function calculateRiskScore(
  scores: ToxicityScores,
  categories: ContentCategory[] = [],
  userTrustScore = 0.5,
  isFirstPost = false
): number {
  // Weighted sum of toxicity scores
  let weightedScore = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(SEVERITY_WEIGHTS)) {
    const score = scores[key as keyof ToxicityScores];
    if (typeof score === 'number') {
      weightedScore += score * weight;
      totalWeight += weight;
    }
  }

  let riskScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Add category-based risks
  for (const cat of categories) {
    if (cat.matched) {
      if (cat.category === 'hate_speech' || cat.category === 'violence') {
        riskScore += 0.3;
      } else if (cat.category === 'self_harm') {
        riskScore += 0.4;
      } else if (cat.category === 'spam') {
        riskScore += 0.2;
      }
    }
  }

  // Trust score adjustment (lower trust = higher risk multiplier)
  const trustMultiplier = 1 + (1 - userTrustScore) * 0.3;
  riskScore *= trustMultiplier;

  // First post penalty
  if (isFirstPost) {
    riskScore *= 1.2;
  }

  return Math.min(riskScore, 1);
}

// =============================================================================
// Violation Detection
// =============================================================================

/**
 * Determine if content is a violation based on scores
 */
export function isViolation(
  toxicityScores: ToxicityScores,
  riskScore: number,
  categories: ContentCategory[] = [],
  flags: string[] = []
): boolean {
  const thresholds = DEFAULT_THRESHOLDS.text;

  // Check for immediate violations
  if (toxicityScores.severeToxicity >= thresholds.severeToxicityHide) {
    return true;
  }
  if (toxicityScores.threat >= thresholds.threatRemove) {
    return true;
  }
  if (toxicityScores.toxicity >= thresholds.toxicityHide) {
    return true;
  }

  // Check flags
  if (
    flags.includes('slur_detected') ||
    flags.includes('self_harm_detected') ||
    flags.includes('threat_detected')
  ) {
    return true;
  }

  // Check categories
  for (const cat of categories) {
    if (cat.matched && ['hate_speech', 'violence', 'self_harm'].includes(cat.category)) {
      return true;
    }
  }

  // High risk score
  if (riskScore >= 0.7) {
    return true;
  }

  return false;
}

// =============================================================================
// Action Determination
// =============================================================================

/**
 * Determine suggested moderation action based on analysis results
 */
export function getSuggestedAction(
  toxicityScores: ToxicityScores,
  riskScore: number,
  _categories: ContentCategory[] = [],
  flags: string[] = []
): ModerationAction {
  const thresholds = DEFAULT_THRESHOLDS.text;

  // Immediate removal for severe violations
  if (toxicityScores.severeToxicity >= thresholds.severeToxicityHide) {
    return 'remove';
  }
  if (toxicityScores.threat >= thresholds.threatRemove) {
    return 'remove';
  }
  if (flags.includes('slur_detected') || flags.includes('self_harm_detected')) {
    return 'escalate';
  }

  // Hide for high toxicity
  if (toxicityScores.toxicity >= thresholds.toxicityHide) {
    return 'hide';
  }
  if (toxicityScores.severeToxicity >= thresholds.severeToxicityFlag) {
    return 'hide';
  }

  // Flag for moderate issues
  if (toxicityScores.toxicity >= thresholds.toxicityFlag) {
    return 'flag';
  }
  if (toxicityScores.identityAttack >= thresholds.identityAttackFlag) {
    return 'flag';
  }
  if (toxicityScores.threat >= thresholds.threatFlag) {
    return 'flag';
  }
  if (flags.includes('spam_detected')) {
    return 'flag';
  }

  // Overall risk score check
  if (riskScore >= 0.7) {
    return 'hide';
  }
  if (riskScore >= 0.4) {
    return 'flag';
  }

  return 'allow';
}

// =============================================================================
// Confidence Calculation
// =============================================================================

/**
 * Calculate confidence score for analysis result
 */
export function calculateConfidence(
  toxicityScores: ToxicityScores,
  categories: ContentCategory[] = [],
  hasApiScores = true
): number {
  // Base confidence from API scores
  const hasRealScores = Object.values(toxicityScores).some(v => v > 0);
  let confidence = hasRealScores && hasApiScores ? 0.7 : 0.5;

  // Pattern matching increases confidence
  const patternMatches = categories.filter((c: ContentCategory) => c.matched).length;
  confidence += patternMatches * 0.1;

  // High scores increase confidence in detection
  const maxScore = Math.max(...Object.values(toxicityScores));
  if (maxScore > 0.8) {
    confidence += 0.15;
  }

  return Math.min(confidence, 0.98);
}
