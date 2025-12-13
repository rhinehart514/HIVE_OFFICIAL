/**
 * Generation Tracker Service
 *
 * Records every AI generation to Firestore for quality analytics.
 * This is the "source of truth" for understanding AI performance.
 *
 * Firestore Collection: ai_generations
 */

import type {
  AIGenerationRecord,
  GenerationOutcome,
  ValidationResult,
  QualityScore,
  ValidationErrorCode,
} from '../../../domain/hivelab/validation/types';
import type { GateDecision } from './quality-gate.service';

// ═══════════════════════════════════════════════════════════════════
// GENERATION INPUT
// ═══════════════════════════════════════════════════════════════════

/**
 * Input for tracking a generation
 */
export interface GenerationInput {
  /** User who triggered generation (null for anonymous) */
  userId: string | null;

  /** Session ID for grouping related generations */
  sessionId: string;

  /** Campus ID for multi-tenant analytics */
  campusId?: string;

  /** User's prompt */
  prompt: string;

  /** Whether this is an iteration on existing tool */
  isIteration: boolean;

  /** Space context if provided */
  spaceContext?: {
    spaceId: string;
    spaceName: string;
    spaceType?: string;
    category?: string;
    memberCount?: number;
  };

  /** Constraints applied */
  constraints?: {
    maxElements?: number;
    allowedCategories?: string[];
  };

  /** Model used */
  model: 'gemini-2.0-flash' | 'mock';

  /** Prompt version for tracking */
  promptVersion: string;

  /** Temperature setting */
  temperature?: number;
}

/**
 * Output from generation to track
 */
export interface GenerationOutput {
  /** Number of elements generated */
  elementCount: number;

  /** Number of connections generated */
  connectionCount: number;

  /** Element types used */
  elementTypes: string[];

  /** Layout type */
  layout: string;

  /** Token counts (estimated) */
  tokenCount: {
    input: number;
    output: number;
  };
}

/**
 * Complete generation result to track
 */
export interface GenerationTrackingData {
  input: GenerationInput;
  output: GenerationOutput;
  validation: ValidationResult;
  gateDecision: GateDecision;
  modifications?: string[];
  latencyMs: number;
  retryCount: number;
  usedFallback: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// GENERATION TRACKER SERVICE
// ═══════════════════════════════════════════════════════════════════

/**
 * Generation Tracker Service
 *
 * Records AI generations to Firestore and provides query methods.
 */
export class GenerationTrackerService {
  private db: FirebaseFirestore.Firestore | null = null;
  private collectionName = 'ai_generations';

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
   * Record a new generation
   */
  async recordGeneration(data: GenerationTrackingData): Promise<string> {
    const record: Omit<AIGenerationRecord, 'id'> = {
      userId: data.input.userId,
      sessionId: data.input.sessionId,
      campusId: data.input.campusId,

      // Input
      prompt: data.input.prompt,
      promptLength: data.input.prompt.length,
      isIteration: data.input.isIteration,
      spaceContext: data.input.spaceContext,
      constraints: data.input.constraints,

      // Model
      model: data.input.model,
      promptVersion: data.input.promptVersion,
      temperature: data.input.temperature,

      // Output
      elementCount: data.output.elementCount,
      connectionCount: data.output.connectionCount,
      elementTypes: data.output.elementTypes,
      layout: data.output.layout,

      // Quality
      validation: {
        valid: data.validation.valid,
        score: data.validation.score,
        errorCount: data.validation.errors.length,
        warningCount: data.validation.warnings.length,
        errorCodes: data.validation.errors.map(e => e.code),
      },
      gateDecision: data.gateDecision,
      modifications: data.modifications,

      // Performance
      latencyMs: data.latencyMs,
      tokenCount: data.output.tokenCount,
      retryCount: data.retryCount,
      usedFallback: data.usedFallback,

      // Timestamps
      createdAt: new Date(),
    };

    // If no Firestore, return mock ID (for testing/dev)
    if (!this.db) {
      const mockId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      console.log('[GenerationTracker] Mock record:', mockId, record);
      return mockId;
    }

    const docRef = await this.db.collection(this.collectionName).add(record);
    return docRef.id;
  }

  /**
   * Update generation outcome after user interaction
   */
  async updateOutcome(
    generationId: string,
    outcome: GenerationOutcome,
    timeToFirstAction?: number
  ): Promise<void> {
    if (!this.db) {
      console.log('[GenerationTracker] Mock outcome update:', generationId, outcome);
      return;
    }

    await this.db.collection(this.collectionName).doc(generationId).update({
      outcome,
      timeToFirstAction,
      updatedAt: new Date(),
    });
  }

  /**
   * Get recent generations for a user
   */
  async getRecentGenerations(
    userId: string,
    limit: number = 20
  ): Promise<AIGenerationRecord[]> {
    if (!this.db) {
      return [];
    }

    const snapshot = await this.db
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AIGenerationRecord[];
  }

  /**
   * Get generations by session
   */
  async getSessionGenerations(sessionId: string): Promise<AIGenerationRecord[]> {
    if (!this.db) {
      return [];
    }

    const snapshot = await this.db
      .collection(this.collectionName)
      .where('sessionId', '==', sessionId)
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AIGenerationRecord[];
  }

  /**
   * Get aggregate metrics for a time period
   */
  async getMetrics(
    startDate: Date,
    endDate: Date,
    campusId?: string
  ): Promise<GenerationMetrics> {
    if (!this.db) {
      return this.getEmptyMetrics();
    }

    let query = this.db
      .collection(this.collectionName)
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate);

    if (campusId) {
      query = query.where('campusId', '==', campusId);
    }

    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => doc.data() as AIGenerationRecord);

    return this.calculateMetrics(records);
  }

  /**
   * Calculate metrics from records
   */
  private calculateMetrics(records: AIGenerationRecord[]): GenerationMetrics {
    if (records.length === 0) {
      return this.getEmptyMetrics();
    }

    const total = records.length;
    const uniqueUsers = new Set(records.map(r => r.userId).filter(Boolean)).size;

    // Quality scores
    const scores = records.map(r => r.validation.score.overall);
    const avgScore = scores.reduce((a, b) => a + b, 0) / total;

    // Score distribution
    const scoreDistribution = {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 70 && s < 90).length,
      acceptable: scores.filter(s => s >= 50 && s < 70).length,
      poor: scores.filter(s => s < 50).length,
    };

    // Gate decisions
    const accepted = records.filter(r => r.gateDecision === 'accepted').length;
    const partialAccept = records.filter(r => r.gateDecision === 'partial_accept').length;
    const rejected = records.filter(r => r.gateDecision === 'rejected').length;

    // Outcomes
    const deployed = records.filter(r => r.outcome?.type === 'deployed').length;
    const saved = records.filter(r => r.outcome?.type === 'saved').length;
    const edited = records.filter(r => r.outcome?.type === 'edited').length;
    const abandoned = records.filter(r => r.outcome?.type === 'abandoned').length;

    // Error analysis
    const errorCounts: Record<ValidationErrorCode, number> = {} as Record<ValidationErrorCode, number>;
    for (const record of records) {
      for (const code of record.validation.errorCodes) {
        errorCounts[code] = (errorCounts[code] || 0) + 1;
      }
    }
    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code: code as ValidationErrorCode, count }));

    // Performance
    const latencies = records.map(r => r.latencyMs);
    const sortedLatencies = [...latencies].sort((a, b) => a - b);

    // Element usage
    const elementUsage: Record<string, number> = {};
    for (const record of records) {
      for (const elementType of record.elementTypes) {
        elementUsage[elementType] = (elementUsage[elementType] || 0) + 1;
      }
    }

    return {
      totalGenerations: total,
      uniqueUsers,
      avgQualityScore: Math.round(avgScore * 10) / 10,
      scoreDistribution,
      acceptanceRate: accepted / total,
      partialAcceptanceRate: partialAccept / total,
      rejectionRate: rejected / total,
      deploymentRate: deployed / (accepted + partialAccept) || 0,
      editRate: edited / (accepted + partialAccept) || 0,
      abandonmentRate: abandoned / total,
      avgLatencyMs: Math.round(latencies.reduce((a, b) => a + b, 0) / total),
      p50LatencyMs: sortedLatencies[Math.floor(total * 0.5)] || 0,
      p95LatencyMs: sortedLatencies[Math.floor(total * 0.95)] || 0,
      p99LatencyMs: sortedLatencies[Math.floor(total * 0.99)] || 0,
      fallbackRate: records.filter(r => r.usedFallback).length / total,
      topValidationErrors: topErrors,
      elementUsage,
      avgElementsPerTool: records.reduce((a, r) => a + r.elementCount, 0) / total,
    };
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): GenerationMetrics {
    return {
      totalGenerations: 0,
      uniqueUsers: 0,
      avgQualityScore: 0,
      scoreDistribution: { excellent: 0, good: 0, acceptable: 0, poor: 0 },
      acceptanceRate: 0,
      partialAcceptanceRate: 0,
      rejectionRate: 0,
      deploymentRate: 0,
      editRate: 0,
      abandonmentRate: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      fallbackRate: 0,
      topValidationErrors: [],
      elementUsage: {},
      avgElementsPerTool: 0,
    };
  }
}

/**
 * Generation metrics summary
 */
export interface GenerationMetrics {
  totalGenerations: number;
  uniqueUsers: number;
  avgQualityScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  acceptanceRate: number;
  partialAcceptanceRate: number;
  rejectionRate: number;
  deploymentRate: number;
  editRate: number;
  abandonmentRate: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  fallbackRate: number;
  topValidationErrors: Array<{ code: ValidationErrorCode; count: number }>;
  elementUsage: Record<string, number>;
  avgElementsPerTool: number;
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
let defaultTrackerService: GenerationTrackerService | null = null;

/**
 * Get default tracker service instance
 */
export function getGenerationTrackerService(): GenerationTrackerService {
  if (!defaultTrackerService) {
    defaultTrackerService = new GenerationTrackerService();
  }
  return defaultTrackerService;
}

/**
 * Initialize tracker with Firestore
 */
export function initializeGenerationTracker(db: FirebaseFirestore.Firestore): void {
  getGenerationTrackerService().setFirestore(db);
}
