import { z } from "zod";
import {
  getServerSpaceRepository,
  createServerSpaceManagementService,
} from "@hive/core/server";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { SecurityScanner } from "@/lib/secure-input-validation";

/**
 * Individual Widget CRUD API - Phase 4: DDD Foundation
 *
 * GET    /api/spaces/[spaceId]/widgets/[widgetId] - Get a specific widget
 * PATCH  /api/spaces/[spaceId]/widgets/[widgetId] - Update a widget
 * DELETE /api/spaces/[spaceId]/widgets/[widgetId] - Delete a widget
 */

const UpdateWidgetSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  config: z.record(z.any()).optional(),
  order: z.number().min(0).optional(),
  isVisible: z.boolean().optional(),
  isEnabled: z.boolean().optional()
});

/**
 * GET /api/spaces/[spaceId]/widgets/[widgetId] - Get a specific widget
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; widgetId: string }> },
  respond
) => {
  const { spaceId, widgetId } = await params;
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId || !widgetId) {
    return respond.error("Space ID and Widget ID are required", "INVALID_INPUT", { status: 400 });
  }

  // Use DDD repository
  const spaceRepo = getServerSpaceRepository();
  const result = await spaceRepo.findById(spaceId);

  if (result.isFailure) {
    return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const space = result.getValue();

  // Enforce campus isolation
  if (space.campusId.id !== campusId) {
    return respond.error("Access denied - campus mismatch", "FORBIDDEN", { status: 403 });
  }

  const widget = space.getWidgetById(widgetId);
  if (!widget) {
    return respond.error("Widget not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  return respond.success({
    widget: {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      config: widget.config,
      isVisible: widget.isVisible,
      isEnabled: widget.isEnabled,
      order: widget.order,
      position: widget.position
    }
  });
});

/**
 * PATCH /api/spaces/[spaceId]/widgets/[widgetId] - Update a widget
 */
type UpdateWidgetData = z.infer<typeof UpdateWidgetSchema>;

export const PATCH = withAuthValidationAndErrors(
  UpdateWidgetSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; widgetId: string }> },
    updates: UpdateWidgetData,
    respond
  ) => {
    const { spaceId, widgetId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId || !widgetId) {
      return respond.error("Space ID and Widget ID are required", "INVALID_INPUT", { status: 400 });
    }

    const updateKeys = Object.keys(updates);
    if (updateKeys.length === 0) {
      return respond.error("No updates provided", "INVALID_INPUT", { status: 400 });
    }

    // SECURITY: Scan widget title for XSS/injection attacks
    if (updates.title) {
      const titleScan = SecurityScanner.scanInput(updates.title);
      if (titleScan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in widget title update", {
          userId, spaceId, widgetId, threats: titleScan.threats
        });
        return respond.error("Widget title contains invalid content", "INVALID_INPUT", { status: 400 });
      }
    }

    // Use DDD SpaceManagementService
    const spaceService = createServerSpaceManagementService(
      { userId, campusId }
    );

    const result = await spaceService.updateWidget(userId, {
      spaceId,
      widgetId,
      title: updates.title,
      config: updates.config,
      order: updates.order,
      isVisible: updates.isVisible,
      isEnabled: updates.isEnabled
    });

    if (result.isFailure) {
      const errorMessage = result.error ?? 'Unknown error';

      if (errorMessage.includes('Space') && errorMessage.includes('not found')) {
        return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }
      if (errorMessage.includes('Widget') && errorMessage.includes('not found')) {
        return respond.error("Widget not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }
      if (errorMessage.includes('permission') || errorMessage.includes('leader')) {
        return respond.error("Only space leaders can update widgets", "FORBIDDEN", { status: 403 });
      }

      return respond.error(errorMessage, "UPDATE_FAILED", { status: 400 });
    }

    logger.info(`Widget updated: ${widgetId} in space ${spaceId}`, {
      spaceId,
      widgetId,
      updates: updateKeys,
      userId
    });

    return respond.success({
      message: "Widget updated successfully",
      updates: updateKeys
    });
  }
);

/**
 * DELETE /api/spaces/[spaceId]/widgets/[widgetId] - Delete a widget
 */
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; widgetId: string }> },
  respond
) => {
  const { spaceId, widgetId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId || !widgetId) {
    return respond.error("Space ID and Widget ID are required", "INVALID_INPUT", { status: 400 });
  }

  // Use DDD SpaceManagementService
  const spaceService = createServerSpaceManagementService(
    { userId, campusId }
  );

  const result = await spaceService.removeWidget(userId, {
    spaceId,
    widgetId
  });

  if (result.isFailure) {
    const errorMessage = result.error ?? 'Unknown error';

    if (errorMessage.includes('Space') && errorMessage.includes('not found')) {
      return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }
    if (errorMessage.includes('Widget') && errorMessage.includes('not found')) {
      return respond.error("Widget not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }
    if (errorMessage.includes('permission') || errorMessage.includes('leader')) {
      return respond.error("Only space leaders can delete widgets", "FORBIDDEN", { status: 403 });
    }

    return respond.error(errorMessage, "DELETE_FAILED", { status: 400 });
  }

  logger.info(`Widget deleted: ${widgetId} from space ${spaceId}`, {
    spaceId,
    widgetId,
    userId
  });

  return respond.success({
    message: "Widget deleted successfully"
  });
});
