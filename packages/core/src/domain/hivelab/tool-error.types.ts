/**
 * Tool Error Types
 *
 * Sprint 5: Error Handling Audit
 *
 * Provides structured error types for tools with:
 * - Typed error codes for programmatic handling
 * - User-friendly messages for display
 * - Developer context for debugging
 * - Suggested recovery actions
 */

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Error codes for tool operations
 */
export type ToolErrorCode =
  // Load errors
  | 'TOOL_NOT_FOUND'
  | 'TOOL_NOT_DEPLOYED'
  | 'TOOL_CONFIGURATION_INVALID'
  | 'TOOL_VERSION_MISMATCH'

  // Permission errors
  | 'PERMISSION_DENIED'
  | 'SPACE_ACCESS_REQUIRED'
  | 'LEADER_ACCESS_REQUIRED'
  | 'APP_CHECK_FAILED'

  // State errors
  | 'STATE_LOAD_FAILED'
  | 'STATE_SAVE_FAILED'
  | 'STATE_CONFLICT'
  | 'STATE_INVALID'

  // Action errors
  | 'ACTION_NOT_ALLOWED'
  | 'ACTION_RATE_LIMITED'
  | 'ACTION_FAILED'
  | 'ACTION_TIMEOUT'

  // Connection errors
  | 'CONNECTION_FAILED'
  | 'SOURCE_TOOL_NOT_FOUND'
  | 'CONNECTION_DATA_INVALID'

  // Automation errors
  | 'AUTOMATION_FAILED'
  | 'AUTOMATION_RATE_LIMITED'
  | 'AUTOMATION_CONDITION_FAILED'

  // Network errors
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT'

  // Unknown
  | 'UNKNOWN_ERROR';

// ============================================================================
// STRUCTURED ERROR
// ============================================================================

/**
 * Recovery action that can be taken
 */
export interface ErrorRecoveryAction {
  /** Action label for button/link */
  label: string;
  /** Action type */
  type: 'retry' | 'refresh' | 'navigate' | 'contact' | 'dismiss';
  /** Navigation URL if type is 'navigate' */
  url?: string;
}

/**
 * Structured tool error with all context needed for handling
 */
export interface ToolError {
  /** Machine-readable error code */
  code: ToolErrorCode;

  /** User-friendly message (safe to display) */
  message: string;

  /** Technical details for developers (log only, don't display) */
  details?: string;

  /** Whether the error is recoverable */
  recoverable: boolean;

  /** Suggested recovery actions */
  recovery?: ErrorRecoveryAction[];

  /** HTTP status code if applicable */
  statusCode?: number;

  /** Timestamp when error occurred */
  timestamp: string;

  /** Context about where the error occurred */
  context?: {
    toolId?: string;
    deploymentId?: string;
    actionType?: string;
    elementId?: string;
  };
}

// ============================================================================
// ERROR FACTORY
// ============================================================================

/**
 * User-friendly messages for each error code
 */
export const ERROR_MESSAGES: Record<ToolErrorCode, string> = {
  // Load errors
  TOOL_NOT_FOUND: "This tool doesn't exist or has been removed.",
  TOOL_NOT_DEPLOYED: "This tool hasn't been set up yet.",
  TOOL_CONFIGURATION_INVALID: "This tool has a configuration problem.",
  TOOL_VERSION_MISMATCH: "This tool needs to be updated.",

  // Permission errors
  PERMISSION_DENIED: "You don't have permission to use this tool.",
  SPACE_ACCESS_REQUIRED: "Join this space to use this tool.",
  LEADER_ACCESS_REQUIRED: "Only space leaders can use this feature.",
  APP_CHECK_FAILED: "Unable to verify this app. Please refresh the page.",

  // State errors
  STATE_LOAD_FAILED: "Couldn't load tool data. Please try again.",
  STATE_SAVE_FAILED: "Your changes couldn't be saved. Please try again.",
  STATE_CONFLICT: "Someone else made changes. Please refresh and try again.",
  STATE_INVALID: "The tool data is corrupted. Please contact support.",

  // Action errors
  ACTION_NOT_ALLOWED: "This action isn't available right now.",
  ACTION_RATE_LIMITED: "Too many requests. Please wait a moment.",
  ACTION_FAILED: "Something went wrong. Please try again.",
  ACTION_TIMEOUT: "The request took too long. Please try again.",

  // Connection errors
  CONNECTION_FAILED: "Couldn't connect to another tool.",
  SOURCE_TOOL_NOT_FOUND: "The connected tool no longer exists.",
  CONNECTION_DATA_INVALID: "The connected data is invalid.",

  // Automation errors
  AUTOMATION_FAILED: "An automation couldn't complete.",
  AUTOMATION_RATE_LIMITED: "Automation paused due to rate limits.",
  AUTOMATION_CONDITION_FAILED: "Automation conditions weren't met.",

  // Network errors
  NETWORK_ERROR: "Connection problem. Check your internet.",
  SERVER_ERROR: "Our servers are having issues. Please try later.",
  TIMEOUT: "Request timed out. Please try again.",

  // Unknown
  UNKNOWN_ERROR: "Something unexpected happened. Please try again.",
};

/**
 * Create a structured tool error
 */
export function createToolError(
  code: ToolErrorCode,
  options?: {
    details?: string;
    context?: ToolError['context'];
    statusCode?: number;
    customMessage?: string;
  }
): ToolError {
  const recoveryActions = getRecoveryActions(code);

  return {
    code,
    message: options?.customMessage ?? ERROR_MESSAGES[code],
    details: options?.details,
    recoverable: isRecoverableError(code),
    recovery: recoveryActions,
    statusCode: options?.statusCode,
    timestamp: new Date().toISOString(),
    context: options?.context,
  };
}

/**
 * Check if an error code represents a recoverable error
 */
export function isRecoverableError(code: ToolErrorCode): boolean {
  const nonRecoverable: ToolErrorCode[] = [
    'TOOL_NOT_FOUND',
    'PERMISSION_DENIED',
    'SPACE_ACCESS_REQUIRED',
    'LEADER_ACCESS_REQUIRED',
    'STATE_INVALID',
    'ACTION_NOT_ALLOWED',
  ];
  return !nonRecoverable.includes(code);
}

/**
 * Get recovery actions for an error code
 */
export function getRecoveryActions(code: ToolErrorCode): ErrorRecoveryAction[] {
  switch (code) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
    case 'STATE_LOAD_FAILED':
    case 'ACTION_FAILED':
    case 'ACTION_TIMEOUT':
      return [{ label: 'Try again', type: 'retry' }];

    case 'STATE_CONFLICT':
    case 'APP_CHECK_FAILED':
    case 'TOOL_VERSION_MISMATCH':
      return [{ label: 'Refresh', type: 'refresh' }];

    case 'ACTION_RATE_LIMITED':
    case 'AUTOMATION_RATE_LIMITED':
      return [{ label: 'Wait and retry', type: 'retry' }];

    case 'SPACE_ACCESS_REQUIRED':
      return [{ label: 'Join space', type: 'navigate' }];

    case 'STATE_INVALID':
    case 'SERVER_ERROR':
      return [{ label: 'Contact support', type: 'contact' }];

    default:
      return [{ label: 'Dismiss', type: 'dismiss' }];
  }
}

/**
 * Parse an error (unknown type) into a structured ToolError
 */
export function parseError(error: unknown, context?: ToolError['context']): ToolError {
  // Already a ToolError
  if (isToolError(error)) {
    return error;
  }

  // Error object
  if (error instanceof Error) {
    // Check for known error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createToolError('NETWORK_ERROR', { details: error.message, context });
    }
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return createToolError('PERMISSION_DENIED', { details: error.message, context });
    }
    if (error.message.includes('timeout')) {
      return createToolError('TIMEOUT', { details: error.message, context });
    }
    if (error.message.includes('rate limit')) {
      return createToolError('ACTION_RATE_LIMITED', { details: error.message, context });
    }

    return createToolError('UNKNOWN_ERROR', { details: error.message, context });
  }

  // String error
  if (typeof error === 'string') {
    return createToolError('UNKNOWN_ERROR', { details: error, context });
  }

  // Unknown
  return createToolError('UNKNOWN_ERROR', { details: String(error), context });
}

/**
 * Type guard for ToolError
 */
export function isToolError(error: unknown): error is ToolError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'recoverable' in error &&
    'timestamp' in error
  );
}
