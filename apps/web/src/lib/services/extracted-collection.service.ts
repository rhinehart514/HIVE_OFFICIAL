/**
 * ExtractedCollectionService - Subcollection-based storage for tool collections
 *
 * Firestore documents are limited to 1MB. Tool collections (voters, attendees, etc.)
 * can grow unbounded and hit this limit. This service stores entities in subcollections
 * for unlimited scale.
 *
 * Architecture:
 *   Before: deployedTools/{id}/sharedState/current.collections["poll:voters"]["user123"]
 *   After:  deployedTools/{id}/sharedState/collections/poll_voters/{userId}
 *
 * Benefits:
 *   - No document size limit
 *   - Individual entity updates (no read-modify-write)
 *   - Pagination for large collections
 *   - Per-entity security rules possible
 *
 * @author HIVE Engineering
 * @version 1.0.0
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '../firebase-admin';
import type { ToolSharedEntity } from '@hive/core';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum entities to return in a single read operation.
 * For larger collections, use pagination.
 */
const DEFAULT_BATCH_LIMIT = 500;

// ============================================================================
// TYPES
// ============================================================================

export interface CollectionConfig {
  /** Base path in Firestore (default: deployedTools/{deploymentId}/sharedState) */
  basePath?: string;
  /** Maximum entities per read (default: 500) */
  batchLimit?: number;
}

export interface EntityUpsert {
  collectionKey: string;
  entityId: string;
  entity: ToolSharedEntity;
}

export interface EntityDelete {
  collectionKey: string;
  entityId: string;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class ExtractedCollectionService {
  private basePath: string;
  private batchLimit: number;

  constructor(config: CollectionConfig = {}) {
    this.basePath = config.basePath ?? 'deployedTools';
    this.batchLimit = config.batchLimit ?? DEFAULT_BATCH_LIMIT;
  }

  /**
   * Get the Firestore path for a collection's subcollection
   */
  private getCollectionPath(deploymentId: string, collectionKey: string): string {
    // Sanitize collectionKey for Firestore path (replace : with _)
    const safeKey = collectionKey.replace(/:/g, '_');
    return `${this.basePath}/${deploymentId}/sharedState/collections/${safeKey}`;
  }

  /**
   * Upsert a single entity into a collection.
   *
   * @param deploymentId - The deployment ID
   * @param collectionKey - Collection identifier (e.g., "poll_001:voters")
   * @param entityId - Entity ID (e.g., user ID)
   * @param entity - The entity data
   */
  async upsertEntity(
    deploymentId: string,
    collectionKey: string,
    entityId: string,
    entity: ToolSharedEntity
  ): Promise<void> {
    const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
    const entityRef = dbAdmin.doc(`${collectionPath}/${entityId}`);

    await entityRef.set(
      {
        ...entity,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Upsert multiple entities across collections in a single batch.
   *
   * @param deploymentId - The deployment ID
   * @param upserts - Array of entity upserts
   */
  async upsertBatch(
    deploymentId: string,
    upserts: EntityUpsert[]
  ): Promise<void> {
    if (upserts.length === 0) return;

    const batch = dbAdmin.batch();

    for (const { collectionKey, entityId, entity } of upserts) {
      const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
      const entityRef = dbAdmin.doc(`${collectionPath}/${entityId}`);

      batch.set(
        entityRef,
        {
          ...entity,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
  }

  /**
   * Delete a single entity from a collection.
   *
   * @param deploymentId - The deployment ID
   * @param collectionKey - Collection identifier
   * @param entityId - Entity ID to delete
   */
  async deleteEntity(
    deploymentId: string,
    collectionKey: string,
    entityId: string
  ): Promise<void> {
    const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
    const entityRef = dbAdmin.doc(`${collectionPath}/${entityId}`);

    await entityRef.delete();
  }

  /**
   * Delete multiple entities across collections in a single batch.
   *
   * @param deploymentId - The deployment ID
   * @param deletes - Array of entity deletes
   */
  async deleteBatch(
    deploymentId: string,
    deletes: EntityDelete[]
  ): Promise<void> {
    if (deletes.length === 0) return;

    const batch = dbAdmin.batch();

    for (const { collectionKey, entityId } of deletes) {
      const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
      const entityRef = dbAdmin.doc(`${collectionPath}/${entityId}`);
      batch.delete(entityRef);
    }

    await batch.commit();
  }

  /**
   * Get a single entity from a collection.
   *
   * @param deploymentId - The deployment ID
   * @param collectionKey - Collection identifier
   * @param entityId - Entity ID to fetch
   */
  async getEntity(
    deploymentId: string,
    collectionKey: string,
    entityId: string
  ): Promise<ToolSharedEntity | null> {
    const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
    const entityDoc = await dbAdmin.doc(`${collectionPath}/${entityId}`).get();

    if (!entityDoc.exists) return null;

    return entityDoc.data() as ToolSharedEntity;
  }

  /**
   * Get all entities in a collection (up to batchLimit).
   *
   * @param deploymentId - The deployment ID
   * @param collectionKey - Collection identifier
   * @param limit - Maximum entities to return (default: batchLimit)
   */
  async getCollection(
    deploymentId: string,
    collectionKey: string,
    limit?: number
  ): Promise<Record<string, ToolSharedEntity>> {
    const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
    const snapshot = await dbAdmin
      .collection(collectionPath)
      .limit(limit ?? this.batchLimit)
      .get();

    const entities: Record<string, ToolSharedEntity> = {};
    for (const doc of snapshot.docs) {
      entities[doc.id] = doc.data() as ToolSharedEntity;
    }

    return entities;
  }

  /**
   * Get all collections for a deployment.
   * Lists all collection subcollections and returns their entities.
   *
   * @param deploymentId - The deployment ID
   * @returns Map of collectionKey -> entities
   */
  async getAllCollections(
    deploymentId: string
  ): Promise<Record<string, Record<string, ToolSharedEntity>>> {
    const collectionsPath = `${this.basePath}/${deploymentId}/sharedState/collections`;
    const collectionRefs = await dbAdmin.collection(collectionsPath).listDocuments();

    const results: Record<string, Record<string, ToolSharedEntity>> = {};

    // Fetch each collection's entities in parallel
    const fetchPromises = collectionRefs.map(async (collectionRef) => {
      const collectionKey = collectionRef.id.replace(/_/g, ':'); // Restore : from _
      const entitiesSnapshot = await dbAdmin
        .collection(collectionRef.path)
        .limit(this.batchLimit)
        .get();

      const entities: Record<string, ToolSharedEntity> = {};
      for (const doc of entitiesSnapshot.docs) {
        entities[doc.id] = doc.data() as ToolSharedEntity;
      }

      results[collectionKey] = entities;
    });

    await Promise.all(fetchPromises);

    return results;
  }

  /**
   * Count entities in a collection without fetching them all.
   *
   * @param deploymentId - The deployment ID
   * @param collectionKey - Collection identifier
   */
  async countEntities(
    deploymentId: string,
    collectionKey: string
  ): Promise<number> {
    const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
    const snapshot = await dbAdmin.collection(collectionPath).count().get();

    return snapshot.data().count;
  }

  /**
   * Check if an entity exists in a collection.
   *
   * @param deploymentId - The deployment ID
   * @param collectionKey - Collection identifier
   * @param entityId - Entity ID to check
   */
  async entityExists(
    deploymentId: string,
    collectionKey: string,
    entityId: string
  ): Promise<boolean> {
    const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
    const entityDoc = await dbAdmin.doc(`${collectionPath}/${entityId}`).get();

    return entityDoc.exists;
  }

  /**
   * Delete an entire collection and all its entities.
   * Use with caution - this is irreversible.
   *
   * @param deploymentId - The deployment ID
   * @param collectionKey - Collection identifier to delete
   */
  async deleteCollection(
    deploymentId: string,
    collectionKey: string
  ): Promise<void> {
    const collectionPath = this.getCollectionPath(deploymentId, collectionKey);
    const snapshot = await dbAdmin.collection(collectionPath).get();

    if (snapshot.empty) return;

    const batch = dbAdmin.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default extracted collection service instance.
 */
export const extractedCollectionService = new ExtractedCollectionService();

export default extractedCollectionService;
