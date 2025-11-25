/**
 * Core error types for HIVE
 *
 * This module defines the shared error shape used across hooks,
 * loading-state types, and other core utilities.
 *
 * @module error.types
 * @since 1.0.0
 */

/**
 * High-level error categories used for classification and resilience logic.
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  DATABASE = 'database',
  INTEGRATION = 'integration',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels for prioritization and alerting.
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Unified error shape used across the HIVE platform.
 */
export interface HiveError {
  /** Stable identifier for this error instance */
  id: string;

  /** High-level category for this error */
  category: ErrorCategory;

  /** Severity used for UX decisions and logging */
  severity: ErrorSeverity;

  /** Human-readable error message */
  message: string;

  /** Optional structured details (e.g. validation errors, response body) */
  details?: unknown;

  /** Time when the error occurred */
  timestamp: Date;

  /** Optional context fields for analytics and debugging */
  userId?: string;
  spaceId?: string;
  endpoint?: string;
  userAgent?: string;

  /** Whether this error is considered retryable */
  retryable: boolean;

  /** Retry bookkeeping fields */
  retryCount?: number;
  maxRetries?: number;

  /** Optional stack trace when available */
  stack?: string;
}

