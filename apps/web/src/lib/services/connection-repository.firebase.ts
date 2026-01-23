/**
 * Firebase Implementation of ConnectionRepository
 *
 * Sprint 3: Tool-to-Tool Connections
 *
 * Provides Firestore-backed implementation for connection resolution,
 * fetching connections and tool state data.
 */

import { dbAdmin } from '@/lib/firebase-admin';
import type {
  ToolConnection,
  ToolSharedState,
} from '@hive/core';
import type { ConnectionRepository } from '@hive/core';

// ============================================================================
// FIREBASE REPOSITORY IMPLEMENTATION
// ============================================================================

/**
 * Firestore-backed connection repository.
 *
 * Data locations:
 * - Connections: spaces/{spaceId}/toolConnections/{connectionId}
 * - Tool state: deployedTools/{deploymentId}/sharedState/current
 * - Tool metadata: deployedTools/{deploymentId}
 */
export class FirebaseConnectionRepository implements ConnectionRepository {
  /**
   * Get all connections where the target is the given deployment.
   * Queries: spaces/{spaceId}/toolConnections WHERE target.deploymentId == deploymentId
   */
  async getIncomingConnections(
    deploymentId: string,
    spaceId: string
  ): Promise<ToolConnection[]> {
    const connectionsRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('toolConnections');

    const snapshot = await connectionsRef
      .where('target.deploymentId', '==', deploymentId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        spaceId: data.spaceId as string,
        source: {
          deploymentId: data.source?.deploymentId as string,
          path: data.source?.path as string,
        },
        target: {
          deploymentId: data.target?.deploymentId as string,
          elementId: data.target?.elementId as string,
          inputPath: data.target?.inputPath as string,
        },
        transform: data.transform,
        enabled: data.enabled !== false,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
        createdBy: data.createdBy as string,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
        label: data.label,
      } satisfies ToolConnection;
    });
  }

  /**
   * Get the shared state of a deployed tool.
   * Path: deployedTools/{deploymentId}/sharedState/current
   */
  async getToolSharedState(deploymentId: string): Promise<ToolSharedState | null> {
    const stateRef = dbAdmin
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('sharedState')
      .doc('current');

    const doc = await stateRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      counters: (data?.counters as Record<string, number>) || {},
      collections: (data?.collections as ToolSharedState['collections']) || {},
      timeline: (data?.timeline as ToolSharedState['timeline']) || [],
      computed: (data?.computed as Record<string, unknown>) || {},
      version: (data?.version as number) || 0,
      lastModified: data?.lastModified?.toDate?.()?.toISOString?.() ||
        data?.lastModified ||
        new Date().toISOString(),
    } satisfies ToolSharedState;
  }

  /**
   * Get tool metadata (name, description, spaceId).
   * Path: deployedTools/{deploymentId}
   */
  async getToolMetadata(deploymentId: string): Promise<{
    name: string;
    spaceId: string;
  } | null> {
    const toolRef = dbAdmin.collection('deployedTools').doc(deploymentId);
    const doc = await toolRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Try to get name from different possible locations
    const name =
      (data?.name as string) ||
      (data?.tool as { name?: string })?.name ||
      (data?.toolName as string) ||
      'Unknown Tool';

    // spaceId could be in targetId if deployedTo is 'space'
    const spaceId =
      (data?.spaceId as string) ||
      (data?.deployedTo === 'space' ? (data?.targetId as string) : null) ||
      '';

    return { name, spaceId };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: FirebaseConnectionRepository | null = null;

/**
 * Get the singleton Firebase connection repository instance.
 */
export function getFirebaseConnectionRepository(): FirebaseConnectionRepository {
  if (!instance) {
    instance = new FirebaseConnectionRepository();
  }
  return instance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetFirebaseConnectionRepository(): void {
  instance = null;
}
