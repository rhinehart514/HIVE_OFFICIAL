/**
 * ML Content Analyzer
 *
 * Real ML-based content analysis for moderation using:
 * 1. Google Perspective API for toxicity detection
 * 2. Local pattern matching for known bad patterns
 * 3. Heuristics for context-aware analysis
 *
 * This replaces the mock AI analysis in content-moderation-service.ts
 */

import { logger } from './structured-logger';

// =============================================================================
// Types
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

export interface ContentAnalysisResult {
  isViolation: boolean;
  confidence: number;
  toxicityScores: ToxicityScores;
  categories: {
    category: string;
    confidence: number;
    matched: boolean;
  }[];
  riskScore: number;
  suggestedAction: 'no_action' | 'flag' | 'hide' | 'remove' | 'escalate';
  flags: string[];
  reasoning: string;
  processingTime: number;
  modelVersion: string;
  metadata: {
    wordCount: number;
    hasUrls: boolean;
    hasEmails: boolean;
    hasPhoneNumbers: boolean;
    repeatPatterns: boolean;
    capsPercentage: number;
  };
}

export interface AnalysisOptions {
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

export interface ImageAnalysisResult {
  isViolation: boolean;
  confidence: number;
  safeSearch: SafeSearchAnnotation;
  scores: {
    adult: number;
    violence: number;
    racy: number;
    spoof: number;
    medical: number;
  };
  suggestedAction: 'allow' | 'flag' | 'block';
  flags: string[];
  reasoning: string;
  processingTime: number;
  source: 'cloud_vision' | 'fallback';
}

export interface ImageAnalysisOptions {
  contextType?: 'profile_photo' | 'space_banner' | 'tool_asset' | 'chat_image' | 'event_image';
  strictMode?: boolean; // Higher thresholds for sensitive contexts
}

// =============================================================================
// Constants
// =============================================================================

const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
const CLOUD_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const MODEL_VERSION = '2.0.0';

// Likelihood to numeric score mapping
const LIKELIHOOD_SCORES: Record<SafeSearchLikelihood, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 0.1,
  UNLIKELY: 0.25,
  POSSIBLE: 0.5,
  LIKELY: 0.75,
  VERY_LIKELY: 0.95,
};

// Image moderation thresholds
const IMAGE_THRESHOLDS = {
  // Standard mode
  ADULT_FLAG: 0.5,       // POSSIBLE
  ADULT_BLOCK: 0.75,     // LIKELY
  VIOLENCE_FLAG: 0.5,
  VIOLENCE_BLOCK: 0.75,
  RACY_FLAG: 0.75,       // More lenient for racy
  RACY_BLOCK: 0.95,      // Only block VERY_LIKELY
  // Strict mode (for profile photos, space banners)
  STRICT_ADULT_FLAG: 0.25,    // UNLIKELY
  STRICT_ADULT_BLOCK: 0.5,    // POSSIBLE
  STRICT_VIOLENCE_FLAG: 0.25,
  STRICT_VIOLENCE_BLOCK: 0.5,
  STRICT_RACY_FLAG: 0.5,
  STRICT_RACY_BLOCK: 0.75,
};

// Toxicity thresholds
const THRESHOLDS = {
  TOXICITY_FLAG: 0.6,
  TOXICITY_HIDE: 0.8,
  TOXICITY_REMOVE: 0.95,
  SEVERE_TOXICITY_FLAG: 0.4,
  SEVERE_TOXICITY_HIDE: 0.6,
  IDENTITY_ATTACK_FLAG: 0.5,
  THREAT_FLAG: 0.5,
  THREAT_REMOVE: 0.8,
};

// Known bad patterns (case-insensitive regex patterns)
const BAD_PATTERNS = {
  slurs: [
    /\bn[i1l]gg[ae3]r?\b/i,
    /\bf[a4]gg?[o0]t\b/i,
    /\bk[i1l]ke\b/i,
    /\br[e3]t[a4]rd\b/i,
  ],
  threats: [
    /\b(kill|murder|shoot|stab|hurt)\s+(you|him|her|them|everyone)\b/i,
    /\byou('re|\s+are)\s+(dead|gonna\s+die)\b/i,
    /\bi('ll|\s+will)\s+(kill|hurt|find)\s+you\b/i,
  ],
  selfHarm: [
    /\b(kill|hurt|cut)\s+my?self\b/i,
    /\bwant\s+to\s+die\b/i,
    /\bend\s+(my\s+)?life\b/i,
  ],
  spam: [
    /(.)\1{4,}/,                          // Repeated characters
    /\b(buy|free|click|subscribe)\b.*\b(now|here|link)\b/i,
    /\$\d+.*\bper\s+(day|hour|week)\b/i,  // Money spam patterns
    /\b(whatsapp|telegram|signal)\s*[:-]?\s*\+?\d{10,}/i,  // Contact spam
  ],
  pii: [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,      // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
    /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,        // SSN pattern
    /\b\d{16}\b/,                          // Credit card pattern
  ],
};

// Severity weights for risk score calculation
const SEVERITY_WEIGHTS = {
  toxicity: 1.0,
  severeToxicity: 2.0,
  identityAttack: 1.5,
  insult: 0.8,
  profanity: 0.5,
  threat: 2.5,
  sexuallyExplicit: 1.2,
  flirtation: 0.3,
};

// =============================================================================
// ML Content Analyzer Class
// =============================================================================

export class MLContentAnalyzer {
  private perspectiveApiKey: string | null = null;
  private cloudVisionApiKey: string | null = null;
  private useLocalFallback = true;

  constructor() {
    this.perspectiveApiKey = process.env.PERSPECTIVE_API_KEY || null;
    this.cloudVisionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || null;

    if (!this.perspectiveApiKey) {
      logger.warn('Perspective API key not configured, using local analysis only', {
        component: 'MLContentAnalyzer',
      });
    }
    if (!this.cloudVisionApiKey) {
      logger.warn('Cloud Vision API key not configured, image moderation unavailable', {
        component: 'MLContentAnalyzer',
      });
    }
  }

  /**
   * Analyze content for moderation
   */
  async analyze(
    content: string,
    options: AnalysisOptions = {}
  ): Promise<ContentAnalysisResult> {
    const startTime = Date.now();

    const {
      checkToxicity = true,
      checkSpam = true,
      checkPII = true,
      contextType = 'post',
      userTrustScore = 0.5,
      isFirstPost = false,
    } = options;

    // Basic metadata extraction
    const metadata = this.extractMetadata(content);

    // Initialize scores
    let toxicityScores: ToxicityScores = {
      toxicity: 0,
      severeToxicity: 0,
      identityAttack: 0,
      insult: 0,
      profanity: 0,
      threat: 0,
      sexuallyExplicit: 0,
      flirtation: 0,
    };

    const categories: ContentAnalysisResult['categories'] = [];
    const flags: string[] = [];

    // 1. Run Perspective API analysis if available
    if (checkToxicity && this.perspectiveApiKey) {
      try {
        toxicityScores = await this.callPerspectiveAPI(content);
      } catch (error) {
        logger.warn('Perspective API call failed, using local analysis', {
          component: 'MLContentAnalyzer',
          error: error instanceof Error ? error.message : String(error),
        });
        toxicityScores = this.localToxicityAnalysis(content);
      }
    } else if (checkToxicity) {
      toxicityScores = this.localToxicityAnalysis(content);
    }

    // 2. Pattern matching for known bad content
    const patternResults = this.checkPatterns(content);
    categories.push(...patternResults.categories);
    flags.push(...patternResults.flags);

    // 3. Spam detection
    if (checkSpam) {
      const spamResult = this.detectSpam(content, metadata);
      categories.push({
        category: 'spam',
        confidence: spamResult.confidence,
        matched: spamResult.isSpam,
      });
      if (spamResult.isSpam) {
        flags.push('spam_detected');
      }
    }

    // 4. PII detection
    if (checkPII) {
      const piiResult = this.detectPII(content);
      if (piiResult.hasPII) {
        categories.push({
          category: 'pii_exposure',
          confidence: piiResult.confidence,
          matched: true,
        });
        flags.push(...piiResult.types);
      }
    }

    // 5. Context-aware adjustments
    this.applyContextAdjustments(toxicityScores, categories, contextType);

    // 6. Calculate overall risk score
    const riskScore = this.calculateRiskScore(
      toxicityScores,
      categories,
      userTrustScore,
      isFirstPost
    );

    // 7. Determine suggested action
    const suggestedAction = this.determineSuggestedAction(
      toxicityScores,
      riskScore,
      categories,
      flags
    );

    // 8. Calculate confidence
    const confidence = this.calculateConfidence(toxicityScores, categories);

    // 9. Generate reasoning
    const reasoning = this.generateReasoning(
      toxicityScores,
      categories,
      flags,
      suggestedAction
    );

    const processingTime = Date.now() - startTime;

    return {
      isViolation: suggestedAction !== 'no_action',
      confidence,
      toxicityScores,
      categories,
      riskScore,
      suggestedAction,
      flags,
      reasoning,
      processingTime,
      modelVersion: MODEL_VERSION,
      metadata,
    };
  }

  /**
   * Call Google Perspective API
   */
  private async callPerspectiveAPI(content: string): Promise<ToxicityScores> {
    if (!this.perspectiveApiKey) {
      throw new Error('Perspective API key not configured');
    }

    const requestBody = {
      comment: { text: content },
      languages: ['en'],
      requestedAttributes: {
        TOXICITY: {},
        SEVERE_TOXICITY: {},
        IDENTITY_ATTACK: {},
        INSULT: {},
        PROFANITY: {},
        THREAT: {},
        SEXUALLY_EXPLICIT: {},
        FLIRTATION: {},
      },
    };

    const response = await fetch(
      `${PERSPECTIVE_API_URL}?key=${this.perspectiveApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Perspective API error: ${response.status}`);
    }

    const data = await response.json();
    const scores = data.attributeScores;

    return {
      toxicity: scores.TOXICITY?.summaryScore?.value ?? 0,
      severeToxicity: scores.SEVERE_TOXICITY?.summaryScore?.value ?? 0,
      identityAttack: scores.IDENTITY_ATTACK?.summaryScore?.value ?? 0,
      insult: scores.INSULT?.summaryScore?.value ?? 0,
      profanity: scores.PROFANITY?.summaryScore?.value ?? 0,
      threat: scores.THREAT?.summaryScore?.value ?? 0,
      sexuallyExplicit: scores.SEXUALLY_EXPLICIT?.summaryScore?.value ?? 0,
      flirtation: scores.FLIRTATION?.summaryScore?.value ?? 0,
    };
  }

  /**
   * Local toxicity analysis as fallback
   */
  private localToxicityAnalysis(content: string): ToxicityScores {
    const lowerContent = content.toLowerCase();
    const words = lowerContent.split(/\s+/);

    // Simple word-based scoring
    const profanityList = [
      'fuck', 'shit', 'ass', 'damn', 'hell', 'bitch', 'crap', 'bastard',
    ];
    const insultList = [
      'stupid', 'idiot', 'dumb', 'moron', 'loser', 'pathetic', 'worthless',
    ];
    const threatList = ['kill', 'die', 'hurt', 'destroy', 'attack'];

    let profanityCount = 0;
    let insultCount = 0;
    let threatCount = 0;

    for (const word of words) {
      if (profanityList.some(p => word.includes(p))) profanityCount++;
      if (insultList.some(i => word.includes(i))) insultCount++;
      if (threatList.some(t => word.includes(t))) threatCount++;
    }

    const wordCount = words.length || 1;

    // Calculate normalized scores (0-1)
    const profanityScore = Math.min(profanityCount / wordCount * 5, 1);
    const insultScore = Math.min(insultCount / wordCount * 5, 1);
    const threatScore = Math.min(threatCount / wordCount * 5, 1);

    // Check for slurs (high toxicity)
    const hasSlurs = BAD_PATTERNS.slurs.some(p => p.test(content));

    return {
      toxicity: Math.max(profanityScore * 0.5 + insultScore * 0.3 + threatScore * 0.2, hasSlurs ? 0.9 : 0),
      severeToxicity: hasSlurs ? 0.95 : threatScore * 0.5,
      identityAttack: hasSlurs ? 0.9 : 0,
      insult: insultScore,
      profanity: profanityScore,
      threat: threatScore,
      sexuallyExplicit: 0, // Hard to detect locally
      flirtation: 0, // Hard to detect locally
    };
  }

  /**
   * Check for known bad patterns
   */
  private checkPatterns(content: string): {
    categories: ContentAnalysisResult['categories'];
    flags: string[];
  } {
    const categories: ContentAnalysisResult['categories'] = [];
    const flags: string[] = [];

    // Check slurs
    const hasSlurs = BAD_PATTERNS.slurs.some(p => p.test(content));
    if (hasSlurs) {
      categories.push({ category: 'hate_speech', confidence: 0.95, matched: true });
      flags.push('slur_detected');
    }

    // Check threats
    const hasThreats = BAD_PATTERNS.threats.some(p => p.test(content));
    if (hasThreats) {
      categories.push({ category: 'violence', confidence: 0.9, matched: true });
      flags.push('threat_detected');
    }

    // Check self-harm
    const hasSelfHarm = BAD_PATTERNS.selfHarm.some(p => p.test(content));
    if (hasSelfHarm) {
      categories.push({ category: 'self_harm', confidence: 0.85, matched: true });
      flags.push('self_harm_detected');
    }

    return { categories, flags };
  }

  /**
   * Detect spam patterns
   */
  private detectSpam(
    content: string,
    metadata: ContentAnalysisResult['metadata']
  ): { isSpam: boolean; confidence: number } {
    let spamScore = 0;

    // Check spam patterns
    if (BAD_PATTERNS.spam.some(p => p.test(content))) {
      spamScore += 0.4;
    }

    // High caps percentage
    if (metadata.capsPercentage > 0.5) {
      spamScore += 0.2;
    }

    // Repeated patterns
    if (metadata.repeatPatterns) {
      spamScore += 0.3;
    }

    // Too many URLs
    const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 2) {
      spamScore += 0.2;
    }

    // Very short content with URLs
    if (metadata.wordCount < 10 && urlCount > 0) {
      spamScore += 0.3;
    }

    return {
      isSpam: spamScore >= 0.5,
      confidence: Math.min(spamScore, 1),
    };
  }

  /**
   * Detect personally identifiable information
   */
  private detectPII(content: string): {
    hasPII: boolean;
    confidence: number;
    types: string[];
  } {
    const types: string[] = [];

    if (BAD_PATTERNS.pii[0].test(content)) types.push('phone_number');
    if (BAD_PATTERNS.pii[1].test(content)) types.push('email_address');
    if (BAD_PATTERNS.pii[2].test(content)) types.push('ssn_pattern');
    if (BAD_PATTERNS.pii[3].test(content)) types.push('credit_card');

    return {
      hasPII: types.length > 0,
      confidence: types.length > 0 ? 0.9 : 0,
      types,
    };
  }

  /**
   * Extract content metadata
   */
  private extractMetadata(content: string): ContentAnalysisResult['metadata'] {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const letters = content.replace(/[^a-zA-Z]/g, '');
    const upperLetters = letters.replace(/[^A-Z]/g, '');

    return {
      wordCount: words.length,
      hasUrls: /https?:\/\/[^\s]+/.test(content),
      hasEmails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content),
      hasPhoneNumbers: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content),
      repeatPatterns: /(.)\1{4,}/.test(content),
      capsPercentage: letters.length > 0 ? upperLetters.length / letters.length : 0,
    };
  }

  /**
   * Apply context-aware adjustments
   */
  private applyContextAdjustments(
    scores: ToxicityScores,
    categories: ContentAnalysisResult['categories'],
    contextType: string
  ): void {
    // Chat messages have more tolerance for casual language
    if (contextType === 'chat') {
      scores.profanity *= 0.7;
      scores.insult *= 0.8;
      scores.flirtation *= 0.5;
    }

    // Profile content should be cleaner
    if (contextType === 'profile') {
      scores.toxicity *= 1.2;
      scores.profanity *= 1.3;
    }

    // Events should be professional
    if (contextType === 'event') {
      scores.toxicity *= 1.1;
      scores.sexuallyExplicit *= 1.5;
    }

    // Clamp all values to 0-1
    for (const key of Object.keys(scores) as (keyof ToxicityScores)[]) {
      scores[key] = Math.min(Math.max(scores[key], 0), 1);
    }
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(
    scores: ToxicityScores,
    categories: ContentAnalysisResult['categories'],
    userTrustScore: number,
    isFirstPost: boolean
  ): number {
    // Weighted sum of toxicity scores
    let weightedScore = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(SEVERITY_WEIGHTS)) {
      weightedScore += scores[key as keyof ToxicityScores] * weight;
      totalWeight += weight;
    }

    let riskScore = weightedScore / totalWeight;

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

  /**
   * Determine suggested moderation action
   */
  private determineSuggestedAction(
    scores: ToxicityScores,
    riskScore: number,
    categories: ContentAnalysisResult['categories'],
    flags: string[]
  ): ContentAnalysisResult['suggestedAction'] {
    // Immediate removal for severe violations
    if (scores.severeToxicity >= THRESHOLDS.SEVERE_TOXICITY_HIDE) {
      return 'remove';
    }
    if (scores.threat >= THRESHOLDS.THREAT_REMOVE) {
      return 'remove';
    }
    if (flags.includes('slur_detected') || flags.includes('self_harm_detected')) {
      return 'escalate';
    }

    // Hide for high toxicity
    if (scores.toxicity >= THRESHOLDS.TOXICITY_HIDE) {
      return 'hide';
    }
    if (scores.severeToxicity >= THRESHOLDS.SEVERE_TOXICITY_FLAG) {
      return 'hide';
    }

    // Flag for moderate issues
    if (scores.toxicity >= THRESHOLDS.TOXICITY_FLAG) {
      return 'flag';
    }
    if (scores.identityAttack >= THRESHOLDS.IDENTITY_ATTACK_FLAG) {
      return 'flag';
    }
    if (scores.threat >= THRESHOLDS.THREAT_FLAG) {
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

    return 'no_action';
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    scores: ToxicityScores,
    categories: ContentAnalysisResult['categories']
  ): number {
    // Base confidence from API scores (if they're non-zero, we have real analysis)
    const hasRealScores = Object.values(scores).some(v => v > 0);
    let confidence = hasRealScores ? 0.7 : 0.5;

    // Pattern matching increases confidence
    const patternMatches = categories.filter(c => c.matched).length;
    confidence += patternMatches * 0.1;

    // High scores increase confidence in detection
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0.8) {
      confidence += 0.15;
    }

    return Math.min(confidence, 0.98);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    scores: ToxicityScores,
    categories: ContentAnalysisResult['categories'],
    flags: string[],
    action: ContentAnalysisResult['suggestedAction']
  ): string {
    const reasons: string[] = [];

    if (scores.toxicity > THRESHOLDS.TOXICITY_FLAG) {
      reasons.push(`High toxicity score (${(scores.toxicity * 100).toFixed(0)}%)`);
    }
    if (scores.threat > THRESHOLDS.THREAT_FLAG) {
      reasons.push(`Threatening language detected (${(scores.threat * 100).toFixed(0)}%)`);
    }
    if (scores.identityAttack > THRESHOLDS.IDENTITY_ATTACK_FLAG) {
      reasons.push(`Identity attack detected (${(scores.identityAttack * 100).toFixed(0)}%)`);
    }

    for (const cat of categories) {
      if (cat.matched) {
        reasons.push(`${cat.category.replace('_', ' ')} pattern detected (${(cat.confidence * 100).toFixed(0)}% confidence)`);
      }
    }

    if (flags.includes('spam_detected')) {
      reasons.push('Spam patterns detected');
    }

    if (reasons.length === 0) {
      return 'Content appears safe with no policy violations detected.';
    }

    return `${action === 'no_action' ? 'Minor concerns' : 'Action recommended'}: ${reasons.join('; ')}.`;
  }

  /**
   * Quick check for urgent content (fast path for obvious violations)
   */
  quickCheck(content: string): { isUrgent: boolean; reason?: string } {
    // Check for slurs first (fast regex check)
    if (BAD_PATTERNS.slurs.some(p => p.test(content))) {
      return { isUrgent: true, reason: 'slur_detected' };
    }

    // Check for threats
    if (BAD_PATTERNS.threats.some(p => p.test(content))) {
      return { isUrgent: true, reason: 'threat_detected' };
    }

    // Check for self-harm
    if (BAD_PATTERNS.selfHarm.some(p => p.test(content))) {
      return { isUrgent: true, reason: 'self_harm_content' };
    }

    return { isUrgent: false };
  }

  // ===========================================================================
  // Image Analysis Methods
  // ===========================================================================

  /**
   * Analyze image for inappropriate content using Google Cloud Vision SafeSearch
   *
   * @param imageSource - Base64-encoded image data OR a GCS URI (gs://bucket/path)
   * @param options - Analysis options including context type and strict mode
   */
  async analyzeImage(
    imageSource: string,
    options: ImageAnalysisOptions = {}
  ): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    const {
      contextType = 'chat_image',
      strictMode = contextType === 'profile_photo' || contextType === 'space_banner',
    } = options;

    // Try Cloud Vision API if available
    if (this.cloudVisionApiKey) {
      try {
        return await this.callCloudVisionAPI(imageSource, strictMode, startTime);
      } catch (error) {
        logger.warn('Cloud Vision API call failed, using fallback', {
          component: 'MLContentAnalyzer',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fallback: return a permissive result with warning
    return this.fallbackImageAnalysis(startTime);
  }

  /**
   * Call Google Cloud Vision SafeSearch API
   */
  private async callCloudVisionAPI(
    imageSource: string,
    strictMode: boolean,
    startTime: number
  ): Promise<ImageAnalysisResult> {
    if (!this.cloudVisionApiKey) {
      throw new Error('Cloud Vision API key not configured');
    }

    // Determine if imageSource is a GCS URI or base64 data
    const isGcsUri = imageSource.startsWith('gs://');

    const imagePayload = isGcsUri
      ? { source: { gcsImageUri: imageSource } }
      : { content: imageSource.replace(/^data:image\/\w+;base64,/, '') };

    const requestBody = {
      requests: [
        {
          image: imagePayload,
          features: [{ type: 'SAFE_SEARCH_DETECTION' }],
        },
      ],
    };

    const response = await fetch(
      `${CLOUD_VISION_API_URL}?key=${this.cloudVisionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloud Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const annotation = data.responses?.[0]?.safeSearchAnnotation;

    if (!annotation) {
      throw new Error('No SafeSearch annotation in response');
    }

    const safeSearch: SafeSearchAnnotation = {
      adult: annotation.adult || 'UNKNOWN',
      spoof: annotation.spoof || 'UNKNOWN',
      medical: annotation.medical || 'UNKNOWN',
      violence: annotation.violence || 'UNKNOWN',
      racy: annotation.racy || 'UNKNOWN',
    };

    // Convert to numeric scores
    const scores = {
      adult: LIKELIHOOD_SCORES[safeSearch.adult],
      violence: LIKELIHOOD_SCORES[safeSearch.violence],
      racy: LIKELIHOOD_SCORES[safeSearch.racy],
      spoof: LIKELIHOOD_SCORES[safeSearch.spoof],
      medical: LIKELIHOOD_SCORES[safeSearch.medical],
    };

    // Determine action and flags based on mode
    const { suggestedAction, flags, isViolation } = this.evaluateImageScores(scores, strictMode);

    // Calculate overall confidence
    const maxScore = Math.max(scores.adult, scores.violence, scores.racy);
    const confidence = maxScore > 0.5 ? 0.85 : 0.7;

    const processingTime = Date.now() - startTime;

    return {
      isViolation,
      confidence,
      safeSearch,
      scores,
      suggestedAction,
      flags,
      reasoning: this.generateImageReasoning(scores, flags, suggestedAction, strictMode),
      processingTime,
      source: 'cloud_vision',
    };
  }

  /**
   * Evaluate image scores against thresholds
   */
  private evaluateImageScores(
    scores: ImageAnalysisResult['scores'],
    strictMode: boolean
  ): {
    suggestedAction: ImageAnalysisResult['suggestedAction'];
    flags: string[];
    isViolation: boolean;
  } {
    const flags: string[] = [];
    let action: ImageAnalysisResult['suggestedAction'] = 'allow';

    const thresholds = strictMode
      ? {
          adultFlag: IMAGE_THRESHOLDS.STRICT_ADULT_FLAG,
          adultBlock: IMAGE_THRESHOLDS.STRICT_ADULT_BLOCK,
          violenceFlag: IMAGE_THRESHOLDS.STRICT_VIOLENCE_FLAG,
          violenceBlock: IMAGE_THRESHOLDS.STRICT_VIOLENCE_BLOCK,
          racyFlag: IMAGE_THRESHOLDS.STRICT_RACY_FLAG,
          racyBlock: IMAGE_THRESHOLDS.STRICT_RACY_BLOCK,
        }
      : {
          adultFlag: IMAGE_THRESHOLDS.ADULT_FLAG,
          adultBlock: IMAGE_THRESHOLDS.ADULT_BLOCK,
          violenceFlag: IMAGE_THRESHOLDS.VIOLENCE_FLAG,
          violenceBlock: IMAGE_THRESHOLDS.VIOLENCE_BLOCK,
          racyFlag: IMAGE_THRESHOLDS.RACY_FLAG,
          racyBlock: IMAGE_THRESHOLDS.RACY_BLOCK,
        };

    // Check adult content
    if (scores.adult >= thresholds.adultBlock) {
      flags.push('adult_content_blocked');
      action = 'block';
    } else if (scores.adult >= thresholds.adultFlag) {
      flags.push('adult_content_flagged');
      action = 'flag';
    }

    // Check violence
    if (scores.violence >= thresholds.violenceBlock) {
      flags.push('violence_blocked');
      action = 'block';
    } else if (scores.violence >= thresholds.violenceFlag) {
      flags.push('violence_flagged');
      if (action !== 'block') action = 'flag';
    }

    // Check racy content
    if (scores.racy >= thresholds.racyBlock) {
      flags.push('racy_content_blocked');
      action = 'block';
    } else if (scores.racy >= thresholds.racyFlag) {
      flags.push('racy_content_flagged');
      if (action !== 'block') action = 'flag';
    }

    return {
      suggestedAction: action,
      flags,
      isViolation: action !== 'allow',
    };
  }

  /**
   * Generate human-readable reasoning for image analysis
   */
  private generateImageReasoning(
    scores: ImageAnalysisResult['scores'],
    flags: string[],
    action: ImageAnalysisResult['suggestedAction'],
    strictMode: boolean
  ): string {
    if (flags.length === 0) {
      return 'Image appears safe with no policy violations detected.';
    }

    const reasons: string[] = [];

    if (scores.adult >= 0.5) {
      reasons.push(`Adult content detected (${(scores.adult * 100).toFixed(0)}% likelihood)`);
    }
    if (scores.violence >= 0.5) {
      reasons.push(`Violence detected (${(scores.violence * 100).toFixed(0)}% likelihood)`);
    }
    if (scores.racy >= 0.75) {
      reasons.push(`Racy content detected (${(scores.racy * 100).toFixed(0)}% likelihood)`);
    }

    const modeNote = strictMode ? ' (strict mode for public-facing content)' : '';
    const actionText = action === 'block' ? 'Blocked' : 'Flagged for review';

    return `${actionText}${modeNote}: ${reasons.join('; ')}.`;
  }

  /**
   * Fallback when Cloud Vision API is unavailable
   * Returns a permissive result - better to allow than block without analysis
   */
  private fallbackImageAnalysis(startTime: number): ImageAnalysisResult {
    logger.warn('Image moderation unavailable - Cloud Vision API key not configured', {
      component: 'MLContentAnalyzer',
    });

    return {
      isViolation: false,
      confidence: 0,
      safeSearch: {
        adult: 'UNKNOWN',
        spoof: 'UNKNOWN',
        medical: 'UNKNOWN',
        violence: 'UNKNOWN',
        racy: 'UNKNOWN',
      },
      scores: {
        adult: 0,
        violence: 0,
        racy: 0,
        spoof: 0,
        medical: 0,
      },
      suggestedAction: 'allow',
      flags: ['image_analysis_unavailable'],
      reasoning: 'Image moderation unavailable - Cloud Vision API not configured. Image allowed by default.',
      processingTime: Date.now() - startTime,
      source: 'fallback',
    };
  }

  /**
   * Quick check if image moderation is available
   */
  isImageModerationAvailable(): boolean {
    return this.cloudVisionApiKey !== null;
  }
}

// Export singleton instance
export const mlContentAnalyzer = new MLContentAnalyzer();
