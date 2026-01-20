"use server";

import { dbAdmin } from "@/lib/firebase-admin";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { getPlacementFromDeploymentDoc } from "@/lib/tool-placement";
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import type { ToolSharedState, ToolSharedEntity } from "@hive/core";
import { shardedCounterService } from "@/lib/services/sharded-counter.service";
import { extractedCollectionService } from "@/lib/services/extracted-collection.service";

// Feature flags for Phase 1 Scaling Architecture (matches execute/route.ts)
const USE_SHARDED_COUNTERS = process.env.USE_SHARDED_COUNTERS === "true";
const USE_EXTRACTED_COLLECTIONS = process.env.USE_EXTRACTED_COLLECTIONS === "true";

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
  const elements = (toolData.elements || []) as Record<string, unknown>[];
  const normalizedElements = elements.map((el) => {
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
  });

  // Prepare tool response
  const toolResponse = {
    ...toolData,
    elements: normalizedElements,
    versions: versions.length > 0 ? versions : undefined,
  };

  // ============================================================
  // Fetch Deployment State (if deploymentId provided)
  // ============================================================

  // Helper to create empty shared state
  const createEmptySharedState = (): ToolSharedState => ({
    counters: {},
    collections: {},
    timeline: [],
    computed: {},
    version: 0,
    lastModified: new Date().toISOString(),
  });

  let stateResponse: {
    userState: Record<string, unknown>;
    sharedState: ToolSharedState;
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
            // Fetch user state and shared state in parallel
            const placementContext = await getPlacementFromDeploymentDoc(deploymentDoc);

            const [placementStateDoc, globalStateDoc, sharedStateDoc] = await Promise.all([
              // User state from placement
              placementContext
                ? placementContext.ref.collection("state").doc(userId).get()
                : Promise.resolve(null),
              // User state from global
              dbAdmin.collection("toolStates").doc(`${deploymentId}_${userId}`).get(),
              // Shared state (aggregate data visible to all users)
              dbAdmin
                .collection("deployedTools")
                .doc(deploymentId)
                .collection("sharedState")
                .doc("current")
                .get(),
            ]);

            interface StateDocData {
              state: Record<string, unknown>;
              metadata?: {
                version?: string;
                lastSaved?: string | null;
                autoSave?: boolean;
                size?: number;
              };
            }

            // Get user state (prefer placement, fall back to global)
            const userStateDoc =
              (placementStateDoc && placementStateDoc.exists
                ? (placementStateDoc.data() as StateDocData)
                : null) ??
              (globalStateDoc.exists
                ? (globalStateDoc.data() as StateDocData)
                : null);

            // Get shared state
            let sharedState: ToolSharedState = createEmptySharedState();

            // Get counters - aggregate from shards if sharding enabled
            // This works even if sharedStateDoc doesn't exist (new tools with sharding only)
            let counters: Record<string, number> = {};

            if (USE_SHARDED_COUNTERS) {
              // Aggregate counters from shards (200+ writes/sec capacity)
              const shardedCounters = await shardedCounterService.getAllCounters(deploymentId);
              counters = shardedCounters;
            }

            // Get collections - aggregate from subcollections if extraction enabled
            let collections: Record<string, Record<string, ToolSharedEntity>> = {};

            if (USE_EXTRACTED_COLLECTIONS) {
              // Aggregate collections from subcollections (unlimited scale)
              collections = await extractedCollectionService.getAllCollections(deploymentId);
            }

            if (sharedStateDoc.exists) {
              const data = sharedStateDoc.data();

              if (!USE_SHARDED_COUNTERS) {
                // Legacy path: read counters directly from document
                counters = (data?.counters as Record<string, number>) || {};
              } else {
                // Merge any legacy counters (migration support)
                const legacyCounters = (data?.counters as Record<string, number>) || {};
                counters = { ...legacyCounters, ...counters };
              }

              if (!USE_EXTRACTED_COLLECTIONS) {
                // Legacy path: read collections directly from document
                collections = (data?.collections as Record<string, Record<string, ToolSharedEntity>>) || {};
              } else {
                // Merge any legacy collections (migration support)
                const legacyCollections = (data?.collections as Record<string, Record<string, ToolSharedEntity>>) || {};
                for (const [key, entities] of Object.entries(legacyCollections)) {
                  collections[key] = { ...entities, ...(collections[key] || {}) };
                }
              }

              sharedState = {
                counters,
                collections,
                timeline: (data?.timeline as ToolSharedState["timeline"]) || [],
                computed: (data?.computed as Record<string, unknown>) || {},
                version: (data?.version as number) || 0,
                lastModified: (data?.lastModified as string) || new Date().toISOString(),
              };
            } else if (Object.keys(counters).length > 0 || Object.keys(collections).length > 0) {
              // No main document but shards/collections exist - return state with data we have
              sharedState = {
                ...sharedState,
                counters,
                collections,
              };
            }

            stateResponse = {
              userState: userStateDoc?.state || {},
              sharedState,
              metadata: {
                version: userStateDoc?.metadata?.version || "1.0.0",
                lastSaved: userStateDoc?.metadata?.lastSaved || null,
                autoSave: userStateDoc?.metadata?.autoSave !== false,
                size: userStateDoc?.metadata?.size || 0,
              },
              exists: userStateDoc !== null || sharedStateDoc.exists,
            };
          }
        }
      }
    } catch {
      // State fetch failed - don't fail the request, return empty state
      stateResponse = {
        userState: {},
        sharedState: createEmptySharedState(),
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
      // Legacy: Keep 'state' for backward compatibility (maps to userState)
      state: stateResponse.userState,
      // Phase 1: Shared State Architecture
      userState: stateResponse.userState,
      sharedState: stateResponse.sharedState,
      stateMetadata: stateResponse.metadata,
      stateExists: stateResponse.exists,
    }),
  });
});
