/**
 * Firestore Write Buffer
 *
 * COST OPTIMIZATION: Batches rapid Firestore writes within a configurable window.
 * Reduces write costs by coalescing multiple updates to the same document.
 *
 * Usage:
 *   const buffer = getWriteBuffer();
 *   buffer.queueWrite(docRef, data, { merge: true });
 *   // Writes are automatically flushed after FLUSH_DELAY_MS or when buffer is full
 */

import type { Firestore, DocumentReference, WriteResult } from 'firebase-admin/firestore';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default delay before flushing queued writes (milliseconds)
 * Short enough for good UX, long enough to batch rapid updates
 */
const DEFAULT_FLUSH_DELAY_MS = 200;

/**
 * Maximum number of writes to buffer before forcing a flush
 * Firestore batch limit is 500, but we use a lower limit for responsiveness
 */
const MAX_BUFFER_SIZE = 50;

/**
 * Maximum age of a queued write before it's forced to flush (milliseconds)
 * Prevents writes from being delayed indefinitely
 */
const MAX_WRITE_AGE_MS = 1000;

// ============================================================================
// Types
// ============================================================================

interface QueuedWrite {
  docRef: DocumentReference;
  data: Record<string, unknown>;
  options: WriteOptions;
  queuedAt: number;
  resolve: (result: WriteResult) => void;
  reject: (error: Error) => void;
}

interface WriteOptions {
  merge?: boolean;
}

interface WriteBufferOptions {
  flushDelayMs?: number;
  maxBufferSize?: number;
  maxWriteAgeMs?: number;
}

// ============================================================================
// Write Buffer Class
// ============================================================================

export class FirestoreWriteBuffer {
  private queue: Map<string, QueuedWrite> = new Map();
  private flushTimeout: NodeJS.Timeout | null = null;
  private flushDelayMs: number;
  private maxBufferSize: number;
  private maxWriteAgeMs: number;
  private db: Firestore;

  constructor(db: Firestore, options: WriteBufferOptions = {}) {
    this.db = db;
    this.flushDelayMs = options.flushDelayMs ?? DEFAULT_FLUSH_DELAY_MS;
    this.maxBufferSize = options.maxBufferSize ?? MAX_BUFFER_SIZE;
    this.maxWriteAgeMs = options.maxWriteAgeMs ?? MAX_WRITE_AGE_MS;
  }

  /**
   * Queue a write operation. Returns a promise that resolves when the write completes.
   * If a write to the same document is already queued, the data is merged.
   */
  queueWrite(
    docRef: DocumentReference,
    data: Record<string, unknown>,
    options: WriteOptions = {}
  ): Promise<WriteResult> {
    return new Promise((resolve, reject) => {
      const key = docRef.path;
      const now = Date.now();

      // Check if there's an existing queued write for this document
      const existing = this.queue.get(key);
      if (existing) {
        // Merge data with existing queued write
        existing.data = this.mergeData(existing.data, data, options.merge);
        // Chain the new promise to the existing one
        const originalResolve = existing.resolve;
        const originalReject = existing.reject;
        existing.resolve = (result) => {
          originalResolve(result);
          resolve(result);
        };
        existing.reject = (error) => {
          originalReject(error);
          reject(error);
        };
      } else {
        // Add new write to queue
        this.queue.set(key, {
          docRef,
          data,
          options,
          queuedAt: now,
          resolve,
          reject,
        });
      }

      // Schedule flush if not already scheduled
      this.scheduleFlush();

      // Check if buffer is full or oldest write is too old
      if (this.queue.size >= this.maxBufferSize || this.hasOldWrites()) {
        this.flush();
      }
    });
  }

  /**
   * Immediately flush all queued writes
   */
  async flush(): Promise<void> {
    // Clear scheduled flush
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    // Get all queued writes
    const writes = Array.from(this.queue.values());
    this.queue.clear();

    if (writes.length === 0) return;

    // Execute as a batch
    try {
      const batch = this.db.batch();

      for (const write of writes) {
        if (write.options.merge) {
          batch.set(write.docRef, write.data, { merge: true });
        } else {
          batch.set(write.docRef, write.data);
        }
      }

      const results = await batch.commit();

      // Resolve all promises
      writes.forEach((write, index) => {
        write.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises
      const err = error instanceof Error ? error : new Error('Batch write failed');
      writes.forEach((write) => {
        write.reject(err);
      });
    }
  }

  /**
   * Get the number of pending writes
   */
  get pendingCount(): number {
    return this.queue.size;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private scheduleFlush(): void {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      void this.flush();
    }, this.flushDelayMs);
  }

  private hasOldWrites(): boolean {
    const now = Date.now();
    for (const write of this.queue.values()) {
      if (now - write.queuedAt > this.maxWriteAgeMs) {
        return true;
      }
    }
    return false;
  }

  private mergeData(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
    merge?: boolean
  ): Record<string, unknown> {
    if (!merge) {
      // Full replacement - incoming takes precedence
      return incoming;
    }

    // Deep merge for merge mode
    return this.deepMerge(existing, incoming);
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...target };

    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge objects
        result[key] = this.deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        // Overwrite with source value
        result[key] = sourceValue;
      }
    }

    return result;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: FirestoreWriteBuffer | null = null;

/**
 * Get or create the singleton write buffer instance
 */
export function getWriteBuffer(db: Firestore, options?: WriteBufferOptions): FirestoreWriteBuffer {
  if (!instance) {
    instance = new FirestoreWriteBuffer(db, options);
  }
  return instance;
}

/**
 * Create a new write buffer (non-singleton, for testing or isolated use)
 */
export function createWriteBuffer(db: Firestore, options?: WriteBufferOptions): FirestoreWriteBuffer {
  return new FirestoreWriteBuffer(db, options);
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetWriteBuffer(): void {
  if (instance) {
    // Flush any pending writes before resetting
    void instance.flush();
  }
  instance = null;
}
