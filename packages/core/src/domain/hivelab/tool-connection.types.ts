/**
 * HiveLab Tool Connection Types
 *
 * Sprint 3: Tool-to-Tool Connections
 *
 * Enables tools to become composable services where data flows between
 * tools without manual copying. Example: Dues Tracker → Voting Tool eligibility.
 */

// ============================================================================
// Data Transforms
// ============================================================================

/**
 * Available transforms for data flowing through connections.
 * Transforms convert source data to match target input requirements.
 */
export type DataTransform =
  | 'toArray'     // Convert object values to array
  | 'toCount'     // Convert to numeric count
  | 'toBoolean'   // Convert to boolean (truthy check)
  | 'toSorted'    // Sort array alphabetically/numerically
  | 'toTop5'      // Take first 5 items
  | 'toKeys'      // Extract object keys as array
  | 'toValues'    // Extract object values as array
  | 'flatten'     // Flatten nested array one level
  | 'unique';     // Remove duplicates from array

/**
 * Metadata about a transform function
 */
export interface TransformMetadata {
  name: DataTransform;
  label: string;
  description: string;
  inputType: 'any' | 'object' | 'array' | 'number' | 'string';
  outputType: 'array' | 'number' | 'boolean' | 'string';
}

/**
 * Registry of available transforms with their metadata
 */
export const DATA_TRANSFORMS: Record<DataTransform, TransformMetadata> = {
  toArray: {
    name: 'toArray',
    label: 'To Array',
    description: 'Convert object values or single value to array',
    inputType: 'any',
    outputType: 'array',
  },
  toCount: {
    name: 'toCount',
    label: 'To Count',
    description: 'Get the count of items',
    inputType: 'any',
    outputType: 'number',
  },
  toBoolean: {
    name: 'toBoolean',
    label: 'To Boolean',
    description: 'Convert to true/false based on existence',
    inputType: 'any',
    outputType: 'boolean',
  },
  toSorted: {
    name: 'toSorted',
    label: 'Sorted',
    description: 'Sort items alphabetically or numerically',
    inputType: 'array',
    outputType: 'array',
  },
  toTop5: {
    name: 'toTop5',
    label: 'Top 5',
    description: 'Take only the first 5 items',
    inputType: 'array',
    outputType: 'array',
  },
  toKeys: {
    name: 'toKeys',
    label: 'Keys Only',
    description: 'Extract object keys as an array',
    inputType: 'object',
    outputType: 'array',
  },
  toValues: {
    name: 'toValues',
    label: 'Values Only',
    description: 'Extract object values as an array',
    inputType: 'object',
    outputType: 'array',
  },
  flatten: {
    name: 'flatten',
    label: 'Flatten',
    description: 'Flatten nested arrays one level deep',
    inputType: 'array',
    outputType: 'array',
  },
  unique: {
    name: 'unique',
    label: 'Unique',
    description: 'Remove duplicate values',
    inputType: 'array',
    outputType: 'array',
  },
};

// ============================================================================
// Tool Output Types
// ============================================================================

/**
 * Data type for tool outputs and connection inputs
 */
export type ConnectionDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'memberList'    // Array of member IDs
  | 'counter'       // Numeric counter value
  | 'collection'    // Key-value collection
  | 'timeline'      // Ordered event list
  | 'any';          // Accepts any type

/**
 * Describes a discoverable output from a tool.
 * Used to populate the "Other Tools" panel in the IDE.
 */
export interface ToolOutput {
  /** Path to the output value (e.g., "sharedState.counters.paid") */
  path: string;
  /** Human-readable name for this output */
  name: string;
  /** Description of what this output contains */
  description: string;
  /** Data type of this output */
  type: ConnectionDataType;
  /** Whether this output updates in real-time */
  realtime: boolean;
}

/**
 * Summary of a tool's available outputs for connection discovery
 */
export interface ToolOutputManifest {
  deploymentId: string;
  toolName: string;
  spaceId: string;
  outputs: ToolOutput[];
  /** Last time outputs were computed */
  computedAt: string;
}

// ============================================================================
// Connection Source & Target
// ============================================================================

/**
 * Source endpoint for a connection - where data comes FROM
 */
export interface ToolConnectionSource {
  /** Deployment ID of the source tool */
  deploymentId: string;
  /** Path to the data in source tool (e.g., "sharedState.collections.paidMembers") */
  path: string;
}

/**
 * Target endpoint for a connection - where data goes TO
 */
export interface ToolConnectionTarget {
  /** Deployment ID of the target tool */
  deploymentId: string;
  /** Element instance ID that receives the data */
  elementId: string;
  /** Path to the input property on the element config */
  inputPath: string;
}

// ============================================================================
// Tool Connection
// ============================================================================

/**
 * Connection between two tools within a space.
 * Stored at: spaces/{spaceId}/toolConnections/{connectionId}
 */
export interface ToolConnection {
  /** Unique connection ID */
  id: string;

  /** Space this connection belongs to */
  spaceId: string;

  /** Source tool and data path */
  source: ToolConnectionSource;

  /** Target tool, element, and input path */
  target: ToolConnectionTarget;

  /** Optional transform to apply to source data */
  transform?: DataTransform;

  /** Whether this connection is active */
  enabled: boolean;

  /** Creation timestamp (ISO string) */
  createdAt: string;

  /** User ID who created this connection */
  createdBy: string;

  /** Last update timestamp (ISO string) */
  updatedAt?: string;

  /** Optional description/label for this connection */
  label?: string;
}

/**
 * DTO for creating a new connection
 */
export interface CreateConnectionDTO {
  source: ToolConnectionSource;
  target: ToolConnectionTarget;
  transform?: DataTransform;
  label?: string;
}

/**
 * DTO for updating an existing connection
 */
export interface UpdateConnectionDTO {
  enabled?: boolean;
  transform?: DataTransform;
  label?: string;
}

// ============================================================================
// Connection Resolution
// ============================================================================

/**
 * Status of a resolved connection
 */
export type ConnectionStatus =
  | 'connected'     // Successfully resolved
  | 'error'         // Failed to resolve
  | 'stale'         // Cached value may be outdated
  | 'pending';      // Not yet resolved

/**
 * Result of resolving a single connection
 */
export interface ResolvedConnection {
  connectionId: string;
  status: ConnectionStatus;
  /** The resolved value from the source tool */
  value: unknown;
  /** Error message if status is 'error' */
  error?: string;
  /** When this value was resolved */
  resolvedAt: string;
  /** Time-to-live for caching (milliseconds) */
  ttl: number;
}

/**
 * All resolved connections for a tool, keyed by target elementId + inputPath
 */
export interface ResolvedConnections {
  /** Map of "elementId:inputPath" -> resolved value */
  values: Record<string, ResolvedConnection>;
  /** When resolution was performed */
  resolvedAt: string;
  /** How many connections were resolved */
  count: number;
  /** How many had errors */
  errorCount: number;
}

// ============================================================================
// Connection Validation
// ============================================================================

/**
 * Result of validating a connection
 */
export interface ConnectionValidationResult {
  valid: boolean;
  errors: ConnectionValidationError[];
  warnings: ConnectionValidationWarning[];
}

export interface ConnectionValidationError {
  code: ConnectionErrorCode;
  message: string;
  field?: 'source' | 'target' | 'transform';
}

export interface ConnectionValidationWarning {
  code: ConnectionWarningCode;
  message: string;
}

export type ConnectionErrorCode =
  | 'SOURCE_NOT_FOUND'       // Source deployment doesn't exist
  | 'TARGET_NOT_FOUND'       // Target deployment doesn't exist
  | 'PATH_NOT_FOUND'         // Path doesn't exist on source
  | 'ELEMENT_NOT_FOUND'      // Element doesn't exist on target
  | 'TYPE_MISMATCH'          // Source type incompatible with target
  | 'CIRCULAR_CONNECTION'    // Would create circular dependency
  | 'CROSS_SPACE'            // Source and target in different spaces
  | 'PERMISSION_DENIED';     // User can't access one of the tools

export type ConnectionWarningCode =
  | 'TRANSFORM_LOSSY'        // Transform may lose data
  | 'HIGH_CARDINALITY'       // Source has many items
  | 'STALE_SOURCE';          // Source tool hasn't been updated recently

// ============================================================================
// Constants
// ============================================================================

/** Maximum connections a single tool can have */
export const MAX_CONNECTIONS_PER_TOOL = 20;

/**
 * COST OPTIMIZATION: Cache TTL for resolved connections
 *
 * Default: 5 minutes (up from 30 seconds)
 * Counters and static data rarely need real-time updates.
 * For tools that need fresher data, use bypassCache option.
 */
export const CONNECTION_CACHE_TTL_MS = 300_000; // 5 minutes

/**
 * Type-specific cache TTLs for different data patterns
 * - counters: 5 min (aggregates change slowly)
 * - collections: 2 min (member lists change moderately)
 * - timeline: 30 sec (events need fresher data)
 */
export const CONNECTION_CACHE_TTL_BY_TYPE: Record<string, number> = {
  counter: 300_000,    // 5 minutes
  collection: 120_000, // 2 minutes
  timeline: 30_000,    // 30 seconds (real-time feel)
  computed: 300_000,   // 5 minutes
  default: 300_000,    // 5 minutes default
};

/**
 * Get cache TTL based on source path type
 */
export function getConnectionCacheTTL(sourcePath: string): number {
  if (sourcePath.includes('counter')) return CONNECTION_CACHE_TTL_BY_TYPE.counter;
  if (sourcePath.includes('collection')) return CONNECTION_CACHE_TTL_BY_TYPE.collection;
  if (sourcePath.includes('timeline')) return CONNECTION_CACHE_TTL_BY_TYPE.timeline;
  if (sourcePath.includes('computed')) return CONNECTION_CACHE_TTL_BY_TYPE.computed;
  return CONNECTION_CACHE_TTL_BY_TYPE.default;
}

/** Firestore collection path for connections */
export const CONNECTIONS_COLLECTION = 'toolConnections';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique key for caching a resolved connection value
 */
export function getConnectionCacheKey(
  deploymentId: string,
  elementId: string,
  inputPath: string
): string {
  return `${deploymentId}:${elementId}:${inputPath}`;
}

/**
 * Parse a connection cache key back to its components
 */
export function parseConnectionCacheKey(key: string): {
  deploymentId: string;
  elementId: string;
  inputPath: string;
} | null {
  const parts = key.split(':');
  if (parts.length !== 3) return null;
  return {
    deploymentId: parts[0],
    elementId: parts[1],
    inputPath: parts[2],
  };
}

/**
 * Check if a transform is compatible with a source type
 */
export function isTransformCompatible(
  transform: DataTransform,
  sourceType: ConnectionDataType
): boolean {
  const meta = DATA_TRANSFORMS[transform];
  if (meta.inputType === 'any') return true;

  switch (sourceType) {
    case 'array':
    case 'memberList':
    case 'timeline':
      return meta.inputType === 'array';
    case 'object':
    case 'collection':
      return meta.inputType === 'object';
    case 'number':
    case 'counter':
      return meta.inputType === 'number';
    case 'string':
      return meta.inputType === 'string';
    default:
      return true;
  }
}

/**
 * Apply a transform to a value
 */
export function applyTransform(value: unknown, transform?: DataTransform): unknown {
  if (!transform) return value;

  switch (transform) {
    case 'toArray':
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object') return Object.values(value);
      return [value];

    case 'toCount':
      if (Array.isArray(value)) return value.length;
      if (value && typeof value === 'object') return Object.keys(value).length;
      if (typeof value === 'number') return value;
      return value ? 1 : 0;

    case 'toBoolean':
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === 'object') return Object.keys(value).length > 0;
      return Boolean(value);

    case 'toSorted':
      if (!Array.isArray(value)) return value;
      return [...value].sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b;
        }
        return 0;
      });

    case 'toTop5':
      if (!Array.isArray(value)) return value;
      return value.slice(0, 5);

    case 'toKeys':
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value);
      }
      return [];

    case 'toValues':
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.values(value);
      }
      return Array.isArray(value) ? value : [];

    case 'flatten':
      if (!Array.isArray(value)) return value;
      return value.flat(1);

    case 'unique':
      if (!Array.isArray(value)) return value;
      return Array.from(new Set(value.map((v) =>
        typeof v === 'object' ? JSON.stringify(v) : v
      ))).map((v) => {
        try {
          return JSON.parse(v as string);
        } catch {
          return v;
        }
      });

    default:
      return value;
  }
}

/**
 * Get value at a dot-notation path from an object
 */
export function getValueAtPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Set value at a dot-notation path in an object (immutable)
 */
export function setValueAtPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T {
  const parts = path.split('.');
  const result = { ...obj };

  let current: Record<string, unknown> = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    current[part] = { ...(current[part] as Record<string, unknown> || {}) };
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;

  return result;
}
