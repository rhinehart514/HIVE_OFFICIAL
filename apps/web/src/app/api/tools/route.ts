import { z } from "zod";
import { dbAdmin as adminDb } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { withAuthAndErrors, withAuthValidationAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { ToolSchema, createToolDefaults as coreCreateToolDefaults, type PlacementTargetType } from "@hive/core";
import { createPlacementDocument, buildPlacementCompositeId } from "@/lib/tool-placement";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { rateLimit } from "@/lib/rate-limit";
import { validateToolContext } from "@hive/core/infrastructure/api/validate-tool-context";
import * as admin from "firebase-admin";

// Define tool schemas locally (not in core package)
const CreateToolSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  type: z.enum(['template', 'visual', 'code', 'wizard']).default('visual'),
  status: z.enum(['draft', 'preview', 'published']).default('draft'),
  config: z.unknown().optional(),
});

const _localToolDefaults = {
  status: 'draft' as const,
  type: 'visual' as const,
  config: {},
};

// Rate limiting: 10 tool creations per hour per user
const createToolLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 requests per hour
});

// GET /api/tools - List user's tools
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  logger.info('[tools] GET request received', {
    userId,
    endpoint: '/api/tools'
  });

  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("spaceId");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Build query
    let query = adminDb
      .collection("tools")
      .where("campusId", "==", CURRENT_CAMPUS_ID)  // campusId first to match index
      .where("ownerId", "==", userId)
      .orderBy("updatedAt", "desc");

    // Filter by space if provided
    if (spaceId) {
      query = query.where("spaceId", "==", spaceId);
    }

    // Filter by status if provided
    if (status && ["draft", "preview", "published"].includes(status)) {
      query = query.where("status", "==", status);
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();
    const tools = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get total count for pagination
    const countQuery = adminDb.collection("tools")
      .where("campusId", "==", CURRENT_CAMPUS_ID)
      .where("ownerId", "==", userId);
    const countSnapshot = await countQuery.count().get();
    const total = countSnapshot.data().count;

    logger.info('[tools] GET successful', {
      userId,
      count: tools.length,
      total,
      endpoint: '/api/tools'
    });

    return respond.success({
      tools,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    });
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('[tools] GET failed', {
      userId,
      code: errorCode,
      message: errorMessage,
      endpoint: '/api/tools'
    });

    // Return specific error for missing index (code 9 = FAILED_PRECONDITION in Firestore)
    if (errorCode === '9' || errorMessage.includes('index')) {
      return respond.error('Database index not ready. Please try again in a few minutes.', "INTERNAL_ERROR", { status: 503 });
    }

    return respond.error('Failed to fetch tools', "INTERNAL_ERROR", { status: 500 });
  }
});

// Enhanced schema to support template-based creation
const EnhancedCreateToolSchema = CreateToolSchema.extend({
  templateId: z.string().optional(),
  type: z.enum(['template', 'visual', 'code', 'wizard']).default('visual'),
  config: z.unknown().optional(), // Allow any config for flexibility
  elements: z.array(z.unknown()).optional(), // Add elements support
  // P0: Support connections for cascade execution
  connections: z.array(z.object({
    id: z.string(),
    sourceElementId: z.string(),
    sourceOutput: z.string(),
    targetElementId: z.string(),
    targetInput: z.string(),
    transform: z.string().optional(),
  })).optional(),
  // Context Gatekeeping: Original context fields
  contextType: z.enum(['space', 'profile', 'feed']).optional(),
  contextId: z.string().optional(),
  contextName: z.string().optional(),
});

// POST /api/tools - Create new tool (supports templates)
export const POST = withAuthValidationAndErrors(
  EnhancedCreateToolSchema,
  async (request, context, validatedData: Record<string, unknown>, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);

    // Rate limiting
    try {
      await createToolLimiter.check(userId); // Check rate limit for this user
    } catch {
      return respond.error("Too many tool creations. Please try again later.", "UNKNOWN_ERROR", { status: 429 });
    }

    logger.info('🔨 Creating tool for user', { userUid: userId, endpoint: '/api/tools'  });

    // Context Gatekeeping: Validate tool context if provided
    let validatedContext: { type: 'space' | 'profile' | 'feed'; id: string; name: string } | undefined;

    if (validatedData.contextType) {
      const contextValidation = await validateToolContext(
        validatedData.contextType as string,
        validatedData.contextId as string | undefined,
        userId,
        adminDb
      );

      if (!contextValidation.valid) {
        logger.warn('Context validation failed', {
          userId,
          contextType: validatedData.contextType,
          error: contextValidation.error,
        });
        return respond.error(
          contextValidation.error || 'Invalid context',
          "FORBIDDEN",
          { status: contextValidation.error?.includes('Not authorized') ? 403 : 400 }
        );
      }

      validatedContext = contextValidation.context;
      logger.info('Context validated successfully', {
        userId,
        context: validatedContext,
      });
    }

    // Legacy: If creating a space tool (old system), verify user has builder permissions
    const spaceIdStr = typeof validatedData.spaceId === 'string' ? validatedData.spaceId : null;
    if (validatedData.isSpaceTool && spaceIdStr) {
      const spaceDoc = await adminDb
        .collection("spaces")
        .doc(spaceIdStr)
        .get();
      if (!spaceDoc.exists) {
        return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }

      const spaceData = spaceDoc.data();
      const userRole = spaceData?.members?.[userId]?.role;

      if (!["builder", "admin"].includes(userRole)) {
        return respond.error("Insufficient permissions to create tools in this space", "FORBIDDEN", { status: 403 });
      }
    }

    // Handle template-based creation
    let templateElements = [];
    let templateConfig = {};
    const templateIdStr = typeof validatedData.templateId === 'string' ? validatedData.templateId : null;
    if (templateIdStr) {
      try {
        const templateDoc = await adminDb
          .collection("tool_templates")
          .doc(templateIdStr)
          .get();
        
        if (templateDoc.exists) {
          const templateData = templateDoc.data();
          templateElements = templateData?.elements || [];
          templateConfig = templateData?.config || {};
        }
      } catch (error) {
        logger.warn(
      `Failed to load template at /api/tools`,
      { error: error instanceof Error ? error.message : String(error) }
    );
        // Continue without template
      }
    }

    // Create tool document
    const toolData = { ...coreCreateToolDefaults(), ownerId: userId, ...validatedData } as Record<string, unknown>;
    const now = new Date();

    const tool = {
      ...toolData,
      campusId: CURRENT_CAMPUS_ID,
      // Use client-provided elements when present; otherwise fall back to template
      elements: validatedData.elements && Array.isArray(validatedData.elements)
        ? validatedData.elements
        : templateElements,
      // P0: Save connections for cascade execution
      connections: validatedData.connections && Array.isArray(validatedData.connections)
        ? validatedData.connections
        : [],
      config: { ...(toolData.config || {}), ...templateConfig, ...(validatedData.config || {}) }, // Merge configs
      metadata: {
        ...(toolData.metadata as Record<string, unknown> || {}),
        templateId: validatedData.templateId,
        toolType: validatedData.type,
      },
      createdAt: now,
      updatedAt: now,
      // P0: Tool Provenance (Hackability Governance Layer)
      provenance: {
        creatorId: userId,
        createdAt: now.toISOString(),
        forkedFrom: templateIdStr || undefined,
        lineage: templateIdStr ? [templateIdStr] : [],
        forkCount: 0,
        deploymentCount: 0,
        trustTier: "unverified" as const,
      },
      // P0: Surface modes - tools default to widget only, must opt-in to app
      supportedSurfaces: {
        widget: true,
        app: false,
      },
      recommendedSurface: "widget" as const,
      // P0: Required capabilities for this tool
      requiredCapabilities: {
        read_own_state: true as const,
        write_own_state: true as const,
        write_shared_state: true,
      },
      // Context Gatekeeping: Store original context
      originalContext: validatedContext ? {
        type: validatedContext.type,
        id: validatedContext.id,
        name: validatedContext.name,
        createdAt: now,
      } : null,
    };

    // Validate the complete tool object
    const validatedTool = ToolSchema.parse(tool);

    // Save to Firestore
    const toolRef = await adminDb.collection("tools").add(validatedTool);

    // Create initial version
    const initialVersion = {
      version: "1.0.0",
      changelog: validatedData.templateId ? `Created from template ${validatedData.templateId}` : "Initial version",
      createdAt: now,
      createdBy: userId,
      isStable: false,
    };

    await toolRef.collection("versions").doc("1.0.0").set(initialVersion);

    if (spaceIdStr && spaceIdStr !== 'personal') {
      try {
        const placementRecord = {
          toolId: toolRef.id,
          targetType: 'space' as PlacementTargetType,
          targetId: spaceIdStr,
          surface: 'tools',
          status: 'draft',
          position: 0,
          config: {},
          permissions: {
            canInteract: true,
            canView: true,
            canEdit: false,
            allowedRoles: ['builder', 'moderator', 'admin', 'member'],
          },
          settings: {
            showInDirectory: true,
            allowSharing: true,
            collectAnalytics: true,
            notifyOnInteraction: false,
          },
          createdAt: now,
          createdBy: userId,
          updatedAt: now,
          usageCount: 0,
          metadata: {
            createdFrom: 'tool_builder',
          },
        };

        const placement = await createPlacementDocument({
          deployedTo: 'space',
          targetId: spaceIdStr,
          toolId: toolRef.id,
          deploymentId: `tool_${Date.now()}`,
          placedBy: userId,
          campusId: CURRENT_CAMPUS_ID,
          placement: 'sidebar',
          visibility: 'all',
          configOverrides: placementRecord.config,
        });
        const compositeId = buildPlacementCompositeId('space', spaceIdStr);

        await adminDb.collection('deployedTools').doc(compositeId).set({
          toolId: toolRef.id,
          deployedBy: userId,
          deployedTo: 'space',
          targetId: spaceIdStr,
          surface: 'tools',
          permissions: placementRecord.permissions,
          status: 'draft',
          deployedAt: now.toISOString(),
          usageCount: 0,
          settings: placementRecord.settings,
          placementPath: placement.path,
          placementId: placement.id,
          targetType: 'space',
          creatorId: userId,
          spaceId: spaceIdStr,
          profileId: null,
          campusId: CURRENT_CAMPUS_ID,
          // P0: Capabilities (default safe lane)
          capabilities: {
            read_own_state: true,
            write_own_state: true,
            read_space_context: false,
            read_space_members: false,
            write_shared_state: true,
            create_posts: false,
            send_notifications: false,
            trigger_automations: false,
            objects_read: false,
            objects_write: false,
            objects_delete: false,
          },
          budgets: {
            notificationsPerDay: 0,
            postsPerDay: 0,
            automationsPerDay: 0,
            executionsPerUserPerHour: 100,
          },
          capabilityLane: 'safe',
          experimental: false,
          // P0: Surface modes
          surfaceModes: {
            widget: true,
            app: false,
          },
          primarySurface: 'widget',
          toolVersion: '1.0.0',
          // P0: Provenance
          provenance: {
            creatorId: userId,
            createdAt: now.toISOString(),
            lineage: [],
            trustTier: 'unverified',
          },
        });
      } catch (error) {
        logger.warn(
          `Failed to create placement for tool at /api/tools`,
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    }

    // Update user's tool count
    try {
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const currentStats = userDoc.data()?.stats || {};
      
      await userRef.update({
        'stats.toolsCreated': (currentStats.toolsCreated || 0) + 1,
        updatedAt: now
      });
    } catch (error) {
      logger.warn(
      `Failed to update user stats at /api/tools`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    }

    // Track analytics event
    await adminDb.collection("analytics_events").add({
      eventType: "tool_created",
      userId: userId,
      toolId: toolRef.id,
      spaceId: spaceIdStr || null,
      isSpaceTool: !!validatedData.isSpaceTool,
      timestamp: now,
      metadata: {
        toolName: validatedData.name,
        toolType: validatedData.type,
        hasDescription: !!validatedData.description,
        hasTemplate: !!validatedData.templateId,
        templateId: validatedData.templateId,
      } });

    const createdTool = {
      ...validatedTool,
      id: toolRef.id,
    };

    logger.info('✅ Successfully created tool', { toolRefId: toolRef.id, endpoint: '/api/tools'  });

    return respond.success({
      tool: createdTool,
      message: `Tool "${validatedData.name}" created successfully`,
    }, { status: 201 });
  }
);

// Schema for tool update requests
const UpdateToolSchema = z.object({
  toolId: z.string().min(1, 'Tool ID is required'),
}).extend(EnhancedCreateToolSchema.partial().shape);

// PUT /api/tools - Update existing tool
export const PUT = withAuthValidationAndErrors(
  UpdateToolSchema,
  async (request, context, validatedData: Record<string, unknown>, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const { toolId: rawToolId, ...updateData } = validatedData;
    const toolId = typeof rawToolId === 'string' ? rawToolId : '';

    logger.info('🔨 Updating tool for user', { toolId, userId, endpoint: '/api/tools' });

    if (!toolId) {
      return respond.error("Tool ID is required", "VALIDATION_ERROR", { status: 400 });
    }

    // Get existing tool
    const toolDoc = await adminDb.collection("tools").doc(toolId).get();
    if (!toolDoc.exists) {
      return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const existingTool = toolDoc.data();

    // Check ownership
    if (existingTool?.ownerId !== userId) {
      return respond.error("Not authorized to update this tool", "FORBIDDEN", { status: 403 });
    }

    const now = new Date();

    // Context Gatekeeping: Preserve originalContext (cannot be changed after creation)
    // Remove context fields from updateData to prevent modification
    const { contextType, contextId, contextName, ...safeUpdateData } = updateData;

    const updatedTool = {
      ...existingTool,
      ...safeUpdateData,
      updatedAt: now,
      // Explicitly preserve originalContext from existing tool
      originalContext: existingTool?.originalContext || null,
    };

    // Update the tool
    await adminDb.collection("tools").doc(toolId).update(updatedTool);

    // Create new version if elements changed
    if (updateData.elements && JSON.stringify(updateData.elements) !== JSON.stringify(existingTool?.elements)) {
      const versionNumber = `1.${Date.now()}`;
      const newVersion = {
        version: versionNumber,
        changelog: "Tool updated via builder",
        createdAt: now,
        createdBy: userId,
        isStable: false,
      };

      await adminDb.collection("tools").doc(toolId).collection("versions").doc(versionNumber).set(newVersion);
    }

    // Track analytics event
    await adminDb.collection("analytics_events").add({
      eventType: "tool_updated",
      userId: userId,
      toolId: toolId,
      timestamp: now,
      metadata: {
        fieldsUpdated: Object.keys(updateData),
        hasElementsChange: !!updateData.elements,
      } });

    const result = {
      ...updatedTool,
      id: toolId,
    };

    logger.info('✅ Successfully updated tool', { toolId, endpoint: '/api/tools' });

    return respond.success({
      tool: result,
      message: `Tool "${(updatedTool as Record<string, unknown>).name || 'Tool'}" updated successfully`
    });
  }
);
