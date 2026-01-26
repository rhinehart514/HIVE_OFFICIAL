import { dbAdmin } from './firebase-admin';
import type { DocumentSnapshot, DocumentReference } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { logger } from './logger';

/**
 * Build a composite ID for placement document
 */
export function buildPlacementCompositeId(deploymentId: string, toolId: string): string {
  return `${deploymentId}_${toolId}`;
}

/**
 * Create a placement document in the target space or profile
 *
 * IMPORTANT: For spaces, writes to `spaces/{spaceId}/placed_tools/{placementId}`
 * which matches the read path in the GET /api/spaces/[spaceId]/tools route.
 *
 * Schema matches what the Space tools API expects:
 * - toolId, placement, order, isActive, source, placedBy, placedAt
 * - configOverrides, visibility, titleOverride, isEditable
 */
export async function createPlacementDocument(params: {
  deployedTo: 'space' | 'profile';
  targetId: string;
  toolId: string;
  deploymentId: string;
  placedBy: string;
  campusId: string;
  placement?: 'sidebar' | 'inline' | 'modal' | 'tab';
  order?: number;
  visibility?: 'all' | 'members' | 'leaders';
  titleOverride?: string;
  configOverrides?: Record<string, unknown>;
  // Tool metadata for profile display
  name?: string;
  description?: string;
  icon?: string;
  // Legacy fields for backwards compat
  surface?: string;
  permissions?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}): Promise<{ id: string; path: string; ref: DocumentReference }> {
  const placementId = buildPlacementCompositeId(params.deploymentId, params.toolId);

  let placementRef: DocumentReference;
  let placementPath: string;

  if (params.deployedTo === 'space') {
    // Write to spaces/{spaceId}/placed_tools - matches GET route read path
    placementRef = dbAdmin
      .collection('spaces')
      .doc(params.targetId)
      .collection('placed_tools')
      .doc(placementId);
    placementPath = `spaces/${params.targetId}/placed_tools/${placementId}`;
  } else if (params.deployedTo === 'profile') {
    placementRef = dbAdmin
      .collection('users')
      .doc(params.targetId)
      .collection('placed_tools')
      .doc(placementId);
    placementPath = `users/${params.targetId}/placed_tools/${placementId}`;
  } else {
    throw new Error('Invalid deployment target');
  }

  // Schema matching what Space tools API GET expects (PlacedToolData)
  await placementRef.set({
    // Core fields
    toolId: params.toolId,
    placement: params.placement || 'sidebar',
    order: params.order ?? 0,
    isActive: true,
    source: 'leader',
    placedBy: params.placedBy,
    placedAt: admin.firestore.FieldValue.serverTimestamp(),

    // Configuration
    configOverrides: params.configOverrides || params.settings || {},
    visibility: params.visibility || 'all',
    titleOverride: params.titleOverride || null,
    isEditable: true,

    // Tool metadata (for profile display)
    name: params.name || null,
    description: params.description || null,
    icon: params.icon || null,

    // State management
    state: {},
    stateUpdatedAt: null,

    // Metadata
    campusId: params.campusId,
    deploymentId: params.deploymentId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: placementId, path: placementPath, ref: placementRef };
}

/**
 * Get placement context from a deployment document
 * This retrieves the placed_tools document from the space or profile where the tool is deployed
 */
export async function getPlacementFromDeploymentDoc(
  deploymentDoc: DocumentSnapshot
): Promise<{ snapshot: DocumentSnapshot; ref: DocumentReference } | null> {
  try {
    const deploymentData = deploymentDoc.data();
    if (!deploymentData) return null;

    // If the tool is deployed to a space, get the placement document from the space
    if (deploymentData.deployedTo === 'space' && deploymentData.targetId && deploymentData.placementId) {
      const placementRef = dbAdmin
        .collection('spaces')
        .doc(deploymentData.targetId)
        .collection('placed_tools')
        .doc(deploymentData.placementId);

      const placementSnapshot = await placementRef.get();

      if (placementSnapshot.exists) {
        return {
          snapshot: placementSnapshot,
          ref: placementRef
        };
      }
    }

    // If deployed to profile, get from user's profile placed_tools
    if (deploymentData.deployedTo === 'profile' && deploymentData.targetId && deploymentData.placementId) {
      const placementRef = dbAdmin
        .collection('users')
        .doc(deploymentData.targetId)
        .collection('placed_tools')
        .doc(deploymentData.placementId);

      const placementSnapshot = await placementRef.get();

      if (placementSnapshot.exists) {
        return {
          snapshot: placementSnapshot,
          ref: placementRef
        };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error getting placement from deployment', { component: 'tool-placement' }, error instanceof Error ? error : undefined);
    return null;
  }
}
