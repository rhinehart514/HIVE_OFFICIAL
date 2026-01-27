/**
 * Context Interpolation Engine
 *
 * Replaces {{path}} placeholders in tool configurations with values from
 * the ToolRuntimeContext. Enables dynamic personalization of tool content
 * based on space, member, and temporal context.
 *
 * @version 1.0.0 - HiveLab Phase 1 (Jan 2026)
 */

import type { ToolRuntimeContext } from './tool-context.types';

// ============================================================================
// Constants
// ============================================================================

/** Regex to match {{path}} placeholders */
const INTERPOLATION_PATTERN = /\{\{([^}]+)\}\}/g;

/** Maximum recursion depth for nested object interpolation */
const MAX_DEPTH = 10;

// ============================================================================
// Types
// ============================================================================

export interface InterpolationOptions {
  /**
   * What to do when a path doesn't resolve to a value
   * - 'empty': Replace with empty string (default)
   * - 'keep': Keep the original placeholder
   * - 'null': Replace with null (useful for JSON)
   */
  missingBehavior?: 'empty' | 'keep' | 'null';

  /**
   * Whether to process arrays (default: true)
   */
  processArrays?: boolean;

  /**
   * Custom formatters for specific paths
   */
  formatters?: Record<string, (value: unknown) => string>;
}

export interface InterpolationResult<T> {
  /** The interpolated config */
  result: T;
  /** Paths that were successfully interpolated */
  interpolated: string[];
  /** Paths that couldn't be resolved */
  missing: string[];
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Interpolate a configuration object with context values
 *
 * Recursively walks the config object and replaces {{path}} placeholders
 * with values from the context.
 *
 * @param config - The configuration object to interpolate
 * @param context - The tool runtime context with values
 * @param options - Interpolation options
 * @returns The interpolated configuration
 *
 * @example
 * ```typescript
 * const config = {
 *   title: "Welcome to {{space.spaceName}}!",
 *   greeting: "Hello, {{member.displayName}}!",
 *   showLeaderOptions: "{{member.role}}"
 * };
 *
 * const result = interpolateConfig(config, context);
 * // {
 * //   title: "Welcome to Design Club!",
 * //   greeting: "Hello, Alex!",
 * //   showLeaderOptions: "admin"
 * // }
 * ```
 */
export function interpolateConfig<T extends Record<string, unknown>>(
  config: T,
  context: ToolRuntimeContext,
  options: InterpolationOptions = {}
): T {
  return interpolateValue(config, context, options, 0) as T;
}

/**
 * Interpolate a configuration object with detailed results
 *
 * Same as interpolateConfig but also returns metadata about which
 * paths were interpolated and which were missing.
 *
 * @example
 * ```typescript
 * const { result, interpolated, missing } = interpolateConfigWithMeta(config, context);
 * console.log(`Interpolated: ${interpolated.length}, Missing: ${missing.length}`);
 * ```
 */
export function interpolateConfigWithMeta<T extends Record<string, unknown>>(
  config: T,
  context: ToolRuntimeContext,
  options: InterpolationOptions = {}
): InterpolationResult<T> {
  const tracker = { interpolated: new Set<string>(), missing: new Set<string>() };
  const result = interpolateValueTracked(config, context, options, 0, tracker) as T;

  return {
    result,
    interpolated: Array.from(tracker.interpolated),
    missing: Array.from(tracker.missing),
  };
}

/**
 * Interpolate a single string with context values
 *
 * @param template - String containing {{path}} placeholders
 * @param context - The tool runtime context
 * @param options - Interpolation options
 * @returns The interpolated string
 *
 * @example
 * ```typescript
 * const greeting = interpolateString(
 *   "Welcome {{member.displayName}}! You've been here {{member.tenure.daysInSpace}} days.",
 *   context
 * );
 * ```
 */
export function interpolateString(
  template: string,
  context: ToolRuntimeContext,
  options: InterpolationOptions = {}
): string {
  const { missingBehavior = 'empty', formatters = {} } = options;

  return template.replace(INTERPOLATION_PATTERN, (match, path: string) => {
    const trimmedPath = path.trim();
    const value = getNestedValue(context, trimmedPath);

    // Handle missing values
    if (value === undefined || value === null) {
      switch (missingBehavior) {
        case 'keep':
          return match;
        case 'null':
          return 'null';
        default:
          return '';
      }
    }

    // Apply custom formatter if provided
    if (formatters[trimmedPath]) {
      return formatters[trimmedPath](value);
    }

    // Format the value
    return formatValue(value);
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Recursively interpolate a value
 */
function interpolateValue(
  value: unknown,
  context: ToolRuntimeContext,
  options: InterpolationOptions,
  depth: number
): unknown {
  // Prevent infinite recursion
  if (depth > MAX_DEPTH) {
    return value;
  }

  // Handle strings
  if (typeof value === 'string') {
    return interpolateString(value, context, options);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (options.processArrays === false) {
      return value;
    }
    return value.map((item) => interpolateValue(item, context, options, depth + 1));
  }

  // Handle objects
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = interpolateValue(val, context, options, depth + 1);
    }
    return result;
  }

  // Return primitives as-is
  return value;
}

/**
 * Recursively interpolate a value with tracking
 */
function interpolateValueTracked(
  value: unknown,
  context: ToolRuntimeContext,
  options: InterpolationOptions,
  depth: number,
  tracker: { interpolated: Set<string>; missing: Set<string> }
): unknown {
  if (depth > MAX_DEPTH) {
    return value;
  }

  if (typeof value === 'string') {
    return interpolateStringTracked(value, context, options, tracker);
  }

  if (Array.isArray(value)) {
    if (options.processArrays === false) {
      return value;
    }
    return value.map((item) =>
      interpolateValueTracked(item, context, options, depth + 1, tracker)
    );
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = interpolateValueTracked(val, context, options, depth + 1, tracker);
    }
    return result;
  }

  return value;
}

/**
 * Interpolate a string with tracking of interpolated and missing paths
 */
function interpolateStringTracked(
  template: string,
  context: ToolRuntimeContext,
  options: InterpolationOptions,
  tracker: { interpolated: Set<string>; missing: Set<string> }
): string {
  const { missingBehavior = 'empty', formatters = {} } = options;

  return template.replace(INTERPOLATION_PATTERN, (match, path: string) => {
    const trimmedPath = path.trim();
    const value = getNestedValue(context, trimmedPath);

    if (value === undefined || value === null) {
      tracker.missing.add(trimmedPath);
      switch (missingBehavior) {
        case 'keep':
          return match;
        case 'null':
          return 'null';
        default:
          return '';
      }
    }

    tracker.interpolated.add(trimmedPath);

    if (formatters[trimmedPath]) {
      return formatters[trimmedPath](value);
    }

    return formatValue(value);
  });
}

/**
 * Get a nested value from an object using dot notation
 *
 * @example
 * getNestedValue({ a: { b: { c: 1 } } }, 'a.b.c') // 1
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.');

  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Format a value for string interpolation
 */
function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(formatValue).join(', ');
  }

  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }

  return String(value);
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Check if a string contains interpolation placeholders
 */
export function hasInterpolation(value: string): boolean {
  return INTERPOLATION_PATTERN.test(value);
}

/**
 * Extract all interpolation paths from a string
 */
export function extractPaths(value: string): string[] {
  const paths: string[] = [];
  let match: RegExpExecArray | null;

  // Reset regex state
  const regex = new RegExp(INTERPOLATION_PATTERN);

  while ((match = regex.exec(value)) !== null) {
    paths.push(match[1].trim());
  }

  return paths;
}

/**
 * Extract all interpolation paths from a config object
 */
export function extractAllPaths(config: Record<string, unknown>): string[] {
  const paths = new Set<string>();

  function walk(value: unknown): void {
    if (typeof value === 'string') {
      for (const path of extractPaths(value)) {
        paths.add(path);
      }
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value !== null && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  }

  walk(config);
  return Array.from(paths);
}
