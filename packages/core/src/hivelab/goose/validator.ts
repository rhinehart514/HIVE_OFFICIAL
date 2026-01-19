/**
 * Goose Output Validator
 *
 * Validates model-generated tool compositions against element schemas.
 * Ensures outputs are structurally correct and semantically valid.
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitized?: ToolComposition;
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  elementId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface ToolComposition {
  elements: CanvasElement[];
  connections: Connection[];
  name: string;
  description: string;
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

export interface CanvasElement {
  type: string;
  instanceId: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Connection {
  from: { instanceId: string; port: string };
  to: { instanceId: string; port: string };
}

// ═══════════════════════════════════════════════════════════════════
// VALID ELEMENT TYPES
// ═══════════════════════════════════════════════════════════════════

export const VALID_ELEMENT_TYPES = [
  // Input elements
  'search-input',
  'date-picker',
  'user-selector',
  'form-builder',
  // Filter elements
  'filter-selector',
  // Display elements
  'result-list',
  'chart-display',
  'tag-cloud',
  'map-view',
  'notification-center',
  // Action elements
  'poll-element',
  'rsvp-button',
  'countdown-timer',
  'leaderboard',
  'counter',
  'timer',
  // Layout elements
  'role-gate',
  // Connected elements
  'event-picker',
  'space-picker',
  'connection-list',
  // Space elements
  'member-list',
  'member-selector',
  'space-events',
  'space-feed',
  'space-stats',
  'announcement',
  'availability-heatmap',
] as const;

export type ValidElementType = typeof VALID_ELEMENT_TYPES[number];

// ═══════════════════════════════════════════════════════════════════
// ELEMENT OUTPUT/INPUT SPECS
// ═══════════════════════════════════════════════════════════════════

export const ELEMENT_PORTS: Record<string, { outputs: string[]; inputs: string[] }> = {
  'search-input': { outputs: ['query', 'searchTerm'], inputs: [] },
  'date-picker': { outputs: ['selectedDate', 'dateRange'], inputs: [] },
  'user-selector': { outputs: ['selectedUsers', 'userIds'], inputs: [] },
  'form-builder': { outputs: ['formData', 'submittedData'], inputs: [] },
  'filter-selector': { outputs: ['selectedFilters', 'filters'], inputs: [] },
  'result-list': { outputs: [], inputs: ['items'] },
  'chart-display': { outputs: [], inputs: ['data'] },
  'tag-cloud': { outputs: ['selectedTag', 'tags'], inputs: ['tags'] },
  'map-view': { outputs: ['selectedLocation', 'markers'], inputs: ['locations'] },
  'notification-center': { outputs: ['unreadCount', 'notifications'], inputs: [] },
  'poll-element': { outputs: ['results', 'totalVotes'], inputs: [] },
  'rsvp-button': { outputs: ['attendees', 'waitlist', 'count'], inputs: [] },
  'countdown-timer': { outputs: ['remaining', 'isComplete'], inputs: [] },
  'leaderboard': { outputs: ['rankings', 'topScorer'], inputs: ['entries'] },
  'counter': { outputs: ['value'], inputs: [] },
  'timer': { outputs: ['elapsed', 'isRunning', 'laps'], inputs: [] },
  'role-gate': { outputs: ['hasAccess', 'userRole'], inputs: ['content'] },
  'event-picker': { outputs: ['selectedEvent', 'eventId'], inputs: [] },
  'space-picker': { outputs: ['selectedSpace', 'spaceId'], inputs: [] },
  'connection-list': { outputs: ['connections'], inputs: ['userId'] },
  'member-list': { outputs: ['members', 'selectedMember'], inputs: ['spaceId'] },
  'member-selector': { outputs: ['selectedMembers', 'memberIds'], inputs: ['spaceId'] },
  'space-events': { outputs: ['events', 'upcomingCount'], inputs: ['spaceId'] },
  'space-feed': { outputs: ['posts', 'hasMore'], inputs: ['spaceId'] },
  'space-stats': { outputs: ['stats', 'trends'], inputs: ['spaceId'] },
  'announcement': { outputs: ['announcementId', 'viewCount'], inputs: ['content', 'spaceId'] },
  'availability-heatmap': { outputs: ['selectedSlot', 'bestTimes', 'connectedMemberCount'], inputs: ['spaceId'] },
};

// ═══════════════════════════════════════════════════════════════════
// REQUIRED CONFIG FIELDS
// ═══════════════════════════════════════════════════════════════════

export const REQUIRED_CONFIG_FIELDS: Record<string, string[]> = {
  'poll-element': ['question', 'options'],
  'rsvp-button': ['eventName'],
  'countdown-timer': ['targetDate'],
  'chart-display': ['chartType'],
};

// ═══════════════════════════════════════════════════════════════════
// ZOD SCHEMAS
// ═══════════════════════════════════════════════════════════════════

const PositionSchema = z.object({
  x: z.number().min(0).max(2000),
  y: z.number().min(0).max(5000),
});

const SizeSchema = z.object({
  width: z.number().min(50).max(1000),
  height: z.number().min(30).max(800),
});

const CanvasElementSchema = z.object({
  type: z.string().min(1),
  instanceId: z.string().min(1),
  config: z.record(z.unknown()),
  position: PositionSchema,
  size: SizeSchema,
});

const ConnectionSchema = z.object({
  from: z.object({
    instanceId: z.string().min(1),
    port: z.string().min(1),
  }),
  to: z.object({
    instanceId: z.string().min(1),
    port: z.string().min(1),
  }),
});

const ToolCompositionSchema = z.object({
  elements: z.array(CanvasElementSchema).min(1).max(20),
  connections: z.array(ConnectionSchema),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  layout: z.enum(['grid', 'flow', 'tabs', 'sidebar']),
});

// ═══════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate a complete tool composition
 */
export function validateToolComposition(composition: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Step 1: Schema validation
  const schemaResult = ToolCompositionSchema.safeParse(composition);
  if (!schemaResult.success) {
    for (const issue of schemaResult.error.issues) {
      errors.push({
        code: 'SCHEMA_ERROR',
        message: issue.message,
        path: issue.path.join('.'),
      });
    }
    return { valid: false, errors, warnings };
  }

  const comp = schemaResult.data;

  // Step 2: Validate element types
  for (const element of comp.elements) {
    if (!VALID_ELEMENT_TYPES.includes(element.type as ValidElementType)) {
      errors.push({
        code: 'INVALID_ELEMENT_TYPE',
        message: `Unknown element type: ${element.type}`,
        elementId: element.instanceId,
      });
    }
  }

  // Step 3: Validate required config fields
  for (const element of comp.elements) {
    const requiredFields = REQUIRED_CONFIG_FIELDS[element.type] || [];
    for (const field of requiredFields) {
      if (!(field in element.config) || element.config[field] === undefined || element.config[field] === null) {
        errors.push({
          code: 'MISSING_REQUIRED_CONFIG',
          message: `Element ${element.type} requires config field: ${field}`,
          elementId: element.instanceId,
          path: `config.${field}`,
        });
      }
    }
  }

  // Step 4: Validate unique instance IDs
  const instanceIds = comp.elements.map(e => e.instanceId);
  const duplicateIds = instanceIds.filter((id, index) => instanceIds.indexOf(id) !== index);
  for (const dupId of duplicateIds) {
    errors.push({
      code: 'DUPLICATE_INSTANCE_ID',
      message: `Duplicate instance ID: ${dupId}`,
      elementId: dupId,
    });
  }

  // Step 5: Validate connections
  for (const connection of comp.connections) {
    // Check source element exists
    const fromElement = comp.elements.find(e => e.instanceId === connection.from.instanceId);
    if (!fromElement) {
      errors.push({
        code: 'INVALID_CONNECTION_SOURCE',
        message: `Connection source element not found: ${connection.from.instanceId}`,
      });
      continue;
    }

    // Check target element exists
    const toElement = comp.elements.find(e => e.instanceId === connection.to.instanceId);
    if (!toElement) {
      errors.push({
        code: 'INVALID_CONNECTION_TARGET',
        message: `Connection target element not found: ${connection.to.instanceId}`,
      });
      continue;
    }

    // Check port validity
    const fromPorts = ELEMENT_PORTS[fromElement.type];
    if (fromPorts && !fromPorts.outputs.includes(connection.from.port)) {
      warnings.push({
        code: 'INVALID_OUTPUT_PORT',
        message: `Element ${fromElement.type} does not have output port: ${connection.from.port}`,
        suggestion: `Valid outputs: ${fromPorts.outputs.join(', ') || 'none'}`,
      });
    }

    const toPorts = ELEMENT_PORTS[toElement.type];
    if (toPorts && !toPorts.inputs.includes(connection.to.port)) {
      warnings.push({
        code: 'INVALID_INPUT_PORT',
        message: `Element ${toElement.type} does not have input port: ${connection.to.port}`,
        suggestion: `Valid inputs: ${toPorts.inputs.join(', ') || 'none'}`,
      });
    }
  }

  // Step 6: Check for circular connections
  const circularCheck = detectCircularConnections(comp.connections as Connection[]);
  if (circularCheck) {
    errors.push({
      code: 'CIRCULAR_CONNECTION',
      message: `Circular connection detected: ${circularCheck}`,
    });
  }

  // Generate warnings for common issues
  if (comp.elements.length === 1 && comp.connections.length > 0) {
    warnings.push({
      code: 'UNNECESSARY_CONNECTIONS',
      message: 'Single element has connections (connections require multiple elements)',
    });
  }

  // Check for overlapping positions
  for (let i = 0; i < comp.elements.length; i++) {
    for (let j = i + 1; j < comp.elements.length; j++) {
      const el1 = comp.elements[i];
      const el2 = comp.elements[j];
      if (
        Math.abs(el1.position.x - el2.position.x) < 50 &&
        Math.abs(el1.position.y - el2.position.y) < 50
      ) {
        warnings.push({
          code: 'OVERLAPPING_ELEMENTS',
          message: `Elements ${el1.instanceId} and ${el2.instanceId} may overlap`,
          suggestion: 'Consider adjusting positions',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: errors.length === 0 ? (comp as ToolComposition) : undefined,
  };
}

/**
 * Detect circular connections in the graph
 */
function detectCircularConnections(connections: Connection[]): string | null {
  const graph: Record<string, string[]> = {};

  for (const conn of connections) {
    if (!graph[conn.from.instanceId]) {
      graph[conn.from.instanceId] = [];
    }
    graph[conn.from.instanceId].push(conn.to.instanceId);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  function hasCycle(node: string, path: string[]): string | null {
    if (stack.has(node)) {
      return [...path, node].join(' -> ');
    }
    if (visited.has(node)) {
      return null;
    }

    visited.add(node);
    stack.add(node);

    for (const neighbor of graph[node] || []) {
      const cycle = hasCycle(neighbor, [...path, node]);
      if (cycle) return cycle;
    }

    stack.delete(node);
    return null;
  }

  for (const node of Object.keys(graph)) {
    const cycle = hasCycle(node, []);
    if (cycle) return cycle;
  }

  return null;
}

/**
 * Quick validation for element type only
 */
export function isValidElementType(type: string): type is ValidElementType {
  return VALID_ELEMENT_TYPES.includes(type as ValidElementType);
}

/**
 * Validate a single element
 */
export function validateElement(element: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const result = CanvasElementSchema.safeParse(element);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        code: 'ELEMENT_SCHEMA_ERROR',
        message: issue.message,
        path: issue.path.join('.'),
      });
    }
    return { valid: false, errors, warnings };
  }

  const el = result.data;

  if (!isValidElementType(el.type)) {
    errors.push({
      code: 'INVALID_ELEMENT_TYPE',
      message: `Unknown element type: ${el.type}`,
    });
  }

  const requiredFields = REQUIRED_CONFIG_FIELDS[el.type] || [];
  for (const field of requiredFields) {
    if (!(field in el.config)) {
      errors.push({
        code: 'MISSING_REQUIRED_CONFIG',
        message: `Missing required config field: ${field}`,
        path: `config.${field}`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Sanitize and fix common issues in a composition
 */
export function sanitizeComposition(composition: ToolComposition): ToolComposition {
  const sanitized = { ...composition };

  // Ensure unique instance IDs
  const usedIds = new Set<string>();
  sanitized.elements = composition.elements.map((el, index) => {
    let instanceId = el.instanceId;
    if (usedIds.has(instanceId)) {
      instanceId = `${el.type.replace(/-/g, '_')}_${index + 1}`;
    }
    usedIds.add(instanceId);
    return { ...el, instanceId };
  });

  // Fix overlapping positions
  for (let i = 1; i < sanitized.elements.length; i++) {
    const prev = sanitized.elements[i - 1];
    const curr = sanitized.elements[i];

    if (
      Math.abs(curr.position.x - prev.position.x) < 100 &&
      Math.abs(curr.position.y - prev.position.y) < 100
    ) {
      // Move element to next column/row
      const col = i % 2;
      const row = Math.floor(i / 2);
      sanitized.elements[i] = {
        ...curr,
        position: {
          x: 100 + col * 340,
          y: 100 + row * 250,
        },
      };
    }
  }

  // Remove invalid connections
  const validInstanceIds = new Set(sanitized.elements.map(e => e.instanceId));
  sanitized.connections = composition.connections.filter(
    conn => validInstanceIds.has(conn.from.instanceId) && validInstanceIds.has(conn.to.instanceId)
  );

  // Ensure name and description
  if (!sanitized.name) {
    sanitized.name = 'Untitled Tool';
  }
  if (!sanitized.description) {
    sanitized.description = `Tool with ${sanitized.elements.length} element(s)`;
  }

  return sanitized;
}

/**
 * Parse raw model output (handles common JSON issues)
 */
export function parseModelOutput(output: string): ToolComposition | null {
  // Try direct JSON parse
  try {
    return JSON.parse(output);
  } catch {
    // Continue to try fixes
  }

  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Try to find JSON object in text
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Continue
    }
  }

  return null;
}

export default {
  validateToolComposition,
  validateElement,
  sanitizeComposition,
  parseModelOutput,
  isValidElementType,
  VALID_ELEMENT_TYPES,
  ELEMENT_PORTS,
  REQUIRED_CONFIG_FIELDS,
};
