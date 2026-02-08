/**
 * Tool Validation for Publishing
 *
 * Validates tool compositions before publish submission.
 * Catches real problems: missing config, hallucinated element types,
 * broken connections, empty content.
 */

import { getElementById, ELEMENT_IDS } from '@hive/core';

export interface ValidationError {
  field: string;
  message: string;
  elementId?: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ToolElement {
  elementId: string;
  instanceId?: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

interface ToolConnection {
  from: { instanceId: string; port?: string; output?: string };
  to: { instanceId: string; port?: string; input?: string };
}

interface ToolData {
  name?: string;
  elements?: ToolElement[];
  connections?: ToolConnection[];
  config?: {
    composition?: {
      elements?: ToolElement[];
      connections?: ToolConnection[];
    };
  };
}

/**
 * Normalize element ID by stripping numeric suffixes.
 * AI generation might add suffixes like "-1", "-2".
 */
function normalizeElementId(elementId: string): string {
  return elementId.replace(/-\d+$/, '');
}

/**
 * Validate a tool for publishing.
 * Returns all errors found, not just the first one.
 */
export function validateToolForPublish(tool: ToolData): ValidationResult {
  const errors: ValidationError[] = [];

  // Get elements from either nested composition or flat structure
  const elements = tool.config?.composition?.elements || tool.elements || [];
  const connections = tool.config?.composition?.connections || tool.connections || [];

  // 1. Tool must have a name
  if (!tool.name || tool.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Tool must have a name',
      severity: 'error',
    });
  }

  // 2. At least one element exists
  if (elements.length === 0) {
    errors.push({
      field: 'elements',
      message: 'Tool must have at least one element',
      severity: 'error',
    });
    // Return early - no point validating elements if there are none
    return { valid: false, errors };
  }

  // Build a set of all instanceIds for connection validation
  const instanceIds = new Set<string>();
  for (const el of elements) {
    if (el.instanceId) {
      instanceIds.add(el.instanceId);
    }
  }

  // 3. Validate each element
  for (const el of elements) {
    const normalizedId = normalizeElementId(el.elementId);
    const elementLabel = el.instanceId || el.elementId;

    // 3a. Element type must exist in registry
    if (!ELEMENT_IDS.includes(normalizedId)) {
      errors.push({
        field: 'elementType',
        message: `Unknown element type "${el.elementId}". This element type does not exist in the registry.`,
        elementId: elementLabel,
        severity: 'error',
      });
      continue; // Skip further checks for unknown elements
    }

    // 3b. Check required config fields from the element registry
    const spec = getElementById(normalizedId);
    if (spec && spec.configSchema) {
      for (const [key, schema] of Object.entries(spec.configSchema)) {
        const fieldSchema = schema as Record<string, unknown>;
        if (fieldSchema.required === true) {
          const value = el.config?.[key];
          if (value === undefined || value === null || value === '') {
            errors.push({
              field: `config.${key}`,
              message: `"${spec.name}" requires "${key}" to be configured`,
              elementId: elementLabel,
              severity: 'error',
            });
          }
        }
      }
    }

    // 3c. Poll-specific: must have at least 2 options
    if (normalizedId === 'poll-element') {
      const options = el.config?.options;
      if (!Array.isArray(options) || options.length < 2) {
        errors.push({
          field: 'config.options',
          message: 'Poll must have at least 2 options',
          elementId: elementLabel,
          severity: 'error',
        });
      }
      if (!el.config?.question || String(el.config.question).trim().length === 0) {
        errors.push({
          field: 'config.question',
          message: 'Poll must have a question',
          elementId: elementLabel,
          severity: 'error',
        });
      }
    }

    // 3d. Countdown timer: must have a target date
    if (normalizedId === 'countdown-timer') {
      if (!el.config?.targetDate) {
        errors.push({
          field: 'config.targetDate',
          message: 'Countdown timer must have a target date',
          elementId: elementLabel,
          severity: 'error',
        });
      }
    }

    // 3e. Signup sheet: must have at least 1 slot
    if (normalizedId === 'signup-sheet') {
      const slots = el.config?.slots;
      if (!Array.isArray(slots) || slots.length < 1) {
        errors.push({
          field: 'config.slots',
          message: 'Signup sheet must have at least 1 slot',
          elementId: elementLabel,
          severity: 'error',
        });
      }
    }

    // 3f. RSVP: must have an event name
    if (normalizedId === 'rsvp-button') {
      if (!el.config?.eventName || String(el.config.eventName).trim().length === 0) {
        errors.push({
          field: 'config.eventName',
          message: 'RSVP button must have an event name',
          elementId: elementLabel,
          severity: 'warning',
        });
      }
    }
  }

  // 4. Validate connections reference existing elements
  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    if (!conn) continue;

    const fromId = conn.from?.instanceId;
    const toId = conn.to?.instanceId;

    if (fromId && !instanceIds.has(fromId)) {
      errors.push({
        field: `connections[${i}].from`,
        message: `Connection references non-existent element "${fromId}"`,
        severity: 'error',
      });
    }

    if (toId && !instanceIds.has(toId)) {
      errors.push({
        field: `connections[${i}].to`,
        message: `Connection references non-existent element "${toId}"`,
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}
