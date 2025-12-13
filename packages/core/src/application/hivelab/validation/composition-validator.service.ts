/**
 * Composition Validator Service
 *
 * 5-stage validation pipeline for AI-generated tool compositions:
 * 1. Schema validation (structure)
 * 2. Element ID validation (registry check)
 * 3. Config validation (per-element)
 * 4. Connection validation (graph integrity)
 * 5. Semantic scoring (quality heuristics)
 */

import { z } from 'zod';
import type { ToolComposition, CanvasElement, ElementConnection } from '../../../domain/hivelab/tool-composition.types';
import { ELEMENT_IDS, getElementById } from '../../../domain/hivelab/element-registry';
import {
  ToolCompositionSchema,
  ELEMENT_CONFIG_SCHEMAS,
  getRequiredFields,
} from '../../../domain/hivelab/validation/element-schemas';
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  QualityScore,
  ValidationErrorCode,
  ValidationWarningCode,
} from '../../../domain/hivelab/validation/types';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const VALIDATOR_VERSION = '1.0.0';

// Score weights for overall calculation
const SCORE_WEIGHTS = {
  schema: 0.25,
  elements: 0.25,
  config: 0.20,
  connections: 0.15,
  semantic: 0.15,
};

// ═══════════════════════════════════════════════════════════════════
// COMPOSITION VALIDATOR SERVICE
// ═══════════════════════════════════════════════════════════════════

export class CompositionValidatorService {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  /**
   * Validate a complete tool composition
   */
  validate(composition: unknown): ValidationResult {
    const startTime = Date.now();

    // Reset state
    this.errors = [];
    this.warnings = [];

    // Stage 1: Schema validation
    const schemaResult = this.validateSchema(composition);
    if (!schemaResult.valid) {
      return this.buildResult(
        { overall: 0, schema: 0, elements: 0, config: 0, connections: 0, semantic: 0 },
        0,
        0,
        startTime
      );
    }

    const parsed = schemaResult.data as ToolComposition;

    // Stage 2: Element ID validation
    const elementsScore = this.validateElements(parsed.elements);

    // Stage 3: Config validation
    const configScore = this.validateConfigs(parsed.elements);

    // Stage 4: Connection validation
    const connectionsScore = this.validateConnections(parsed);

    // Stage 5: Semantic scoring
    const semanticScore = this.calculateSemanticScore(parsed);

    // Calculate overall score
    const schemaScore = schemaResult.valid ? 100 : 0;
    const score: QualityScore = {
      overall: Math.round(
        schemaScore * SCORE_WEIGHTS.schema +
        elementsScore * SCORE_WEIGHTS.elements +
        configScore * SCORE_WEIGHTS.config +
        connectionsScore * SCORE_WEIGHTS.connections +
        semanticScore * SCORE_WEIGHTS.semantic
      ),
      schema: schemaScore,
      elements: elementsScore,
      config: configScore,
      connections: connectionsScore,
      semantic: semanticScore,
    };

    return this.buildResult(
      score,
      parsed.elements.length,
      parsed.connections.length,
      startTime
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // STAGE 1: SCHEMA VALIDATION
  // ─────────────────────────────────────────────────────────────────

  private validateSchema(composition: unknown): { valid: boolean; data?: ToolComposition } {
    // Check for null/undefined
    if (composition === null || composition === undefined) {
      this.addError('INVALID_JSON', 'Composition is null or undefined', []);
      return { valid: false };
    }

    // Check it's an object
    if (typeof composition !== 'object') {
      this.addError('INVALID_JSON', `Expected object, got ${typeof composition}`, []);
      return { valid: false };
    }

    // Validate against schema
    const result = ToolCompositionSchema.safeParse(composition);

    if (!result.success) {
      // Convert Zod errors to validation errors
      for (const issue of result.error.issues) {
        const code = this.zodIssueToErrorCode(issue);
        this.addError(code, issue.message, issue.path.map(String));
      }
      return { valid: false };
    }

    return { valid: true, data: result.data as ToolComposition };
  }

  private zodIssueToErrorCode(issue: z.ZodIssue): ValidationErrorCode {
    switch (issue.code) {
      case 'invalid_type':
        return 'INVALID_FIELD_TYPE';
      case 'too_small':
      case 'too_big':
        return 'INVALID_CONFIG_VALUE';
      case 'invalid_enum_value':
        return 'INVALID_CONFIG_VALUE';
      default:
        return 'MISSING_REQUIRED_FIELD';
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // STAGE 2: ELEMENT ID VALIDATION
  // ─────────────────────────────────────────────────────────────────

  private validateElements(elements: CanvasElement[]): number {
    let validCount = 0;
    const seenInstanceIds = new Set<string>();
    const validElementIds = new Set(ELEMENT_IDS);

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      let isValid = true;

      // Check element ID exists in registry
      // Note: AI sometimes generates "poll-element-1" instead of "poll-element"
      const normalizedId = element.elementId?.replace(/-\d+$/, '');

      if (!element.elementId) {
        this.addError(
          'INVALID_ELEMENT_ID',
          'Element is missing elementId',
          ['elements', String(i), 'elementId']
        );
        isValid = false;
      } else if (!validElementIds.has(normalizedId) && !validElementIds.has(element.elementId)) {
        this.addError(
          'UNKNOWN_ELEMENT_TYPE',
          `Unknown element type: ${element.elementId}`,
          ['elements', String(i), 'elementId'],
          `Valid types: ${ELEMENT_IDS.slice(0, 5).join(', ')}...`
        );
        isValid = false;
      }

      // Check for duplicate instance IDs
      if (!element.instanceId) {
        this.addError(
          'DUPLICATE_INSTANCE_ID',
          'Element is missing instanceId',
          ['elements', String(i), 'instanceId']
        );
        isValid = false;
      } else if (seenInstanceIds.has(element.instanceId)) {
        this.addError(
          'DUPLICATE_INSTANCE_ID',
          `Duplicate instance ID: ${element.instanceId}`,
          ['elements', String(i), 'instanceId']
        );
        isValid = false;
      } else {
        seenInstanceIds.add(element.instanceId);
      }

      if (isValid) validCount++;
    }

    return elements.length > 0 ? Math.round((validCount / elements.length) * 100) : 100;
  }

  // ─────────────────────────────────────────────────────────────────
  // STAGE 3: CONFIG VALIDATION
  // ─────────────────────────────────────────────────────────────────

  private validateConfigs(elements: CanvasElement[]): number {
    let validCount = 0;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const normalizedId = element.elementId?.replace(/-\d+$/, '');
      const schema = ELEMENT_CONFIG_SCHEMAS[normalizedId] || ELEMENT_CONFIG_SCHEMAS[element.elementId];

      // No schema = permissive (count as valid)
      if (!schema) {
        validCount++;
        continue;
      }

      // Check required fields
      const requiredFields = getRequiredFields(normalizedId) || getRequiredFields(element.elementId) || [];
      let hasAllRequired = true;

      for (const field of requiredFields) {
        if (element.config?.[field] === undefined || element.config?.[field] === null) {
          this.addError(
            'MISSING_REQUIRED_CONFIG',
            `Missing required config field: ${field}`,
            ['elements', String(i), 'config', field],
            undefined,
            element.instanceId
          );
          hasAllRequired = false;
        }
      }

      // Validate against schema
      const result = schema.safeParse(element.config || {});

      if (!result.success) {
        // Only add warnings for non-required field errors
        for (const issue of result.error.issues) {
          const path = ['elements', String(i), 'config', ...issue.path.map(String)];

          if (!requiredFields.includes(String(issue.path[0]))) {
            this.addWarning('MISSING_OPTIONAL_CONFIG', issue.message, path, element.instanceId);
          } else if (hasAllRequired) {
            // Required field has invalid value
            this.addError(
              'INVALID_CONFIG_VALUE',
              issue.message,
              path,
              undefined,
              element.instanceId
            );
            hasAllRequired = false;
          }
        }
      }

      // Check for empty config
      if (!element.config || Object.keys(element.config).length === 0) {
        this.addWarning(
          'EMPTY_CONFIG',
          'Element has empty config, using defaults',
          ['elements', String(i), 'config'],
          element.instanceId
        );
      }

      if (hasAllRequired) validCount++;
    }

    return elements.length > 0 ? Math.round((validCount / elements.length) * 100) : 100;
  }

  // ─────────────────────────────────────────────────────────────────
  // STAGE 4: CONNECTION VALIDATION
  // ─────────────────────────────────────────────────────────────────

  private validateConnections(composition: ToolComposition): number {
    const connections = composition.connections || [];

    // No connections is valid (but maybe warn)
    if (connections.length === 0) {
      // Only warn if there are multiple elements that could be connected
      if (composition.elements.length > 1) {
        this.addWarning(
          'NO_CONNECTIONS',
          'Tool has multiple elements but no connections between them',
          ['connections']
        );
      }
      return 100;
    }

    const instanceIds = new Set(composition.elements.map(e => e.instanceId));
    let validCount = 0;

    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      let isValid = true;

      // Check source exists
      if (!conn.from?.instanceId || !instanceIds.has(conn.from.instanceId)) {
        this.addError(
          'ORPHAN_CONNECTION',
          `Connection source not found: ${conn.from?.instanceId || 'undefined'}`,
          ['connections', String(i), 'from', 'instanceId']
        );
        isValid = false;
      }

      // Check target exists
      if (!conn.to?.instanceId || !instanceIds.has(conn.to.instanceId)) {
        this.addError(
          'ORPHAN_CONNECTION',
          `Connection target not found: ${conn.to?.instanceId || 'undefined'}`,
          ['connections', String(i), 'to', 'instanceId']
        );
        isValid = false;
      }

      // Validate output/input ports if elements are valid
      if (isValid) {
        const sourceElement = composition.elements.find(e => e.instanceId === conn.from.instanceId);
        const targetElement = composition.elements.find(e => e.instanceId === conn.to.instanceId);

        if (sourceElement && targetElement) {
          const sourceSpec = getElementById(sourceElement.elementId?.replace(/-\d+$/, ''));
          const targetSpec = getElementById(targetElement.elementId?.replace(/-\d+$/, ''));

          // Check output port validity
          if (sourceSpec && conn.from.output) {
            if (!sourceSpec.outputs.includes(conn.from.output)) {
              this.addWarning(
                'SUBOPTIMAL_LAYOUT',
                `Output port "${conn.from.output}" may not exist on ${sourceElement.elementId}`,
                ['connections', String(i), 'from', 'output']
              );
            }
          }

          // Check input port validity
          if (targetSpec && conn.to.input) {
            if (!targetSpec.inputs.includes(conn.to.input)) {
              this.addWarning(
                'SUBOPTIMAL_LAYOUT',
                `Input port "${conn.to.input}" may not exist on ${targetElement.elementId}`,
                ['connections', String(i), 'to', 'input']
              );
            }
          }
        }
      }

      if (isValid) validCount++;
    }

    // Check for circular dependencies
    if (!this.isDAG(composition)) {
      this.addError(
        'CIRCULAR_DEPENDENCY',
        'Connection graph contains cycles',
        ['connections']
      );
      return Math.max(0, Math.round((validCount / connections.length) * 100) - 20);
    }

    return connections.length > 0 ? Math.round((validCount / connections.length) * 100) : 100;
  }

  /**
   * Check if connection graph is a DAG (directed acyclic graph)
   */
  private isDAG(composition: ToolComposition): boolean {
    const graph = new Map<string, string[]>();

    // Build adjacency list
    for (const conn of composition.connections || []) {
      if (conn.from?.instanceId && conn.to?.instanceId) {
        const edges = graph.get(conn.from.instanceId) || [];
        edges.push(conn.to.instanceId);
        graph.set(conn.from.instanceId, edges);
      }
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      for (const neighbor of graph.get(node) || []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node) && hasCycle(node)) {
        return false;
      }
    }

    return true;
  }

  // ─────────────────────────────────────────────────────────────────
  // STAGE 5: SEMANTIC SCORING
  // ─────────────────────────────────────────────────────────────────

  private calculateSemanticScore(composition: ToolComposition): number {
    let score = 100;
    const elementIds = composition.elements.map(e => e.elementId?.replace(/-\d+$/, ''));

    // Check for meaningful composition
    const hasInput = elementIds.some(id =>
      ['form-builder', 'search-input', 'poll-element', 'user-selector', 'date-picker'].includes(id!)
    );
    const hasDisplay = elementIds.some(id =>
      ['result-list', 'chart-display', 'leaderboard', 'tag-cloud', 'notification-center'].includes(id!)
    );

    // Penalize input+display without connections
    if (hasInput && hasDisplay && (composition.connections?.length || 0) === 0) {
      score -= 15;
      this.addWarning(
        'NO_CONNECTIONS',
        'Tool has input and display elements but no data flow between them',
        ['connections']
      );
    }

    // Penalize excessive element count
    if (composition.elements.length > 10) {
      score -= 10;
      this.addWarning(
        'EXCESSIVE_ELEMENTS',
        `Tool has ${composition.elements.length} elements, which may be over-engineered`,
        ['elements']
      );
    }

    // Reward balanced compositions
    if (hasInput && hasDisplay && (composition.connections?.length || 0) > 0) {
      score = Math.min(100, score + 5);
    }

    // Check for sensible element combinations
    const hasPoll = elementIds.includes('poll-element');
    const hasChart = elementIds.includes('chart-display');
    if (hasPoll && hasChart) {
      // Good: poll with visualization
      score = Math.min(100, score + 5);
    }

    // Check for duplicate element types (may indicate over-generation)
    const typeCounts = new Map<string, number>();
    for (const id of elementIds) {
      if (id) {
        typeCounts.set(id, (typeCounts.get(id) || 0) + 1);
      }
    }

    for (const [type, count] of typeCounts) {
      if (count > 2 && !['result-list', 'chart-display'].includes(type)) {
        score -= 5;
        this.addWarning(
          'SUBOPTIMAL_LAYOUT',
          `Element type "${type}" appears ${count} times, may be redundant`,
          ['elements']
        );
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────

  private addError(
    code: ValidationErrorCode,
    message: string,
    path: string[],
    suggestion?: string,
    relatedId?: string
  ): void {
    this.errors.push({
      code,
      message,
      path,
      severity: this.isCriticalError(code) ? 'critical' : 'error',
      suggestion,
      relatedId,
    });
  }

  private addWarning(
    code: ValidationWarningCode,
    message: string,
    path: string[],
    relatedId?: string
  ): void {
    this.warnings.push({
      code,
      message,
      path,
      relatedId,
    });
  }

  private isCriticalError(code: ValidationErrorCode): boolean {
    const criticalCodes: ValidationErrorCode[] = [
      'INVALID_JSON',
      'MISSING_REQUIRED_FIELD',
      'UNKNOWN_ELEMENT_TYPE',
      'CIRCULAR_DEPENDENCY',
    ];
    return criticalCodes.includes(code);
  }

  private buildResult(
    score: QualityScore,
    elementCount: number,
    connectionCount: number,
    startTime: number
  ): ValidationResult {
    const hasCriticalErrors = this.errors.some(e => e.severity === 'critical');

    return {
      valid: !hasCriticalErrors && score.overall >= 50,
      score,
      errors: this.errors,
      warnings: this.warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        elementCount,
        connectionCount,
        validatorVersion: VALIDATOR_VERSION,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════

/**
 * Default validator instance
 */
export const compositionValidator = new CompositionValidatorService();

/**
 * Get validator instance (alias for compositionValidator)
 */
export function getCompositionValidator(): CompositionValidatorService {
  return compositionValidator;
}

/**
 * Convenience function for one-off validation
 */
export function validateComposition(composition: unknown): ValidationResult {
  return compositionValidator.validate(composition);
}
