/**
 * ToolStateBroadcaster - Real-time state synchronization via Firebase RTDB
 *
 * Syncs tool state changes from Firestore (source of truth) to RTDB (real-time broadcast).
 * Clients subscribe to RTDB for instant updates instead of polling Firestore.
 *
 * Architecture:
 *   Firestore (durable, source of truth)
 *        ↓ (on action)
 *   ToolStateBroadcaster.broadcast()
 *        ↓
 *   RTDB: tool_state/{deploymentId}
 *        ↓ (real-time)
 *   Client listeners
 *
 * RTDB Path Structure:
 *   tool_state/{deploymentId}/
 *     counters/          - Aggregated counter values
 *     collections/       - Collection summaries (counts, recent)
 *     timeline/          - Recent timeline events (last 10)
 *     metadata/          - Version, lastModified, etc.
 *
 * @author HIVE Engineering
 * @version 1.0.0
 */

import * as admin from 'firebase-admin';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum timeline events to broadcast (keep RTDB lean)
 */
const BROADCAST_TIMELINE_LIMIT = 10;

/**
 * TTL for broadcast data in RTDB (milliseconds)
 * Stale data is cleaned up by background job
 */
const BROADCAST_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// TYPES
// ============================================================================

export interface BroadcastCounters {
  [key: string]: number;
}

export interface BroadcastCollectionSummary {
  count: number;
  recentIds: string[];
  lastUpdated: string;
}

export interface BroadcastTimelineEvent {
  id: string;
  type: string;
  userId: string;
  action: string;
  timestamp: string;
}

export interface BroadcastMetadata {
  version: number;
  lastModified: string;
  broadcastAt: number; // Server timestamp
  deploymentId: string;
  toolId: string;
}

export interface ToolStateBroadcast {
  counters: BroadcastCounters;
  collections: Record<string, BroadcastCollectionSummary>;
  timeline: BroadcastTimelineEvent[];
  metadata: BroadcastMetadata;
}

export interface BroadcastOptions {
  /** Only broadcast counters (skip collections/timeline) */
  countersOnly?: boolean;
  /** Include full collection data (not just summaries) */
  fullCollections?: boolean;
  /** Specific counter keys to broadcast */
  counterKeys?: string[];
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class ToolStateBroadcasterService {
  private rtdb: admin.database.Database;
  private enabled: boolean;

  constructor() {
    // Initialize RTDB - handle case where admin SDK not initialized
    try {
      this.rtdb = admin.database();
      this.enabled = true;
    } catch {
      console.warn('RTDB not available - tool state broadcasting disabled');
      this.enabled = false;
      this.rtdb = null as unknown as admin.database.Database;
    }
  }

  /**
   * Check if broadcasting is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the RTDB path for a deployment's state
   */
  private getStatePath(deploymentId: string): string {
    return `tool_state/${deploymentId}`;
  }

  /**
   * Broadcast full tool state to RTDB
   *
   * @param deploymentId - The deployment ID
   * @param state - The full tool state to broadcast
   * @param toolId - The tool ID for metadata
   */
  async broadcastFullState(
    deploymentId: string,
    state: {
      counters: Record<string, number>;
      collections: Record<string, Record<string, unknown>>;
      timeline: Array<{ id: string; type: string; userId: string; action: string; timestamp: string }>;
      version: number;
      lastModified: string;
    },
    toolId: string
  ): Promise<void> {
    if (!this.enabled) return;

    const statePath = this.getStatePath(deploymentId);

    // Prepare collection summaries (don't broadcast full collection data)
    const collectionSummaries: Record<string, BroadcastCollectionSummary> = {};
    for (const [key, entities] of Object.entries(state.collections)) {
      const entityIds = Object.keys(entities);
      collectionSummaries[key] = {
        count: entityIds.length,
        recentIds: entityIds.slice(-5), // Last 5 entity IDs
        lastUpdated: new Date().toISOString(),
      };
    }

    // Prepare timeline (limit to recent events)
    const recentTimeline = state.timeline.slice(-BROADCAST_TIMELINE_LIMIT).map((event) => ({
      id: event.id,
      type: event.type,
      userId: event.userId,
      action: event.action,
      timestamp: event.timestamp,
    }));

    const broadcast: ToolStateBroadcast = {
      counters: state.counters,
      collections: collectionSummaries,
      timeline: recentTimeline,
      metadata: {
        version: state.version,
        lastModified: state.lastModified,
        broadcastAt: admin.database.ServerValue.TIMESTAMP as unknown as number,
        deploymentId,
        toolId,
      },
    };

    await this.rtdb.ref(statePath).set(broadcast);
  }

  /**
   * Broadcast only counter updates to RTDB (optimized for high-frequency updates)
   *
   * @param deploymentId - The deployment ID
   * @param counters - Counter values to broadcast
   * @param version - State version number
   */
  async broadcastCounters(
    deploymentId: string,
    counters: Record<string, number>,
    version: number
  ): Promise<void> {
    if (!this.enabled) return;

    const statePath = this.getStatePath(deploymentId);

    // Use multi-path update for atomic operation
    const updates: Record<string, unknown> = {
      [`${statePath}/counters`]: counters,
      [`${statePath}/metadata/version`]: version,
      [`${statePath}/metadata/lastModified`]: new Date().toISOString(),
      [`${statePath}/metadata/broadcastAt`]: admin.database.ServerValue.TIMESTAMP,
    };

    await this.rtdb.ref().update(updates);
  }

  /**
   * Broadcast a single counter delta (for real-time poll updates)
   *
   * @param deploymentId - The deployment ID
   * @param counterKey - The counter key
   * @param newValue - The new counter value
   */
  async broadcastCounterUpdate(
    deploymentId: string,
    counterKey: string,
    newValue: number
  ): Promise<void> {
    if (!this.enabled) return;

    const counterPath = `${this.getStatePath(deploymentId)}/counters/${counterKey.replace(/:/g, '_')}`;
    await this.rtdb.ref(counterPath).set(newValue);
  }

  /**
   * Broadcast a timeline event (for activity feeds)
   * COST OPTIMIZATION: Uses atomic push for concurrent-safe event insertion
   *
   * @param deploymentId - The deployment ID
   * @param event - The timeline event to broadcast
   */
  async broadcastTimelineEvent(
    deploymentId: string,
    event: BroadcastTimelineEvent
  ): Promise<void> {
    if (!this.enabled) return;

    // Use atomic push to avoid race conditions
    // The timeline_events path uses push keys for ordering and atomic insertion
    const timelineEventsPath = `${this.getStatePath(deploymentId)}/timeline_events`;
    const timelineEventsRef = this.rtdb.ref(timelineEventsPath);

    // Atomic push - concurrent-safe, no read required
    const eventRef = await timelineEventsRef.push({
      ...event,
      _serverTime: admin.database.ServerValue.TIMESTAMP,
    });

    // Fire-and-forget cleanup of old events (keep last BROADCAST_TIMELINE_LIMIT)
    this.pruneTimelineEvents(deploymentId).catch(() => {
      // Ignore pruning errors - don't fail the main operation
    });
  }

  /**
   * Broadcast multiple timeline events atomically
   * COST OPTIMIZATION: Single RTDB operation for batch events
   *
   * @param deploymentId - The deployment ID
   * @param events - Array of timeline events to broadcast
   */
  async broadcastTimelineEventsBatch(
    deploymentId: string,
    events: BroadcastTimelineEvent[]
  ): Promise<void> {
    if (!this.enabled || events.length === 0) return;

    const timelineEventsPath = `${this.getStatePath(deploymentId)}/timeline_events`;
    const timelineEventsRef = this.rtdb.ref(timelineEventsPath);

    // Multi-path update for atomic batch insertion
    const updates: Record<string, unknown> = {};
    for (const event of events) {
      const pushKey = timelineEventsRef.push().key;
      if (pushKey) {
        updates[`${timelineEventsPath}/${pushKey}`] = {
          ...event,
          _serverTime: admin.database.ServerValue.TIMESTAMP,
        };
      }
    }

    await this.rtdb.ref().update(updates);

    // Fire-and-forget cleanup
    this.pruneTimelineEvents(deploymentId).catch(() => {});
  }

  /**
   * Prune old timeline events to keep RTDB lean
   * Called after push operations to maintain the limit
   */
  private async pruneTimelineEvents(deploymentId: string): Promise<void> {
    if (!this.enabled) return;

    const timelineEventsPath = `${this.getStatePath(deploymentId)}/timeline_events`;
    const timelineEventsRef = this.rtdb.ref(timelineEventsPath);

    // Get count of events
    const snapshot = await timelineEventsRef.once('value');
    const events = snapshot.val();
    if (!events) return;

    const eventKeys = Object.keys(events);
    if (eventKeys.length <= BROADCAST_TIMELINE_LIMIT * 2) {
      // Only prune if we have more than 2x the limit (reduces prune frequency)
      return;
    }

    // Sort by push key (chronological) and remove old ones
    eventKeys.sort();
    const keysToRemove = eventKeys.slice(0, eventKeys.length - BROADCAST_TIMELINE_LIMIT);

    // Batch delete old events
    const updates: Record<string, null> = {};
    for (const key of keysToRemove) {
      updates[`${timelineEventsPath}/${key}`] = null;
    }

    await this.rtdb.ref().update(updates);
  }

  /**
   * Get recent timeline events from RTDB (for clients)
   *
   * @param deploymentId - The deployment ID
   * @param limit - Maximum events to return (default: BROADCAST_TIMELINE_LIMIT)
   */
  async getRecentTimelineEvents(
    deploymentId: string,
    limit: number = BROADCAST_TIMELINE_LIMIT
  ): Promise<BroadcastTimelineEvent[]> {
    if (!this.enabled) return [];

    const timelineEventsPath = `${this.getStatePath(deploymentId)}/timeline_events`;
    const timelineEventsRef = this.rtdb.ref(timelineEventsPath);

    // Query last N events by push key order (chronological)
    const snapshot = await timelineEventsRef
      .orderByKey()
      .limitToLast(limit)
      .once('value');

    const events: BroadcastTimelineEvent[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data) {
        events.push({
          id: data.id,
          type: data.type,
          userId: data.userId,
          action: data.action,
          timestamp: data.timestamp,
        });
      }
      return false;
    });

    return events;
  }

  /**
   * Broadcast collection count update (for RSVP counts, etc.)
   *
   * @param deploymentId - The deployment ID
   * @param collectionKey - The collection key
   * @param count - The new entity count
   */
  async broadcastCollectionCount(
    deploymentId: string,
    collectionKey: string,
    count: number
  ): Promise<void> {
    if (!this.enabled) return;

    const safeKey = collectionKey.replace(/:/g, '_');
    const collectionPath = `${this.getStatePath(deploymentId)}/collections/${safeKey}`;

    await this.rtdb.ref(collectionPath).update({
      count,
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Remove broadcast state for a deployment (on tool removal)
   *
   * @param deploymentId - The deployment ID to remove
   */
  async removeBroadcast(deploymentId: string): Promise<void> {
    if (!this.enabled) return;

    const statePath = this.getStatePath(deploymentId);
    await this.rtdb.ref(statePath).remove();
  }

  /**
   * Check if a deployment has broadcast state
   *
   * @param deploymentId - The deployment ID to check
   */
  async hasBroadcast(deploymentId: string): Promise<boolean> {
    if (!this.enabled) return false;

    const statePath = this.getStatePath(deploymentId);
    const snapshot = await this.rtdb.ref(statePath).once('value');
    return snapshot.exists();
  }

  /**
   * Get broadcast state for a deployment (for debugging/admin)
   *
   * @param deploymentId - The deployment ID
   */
  async getBroadcast(deploymentId: string): Promise<ToolStateBroadcast | null> {
    if (!this.enabled) return null;

    const statePath = this.getStatePath(deploymentId);
    const snapshot = await this.rtdb.ref(statePath).once('value');
    return snapshot.val() as ToolStateBroadcast | null;
  }

  /**
   * Cleanup stale broadcast data (run periodically)
   * Removes broadcasts older than TTL
   */
  async cleanupStale(): Promise<number> {
    if (!this.enabled) return 0;

    const cutoffTime = Date.now() - BROADCAST_TTL_MS;
    const toolStateRef = this.rtdb.ref('tool_state');
    const snapshot = await toolStateRef.once('value');

    let cleaned = 0;
    const cleanupPromises: Promise<void>[] = [];

    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val() as ToolStateBroadcast;
      if (data?.metadata?.broadcastAt && data.metadata.broadcastAt < cutoffTime) {
        cleanupPromises.push(childSnapshot.ref.remove());
        cleaned++;
      }
      return false; // Continue iteration
    });

    await Promise.all(cleanupPromises);
    return cleaned;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default tool state broadcaster instance.
 */
export const toolStateBroadcaster = new ToolStateBroadcasterService();

export default toolStateBroadcaster;
