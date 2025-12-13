/**
 * Failure Classifier Service
 *
 * Classifies and records AI generation failures for debugging and improvement.
 * This helps identify patterns in failures to improve prompts and system reliability.
 *
 * Firestore Collection: ai_failures
 */

import type {
  GenerationFailureRecord,
  FailureType,
} from '../../../domain/hivelab/validation/types';

// ═══════════════════════════════════════════════════════════════════
// FAILURE INPUT
// ═══════════════════════════════════════════════════════════════════

/**
 * Input for recording a failure
 */
export interface FailureInput {
  /** Reference to generation (if available) */
  generationId?: string;

  /** User who triggered generation */
  userId: string | null;

  /** Prompt that caused failure */
  prompt: string;

  /** Model that failed */
  model: 'gemini-2.0-flash' | 'mock';

  /** Prompt version */
  promptVersion: string;

  /** The error that occurred */
  error: Error | string;

  /** Partial response (if any) */
  partialResponse?: string;

  /** Number of retries before failure */
  retryCount: number;

  /** Whether fallback was attempted */
  fallbackAttempted: boolean;

  /** Whether fallback succeeded */
  fallbackSucceeded?: boolean;

  /** Duration until failure (ms) */
  durationMs: number;
}

// ═══════════════════════════════════════════════════════════════════
// FAILURE CLASSIFIER SERVICE
// ═══════════════════════════════════════════════════════════════════

/**
 * Failure Classifier Service
 *
 * Classifies failures and records them for analysis.
 */
export class FailureClassifierService {
  private db: FirebaseFirestore.Firestore | null = null;
  private collectionName = 'ai_failures';

  constructor(db?: FirebaseFirestore.Firestore) {
    this.db = db || null;
  }

  /**
   * Set Firestore instance (for lazy initialization)
   */
  setFirestore(db: FirebaseFirestore.Firestore): void {
    this.db = db;
  }

  /**
   * Classify and record a failure
   */
  async recordFailure(input: FailureInput): Promise<string> {
    const errorMessage = input.error instanceof Error
      ? input.error.message
      : String(input.error);

    const errorStack = input.error instanceof Error
      ? input.error.stack?.slice(0, 2000) // Truncate stack trace
      : undefined;

    const failureType = this.classifyFailure(errorMessage, input.partialResponse);

    const record: Omit<GenerationFailureRecord, 'id'> = {
      generationId: input.generationId,
      userId: input.userId,
      prompt: input.prompt,
      model: input.model,
      promptVersion: input.promptVersion,
      failureType,
      errorCode: this.extractErrorCode(errorMessage),
      errorMessage,
      stackTrace: errorStack,
      partialResponse: input.partialResponse?.slice(0, 5000), // Truncate
      resolvedBy: this.determineResolution(input),
      retryCount: input.retryCount,
      fallbackSucceeded: input.fallbackSucceeded,
      createdAt: new Date(),
      durationMs: input.durationMs,
    };

    // If no Firestore, return mock ID (for testing/dev)
    if (!this.db) {
      const mockId = `fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      console.log('[FailureClassifier] Mock failure record:', mockId, {
        type: failureType,
        message: errorMessage.slice(0, 100),
      });
      return mockId;
    }

    const docRef = await this.db.collection(this.collectionName).add(record);
    return docRef.id;
  }

  /**
   * Classify failure type from error message and response
   */
  classifyFailure(errorMessage: string, partialResponse?: string): FailureType {
    const lowerError = errorMessage.toLowerCase();
    const lowerResponse = partialResponse?.toLowerCase() || '';

    // JSON parse errors
    if (
      lowerError.includes('json') ||
      lowerError.includes('parse') ||
      lowerError.includes('unexpected token') ||
      lowerError.includes('unexpected end')
    ) {
      return 'json_parse_error';
    }

    // Schema validation errors
    if (
      lowerError.includes('schema') ||
      lowerError.includes('validation') ||
      lowerError.includes('required') ||
      lowerError.includes('invalid type')
    ) {
      return 'schema_validation_error';
    }

    // Invalid element IDs
    if (
      lowerError.includes('element') ||
      lowerError.includes('unknown element') ||
      lowerError.includes('invalid element')
    ) {
      return 'invalid_element_id';
    }

    // Missing required fields
    if (
      lowerError.includes('missing') ||
      lowerError.includes('required field')
    ) {
      return 'missing_required_field';
    }

    // Timeout errors
    if (
      lowerError.includes('timeout') ||
      lowerError.includes('timed out') ||
      lowerError.includes('deadline')
    ) {
      return 'timeout';
    }

    // Rate limit errors
    if (
      lowerError.includes('rate limit') ||
      lowerError.includes('quota') ||
      lowerError.includes('too many requests') ||
      lowerError.includes('429')
    ) {
      return 'rate_limit';
    }

    // Model errors (safety, content policy, etc.)
    if (
      lowerError.includes('safety') ||
      lowerError.includes('blocked') ||
      lowerError.includes('content policy') ||
      lowerError.includes('harmful')
    ) {
      return 'model_error';
    }

    // Network errors
    if (
      lowerError.includes('network') ||
      lowerError.includes('connection') ||
      lowerError.includes('fetch') ||
      lowerError.includes('econnrefused') ||
      lowerError.includes('socket')
    ) {
      return 'network_error';
    }

    // Check partial response for clues
    if (partialResponse) {
      // Truncated JSON
      if (lowerResponse.includes('{') && !lowerResponse.includes('}')) {
        return 'json_parse_error';
      }
    }

    return 'unknown';
  }

  /**
   * Extract error code from message if present
   */
  private extractErrorCode(errorMessage: string): string | undefined {
    // Look for common error code patterns
    const patterns = [
      /error code[:\s]+([A-Z_]+)/i,
      /\[([A-Z_]+)\]/,
      /code[:\s]+(\d+)/i,
      /status[:\s]+(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Determine how failure was resolved
   */
  private determineResolution(
    input: FailureInput
  ): 'retry' | 'fallback' | 'manual' | 'unresolved' {
    if (input.fallbackSucceeded) {
      return 'fallback';
    }
    if (input.retryCount > 0 && !input.fallbackAttempted) {
      return 'retry';
    }
    if (input.fallbackAttempted && !input.fallbackSucceeded) {
      return 'unresolved';
    }
    return 'unresolved';
  }

  /**
   * Get failure statistics for a time period
   */
  async getFailureStats(
    startDate: Date,
    endDate: Date,
    campusId?: string
  ): Promise<FailureStats> {
    if (!this.db) {
      return this.getEmptyStats();
    }

    const query = this.db
      .collection(this.collectionName)
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate);

    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => doc.data() as GenerationFailureRecord);

    return this.calculateStats(records);
  }

  /**
   * Get recent failures
   */
  async getRecentFailures(limit: number = 50): Promise<GenerationFailureRecord[]> {
    if (!this.db) {
      return [];
    }

    const snapshot = await this.db
      .collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GenerationFailureRecord[];
  }

  /**
   * Get failures by type
   */
  async getFailuresByType(
    type: FailureType,
    limit: number = 20
  ): Promise<GenerationFailureRecord[]> {
    if (!this.db) {
      return [];
    }

    const snapshot = await this.db
      .collection(this.collectionName)
      .where('failureType', '==', type)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GenerationFailureRecord[];
  }

  /**
   * Calculate failure statistics
   */
  private calculateStats(records: GenerationFailureRecord[]): FailureStats {
    if (records.length === 0) {
      return this.getEmptyStats();
    }

    const total = records.length;

    // Count by type
    const byType: Record<FailureType, number> = {
      json_parse_error: 0,
      schema_validation_error: 0,
      invalid_element_id: 0,
      missing_required_field: 0,
      timeout: 0,
      rate_limit: 0,
      model_error: 0,
      network_error: 0,
      unknown: 0,
    };

    for (const record of records) {
      byType[record.failureType]++;
    }

    // Count by resolution
    const byResolution = {
      retry: records.filter(r => r.resolvedBy === 'retry').length,
      fallback: records.filter(r => r.resolvedBy === 'fallback').length,
      manual: records.filter(r => r.resolvedBy === 'manual').length,
      unresolved: records.filter(r => r.resolvedBy === 'unresolved').length,
    };

    // Find most common error messages
    const errorCounts: Record<string, number> = {};
    for (const record of records) {
      const key = record.errorMessage.slice(0, 100); // Truncate for grouping
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    }
    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    // Average retry count
    const avgRetries = records.reduce((a, r) => a + r.retryCount, 0) / total;

    // Fallback success rate
    const fallbackAttempts = records.filter(r => r.fallbackSucceeded !== undefined);
    const fallbackSuccessRate = fallbackAttempts.length > 0
      ? fallbackAttempts.filter(r => r.fallbackSucceeded).length / fallbackAttempts.length
      : 0;

    return {
      totalFailures: total,
      byType,
      byResolution,
      topErrors,
      avgRetries: Math.round(avgRetries * 10) / 10,
      fallbackSuccessRate: Math.round(fallbackSuccessRate * 100) / 100,
    };
  }

  /**
   * Get empty stats structure
   */
  private getEmptyStats(): FailureStats {
    return {
      totalFailures: 0,
      byType: {
        json_parse_error: 0,
        schema_validation_error: 0,
        invalid_element_id: 0,
        missing_required_field: 0,
        timeout: 0,
        rate_limit: 0,
        model_error: 0,
        network_error: 0,
        unknown: 0,
      },
      byResolution: {
        retry: 0,
        fallback: 0,
        manual: 0,
        unresolved: 0,
      },
      topErrors: [],
      avgRetries: 0,
      fallbackSuccessRate: 0,
    };
  }
}

/**
 * Failure statistics
 */
export interface FailureStats {
  totalFailures: number;
  byType: Record<FailureType, number>;
  byResolution: {
    retry: number;
    fallback: number;
    manual: number;
    unresolved: number;
  };
  topErrors: Array<{ message: string; count: number }>;
  avgRetries: number;
  fallbackSuccessRate: number;
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
let defaultClassifierService: FailureClassifierService | null = null;

/**
 * Get default classifier service instance
 */
export function getFailureClassifierService(): FailureClassifierService {
  if (!defaultClassifierService) {
    defaultClassifierService = new FailureClassifierService();
  }
  return defaultClassifierService;
}

/**
 * Initialize classifier with Firestore
 */
export function initializeFailureClassifier(db: FirebaseFirestore.Firestore): void {
  getFailureClassifierService().setFirestore(db);
}

/**
 * Convenience function to classify a failure type
 */
export function classifyFailureType(
  errorMessage: string,
  partialResponse?: string
): FailureType {
  return getFailureClassifierService().classifyFailure(errorMessage, partialResponse);
}
