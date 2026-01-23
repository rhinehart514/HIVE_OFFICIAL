/**
 * Placement Detail API
 *
 * GET    /api/placements/[placementId] - Get placement details
 * PATCH  /api/placements/[placementId] - Update placement config
 * DELETE /api/placements/[placementId] - Remove placement
 *
 * Note: Capabilities are immutable after deployment (security constraint).
 * Only config, visibility, and permissions can be modified.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

// ============================================================================
// Schemas
// ============================================================================

const UpdatePlacementSchema = z.object({
  placement: z.enum(['sidebar', 'inline', 'modal', 'tab']).optional(),
  order: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  visibility: z.enum(['all', 'members', 'leaders']).optional(),
  titleOverride: z.string().max(100).nullable().optional(),
  configOverrides: z.record(z.any()).optional(),
});

type UpdatePlacementInput = z.infer<typeof UpdatePlacementSchema>;

// ============================================================================
// Route Context
// ============================================================================

interface RouteContext {
  params: Promise<{ placementId: string }>;
}

// ============================================================================
// Permission Checks
// ============================================================================

async function findPlacementWithContext(
  placementId: string,
  userId: string,
  campusId: string,
): Promise<{
  found: boolean;
  placement?: FirebaseFirestore.DocumentSnapshot;
  placementData?: FirebaseFirestore.DocumentData;
  contextType?: 'space' | 'profile';
  contextId?: string;
  canModify?: boolean;
  error?: string;
}> {
  // Try to find in spaces first (check all spaces where user is a member)
  // This is not efficient but placements aren't expected to be numerous
  // A better approach would be to include context in the placementId or query params

  // First, try to find deployment record that references this placement
  const deploymentSnapshot = await dbAdmin
    .collection('deployedTools')
    .where('placementId', '==', placementId)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();

  if (!deploymentSnapshot.empty) {
    const deploymentData = deploymentSnapshot.docs[0].data();
    const contextType = deploymentData.targetType as 'space' | 'profile';
    const contextId = deploymentData.targetId as string;

    // Get the actual placement document
    const placementPath =
      contextType === 'space'
        ? `spaces/${contextId}/placed_tools/${placementId}`
        : `users/${contextId}/placed_tools/${placementId}`;

    const placementDoc = await dbAdmin.doc(placementPath).get();

    if (!placementDoc.exists) {
      return { found: false, error: 'Placement not found' };
    }

    // Check permissions
    let canModify = false;

    if (contextType === 'profile') {
      // Only profile owner can modify their placements
      canModify = contextId === userId;
    } else if (contextType === 'space') {
      // Check if user is a space leader
      const spaceDoc = await dbAdmin.collection('spaces').doc(contextId).get();
      if (spaceDoc.exists) {
        const spaceData = spaceDoc.data();
        if (spaceData?.campusId && spaceData.campusId !== campusId) {
          return { found: false, error: 'Access denied for this campus' };
        }
        const userRole = spaceData?.members?.[userId]?.role;
        canModify = ['builder', 'admin', 'moderator'].includes(userRole || '');
      }
    }

    return {
      found: true,
      placement: placementDoc,
      placementData: placementDoc.data(),
      contextType,
      contextId,
      canModify,
    };
  }

  return { found: false, error: 'Placement not found' };
}

// ============================================================================
// GET /api/placements/[placementId]
// ============================================================================

export const GET = withAuthAndErrors(async (request, context: RouteContext, respond) => {
  try {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { placementId } = await context.params;

    const result = await findPlacementWithContext(placementId, userId, campusId);

    if (!result.found || !result.placementData) {
      return respond.error(result.error || 'Placement not found', 'NOT_FOUND', {
        status: 404,
      });
    }

    const placementData = result.placementData;

    // Fetch tool info
    let toolInfo = null;
    try {
      const toolDoc = await dbAdmin.collection('tools').doc(placementData.toolId).get();
      if (toolDoc.exists) {
        const toolData = toolDoc.data();
        toolInfo = {
          id: toolDoc.id,
          name: toolData?.name,
          description: toolData?.description,
          icon: toolData?.icon,
          category: toolData?.category,
          elements: toolData?.elements,
          composition: toolData?.composition,
        };
      }
    } catch {
      // Tool may have been deleted
    }

    // Get deployment record for full governance info
    let governanceInfo = null;
    const deploymentSnapshot = await dbAdmin
      .collection('deployedTools')
      .where('placementId', '==', placementId)
      .limit(1)
      .get();

    if (!deploymentSnapshot.empty) {
      const deploymentData = deploymentSnapshot.docs[0].data();
      governanceInfo = {
        deploymentId: deploymentSnapshot.docs[0].id,
        capabilityLane: deploymentData.capabilityLane,
        capabilities: deploymentData.capabilities,
        budgets: deploymentData.budgets,
        status: deploymentData.status,
        experimental: deploymentData.experimental,
        surfaceModes: deploymentData.surfaceModes,
        appConfig: deploymentData.appConfig,
        provenance: deploymentData.provenance,
        deployedAt: deploymentData.deployedAt,
        deployedBy: deploymentData.deployedBy,
      };
    }

    return respond.success({
      placement: {
        id: placementId,
        toolId: placementData.toolId,
        placement: placementData.placement,
        order: placementData.order,
        isActive: placementData.isActive,
        source: placementData.source,
        placedBy: placementData.placedBy,
        placedAt:
          placementData.placedAt?.toDate?.()?.toISOString() || placementData.placedAt,
        configOverrides: placementData.configOverrides || {},
        visibility: placementData.visibility,
        titleOverride: placementData.titleOverride,
        isEditable: placementData.isEditable,
        state: placementData.state || {},
        stateUpdatedAt:
          placementData.stateUpdatedAt?.toDate?.()?.toISOString() ||
          placementData.stateUpdatedAt,
        // Enrichments
        tool: toolInfo,
        governance: governanceInfo,
        // Context and permissions
        context: {
          type: result.contextType,
          id: result.contextId,
        },
        permissions: {
          canModify: result.canModify,
          canRemove: result.canModify,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching placement', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch placement', 'INTERNAL_ERROR', {
      status: 500,
    });
  }
});

// ============================================================================
// PATCH /api/placements/[placementId]
// ============================================================================

export const PATCH = withAuthValidationAndErrors(
  UpdatePlacementSchema,
  async (request, context: RouteContext, payload: UpdatePlacementInput, respond) => {
    try {
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);
      const { placementId } = await context.params;

      const result = await findPlacementWithContext(placementId, userId, campusId);

      if (!result.found || !result.placement) {
        return respond.error(result.error || 'Placement not found', 'NOT_FOUND', {
          status: 404,
        });
      }

      if (!result.canModify) {
        return respond.error(
          'Insufficient permissions to modify this placement',
          'FORBIDDEN',
          { status: 403 }
        );
      }

      // Check if placement is editable
      const placementData = result.placementData;
      if (placementData?.isEditable === false && placementData?.source === 'system') {
        return respond.error(
          'System placements cannot be modified',
          'FORBIDDEN',
          { status: 403 }
        );
      }

      // Build update object
      const updates: Record<string, unknown> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (payload.placement !== undefined) {
        updates.placement = payload.placement;
      }
      if (payload.order !== undefined) {
        updates.order = payload.order;
      }
      if (payload.isActive !== undefined) {
        updates.isActive = payload.isActive;
      }
      if (payload.visibility !== undefined) {
        updates.visibility = payload.visibility;
      }
      if (payload.titleOverride !== undefined) {
        updates.titleOverride = payload.titleOverride;
      }
      if (payload.configOverrides !== undefined) {
        // Merge with existing config
        updates.configOverrides = {
          ...(placementData?.configOverrides || {}),
          ...payload.configOverrides,
        };
      }

      // Update placement document
      await result.placement.ref.update(updates);

      // Also update deployment record if status changed
      if (payload.isActive !== undefined) {
        const deploymentSnapshot = await dbAdmin
          .collection('deployedTools')
          .where('placementId', '==', placementId)
          .limit(1)
          .get();

        if (!deploymentSnapshot.empty) {
          await deploymentSnapshot.docs[0].ref.update({
            status: payload.isActive ? 'active' : 'paused',
          });
        }
      }

      logger.info('Placement updated', {
        placementId,
        userId,
        updates: Object.keys(payload),
      });

      return respond.success({
        message: 'Placement updated successfully',
        updated: Object.keys(payload),
      });
    } catch (error) {
      logger.error('Error updating placement', {
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error('Failed to update placement', 'INTERNAL_ERROR', {
        status: 500,
      });
    }
  }
);

// ============================================================================
// DELETE /api/placements/[placementId]
// ============================================================================

export const DELETE = withAuthAndErrors(async (request, context: RouteContext, respond) => {
  try {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { placementId } = await context.params;

    const result = await findPlacementWithContext(placementId, userId, campusId);

    if (!result.found || !result.placement) {
      return respond.error(result.error || 'Placement not found', 'NOT_FOUND', {
        status: 404,
      });
    }

    if (!result.canModify) {
      return respond.error(
        'Insufficient permissions to remove this placement',
        'FORBIDDEN',
        { status: 403 }
      );
    }

    const placementData = result.placementData;

    // Check if placement can be removed
    if (placementData?.isEditable === false && placementData?.source === 'system') {
      return respond.error(
        'System placements cannot be removed',
        'FORBIDDEN',
        { status: 403 }
      );
    }

    // Run deletion in a transaction
    await dbAdmin.runTransaction(async (transaction) => {
      // 1. Delete placement document
      transaction.delete(result.placement!.ref);

      // 2. Update deployment record status
      const deploymentSnapshot = await dbAdmin
        .collection('deployedTools')
        .where('placementId', '==', placementId)
        .limit(1)
        .get();

      if (!deploymentSnapshot.empty) {
        transaction.update(deploymentSnapshot.docs[0].ref, {
          status: 'disabled',
          removedAt: admin.firestore.FieldValue.serverTimestamp(),
          removedBy: userId,
        });
      }

      // 3. Decrement tool deployment count
      if (placementData?.toolId) {
        const toolRef = dbAdmin.collection('tools').doc(placementData.toolId);
        transaction.update(toolRef, {
          deploymentCount: admin.firestore.FieldValue.increment(-1),
        });
      }
    });

    logger.info('Placement removed', {
      placementId,
      userId,
      toolId: placementData?.toolId,
      contextType: result.contextType,
      contextId: result.contextId,
    });

    return respond.success({
      message: 'Placement removed successfully',
    });
  } catch (error) {
    logger.error('Error removing placement', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to remove placement', 'INTERNAL_ERROR', {
      status: 500,
    });
  }
});
