// @ts-nocheck
// TODO: Fix string | undefined parameter types
/**
 * Pattern Extractor Service
 *
 * Analyzes successful AI generations to extract patterns:
 * - Element co-occurrence (what elements go together)
 * - Missing patterns (what users add after generation)
 * - Over-generation patterns (what users remove)
 *
 * This is the core learning engine that runs daily to discover
 * patterns in user behavior and successful tool compositions.
 */

import type {
  ElementAffinity,
  MissingPattern,
  OverGenerationPattern,
  LayoutPattern,
} from './types';
import type { AIGenerationRecord } from '../../../domain/hivelab/validation/types';
import type { GenerationEditRecord } from '../../../domain/hivelab/validation/types';

// ═══════════════════════════════════════════════════════════════════
// PATTERN EXTRACTION CONFIG
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  /** Minimum quality score to consider a generation "successful" */
  minQualityScore: 70,

  /** Minimum sample size for computing affinities */
  minAffinitySamples: 10,

  /** Minimum lift score to report an affinity */
  minLiftScore: 1.2,

  /** Data window in days */
  dataWindowDays: 30,

  /** Maximum affinities to return */
  maxAffinities: 50,

  /** Minimum add rate to report a missing pattern */
  minAdditionRate: 0.15, // 15%

  /** Minimum removal rate to report over-generation */
  minRemovalRate: 0.20, // 20%
};

export type PatternExtractionConfig = typeof DEFAULT_CONFIG;

// ═══════════════════════════════════════════════════════════════════
// PATTERN EXTRACTOR SERVICE
// ═══════════════════════════════════════════════════════════════════

export class PatternExtractorService {
  private db: FirebaseFirestore.Firestore | null = null;
  private config: PatternExtractionConfig;

  constructor(
    db?: FirebaseFirestore.Firestore,
    config: Partial<PatternExtractionConfig> = {}
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
  // ELEMENT CO-OCCURRENCE ANALYSIS
  // ═════════════════════════════════════════════════════════════════

  /**
   * Extract element affinities from successful generations
   *
   * Uses lift score to identify elements that appear together
   * more often than expected by chance.
   */
  async extractAffinities(): Promise<ElementAffinity[]> {
    const generations = await this.getSuccessfulGenerations();

    if (generations.length < this.config.minAffinitySamples) {
      console.log('[PatternExtractor] Insufficient samples for affinity analysis:', generations.length);
      return [];
    }

    // Build co-occurrence matrix
    const coMatrix = this.buildCooccurrenceMatrix(generations);

    // Calculate element frequencies
    const elementFrequencies = this.calculateElementFrequencies(generations);

    // Calculate affinity scores
    const affinities = this.calculateAffinityScores(
      coMatrix,
      elementFrequencies,
      generations.length
    );

    // Filter and sort
    return affinities
      .filter(a => a.liftScore >= this.config.minLiftScore)
      .sort((a, b) => b.liftScore - a.liftScore)
      .slice(0, this.config.maxAffinities);
  }

  /**
   * Build co-occurrence matrix from generations
   */
  private buildCooccurrenceMatrix(
    generations: AIGenerationRecord[]
  ): Map<string, Map<string, { count: number; scores: number[]; contexts: string[] }>> {
    const matrix = new Map<string, Map<string, { count: number; scores: number[]; contexts: string[] }>>();

    for (const gen of generations) {
      const elements = gen.elementTypes;
      const score = gen.validation.score.overall;
      const context = gen.spaceContext?.category || 'general';

      // For each pair of elements in this generation
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          // Sort to ensure consistent ordering
          const [a, b] = [elements[i], elements[j]].sort();

          if (!matrix.has(a)) {
            matrix.set(a, new Map());
          }

          const aMap = matrix.get(a)!;
          if (!aMap.has(b)) {
            aMap.set(b, { count: 0, scores: [], contexts: [] });
          }

          const data = aMap.get(b)!;
          data.count++;
          data.scores.push(score);
          if (!data.contexts.includes(context)) {
            data.contexts.push(context);
          }
        }
      }
    }

    return matrix;
  }

  /**
   * Calculate element frequencies
   */
  private calculateElementFrequencies(
    generations: AIGenerationRecord[]
  ): Map<string, number> {
    const frequencies = new Map<string, number>();

    for (const gen of generations) {
      for (const element of gen.elementTypes) {
        frequencies.set(element, (frequencies.get(element) || 0) + 1);
      }
    }

    return frequencies;
  }

  /**
   * Calculate affinity scores using lift
   *
   * Lift(A,B) = P(A,B) / (P(A) * P(B))
   *
   * - lift > 1: positive association (appear together more than random)
   * - lift = 1: independent (no association)
   * - lift < 1: negative association (appear together less than random)
   */
  private calculateAffinityScores(
    coMatrix: Map<string, Map<string, { count: number; scores: number[]; contexts: string[] }>>,
    frequencies: Map<string, number>,
    totalGenerations: number
  ): ElementAffinity[] {
    const affinities: ElementAffinity[] = [];
    const now = new Date();

    for (const [elementA, bMap] of coMatrix) {
      const pA = (frequencies.get(elementA) || 0) / totalGenerations;

      for (const [elementB, data] of bMap) {
        const pB = (frequencies.get(elementB) || 0) / totalGenerations;
        const pAB = data.count / totalGenerations;

        // Calculate lift
        const liftScore = pAB / (pA * pB);

        // Calculate conditional probability P(B|A)
        const conditionalProbability = data.count / (frequencies.get(elementA) || 1);

        // Calculate average quality score
        const avgQualityScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

        affinities.push({
          elementA,
          elementB,
          cooccurrenceCount: data.count,
          liftScore,
          conditionalProbability,
          contexts: data.contexts,
          avgQualityScore,
          computedAt: now,
        });
      }
    }

    return affinities;
  }

  // ═════════════════════════════════════════════════════════════════
  // MISSING PATTERN ANALYSIS
  // ═════════════════════════════════════════════════════════════════

  /**
   * Extract patterns of elements users frequently add after generation
   *
   * This is a strong signal that AI should be generating these combinations
   * in the first place.
   */
  async extractMissingPatterns(): Promise<MissingPattern[]> {
    const edits = await this.getEditsWithAdditions();

    if (edits.length === 0) {
      return [];
    }

    // Track what elements are added after which generated elements
    const additionPatterns = new Map<string, Map<string, { count: number; contexts: string[] }>>();

    for (const edit of edits) {
      // Get elements that were generated
      const generatedElements = new Set(
        edit.edits
          .filter(e => e.type !== 'add')
          .map(e => e.elementType)
          .filter(Boolean)
      );

      // Get elements that were added
      const addedElements = edit.edits
        .filter(e => e.type === 'add')
        .map(e => e.elementType)
        .filter(Boolean) as string[];

      // For each added element, track which generated elements it was added to
      for (const added of addedElements) {
        for (const generated of generatedElements) {
          if (!additionPatterns.has(generated)) {
            additionPatterns.set(generated, new Map());
          }

          const genMap = additionPatterns.get(generated)!;
          if (!genMap.has(added)) {
            genMap.set(added, { count: 0, contexts: [] });
          }

          const data = genMap.get(added)!;
          data.count++;
          // Note: edit records don't have context, so we'd need to join with generation records
        }
      }
    }

    // Calculate addition rates
    const patterns: MissingPattern[] = [];
    const now = new Date();

    // Count how many times each element was generated
    const generatedCounts = new Map<string, number>();
    for (const edit of edits) {
      const generated = edit.edits
        .filter(e => e.type !== 'add')
        .map(e => e.elementType)
        .filter(Boolean);
      for (const el of generated) {
        generatedCounts.set(el, (generatedCounts.get(el) || 0) + 1);
      }
    }

    for (const [generated, addedMap] of additionPatterns) {
      const generatedCount = generatedCounts.get(generated) || 1;

      for (const [added, data] of addedMap) {
        const additionRate = data.count / generatedCount;

        if (additionRate >= this.config.minAdditionRate) {
          patterns.push({
            generatedElement: generated,
            missingElement: added,
            additionRate,
            sampleSize: data.count,
            contexts: data.contexts,
            computedAt: now,
          });
        }
      }
    }

    return patterns.sort((a, b) => b.additionRate - a.additionRate);
  }

  // ═════════════════════════════════════════════════════════════════
  // OVER-GENERATION PATTERN ANALYSIS
  // ═════════════════════════════════════════════════════════════════

  /**
   * Extract patterns of elements AI generates that users consistently remove
   */
  async extractOverGenerationPatterns(): Promise<OverGenerationPattern[]> {
    const edits = await this.getEditsWithRemovals();

    if (edits.length === 0) {
      return [];
    }

    // Track removal rates by element type
    const removalCounts = new Map<string, number>();
    const totalGenCounts = new Map<string, number>();

    for (const edit of edits) {
      // Count removed elements
      const removed = edit.edits
        .filter(e => e.type === 'remove')
        .map(e => e.elementType)
        .filter(Boolean) as string[];

      for (const el of removed) {
        removalCounts.set(el, (removalCounts.get(el) || 0) + 1);
      }

      // Count all elements that were in the original generation
      const allOriginal = edit.edits
        .filter(e => e.type === 'remove' || e.type === 'modify' || e.type === 'reposition')
        .map(e => e.elementType)
        .filter(Boolean) as string[];

      for (const el of allOriginal) {
        totalGenCounts.set(el, (totalGenCounts.get(el) || 0) + 1);
      }
    }

    // Calculate removal rates
    const patterns: OverGenerationPattern[] = [];
    const now = new Date();

    for (const [element, removeCount] of removalCounts) {
      const totalCount = totalGenCounts.get(element) || 1;
      const removalRate = removeCount / totalCount;

      if (removalRate >= this.config.minRemovalRate) {
        patterns.push({
          removedElement: element,
          triggeringPromptPatterns: [], // TODO: Join with generation records to get prompts
          removalRate,
          sampleSize: removeCount,
          computedAt: now,
        });
      }
    }

    return patterns.sort((a, b) => b.removalRate - a.removalRate);
  }

  // ═════════════════════════════════════════════════════════════════
  // LAYOUT PATTERN ANALYSIS
  // ═════════════════════════════════════════════════════════════════

  /**
   * Extract layout patterns from successful tools
   */
  async extractLayoutPatterns(): Promise<LayoutPattern[]> {
    // This would require composition data with positions
    // For now, return empty - will implement when we have position data
    return [];
  }

  // ═════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═════════════════════════════════════════════════════════════════

  /**
   * Get successful generations from the data window
   */
  private async getSuccessfulGenerations(): Promise<AIGenerationRecord[]> {
    if (!this.db) {
      console.log('[PatternExtractor] No Firestore instance, returning empty');
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
      console.error('[PatternExtractor] Error fetching generations:', error);
      return [];
    }
  }

  /**
   * Get edit records that have additions
   */
  private async getEditsWithAdditions(): Promise<GenerationEditRecord[]> {
    if (!this.db) {
      return [];
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - this.config.dataWindowDays);

    try {
      const snapshot = await this.db
        .collection('ai_edits')
        .where('createdAt', '>=', windowStart)
        .where('summary.elementsAdded', '>', 0)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GenerationEditRecord[];
    } catch (error) {
      console.error('[PatternExtractor] Error fetching edits with additions:', error);
      return [];
    }
  }

  /**
   * Get edit records that have removals
   */
  private async getEditsWithRemovals(): Promise<GenerationEditRecord[]> {
    if (!this.db) {
      return [];
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - this.config.dataWindowDays);

    try {
      const snapshot = await this.db
        .collection('ai_edits')
        .where('createdAt', '>=', windowStart)
        .where('summary.elementsRemoved', '>', 0)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GenerationEditRecord[];
    } catch (error) {
      console.error('[PatternExtractor] Error fetching edits with removals:', error);
      return [];
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // BATCH EXTRACTION
  // ═════════════════════════════════════════════════════════════════

  /**
   * Extract all patterns in one operation
   * This is called by the scheduled job
   */
  async extractAllPatterns(): Promise<{
    affinities: ElementAffinity[];
    missingPatterns: MissingPattern[];
    overGenerationPatterns: OverGenerationPattern[];
    layoutPatterns: LayoutPattern[];
    metadata: {
      timestamp: Date;
      dataWindowDays: number;
    };
  }> {
    console.log('[PatternExtractor] Starting batch extraction...');

    const [affinities, missingPatterns, overGenerationPatterns, layoutPatterns] = await Promise.all([
      this.extractAffinities(),
      this.extractMissingPatterns(),
      this.extractOverGenerationPatterns(),
      this.extractLayoutPatterns(),
    ]);

    console.log('[PatternExtractor] Extraction complete:', {
      affinities: affinities.length,
      missingPatterns: missingPatterns.length,
      overGenerationPatterns: overGenerationPatterns.length,
      layoutPatterns: layoutPatterns.length,
    });

    return {
      affinities,
      missingPatterns,
      overGenerationPatterns,
      layoutPatterns,
      metadata: {
        timestamp: new Date(),
        dataWindowDays: this.config.dataWindowDays,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
let defaultPatternExtractor: PatternExtractorService | null = null;

/**
 * Get default pattern extractor instance
 */
export function getPatternExtractorService(): PatternExtractorService {
  if (!defaultPatternExtractor) {
    defaultPatternExtractor = new PatternExtractorService();
  }
  return defaultPatternExtractor;
}

/**
 * Initialize pattern extractor with Firestore
 */
export function initializePatternExtractor(db: FirebaseFirestore.Firestore): void {
  getPatternExtractorService().setFirestore(db);
}
