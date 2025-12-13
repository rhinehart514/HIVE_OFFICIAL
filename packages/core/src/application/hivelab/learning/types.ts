/**
 * HiveLab AI Learning System Types
 *
 * Types for the self-learning AI system that extracts patterns from
 * successful generations, user edits, and element usage to improve
 * future tool generation.
 */

// ═══════════════════════════════════════════════════════════════════
// PATTERN LEARNING TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Element affinity - measures how often elements appear together
 * in successful generations
 */
export interface ElementAffinity {
  /** First element in the pair */
  elementA: string;

  /** Second element in the pair */
  elementB: string;

  /** How many times these elements appeared together */
  cooccurrenceCount: number;

  /** Lift score: how much more likely they appear together vs random
   * lift > 1 means positive association
   * lift = 1 means independent
   * lift < 1 means negative association
   */
  liftScore: number;

  /** P(B|A) - probability of B given A */
  conditionalProbability: number;

  /** Space categories where this affinity appears most */
  contexts: string[];

  /** Average quality score of tools with this pairing */
  avgQualityScore: number;

  /** Timestamp when this affinity was computed */
  computedAt: Date;
}

/**
 * Missing pattern - elements that users consistently add after generation
 * This is a strong signal that AI should be generating these combinations
 */
export interface MissingPattern {
  /** The element that was generated */
  generatedElement: string;

  /** The element users frequently add */
  missingElement: string;

  /** How often users add this element after generation */
  additionRate: number;

  /** Total observations */
  sampleSize: number;

  /** Common contexts where this happens */
  contexts: string[];

  /** Timestamp when computed */
  computedAt: Date;
}

/**
 * Over-generation pattern - elements AI generates but users remove
 */
export interface OverGenerationPattern {
  /** The element that gets removed */
  removedElement: string;

  /** What prompt patterns trigger this over-generation */
  triggeringPromptPatterns: string[];

  /** Removal rate */
  removalRate: number;

  /** Sample size */
  sampleSize: number;

  /** Timestamp */
  computedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIG LEARNING TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Config drift - when AI defaults are consistently changed by users
 */
export interface ConfigDrift {
  /** Element type */
  elementType: string;

  /** Config field that drifts */
  field: string;

  /** What AI typically generates */
  aiDefault: unknown;

  /** What users change it to (most common) */
  userPreferred: unknown;

  /** Distribution of user changes */
  changeDistribution: Record<string, number>;

  /** Percentage of times this field is changed */
  changeRate: number;

  /** Sample size */
  sampleSize: number;

  /** Confidence in this drift pattern */
  confidence: number;

  /** Timestamp */
  computedAt: Date;
}

/**
 * Optimal config - learned good configurations for element types
 */
export interface OptimalConfig {
  /** Element type */
  elementType: string;

  /** The optimal config values (weighted by quality scores) */
  optimalValues: Record<string, unknown>;

  /** How confident we are in these values */
  confidence: number;

  /** Average quality score of generations with this config */
  avgQualityScore: number;

  /** Sample size */
  sampleSize: number;

  /** Context-specific overrides */
  contextOverrides: Array<{
    context: string; // e.g., "academic", "social"
    config: Record<string, unknown>;
    sampleSize: number;
  }>;

  /** Timestamp */
  computedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════
// LAYOUT LEARNING TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Layout pattern learned from successful tools
 */
export interface LayoutPattern {
  /** ID for this pattern */
  id: string;

  /** Number of elements in this layout */
  elementCount: number;

  /** Aspect ratio of the tool */
  aspectRatio: 'vertical' | 'horizontal' | 'square';

  /** Primary element (largest/most prominent) */
  primaryElement: string;

  /** Supporting elements */
  supportingElements: string[];

  /** Arrangement type */
  arrangement: 'grid' | 'stack' | 'sidebar' | 'hero';

  /** Position pattern (where elements typically go) */
  positionPattern: Array<{
    role: 'primary' | 'secondary' | 'tertiary';
    xRange: [number, number];
    yRange: [number, number];
  }>;

  /** How often this layout pattern appears */
  occurrenceCount: number;

  /** Average quality score */
  avgQualityScore: number;

  /** Timestamp */
  computedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════
// AGGREGATED LEARNING DATA
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete learned patterns snapshot
 * Stored in Firestore: ai_learned_patterns/latest
 */
export interface LearnedPatterns {
  /** Version for compatibility */
  version: string;

  /** Element affinities (top pairs that go together) */
  affinities: ElementAffinity[];

  /** Missing patterns (what AI should add) */
  missingPatterns: MissingPattern[];

  /** Over-generation patterns (what AI should stop adding) */
  overGenerationPatterns: OverGenerationPattern[];

  /** Config drifts (bad defaults) */
  configDrifts: ConfigDrift[];

  /** Optimal configs per element */
  optimalConfigs: OptimalConfig[];

  /** Layout patterns */
  layoutPatterns: LayoutPattern[];

  /** Metadata */
  computedAt: Date;
  sampleSize: number;
  dataWindowDays: number;
}

// ═══════════════════════════════════════════════════════════════════
// RAG / CONTEXT RETRIEVAL TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Embedding document stored in Firestore
 * Collection: ai_embeddings
 */
export interface EmbeddingDocument {
  /** Document ID */
  id: string;

  /** Type of content embedded */
  type: 'element_usecase' | 'template' | 'successful_generation';

  /** Source ID (element ID, template ID, or generation ID) */
  sourceId: string;

  /** The text that was embedded */
  text: string;

  /** 2048-dimensional embedding vector from Gemini */
  embedding: number[];

  /** Metadata for filtering and context */
  metadata: {
    /** Element types involved */
    elementTypes?: string[];
    /** Space category */
    category?: string;
    /** Quality score (for generations) */
    score?: number;
    /** Whether this was deployed (for generations) */
    deployed?: boolean;
  };

  /** Timestamp */
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Retrieved context for prompt enhancement
 */
export interface RetrievedContext {
  /** Relevant elements with reasons */
  relevantElements: Array<{
    id: string;
    reason: string;
    confidence: number;
  }>;

  /** Relevant templates */
  relevantTemplates: Array<{
    id: string;
    name: string;
    description: string;
    confidence: number;
  }>;

  /** Similar successful generations */
  similarGenerations: Array<{
    id: string;
    prompt: string;
    elements: string[];
    score: number;
    confidence: number;
  }>;

  /** Retrieval metadata */
  retrievalTime: number;
  queryEmbeddingTime: number;
}

// ═══════════════════════════════════════════════════════════════════
// GRADUATION TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Graduation candidate - pattern detected that could become a template or element
 */
export interface GraduationCandidate {
  /** Unique ID */
  id: string;

  /** Type of graduation */
  type: 'pattern_to_template' | 'template_to_element';

  /** The pattern details */
  pattern: {
    /** Elements involved */
    elements: string[];
    /** Common config values */
    config: Record<string, Record<string, unknown>>;
    /** How often this pattern occurs */
    occurrenceCount: number;
    /** Average quality score */
    avgScore: number;
    /** Common prompts that trigger this */
    triggeringPrompts: string[];
  };

  /** Confidence score (0-1) */
  confidence: number;

  /** Suggested name for the template/element */
  suggestedName: string;

  /** Suggested use cases */
  suggestedUseCases: string[];

  /** Status */
  status: 'detected' | 'reviewed' | 'graduated' | 'rejected';

  /** Timestamps */
  detectedAt: Date;
  reviewedAt?: Date;
  graduatedAt?: Date;
}

/**
 * Gap in AI capabilities - where it consistently fails
 */
export interface CapabilityGap {
  /** Unique ID */
  id: string;

  /** Pattern in prompts that trigger poor results */
  promptPattern: string;

  /** Sample prompts that had low scores */
  samplePrompts: string[];

  /** Average score for these prompts */
  avgScore: number;

  /** What element might be needed */
  suggestedSolution: string;

  /** Confidence */
  confidence: number;

  /** When detected */
  detectedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════
// PROMPT ENHANCEMENT TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Enhanced prompt with all context layers
 */
export interface EnhancedPrompt {
  /** The full enhanced prompt text */
  prompt: string;

  /** Which layers were applied */
  layers: Array<'system' | 'rag' | 'patterns' | 'config' | 'space'>;

  /** Token budget used by each layer */
  tokenBudget: {
    system: number;
    rag: number;
    patterns: number;
    config: number;
    space: number;
    user: number;
    total: number;
  };

  /** Metadata about enhancement */
  metadata: {
    retrievalTimeMs: number;
    patternLoadTimeMs: number;
    totalEnhancementTimeMs: number;
    patternsVersion?: string;
  };
}

/**
 * Prompt enhancement options
 */
export interface PromptEnhancementOptions {
  /** Whether to use RAG */
  useRAG?: boolean;

  /** Whether to use learned patterns */
  usePatterns?: boolean;

  /** Whether to use config hints */
  useConfigHints?: boolean;

  /** Maximum tokens for context injection */
  maxContextTokens?: number;

  /** Space context */
  spaceContext?: {
    spaceId: string;
    spaceName: string;
    category?: string;
  };
}
