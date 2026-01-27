/**
 * Tool Composition Validation
 *
 * Validates tool structure at creation/update time:
 * - Element existence in registry
 * - Config validation against schemas
 * - Connection validity (ports, types)
 * - Cycle detection (DAG requirement)
 *
 * This catches invalid compositions early rather than at runtime.
 */

import { z } from 'zod';
import { getElementById } from '../element-registry';
import { getElementConfigSchema } from './element-schemas';

// =============================================================================
// Types
// =============================================================================

export interface CanvasElementForValidation {
  elementId: string;
  instanceId: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface ConnectionForValidation {
  id?: string;
  from: { instanceId: string; port?: string; output?: string };
  to: { instanceId: string; port?: string; input?: string };
}

export interface CompositionValidationResult {
  valid: boolean;
  errors: CompositionError[];
  warnings: CompositionWarning[];
}

export interface CompositionError {
  code: CompositionErrorCode;
  message: string;
  elementId?: string;
  instanceId?: string;
  connectionIndex?: number;
}

export interface CompositionWarning {
  code: CompositionWarningCode;
  message: string;
  elementId?: string;
  instanceId?: string;
}

export type CompositionErrorCode =
  | 'UNKNOWN_ELEMENT'
  | 'INVALID_CONFIG'
  | 'INVALID_CONNECTION_SOURCE'
  | 'INVALID_CONNECTION_TARGET'
  | 'INVALID_PORT'
  | 'CYCLE_DETECTED'
  | 'DUPLICATE_INSTANCE_ID'
  | 'MISSING_REQUIRED_CONFIG';

export type CompositionWarningCode =
  | 'UNUSED_ELEMENT'
  | 'DISCONNECTED_OUTPUT'
  | 'EMPTY_CONFIG'
  | 'DEPRECATED_ELEMENT';

// =============================================================================
// Main Validation Function
// =============================================================================

/**
 * Validate a tool composition before saving to Firestore.
 * This ensures tools are structurally valid at creation time.
 */
export function validateToolComposition(
  elements: CanvasElementForValidation[],
  connections: ConnectionForValidation[]
): CompositionValidationResult {
  const errors: CompositionError[] = [];
  const warnings: CompositionWarning[] = [];

  // Build lookup maps
  const instanceMap = new Map<string, CanvasElementForValidation>();
  const instanceIds = new Set<string>();

  // 1. Validate elements
  for (const element of elements) {
    // Check for duplicate instance IDs
    if (instanceIds.has(element.instanceId)) {
      errors.push({
        code: 'DUPLICATE_INSTANCE_ID',
        message: `Duplicate instance ID: ${element.instanceId}`,
        instanceId: element.instanceId,
      });
      continue;
    }
    instanceIds.add(element.instanceId);
    instanceMap.set(element.instanceId, element);

    // Check element exists in registry
    const definition = getElementById(element.elementId);
    if (!definition) {
      errors.push({
        code: 'UNKNOWN_ELEMENT',
        message: `Unknown element type: ${element.elementId}`,
        elementId: element.elementId,
        instanceId: element.instanceId,
      });
      continue;
    }

    // Validate config against schema
    const schema = getElementConfigSchema(element.elementId);
    if (schema && element.config) {
      const result = schema.safeParse(element.config);
      if (!result.success) {
        const issues = result.error.issues
          .map(i => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        errors.push({
          code: 'INVALID_CONFIG',
          message: `Invalid config for ${element.elementId}: ${issues}`,
          elementId: element.elementId,
          instanceId: element.instanceId,
        });
      }
    }

    // Warn about empty config for elements that need configuration
    if (!element.config || Object.keys(element.config).length === 0) {
      const requiresConfig = ['poll-element', 'countdown-timer', 'rsvp-button', 'form-builder'];
      if (requiresConfig.includes(element.elementId)) {
        warnings.push({
          code: 'EMPTY_CONFIG',
          message: `Element "${element.elementId}" has no configuration - it may not function correctly`,
          elementId: element.elementId,
          instanceId: element.instanceId,
        });
      }
    }
  }

  // 2. Validate connections
  const connectedInstances = new Set<string>();

  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];

    // Check source exists
    if (!instanceMap.has(conn.from.instanceId)) {
      errors.push({
        code: 'INVALID_CONNECTION_SOURCE',
        message: `Connection source not found: ${conn.from.instanceId}`,
        instanceId: conn.from.instanceId,
        connectionIndex: i,
      });
    } else {
      connectedInstances.add(conn.from.instanceId);

      // Validate output port exists
      const sourceElement = instanceMap.get(conn.from.instanceId)!;
      const sourceDef = getElementById(sourceElement.elementId);
      if (sourceDef) {
        const outputs = (sourceDef as { outputs?: string[] }).outputs || [];
        const outputPort = conn.from.port || conn.from.output || 'output';
        if (outputs.length > 0 && !outputs.includes(outputPort) && outputPort !== 'output') {
          warnings.push({
            code: 'DISCONNECTED_OUTPUT',
            message: `Port "${outputPort}" not found on element "${sourceElement.elementId}"`,
            elementId: sourceElement.elementId,
            instanceId: conn.from.instanceId,
          });
        }
      }
    }

    // Check target exists
    if (!instanceMap.has(conn.to.instanceId)) {
      errors.push({
        code: 'INVALID_CONNECTION_TARGET',
        message: `Connection target not found: ${conn.to.instanceId}`,
        instanceId: conn.to.instanceId,
        connectionIndex: i,
      });
    } else {
      connectedInstances.add(conn.to.instanceId);
    }
  }

  // 3. Check for cycles (DAG validation)
  if (connections.length > 0 && errors.filter(e => e.code.startsWith('INVALID_CONNECTION')).length === 0) {
    const cycleResult = detectCycles(connections, [...instanceIds]);
    if (cycleResult.hasCycle) {
      errors.push({
        code: 'CYCLE_DETECTED',
        message: `Cycle detected in connections: ${cycleResult.cyclePath.join(' -> ')}`,
      });
    }
  }

  // 4. Warn about unused elements (not connected to anything)
  if (connections.length > 0) {
    for (const instanceId of instanceIds) {
      if (!connectedInstances.has(instanceId)) {
        const element = instanceMap.get(instanceId)!;
        warnings.push({
          code: 'UNUSED_ELEMENT',
          message: `Element "${element.elementId}" (${instanceId}) is not connected to any other element`,
          elementId: element.elementId,
          instanceId: instanceId,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Cycle Detection (DFS-based)
// =============================================================================

interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath: string[];
}

function detectCycles(
  connections: ConnectionForValidation[],
  nodeIds: string[]
): CycleDetectionResult {
  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, []);
  }

  for (const conn of connections) {
    const edges = adjacency.get(conn.from.instanceId) || [];
    edges.push(conn.to.instanceId);
    adjacency.set(conn.from.instanceId, edges);
  }

  // DFS with color marking: 0 = unvisited, 1 = in progress, 2 = finished
  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();

  for (const nodeId of nodeIds) {
    color.set(nodeId, 0);
    parent.set(nodeId, null);
  }

  function dfs(node: string, path: string[]): string[] | null {
    color.set(node, 1); // Mark as in progress
    path.push(node);

    for (const neighbor of adjacency.get(node) || []) {
      if (color.get(neighbor) === 1) {
        // Found cycle - return path from neighbor to current
        const cycleStart = path.indexOf(neighbor);
        return [...path.slice(cycleStart), neighbor];
      }

      if (color.get(neighbor) === 0) {
        const result = dfs(neighbor, path);
        if (result) return result;
      }
    }

    color.set(node, 2); // Mark as finished
    path.pop();
    return null;
  }

  for (const nodeId of nodeIds) {
    if (color.get(nodeId) === 0) {
      const cyclePath = dfs(nodeId, []);
      if (cyclePath) {
        return { hasCycle: true, cyclePath };
      }
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

// =============================================================================
// Quick Validation Helpers
// =============================================================================

/**
 * Quick check if a single element is valid (for real-time validation)
 */
export function validateElement(
  elementId: string,
  config?: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const definition = getElementById(elementId);
  if (!definition) {
    errors.push(`Unknown element type: ${elementId}`);
    return { valid: false, errors };
  }

  if (config) {
    const schema = getElementConfigSchema(elementId);
    if (schema) {
      const result = schema.safeParse(config);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors.push(`${issue.path.join('.')}: ${issue.message}`);
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a connection is valid
 */
export function validateConnection(
  conn: ConnectionForValidation,
  elements: CanvasElementForValidation[]
): { valid: boolean; error?: string } {
  const sourceElement = elements.find(e => e.instanceId === conn.from.instanceId);
  const targetElement = elements.find(e => e.instanceId === conn.to.instanceId);

  if (!sourceElement) {
    return { valid: false, error: `Source element not found: ${conn.from.instanceId}` };
  }

  if (!targetElement) {
    return { valid: false, error: `Target element not found: ${conn.to.instanceId}` };
  }

  // Self-connections are not allowed
  if (conn.from.instanceId === conn.to.instanceId) {
    return { valid: false, error: 'Self-connections are not allowed' };
  }

  return { valid: true };
}
