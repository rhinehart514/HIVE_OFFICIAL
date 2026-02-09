"use server";

/**
 * Space Tools API Route
 *
 * Handles tool posting and management for spaces using DDD services.
 * Tools are "posted" to spaces (not "deployed") - lightweight, shareable across contexts.
 *
 * GET /api/spaces/[spaceId]/tools - List posted tools
 * POST /api/spaces/[spaceId]/tools - Post a tool to the space
 *
 * @author HIVE Backend Team
 * @version 2.1.0 - Posting Model Refactor
 */

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { logger } from "@/lib/structured-logger";
import { HttpStatus } from "@/lib/api-response-types";
import { Result, type PlacementLocation, type PlacementVisibility } from "@hive/core";
import {
  getServerSpaceRepository,
  createServerSpaceDeploymentService,
  type SpaceDeploymentCallbacks,
  type PlacedToolData,
} from "@hive/core/server";

// ============================================================================
// Validation Schemas
// ============================================================================

const GetSpaceToolsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  category: z
    .enum(["productivity", "academic", "social", "utility", "entertainment", "other"])
    .optional(),
  status: z.enum(["active", "inactive", "all"]).default("active"),
  placement: z.enum(["sidebar", "inline", "modal", "tab", "all"]).default("all"),
  sortBy: z
    .enum(["order", "deployments", "rating", "recent", "alphabetical"])
    .default("order"),
});

const PlaceToolSchema = z.object({
  toolId: z.string().min(1),
  placement: z.enum(["sidebar", "inline", "modal", "tab"]).default("sidebar"),
  order: z.number().min(0).optional(),
  configOverrides: z.record(z.any()).optional(),
  visibility: z.enum(["all", "members", "leaders"]).default("all"),
  titleOverride: z.string().max(100).optional(),
  // State isolation mode: 'shared' (default) enables cross-space engagement
  stateMode: z.enum(["shared", "isolated"]).default("shared"),
});

// ============================================================================
// Callbacks for SpaceDeploymentService
// ============================================================================

function createDeploymentCallbacks(spaceId: string, campusId: string | undefined): SpaceDeploymentCallbacks {
  return {
    savePlacedTool: async (_spaceId: string, placedTool: PlacedToolData): Promise<Result<void>> => {
      try {
        await dbAdmin
          .collection("spaces")
          .doc(spaceId)
          .collection("placed_tools")
          .doc(placedTool.id)
          .set({
            toolId: placedTool.toolId,
            placement: placedTool.placement,
            order: placedTool.order,
            isActive: placedTool.isActive,
            source: placedTool.source,
            placedBy: placedTool.placedBy,
            placedAt: placedTool.placedAt,
            configOverrides: placedTool.configOverrides,
            visibility: placedTool.visibility,
            titleOverride: placedTool.titleOverride,
            isEditable: placedTool.isEditable,
            // State management fields
            stateMode: placedTool.stateMode,
            deploymentId: placedTool.deploymentId,
            state: placedTool.state, // Legacy field, prefer deploymentId-based state
            stateUpdatedAt: placedTool.stateUpdatedAt,
            campusId: campusId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        return Result.ok<void>(undefined);
      } catch (error) {
        return Result.fail<void>(error instanceof Error ? error.message : "Failed to save placed tool");
      }
    },

    updatePlacedTool: async (_spaceId: string, placementId: string, updates: Partial<PlacedToolData>): Promise<Result<void>> => {
      try {
        await dbAdmin
          .collection("spaces")
          .doc(spaceId)
          .collection("placed_tools")
          .doc(placementId)
          .update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        return Result.ok<void>(undefined);
      } catch (error) {
        return Result.fail<void>(error instanceof Error ? error.message : "Failed to update placed tool");
      }
    },

    deletePlacedTool: async (_spaceId: string, placementId: string): Promise<Result<void>> => {
      try {
        await dbAdmin
          .collection("spaces")
          .doc(spaceId)
          .collection("placed_tools")
          .doc(placementId)
          .delete();
        return Result.ok<void>(undefined);
      } catch (error) {
        return Result.fail<void>(error instanceof Error ? error.message : "Failed to delete placed tool");
      }
    },

    getPlacedTools: async (_spaceId: string): Promise<Result<PlacedToolData[]>> => {
      try {
        const snapshot = await dbAdmin
          .collection("spaces")
          .doc(spaceId)
          .collection("placed_tools")
          .orderBy("order", "asc")
          .get();

        const tools: PlacedToolData[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const stateMode = (data.stateMode || 'shared') as 'shared' | 'isolated';
          // Generate deployment ID if not stored (backward compat)
          const deploymentId = data.deploymentId ||
            (stateMode === 'shared' ? `tool:${data.toolId}` : `space:${spaceId}_${data.toolId}`);

          return {
            id: doc.id,
            toolId: data.toolId,
            spaceId: spaceId,
            placement: data.placement || "sidebar",
            order: data.order || 0,
            isActive: data.isActive ?? true,
            source: data.source || "leader",
            placedBy: data.placedBy || null,
            placedAt: data.placedAt?.toDate?.() || new Date(),
            configOverrides: data.configOverrides || {},
            visibility: data.visibility || "all",
            titleOverride: data.titleOverride || null,
            isEditable: data.isEditable ?? true,
            stateMode,
            deploymentId,
            state: data.state || {},
            stateUpdatedAt: data.stateUpdatedAt?.toDate?.() || null,
          };
        });

        return Result.ok<PlacedToolData[]>(tools);
      } catch (error) {
        return Result.fail<PlacedToolData[]>(error instanceof Error ? error.message : "Failed to get placed tools");
      }
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

async function validateSpaceAccess(spaceId: string, userId: string, campusId: string | undefined) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  // Optional campus filtering: if both user and space have campus, they must match
  if (campusId && space.campusId.id && space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
  }

  // Check membership - filter by campus if present
  let membershipQuery = dbAdmin
    .collection("spaceMembers")
    .where("spaceId", "==", spaceId)
    .where("userId", "==", userId)
    .where("isActive", "==", true);

  if (campusId) {
    membershipQuery = membershipQuery.where("campusId", "==", campusId);
  }

  const membershipSnapshot = await membershipQuery.limit(1).get();

  const membership = membershipSnapshot.empty
    ? space.isPublic
      ? { role: "guest" as const }
      : null
    : membershipSnapshot.docs[0]!.data();

  if (!membership) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
  }

  return { ok: true as const, space, membership };
}

async function enrichToolsWithMetadata(tools: PlacedToolData[], spaceId: string): Promise<Array<Record<string, unknown>>> {
  if (tools.length === 0) return [];

  // Batch fetch tool metadata
  const toolIds = [...new Set(tools.map((t) => t.toolId))];
  const toolDataMap = new Map<string, FirebaseFirestore.DocumentData>();

  for (let i = 0; i < toolIds.length; i += 30) {
    const chunk = toolIds.slice(i, i + 30);
    const toolDocs = await dbAdmin
      .collection("tools")
      .where(admin.firestore.FieldPath.documentId(), "in", chunk)
      .get();
    toolDocs.forEach((doc) => {
      if (doc.exists) {
        toolDataMap.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });
  }

  // P0: Batch fetch deployment records for surfaceModes
  const deploymentDataMap = new Map<string, FirebaseFirestore.DocumentData>();
  for (let i = 0; i < toolIds.length; i += 30) {
    const chunk = toolIds.slice(i, i + 30);
    const deploymentDocs = await dbAdmin
      .collection("deployedTools")
      .where("toolId", "in", chunk)
      .where("targetId", "==", spaceId)
      .get();
    deploymentDocs.forEach((doc) => {
      if (doc.exists) {
        const data = doc.data();
        deploymentDataMap.set(data.toolId, { id: doc.id, ...data });
      }
    });
  }

  // Sprint 1: Batch fetch activity metrics from tool analytics
  const activityDataMap = new Map<string, { activityCount: number; lastActivityAt: string | null }>();
  for (const placedTool of tools) {
    const deploymentId = deploymentDataMap.get(placedTool.toolId)?.id || `${placedTool.toolId}_${spaceId}`;
    try {
      // Check for activity in sharedState (interactions like votes, RSVPs)
      const sharedStateDoc = await dbAdmin
        .collection("deployedTools")
        .doc(deploymentId)
        .collection("sharedState")
        .doc("current")
        .get();

      if (sharedStateDoc.exists) {
        const sharedState = sharedStateDoc.data();
        // Count timeline events as activity
        const timelineLength = sharedState?.timeline?.length || 0;
        // Sum all counter values as additional activity metric
        const countersTotal = Object.values(sharedState?.counters || {}).reduce(
          (sum: number, val) => sum + (typeof val === 'number' ? val : 0),
          0
        );
        const activityCount = timelineLength + countersTotal;
        const lastActivityAt = sharedState?.lastModified || null;
        activityDataMap.set(placedTool.toolId, { activityCount, lastActivityAt });
      } else {
        activityDataMap.set(placedTool.toolId, { activityCount: 0, lastActivityAt: null });
      }
    } catch {
      // Silent fail - activity metrics are non-critical
      activityDataMap.set(placedTool.toolId, { activityCount: 0, lastActivityAt: null });
    }
  }

  return tools.map((placedTool) => {
    const toolData = toolDataMap.get(placedTool.toolId);
    const deploymentData = deploymentDataMap.get(placedTool.toolId);
    const activityData = activityDataMap.get(placedTool.toolId) || { activityCount: 0, lastActivityAt: null };

    // P0: Get surfaceModes from deployment or tool, default to widget-only
    const surfaceModes = deploymentData?.surfaceModes
      || toolData?.supportedSurfaces
      || { widget: true, app: false };

    return {
      // Placement info
      placementId: placedTool.id,
      toolId: placedTool.toolId,
      placement: placedTool.placement,
      order: placedTool.order,
      isActive: placedTool.isActive,
      source: placedTool.source,
      visibility: placedTool.visibility,
      titleOverride: placedTool.titleOverride,
      isEditable: placedTool.isEditable,
      configOverrides: placedTool.configOverrides,
      state: placedTool.state,
      placedAt: placedTool.placedAt.toISOString(),
      placedBy: placedTool.placedBy,

      // Tool metadata
      name: toolData?.name || "Unknown Tool",
      description: toolData?.description || "",
      category: toolData?.category || "other",
      version: toolData?.currentVersion || "1.0.0",
      elementType: toolData?.elementType || toolData?.elements?.[0]?.type || "unknown",

      // P0: Surface modes for "View Full" link in sidebar
      surfaceModes,
      deploymentId: deploymentData?.id || placedTool.id,

      // Sprint 1: Activity metrics for sidebar badges
      activityCount: activityData.activityCount,
      lastActivityAt: activityData.lastActivityAt,

      // Tool stats
      originalTool: toolData
        ? {
            averageRating: toolData.averageRating || 0,
            ratingCount: toolData.ratingCount || 0,
            totalDeployments: toolData.deploymentCount || 0,
            isVerified: toolData.isVerified || false,
            creatorId: toolData.creatorId,
          }
        : null,
    };
  });
}

// ============================================================================
// GET Handler
// ============================================================================

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  try {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // Validate access
    const validation = await validateSpaceAccess(spaceId, userId, campusId);
    if (!validation.ok) {
      const code =
        validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    // Parse query params
    const queryParams = GetSpaceToolsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    // Create deployment service
    const callbacks = createDeploymentCallbacks(spaceId, campusId);
    const deploymentService = createServerSpaceDeploymentService(
      { userId, campusId },
      callbacks
    );

    // Get placed tools via service
    const result = await deploymentService.getPlacedTools(spaceId);

    if (result.isFailure) {
      return respond.error("Failed to fetch tools", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    const serviceResult = result.getValue();
    let tools = serviceResult.data || [];

    // Apply filters
    if (queryParams.status !== "all") {
      const isActive = queryParams.status === "active";
      tools = tools.filter((t) => t.isActive === isActive);
    }

    if (queryParams.placement !== "all") {
      tools = tools.filter((t) => t.placement === queryParams.placement);
    }

    // Enrich with tool metadata (includes P0 surfaceModes)
    const enrichedTools = await enrichToolsWithMetadata(tools, spaceId);

    // Apply category filter (needs metadata)
    let filteredTools = enrichedTools;
    if (queryParams.category) {
      filteredTools = enrichedTools.filter((t) => t.category === queryParams.category);
    }

    // Sort
    switch (queryParams.sortBy) {
      case "alphabetical":
        filteredTools.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        break;
      case "recent":
        filteredTools.sort((a, b) =>
          new Date(String(b.placedAt)).getTime() - new Date(String(a.placedAt)).getTime()
        );
        break;
      case "order":
      default:
        filteredTools.sort((a, b) => Number(a.order) - Number(b.order));
        break;
    }

    // Paginate
    const paginatedTools = filteredTools.slice(
      queryParams.offset,
      queryParams.offset + queryParams.limit
    );

    // SCALING FIX: Add cache headers - tools list is relatively static
    // Cache for 5 minutes on edge, stale-while-revalidate for 10 minutes
    return respond.success({
      tools: paginatedTools,
      pagination: {
        total: filteredTools.length,
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore: filteredTools.length > queryParams.offset + queryParams.limit,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    logger.error("Error fetching space tools", {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error("Failed to fetch space tools", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

// ============================================================================
// POST Handler
// ============================================================================

export const POST = withAuthValidationAndErrors(
  PlaceToolSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    try {
      const { spaceId } = await params;
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);

      // Validate access
      const validation = await validateSpaceAccess(spaceId, userId, campusId);
      if (!validation.ok) {
        const code =
          validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
        return respond.error(validation.message, code, { status: validation.status });
      }

      // Check permission (must be leader/admin to post tools)
      const { membership } = validation;
      const canPost = ["owner", "admin", "moderator"].includes(membership.role);
      if (!canPost) {
        return respond.error("Only space leaders can post tools", "FORBIDDEN", {
          status: HttpStatus.FORBIDDEN,
        });
      }

      // Verify tool exists
      const toolDoc = await dbAdmin.collection("tools").doc(body.toolId).get();
      if (!toolDoc.exists) {
        return respond.error("Tool not found", "RESOURCE_NOT_FOUND", {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const toolData = toolDoc.data();
      // Optional campus filtering: if both tool and user have campus, they must match
      if (campusId && toolData?.campusId && toolData.campusId !== campusId) {
        return respond.error("Access denied for this campus", "FORBIDDEN", {
          status: HttpStatus.FORBIDDEN,
        });
      }

      // Validate tool capabilities against space governance
      const { validatePlacementCapabilities } = await import("@hive/core");
      const spaceDoc = await dbAdmin.collection("spaces").doc(spaceId).get();
      const spaceData = spaceDoc.exists ? spaceDoc.data() : null;

      const placementValidation = validatePlacementCapabilities(
        (toolData?.capabilities as Record<string, unknown>) || {},
        spaceData?.governance as { allowedLanes?: ('safe' | 'scoped' | 'power')[] } | undefined
      );

      if (!placementValidation.canPlace) {
        return respond.error(
          `Cannot place tool: ${placementValidation.errors.join(', ')}`,
          "FORBIDDEN",
          { status: HttpStatus.FORBIDDEN }
        );
      }

      // Log warnings (tool can still be placed)
      if (placementValidation.warnings.length > 0) {
        logger.info("Tool placement warnings", {
          spaceId,
          toolId: body.toolId,
          requiredLane: placementValidation.requiredLane,
          warnings: placementValidation.warnings,
        });
      }

      // Create deployment service and place tool
      const callbacks = createDeploymentCallbacks(spaceId, campusId);
      const deploymentService = createServerSpaceDeploymentService(
        { userId, campusId },
        callbacks
      );

      const placeResult = await deploymentService.placeTool({
        spaceId,
        toolId: body.toolId,
        placement: body.placement as PlacementLocation,
        order: body.order,
        configOverrides: body.configOverrides,
        visibility: body.visibility as PlacementVisibility,
        titleOverride: body.titleOverride,
        stateMode: body.stateMode,
      });

      if (placeResult.isFailure) {
        // Check if duplicate
        if (placeResult.error?.includes("already placed")) {
          return respond.error("Tool is already posted to this space", "CONFLICT", {
            status: HttpStatus.CONFLICT,
          });
        }
        return respond.error(placeResult.error || "Failed to post tool", "INTERNAL_ERROR", {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }

      const serviceResult = placeResult.getValue();
      const placement = serviceResult.data!;

      // Update tool deployment count
      await dbAdmin.collection("tools").doc(body.toolId).update({
        deploymentCount: admin.firestore.FieldValue.increment(1),
        lastDeployedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return respond.created({
        placement: {
          placementId: placement.placementId,
          toolId: placement.toolId,
          placement: placement.placement,
          order: placement.order,
          name: toolData?.name || "Tool",
          description: toolData?.description || "",
          category: toolData?.category || "other",
          version: toolData?.currentVersion || "1.0.0",
          isActive: true,
          source: "leader",
          visibility: body.visibility,
          postedAt: new Date().toISOString(),
          postedBy: userId,
        },
      });
    } catch (error) {
      logger.error("Error posting tool to space", {
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error("Failed to post tool", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

// ============================================================================
// DELETE Handler - Remove tool from space
// ============================================================================

const RemoveToolSchema = z.object({
  placementId: z.string().min(1),
});

export const DELETE = withAuthValidationAndErrors(
  RemoveToolSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    try {
      const { spaceId } = await params;
      const userId = getUserId(request as AuthenticatedRequest);
      const campusId = getCampusId(request as AuthenticatedRequest);

      // Validate access
      const validation = await validateSpaceAccess(spaceId, userId, campusId);
      if (!validation.ok) {
        const code =
          validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
        return respond.error(validation.message, code, { status: validation.status });
      }

      // Check permission (must be leader/admin to remove tools)
      const { membership } = validation;
      const canRemove = ["owner", "admin", "moderator"].includes(membership.role);
      if (!canRemove) {
        return respond.error("Only space leaders can remove tools", "FORBIDDEN", {
          status: HttpStatus.FORBIDDEN,
        });
      }

      // Verify the placement exists
      const placementRef = dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("placed_tools")
        .doc(body.placementId);

      const placementDoc = await placementRef.get();
      if (!placementDoc.exists) {
        return respond.error("Tool placement not found", "RESOURCE_NOT_FOUND", {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const placementData = placementDoc.data();
      const toolId = placementData?.toolId;

      // Execute all writes in a single transaction for atomicity
      await dbAdmin.runTransaction(async (transaction) => {
        // 1. Delete the placement
        transaction.delete(placementRef);

        // 2. Update tool deployment count (decrement)
        if (toolId) {
          const toolRef = dbAdmin.collection("tools").doc(toolId);
          const toolDoc = await transaction.get(toolRef);
          if (toolDoc.exists) {
            transaction.update(toolRef, {
              deploymentCount: admin.firestore.FieldValue.increment(-1),
            });
          }
        }

        // 3. Mark in deployedTools collection if exists (for analytics consistency)
        if (toolId) {
          const deploymentId = `${toolId}_${spaceId}`;
          const deployedToolRef = dbAdmin.collection("deployedTools").doc(deploymentId);
          const deployedToolDoc = await transaction.get(deployedToolRef);
          if (deployedToolDoc.exists) {
            transaction.update(deployedToolRef, {
              isActive: false,
              undeployedBy: userId,
              undeployedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      });

      logger.info("Tool removed from space", {
        spaceId,
        placementId: body.placementId,
        toolId,
        removedBy: userId,
      });

      return respond.success({
        removed: true,
        placementId: body.placementId,
        toolId,
      });
    } catch (error) {
      logger.error("Error removing tool from space", {
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error("Failed to remove tool", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);
