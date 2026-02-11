import { z } from "zod";
import {
  createServerSpaceManagementService,
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { SecurityScanner } from "@/lib/secure-input-validation";
import { withCache } from '../../../../../lib/cache-headers';

/**
 * Tab CRUD API - Phase 4: DDD Foundation
 *
 * GET   /api/spaces/[spaceId]/tabs - List all tabs
 * POST  /api/spaces/[spaceId]/tabs - Create a new tab
 * PATCH /api/spaces/[spaceId]/tabs - Reorder tabs
 */

const CreateTabSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['feed', 'widget', 'resource', 'custom']),
  isVisible: z.boolean().default(true),
  order: z.number().min(0).optional()
});

const ReorderTabsSchema = z.object({
  orderedTabIds: z.array(z.string().min(1)).min(1)
});

/**
 * GET /api/spaces/[spaceId]/tabs - List all tabs for a space
 * Requires: guest access (public spaces) or member access (private spaces)
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Check permission - guests can view public spaces, members can view private
  const permCheck = await checkSpacePermission(spaceId, userId, 'guest');
  if (!permCheck.hasPermission) {
    const status = permCheck.code === 'NOT_FOUND' ? 404 : 403;
    return respond.error(permCheck.error ?? "Permission denied", permCheck.code ?? "FORBIDDEN", { status });
  }

  const { space } = permCheck;

  // For private spaces, require member access
  if (space && !space.isPublic) {
    const memberCheck = await checkSpacePermission(spaceId, userId, 'member');
    if (!memberCheck.hasPermission) {
      return respond.error(memberCheck.error ?? "Permission denied", memberCheck.code ?? "FORBIDDEN", { status: 403 });
    }
  }

  // Fetch full space data to get tabs
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  const spaceData = spaceDoc.data() || {};
  const spaceTabs = spaceData.tabs || [];

  // Transform tabs to response format (only visible tabs for non-leaders)
  const isLeader = permCheck.role && ['owner', 'admin', 'moderator'].includes(permCheck.role);
  const tabs = spaceTabs
    .filter((tab: { isVisible?: boolean }) => isLeader || tab.isVisible)
    .map((tab: { id: string; name: string; title?: string; type?: string; isDefault?: boolean; isVisible?: boolean; order?: number; widgets?: string[]; messageCount?: number; isArchived?: boolean; createdAt?: unknown; lastActivityAt?: unknown }) => ({
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
    }));

  logger.info(`Tabs listed for space: ${spaceId}`, { spaceId, tabCount: tabs.length });

  return respond.success({
    tabs,
    total: tabs.length
  });
});

/**
 * POST /api/spaces/[spaceId]/tabs - Create a new tab
 */
type CreateTabData = z.output<typeof CreateTabSchema>;

export const POST = withAuthValidationAndErrors(
  CreateTabSchema as z.ZodType<CreateTabData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: CreateTabData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // SECURITY: Scan tab name for XSS/injection attacks
    const nameScan = SecurityScanner.scanInput(data.name);
    if (nameScan.level === 'dangerous') {
      logger.warn("XSS attempt blocked in tab name", { userId, spaceId, threats: nameScan.threats });
      return respond.error("Tab name contains invalid content", "INVALID_INPUT", { status: 400 });
    }

    // Use DDD SpaceManagementService for tab creation
    const spaceService = createServerSpaceManagementService(
      { userId, campusId }
    );

    const result = await spaceService.addTab(userId, {
      spaceId,
      name: data.name,
      type: data.type,
      order: data.order,
      isVisible: data.isVisible
    });

    if (result.isFailure) {
      const errorMessage = result.error ?? 'Unknown error';

      if (errorMessage.includes('not found')) {
        return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }
      if (errorMessage.includes('permission') || errorMessage.includes('leader')) {
        return respond.error("Only space leaders can create tabs", "FORBIDDEN", { status: 403 });
      }
      if (errorMessage.includes('already exists')) {
        return respond.error("Tab with this name already exists", "DUPLICATE", { status: 409 });
      }

      return respond.error(errorMessage, "CREATE_FAILED", { status: 400 });
    }

    const tab = result.getValue().data;

    logger.info(`Tab created: ${tab.tabId} in space ${spaceId}`, {
      spaceId,
      tabId: tab.tabId,
      tabName: tab.name,
      userId
    });

    return respond.success({
      message: "Tab created successfully",
      tab: {
        id: tab.tabId,
        name: tab.name,
        type: tab.type
      }
    }, { status: 201 });
  }
);

/**
 * PATCH /api/spaces/[spaceId]/tabs - Reorder tabs
 * Requires: leader access (owner, admin, or moderator)
 */
type ReorderTabsData = z.output<typeof ReorderTabsSchema>;

export const PATCH = withAuthValidationAndErrors(
  ReorderTabsSchema as z.ZodType<ReorderTabsData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: ReorderTabsData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Use DDD SpaceManagementService for tab reordering
    const spaceService = createServerSpaceManagementService(
      { userId, campusId }
    );

    const result = await spaceService.reorderTabs(userId, {
      spaceId,
      orderedTabIds: data.orderedTabIds
    });

    if (result.isFailure) {
      const errorMessage = result.error ?? 'Unknown error';

      if (errorMessage.includes('not found')) {
        return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }
      if (errorMessage.includes('permission') || errorMessage.includes('leader')) {
        return respond.error("Only space leaders can reorder tabs", "FORBIDDEN", { status: 403 });
      }
      if (errorMessage.includes('All tab IDs must be included')) {
        return respond.error("All tab IDs must be included in the reorder", "INVALID_INPUT", { status: 400 });
      }
      if (errorMessage.includes('Invalid tab ID')) {
        return respond.error("One or more tab IDs are invalid", "INVALID_INPUT", { status: 400 });
      }

      return respond.error(errorMessage, "REORDER_FAILED", { status: 400 });
    }

    logger.info(`Tabs reordered in space ${spaceId}`, {
      spaceId,
      newOrder: data.orderedTabIds,
      userId
    });

    return respond.success({
      message: "Tabs reordered successfully",
      orderedTabIds: data.orderedTabIds
    });
  }
);

export const GET = withCache(_GET, 'SHORT');
