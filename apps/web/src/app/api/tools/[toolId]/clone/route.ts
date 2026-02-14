import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { logger } from '@/lib/structured-logger';
import { z } from 'zod';
import { notifyToolForked } from '@/lib/tool-notifications';

const CloneRequestSchema = z.object({
  mode: z.enum(['fork', 'remix']).default('fork'),
  spaceId: z.string().optional(),
});

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
    // Parse optional body for mode and target space
    let mode: 'fork' | 'remix' = 'fork';
    let targetSpaceId: string | undefined;
    try {
      const rawBody = await request.json();
      const parsed = CloneRequestSchema.safeParse(rawBody);
      if (!parsed.success) {
        return respond.error('Invalid clone payload', 'INVALID_INPUT', { status: 400 });
      }
      mode = parsed.data.mode;
      targetSpaceId = parsed.data.spaceId;
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      // No JSON body is fine - defaults to fork mode.
    }

    const sourceRef = dbAdmin.collection('tools').doc(toolId);
    const sourceDoc = await sourceRef.get();
    if (!sourceDoc.exists) {
      return respond.error('Tool not found', 'NOT_FOUND', { status: 404 });
    }

    const sourceData = sourceDoc.data() || {};
    const sourceOwnerId =
      (sourceData.ownerId as string | undefined) ||
      (sourceData.creatorId as string | undefined) ||
      (sourceData.createdBy as string | undefined);

    const isOwner = sourceOwnerId === userId;
    const isPublishedOrPublic =
      sourceData.status === 'published' ||
      sourceData.visibility === 'public' ||
      sourceData.isPublic === true;

    if (!isOwner && !isPublishedOrPublic) {
      return respond.error(
        'Tool must be published or public to clone',
        'FORBIDDEN',
        { status: 403 }
      );
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const newToolRef = dbAdmin.collection('tools').doc();
    const sourceLineage = Array.isArray(sourceData.provenance?.lineage)
      ? (sourceData.provenance?.lineage as string[])
      : [];
    const cloneStatus = mode === 'remix'
      ? 'draft'
      : ((sourceData.status as string | undefined) || 'draft');

    const cloneData: Record<string, unknown> = {
      ...sourceData,
      ownerId: userId,
      creatorId: userId,
      createdBy: userId,
      campusId,
      status: cloneStatus,
      createdAt: now,
      updatedAt: now,
      deployedSpaces: targetSpaceId ? [targetSpaceId] : [],
      forkCount: 0,
      deploymentCount: 0,
      useCount: 0,
      viewCount: 0,
      forkedFrom: {
        toolId,
        userId: sourceOwnerId || '',
        timestamp,
      },
      metadata: {
        ...(sourceData.metadata as Record<string, unknown> | undefined),
        clonedFrom: toolId,
        cloneMode: mode,
        clonedAt: timestamp,
        originalName: sourceData.name,
        originalOwnerId: sourceOwnerId || '',
      },
      provenance: {
        ...(sourceData.provenance as Record<string, unknown> | undefined),
        creatorId: userId,
        createdAt: timestamp,
        forkedFrom: toolId,
        lineage: [...sourceLineage, toolId],
        forkCount: 0,
      },
    };

    await dbAdmin.runTransaction(async (transaction) => {
      transaction.set(newToolRef, cloneData);
      transaction.update(sourceRef, {
        forkCount: admin.firestore.FieldValue.increment(1),
        'provenance.forkCount': admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });

      if (targetSpaceId) {
        const placementRef = dbAdmin
          .collection('spaces')
          .doc(targetSpaceId)
          .collection('placed_tools')
          .doc(newToolRef.id);

        transaction.set(placementRef, {
          toolId: newToolRef.id,
          placedBy: userId,
          placedAt: now,
          location: 'sidebar',
          isActive: true,
          source: 'clone',
          campusId,
        });
      }
    });

    // Notify source creator that their tool was forked/remixed
    if (sourceOwnerId && sourceOwnerId !== userId) {
      try {
        const actorDoc = await dbAdmin.collection('users').doc(userId).get();
        const actorName = (actorDoc.data()?.displayName ||
          actorDoc.data()?.fullName ||
          actorDoc.data()?.name) as string | undefined;

        await notifyToolForked({
          originalCreatorId: sourceOwnerId,
          forkedByUserId: userId,
          forkedByName: actorName,
          toolId,
          toolName: (sourceData.name as string | undefined) || 'Untitled Tool',
          newToolId: newToolRef.id,
        });
      } catch (notifyError) {
        logger.warn('Failed to send tool fork notification', {
          component: 'clone-api',
          toolId,
          newToolId: newToolRef.id,
          userId,
          error: notifyError instanceof Error ? notifyError.message : String(notifyError),
        });
      }
    }

    logger.info('Tool cloned', {
      component: 'clone-api',
      sourceToolId: toolId,
      newToolId: newToolRef.id,
      userId,
      mode,
      targetSpaceId,
    });

    return respond.success(
      {
        toolId: newToolRef.id,
        tool: {
          id: newToolRef.id,
          name: cloneData.name,
          status: cloneData.status,
          clonedFrom: toolId,
          mode,
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
