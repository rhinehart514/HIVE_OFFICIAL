import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';

/**
 * POST /api/tools/[toolId]/clone — Clone a tool into the current user's lab
 *
 * Creates a draft copy of the source tool owned by the requesting user.
 * Preserves elements, connections, and config. Resets stats.
 */
export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond,
) => {
  const { toolId } = await params;
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);

  if (!toolId) {
    return respond.error('Tool ID is required', 'INVALID_INPUT', { status: 400 });
  }

  try {
    // Fetch source tool
    const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();

    if (!toolDoc.exists) {
      return respond.error('Tool not found', 'NOT_FOUND', { status: 404 });
    }

    const sourceData = toolDoc.data()!;

    // Only allow cloning published tools (or own tools)
    if (sourceData.status !== 'published' && sourceData.ownerId !== userId) {
      return respond.error('Can only clone published tools', 'FORBIDDEN', { status: 403 });
    }

    // Parse optional body for target space
    let targetSpaceId: string | undefined;
    try {
      const body = await request.json();
      targetSpaceId = body?.spaceId;
    } catch {
      // No body is fine
    }

    // Create the clone
    const now = new Date();
    const cloneData = {
      name: `${sourceData.name} (Copy)`,
      description: sourceData.description || '',
      status: 'draft',
      type: sourceData.type || 'visual',
      elements: sourceData.elements || [],
      connections: sourceData.connections || [],
      metadata: {
        ...(sourceData.metadata || {}),
        clonedFrom: toolId,
        clonedAt: now.toISOString(),
        originalName: sourceData.name,
        originalOwnerId: sourceData.ownerId,
      },
      provenance: {
        creatorId: userId,
        createdAt: now.toISOString(),
        forkedFrom: toolId,
        lineage: [...(sourceData.provenance?.lineage || []), toolId],
        forkCount: 0,
        deploymentCount: 0,
        trustTier: 'community',
      },
      ownerId: userId,
      campusId,
      deployedSpaces: targetSpaceId ? [targetSpaceId] : [],
      createdAt: now,
      updatedAt: now,
    };

    const newToolRef = await dbAdmin.collection('tools').add(cloneData);

    // Increment fork count on source
    await dbAdmin.collection('tools').doc(toolId).update({
      'provenance.forkCount': (sourceData.provenance?.forkCount || 0) + 1,
    }).catch(() => {
      // Non-critical, don't fail the clone
    });

    // If deploying to a space, add to space's tools
    if (targetSpaceId) {
      await dbAdmin
        .collection('spaces')
        .doc(targetSpaceId)
        .collection('placed_tools')
        .doc(newToolRef.id)
        .set({
          toolId: newToolRef.id,
          placedBy: userId,
          placedAt: now,
          location: 'sidebar',
          isActive: true,
          source: 'clone',
        })
        .catch(() => {
          // Non-critical
        });
    }

    logger.info('Tool cloned', {
      component: 'clone-api',
      sourceToolId: toolId,
      newToolId: newToolRef.id,
      userId,
      targetSpaceId,
    });

    return respond.success(
      {
        tool: {
          id: newToolRef.id,
          name: cloneData.name,
          status: cloneData.status,
          clonedFrom: toolId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to clone tool', {
      component: 'clone-api',
      toolId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return respond.error('Failed to clone tool', 'INTERNAL_ERROR', { status: 500 });
  }
});
