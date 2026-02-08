/**
 * ShardedMemberCounterService - Distributed member count for spaces
 *
 * Firestore has a hard limit of 1 write/second per document.
 * Popular spaces with 50+ joins/minute will hit this limit.
 * This service distributes member count writes across 10 shards.
 *
 * Architecture:
 *   Before: spaces/{spaceId}.memberCount = 342
 *   After:  spaces/{spaceId}/memberCountShards/shard_{0-9}.count
 *           spaces/{spaceId}.memberCount = (cached aggregate, refreshed periodically)
 *
 * Capacity: 10 shards * ~20 writes/sec = 200 writes/sec (vs 1 write/sec before)
 *
 * @author HIVE Engineering
 * @version 1.0.0
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '../firebase-admin';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SHARD_COUNT = 10;
const CACHE_TTL_MS = 5000; // 5 seconds

// ============================================================================
// TYPES
// ============================================================================

interface ShardDocument {
  count: number;
  updatedAt: admin.firestore.Timestamp;
}

interface CachedCount {
  value: number;
  cachedAt: number;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

const memberCountCache = new Map<string, CachedCount>();

function getCachedMemberCount(spaceId: string): number | null {
  const cached = memberCountCache.get(spaceId);
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    memberCountCache.delete(spaceId);
    return null;
  }

  return cached.value;
}

function setCachedMemberCount(spaceId: string, value: number): void {
  memberCountCache.set(spaceId, { value, cachedAt: Date.now() });
}

function invalidateMemberCountCache(spaceId: string): void {
  memberCountCache.delete(spaceId);
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Get the shards collection path for a space
 */
function getShardsPath(spaceId: string): string {
  return `spaces/${spaceId}/memberCountShards`;
}

/**
 * Get a random shard ID for distributing writes
 */
function getRandomShardId(): string {
  const shardIndex = Math.floor(Math.random() * SHARD_COUNT);
  return `shard_${shardIndex}`;
}

/**
 * Increment member count for a space.
 * Writes to a random shard for load distribution.
 *
 * @param spaceId - The space ID
 * @param delta - Amount to increment (1 for join, -1 for leave)
 */
export async function incrementMemberCount(
  spaceId: string,
  delta: number = 1
): Promise<void> {
  const shardsPath = getShardsPath(spaceId);
  const shardId = getRandomShardId();
  const shardRef = dbAdmin.doc(`${shardsPath}/${shardId}`);

  await shardRef.set(
    {
      count: admin.firestore.FieldValue.increment(delta),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  invalidateMemberCountCache(spaceId);
}

/**
 * Decrement member count for a space (convenience wrapper)
 */
export async function decrementMemberCount(spaceId: string): Promise<void> {
  return incrementMemberCount(spaceId, -1);
}

/**
 * Get the current member count by aggregating all shards.
 *
 * @param spaceId - The space ID
 * @param useCache - Whether to use cached value if available (default: true)
 * @returns The aggregated member count
 */
export async function getMemberCount(
  spaceId: string,
  useCache: boolean = true
): Promise<number> {
  // Check cache first
  if (useCache) {
    const cached = getCachedMemberCount(spaceId);
    if (cached !== null) {
      return cached;
    }
  }

  // Aggregate all shards
  const shardsPath = getShardsPath(spaceId);
  const shardsSnapshot = await dbAdmin.collection(shardsPath).get();

  let total = 0;
  for (const doc of shardsSnapshot.docs) {
    const data = doc.data() as ShardDocument;
    total += data.count || 0;
  }

  // Cache the result
  setCachedMemberCount(spaceId, total);

  return total;
}

/**
 * Initialize sharded member count from existing space document.
 * Call this once per space to migrate from inline memberCount.
 *
 * @param spaceId - The space ID
 * @param currentCount - Current member count to migrate
 */
export async function initializeMemberCount(
  spaceId: string,
  currentCount: number
): Promise<void> {
  const shardsPath = getShardsPath(spaceId);
  const firstShardRef = dbAdmin.doc(`${shardsPath}/shard_0`);

  await firstShardRef.set({
    count: currentCount,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  setCachedMemberCount(spaceId, currentCount);
}

/**
 * Sync the cached aggregate back to the space document.
 * Call this periodically (e.g., every 30 seconds) to keep the
 * space document's memberCount field updated for simple queries.
 *
 * @param spaceId - The space ID
 */
export async function syncMemberCountToSpace(spaceId: string): Promise<void> {
  const count = await getMemberCount(spaceId, false);
  const spaceRef = dbAdmin.doc(`spaces/${spaceId}`);

  await spaceRef.update({
    memberCount: count,
    memberCountSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Batch sync multiple spaces' member counts.
 * Useful for periodic background job.
 *
 * @param spaceIds - Array of space IDs to sync
 */
export async function syncMemberCountBatch(spaceIds: string[]): Promise<void> {
  const batch = dbAdmin.batch();

  for (const spaceId of spaceIds) {
    const count = await getMemberCount(spaceId, false);
    const spaceRef = dbAdmin.doc(`spaces/${spaceId}`);

    batch.update(spaceRef, {
      memberCount: count,
      memberCountSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Check if a space has been migrated to sharded counters.
 *
 * @param spaceId - The space ID
 * @returns true if shards exist
 */
export async function isSpaceMigrated(spaceId: string): Promise<boolean> {
  const shardsPath = getShardsPath(spaceId);
  const shardsSnapshot = await dbAdmin.collection(shardsPath).limit(1).get();
  return !shardsSnapshot.empty;
}

// ============================================================================
// FEATURE FLAG
// ============================================================================

/**
 * Check if sharded member counts are enabled.
 * Allows gradual rollout.
 */
export function isShardedMemberCountEnabled(): boolean {
  return process.env.USE_SHARDED_MEMBER_COUNT === 'true';
}

const shardedMemberCounterService = {
  incrementMemberCount,
  decrementMemberCount,
  getMemberCount,
  initializeMemberCount,
  syncMemberCountToSpace,
  syncMemberCountBatch,
  isSpaceMigrated,
  isShardedMemberCountEnabled,
};

export default shardedMemberCounterService;
