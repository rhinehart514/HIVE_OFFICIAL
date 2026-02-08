import { getFirestore } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, withErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { getSessionFromRequest } from "@/lib/session";
import {
  UpdateToolSchema,
  getNextVersion,
  validateToolStructure,
} from "@hive/core";

const db = getFirestore();

// GET /api/tools/[toolId] - Get tool details (public access for published tools)
export const GET = withErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  // Optional auth - allow anonymous access to public tools
  const session = await getSessionFromRequest(request);
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

  // Increment view count if not the owner (or anonymous)
  if (!userId || toolData.ownerId !== userId) {
    await toolDoc.ref.update({
      viewCount: (toolData.viewCount || 0) + 1,
      lastUsedAt: new Date() });
  }

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

    // Determine version change type if elements changed
    let newVersion = (currentTool.currentVersion as string) || '1.0.0';
    if (updateData.elements && Array.isArray(updateData.elements) && Array.isArray(currentTool.elements) && updateData.elements.length !== currentTool.elements.length) {
      newVersion = getNextVersion(newVersion);
    }

    // Prepare update data
    const now = new Date();
    const updatedTool: Record<string, unknown> = {
      ...updateData,
      currentVersion: newVersion,
      updatedAt: now,
    };

    // Update tool document
    await toolDoc.ref.update(updatedTool);

    // Create new version if version changed
    if (newVersion !== currentTool.currentVersion) {
      const versionData = {
        version: newVersion,
        changelog: updateData.changelog || "Updated tool configuration",
        createdAt: now,
        createdBy: userId,
        isStable: false,
      };

      await toolDoc.ref.collection("versions").doc(newVersion).set(versionData);
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
  let placedToolsQuery = dbAdmin.collectionGroup('placed_tools').where('toolId', '==', toolId);
  if (campusId) {
    placedToolsQuery = placedToolsQuery.where('campusId', '==', campusId);
  }
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
  const postsSnapshot = await db
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

  return respond.success({ success: true });
});
