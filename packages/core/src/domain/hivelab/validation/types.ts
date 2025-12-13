/**
 * AI Quality Measurement Types
 *
 * Core types for validating and scoring AI-generated tool compositions.
 */

// ═══════════════════════════════════════════════════════════════════
// VALIDATION RESULT
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete validation result for a tool composition
 */
export interface ValidationResult {
  /** Whether the composition passes minimum quality gates */
  valid: boolean;

  /** Detailed quality scores by dimension */
  score: QualityScore;

  /** Critical errors that must be fixed */
  errors: ValidationError[];

  /** Non-critical warnings */
  warnings: ValidationWarning[];

  /** Validation metadata */
  metadata: ValidationMetadata;
}

/**
 * Quality score breakdown by dimension (0-100 each)
 */
export interface QualityScore {
  /** Weighted overall score */
  overall: number;

  /** Structure correctness (valid JSON, required fields) */
  schema: number;

  /** Element ID validity (all IDs exist in registry) */
  elements: number;

  /** Config schema compliance (required fields, valid values) */
  config: number;

  /** Connection graph integrity (no orphans, no cycles) */
  connections: number;

  /** Semantic quality (intent alignment, sensible composition) */
  semantic: number;
}

/**
 * Validation metadata for debugging and analytics
 */
export interface ValidationMetadata {
  /** When validation was performed */
  validatedAt: string;

  /** Validation duration in milliseconds */
  durationMs: number;

  /** Number of elements validated */
  elementCount: number;

  /** Number of connections validated */
  connectionCount: number;

  /** Validator version for tracking changes */
  validatorVersion?: string;
}

// ═══════════════════════════════════════════════════════════════════
// ERRORS AND WARNINGS
// ═══════════════════════════════════════════════════════════════════

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  // Schema errors
  | 'INVALID_JSON'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FIELD_TYPE'
  // Element errors
  | 'INVALID_ELEMENT_ID'
  | 'DUPLICATE_INSTANCE_ID'
  | 'UNKNOWN_ELEMENT_TYPE'
  // Config errors
  | 'MISSING_REQUIRED_CONFIG'
  | 'INVALID_CONFIG_VALUE'
  | 'CONFIG_TYPE_MISMATCH'
  // Connection errors
  | 'ORPHAN_CONNECTION'
  | 'INVALID_OUTPUT_PORT'
  | 'INVALID_INPUT_PORT'
  | 'CIRCULAR_DEPENDENCY'
  // Position/layout errors
  | 'INVALID_POSITION'
  | 'OVERLAPPING_ELEMENTS'
  | 'OUT_OF_BOUNDS';

/**
 * Validation error with context
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: ValidationErrorCode;

  /** Human-readable error message */
  message: string;

  /** JSON path to the error location */
  path: string[];

  /** Error severity */
  severity: 'critical' | 'error';

  /** Suggested fix (optional) */
  suggestion?: string;

  /** Related element or connection ID */
  relatedId?: string;
}

/**
 * Warning codes for non-critical issues
 */
export type ValidationWarningCode =
  | 'MISSING_OPTIONAL_CONFIG'
  | 'SUBOPTIMAL_LAYOUT'
  | 'NO_CONNECTIONS'
  | 'EXCESSIVE_ELEMENTS'
  | 'EMPTY_CONFIG'
  | 'DEFAULT_VALUES_ONLY';

/**
 * Validation warning with context
 */
export interface ValidationWarning {
  /** Warning code */
  code: ValidationWarningCode;

  /** Human-readable warning message */
  message: string;

  /** JSON path to the warning location */
  path: string[];

  /** Related element or connection ID */
  relatedId?: string;
}

// ═══════════════════════════════════════════════════════════════════
// GENERATION TRACKING
// ═══════════════════════════════════════════════════════════════════

/**
 * AI generation record stored in Firestore
 */
export interface AIGenerationRecord {
  /** Unique generation ID */
  id: string;

  /** User who triggered generation (null for anonymous) */
  userId: string | null;

  /** Session ID for grouping related generations */
  sessionId: string;

  /** Campus ID for multi-tenant analytics */
  campusId?: string;

  // ─────────────────────────────────────────────────────────────────
  // INPUT
  // ─────────────────────────────────────────────────────────────────

  /** User's prompt */
  prompt: string;

  /** Prompt length in characters */
  promptLength: number;

  /** Whether this is an iteration on existing tool */
  isIteration: boolean;

  /** Space context if provided */
  spaceContext?: {
    spaceId: string;
    spaceName: string;
    spaceType?: string;
    category?: string;
    memberCount?: number;
  };

  /** Constraints applied */
  constraints?: {
    maxElements?: number;
    allowedCategories?: string[];
  };

  // ─────────────────────────────────────────────────────────────────
  // MODEL
  // ─────────────────────────────────────────────────────────────────

  /** Model used for generation */
  model: 'gemini-2.0-flash' | 'mock';

  /** Prompt version (for A/B testing future) */
  promptVersion: string;

  /** Temperature setting */
  temperature?: number;

  // ─────────────────────────────────────────────────────────────────
  // OUTPUT
  // ─────────────────────────────────────────────────────────────────

  /** Generated composition (stored separately for size) */
  compositionId?: string;

  /** Number of elements generated */
  elementCount: number;

  /** Number of connections generated */
  connectionCount: number;

  /** Element types used */
  elementTypes: string[];

  /** Layout type */
  layout: string;

  // ─────────────────────────────────────────────────────────────────
  // QUALITY
  // ─────────────────────────────────────────────────────────────────

  /** Validation result summary */
  validation: {
    valid: boolean;
    score: QualityScore;
    errorCount: number;
    warningCount: number;
    errorCodes: ValidationErrorCode[];
  };

  /** Gate decision */
  gateDecision: 'accepted' | 'partial_accept' | 'rejected';

  /** Modifications made by quality gate */
  modifications?: string[];

  // ─────────────────────────────────────────────────────────────────
  // PERFORMANCE
  // ─────────────────────────────────────────────────────────────────

  /** Total generation time in milliseconds */
  latencyMs: number;

  /** Token counts (estimated) */
  tokenCount: {
    input: number;
    output: number;
  };

  /** Number of retries needed */
  retryCount: number;

  /** Whether fallback was used */
  usedFallback: boolean;

  // ─────────────────────────────────────────────────────────────────
  // OUTCOME (updated async)
  // ─────────────────────────────────────────────────────────────────

  /** Final outcome after user interaction */
  outcome?: GenerationOutcome;

  /** Time to first user action (ms) */
  timeToFirstAction?: number;

  // ─────────────────────────────────────────────────────────────────
  // TIMESTAMPS
  // ─────────────────────────────────────────────────────────────────

  /** When generation started */
  createdAt: Date;

  /** When outcome was recorded */
  updatedAt?: Date;
}

/**
 * Generation outcome types
 */
export type GenerationOutcome =
  | { type: 'deployed'; deployedTo: string; deployedAt: Date }
  | { type: 'saved'; savedAt: Date }
  | { type: 'edited'; editId: string }
  | { type: 'abandoned'; abandonedAfterMs: number }
  | { type: 'rejected'; reason?: string };

// ═══════════════════════════════════════════════════════════════════
// EDIT TRACKING
// ═══════════════════════════════════════════════════════════════════

/**
 * User edit record - tracks what users change after AI generation
 */
export interface GenerationEditRecord {
  /** Unique edit record ID */
  id: string;

  /** Reference to the generation */
  generationId: string;

  /** User who made edits */
  userId: string;

  // ─────────────────────────────────────────────────────────────────
  // SNAPSHOTS
  // ─────────────────────────────────────────────────────────────────

  /** Composition before edits (reference) */
  beforeCompositionId: string;

  /** Composition after edits (reference) */
  afterCompositionId: string;

  // ─────────────────────────────────────────────────────────────────
  // GRANULAR EDITS
  // ─────────────────────────────────────────────────────────────────

  /** Individual edit operations */
  edits: ElementEdit[];

  /** Summary statistics */
  summary: {
    elementsAdded: number;
    elementsRemoved: number;
    elementsModified: number;
    configsChanged: number;
    positionsChanged: number;
    connectionsAdded: number;
    connectionsRemoved: number;
  };

  // ─────────────────────────────────────────────────────────────────
  // TIMING
  // ─────────────────────────────────────────────────────────────────

  /** Time from generation complete to first edit */
  timeToFirstEditMs: number;

  /** Total time spent editing */
  totalEditTimeMs: number;

  /** Number of edit operations */
  editCount: number;

  // ─────────────────────────────────────────────────────────────────
  // OUTCOME
  // ─────────────────────────────────────────────────────────────────

  /** What user did after editing */
  finalOutcome: 'deployed' | 'saved' | 'discarded';

  /** Timestamps */
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Single edit operation
 */
export interface ElementEdit {
  /** Edit type */
  type: 'add' | 'remove' | 'modify' | 'reposition' | 'reconnect';

  /** Element type (for add/remove) */
  elementType?: string;

  /** Instance ID */
  instanceId?: string;

  /** Field that was changed (for modify) */
  field?: string;

  /** Previous value */
  oldValue?: unknown;

  /** New value */
  newValue?: unknown;

  /** Timestamp of edit */
  timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════════
// FAILURE TRACKING
// ═══════════════════════════════════════════════════════════════════

/**
 * Failure types for classification
 */
export type FailureType =
  | 'json_parse_error'
  | 'schema_validation_error'
  | 'invalid_element_id'
  | 'missing_required_field'
  | 'timeout'
  | 'rate_limit'
  | 'model_error'
  | 'network_error'
  | 'unknown';

/**
 * Generation failure record
 */
export interface GenerationFailureRecord {
  /** Unique failure ID */
  id: string;

  /** Reference to generation (if available) */
  generationId?: string;

  /** User who triggered generation */
  userId: string | null;

  // ─────────────────────────────────────────────────────────────────
  // CONTEXT
  // ─────────────────────────────────────────────────────────────────

  /** Prompt that caused failure */
  prompt: string;

  /** Model that failed */
  model: 'gemini-2.0-flash' | 'mock';

  /** Prompt version */
  promptVersion: string;

  // ─────────────────────────────────────────────────────────────────
  // FAILURE DETAILS
  // ─────────────────────────────────────────────────────────────────

  /** Classified failure type */
  failureType: FailureType;

  /** Error code (if available) */
  errorCode?: string;

  /** Error message */
  errorMessage: string;

  /** Stack trace (truncated) */
  stackTrace?: string;

  /** Partial response (if any) */
  partialResponse?: string;

  // ─────────────────────────────────────────────────────────────────
  // RESOLUTION
  // ─────────────────────────────────────────────────────────────────

  /** How failure was resolved */
  resolvedBy?: 'retry' | 'fallback' | 'manual' | 'unresolved';

  /** Number of retries before failure */
  retryCount: number;

  /** Whether fallback succeeded */
  fallbackSucceeded?: boolean;

  // ─────────────────────────────────────────────────────────────────
  // TIMESTAMPS
  // ─────────────────────────────────────────────────────────────────

  /** When failure occurred */
  createdAt: Date;

  /** Duration until failure (ms) */
  durationMs: number;
}

// ═══════════════════════════════════════════════════════════════════
// AGGREGATED METRICS
// ═══════════════════════════════════════════════════════════════════

/**
 * Aggregated quality metrics for a time period
 */
export interface AggregatedMetrics {
  /** Time period */
  period: {
    start: Date;
    end: Date;
    granularity: 'hour' | 'day' | 'week' | 'month';
  };

  // ─────────────────────────────────────────────────────────────────
  // VOLUME
  // ─────────────────────────────────────────────────────────────────

  /** Total generations */
  totalGenerations: number;

  /** Unique users */
  uniqueUsers: number;

  // ─────────────────────────────────────────────────────────────────
  // QUALITY
  // ─────────────────────────────────────────────────────────────────

  /** Average quality score */
  avgQualityScore: number;

  /** Score distribution buckets */
  scoreDistribution: {
    excellent: number; // 90-100
    good: number; // 70-89
    acceptable: number; // 50-69
    poor: number; // 0-49
  };

  /** Average scores by dimension */
  avgScoresByDimension: QualityScore;

  // ─────────────────────────────────────────────────────────────────
  // OUTCOMES
  // ─────────────────────────────────────────────────────────────────

  /** Acceptance rate (accepted / total) */
  acceptanceRate: number;

  /** Partial acceptance rate */
  partialAcceptanceRate: number;

  /** Rejection rate */
  rejectionRate: number;

  /** Deployment rate (deployed / accepted) */
  deploymentRate: number;

  /** Edit rate (edited / accepted) */
  editRate: number;

  /** Abandonment rate */
  abandonmentRate: number;

  // ─────────────────────────────────────────────────────────────────
  // ERRORS
  // ─────────────────────────────────────────────────────────────────

  /** Error rate */
  errorRate: number;

  /** Errors by type */
  errorsByType: Record<FailureType, number>;

  /** Most common validation errors */
  topValidationErrors: Array<{ code: ValidationErrorCode; count: number }>;

  // ─────────────────────────────────────────────────────────────────
  // PERFORMANCE
  // ─────────────────────────────────────────────────────────────────

  /** Average latency */
  avgLatencyMs: number;

  /** P50 latency */
  p50LatencyMs: number;

  /** P95 latency */
  p95LatencyMs: number;

  /** P99 latency */
  p99LatencyMs: number;

  /** Fallback rate */
  fallbackRate: number;

  // ─────────────────────────────────────────────────────────────────
  // ELEMENTS
  // ─────────────────────────────────────────────────────────────────

  /** Element usage frequency */
  elementUsage: Record<string, number>;

  /** Elements most often removed by users */
  elementsOftenRemoved: Array<{ elementId: string; removeRate: number }>;

  /** Elements most often added by users */
  elementsOftenAdded: Array<{ elementId: string; addRate: number }>;

  /** Average elements per tool */
  avgElementsPerTool: number;
}

// ═══════════════════════════════════════════════════════════════════
// AUTOMATED INSIGHTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Insight types generated automatically from data
 */
export type InsightType =
  | 'element_overused'
  | 'element_underused'
  | 'config_frequently_changed'
  | 'error_spike'
  | 'quality_degradation'
  | 'latency_increase'
  | 'pattern_detected';

/**
 * Automated insight from metrics analysis
 */
export interface AutomatedInsight {
  /** Unique insight ID */
  id: string;

  /** Insight type */
  type: InsightType;

  /** Human-readable description */
  description: string;

  /** Supporting evidence */
  evidence: string;

  /** Suggested action */
  suggestedAction: string;

  /** Priority level */
  priority: 'high' | 'medium' | 'low';

  /** Related element ID (if applicable) */
  relatedElementId?: string;

  /** Metric values that triggered insight */
  metrics: Record<string, number>;

  /** When insight was computed */
  computedAt: Date;

  /** Whether insight has been acknowledged */
  acknowledged: boolean;
}
