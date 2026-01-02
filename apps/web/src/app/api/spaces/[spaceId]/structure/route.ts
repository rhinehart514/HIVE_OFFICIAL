import { z } from "zod";
import {
  getServerSpaceRepository,
  createServerSpaceManagementService,
  type EnhancedSpace,
  type PlacedToolDTO,
} from "@hive/core/server";
import type { PlacedTool } from "@hive/core";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";

/**
 * Space Structure API - Phase 5: DDD Foundation (HiveLab-Ready)
 *
 * GET   /api/spaces/[spaceId]/structure - Get complete space structure
 * PATCH /api/spaces/[spaceId]/structure - Batch operations for tabs/widgets
 *
 * This endpoint is designed for AI consumption (HiveLab V2):
 * - GET returns full structure with all context AI needs
 * - PATCH accepts batch operations for atomic changes
 */

// ============================================================
// Operation Schemas
// ============================================================

const AddTabOperation = z.object({
  op: z.literal('addTab'),
  data: z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['feed', 'widget', 'resource', 'custom']),
    order: z.number().min(0).optional(),
    isVisible: z.boolean().default(true)
  })
});

const UpdateTabOperation = z.object({
  op: z.literal('updateTab'),
  tabId: z.string(),
  data: z.object({
    name: z.string().min(1).max(50).optional(),
    order: z.number().min(0).optional(),
    isVisible: z.boolean().optional()
  })
});

const RemoveTabOperation = z.object({
  op: z.literal('removeTab'),
  tabId: z.string()
});

const ReorderTabsOperation = z.object({
  op: z.literal('reorderTabs'),
  order: z.array(z.string())
});

const AddWidgetOperation = z.object({
  op: z.literal('addWidget'),
  data: z.object({
    type: z.enum(['calendar', 'poll', 'links', 'files', 'rss', 'custom']),
    title: z.string().min(1).max(100),
    config: z.record(z.any()).default({})
  })
});

const UpdateWidgetOperation = z.object({
  op: z.literal('updateWidget'),
  widgetId: z.string(),
  data: z.object({
    title: z.string().min(1).max(100).optional(),
    config: z.record(z.any()).optional(),
    order: z.number().min(0).optional(),
    isVisible: z.boolean().optional(),
    isEnabled: z.boolean().optional()
  })
});

const RemoveWidgetOperation = z.object({
  op: z.literal('removeWidget'),
  widgetId: z.string()
});

const AttachWidgetOperation = z.object({
  op: z.literal('attachWidget'),
  widgetId: z.string(),
  tabId: z.string()
});

const DetachWidgetOperation = z.object({
  op: z.literal('detachWidget'),
  widgetId: z.string(),
  tabId: z.string()
});

const OperationSchema = z.discriminatedUnion('op', [
  AddTabOperation,
  UpdateTabOperation,
  RemoveTabOperation,
  ReorderTabsOperation,
  AddWidgetOperation,
  UpdateWidgetOperation,
  RemoveWidgetOperation,
  AttachWidgetOperation,
  DetachWidgetOperation
]);

const PatchStructureSchema = z.object({
  version: z.number().optional(), // For optimistic locking (future)
  operations: z.array(OperationSchema).min(1).max(50) // Limit batch size
});

// ============================================================
// Response Types
// ============================================================

interface StructureResponse {
  spaceId: string;
  tabs: Array<{
    id: string;
    name: string;
    type: string;
    order: number;
    isDefault: boolean;
    isVisible: boolean;
    widgetIds: string[];
  }>;
  widgets: Array<{
    id: string;
    type: string;
    title: string;
    config: Record<string, unknown>;
    order: number;
    isEnabled: boolean;
    isVisible: boolean;
  }>;
  placedTools: PlacedToolDTO[];
  settings: {
    allowRSS: boolean;
  };
  permissions: {
    canEditStructure: boolean;
    canAddTabs: boolean;
    canAddWidgets: boolean;
    canDeployTools: boolean;
  };
}

interface OperationResult {
  op: string;
  success: boolean;
  entityId?: string;
  error?: string;
}

/**
 * Transform PlacedTool entity to DTO
 */
function toPlacedToolDTO(tool: PlacedTool): PlacedToolDTO {
  return {
    id: tool.id,
    toolId: tool.toolId,
    placement: tool.placement,
    order: tool.order,
    isActive: tool.isActive,
    source: tool.source,
    placedBy: tool.placedBy,
    placedAt: tool.placedAt.toISOString(),
    configOverrides: tool.configOverrides,
    visibility: tool.visibility,
    titleOverride: tool.titleOverride,
    isEditable: tool.isEditable,
    state: tool.state,
    stateUpdatedAt: tool.stateUpdatedAt?.toISOString() ?? null,
    toolVersion: tool.toolVersion ?? null,
    isOutdated: tool.isOutdated ?? false,
  };
}

/**
 * Transform space to structure response for AI consumption
 */
function transformToStructure(
  space: EnhancedSpace,
  isLeader: boolean
): StructureResponse {
  return {
    spaceId: space.spaceId.value,
    tabs: space.tabs.map(tab => ({
      id: tab.id,
      name: tab.name,
      type: tab.type,
      order: tab.order,
      isDefault: tab.isDefault,
      isVisible: tab.isVisible,
      widgetIds: tab.widgets
    })),
    widgets: space.widgets.map(widget => ({
      id: widget.id,
      type: widget.type,
      title: widget.title,
      config: widget.config,
      order: widget.order,
      isEnabled: widget.isEnabled,
      isVisible: widget.isVisible
    })),
    placedTools: space.placedTools.map(toPlacedToolDTO),
    settings: {
      allowRSS: space.settings.allowRSS
    },
    permissions: {
      canEditStructure: isLeader,
      canAddTabs: isLeader,
      canAddWidgets: isLeader,
      canDeployTools: isLeader
    }
  };
}

/**
 * GET /api/spaces/[spaceId]/structure - Get complete space structure
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Load space with PlacedTools for complete structure
  const spaceRepo = getServerSpaceRepository();
  const result = await spaceRepo.findById(spaceId, { loadPlacedTools: true });

  if (result.isFailure) {
    return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const space = result.getValue();

  // Enforce campus isolation
  if (space.campusId.id !== campusId) {
    return respond.error("Access denied - campus mismatch", "FORBIDDEN", { status: 403 });
  }

  // Check if user is leader for permissions
  const { ProfileId } = await import("@hive/core");
  const profileIdResult = ProfileId.create(userId);
  const isLeader = profileIdResult.isSuccess
    ? space.isLeader(profileIdResult.getValue())
    : false;

  logger.info(`Structure fetched for space: ${spaceId}`, {
    spaceId,
    tabCount: space.tabs.length,
    widgetCount: space.widgets.length,
    toolCount: space.placedTools.length
  });

  return respond.success(transformToStructure(space, isLeader));
});

/**
 * PATCH /api/spaces/[spaceId]/structure - Batch operations
 *
 * Designed for HiveLab V2:
 * - Accepts array of operations
 * - Executes all in order (stops on first error by default)
 * - Returns full state after operations
 *
 * Example payload:
 * {
 *   "operations": [
 *     { "op": "addWidget", "data": { "type": "links", "title": "Quick Links" } },
 *     { "op": "addWidget", "data": { "type": "files", "title": "Shared Files" } },
 *     { "op": "addTab", "data": { "name": "Resources", "type": "resource" } },
 *     { "op": "attachWidget", "widgetId": "$0", "tabId": "$2" },
 *     { "op": "attachWidget", "widgetId": "$1", "tabId": "$2" }
 *   ]
 * }
 *
 * Note: $N references can be used to refer to entities created in earlier
 * operations within the same batch (where N is the operation index).
 */
type PatchStructureData = z.output<typeof PatchStructureSchema>;

export const PATCH = withAuthValidationAndErrors(
  PatchStructureSchema as z.ZodType<PatchStructureData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: PatchStructureData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Use DDD SpaceManagementService
    const spaceService = createServerSpaceManagementService(
      { userId, campusId }
    );

    // Track results and created entity IDs for reference resolution
    const results: OperationResult[] = [];
    const createdIds: Map<number, string> = new Map();

    // Helper to resolve $N references
    const resolveRef = (value: string): string => {
      if (value.startsWith('$')) {
        const index = parseInt(value.slice(1), 10);
        const resolved = createdIds.get(index);
        if (!resolved) {
          throw new Error(`Invalid reference: ${value} - operation ${index} didn't create an entity`);
        }
        return resolved;
      }
      return value;
    };

    // Execute operations in order
    for (let i = 0; i < data.operations.length; i++) {
      const op = data.operations[i];
      if (!op) continue;

      try {
        switch (op.op) {
          case 'addTab': {
            const result = await spaceService.addTab(userId, {
              spaceId,
              name: op.data.name,
              type: op.data.type,
              order: op.data.order,
              isVisible: op.data.isVisible
            });
            if (result.isFailure) {
              results.push({ op: 'addTab', success: false, error: result.error ?? 'Failed' });
              // Stop on error
              break;
            }
            const tab = result.getValue().data;
            createdIds.set(i, tab.tabId);
            results.push({ op: 'addTab', success: true, entityId: tab.tabId });
            break;
          }

          case 'updateTab': {
            const tabId = resolveRef(op.tabId);
            const result = await spaceService.updateTab(userId, {
              spaceId,
              tabId,
              ...op.data
            });
            if (result.isFailure) {
              results.push({ op: 'updateTab', success: false, error: result.error ?? 'Failed' });
              break;
            }
            results.push({ op: 'updateTab', success: true, entityId: tabId });
            break;
          }

          case 'removeTab': {
            const tabId = resolveRef(op.tabId);
            const result = await spaceService.removeTab(userId, { spaceId, tabId });
            if (result.isFailure) {
              results.push({ op: 'removeTab', success: false, error: result.error ?? 'Failed' });
              break;
            }
            results.push({ op: 'removeTab', success: true, entityId: tabId });
            break;
          }

          case 'reorderTabs': {
            const orderedTabIds = op.order.map(resolveRef);
            const result = await spaceService.reorderTabs(userId, {
              spaceId,
              orderedTabIds
            });
            if (result.isFailure) {
              results.push({ op: 'reorderTabs', success: false, error: result.error ?? 'Failed' });
              break;
            }
            results.push({ op: 'reorderTabs', success: true });
            break;
          }

          case 'addWidget': {
            const result = await spaceService.addWidget(userId, {
              spaceId,
              type: op.data.type,
              title: op.data.title,
              config: op.data.config
            });
            if (result.isFailure) {
              results.push({ op: 'addWidget', success: false, error: result.error ?? 'Failed' });
              break;
            }
            const widget = result.getValue().data;
            createdIds.set(i, widget.widgetId);
            results.push({ op: 'addWidget', success: true, entityId: widget.widgetId });
            break;
          }

          case 'updateWidget': {
            const widgetId = resolveRef(op.widgetId);
            const result = await spaceService.updateWidget(userId, {
              spaceId,
              widgetId,
              ...op.data
            });
            if (result.isFailure) {
              results.push({ op: 'updateWidget', success: false, error: result.error ?? 'Failed' });
              break;
            }
            results.push({ op: 'updateWidget', success: true, entityId: widgetId });
            break;
          }

          case 'removeWidget': {
            const widgetId = resolveRef(op.widgetId);
            const result = await spaceService.removeWidget(userId, { spaceId, widgetId });
            if (result.isFailure) {
              results.push({ op: 'removeWidget', success: false, error: result.error ?? 'Failed' });
              break;
            }
            results.push({ op: 'removeWidget', success: true, entityId: widgetId });
            break;
          }

          case 'attachWidget': {
            const widgetId = resolveRef(op.widgetId);
            const tabId = resolveRef(op.tabId);
            const result = await spaceService.attachWidgetToTab(userId, {
              spaceId,
              widgetId,
              tabId
            });
            if (result.isFailure) {
              results.push({ op: 'attachWidget', success: false, error: result.error ?? 'Failed' });
              break;
            }
            results.push({ op: 'attachWidget', success: true });
            break;
          }

          case 'detachWidget': {
            const widgetId = resolveRef(op.widgetId);
            const tabId = resolveRef(op.tabId);
            const result = await spaceService.detachWidgetFromTab(userId, {
              spaceId,
              widgetId,
              tabId
            });
            if (result.isFailure) {
              results.push({ op: 'detachWidget', success: false, error: result.error ?? 'Failed' });
              break;
            }
            results.push({ op: 'detachWidget', success: true });
            break;
          }
        }

        // Check if last operation failed (stop on error)
        const lastResult = results[results.length - 1];
        if (lastResult && !lastResult.success) {
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ op: op.op, success: false, error: errorMessage });
        break;
      }
    }

    // Fetch final state with PlacedTools
    const spaceRepo = getServerSpaceRepository();
    const finalResult = await spaceRepo.findById(spaceId, { loadPlacedTools: true });

    if (finalResult.isFailure) {
      return respond.error("Failed to fetch updated space", "INTERNAL_ERROR", { status: 500 });
    }

    const space = finalResult.getValue();
    const { ProfileId } = await import("@hive/core");
    const profileIdResult = ProfileId.create(userId);
    const isLeader = profileIdResult.isSuccess
      ? space.isLeader(profileIdResult.getValue())
      : false;

    const appliedCount = results.filter(r => r.success).length;
    const totalCount = data.operations.length;
    const hasErrors = results.some(r => !r.success);

    logger.info(`Structure batch updated: ${spaceId}`, {
      spaceId,
      appliedCount,
      totalCount,
      hasErrors,
      userId
    });

    return respond.success({
      success: !hasErrors,
      data: transformToStructure(space, isLeader),
      operations: {
        applied: appliedCount,
        total: totalCount,
        results
      }
    }, { status: hasErrors ? 207 : 200 }); // 207 Multi-Status if partial success
  }
);
