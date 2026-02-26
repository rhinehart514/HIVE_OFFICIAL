import * as admin from "firebase-admin";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, withErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/structured-logger";
import {
  UpdateToolSchema,
  getNextVersion,
  validateToolStructure,
} from "@hive/core";
import { notifyToolUpdated } from "@/lib/tool-notifications";
import { withCache } from '../../../../lib/cache-headers';
import { createHash } from 'crypto';

/**
 * Hash a tool composition for change detection.
 * Deterministic — sorts keys to avoid ordering differences.
 */
function hashComposition(data: Record<string, unknown>): string {
  const relevant = {
    elements: data.elements,
    connections: data.connections,
    pages: data.pages,
    layout: data.layout,
    config: data.config,
    name: data.name,
    description: data.description,
  };
  const json = JSON.stringify(relevant, Object.keys(relevant).sort());
  return createHash('sha256').update(json).digest('hex').slice(0, 16);
}

// GET /api/tools/[toolId] - Get tool details (public access for published tools)
const _GET = withErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  // Optional auth - allow anonymous access to public tools
  const session = await getSession(request as unknown as import('next/server').NextRequest);
  const userId = session?.userId || null;
  const campusId = session?.campusId || null;
  const { toolId } = await params;
  const toolDoc = await dbAdmin.collection("tools").doc(toolId).get();

  if (!toolDoc.exists) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const toolData = { id: toolDoc.id, ...toolDoc.data() } as Record<string, unknown> & {
    id: string;
    campusId?: string;
    ownerId?: string;
    createdBy?: string;
    viewCount?: number;
    status?: string;
    isPublic?: boolean;
    visibility?: string;
  };

  // Optional campus filtering: if user has campus and tool has campus, they must match
  if (campusId && toolData.campusId && toolData.campusId !== campusId) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  // Authorization check: Owner can see any tool, others can only see public/published tools
  const isOwner = userId && (toolData.ownerId === userId || toolData.createdBy === userId);
  const isPublicOrPublished = toolData.isPublic === true ||
                               toolData.status === 'published' ||
                               toolData.visibility === 'public';

  if (!isOwner && !isPublicOrPublished) {
    // Private/draft tools are only visible to their owners
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  // Track tool load usage; external viewers also increment view count.
  const usageUpdates: Record<string, unknown> = {
    useCount: admin.firestore.FieldValue.increment(1),
    lastUsedAt: new Date(),
  };
  if (!userId || toolData.ownerId !== userId) {
    usageUpdates.viewCount = admin.firestore.FieldValue.increment(1);
  }
  await toolDoc.ref.update(usageUpdates);

  // Get versions if user is owner (check both ownerId and createdBy)
  let versions: Array<Record<string, unknown>> = [];
  if (isOwner) {
    const versionsSnapshot = await toolDoc.ref
      .collection("versions")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    versions = versionsSnapshot.docs.map((doc) => ({
      version: doc.id,
      ...doc.data(),
    }));
  }

  return respond.success({
    ...toolData,
    versions: versions.length > 0 ? versions : undefined
  });
});

// PUT /api/tools/[toolId] - Update tool
export const PUT = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
    const req = request as AuthenticatedRequest;
    const userId = getUserId(req);
    const campusId = req.user.campusId || null;
    const { toolId } = await params;
    const body = await request.json();
    // Best-effort validation using core's lightweight schema helpers
    let updateData: Record<string, unknown> = body as Record<string, unknown>;
    try {
      const maybeSafeParse = (UpdateToolSchema as unknown as Record<string, unknown>)?.safeParse;
      if (typeof maybeSafeParse === 'function') {
        const parsed = maybeSafeParse(body) as { success?: boolean; data?: Record<string, unknown> };
        if (parsed && parsed.success) {
          updateData = parsed.data ?? body as Record<string, unknown>;
        }
      }
    } catch {
      // If validation helper fails, proceed with raw body and rely on further checks
    }
    const toolDoc = await dbAdmin.collection("tools").doc(toolId).get();

    if (!toolDoc.exists) {
      return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const currentTool = { id: toolDoc.id, ...toolDoc.data() } as Record<string, unknown> & {
      id: string;
      campusId?: string;
      ownerId?: string;
      name?: string;
      currentVersion?: string;
      elements?: Array<unknown>;
      spaceId?: string;
    };

    // Optional campus filtering: if user has campus and tool has campus, they must match
    if (campusId && currentTool.campusId && currentTool.campusId !== campusId) {
      return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    // Check if user is owner (check both ownerId and createdBy for backwards compat)
    const isToolOwner = currentTool.ownerId === userId || (currentTool as Record<string, unknown>).createdBy === userId;
    if (!isToolOwner) {
      return respond.error("Access denied", "FORBIDDEN", { status: 403 });
    }

    // Validate tool structure if elements are being updated
    if (updateData.elements) {
      const isValid = !!validateToolStructure(updateData.elements as Array<unknown>);
      if (!isValid) {
        return respond.error("Invalid tool structure", "INVALID_INPUT", { status: 400 });
      }
    }

    // Determine version change via composition hash comparison
    let newVersion = (currentTool.currentVersion as string) || '1.0.0';
    const currentHash = hashComposition(currentTool as Record<string, unknown>);
    const incomingHash = hashComposition({ ...currentTool, ...updateData } as Record<string, unknown>);
    const compositionChanged = currentHash !== incomingHash;

    if (compositionChanged) {
      newVersion = getNextVersion(newVersion);
    }

    // Prepare update data
    const now = new Date();
    const updatedTool: Record<string, unknown> = {
      ...updateData,
      currentVersion: newVersion,
      compositionHash: incomingHash,
      updatedAt: now,
    };

    // Update tool document
    await toolDoc.ref.update(updatedTool);

    // Create full snapshot version if composition changed
    if (compositionChanged) {
      const snapshot: Record<string, unknown> = {
        version: newVersion,
        changelog: (updateData.changelog as string) || 'Updated tool configuration',
        createdAt: now,
        createdBy: userId,
        isStable: false,
        compositionHash: incomingHash,
        // Full composition snapshot for restore
        elements: updateData.elements ?? currentTool.elements ?? [],
        connections: (updateData as Record<string, unknown>).connections ?? (currentTool as Record<string, unknown>).connections ?? [],
        pages: (updateData as Record<string, unknown>).pages ?? (currentTool as Record<string, unknown>).pages,
        layout: (updateData as Record<string, unknown>).layout ?? (currentTool as Record<string, unknown>).layout,
        config: (updateData as Record<string, unknown>).config ?? (currentTool as Record<string, unknown>).config,
        name: (updateData.name as string) ?? currentTool.name,
        description: (updateData as Record<string, unknown>).description ?? (currentTool as Record<string, unknown>).description,
        elementCount: Array.isArray(updateData.elements) ? updateData.elements.length : (Array.isArray(currentTool.elements) ? currentTool.elements.length : 0),
      };

      await toolDoc.ref.collection("versions").doc(newVersion).set(snapshot);

      // Cap versions at 50 — delete oldest if exceeded
      const allVersions = await toolDoc.ref
        .collection("versions")
        .orderBy("createdAt", "asc")
        .get();

      if (allVersions.size > 50) {
        const toDelete = allVersions.docs.slice(0, allVersions.size - 50);
        const batch = dbAdmin.batch();
        toDelete.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // Track analytics event
    await dbAdmin.collection("analytics_events").add({
      eventType: "tool_updated",
      userId: userId,
      toolId: toolId,
      spaceId: currentTool.spaceId || null,
      timestamp: now,
      metadata: {
        versionChanged: newVersion !== currentTool.currentVersion,
        newVersion: newVersion,
        elementsCount:
          (Array.isArray(updateData.elements) ? updateData.elements.length : 0) ||
          (Array.isArray(currentTool.elements) ? currentTool.elements.length : 0),
        changeType: updateData.elements ? 'minor' : 'config',
      } });

    // Notify users who forked this tool that upstream changed.
    try {
      const actorDoc = await dbAdmin.collection('users').doc(userId).get();
      const actorName =
        (actorDoc.data()?.displayName as string | undefined) ||
        (actorDoc.data()?.fullName as string | undefined) ||
        undefined;

      await notifyToolUpdated({
        toolId,
        toolName:
          (currentTool.name as string | undefined) ||
          (updateData.name as string | undefined) ||
          'Untitled Tool',
        updatedByUserId: userId,
        updatedByName: actorName,
        campusId: campusId || undefined,
      });
    } catch (notifyError) {
      logger.warn('Failed to send tool.updated notifications', {
        toolId,
        userId,
        error: notifyError instanceof Error ? notifyError.message : String(notifyError),
      });
    }

    // Fetch and return updated tool
    const updatedDoc = await toolDoc.ref.get();
    const result = { id: updatedDoc.id, ...updatedDoc.data() };

    return respond.success(result);
  }
);

// DELETE /api/tools/[toolId] - Delete tool
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = req.user.campusId || null;
  const { toolId } = await params;
  const toolDoc = await dbAdmin.collection("tools").doc(toolId).get();

  if (!toolDoc.exists) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const tool = { id: toolDoc.id, ...toolDoc.data() } as Record<string, unknown> & {
    id: string;
    campusId?: string;
    ownerId?: string;
    spaceId?: string | null;
    name?: string;
    status?: string;
    elements?: Array<unknown>;
    useCount?: number;
  };

  // Optional campus filtering: if user has campus and tool has campus, they must match
  if (campusId && tool.campusId && tool.campusId !== campusId) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  // Only owner can delete (check both ownerId and createdBy for backwards compat)
  const isToolOwner = tool.ownerId === userId || (tool as Record<string, unknown>).createdBy === userId;
  if (!isToolOwner) {
    return respond.error("Access denied", "FORBIDDEN", { status: 403 });
  }

  // CASCADE DELETE: Find and delete all PlacedTools referencing this tool across all spaces
  // campusId filter omitted — index exempted; toolId scopes the query sufficiently
  const placedToolsQuery = dbAdmin.collectionGroup('placed_tools').where('toolId', '==', toolId);
  const placedToolsSnapshot = await placedToolsQuery.get();

  const cascadeBatch = dbAdmin.batch();
  const deletedPlacements: string[] = [];
  const deletedConnections: string[] = [];

  for (const placementDoc of placedToolsSnapshot.docs) {
    const placement = placementDoc.data();
    const spaceId = placement.spaceId || placementDoc.ref.parent.parent?.id;

    if (spaceId) {
      // Find connections where this deployment is source or target
      const [connectionsAsSource, connectionsAsTarget] = await Promise.all([
        dbAdmin
          .collection(`spaces/${spaceId}/toolConnections`)
          .where('source.deploymentId', '==', placementDoc.id)
          .get(),
        dbAdmin
          .collection(`spaces/${spaceId}/toolConnections`)
          .where('target.deploymentId', '==', placementDoc.id)
          .get(),
      ]);

      [...connectionsAsSource.docs, ...connectionsAsTarget.docs].forEach(conn => {
        cascadeBatch.delete(conn.ref);
        deletedConnections.push(conn.id);
      });
    }

    cascadeBatch.delete(placementDoc.ref);
    deletedPlacements.push(placementDoc.id);
  }

  // Commit cascade deletions if any
  if (deletedPlacements.length > 0 || deletedConnections.length > 0) {
    await cascadeBatch.commit();
  }

  // Check if tool is being used in any posts
  const postsSnapshot = await dbAdmin
    .collectionGroup("posts")
    .where("type", "==", "tool")
    .where("toolId", "==", toolId)
    .limit(1)
    .get();

  if (!postsSnapshot.empty) {
    return respond.error(
      "Cannot delete tool that is being used in posts",
      "CONFLICT",
      { status: 409 }
    );
  }

  // Delete tool and all subcollections
  const batch = dbAdmin.batch();

  // Delete versions
  const versionsSnapshot = await toolDoc.ref.collection("versions").get();
  versionsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete data records
  const recordsSnapshot = await toolDoc.ref.collection("records").get();
  recordsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete the tool itself
  batch.delete(toolDoc.ref);

  await batch.commit();

  // Track analytics event
  await dbAdmin.collection("analytics_events").add({
    eventType: "tool_deleted",
    userId: userId,
    toolId: toolId,
    spaceId: tool.spaceId || null,
    timestamp: new Date(),
    metadata: {
      toolName: tool.name,
      wasPublished: tool.status === "published",
      elementsCount: Array.isArray(tool.elements) ? tool.elements.length : 0,
      usageCount: tool.useCount,
    } });

  // Track generation outcome — if deleted within 5 min, mark as not kept
  const generationOutcomeId = (tool as Record<string, unknown>).generationOutcomeId as string | undefined;
  if (generationOutcomeId) {
    const createdAt = (tool as Record<string, unknown>).createdAt;
    const createdTime = createdAt instanceof admin.firestore.Timestamp
      ? createdAt.toDate().getTime()
      : typeof createdAt === 'string' ? new Date(createdAt).getTime() : 0;
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - createdTime < fiveMinutes) {
      import('@/lib/goose-server').then(({ updateGenerationOutcome }) => {
        updateGenerationOutcome(generationOutcomeId, { 'outcome.kept': false }).catch(() => {});
      }).catch(() => {});
    }
  }

  return respond.success({ success: true });
});

export const GET = withCache(_GET, 'SHORT');
