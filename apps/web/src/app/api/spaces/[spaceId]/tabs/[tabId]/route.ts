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
 * Individual Tab CRUD API - Phase 4: DDD Foundation
 *
 * GET    /api/spaces/[spaceId]/tabs/[tabId] - Get a specific tab
 * PATCH  /api/spaces/[spaceId]/tabs/[tabId] - Update a tab
 * DELETE /api/spaces/[spaceId]/tabs/[tabId] - Delete a tab
 */

const UpdateTabSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  order: z.number().min(0).optional(),
  isVisible: z.boolean().optional()
});

/**
 * GET /api/spaces/[spaceId]/tabs/[tabId] - Get a specific tab
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; tabId: string }> },
  respond
) => {
  const { spaceId, tabId } = await params;
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId || !tabId) {
    return respond.error("Space ID and Tab ID are required", "INVALID_INPUT", { status: 400 });
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

  const tab = space.getTabById(tabId);
  if (!tab) {
    return respond.error("Tab not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  return respond.success({
    tab: {
      id: tab.id,
      name: tab.name,
      title: tab.title,
      type: tab.type,
      isDefault: tab.isDefault,
      isVisible: tab.isVisible,
      order: tab.order,
      widgetIds: tab.widgets,
      messageCount: tab.messageCount,
      isArchived: tab.isArchived,
      createdAt: tab.createdAt,
      lastActivityAt: tab.lastActivityAt
    }
  });
});

/**
 * PATCH /api/spaces/[spaceId]/tabs/[tabId] - Update a tab
 */
type UpdateTabData = z.infer<typeof UpdateTabSchema>;

export const PATCH = withAuthValidationAndErrors(
  UpdateTabSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; tabId: string }> },
    updates: UpdateTabData,
    respond
  ) => {
    const { spaceId, tabId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId || !tabId) {
      return respond.error("Space ID and Tab ID are required", "INVALID_INPUT", { status: 400 });
    }

    const updateKeys = Object.keys(updates);
    if (updateKeys.length === 0) {
      return respond.error("No updates provided", "INVALID_INPUT", { status: 400 });
    }

    // SECURITY: Scan tab name for XSS/injection attacks
    if (updates.name) {
      const nameScan = SecurityScanner.scanInput(updates.name);
      if (nameScan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in tab name update", {
          userId, spaceId, tabId, threats: nameScan.threats
        });
        return respond.error("Tab name contains invalid content", "INVALID_INPUT", { status: 400 });
      }
    }

    // SECURITY: Scan description for XSS/injection attacks
    if (updates.description) {
      const descScan = SecurityScanner.scanInput(updates.description);
      if (descScan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in tab description update", {
          userId, spaceId, tabId, threats: descScan.threats
        });
        return respond.error("Tab description contains invalid content", "INVALID_INPUT", { status: 400 });
      }
    }

    // Use DDD SpaceManagementService
    const spaceService = createServerSpaceManagementService(
      { userId, campusId }
    );

    const result = await spaceService.updateTab(userId, {
      spaceId,
      tabId,
      name: updates.name,
      description: updates.description,
      order: updates.order,
      isVisible: updates.isVisible
    });

    if (result.isFailure) {
      const errorMessage = result.error ?? 'Unknown error';

      if (errorMessage.includes('Space') && errorMessage.includes('not found')) {
        return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }
      if (errorMessage.includes('Tab') && errorMessage.includes('not found')) {
        return respond.error("Tab not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }
      if (errorMessage.includes('permission') || errorMessage.includes('leader')) {
        return respond.error("Only space leaders can update tabs", "FORBIDDEN", { status: 403 });
      }
      if (errorMessage.includes('default tab')) {
        return respond.error("Cannot hide the default tab", "INVALID_OPERATION", { status: 400 });
      }

      return respond.error(errorMessage, "UPDATE_FAILED", { status: 400 });
    }

    logger.info(`Tab updated: ${tabId} in space ${spaceId}`, {
      spaceId,
      tabId,
      updates: updateKeys,
      userId
    });

    return respond.success({
      message: "Tab updated successfully",
      updates: updateKeys
    });
  }
);

/**
 * DELETE /api/spaces/[spaceId]/tabs/[tabId] - Delete a tab
 */
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; tabId: string }> },
  respond
) => {
  const { spaceId, tabId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId || !tabId) {
    return respond.error("Space ID and Tab ID are required", "INVALID_INPUT", { status: 400 });
  }

  // Use DDD SpaceManagementService
  const spaceService = createServerSpaceManagementService(
    { userId, campusId }
  );

  const result = await spaceService.removeTab(userId, {
    spaceId,
    tabId
  });

  if (result.isFailure) {
    const errorMessage = result.error ?? 'Unknown error';

    if (errorMessage.includes('Space') && errorMessage.includes('not found')) {
      return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }
    if (errorMessage.includes('Tab') && errorMessage.includes('not found')) {
      return respond.error("Tab not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }
    if (errorMessage.includes('permission') || errorMessage.includes('leader')) {
      return respond.error("Only space leaders can delete tabs", "FORBIDDEN", { status: 403 });
    }
    if (errorMessage.includes('default tab')) {
      return respond.error("Cannot remove the default tab", "INVALID_OPERATION", { status: 400 });
    }

    return respond.error(errorMessage, "DELETE_FAILED", { status: 400 });
  }

  logger.info(`Tab deleted: ${tabId} from space ${spaceId}`, {
    spaceId,
    tabId,
    userId
  });

  return respond.success({
    message: "Tab deleted successfully"
  });
});
