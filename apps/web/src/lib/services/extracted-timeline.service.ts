/**
 * ExtractedTimelineService - Subcollection-based storage for tool timeline events
 *
 * COST OPTIMIZATION: Timeline events can grow unbounded and bloat the main document.
 * This service stores events in a subcollection for:
 *   - Unlimited event storage (no 1MB document limit)
 *   - Efficient pagination
 *   - Individual event writes (no read-modify-write)
 *   - Reduced main document read costs
 *
 * Architecture:
 *   Before: deployedTools/{id}/sharedState/current.timeline[] (array in document)
 *   After:  deployedTools/{id}/sharedState/timeline/{eventId} (subcollection)
 *
 * The main document keeps only the last 10 events for quick display.
 * Full timeline is retrieved from subcollection with pagination.
 *
 * @author HIVE Engineering
 * @version 1.0.0
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '../firebase-admin';
import { logger } from '../logger';
import type { ToolTimelineEvent } from '@hive/core';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Number of recent events to keep in the main document.
 * These are available without an extra query for quick display.
 */
const RECENT_EVENTS_IN_DOCUMENT = 10;

/**
 * Default page size for timeline queries.
 */
const DEFAULT_PAGE_SIZE = 50;

/**
 * Maximum events to return in a single query.
 */
const MAX_PAGE_SIZE = 200;

/**
 * Timeline event retention period in days.
 * Events older than this may be pruned to reduce storage costs.
 */
const RETENTION_DAYS = 90;

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineQuery {
  /** Number of events to return (default: 50, max: 200) */
  limit?: number;
  /** Cursor for pagination (event ID to start after) */
  after?: string;
  /** Filter by event type */
  type?: string;
  /** Filter by element instance ID */
  elementInstanceId?: string;
  /** Filter by user ID */
  userId?: string;
  /** Only return events after this timestamp (ISO string) */
  since?: string;
}

export interface TimelinePage {
  /** Events in this page */
  events: ToolTimelineEvent[];
  /** Cursor for next page (null if no more) */
  nextCursor: string | null;
  /** Whether there are more events */
  hasMore: boolean;
  /** Total count (only if requested) */
  totalCount?: number;
}

export interface TimelineConfig {
  /** Base path in Firestore (default: deployedTools) */
  basePath?: string;
  /** Recent events to keep in document (default: 10) */
  recentEventsInDocument?: number;
  /** Default page size (default: 50) */
  defaultPageSize?: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class ExtractedTimelineService {
  private basePath: string;
  private recentEventsInDocument: number;
  private defaultPageSize: number;

  constructor(config: TimelineConfig = {}) {
    this.basePath = config.basePath ?? 'deployedTools';
    this.recentEventsInDocument = config.recentEventsInDocument ?? RECENT_EVENTS_IN_DOCUMENT;
    this.defaultPageSize = config.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  }

  /**
   * Get the Firestore path for the timeline subcollection
   */
  private getTimelinePath(deploymentId: string): string {
    return `${this.basePath}/${deploymentId}/sharedState/timeline`;
  }

  /**
   * Get the path to the main shared state document
   */
  private getSharedStatePath(deploymentId: string): string {
    return `${this.basePath}/${deploymentId}/sharedState/current`;
  }

  /**
   * Append a single event to the timeline.
   * Also updates the recent events in the main document.
   *
   * @param deploymentId - The deployment ID
   * @param event - The timeline event (without id/timestamp, which are generated)
   * @returns The created event with id and timestamp
   */
  async appendEvent(
    deploymentId: string,
    event: Omit<ToolTimelineEvent, 'id' | 'timestamp'>
  ): Promise<ToolTimelineEvent> {
    const timestamp = new Date().toISOString();
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const fullEvent: ToolTimelineEvent = {
      ...event,
      id: eventId,
      timestamp,
    };

    // Write to subcollection
    const timelinePath = this.getTimelinePath(deploymentId);
    const eventRef = dbAdmin.doc(`${timelinePath}/${eventId}`);

    await eventRef.set({
      ...fullEvent,
      _createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update recent events in main document (fire and forget for performance)
    this.updateRecentEvents(deploymentId, fullEvent).catch((err) => {
      logger.error('Failed to update recent events', err instanceof Error ? err : new Error(String(err)));
    });

    return fullEvent;
  }

  /**
   * Append multiple events to the timeline in a batch.
   *
   * @param deploymentId - The deployment ID
   * @param events - Array of events (without id/timestamp)
   * @returns Array of created events with id and timestamp
   */
  async appendBatch(
    deploymentId: string,
    events: Omit<ToolTimelineEvent, 'id' | 'timestamp'>[]
  ): Promise<ToolTimelineEvent[]> {
    if (events.length === 0) return [];

    const timestamp = new Date().toISOString();
    const timelinePath = this.getTimelinePath(deploymentId);
    const batch = dbAdmin.batch();

    const fullEvents: ToolTimelineEvent[] = events.map((event, index) => {
      const eventId = `evt_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
      return {
        ...event,
        id: eventId,
        timestamp,
      };
    });

    // Add all events to batch
    for (const event of fullEvents) {
      const eventRef = dbAdmin.doc(`${timelinePath}/${event.id}`);
      batch.set(eventRef, {
        ...event,
        _createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    // Update recent events in main document with the last N events
    const recentToAdd = fullEvents.slice(-this.recentEventsInDocument);
    if (recentToAdd.length > 0) {
      this.updateRecentEvents(deploymentId, ...recentToAdd).catch((err) => {
        logger.error('Failed to update recent events', err instanceof Error ? err : new Error(String(err)));
      });
    }

    return fullEvents;
  }

  /**
   * Query timeline events with pagination and filtering.
   *
   * @param deploymentId - The deployment ID
   * @param query - Query options for filtering and pagination
   * @returns Paginated timeline events
   */
  async queryEvents(
    deploymentId: string,
    query: TimelineQuery = {}
  ): Promise<TimelinePage> {
    const limit = Math.min(query.limit ?? this.defaultPageSize, MAX_PAGE_SIZE);
    const timelinePath = this.getTimelinePath(deploymentId);

    let firestoreQuery: admin.firestore.Query = dbAdmin
      .collection(timelinePath)
      .orderBy('timestamp', 'desc');

    // Apply filters
    if (query.type) {
      firestoreQuery = firestoreQuery.where('type', '==', query.type);
    }

    if (query.elementInstanceId) {
      firestoreQuery = firestoreQuery.where('elementInstanceId', '==', query.elementInstanceId);
    }

    if (query.userId) {
      firestoreQuery = firestoreQuery.where('userId', '==', query.userId);
    }

    if (query.since) {
      firestoreQuery = firestoreQuery.where('timestamp', '>=', query.since);
    }

    // Apply cursor for pagination
    if (query.after) {
      const cursorDoc = await dbAdmin.doc(`${timelinePath}/${query.after}`).get();
      if (cursorDoc.exists) {
        firestoreQuery = firestoreQuery.startAfter(cursorDoc);
      }
    }

    // Fetch one extra to determine if there are more
    const snapshot = await firestoreQuery.limit(limit + 1).get();

    const events: ToolTimelineEvent[] = [];
    for (let i = 0; i < Math.min(snapshot.docs.length, limit); i++) {
      const doc = snapshot.docs[i];
      const data = doc.data();
      events.push({
        id: doc.id,
        type: data.type,
        timestamp: data.timestamp,
        userId: data.userId,
        elementInstanceId: data.elementInstanceId,
        action: data.action,
        data: data.data,
      });
    }

    const hasMore = snapshot.docs.length > limit;
    const nextCursor = hasMore && events.length > 0 ? events[events.length - 1].id : null;

    return {
      events,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get recent events from the main document (fast, no subcollection query).
   * Falls back to subcollection if main document doesn't have events.
   *
   * @param deploymentId - The deployment ID
   * @param limit - Maximum events to return (default: 10)
   */
  async getRecentEvents(
    deploymentId: string,
    limit: number = this.recentEventsInDocument
  ): Promise<ToolTimelineEvent[]> {
    const sharedStatePath = this.getSharedStatePath(deploymentId);
    const doc = await dbAdmin.doc(sharedStatePath).get();

    if (!doc.exists) return [];

    const data = doc.data();
    const recentEvents = data?.recentTimeline as ToolTimelineEvent[] | undefined;

    if (recentEvents && recentEvents.length > 0) {
      return recentEvents.slice(0, limit);
    }

    // Fallback: query subcollection for recent events
    const result = await this.queryEvents(deploymentId, { limit });
    return result.events;
  }

  /**
   * Get total count of timeline events.
   *
   * @param deploymentId - The deployment ID
   */
  async countEvents(deploymentId: string): Promise<number> {
    const timelinePath = this.getTimelinePath(deploymentId);
    const snapshot = await dbAdmin.collection(timelinePath).count().get();
    return snapshot.data().count;
  }

  /**
   * Delete old events beyond the retention period.
   * Should be called periodically (e.g., via Cloud Function) to control storage costs.
   *
   * @param deploymentId - The deployment ID
   * @param retentionDays - Days to retain (default: 90)
   * @returns Number of events deleted
   */
  async pruneOldEvents(
    deploymentId: string,
    retentionDays: number = RETENTION_DAYS
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    const timelinePath = this.getTimelinePath(deploymentId);
    const snapshot = await dbAdmin
      .collection(timelinePath)
      .where('timestamp', '<', cutoffTimestamp)
      .limit(500) // Batch limit
      .get();

    if (snapshot.empty) return 0;

    const batch = dbAdmin.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();

    return snapshot.size;
  }

  /**
   * Delete a single event by ID.
   *
   * @param deploymentId - The deployment ID
   * @param eventId - The event ID to delete
   */
  async deleteEvent(deploymentId: string, eventId: string): Promise<void> {
    const timelinePath = this.getTimelinePath(deploymentId);
    await dbAdmin.doc(`${timelinePath}/${eventId}`).delete();
  }

  /**
   * Delete all timeline events for a deployment.
   * Use with caution - this is irreversible.
   *
   * @param deploymentId - The deployment ID
   */
  async deleteAllEvents(deploymentId: string): Promise<void> {
    const timelinePath = this.getTimelinePath(deploymentId);
    const snapshot = await dbAdmin.collection(timelinePath).get();

    if (snapshot.empty) return;

    const batch = dbAdmin.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();

    // Clear recent events from main document
    const sharedStatePath = this.getSharedStatePath(deploymentId);
    await dbAdmin.doc(sharedStatePath).update({
      recentTimeline: [],
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Update the recent events array in the main document.
   * Keeps only the most recent N events for quick access.
   */
  private async updateRecentEvents(
    deploymentId: string,
    ...newEvents: ToolTimelineEvent[]
  ): Promise<void> {
    const sharedStatePath = this.getSharedStatePath(deploymentId);
    const docRef = dbAdmin.doc(sharedStatePath);

    await dbAdmin.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const existingData = doc.data() || {};
      const existingRecent = (existingData.recentTimeline as ToolTimelineEvent[]) || [];

      // Combine and sort by timestamp (newest first)
      const combined = [...newEvents, ...existingRecent]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.recentEventsInDocument);

      transaction.set(
        docRef,
        {
          recentTimeline: combined,
          lastModified: new Date().toISOString(),
        },
        { merge: true }
      );
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default extracted timeline service instance.
 */
export const extractedTimelineService = new ExtractedTimelineService();

export default extractedTimelineService;
