/**
 * Config Learner Service
 *
 * Learns optimal configurations for elements by analyzing:
 * - Config drift: when AI defaults are consistently changed by users
 * - Optimal configs: configurations that correlate with high quality scores
 *
 * This is critical for improving AI output quality - if users consistently
 * change a field from value A to value B, we should generate value B.
 */

import type {
  ConfigDrift,
  OptimalConfig,
} from './types';
import type { AIGenerationRecord } from '../../../domain/hivelab/validation/types';
import type { GenerationEditRecord, ElementEdit } from '../../../domain/hivelab/validation/types';

// ═══════════════════════════════════════════════════════════════════
// CONFIG LEARNING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  /** Minimum sample size to detect drift */
  minDriftSamples: 5,

  /** Minimum change rate to report as drift */
  minChangeRate: 0.25, // 25%

  /** Minimum confidence for drift patterns */
  minDriftConfidence: 0.6,

  /** Data window in days */
  dataWindowDays: 30,

  /** Minimum samples for optimal config */
  minOptimalConfigSamples: 10,

  /** Minimum quality score for "good" generations */
  minQualityScore: 75,
};

export type ConfigLearnerConfig = typeof DEFAULT_CONFIG;

// ═══════════════════════════════════════════════════════════════════
// CONFIG LEARNER SERVICE
// ═══════════════════════════════════════════════════════════════════

export class ConfigLearnerService {
  private db: FirebaseFirestore.Firestore | null = null;
  private config: ConfigLearnerConfig;

  constructor(
    db?: FirebaseFirestore.Firestore,
    config: Partial<ConfigLearnerConfig> = {}
  ) {
    this.db = db || null;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set Firestore instance (for lazy initialization)
   */
  setFirestore(db: FirebaseFirestore.Firestore): void {
    this.db = db;
  }

  // ═════════════════════════════════════════════════════════════════
  // CONFIG DRIFT DETECTION
  // ═════════════════════════════════════════════════════════════════

  /**
   * Detect config drifts - fields that users consistently change
   *
   * Example insight: "For poll-element, users change options count from 4 to 2-3 in 68% of cases"
   */
  async detectConfigDrifts(): Promise<ConfigDrift[]> {
    const edits = await this.getConfigModifications();

    if (edits.length < this.config.minDriftSamples) {
      console.log('[ConfigLearner] Insufficient samples for drift detection:', edits.length);
      return [];
    }

    // Group edits by element type and field
    const driftMap = new Map<string, Map<string, ConfigFieldData>>();

    for (const editRecord of edits) {
      for (const edit of editRecord.edits) {
        if (edit.type !== 'modify' || !edit.field?.startsWith('config.')) {
          continue;
        }

        // Extract element type from the instanceId
        // Instance IDs are like "poll-main", "search-1", etc.
        const elementType = this.inferElementType(edit.instanceId || '', editRecord);
        if (!elementType) continue;

        const fieldName = edit.field.replace('config.', '');

        if (!driftMap.has(elementType)) {
          driftMap.set(elementType, new Map());
        }

        const fieldMap = driftMap.get(elementType)!;
        if (!fieldMap.has(fieldName)) {
          fieldMap.set(fieldName, {
            totalChanges: 0,
            oldValues: [],
            newValues: [],
            changeDistribution: new Map(),
          });
        }

        const fieldData = fieldMap.get(fieldName)!;
        fieldData.totalChanges++;
        fieldData.oldValues.push(edit.oldValue);
        fieldData.newValues.push(edit.newValue);

        // Track distribution of new values
        const newValueKey = this.valueToKey(edit.newValue);
        fieldData.changeDistribution.set(
          newValueKey,
          (fieldData.changeDistribution.get(newValueKey) || 0) + 1
        );
      }
    }

    // Calculate drift patterns
    const drifts: ConfigDrift[] = [];
    const now = new Date();

    for (const [elementType, fieldMap] of driftMap) {
      // Get total generations for this element type to calculate change rate
      const totalElementGenerations = await this.getElementGenerationCount(elementType);

      for (const [fieldName, data] of fieldMap) {
        const changeRate = totalElementGenerations > 0
          ? data.totalChanges / totalElementGenerations
          : 0;

        if (changeRate < this.config.minChangeRate) {
          continue;
        }

        // Find most common AI default (old value)
        const aiDefault = this.findMostCommon(data.oldValues);

        // Find most common user preference (new value)
        const userPreferred = this.findMostCommon(data.newValues);

        // Calculate confidence based on consistency
        const confidence = this.calculateDriftConfidence(data);

        if (confidence < this.config.minDriftConfidence) {
          continue;
        }

        // Convert distribution to plain object
        const changeDistribution: Record<string, number> = {};
        for (const [key, count] of data.changeDistribution) {
          changeDistribution[key] = count;
        }

        drifts.push({
          elementType,
          field: fieldName,
          aiDefault,
          userPreferred,
          changeDistribution,
          changeRate,
          sampleSize: data.totalChanges,
          confidence,
          computedAt: now,
        });
      }
    }

    return drifts.sort((a, b) => b.changeRate - a.changeRate);
  }

  /**
   * Calculate confidence in a drift pattern
   * High confidence = users consistently change to the same value
   */
  private calculateDriftConfidence(data: ConfigFieldData): number {
    if (data.totalChanges === 0) return 0;

    // Find the most common new value
    let maxCount = 0;
    for (const count of data.changeDistribution.values()) {
      if (count > maxCount) maxCount = count;
    }

    // Confidence is based on how consistently users change to the same value
    return maxCount / data.totalChanges;
  }

  // ═════════════════════════════════════════════════════════════════
  // OPTIMAL CONFIG EXTRACTION
  // ═════════════════════════════════════════════════════════════════

  /**
   * Extract optimal configurations for each element type
   * based on high-quality generations
   */
  async extractOptimalConfigs(): Promise<OptimalConfig[]> {
    const generations = await this.getHighQualityGenerations();

    if (generations.length < this.config.minOptimalConfigSamples) {
      console.log('[ConfigLearner] Insufficient samples for optimal config:', generations.length);
      return [];
    }

    // We need the full composition data to get configs
    // For now, return empty - this requires joining with tool compositions
    // which we may need to store separately

    return [];
  }

  /**
   * Extract optimal config for a specific element type
   */
  async extractOptimalConfigForElement(elementType: string): Promise<OptimalConfig | null> {
    // This would analyze successful tools containing this element
    // and find the most common config patterns

    // Requires composition storage - for now return null
    return null;
  }

  // ═════════════════════════════════════════════════════════════════
  // CONTEXT-SPECIFIC CONFIG LEARNING
  // ═════════════════════════════════════════════════════════════════

  /**
   * Learn config preferences by space category
   *
   * Example: poll-element might have different optimal options count
   * for "academic" vs "social" spaces
   */
  async extractContextSpecificConfigs(
    elementType: string
  ): Promise<Map<string, Record<string, unknown>>> {
    // This would analyze configs by space category
    // Requires more data collection

    return new Map();
  }

  // ═════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═════════════════════════════════════════════════════════════════

  /**
   * Get edit records that contain config modifications
   */
  private async getConfigModifications(): Promise<GenerationEditRecord[]> {
    if (!this.db) {
      return [];
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - this.config.dataWindowDays);

    try {
      const snapshot = await this.db
        .collection('ai_edits')
        .where('createdAt', '>=', windowStart)
        .where('summary.configsChanged', '>', 0)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GenerationEditRecord[];
    } catch (error) {
      console.error('[ConfigLearner] Error fetching config modifications:', error);
      return [];
    }
  }

  /**
   * Get high quality generations
   */
  private async getHighQualityGenerations(): Promise<AIGenerationRecord[]> {
    if (!this.db) {
      return [];
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - this.config.dataWindowDays);

    try {
      const snapshot = await this.db
        .collection('ai_generations')
        .where('createdAt', '>=', windowStart)
        .where('validation.score.overall', '>=', this.config.minQualityScore)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AIGenerationRecord[];
    } catch (error) {
      console.error('[ConfigLearner] Error fetching high quality generations:', error);
      return [];
    }
  }

  /**
   * Get count of generations containing a specific element type
   */
  private async getElementGenerationCount(elementType: string): Promise<number> {
    if (!this.db) {
      return 0;
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - this.config.dataWindowDays);

    try {
      // Note: Firestore doesn't support array-contains with other conditions well
      // In production, we might need a counter or pre-aggregated data
      const snapshot = await this.db
        .collection('ai_generations')
        .where('createdAt', '>=', windowStart)
        .where('elementTypes', 'array-contains', elementType)
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      console.error('[ConfigLearner] Error getting element count:', error);
      return 0;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═════════════════════════════════════════════════════════════════

  /**
   * Infer element type from instance ID
   * Instance IDs are like "poll-main", "search-1", "countdown-timer-abc123"
   */
  private inferElementType(
    instanceId: string,
    editRecord: GenerationEditRecord
  ): string | null {
    // Look for element type in the edits
    for (const edit of editRecord.edits) {
      if (edit.instanceId === instanceId && edit.elementType) {
        return edit.elementType;
      }
    }

    // Try to infer from instance ID pattern
    // Most IDs are like "element-type-suffix"
    const parts = instanceId.split('-');
    if (parts.length >= 2) {
      // Handle compound element types like "countdown-timer"
      const possibleTypes = [
        parts[0],
        `${parts[0]}-${parts[1]}`,
        `${parts[0]}-element`,
      ];

      // Return the first that looks like a known element type pattern
      for (const type of possibleTypes) {
        if (this.isLikelyElementType(type)) {
          return type;
        }
      }
    }

    return null;
  }

  /**
   * Check if a string looks like an element type
   */
  private isLikelyElementType(str: string): boolean {
    // Known element type patterns
    const patterns = [
      /^poll/,
      /^form/,
      /^search/,
      /^filter/,
      /^result/,
      /^chart/,
      /^countdown/,
      /^leaderboard/,
      /^notification/,
      /^date/,
      /^user/,
      /^tag/,
      /^rsvp/,
    ];

    return patterns.some(p => p.test(str));
  }

  /**
   * Convert a value to a stable string key for counting
   */
  private valueToKey(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Find most common value in an array
   */
  private findMostCommon(values: unknown[]): unknown {
    if (values.length === 0) return undefined;

    const counts = new Map<string, { value: unknown; count: number }>();

    for (const value of values) {
      const key = this.valueToKey(value);
      if (!counts.has(key)) {
        counts.set(key, { value, count: 0 });
      }
      counts.get(key)!.count++;
    }

    let maxCount = 0;
    let mostCommon: unknown = undefined;

    for (const { value, count } of counts.values()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    }

    return mostCommon;
  }

  // ═════════════════════════════════════════════════════════════════
  // BATCH EXTRACTION
  // ═════════════════════════════════════════════════════════════════

  /**
   * Extract all config learning data
   */
  async extractAll(): Promise<{
    drifts: ConfigDrift[];
    optimalConfigs: OptimalConfig[];
    metadata: {
      timestamp: Date;
      dataWindowDays: number;
    };
  }> {
    console.log('[ConfigLearner] Starting extraction...');

    const [drifts, optimalConfigs] = await Promise.all([
      this.detectConfigDrifts(),
      this.extractOptimalConfigs(),
    ]);

    console.log('[ConfigLearner] Extraction complete:', {
      drifts: drifts.length,
      optimalConfigs: optimalConfigs.length,
    });

    return {
      drifts,
      optimalConfigs,
      metadata: {
        timestamp: new Date(),
        dataWindowDays: this.config.dataWindowDays,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// INTERNAL TYPES
// ═══════════════════════════════════════════════════════════════════

interface ConfigFieldData {
  totalChanges: number;
  oldValues: unknown[];
  newValues: unknown[];
  changeDistribution: Map<string, number>;
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
let defaultConfigLearner: ConfigLearnerService | null = null;

/**
 * Get default config learner instance
 */
export function getConfigLearnerService(): ConfigLearnerService {
  if (!defaultConfigLearner) {
    defaultConfigLearner = new ConfigLearnerService();
  }
  return defaultConfigLearner;
}

/**
 * Initialize config learner with Firestore
 */
export function initializeConfigLearner(db: FirebaseFirestore.Firestore): void {
  getConfigLearnerService().setFirestore(db);
}
