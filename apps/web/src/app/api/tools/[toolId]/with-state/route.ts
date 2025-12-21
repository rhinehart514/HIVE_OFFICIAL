"use server";

import { dbAdmin } from "@/lib/firebase-admin";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { getPlacementFromDeploymentDoc } from "@/lib/tool-placement";
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";

/**
 * GET /api/tools/[toolId]/with-state
 *
 * Combined endpoint that fetches tool definition and deployment state in one request.
 * This eliminates the N+1 query pattern where clients had to make 2 separate requests.
 *
 * Query params:
 *   - deploymentId: Optional. If provided, also fetches state for this deployment.
 *
 * Response:
 *   - tool: The tool definition (same as /api/tools/[toolId])
 *   - state: The deployment state (only if deploymentId provided)
 *   - stateMetadata: State metadata (only if deploymentId provided)
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { toolId } = await params;
  const url = new URL(request.url);
  const deploymentId = url.searchParams.get("deploymentId");

  // ============================================================
  // Fetch Tool Definition
  // ============================================================

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
    elements?: Array<unknown>;
  };

  if (toolData.campusId !== CURRENT_CAMPUS_ID) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  // Authorization check
  const isOwner = toolData.ownerId === userId || toolData.createdBy === userId;
  const isPublicOrPublished =
    toolData.isPublic === true ||
    toolData.status === "published" ||
    toolData.visibility === "public";

  if (!isOwner && !isPublicOrPublished) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  // Increment view count if not the owner
  if (toolData.ownerId !== userId) {
    await toolDoc.ref.update({
      viewCount: (toolData.viewCount || 0) + 1,
      lastUsedAt: new Date(),
    });
  }

  // Get versions if user is owner
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

  // Normalize elements for consistent response
  const normalizedElements = (toolData.elements || []).map(
    (el: Record<string, unknown>) => {
      const rawInstanceId = (el.instanceId ?? el.id ?? el.elementId) as string | number | undefined;
      const rawElementId = (el.elementId ?? el.id) as string | number | undefined;
      return {
        id: el.id as string | undefined,
        elementId: rawElementId != null ? String(rawElementId) : String(rawInstanceId ?? ""),
        instanceId: rawInstanceId != null ? String(rawInstanceId) : String(rawElementId ?? ""),
        type: el.type as string | undefined,
        config: (el.config as Record<string, unknown>) || {},
        position: el.position,
        size: el.size,
      };
    }
  );

  // Prepare tool response
  const toolResponse = {
    ...toolData,
    elements: normalizedElements,
    versions: versions.length > 0 ? versions : undefined,
  };

  // ============================================================
  // Fetch Deployment State (if deploymentId provided)
  // ============================================================

  let stateResponse: {
    state: Record<string, unknown>;
    metadata: {
      version: string;
      lastSaved: string | null;
      autoSave: boolean;
      size: number;
    };
    exists: boolean;
  } | null = null;

  if (deploymentId) {
    try {
      const deploymentDoc = await dbAdmin
        .collection("deployedTools")
        .doc(deploymentId)
        .get();

      if (deploymentDoc.exists) {
        const deploymentData = deploymentDoc.data();

        if (deploymentData && deploymentData.campusId === CURRENT_CAMPUS_ID) {
          // Check access
          let hasAccess = false;

          if (deploymentData.deployedTo === "profile") {
            hasAccess = deploymentData.targetId === userId;
          } else if (deploymentData.deployedTo === "space") {
            const membershipSnapshot = await dbAdmin
              .collection("spaceMembers")
              .where("userId", "==", userId)
              .where("spaceId", "==", deploymentData.targetId)
              .where("status", "==", "active")
              .where("campusId", "==", CURRENT_CAMPUS_ID)
              .limit(1)
              .get();
            hasAccess = !membershipSnapshot.empty;
          }

          if (hasAccess) {
            // Fetch state from placement or global
            const placementContext = await getPlacementFromDeploymentDoc(deploymentDoc);
            const placementStateDoc = placementContext
              ? await placementContext.ref.collection("state").doc(userId).get()
              : null;

            const globalStateDoc = await dbAdmin
              .collection("toolStates")
              .doc(`${deploymentId}_${userId}`)
              .get();

            interface StateDocData {
              state: Record<string, unknown>;
              metadata?: {
                version?: string;
                lastSaved?: string | null;
                autoSave?: boolean;
                size?: number;
              };
            }

            const stateDoc =
              (placementStateDoc && placementStateDoc.exists
                ? (placementStateDoc.data() as StateDocData)
                : null) ??
              (globalStateDoc.exists
                ? (globalStateDoc.data() as StateDocData)
                : null);

            if (stateDoc) {
              stateResponse = {
                state: stateDoc.state || {},
                metadata: {
                  version: stateDoc.metadata?.version || "1.0.0",
                  lastSaved: stateDoc.metadata?.lastSaved || null,
                  autoSave: stateDoc.metadata?.autoSave !== false,
                  size: stateDoc.metadata?.size || 0,
                },
                exists: true,
              };
            } else {
              stateResponse = {
                state: {},
                metadata: {
                  version: "1.0.0",
                  lastSaved: null,
                  autoSave: true,
                  size: 0,
                },
                exists: false,
              };
            }
          }
        }
      }
    } catch (err) {
      // State fetch failed - log but don't fail the request
      console.error("Failed to fetch state for combined endpoint:", err);
      // Return empty state on error
      stateResponse = {
        state: {},
        metadata: {
          version: "1.0.0",
          lastSaved: null,
          autoSave: true,
          size: 0,
        },
        exists: false,
      };
    }
  }

  // ============================================================
  // Return Combined Response
  // ============================================================

  return respond.success({
    tool: toolResponse,
    ...(stateResponse && {
      state: stateResponse.state,
      stateMetadata: stateResponse.metadata,
      stateExists: stateResponse.exists,
    }),
  });
});
