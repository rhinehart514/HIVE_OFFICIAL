import { z } from "zod";
import * as admin from "firebase-admin";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
  RATE_LIMIT_PRESETS,
} from "@/lib/middleware";

const RemixToolSchema = z.object({
  sourceToolId: z.string().min(1, "Source tool ID is required"),
});

type RemixToolInput = z.infer<typeof RemixToolSchema>;

// POST /api/tools/remix - Create a remix (fork) of a published tool
export const POST = withAuthValidationAndErrors(
  RemixToolSchema,
  async (
    request,
    _context: {},
    validatedData: RemixToolInput,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { sourceToolId } = validatedData;

    // Fetch source tool
    const sourceDoc = await dbAdmin.collection("tools").doc(sourceToolId).get();

    if (!sourceDoc.exists) {
      return respond.error("Source tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const source = sourceDoc.data() as Record<string, unknown>;

    // Enforce campus isolation
    if (source.campusId !== campusId) {
      return respond.error("Source tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    // Only published tools can be remixed
    if (source.status !== "published") {
      return respond.error(
        "Only published tools can be remixed",
        "INVALID_INPUT",
        { status: 400 },
      );
    }

    // Get source creator info for attribution
    let creatorName = "Unknown";
    const creatorId = (source.ownerId || source.createdBy) as string;
    try {
      const creatorDoc = await dbAdmin.collection("users").doc(creatorId).get();
      if (creatorDoc.exists) {
        const creatorData = creatorDoc.data();
        creatorName = (creatorData?.displayName || creatorData?.fullName || "Unknown") as string;
      }
    } catch {
      // Non-critical - proceed with "Unknown"
    }

    // Deep copy elements with fresh instance IDs
    const sourceElements = (source.elements || []) as Array<Record<string, unknown>>;
    const idMap = new Map<string, string>();

    const remixedElements = sourceElements.map((el, index) => {
      const oldInstanceId = (el.instanceId || `elem_${index}`) as string;
      const newInstanceId = `elem_${Date.now().toString(36)}_${index}`;
      idMap.set(oldInstanceId, newInstanceId);

      return {
        ...el,
        instanceId: newInstanceId,
        // Deep copy config to avoid shared references
        config: el.config ? JSON.parse(JSON.stringify(el.config)) : {},
        position: el.position ? { ...(el.position as Record<string, number>) } : { x: 100, y: 100 + index * 150 },
        size: el.size ? { ...(el.size as Record<string, number>) } : { width: 240, height: 120 },
      };
    });

    // Deep copy connections with remapped instance IDs
    const sourceConnections = (source.connections || []) as Array<Record<string, unknown>>;
    const remixedConnections = sourceConnections.map((conn) => {
      const from = conn.from as Record<string, string> | undefined;
      const to = conn.to as Record<string, string> | undefined;

      return {
        ...conn,
        id: `conn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        from: from ? {
          ...from,
          instanceId: idMap.get(from.instanceId) || from.instanceId,
        } : conn.from,
        to: to ? {
          ...to,
          instanceId: idMap.get(to.instanceId) || to.instanceId,
        } : conn.to,
        // Also handle sourceElementId/targetElementId format
        ...(conn.sourceElementId ? {
          sourceElementId: idMap.get(conn.sourceElementId as string) || conn.sourceElementId,
        } : {}),
        ...(conn.targetElementId ? {
          targetElementId: idMap.get(conn.targetElementId as string) || conn.targetElementId,
        } : {}),
      };
    });

    const now = new Date();
    const sourceName = (source.name || "Untitled Tool") as string;

    // Build remixed tool document
    const remixedTool: Record<string, unknown> = {
      name: `${sourceName} (Remix)`,
      description: source.description || "",
      status: "draft",
      type: source.type || "visual",
      category: source.category || null,
      elements: remixedElements,
      connections: remixedConnections,
      config: source.config ? JSON.parse(JSON.stringify(source.config)) : {},
      layout: source.layout || "grid",
      ownerId: userId,
      campusId,
      createdAt: now,
      updatedAt: now,
      currentVersion: "0.1.0",
      remixedFrom: {
        toolId: sourceToolId,
        toolName: sourceName,
        creatorId,
        creatorName,
      },
      remixCount: 0,
      // Carry over surface and capability config
      supportedSurfaces: source.supportedSurfaces || { widget: true, app: false },
      recommendedSurface: source.recommendedSurface || "widget",
      requiredCapabilities: source.requiredCapabilities || {
        read_own_state: true,
        write_own_state: true,
        write_shared_state: true,
      },
      metadata: {
        ...(source.metadata ? JSON.parse(JSON.stringify(source.metadata)) : {}),
        remixedFrom: sourceToolId,
        toolType: source.type || "visual",
      },
      provenance: {
        creatorId: userId,
        createdAt: now.toISOString(),
        forkedFrom: sourceToolId,
        lineage: [
          sourceToolId,
          ...((source.provenance as Record<string, unknown>)?.lineage as string[] || []),
        ],
        forkCount: 0,
        deploymentCount: 0,
        trustTier: "unverified",
      },
      originalContext: null,
    };

    // Use a batch to create the remix and increment source remix count atomically
    const batch = dbAdmin.batch();

    const newToolRef = dbAdmin.collection("tools").doc();
    batch.set(newToolRef, remixedTool);

    // Increment remixCount on source tool
    batch.update(sourceDoc.ref, {
      remixCount: admin.firestore.FieldValue.increment(1),
    });

    // Create initial version
    const versionRef = newToolRef.collection("versions").doc("0.1.0");
    batch.set(versionRef, {
      version: "0.1.0",
      changelog: `Remixed from "${sourceName}"`,
      createdAt: now,
      createdBy: userId,
      isStable: false,
    });

    // Track analytics
    const analyticsRef = dbAdmin.collection("analytics_events").doc();
    batch.set(analyticsRef, {
      eventType: "tool_remixed",
      userId,
      toolId: newToolRef.id,
      sourceToolId,
      campusId,
      timestamp: now.toISOString(),
      metadata: {
        sourceToolName: sourceName,
        sourceCreatorId: creatorId,
        elementsCount: remixedElements.length,
      },
    });

    await batch.commit();

    // Award builder XP to original creator for being remixed (fire-and-forget)
    if (creatorId && creatorId !== userId) {
      import('@/lib/builder-xp').then(({ awardXP }) => {
        awardXP(creatorId, 50, 'tool_remixed').catch(() => {});
      });
    }

    logger.info("[tools/remix] Tool remixed successfully", {
      newToolId: newToolRef.id,
      sourceToolId,
      userId,
    });

    return respond.created(
      { toolId: newToolRef.id },
      { message: `Remixed "${sourceName}" successfully` },
    );
  },
  { rateLimit: RATE_LIMIT_PRESETS.strict },
);
