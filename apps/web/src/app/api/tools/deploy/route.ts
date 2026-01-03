"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { logger } from "@/lib/structured-logger";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import {
  buildPlacementCompositeId,
} from "@/lib/tool-placement";
import { notifyToolDeployment } from "@/lib/notification-service";
import {
  CAPABILITY_PRESETS,
  getDefaultBudgets,
  getCapabilityLane,
  validateCapabilityRequest,
  DEFAULT_SURFACE_MODES,
  DEFAULT_APP_CONFIG,
  type ToolCapabilities,
  type ToolBudgets,
  type DeploymentGovernanceStatus,
  type TrustTier,
  type SurfaceModes,
  type AppConfig,
} from "@hive/core";

const SurfaceSchema = z.enum([
  "pinned",
  "posts",
  "events",
  "tools",
  "chat",
  "members",
]);

const DeploymentPermissionsSchema = z
  .object({
    canInteract: z.boolean().optional(),
    canView: z.boolean().optional(),
    canEdit: z.boolean().optional(),
    allowedRoles: z.array(z.string()).optional(),
  })
  .optional();

const DeploymentSettingsSchema = z
  .object({
    showInDirectory: z.boolean().optional(),
    allowSharing: z.boolean().optional(),
    collectAnalytics: z.boolean().optional(),
    notifyOnInteraction: z.boolean().optional(),
  })
  .optional();

// Capability schema for hackability governance
const CapabilitiesSchema = z
  .object({
    read_space_context: z.boolean().optional(),
    read_space_members: z.boolean().optional(),
    write_shared_state: z.boolean().optional(),
    create_posts: z.boolean().optional(),
    send_notifications: z.boolean().optional(),
    trigger_automations: z.boolean().optional(),
    // P0: Object capabilities
    objects_read: z.union([z.boolean(), z.array(z.string())]).optional(),
    objects_write: z.union([z.boolean(), z.array(z.string())]).optional(),
    objects_delete: z.union([z.boolean(), z.array(z.string())]).optional(),
  })
  .optional();

// P0: Surface modes schema
const SurfaceModesSchema = z
  .object({
    widget: z.boolean(),
    app: z.boolean(),
  })
  .optional();

// P0: App config schema
const AppConfigSchema = z
  .object({
    layout: z.enum(["full", "centered", "sidebar"]).optional(),
    showWidgetWhenActive: z.boolean().optional(),
    breadcrumbLabel: z.string().max(50).optional(),
  })
  .optional();

// Budget overrides (for power tools)
const BudgetsSchema = z
  .object({
    notificationsPerDay: z.number().min(0).max(100).optional(),
    postsPerDay: z.number().min(0).max(100).optional(),
    automationsPerDay: z.number().min(0).max(500).optional(),
    executionsPerUserPerHour: z.number().min(0).max(1000).optional(),
  })
  .optional();

const DeployToolSchema = z.object({
  toolId: z.string(),
  deployTo: z.enum(["profile", "space"]),
  targetId: z.string(),
  surface: SurfaceSchema.optional(),
  config: z.record(z.any()).optional(),
  permissions: DeploymentPermissionsSchema,
  settings: DeploymentSettingsSchema,
  // Hackability governance fields
  capabilities: CapabilitiesSchema,
  budgets: BudgetsSchema,
  experimental: z.boolean().optional(),
  // P0: Surface modes and app config
  surfaceModes: SurfaceModesSchema,
  primarySurface: z.enum(["widget", "app"]).optional(),
  appConfig: AppConfigSchema,
});

type DeployToolInput = z.infer<typeof DeployToolSchema>;

type DeploymentRecord = {
  id: string;
  toolId: string;
  deployedBy: string;
  deployedTo: "profile" | "space";
  targetType: "profile" | "space";
  targetId: string;
  surface?: z.infer<typeof SurfaceSchema>;
  position: number;
  config: Record<string, unknown>;
  permissions: {
    canInteract: boolean;
    canView: boolean;
    canEdit: boolean;
    allowedRoles: string[];
  };
  status: DeploymentGovernanceStatus;
  deployedAt: string;
  lastUsed?: string;
  usageCount: number;
  settings: {
    showInDirectory: boolean;
    allowSharing: boolean;
    collectAnalytics: boolean;
    notifyOnInteraction: boolean;
  };
  metadata: Record<string, unknown>;
  placementId: string;
  placementPath: string;
  creatorId: string;
  spaceId: string | null;
  profileId: string | null;
  campusId: string;
  // Hackability Governance Layer
  capabilities: ToolCapabilities;
  budgets: ToolBudgets;
  capabilityLane: "safe" | "scoped" | "power";
  experimental: boolean;
  // P0: Surface Modes
  surfaceModes: SurfaceModes;
  primarySurface: "widget" | "app";
  appConfig?: AppConfig;
  // P0: Versioning
  toolVersion: string;
  // P0: Provenance
  provenance: {
    creatorId: string;
    forkedFrom?: string;
    lineage: string[];
    createdAt: string;
    trustTier: TrustTier;
  };
};

function resolvePermissions(
  permissions: DeployToolInput["permissions"],
): DeploymentRecord["permissions"] {
  return {
    canInteract: permissions?.canInteract ?? true,
    canView: permissions?.canView ?? true,
    canEdit: permissions?.canEdit ?? false,
    allowedRoles:
      permissions?.allowedRoles ??
      ["member", "moderator", "admin", "builder"],
  };
}

function resolveSettings(
  settings: DeployToolInput["settings"],
): DeploymentRecord["settings"] {
  return {
    showInDirectory: settings?.showInDirectory ?? true,
    allowSharing: settings?.allowSharing ?? true,
    collectAnalytics: settings?.collectAnalytics ?? true,
    notifyOnInteraction: settings?.notifyOnInteraction ?? false,
  };
}

/**
 * Resolve capabilities from input, defaulting to SAFE preset.
 * Lane 1 (SAFE) is the default for all deployments.
 */
function resolveCapabilities(
  capabilities: DeployToolInput["capabilities"],
): ToolCapabilities {
  return {
    // Always true - core tool functionality
    read_own_state: true,
    write_own_state: true,
    // Lane 2 - Scoped (default to false, opt-in)
    read_space_context: capabilities?.read_space_context ?? false,
    read_space_members: capabilities?.read_space_members ?? false,
    write_shared_state: capabilities?.write_shared_state ?? true, // Allow for polls/RSVPs
    // Lane 3 - Power (default to false, explicitly gated)
    create_posts: capabilities?.create_posts ?? false,
    send_notifications: capabilities?.send_notifications ?? false,
    trigger_automations: capabilities?.trigger_automations ?? false,
    // Lane 4 - Objects (default to false, type-specific)
    objects_read: capabilities?.objects_read ?? false,
    objects_write: capabilities?.objects_write ?? false,
    objects_delete: capabilities?.objects_delete ?? false,
  };
}

/**
 * P0: Resolve surface modes from input, with tool support validation.
 */
function resolveSurfaceModes(
  input: DeployToolInput["surfaceModes"],
  toolSupportedSurfaces?: { widget?: boolean; app?: boolean },
): SurfaceModes {
  const requested = input ?? DEFAULT_SURFACE_MODES;
  const supported = toolSupportedSurfaces ?? { widget: true, app: false };

  return {
    widget: requested.widget && (supported.widget ?? true),
    app: requested.app && (supported.app ?? false),
  };
}

/**
 * P0: Resolve app config from input.
 */
function resolveAppConfig(
  input: DeployToolInput["appConfig"],
  toolDefaults?: Partial<AppConfig>,
): AppConfig {
  return {
    layout: input?.layout ?? toolDefaults?.layout ?? DEFAULT_APP_CONFIG.layout,
    showWidgetWhenActive: input?.showWidgetWhenActive ?? toolDefaults?.showWidgetWhenActive ?? DEFAULT_APP_CONFIG.showWidgetWhenActive,
    breadcrumbLabel: input?.breadcrumbLabel,
  };
}

/**
 * P0: Build provenance for a deployment.
 */
function buildProvenance(
  toolData: FirebaseFirestore.DocumentData,
  userId: string,
  timestamp: Date,
): DeploymentRecord["provenance"] {
  const toolProvenance = toolData.provenance || {};
  return {
    creatorId: toolProvenance.creatorId || toolData.ownerId || userId,
    forkedFrom: toolProvenance.forkedFrom,
    lineage: toolProvenance.lineage || [],
    createdAt: timestamp.toISOString(),
    trustTier: toolProvenance.trustTier || "unverified",
  };
}

/**
 * P0: Validate surface modes against tool's supported surfaces.
 */
function validateSurfaceModes(
  requested: DeployToolInput["surfaceModes"],
  toolSupportedSurfaces?: { widget?: boolean; app?: boolean },
): { ok: boolean; error?: string } {
  if (!requested) return { ok: true };

  const supported = toolSupportedSurfaces ?? { widget: true, app: false };

  if (requested.app && !supported.app) {
    return { ok: false, error: "This tool does not support app surface" };
  }
  if (requested.widget && !supported.widget) {
    return { ok: false, error: "This tool does not support widget surface" };
  }
  if (!requested.widget && !requested.app) {
    return { ok: false, error: "At least one surface mode must be enabled" };
  }

  return { ok: true };
}

/**
 * Resolve budgets from input, using lane-appropriate defaults.
 */
function resolveBudgets(
  budgets: DeployToolInput["budgets"],
  capabilities: ToolCapabilities,
): ToolBudgets {
  const defaults = getDefaultBudgets(capabilities);
  return {
    notificationsPerDay: budgets?.notificationsPerDay ?? defaults.notificationsPerDay,
    postsPerDay: budgets?.postsPerDay ?? defaults.postsPerDay,
    automationsPerDay: budgets?.automationsPerDay ?? defaults.automationsPerDay,
    executionsPerUserPerHour: budgets?.executionsPerUserPerHour ?? defaults.executionsPerUserPerHour,
  };
}

// Space-tier element IDs that require isSpaceLeader
const SPACE_TIER_ELEMENTS = [
  'member-list',
  'member-selector',
  'space-events',
  'space-feed',
  'space-stats',
  'announcement',
  'role-gate',
];

/**
 * Check if tool composition contains space-tier elements
 */
function compositionHasSpaceElements(toolData: FirebaseFirestore.DocumentData): boolean {
  const elements = toolData.composition?.elements || toolData.elements || [];
  return elements.some((el: { elementId?: string }) =>
    SPACE_TIER_ELEMENTS.includes(el.elementId || '')
  );
}

async function ensureToolIsDeployable(toolId: string, userId: string) {
  const toolDoc = await dbAdmin.collection("tools").doc(toolId).get();
  if (!toolDoc.exists) {
    return {
      ok: false as const,
      status: 404,
      message: "Tool not found",
    };
  }

  const toolData = toolDoc.data();
  if (!toolData) {
    return {
      ok: false as const,
      status: 404,
      message: "Tool data missing",
    };
  }

  if (toolData.campusId && toolData.campusId !== CURRENT_CAMPUS_ID) {
    return {
      ok: false as const,
      status: 403,
      message: "Access denied for this campus",
    };
  }

  if (toolData.ownerId !== userId && toolData.status !== "published") {
    return {
      ok: false as const,
      status: 403,
      message: "Tool not available for deployment",
    };
  }

  return { ok: true as const, toolDoc, toolData };
}

async function ensureSpaceDeploymentAllowed(spaceId: string, userId: string) {
  const spaceDoc = await dbAdmin.collection("spaces").doc(spaceId).get();
  if (!spaceDoc.exists) {
    return {
      ok: false as const,
      status: 404,
      message: "Space not found",
    };
  }

  const spaceData = spaceDoc.data();
  if (spaceData?.campusId && spaceData.campusId !== CURRENT_CAMPUS_ID) {
    return {
      ok: false as const,
      status: 403,
      message: "Access denied for this campus",
    };
  }

  const userRole = spaceData?.members?.[userId]?.role;
  if (!userRole || !["builder", "admin", "moderator"].includes(userRole)) {
    return {
      ok: false as const,
      status: 403,
      message: "Insufficient permissions to deploy tools",
    };
  }

  return { ok: true as const, spaceData };
}

async function ensureNoExistingDeployment(
  input: DeployToolInput,
): Promise<boolean> {
  const existingSnapshot = await dbAdmin
    .collection("deployedTools")
    .where("toolId", "==", input.toolId)
    .where("deployedTo", "==", input.deployTo)
    .where("targetId", "==", input.targetId)
    .where("campusId", "==", CURRENT_CAMPUS_ID)
    .where("status", "in", ["active", "paused"])
    .limit(1)
    .get();

  return existingSnapshot.empty;
}

async function enforceSpaceLimit(spaceId: string) {
  const snapshot = await dbAdmin
    .collection("deployedTools")
    .where("deployedTo", "==", "space")
    .where("targetId", "==", spaceId)
    .where("campusId", "==", CURRENT_CAMPUS_ID)
    .where("status", "==", "active")
    .get();

  if (snapshot.size >= 20) {
    return {
      ok: false as const,
      status: 409,
      message: "Space has reached maximum tool limit (20)",
    };
  }

  return { ok: true as const };
}

async function getNextPosition(
  deployedTo: "profile" | "space",
  targetId: string,
  surface?: string,
) {
  try {
    let query = dbAdmin
      .collection("deployedTools")
      .where("deployedTo", "==", deployedTo)
      .where("targetId", "==", targetId)
      .where("campusId", "==", CURRENT_CAMPUS_ID)
      .where("status", "==", "active");

    if (surface) {
      query = query.where("surface", "==", surface);
    }

    const snapshot = await query.get();
    return snapshot.size;
  } catch (error) {
    logger.error(
      "Error determining deployment order",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return 0;
  }
}

async function canUserAccessDeployment(
  userId: string,
  deployment: FirebaseFirestore.DocumentData,
) {
  if (deployment.campusId && deployment.campusId !== CURRENT_CAMPUS_ID) {
    return false;
  }

  if (
    deployment.deployedTo === "profile" &&
    deployment.targetId === userId
  ) {
    return true;
  }

  if (deployment.deployedBy === userId) {
    return true;
  }

  if (deployment.deployedTo === "space") {
    const spaceDoc = await dbAdmin
      .collection("spaces")
      .doc(deployment.targetId)
      .get();
    if (!spaceDoc.exists) {
      return false;
    }
    const spaceData = spaceDoc.data();
    if (spaceData?.campusId && spaceData.campusId !== CURRENT_CAMPUS_ID) {
      return false;
    }
    const userRole = spaceData?.members?.[userId]?.role;
    return deployment.permissions?.allowedRoles?.includes(userRole) ?? false;
  }

  return false;
}

export const POST = withAuthValidationAndErrors(
  DeployToolSchema,
  async (
    request,
    _context: {},
    payload: DeployToolInput,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);

    logger.info("Deploying tool", {
      toolId: payload.toolId,
      deployTo: payload.deployTo,
      targetId: payload.targetId,
      userUid: userId,
    });

    const toolResult = await ensureToolIsDeployable(payload.toolId, userId);
    if (!toolResult.ok) {
      return respond.error(toolResult.message, "FORBIDDEN", {
        status: toolResult.status,
      });
    }

    // Validate composition - space-tier elements require space deployment
    const hasSpaceElements = compositionHasSpaceElements(toolResult.toolData);
    if (hasSpaceElements) {
      if (payload.deployTo === "profile") {
        return respond.error(
          "This tool contains space-tier elements and can only be deployed to spaces",
          "FORBIDDEN",
          { status: 403 },
        );
      }
      // For space deployment, we'll verify user is leader/admin in ensureSpaceDeploymentAllowed
    }

    if (payload.deployTo === "profile" && payload.targetId !== userId) {
      return respond.error(
        "Can only deploy tools to your own profile",
        "FORBIDDEN",
        { status: 403 },
      );
    }

    if (payload.deployTo === "space") {
      const spaceValidation = await ensureSpaceDeploymentAllowed(
        payload.targetId,
        userId,
      );
      if (!spaceValidation.ok) {
        return respond.error(spaceValidation.message, "FORBIDDEN", {
          status: spaceValidation.status,
        });
      }

      if (payload.surface && !SurfaceSchema.options.includes(payload.surface)) {
        return respond.error("Invalid surface", "INVALID_INPUT", {
          status: 400,
        });
      }

      const limitCheck = await enforceSpaceLimit(payload.targetId);
      if (!limitCheck.ok) {
        return respond.error(limitCheck.message, "CONFLICT", {
          status: limitCheck.status,
        });
      }
    }

    const uniqueDeployment = await ensureNoExistingDeployment(payload);
    if (!uniqueDeployment) {
      return respond.error(
        "Tool already deployed to this target",
        "CONFLICT",
        { status: 409 },
      );
    }

    // P0: Validate surface modes against tool's supported surfaces
    const surfaceValidation = validateSurfaceModes(
      payload.surfaceModes,
      toolResult.toolData.supportedSurfaces,
    );
    if (!surfaceValidation.ok) {
      return respond.error(surfaceValidation.error!, "INVALID_INPUT", {
        status: 400,
      });
    }

    // P0: Validate capability request against trust tier
    const toolTrustTier: TrustTier = toolResult.toolData.provenance?.trustTier || "unverified";
    const capabilityValidation = validateCapabilityRequest(
      payload.capabilities || {},
      toolTrustTier,
    );
    if (!capabilityValidation.valid) {
      return respond.error(
        `Capability validation failed: ${capabilityValidation.errors.join(", ")}`,
        "FORBIDDEN",
        { status: 403 },
      );
    }

    const timestamp = new Date();
    const resolvedSurface =
      payload.surface ??
      (payload.deployTo === "space" ? ("tools" as const) : undefined);
    const permissions = resolvePermissions(payload.permissions);
    const settings = resolveSettings(payload.settings);
    const capabilities = resolveCapabilities(payload.capabilities);
    const capabilityLane = getCapabilityLane(capabilities);
    const budgets = resolveBudgets(payload.budgets, capabilities);
    const experimental = payload.experimental ?? false;
    // P0: Resolve surface modes, app config, and provenance
    const surfaceModes = resolveSurfaceModes(
      payload.surfaceModes,
      toolResult.toolData.supportedSurfaces,
    );
    const primarySurface = payload.primarySurface ??
      (surfaceModes.app && !surfaceModes.widget ? "app" : "widget");
    const appConfig = surfaceModes.app
      ? resolveAppConfig(payload.appConfig, toolResult.toolData.appDefaults)
      : undefined;
    const toolVersion = toolResult.toolData.currentVersion || "1.0.0";
    const provenance = buildProvenance(toolResult.toolData, userId, timestamp);
    const position = await getNextPosition(
      payload.deployTo,
      payload.targetId,
      resolvedSurface,
    );

    const placementTargetType =
      payload.deployTo === "space" ? ("space" as const) : ("profile" as const);

    // Build IDs for transactional writes
    const deploymentId = `deployment_${Date.now()}`;
    const placementId = buildPlacementCompositeId(deploymentId, payload.toolId);
    const compositeId = buildPlacementCompositeId(
      placementTargetType,
      payload.targetId
    );

    // Build placement document path
    const placementRef = placementTargetType === "space"
      ? dbAdmin.collection("spaces").doc(payload.targetId).collection("placed_tools").doc(placementId)
      : dbAdmin.collection("users").doc(payload.targetId).collection("placed_tools").doc(placementId);
    const placementPath = placementTargetType === "space"
      ? `spaces/${payload.targetId}/placed_tools/${placementId}`
      : `users/${payload.targetId}/placed_tools/${placementId}`;

    const deploymentDoc: DeploymentRecord = {
      id: compositeId,
      toolId: payload.toolId,
      deployedBy: userId,
      deployedTo: payload.deployTo,
      targetType: placementTargetType,
      targetId: payload.targetId,
      surface: resolvedSurface,
      position,
      config: payload.config ?? {},
      permissions,
      status: "active",
      deployedAt: timestamp.toISOString(),
      usageCount: 0,
      settings,
      metadata: {
        toolName: toolResult.toolData.name,
        toolVersion: toolResult.toolData.currentVersion,
      },
      placementId: placementId,
      placementPath: placementPath,
      creatorId: userId,
      spaceId: placementTargetType === "space" ? payload.targetId : null,
      profileId: placementTargetType === "profile" ? payload.targetId : null,
      campusId: CURRENT_CAMPUS_ID,
      // Hackability Governance Layer
      capabilities,
      budgets,
      capabilityLane,
      experimental,
      // P0: Surface Modes & Provenance
      surfaceModes,
      primarySurface,
      appConfig,
      toolVersion,
      provenance,
    };

    // Execute all writes in a single transaction for atomicity
    await dbAdmin.runTransaction(async (transaction) => {
      // 1. Create placement document in space/profile subcollection
      transaction.set(placementRef, {
        toolId: payload.toolId,
        placement: "sidebar",
        order: position,
        isActive: true,
        source: "leader",
        placedBy: userId,
        placedAt: admin.firestore.FieldValue.serverTimestamp(),
        configOverrides: payload.config ?? {},
        visibility: "all",
        titleOverride: null,
        isEditable: true,
        state: {},
        stateUpdatedAt: null,
        campusId: CURRENT_CAMPUS_ID,
        deploymentId: deploymentId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Create deployment record in deployedTools collection
      const deployedToolRef = dbAdmin.collection("deployedTools").doc(compositeId);
      transaction.set(deployedToolRef, deploymentDoc);

      // 3. Update tool deployment count
      const toolRef = dbAdmin.collection("tools").doc(payload.toolId);
      transaction.update(toolRef, {
        deploymentCount: admin.firestore.FieldValue.increment(1),
        lastDeployedAt: timestamp.toISOString(),
      });
    });

    // Analytics event is non-critical, can be outside transaction
    await dbAdmin.collection("analytics_events").add({
      eventType: "tool_deployed",
      userId,
      toolId: payload.toolId,
      campusId: CURRENT_CAMPUS_ID,
      spaceId: payload.deployTo === "space" ? payload.targetId : null,
      timestamp: timestamp.toISOString(),
      metadata: {
        deploymentId: compositeId,
        deployedTo: payload.deployTo,
        surface: resolvedSurface ?? null,
      },
    });

    // Notify space members about tool deployment (only for space deployments)
    if (payload.deployTo === "space") {
      try {
        // Get deployer's name
        const userDoc = await dbAdmin.collection("users").doc(userId).get();
        const deployerName = userDoc.data()?.fullName || "Someone";

        // Get space name and members
        const spaceDoc = await dbAdmin.collection("spaces").doc(payload.targetId).get();
        const spaceData = spaceDoc.data();
        const spaceName = spaceData?.name || "a space";

        // Get active space members
        const membersSnapshot = await dbAdmin.collection("spaceMembers")
          .where("spaceId", "==", payload.targetId)
          .where("campusId", "==", CURRENT_CAMPUS_ID)
          .where("isActive", "==", true)
          .get();

        const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);

        if (memberIds.length > 0) {
          await notifyToolDeployment({
            memberIds,
            deployerId: userId,
            deployerName,
            toolId: payload.toolId,
            toolName: toolResult.toolData.name,
            spaceId: payload.targetId,
            spaceName,
          });
        }
      } catch (notifyError) {
        // Don't fail deployment if notification fails
        logger.warn("Failed to send tool deployment notifications", {
          error: notifyError instanceof Error ? notifyError.message : String(notifyError),
          toolId: payload.toolId,
          spaceId: payload.targetId,
        });
      }
    }

    return respond.created(
      {
        deployment: deploymentDoc,
        message: "Tool deployed successfully",
      },
      { message: "Tool deployed successfully" },
    );
  },
);

export const GET = withAuthAndErrors(async (
  request,
  _context,
  respond,
) => {
  try {
    const userId = getUserId(request as AuthenticatedRequest);
    const searchParams = new URL(request.url).searchParams;
    const deployedTo = searchParams.get("deployedTo");
    const targetId = searchParams.get("targetId");
    const surface = searchParams.get("surface");
    const status = searchParams.get("status") ?? "active";

    let deploymentsQuery = dbAdmin
      .collection("deployedTools")
      .where("campusId", "==", CURRENT_CAMPUS_ID);

    if (deployedTo) {
      deploymentsQuery = deploymentsQuery.where("deployedTo", "==", deployedTo);
    }
    if (targetId) {
      deploymentsQuery = deploymentsQuery.where("targetId", "==", targetId);
    }
    if (surface) {
      deploymentsQuery = deploymentsQuery.where("surface", "==", surface);
    }
    deploymentsQuery = deploymentsQuery.where("status", "==", status);

    const snapshot = await deploymentsQuery.get();
    const deployments = [];

    for (const doc of snapshot.docs) {
      const deploymentData = doc.data();
      if (!(await canUserAccessDeployment(userId, deploymentData))) {
        continue;
      }

      const toolId = deploymentData.toolId as string | undefined;
      if (!toolId) continue;

      const toolDoc = await dbAdmin.collection("tools").doc(toolId).get();
      if (!toolDoc.exists) continue;

      const toolData = toolDoc.data();
      if (toolData?.campusId && toolData.campusId !== CURRENT_CAMPUS_ID) {
        continue;
      }

      deployments.push({
        id: doc.id,
        ...deploymentData,
        toolData: {
          id: toolDoc.id,
          name: toolData?.name,
          description: toolData?.description,
          currentVersion: toolData?.currentVersion,
          elements: toolData?.elements,
        },
      });
    }

    return respond.success({
      deployments,
      count: deployments.length,
    });
  } catch (error) {
    logger.error(
      "Error fetching deployed tools",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error("Failed to fetch deployed tools", "INTERNAL_ERROR", {
      status: 500,
    });
  }
});
