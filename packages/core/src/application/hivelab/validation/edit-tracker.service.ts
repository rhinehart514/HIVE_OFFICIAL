/**
 * Edit Tracker Service
 *
 * Tracks what users change after AI generation - the "gold signal" for understanding
 * where AI outputs miss the mark. This data is crucial for prompt improvement.
 *
 * Firestore Collection: ai_edits
 */

import type {
  GenerationEditRecord,
  ElementEdit,
} from '../../../domain/hivelab/validation/types';
import type { ToolComposition, CanvasElement } from '../../../domain/hivelab/tool-composition.types';

// ═══════════════════════════════════════════════════════════════════
// EDIT DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Input for tracking edits
 */
export interface EditTrackingInput {
  /** Reference to the generation */
  generationId: string;

  /** User who made edits */
  userId: string;

  /** Composition before edits */
  before: ToolComposition;

  /** Composition after edits */
  after: ToolComposition;

  /** Time from generation complete to first edit */
  timeToFirstEditMs: number;

  /** Total time spent editing */
  totalEditTimeMs: number;

  /** What user did after editing */
  finalOutcome: 'deployed' | 'saved' | 'discarded';
}

// ═══════════════════════════════════════════════════════════════════
// EDIT TRACKER SERVICE
// ═══════════════════════════════════════════════════════════════════

/**
 * Edit Tracker Service
 *
 * Detects and records differences between AI output and user modifications.
 */
export class EditTrackerService {
  private db: FirebaseFirestore.Firestore | null = null;
  private collectionName = 'ai_edits';

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
   * Track edits between two compositions
   */
  async trackEdits(input: EditTrackingInput): Promise<string> {
    // Detect all edits
    const edits = this.detectEdits(input.before, input.after);

    // Calculate summary
    const summary = this.calculateSummary(edits);

    const record: Omit<GenerationEditRecord, 'id'> = {
      generationId: input.generationId,
      userId: input.userId,
      beforeCompositionId: `before-${input.generationId}`,
      afterCompositionId: `after-${input.generationId}`,
      edits,
      summary,
      timeToFirstEditMs: input.timeToFirstEditMs,
      totalEditTimeMs: input.totalEditTimeMs,
      editCount: edits.length,
      finalOutcome: input.finalOutcome,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    // If no Firestore, return mock ID (for testing/dev)
    if (!this.db) {
      const mockId = `edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      console.log('[EditTracker] Mock edit record:', mockId, {
        editCount: edits.length,
        summary,
      });
      return mockId;
    }

    const docRef = await this.db.collection(this.collectionName).add(record);
    return docRef.id;
  }

  /**
   * Detect all edits between two compositions
   */
  detectEdits(before: ToolComposition, after: ToolComposition): ElementEdit[] {
    const edits: ElementEdit[] = [];
    const now = new Date();

    // Create maps for easier lookup
    const beforeElements = new Map(before.elements.map(el => [el.instanceId, el]));
    const afterElements = new Map(after.elements.map(el => [el.instanceId, el]));

    // 1. Find removed elements
    for (const [instanceId, element] of beforeElements) {
      if (!afterElements.has(instanceId)) {
        edits.push({
          type: 'remove',
          elementType: element.elementId,
          instanceId,
          timestamp: now,
        });
      }
    }

    // 2. Find added elements
    for (const [instanceId, element] of afterElements) {
      if (!beforeElements.has(instanceId)) {
        edits.push({
          type: 'add',
          elementType: element.elementId,
          instanceId,
          timestamp: now,
        });
      }
    }

    // 3. Find modified elements
    for (const [instanceId, afterElement] of afterElements) {
      const beforeElement = beforeElements.get(instanceId);
      if (!beforeElement) continue;

      // Check position changes
      if (
        beforeElement.position.x !== afterElement.position.x ||
        beforeElement.position.y !== afterElement.position.y
      ) {
        edits.push({
          type: 'reposition',
          instanceId,
          field: 'position',
          oldValue: beforeElement.position,
          newValue: afterElement.position,
          timestamp: now,
        });
      }

      // Check size changes
      if (
        beforeElement.size.width !== afterElement.size.width ||
        beforeElement.size.height !== afterElement.size.height
      ) {
        edits.push({
          type: 'modify',
          instanceId,
          field: 'size',
          oldValue: beforeElement.size,
          newValue: afterElement.size,
          timestamp: now,
        });
      }

      // Check config changes
      const configEdits = this.detectConfigChanges(
        instanceId,
        beforeElement.config,
        afterElement.config
      );
      edits.push(...configEdits);
    }

    // 4. Find connection changes
    const connectionEdits = this.detectConnectionChanges(
      before.connections,
      after.connections
    );
    edits.push(...connectionEdits);

    return edits;
  }

  /**
   * Detect changes in element config
   */
  private detectConfigChanges(
    instanceId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): ElementEdit[] {
    const edits: ElementEdit[] = [];
    const now = new Date();

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const beforeValue = before[key];
      const afterValue = after[key];

      // Deep equality check
      if (!this.deepEqual(beforeValue, afterValue)) {
        edits.push({
          type: 'modify',
          instanceId,
          field: `config.${key}`,
          oldValue: beforeValue,
          newValue: afterValue,
          timestamp: now,
        });
      }
    }

    return edits;
  }

  /**
   * Detect connection changes
   */
  private detectConnectionChanges(
    before: ToolComposition['connections'],
    after: ToolComposition['connections']
  ): ElementEdit[] {
    const edits: ElementEdit[] = [];
    const now = new Date();

    // Create connection keys for comparison
    const makeKey = (conn: typeof before[0]) =>
      `${conn.from.instanceId}:${conn.from.output}→${conn.to.instanceId}:${conn.to.input}`;

    const beforeKeys = new Set(before.map(makeKey));
    const afterKeys = new Set(after.map(makeKey));

    // Find removed connections
    for (const conn of before) {
      const key = makeKey(conn);
      if (!afterKeys.has(key)) {
        edits.push({
          type: 'reconnect',
          field: 'connection_removed',
          oldValue: conn,
          newValue: undefined,
          timestamp: now,
        });
      }
    }

    // Find added connections
    for (const conn of after) {
      const key = makeKey(conn);
      if (!beforeKeys.has(key)) {
        edits.push({
          type: 'reconnect',
          field: 'connection_added',
          oldValue: undefined,
          newValue: conn,
          timestamp: now,
        });
      }
    }

    return edits;
  }

  /**
   * Deep equality check
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return false;
    if (typeof a !== 'object') return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => this.deepEqual(item, b[i]));
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keys = Object.keys(aObj);
    if (keys.length !== Object.keys(bObj).length) return false;

    return keys.every(key => this.deepEqual(aObj[key], bObj[key]));
  }

  /**
   * Calculate summary statistics from edits
   */
  private calculateSummary(edits: ElementEdit[]): GenerationEditRecord['summary'] {
    return {
      elementsAdded: edits.filter(e => e.type === 'add').length,
      elementsRemoved: edits.filter(e => e.type === 'remove').length,
      elementsModified: new Set(
        edits.filter(e => e.type === 'modify').map(e => e.instanceId)
      ).size,
      configsChanged: edits.filter(
        e => e.type === 'modify' && e.field?.startsWith('config.')
      ).length,
      positionsChanged: edits.filter(e => e.type === 'reposition').length,
      connectionsAdded: edits.filter(
        e => e.type === 'reconnect' && e.field === 'connection_added'
      ).length,
      connectionsRemoved: edits.filter(
        e => e.type === 'reconnect' && e.field === 'connection_removed'
      ).length,
    };
  }

  /**
   * Get edit patterns for analysis
   */
  async getEditPatterns(
    startDate: Date,
    endDate: Date
  ): Promise<EditPatterns> {
    if (!this.db) {
      return this.getEmptyPatterns();
    }

    const snapshot = await this.db
      .collection(this.collectionName)
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    const records = snapshot.docs.map(doc => doc.data() as GenerationEditRecord);
    return this.analyzePatterns(records);
  }

  /**
   * Get edits for a specific generation
   */
  async getEditsForGeneration(generationId: string): Promise<GenerationEditRecord | null> {
    if (!this.db) {
      return null;
    }

    const snapshot = await this.db
      .collection(this.collectionName)
      .where('generationId', '==', generationId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as GenerationEditRecord;
  }

  /**
   * Get recent edits
   */
  async getRecentEdits(limit: number = 50): Promise<GenerationEditRecord[]> {
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
    })) as GenerationEditRecord[];
  }

  /**
   * Analyze edit patterns across records
   */
  private analyzePatterns(records: GenerationEditRecord[]): EditPatterns {
    if (records.length === 0) {
      return this.getEmptyPatterns();
    }

    const total = records.length;

    // Aggregate summaries
    let totalAdded = 0;
    let totalRemoved = 0;
    let totalModified = 0;
    let totalConfigChanges = 0;
    let totalPositionChanges = 0;
    let totalConnectionsAdded = 0;
    let totalConnectionsRemoved = 0;

    // Track element types that are frequently removed/added
    const removedElements: Record<string, number> = {};
    const addedElements: Record<string, number> = {};
    const modifiedFields: Record<string, number> = {};

    for (const record of records) {
      totalAdded += record.summary.elementsAdded;
      totalRemoved += record.summary.elementsRemoved;
      totalModified += record.summary.elementsModified;
      totalConfigChanges += record.summary.configsChanged;
      totalPositionChanges += record.summary.positionsChanged;
      totalConnectionsAdded += record.summary.connectionsAdded;
      totalConnectionsRemoved += record.summary.connectionsRemoved;

      // Track by element type
      for (const edit of record.edits) {
        if (edit.type === 'remove' && edit.elementType) {
          removedElements[edit.elementType] = (removedElements[edit.elementType] || 0) + 1;
        }
        if (edit.type === 'add' && edit.elementType) {
          addedElements[edit.elementType] = (addedElements[edit.elementType] || 0) + 1;
        }
        if (edit.type === 'modify' && edit.field) {
          modifiedFields[edit.field] = (modifiedFields[edit.field] || 0) + 1;
        }
      }
    }

    // Sort and get top items
    const sortedRemoved = Object.entries(removedElements)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([elementType, count]) => ({ elementType, count, rate: count / total }));

    const sortedAdded = Object.entries(addedElements)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([elementType, count]) => ({ elementType, count, rate: count / total }));

    const sortedFields = Object.entries(modifiedFields)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([field, count]) => ({ field, count, rate: count / total }));

    // Calculate timing stats
    const editTimes = records.map(r => r.timeToFirstEditMs);
    const sortedEditTimes = [...editTimes].sort((a, b) => a - b);

    return {
      totalEditSessions: total,
      avgEditsPerSession: records.reduce((a, r) => a + r.editCount, 0) / total,

      // Edit type breakdown
      avgElementsAdded: totalAdded / total,
      avgElementsRemoved: totalRemoved / total,
      avgElementsModified: totalModified / total,
      avgConfigChanges: totalConfigChanges / total,
      avgPositionChanges: totalPositionChanges / total,
      avgConnectionsAdded: totalConnectionsAdded / total,
      avgConnectionsRemoved: totalConnectionsRemoved / total,

      // High-signal patterns
      mostRemovedElements: sortedRemoved,
      mostAddedElements: sortedAdded,
      mostChangedFields: sortedFields,

      // Timing
      avgTimeToFirstEdit: editTimes.reduce((a, b) => a + b, 0) / total,
      medianTimeToFirstEdit: sortedEditTimes[Math.floor(total / 2)] || 0,

      // Outcome distribution
      outcomeDistribution: {
        deployed: records.filter(r => r.finalOutcome === 'deployed').length / total,
        saved: records.filter(r => r.finalOutcome === 'saved').length / total,
        discarded: records.filter(r => r.finalOutcome === 'discarded').length / total,
      },
    };
  }

  /**
   * Get empty patterns structure
   */
  private getEmptyPatterns(): EditPatterns {
    return {
      totalEditSessions: 0,
      avgEditsPerSession: 0,
      avgElementsAdded: 0,
      avgElementsRemoved: 0,
      avgElementsModified: 0,
      avgConfigChanges: 0,
      avgPositionChanges: 0,
      avgConnectionsAdded: 0,
      avgConnectionsRemoved: 0,
      mostRemovedElements: [],
      mostAddedElements: [],
      mostChangedFields: [],
      avgTimeToFirstEdit: 0,
      medianTimeToFirstEdit: 0,
      outcomeDistribution: { deployed: 0, saved: 0, discarded: 0 },
    };
  }
}

/**
 * Edit patterns analysis
 */
export interface EditPatterns {
  totalEditSessions: number;
  avgEditsPerSession: number;

  // Edit type breakdown
  avgElementsAdded: number;
  avgElementsRemoved: number;
  avgElementsModified: number;
  avgConfigChanges: number;
  avgPositionChanges: number;
  avgConnectionsAdded: number;
  avgConnectionsRemoved: number;

  // High-signal patterns (what AI gets wrong)
  mostRemovedElements: Array<{ elementType: string; count: number; rate: number }>;
  mostAddedElements: Array<{ elementType: string; count: number; rate: number }>;
  mostChangedFields: Array<{ field: string; count: number; rate: number }>;

  // Timing
  avgTimeToFirstEdit: number;
  medianTimeToFirstEdit: number;

  // Outcome distribution
  outcomeDistribution: {
    deployed: number;
    saved: number;
    discarded: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
let defaultEditTrackerService: EditTrackerService | null = null;

/**
 * Get default edit tracker service instance
 */
export function getEditTrackerService(): EditTrackerService {
  if (!defaultEditTrackerService) {
    defaultEditTrackerService = new EditTrackerService();
  }
  return defaultEditTrackerService;
}

/**
 * Initialize edit tracker with Firestore
 */
export function initializeEditTracker(db: FirebaseFirestore.Firestore): void {
  getEditTrackerService().setFirestore(db);
}
