/**
 * Quality Gate Service
 *
 * Decides whether AI-generated compositions should be:
 * - ACCEPTED: High quality, ready for user
 * - PARTIAL_ACCEPT: Fixable issues, auto-corrected then shown
 * - REJECTED: Too broken, needs regeneration
 *
 * This is the last line of defense before users see AI output.
 */

import type { ToolComposition } from '../../../domain/hivelab/tool-composition.types';
import type { ValidationResult, ValidationError, QualityScore } from '../../../domain/hivelab/validation/types';
import { ELEMENT_IDS } from '../../../domain/hivelab/element-registry';

// ═══════════════════════════════════════════════════════════════════
// GATE RESULT TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Gate decision type
 */
export type GateDecision = 'accepted' | 'partial_accept' | 'rejected';

/**
 * Auto-fix types that can be applied
 */
export type AutoFixType =
  | 'remove_invalid_element'
  | 'remove_orphan_connection'
  | 'set_default_config'
  | 'fix_position_bounds'
  | 'fix_size_bounds'
  | 'dedupe_instance_ids'
  | 'add_missing_required_field';

/**
 * Single auto-fix applied
 */
export interface AutoFix {
  type: AutoFixType;
  target: string; // Element instanceId or connection index
  description: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Result from the quality gate
 */
export interface GateResult {
  /** The decision */
  decision: GateDecision;

  /** Original validation result */
  validation: ValidationResult;

  /** Fixed composition (if partial_accept) */
  composition: ToolComposition;

  /** Auto-fixes applied (if partial_accept) */
  fixes: AutoFix[];

  /** Reason for rejection (if rejected) */
  rejectionReason?: string;

  /** Suggestions for regeneration (if rejected) */
  regenerationHints?: string[];

  /** Gate metadata */
  metadata: {
    gatedAt: string;
    durationMs: number;
    originalScore: number;
    finalScore: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// GATE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Quality thresholds for gate decisions
 */
export interface GateThresholds {
  /** Minimum overall score to accept without fixes (0-100) */
  acceptThreshold: number;

  /** Minimum overall score after fixes to partial accept (0-100) */
  partialAcceptThreshold: number;

  /** Minimum schema score to even attempt fixes (0-100) */
  minSchemaScore: number;

  /** Maximum critical errors before auto-reject */
  maxCriticalErrors: number;

  /** Maximum elements that can be removed by auto-fix */
  maxElementRemovals: number;
}

/**
 * Default thresholds - tuned for production
 */
export const DEFAULT_GATE_THRESHOLDS: GateThresholds = {
  acceptThreshold: 85,
  partialAcceptThreshold: 60,
  minSchemaScore: 50,
  maxCriticalErrors: 2,
  maxElementRemovals: 2,
};

// ═══════════════════════════════════════════════════════════════════
// QUALITY GATE SERVICE
// ═══════════════════════════════════════════════════════════════════

/**
 * Quality Gate Service
 *
 * Applies business rules to decide what to do with AI output.
 */
export class QualityGateService {
  private thresholds: GateThresholds;
  private validElementIds: Set<string>;

  constructor(thresholds: Partial<GateThresholds> = {}) {
    this.thresholds = { ...DEFAULT_GATE_THRESHOLDS, ...thresholds };
    this.validElementIds = new Set(ELEMENT_IDS);
  }

  /**
   * Main gate method - decides fate of composition
   */
  gate(composition: ToolComposition, validation: ValidationResult): GateResult {
    const startTime = Date.now();
    const originalScore = validation.score.overall;

    // ─────────────────────────────────────────────────────────────────
    // FAST PATH: High quality = accept immediately
    // ─────────────────────────────────────────────────────────────────
    if (validation.valid && originalScore >= this.thresholds.acceptThreshold) {
      return {
        decision: 'accepted',
        validation,
        composition,
        fixes: [],
        metadata: {
          gatedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          originalScore,
          finalScore: originalScore,
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // CHECK: Is it worth trying to fix?
    // ─────────────────────────────────────────────────────────────────
    const criticalErrors = validation.errors.filter(e => e.severity === 'critical');

    // Too many critical errors = reject
    if (criticalErrors.length > this.thresholds.maxCriticalErrors) {
      return this.createRejection(
        composition,
        validation,
        originalScore,
        startTime,
        `Too many critical errors (${criticalErrors.length})`,
        this.generateHintsFromErrors(criticalErrors)
      );
    }

    // Schema score too low = structure is fundamentally broken
    if (validation.score.schema < this.thresholds.minSchemaScore) {
      return this.createRejection(
        composition,
        validation,
        originalScore,
        startTime,
        `Schema score too low (${validation.score.schema}/100)`,
        ['Ensure output is valid JSON', 'Include required fields: name, elements, layout']
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // ATTEMPT AUTO-FIXES
    // ─────────────────────────────────────────────────────────────────
    const { fixed, fixes } = this.applyAutoFixes(composition, validation);

    // Check if we removed too many elements
    const removals = fixes.filter(f => f.type === 'remove_invalid_element');
    if (removals.length > this.thresholds.maxElementRemovals) {
      return this.createRejection(
        composition,
        validation,
        originalScore,
        startTime,
        `Would require removing ${removals.length} elements`,
        ['Use only valid element IDs from the registry', 'Check element spelling']
      );
    }

    // Check if we have any elements left
    if (fixed.elements.length === 0) {
      return this.createRejection(
        composition,
        validation,
        originalScore,
        startTime,
        'No valid elements remain after fixes',
        ['Generate at least one valid element', 'Check element IDs against registry']
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // CALCULATE POST-FIX SCORE
    // ─────────────────────────────────────────────────────────────────
    const finalScore = this.estimatePostFixScore(validation.score, fixes);

    // Check if fixed version meets threshold
    if (finalScore >= this.thresholds.partialAcceptThreshold) {
      return {
        decision: 'partial_accept',
        validation,
        composition: fixed,
        fixes,
        metadata: {
          gatedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          originalScore,
          finalScore,
        },
      };
    }

    // Still not good enough after fixes
    return this.createRejection(
      composition,
      validation,
      originalScore,
      startTime,
      `Score after fixes (${finalScore}) below threshold (${this.thresholds.partialAcceptThreshold})`,
      this.generateHintsFromErrors(validation.errors)
    );
  }

  /**
   * Apply auto-fixes to a composition
   */
  private applyAutoFixes(
    composition: ToolComposition,
    validation: ValidationResult
  ): { fixed: ToolComposition; fixes: AutoFix[] } {
    const fixes: AutoFix[] = [];

    // Deep clone to avoid mutations
    const fixed: ToolComposition = JSON.parse(JSON.stringify(composition));

    // Track which elements were removed (for connection cleanup)
    const removedInstanceIds = new Set<string>();

    // ─────────────────────────────────────────────────────────────────
    // FIX 1: Remove invalid elements
    // ─────────────────────────────────────────────────────────────────
    const invalidElementErrors = validation.errors.filter(
      e => e.code === 'INVALID_ELEMENT_ID' || e.code === 'UNKNOWN_ELEMENT_TYPE'
    );

    for (const error of invalidElementErrors) {
      const instanceId = error.relatedId;
      if (instanceId) {
        const elementIndex = fixed.elements.findIndex(el => el.instanceId === instanceId);
        if (elementIndex !== -1) {
          const element = fixed.elements[elementIndex];
          fixes.push({
            type: 'remove_invalid_element',
            target: instanceId,
            description: `Removed element with invalid type "${element.elementId}"`,
            before: element,
            after: undefined,
          });
          fixed.elements.splice(elementIndex, 1);
          removedInstanceIds.add(instanceId);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // FIX 2: Remove connections to/from removed elements
    // ─────────────────────────────────────────────────────────────────
    fixed.connections = fixed.connections.filter((conn, index) => {
      const fromRemoved = removedInstanceIds.has(conn.from.instanceId);
      const toRemoved = removedInstanceIds.has(conn.to.instanceId);

      if (fromRemoved || toRemoved) {
        fixes.push({
          type: 'remove_orphan_connection',
          target: `connection_${index}`,
          description: `Removed connection ${conn.from.instanceId}→${conn.to.instanceId} (referenced removed element)`,
          before: conn,
          after: undefined,
        });
        return false;
      }
      return true;
    });

    // ─────────────────────────────────────────────────────────────────
    // FIX 3: Fix position bounds
    // ─────────────────────────────────────────────────────────────────
    for (const element of fixed.elements) {
      const pos = element.position;
      let positionFixed = false;
      const originalPos = { ...pos };

      if (pos.x < 0) {
        pos.x = 0;
        positionFixed = true;
      }
      if (pos.x > 2000) {
        pos.x = 2000;
        positionFixed = true;
      }
      if (pos.y < 0) {
        pos.y = 0;
        positionFixed = true;
      }
      if (pos.y > 5000) {
        pos.y = 5000;
        positionFixed = true;
      }

      if (positionFixed) {
        fixes.push({
          type: 'fix_position_bounds',
          target: element.instanceId,
          description: `Fixed position bounds for ${element.instanceId}`,
          before: originalPos,
          after: pos,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // FIX 4: Fix size bounds
    // ─────────────────────────────────────────────────────────────────
    for (const element of fixed.elements) {
      const size = element.size;
      let sizeFixed = false;
      const originalSize = { ...size };

      if (size.width < 50) {
        size.width = 50;
        sizeFixed = true;
      }
      if (size.width > 1000) {
        size.width = 1000;
        sizeFixed = true;
      }
      if (size.height < 30) {
        size.height = 30;
        sizeFixed = true;
      }
      if (size.height > 800) {
        size.height = 800;
        sizeFixed = true;
      }

      if (sizeFixed) {
        fixes.push({
          type: 'fix_size_bounds',
          target: element.instanceId,
          description: `Fixed size bounds for ${element.instanceId}`,
          before: originalSize,
          after: size,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // FIX 5: Dedupe instance IDs
    // ─────────────────────────────────────────────────────────────────
    const seenIds = new Set<string>();
    for (const element of fixed.elements) {
      if (seenIds.has(element.instanceId)) {
        const oldId = element.instanceId;
        const newId = `${element.instanceId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        element.instanceId = newId;
        fixes.push({
          type: 'dedupe_instance_ids',
          target: oldId,
          description: `Renamed duplicate instance ID "${oldId}" to "${newId}"`,
          before: oldId,
          after: newId,
        });
      }
      seenIds.add(element.instanceId);
    }

    // ─────────────────────────────────────────────────────────────────
    // FIX 6: Set missing required config fields to defaults
    // ─────────────────────────────────────────────────────────────────
    const missingConfigErrors = validation.errors.filter(
      e => e.code === 'MISSING_REQUIRED_CONFIG'
    );

    for (const error of missingConfigErrors) {
      const instanceId = error.relatedId;
      if (instanceId) {
        const element = fixed.elements.find(el => el.instanceId === instanceId);
        if (element) {
          // Apply default based on element type
          const defaults = this.getConfigDefaults(element.elementId);
          for (const [key, value] of Object.entries(defaults)) {
            if (element.config[key] === undefined) {
              element.config[key] = value;
              fixes.push({
                type: 'add_missing_required_field',
                target: instanceId,
                description: `Added default value for required field "${key}" in ${element.elementId}`,
                before: undefined,
                after: value,
              });
            }
          }
        }
      }
    }

    return { fixed, fixes };
  }

  /**
   * Get default config values for an element type
   */
  private getConfigDefaults(elementId: string): Record<string, unknown> {
    const defaults: Record<string, Record<string, unknown>> = {
      'poll-element': {
        question: 'What do you think?',
        options: ['Option 1', 'Option 2'],
      },
      'countdown-timer': {
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      'rsvp-button': {
        eventName: 'Event',
      },
      'chart-display': {
        chartType: 'bar',
      },
      'form-builder': {
        fields: [],
      },
    };

    return defaults[elementId] || {};
  }

  /**
   * Estimate score after fixes are applied
   */
  private estimatePostFixScore(originalScore: QualityScore, fixes: AutoFix[]): number {
    // Start with original overall score
    let adjustment = 0;

    // Each type of fix has different impact
    for (const fix of fixes) {
      switch (fix.type) {
        case 'remove_invalid_element':
          // Removing bad elements is good, but indicates AI made mistakes
          adjustment += 5; // Net positive but limited
          break;
        case 'remove_orphan_connection':
          adjustment += 2;
          break;
        case 'fix_position_bounds':
        case 'fix_size_bounds':
          adjustment += 3;
          break;
        case 'dedupe_instance_ids':
          adjustment += 2;
          break;
        case 'add_missing_required_field':
          adjustment += 5;
          break;
        case 'set_default_config':
          adjustment += 3;
          break;
      }
    }

    // Cap adjustment at 25 points
    adjustment = Math.min(adjustment, 25);

    return Math.min(100, originalScore.overall + adjustment);
  }

  /**
   * Create a rejection result
   */
  private createRejection(
    composition: ToolComposition,
    validation: ValidationResult,
    originalScore: number,
    startTime: number,
    reason: string,
    hints: string[]
  ): GateResult {
    return {
      decision: 'rejected',
      validation,
      composition,
      fixes: [],
      rejectionReason: reason,
      regenerationHints: hints,
      metadata: {
        gatedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        originalScore,
        finalScore: originalScore, // No improvement for rejections
      },
    };
  }

  /**
   * Generate hints from validation errors
   */
  private generateHintsFromErrors(errors: ValidationError[]): string[] {
    const hints: string[] = [];
    const seenCodes = new Set<string>();

    for (const error of errors) {
      if (seenCodes.has(error.code)) continue;
      seenCodes.add(error.code);

      switch (error.code) {
        case 'INVALID_JSON':
          hints.push('Ensure output is valid JSON format');
          break;
        case 'MISSING_REQUIRED_FIELD':
          hints.push(`Include required field: ${error.path.join('.')}`);
          break;
        case 'INVALID_ELEMENT_ID':
        case 'UNKNOWN_ELEMENT_TYPE':
          hints.push('Use only element IDs from the registry: poll-element, countdown-timer, chart-display, etc.');
          break;
        case 'DUPLICATE_INSTANCE_ID':
          hints.push('Ensure each element has a unique instanceId');
          break;
        case 'MISSING_REQUIRED_CONFIG':
          hints.push('Include all required config fields for each element type');
          break;
        case 'CIRCULAR_DEPENDENCY':
          hints.push('Avoid circular connections between elements');
          break;
        case 'ORPHAN_CONNECTION':
          hints.push('Only connect elements that exist in the composition');
          break;
        default:
          if (error.suggestion) {
            hints.push(error.suggestion);
          }
      }
    }

    // Limit to top 5 hints
    return hints.slice(0, 5);
  }

  /**
   * Update thresholds (for A/B testing or tuning)
   */
  updateThresholds(newThresholds: Partial<GateThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current thresholds (for debugging/monitoring)
   */
  getThresholds(): GateThresholds {
    return { ...this.thresholds };
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance with default thresholds
 */
let defaultGateService: QualityGateService | null = null;

/**
 * Get default gate service instance
 */
export function getQualityGateService(): QualityGateService {
  if (!defaultGateService) {
    defaultGateService = new QualityGateService();
  }
  return defaultGateService;
}

/**
 * Convenience function to gate a composition
 */
export function gateComposition(
  composition: ToolComposition,
  validation: ValidationResult
): GateResult {
  return getQualityGateService().gate(composition, validation);
}
