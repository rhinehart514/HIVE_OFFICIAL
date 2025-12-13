/**
 * AI Quality Pipeline
 *
 * High-level facade that orchestrates validation, gating, and tracking
 * for AI-generated tool compositions. This is the main entry point for
 * integrating quality measurement into the generate route.
 *
 * Usage:
 * ```typescript
 * import { AIQualityPipeline } from '@hive/core';
 *
 * const pipeline = new AIQualityPipeline();
 * const result = await pipeline.process(composition, {
 *   userId: 'user-123',
 *   prompt: 'Create a poll',
 *   model: 'gemini-2.0-flash',
 *   ...
 * });
 *
 * if (result.accepted) {
 *   // Use result.composition (may be auto-fixed)
 * } else {
 *   // Handle rejection with result.rejectionReason
 * }
 * ```
 */

import type { ToolComposition } from '../../../domain/hivelab/tool-composition.types';
import type {
  ValidationResult,
  QualityScore,
  GenerationOutcome,
} from '../../../domain/hivelab/validation/types';
import {
  CompositionValidatorService,
  getCompositionValidator,
} from './composition-validator.service';
import {
  QualityGateService,
  getQualityGateService,
  type GateResult,
  type GateDecision,
  type GateThresholds,
} from './quality-gate.service';
import {
  GenerationTrackerService,
  getGenerationTrackerService,
  type GenerationInput,
  type GenerationOutput,
} from './generation-tracker.service';
import {
  FailureClassifierService,
  getFailureClassifierService,
} from './failure-classifier.service';
import {
  EditTrackerService,
  getEditTrackerService,
  type EditTrackingInput,
} from './edit-tracker.service';

// ═══════════════════════════════════════════════════════════════════
// PIPELINE TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Context for processing a generation
 */
export interface PipelineContext {
  /** User who triggered generation (null for anonymous) */
  userId: string | null;

  /** Session ID for grouping related generations */
  sessionId: string;

  /** Campus ID for multi-tenant analytics */
  campusId?: string;

  /** User's prompt */
  prompt: string;

  /** Whether this is an iteration */
  isIteration: boolean;

  /** Model used */
  model: 'gemini-2.0-flash' | 'mock';

  /** Prompt version */
  promptVersion: string;

  /** Temperature setting */
  temperature?: number;

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

  /** Estimated token counts */
  tokenCount?: {
    input: number;
    output: number;
  };

  /** Number of retries that occurred */
  retryCount?: number;

  /** Whether fallback was used */
  usedFallback?: boolean;

  /** Total generation time */
  latencyMs?: number;
}

/**
 * Result from the quality pipeline
 */
export interface PipelineResult {
  /** Whether the composition was accepted (accepted or partial_accept) */
  accepted: boolean;

  /** The gate decision */
  decision: GateDecision;

  /** The composition to use (may be auto-fixed) */
  composition: ToolComposition;

  /** Validation details */
  validation: ValidationResult;

  /** Quality score */
  score: QualityScore;

  /** Auto-fixes applied (if any) */
  fixes: string[];

  /** Rejection reason (if rejected) */
  rejectionReason?: string;

  /** Hints for regeneration (if rejected) */
  regenerationHints?: string[];

  /** Generation record ID (for tracking outcomes) */
  generationId: string;
}

// ═══════════════════════════════════════════════════════════════════
// AI QUALITY PIPELINE
// ═══════════════════════════════════════════════════════════════════

/**
 * AI Quality Pipeline
 *
 * Orchestrates the full validation → gate → track flow.
 */
export class AIQualityPipeline {
  private validator: CompositionValidatorService;
  private gate: QualityGateService;
  private tracker: GenerationTrackerService;
  private failureClassifier: FailureClassifierService;
  private editTracker: EditTrackerService;

  constructor(options?: {
    gateThresholds?: Partial<GateThresholds>;
  }) {
    this.validator = getCompositionValidator();
    this.gate = options?.gateThresholds
      ? new QualityGateService(options.gateThresholds)
      : getQualityGateService();
    this.tracker = getGenerationTrackerService();
    this.failureClassifier = getFailureClassifierService();
    this.editTracker = getEditTrackerService();
  }

  /**
   * Process a composition through the full quality pipeline
   */
  async process(
    composition: ToolComposition,
    context: PipelineContext
  ): Promise<PipelineResult> {
    const startTime = Date.now();

    // 1. Validate
    const validation = this.validator.validate(composition);

    // 2. Gate
    const gateResult = this.gate.gate(composition, validation);

    // 3. Build output
    const output: GenerationOutput = {
      elementCount: gateResult.composition.elements.length,
      connectionCount: gateResult.composition.connections.length,
      elementTypes: [...new Set(gateResult.composition.elements.map(el => el.elementId))],
      layout: gateResult.composition.layout,
      tokenCount: context.tokenCount || { input: 0, output: 0 },
    };

    // 4. Record generation
    const generationId = await this.tracker.recordGeneration({
      input: {
        userId: context.userId,
        sessionId: context.sessionId,
        campusId: context.campusId,
        prompt: context.prompt,
        isIteration: context.isIteration,
        spaceContext: context.spaceContext,
        constraints: context.constraints,
        model: context.model,
        promptVersion: context.promptVersion,
        temperature: context.temperature,
      },
      output,
      validation,
      gateDecision: gateResult.decision,
      modifications: gateResult.fixes.map(f => f.description),
      latencyMs: context.latencyMs || (Date.now() - startTime),
      retryCount: context.retryCount || 0,
      usedFallback: context.usedFallback || false,
    });

    // 5. Return result
    return {
      accepted: gateResult.decision !== 'rejected',
      decision: gateResult.decision,
      composition: gateResult.composition,
      validation,
      score: validation.score,
      fixes: gateResult.fixes.map(f => f.description),
      rejectionReason: gateResult.rejectionReason,
      regenerationHints: gateResult.regenerationHints,
      generationId,
    };
  }

  /**
   * Record a generation failure
   */
  async recordFailure(
    error: Error | string,
    context: PipelineContext,
    options?: {
      partialResponse?: string;
      fallbackAttempted?: boolean;
      fallbackSucceeded?: boolean;
    }
  ): Promise<string> {
    return await this.failureClassifier.recordFailure({
      userId: context.userId,
      prompt: context.prompt,
      model: context.model,
      promptVersion: context.promptVersion,
      error,
      partialResponse: options?.partialResponse,
      retryCount: context.retryCount || 0,
      fallbackAttempted: options?.fallbackAttempted || false,
      fallbackSucceeded: options?.fallbackSucceeded,
      durationMs: context.latencyMs || 0,
    });
  }

  /**
   * Update generation outcome after user interaction
   */
  async updateOutcome(
    generationId: string,
    outcome: GenerationOutcome,
    timeToFirstAction?: number
  ): Promise<void> {
    await this.tracker.updateOutcome(generationId, outcome, timeToFirstAction);
  }

  /**
   * Track edits made by user
   */
  async trackEdits(input: EditTrackingInput): Promise<string> {
    return await this.editTracker.trackEdits(input);
  }

  /**
   * Validate only (without gating or tracking)
   */
  validateOnly(composition: ToolComposition | unknown): ValidationResult {
    return this.validator.validate(composition);
  }

  /**
   * Get gate thresholds (for debugging)
   */
  getThresholds(): GateThresholds {
    return this.gate.getThresholds();
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
let defaultPipeline: AIQualityPipeline | null = null;

/**
 * Get default pipeline instance
 */
export function getAIQualityPipeline(): AIQualityPipeline {
  if (!defaultPipeline) {
    defaultPipeline = new AIQualityPipeline();
  }
  return defaultPipeline;
}

/**
 * Convenience function to process a composition
 */
export async function processComposition(
  composition: ToolComposition,
  context: PipelineContext
): Promise<PipelineResult> {
  return getAIQualityPipeline().process(composition, context);
}

/**
 * Convenience function to validate only
 */
export function validateOnly(composition: unknown): ValidationResult {
  return getAIQualityPipeline().validateOnly(composition);
}

/**
 * Initialize pipeline with Firestore (call once at app startup)
 */
export function initializeAIQualityPipeline(db: FirebaseFirestore.Firestore): void {
  // Initialize all services with Firestore
  getGenerationTrackerService().setFirestore(db);
  getFailureClassifierService().setFirestore(db);
  getEditTrackerService().setFirestore(db);
}

/**
 * Current prompt version - update when prompt changes significantly
 */
export const CURRENT_PROMPT_VERSION = '1.0.0';
