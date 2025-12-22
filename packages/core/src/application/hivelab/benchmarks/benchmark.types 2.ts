/**
 * AI Benchmark Types
 *
 * Type definitions for the automated AI quality benchmarking system.
 * Used by CI to measure and track AI generation quality over time.
 */

import type { QualityScore, ValidationResult } from '../../../domain/hivelab/validation/types';
import type { GateDecision } from '../validation/quality-gate.service';

// ═══════════════════════════════════════════════════════════════════
// BENCHMARK PROMPT TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Category of benchmark prompt
 */
export type BenchmarkCategory =
  | 'basic'        // Single element, clear intent - should always pass
  | 'complex'      // Multi-element, connections - tests composition
  | 'edge_case'    // Vague prompts, conflicting requirements - tests robustness
  | 'space_context' // Context-aware generation - tests understanding
  | 'iteration';   // Building on existing - tests modification

/**
 * A curated prompt for benchmarking AI quality
 */
export interface BenchmarkPrompt {
  /** Unique identifier (kebab-case) */
  id: string;

  /** Category for grouping and analysis */
  category: BenchmarkCategory;

  /** The actual prompt to send to AI */
  prompt: string;

  /** Elements we expect to see (minimum) */
  expectedElements: string[];

  /** Minimum element count */
  minElementCount: number;

  /** Maximum element count (over is penalized) */
  maxElementCount: number;

  /** Should generate connections? */
  expectedConnections?: boolean;

  /** Minimum acceptable quality score */
  minQualityScore: number;

  /** Space context for context-aware tests */
  spaceContext?: {
    spaceName: string;
    spaceType: string;
    category: string;
  };

  /** Tags for filtering */
  tags: string[];

  /** Existing composition for iteration tests */
  existingComposition?: {
    elements: Array<{
      elementId: string;
      instanceId: string;
      config: Record<string, unknown>;
    }>;
  };
}

// ═══════════════════════════════════════════════════════════════════
// BENCHMARK RESULT TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Expectation check results
 */
export interface ExpectationResult {
  /** Did the composition include all expected elements? */
  hasExpectedElements: boolean;

  /** Which expected elements are missing? */
  missingElements: string[];

  /** Is element count within bounds? */
  withinElementBounds: boolean;

  /** Actual element count */
  actualElementCount: number;

  /** Does it have connections when expected? */
  hasExpectedConnections: boolean;

  /** Does quality score meet minimum? */
  meetsMinQuality: boolean;

  /** Actual quality score */
  actualQualityScore: number;
}

/**
 * Result from running a single benchmark prompt
 */
export interface BenchmarkResult {
  /** Prompt ID that was tested */
  promptId: string;

  /** The prompt text */
  prompt: string;

  /** When benchmark started */
  startedAt: Date;

  /** When benchmark completed */
  completedAt: Date;

  /** Total duration in ms */
  durationMs: number;

  /** Did generation succeed? */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Quality scores from validation */
  scores: QualityScore;

  /** Gate decision */
  gateDecision: GateDecision;

  /** Number of elements generated */
  elementCount: number;

  /** Number of connections generated */
  connectionCount: number;

  /** Types of elements generated */
  elementTypes: string[];

  /** Expectation check results */
  expectations: ExpectationResult;

  /** Did this benchmark pass overall? */
  passed: boolean;

  /** Reasons for failure (if any) */
  failureReasons: string[];
}

// ═══════════════════════════════════════════════════════════════════
// BENCHMARK SUITE TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Results grouped by category
 */
export interface CategoryResult {
  category: BenchmarkCategory;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  avgScore: number;
  avgDurationMs: number;
}

/**
 * Complete results from running a benchmark suite
 */
export interface BenchmarkSuiteResult {
  /** Unique run identifier */
  runId: string;

  /** Git commit SHA */
  gitCommit: string;

  /** Git branch name */
  gitBranch: string;

  /** When the run started */
  runAt: Date;

  /** Environment (ci, local, production) */
  environment: 'ci' | 'local' | 'production';

  /** Total prompts tested */
  totalPrompts: number;

  /** Number passed */
  passed: number;

  /** Number failed */
  failed: number;

  /** Overall pass rate (0-1) */
  passRate: number;

  /** Average quality score */
  avgQualityScore: number;

  /** Average duration in ms */
  avgDurationMs: number;

  /** Acceptance rate (accepted + partial_accept) */
  acceptanceRate: number;

  /** Results by category */
  categoryResults: Record<BenchmarkCategory, CategoryResult>;

  /** Individual results */
  results: BenchmarkResult[];

  /** Comparison with baseline (if available) */
  comparison?: BenchmarkComparison;
}

// ═══════════════════════════════════════════════════════════════════
// COMPARISON TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Comparison between two benchmark runs
 */
export interface BenchmarkComparison {
  /** Baseline run ID being compared against */
  baselineRunId: string;

  /** Baseline git commit */
  baselineCommit: string;

  /** Change in average quality score */
  scoreChange: number;

  /** Change in pass rate */
  passRateChange: number;

  /** Change in acceptance rate */
  acceptanceRateChange: number;

  /** Change in average duration */
  durationChange: number;

  /** Prompts that regressed (passed before, fail now) */
  regressions: string[];

  /** Prompts that improved (failed before, pass now) */
  improvements: string[];

  /** Is this a regression? */
  isRegression: boolean;

  /** Regression details */
  regressionReason?: string;
}

// ═══════════════════════════════════════════════════════════════════
// RUNNER OPTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Options for running benchmarks
 */
export interface BenchmarkRunnerOptions {
  /** Filter by prompt IDs */
  promptIds?: string[];

  /** Filter by categories */
  categories?: BenchmarkCategory[];

  /** Filter by tags */
  tags?: string[];

  /** Run in parallel (faster but may hit rate limits) */
  parallel?: boolean;

  /** Max concurrent if parallel */
  concurrency?: number;

  /** Use mock generator (no API key, deterministic) */
  mockMode?: boolean;

  /** Path to baseline file for comparison */
  baselinePath?: string;

  /** Verbose logging */
  verbose?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// REGRESSION THRESHOLDS
// ═══════════════════════════════════════════════════════════════════

/**
 * Thresholds for regression detection
 */
export interface RegressionThresholds {
  /** Score drop that triggers warning */
  scoreDropWarning: number;

  /** Score drop that triggers failure */
  scoreDropFail: number;

  /** Pass rate drop that triggers warning */
  passRateDropWarning: number;

  /** Pass rate drop that triggers failure */
  passRateDropFail: number;
}

/**
 * Default regression thresholds
 */
export const DEFAULT_REGRESSION_THRESHOLDS: RegressionThresholds = {
  scoreDropWarning: -5,      // Warn if score drops > 5 points
  scoreDropFail: -10,        // Fail if score drops > 10 points
  passRateDropWarning: 0.1,  // Warn if pass rate drops > 10%
  passRateDropFail: 0.2,     // Fail if pass rate drops > 20%
};

// ═══════════════════════════════════════════════════════════════════
// MOCK GENERATOR TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Mock generation result (for CI without API keys)
 */
export interface MockGenerationResult {
  composition: {
    id: string;
    name: string;
    description: string;
    elements: Array<{
      elementId: string;
      instanceId: string;
      config: Record<string, unknown>;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
    connections: Array<{
      from: { instanceId: string; output: string };
      to: { instanceId: string; input: string };
    }>;
    layout: 'flow' | 'grid' | 'tabs' | 'sidebar';
  };
  durationMs: number;
}
