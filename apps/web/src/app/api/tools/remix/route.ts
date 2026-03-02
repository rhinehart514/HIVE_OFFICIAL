import { z } from 'zod';
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { logger } from '@/lib/structured-logger';
import { notifyToolForked } from '@/lib/tool-notifications';

const RemixSchema = z.object({
  sourceToolId: z.string().min(1),
  spaceId: z.string().optional(),
});

/**
 * POST /api/tools/remix — Remix (fork) a published tool
 *
 * Creates a draft copy of the source tool owned by the requesting user.
 * Preserves elements, connections, and config. Resets stats.
 *
 * Accepts { sourceToolId, spaceId? } in the body.
 * Returns the new tool ID for redirect.
 */
export const POST = withAuthValidationAndErrors(
  RemixSchema,
  async (request, _context, body, respond) => {
    const req = request as AuthenticatedRequest;
    const userId = getUserId(req);
    const campusId = getCampusId(req);
    const { sourceToolId, spaceId: targetSpaceId } = body;

    const sourceRef = dbAdmin.collection('tools').doc(sourceToolId);
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
        'Tool must be published or public to remix',
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

    const cloneData: Record<string, unknown> = {
      ...sourceData,
      ownerId: userId,
      creatorId: userId,
      createdBy: userId,
      campusId,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      deployedSpaces: targetSpaceId ? [targetSpaceId] : [],
      forkCount: 0,
      deploymentCount: 0,
      useCount: 0,
      viewCount: 0,
      forkedFrom: {
        toolId: sourceToolId,
        userId: sourceOwnerId || '',
        timestamp,
      },
      metadata: {
        ...(sourceData.metadata as Record<string, unknown> | undefined),
        clonedFrom: sourceToolId,
        cloneMode: 'remix',
        clonedAt: timestamp,
        originalName: sourceData.name,
        originalOwnerId: sourceOwnerId || '',
      },
      provenance: {
        ...(sourceData.provenance as Record<string, unknown> | undefined),
        creatorId: userId,
        createdAt: timestamp,
        forkedFrom: sourceToolId,
        lineage: [...sourceLineage, sourceToolId],
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

    // Notify source creator that their tool was remixed
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
          toolId: sourceToolId,
          toolName: (sourceData.name as string | undefined) || 'Untitled Tool',
          newToolId: newToolRef.id,
        });
      } catch (notifyError) {
        logger.warn('Failed to send tool remix notification', {
          component: 'remix-api',
          toolId: sourceToolId,
          newToolId: newToolRef.id,
          userId,
          error: notifyError instanceof Error ? notifyError.message : String(notifyError),
        });
      }
    }

    logger.info('Tool remixed', {
      component: 'remix-api',
      sourceToolId,
      newToolId: newToolRef.id,
      userId,
      targetSpaceId,
    });

    return respond.success({
      toolId: newToolRef.id,
      remixedBy: userId,
    });
  }
);
