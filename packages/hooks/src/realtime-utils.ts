/**
 * Real-time Utilities
 *
 * Shared utilities for Firestore data transformation.
 *
 * @module realtime-utils
 * @since 1.0.0
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp or various date formats to Date
 *
 * @example
 * ```tsx
 * const createdAt = parseTimestamp(data.createdAt); // Works with Timestamp, Date, string, or number
 * ```
 */
export function parseTimestamp(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    // Return current date if parsing fails
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date();
}

/**
 * Safe Firestore document mapper
 *
 * @example
 * ```tsx
 * const post = mapDocument<Post>(doc.id, doc.data(), (data) => ({
 *   title: data.title as string,
 *   createdAt: parseTimestamp(data.createdAt),
 * }));
 * ```
 */
export function mapDocument<T>(
  id: string,
  data: Record<string, unknown>,
  transform?: (data: Record<string, unknown>) => Partial<T>
): T {
  const base = { id, ...data };
  if (transform) {
    return { ...base, ...transform(data) } as T;
  }
  return base as T;
}

/**
 * Type guard to check if a value is a Firestore Timestamp
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

/**
 * Parse optional timestamp, returning null if value is undefined/null
 */
export function parseOptionalTimestamp(value: unknown): Date | null {
  if (value === undefined || value === null) return null;
  return parseTimestamp(value);
}
