/**
 * HIVE Moderation Types
 *
 * Shared type definitions for content moderation across the platform.
 */

// =============================================================================
// Content Analysis Types (Text)
// =============================================================================

export interface ToxicityScores {
  toxicity: number;
  severeToxicity: number;
  identityAttack: number;
  insult: number;
  profanity: number;
  threat: number;
  sexuallyExplicit: number;
  flirtation: number;
}

export interface ContentMetadata {
  wordCount: number;
  hasUrls: boolean;
  hasEmails: boolean;
  hasPhoneNumbers: boolean;
  repeatPatterns: boolean;
  capsPercentage: number;
}

export interface ContentCategory {
  category: string;
  confidence: number;
  matched: boolean;
}

export interface ContentAnalysisResult {
  isViolation: boolean;
  confidence: number;
  toxicityScores: ToxicityScores;
  categories: ContentCategory[];
  riskScore: number;
  suggestedAction: 'no_action' | 'flag' | 'hide' | 'remove' | 'escalate';
  flags: string[];
  reasoning: string;
  processingTime: number;
  modelVersion: string;
  metadata: ContentMetadata;
}

export interface ContentAnalysisOptions {
  checkToxicity?: boolean;
  checkSpam?: boolean;
  checkPII?: boolean;
  contextType?: 'chat' | 'post' | 'profile' | 'event' | 'space';
  userTrustScore?: number;
  isFirstPost?: boolean;
}

// =============================================================================
// Image Analysis Types
// =============================================================================

export type SafeSearchLikelihood =
  | 'UNKNOWN'
  | 'VERY_UNLIKELY'
  | 'UNLIKELY'
  | 'POSSIBLE'
  | 'LIKELY'
  | 'VERY_LIKELY';

export interface SafeSearchAnnotation {
  adult: SafeSearchLikelihood;
  spoof: SafeSearchLikelihood;
  medical: SafeSearchLikelihood;
  violence: SafeSearchLikelihood;
  racy: SafeSearchLikelihood;
}

export interface ImageScores {
  adult: number;
  violence: number;
  racy: number;
  spoof: number;
  medical: number;
}

export interface ImageAnalysisResult {
  isViolation: boolean;
  confidence: number;
  safeSearch: SafeSearchAnnotation;
  scores: ImageScores;
  suggestedAction: 'allow' | 'flag' | 'block';
  flags: string[];
  reasoning: string;
  processingTime: number;
  source: 'cloud_vision' | 'fallback';
}

export interface ImageAnalysisOptions {
  contextType?: 'profile_photo' | 'space_banner' | 'tool_asset' | 'chat_image' | 'event_image';
  strictMode?: boolean;
}

// =============================================================================
// Moderation Service Types
// =============================================================================

export type ContentType = 'post' | 'comment' | 'message' | 'tool' | 'space' | 'profile' | 'event';
export type ModerationAction = 'allow' | 'flag' | 'hide' | 'remove' | 'escalate';
export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'hidden' | 'removed';

export interface ModerationDecision {
  contentId: string;
  contentType: ContentType;
  action: ModerationAction;
  status: ModerationStatus;
  confidence: number;
  reasoning: string;
  flags: string[];
  mlScores?: {
    toxicity?: ToxicityScores;
    image?: ImageScores;
  };
  reviewRequired: boolean;
  timestamp: Date;
}

export interface ModerationFeedback {
  contentId: string;
  contentType: ContentType;
  mlPrediction: {
    scores: Record<string, number>;
    action: ModerationAction;
    confidence: number;
  };
  humanDecision: {
    action: ModerationAction;
    reason?: string;
    moderatorId: string;
  };
  wasCorrect: boolean;
  timestamp: Date;
}

export interface ModerationStats {
  totalFeedback: number;
  correctPredictions: number;
  accuracy: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  confidenceCorrelation: {
    highConfidence: { total: number; correct: number; accuracy: number };
    mediumConfidence: { total: number; correct: number; accuracy: number };
    lowConfidence: { total: number; correct: number; accuracy: number };
  };
  byContentType: Record<string, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
  recentTrend: { period: string; accuracy: number }[];
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface ModerationConfig {
  // API Keys
  perspectiveApiKey?: string;
  cloudVisionApiKey?: string;

  // Thresholds
  toxicityThreshold?: number;
  autoRemoveThreshold?: number;
  flagThreshold?: number;

  // Feature flags
  enableTextModeration?: boolean;
  enableImageModeration?: boolean;
  enableFeedbackLoop?: boolean;

  // Context settings
  strictModeContexts?: string[];
}

export interface ModerationThresholds {
  text: {
    toxicityFlag: number;
    toxicityHide: number;
    toxicityRemove: number;
    severeToxicityFlag: number;
    severeToxicityHide: number;
    identityAttackFlag: number;
    threatFlag: number;
    threatRemove: number;
  };
  image: {
    adultFlag: number;
    adultBlock: number;
    violenceFlag: number;
    violenceBlock: number;
    racyFlag: number;
    racyBlock: number;
    strictAdultFlag: number;
    strictAdultBlock: number;
    strictViolenceFlag: number;
    strictViolenceBlock: number;
    strictRacyFlag: number;
    strictRacyBlock: number;
  };
}
