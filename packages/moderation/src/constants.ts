/**
 * Moderation Constants
 *
 * Shared constants for content moderation thresholds and scoring.
 */

import type { SafeSearchLikelihood, ModerationThresholds } from './types';

// =============================================================================
// Default Thresholds
// =============================================================================

export const DEFAULT_THRESHOLDS: ModerationThresholds = {
  text: {
    toxicityFlag: 0.6,
    toxicityHide: 0.8,
    toxicityRemove: 0.95,
    severeToxicityFlag: 0.4,
    severeToxicityHide: 0.6,
    identityAttackFlag: 0.5,
    threatFlag: 0.5,
    threatRemove: 0.8,
  },
  image: {
    // Standard mode
    adultFlag: 0.5,       // POSSIBLE
    adultBlock: 0.75,     // LIKELY
    violenceFlag: 0.5,
    violenceBlock: 0.75,
    racyFlag: 0.75,       // More lenient for racy
    racyBlock: 0.95,      // Only block VERY_LIKELY
    // Strict mode (for profile photos, space banners)
    strictAdultFlag: 0.25,    // UNLIKELY
    strictAdultBlock: 0.5,    // POSSIBLE
    strictViolenceFlag: 0.25,
    strictViolenceBlock: 0.5,
    strictRacyFlag: 0.5,
    strictRacyBlock: 0.75,
  },
};

// =============================================================================
// Likelihood Scores
// =============================================================================

/**
 * Maps Google Cloud Vision SafeSearch likelihood values to numeric scores (0-1)
 */
export const LIKELIHOOD_SCORES: Record<SafeSearchLikelihood, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 0.1,
  UNLIKELY: 0.25,
  POSSIBLE: 0.5,
  LIKELY: 0.75,
  VERY_LIKELY: 0.95,
};

// =============================================================================
// Severity Weights
// =============================================================================

/**
 * Weights for calculating overall risk score from toxicity dimensions
 */
export const SEVERITY_WEIGHTS = {
  toxicity: 1.0,
  severeToxicity: 2.0,
  identityAttack: 1.5,
  insult: 0.8,
  profanity: 0.5,
  threat: 2.5,
  sexuallyExplicit: 1.2,
  flirtation: 0.3,
} as const;

// =============================================================================
// Content Categories
// =============================================================================

export const CONTENT_CATEGORIES = {
  HATE_SPEECH: 'hate_speech',
  VIOLENCE: 'violence',
  SELF_HARM: 'self_harm',
  SPAM: 'spam',
  PII_EXPOSURE: 'pii_exposure',
  ADULT: 'adult',
  HARASSMENT: 'harassment',
  MISINFORMATION: 'misinformation',
} as const;

// =============================================================================
// Model Versions
// =============================================================================

export const MODEL_VERSIONS = {
  TEXT_ANALYZER: '2.0.0',
  IMAGE_ANALYZER: '1.0.0',
} as const;
