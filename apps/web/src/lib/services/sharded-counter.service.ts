/**
 * ShardedCounterService - Distributed counter implementation for high-throughput scenarios
 *
 * Firestore transactions are limited to ~25 writes/sec per document.
 * This service distributes counter writes across multiple shards to achieve
 * 200-2000 writes/sec depending on shard count.
 *
 * Architecture:
 *   Before: deployedTools/{id}/sharedState/current.counters["poll:optionA"] = 42
 *   After:  deployedTools/{id}/sharedState/counters/{counterKey}/shards/shard_{0-N}
 *
 * @author HIVE Engineering
 * @version 1.0.0
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '../firebase-admin';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default number of shards per counter.
 * 10 shards = 200 writes/sec capacity (10 * 20 writes/sec per shard)
 */
const DEFAULT_SHARD_COUNT = 10;

/**
 * Maximum shards for high-traffic counters (mega-events).
 * 100 shards = 2000 writes/sec capacity
 */
const MAX_SHARD_COUNT = 100;

/**
 * Cache TTL for aggregated counter values (milliseconds)
 * Trades slight staleness for read performance
 */
const COUNTER_CACHE_TTL_MS = 1000; // 1 second

// ============================================================================
// TYPES
// ============================================================================

export interface ShardedCounterConfig {
  /** Number of shards to distribute writes across (default: 10, max: 100) */
  shardCount?: number;
  /** Base path in Firestore (default: deployedTools/{deploymentId}/sharedState) */
  basePath?: string;
}

export interface CounterDelta {
  counterKey: string;
  delta: number;
}

interface ShardDocument {
  value: number;
  updatedAt: admin.firestore.Timestamp;
}

interface CachedCounter {
  value: number;
  cachedAt: number;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

/**
 * Simple in-memory cache for counter values.
 * Reduces Firestore reads for frequently accessed counters.
 */
const counterCache = new Map<string, CachedCounter>();

function getCacheKey(deploymentId: string, counterKey: string): string {
  return `${deploymentId}:${counterKey}`;
}

function getCachedValue(deploymentId: string, counterKey: string): number | null {
  const key = getCacheKey(deploymentId, counterKey);
  const cached = counterCache.get(key);

  if (!cached) return null;

  const now = Date.now();
  if (now - cached.cachedAt > COUNTER_CACHE_TTL_MS) {
    counterCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedValue(deploymentId: string, counterKey: string, value: number): void {
  const key = getCacheKey(deploymentId, counterKey);
  counterCache.set(key, { value, cachedAt: Date.now() });
}

function invalidateCache(deploymentId: string, counterKey: string): void {
  const key = getCacheKey(deploymentId, counterKey);
  counterCache.delete(key);
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class ShardedCounterService {
  private shardCount: number;
  private basePath: string;

  constructor(config: ShardedCounterConfig = {}) {
    this.shardCount = Math.min(
      config.shardCount ?? DEFAULT_SHARD_COUNT,
      MAX_SHARD_COUNT
    );
    this.basePath = config.basePath ?? 'deployedTools';
  }

  /**
   * Get the Firestore path for a counter's shards collection
   */
  private getShardsPath(deploymentId: string, counterKey: string): string {
    // Sanitize counterKey for Firestore path (replace : with _)
    const safeKey = counterKey.replace(/:/g, '_');
    return `${this.basePath}/${deploymentId}/sharedState/counters/${safeKey}/shards`;
  }

  /**
   * Get a random shard ID for distributing writes
   */
  private getRandomShardId(): string {
    const shardIndex = Math.floor(Math.random() * this.shardCount);
    return `shard_${shardIndex}`;
  }

  /**
   * Increment a counter by a delta value.
   * Writes to a random shard for load distribution.
   *
   * @param deploymentId - The deployment ID
   * @param counterKey - Counter identifier (e.g., "poll_001:option_a")
   * @param delta - Amount to increment (can be negative for decrement)
   */
  async increment(
    deploymentId: string,
    counterKey: string,
    delta: number
  ): Promise<void> {
    const shardsPath = this.getShardsPath(deploymentId, counterKey);
    const shardId = this.getRandomShardId();
    const shardRef = dbAdmin.doc(`${shardsPath}/${shardId}`);

    // Use FieldValue.increment for atomic operation (no transaction needed)
    await shardRef.set(
      {
        value: admin.firestore.FieldValue.increment(delta),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Invalidate cache since we know the value changed
    invalidateCache(deploymentId, counterKey);
  }

  /**
   * Increment multiple counters in a single batch operation.
   * Each counter writes to its own random shard.
   *
   * @param deploymentId - The deployment ID
   * @param deltas - Array of counter deltas to apply
   */
  async incrementBatch(
    deploymentId: string,
    deltas: CounterDelta[]
  ): Promise<void> {
    if (deltas.length === 0) return;

    const batch = dbAdmin.batch();

    for (const { counterKey, delta } of deltas) {
      const shardsPath = this.getShardsPath(deploymentId, counterKey);
      const shardId = this.getRandomShardId();
      const shardRef = dbAdmin.doc(`${shardsPath}/${shardId}`);

      batch.set(
        shardRef,
        {
          value: admin.firestore.FieldValue.increment(delta),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Invalidate cache for each counter
      invalidateCache(deploymentId, counterKey);
    }

    await batch.commit();
  }

  /**
   * Get the current value of a counter by aggregating all shards.
   *
   * @param deploymentId - The deployment ID
   * @param counterKey - Counter identifier
   * @param useCache - Whether to use cached value if available (default: true)
   * @returns The aggregated counter value
   */
  async getCount(
    deploymentId: string,
    counterKey: string,
    useCache: boolean = true
  ): Promise<number> {
    // Check cache first
    if (useCache) {
      const cached = getCachedValue(deploymentId, counterKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Aggregate all shards
    const shardsPath = this.getShardsPath(deploymentId, counterKey);
    const shardsSnapshot = await dbAdmin.collection(shardsPath).get();

    let total = 0;
    for (const doc of shardsSnapshot.docs) {
      const data = doc.data() as ShardDocument;
      total += data.value || 0;
    }

    // Cache the result
    setCachedValue(deploymentId, counterKey, total);

    return total;
  }

  /**
   * Get multiple counter values in a single operation.
   * Optimizes reads by batching Firestore queries.
   *
   * @param deploymentId - The deployment ID
   * @param counterKeys - Array of counter identifiers
   * @returns Map of counterKey -> value
   */
  async getCountBatch(
    deploymentId: string,
    counterKeys: string[]
  ): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    const keysToFetch: string[] = [];

    // Check cache for each key
    for (const key of counterKeys) {
      const cached = getCachedValue(deploymentId, key);
      if (cached !== null) {
        results[key] = cached;
      } else {
        keysToFetch.push(key);
      }
    }

    // Fetch uncached keys in parallel
    if (keysToFetch.length > 0) {
      const fetchPromises = keysToFetch.map(async (key) => {
        const value = await this.getCount(deploymentId, key, false);
        return { key, value };
      });

      const fetched = await Promise.all(fetchPromises);
      for (const { key, value } of fetched) {
        results[key] = value;
      }
    }

    return results;
  }

  /**
   * Get all counters for a deployment.
   * Lists all counter subcollections and aggregates each.
   *
   * @param deploymentId - The deployment ID
   * @returns Map of counterKey -> value
   */
  async getAllCounters(deploymentId: string): Promise<Record<string, number>> {
    const countersPath = `${this.basePath}/${deploymentId}/sharedState/counters`;
    const countersRef = dbAdmin.collection(countersPath);

    // List all counter documents (each represents a counter key)
    const countersSnapshot = await countersRef.listDocuments();

    const results: Record<string, number> = {};

    // Aggregate each counter's shards
    const aggregatePromises = countersSnapshot.map(async (counterDoc) => {
      const counterKey = counterDoc.id.replace(/_/g, ':'); // Restore : from _
      const shardsSnapshot = await counterDoc.collection('shards').get();

      let total = 0;
      for (const shardDoc of shardsSnapshot.docs) {
        const data = shardDoc.data() as ShardDocument;
        total += data.value || 0;
      }

      results[counterKey] = total;
      setCachedValue(deploymentId, counterKey, total);
    });

    await Promise.all(aggregatePromises);

    return results;
  }

  /**
   * Delete all shards for a counter.
   * Use when removing a counter entirely.
   *
   * @param deploymentId - The deployment ID
   * @param counterKey - Counter identifier to delete
   */
  async deleteCounter(
    deploymentId: string,
    counterKey: string
  ): Promise<void> {
    const shardsPath = this.getShardsPath(deploymentId, counterKey);
    const shardsSnapshot = await dbAdmin.collection(shardsPath).get();

    const batch = dbAdmin.batch();
    for (const doc of shardsSnapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();

    // Also delete the parent counter document
    const counterPath = `${this.basePath}/${deploymentId}/sharedState/counters/${counterKey.replace(/:/g, '_')}`;
    await dbAdmin.doc(counterPath).delete();

    invalidateCache(deploymentId, counterKey);
  }

  /**
   * Initialize shards for a new counter with a starting value.
   * Useful for migrating existing counters to sharded format.
   *
   * @param deploymentId - The deployment ID
   * @param counterKey - Counter identifier
   * @param initialValue - Starting value (distributed across first shard)
   */
  async initializeCounter(
    deploymentId: string,
    counterKey: string,
    initialValue: number
  ): Promise<void> {
    const shardsPath = this.getShardsPath(deploymentId, counterKey);
    const firstShardRef = dbAdmin.doc(`${shardsPath}/shard_0`);

    await firstShardRef.set({
      value: initialValue,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    setCachedValue(deploymentId, counterKey, initialValue);
  }

  /**
   * Get shard count configuration
   */
  getShardCount(): number {
    return this.shardCount;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default sharded counter service instance.
 * Use this for most operations.
 */
export const shardedCounterService = new ShardedCounterService();

/**
 * Create a high-capacity counter service for mega-events.
 * Uses 100 shards for 2000 writes/sec capacity.
 */
export function createHighCapacityCounterService(): ShardedCounterService {
  return new ShardedCounterService({ shardCount: MAX_SHARD_COUNT });
}

export default shardedCounterService;
