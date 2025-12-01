import { z } from "zod";
import {
  getServerSpaceRepository,
  createServerSpaceManagementService,
} from "@hive/core/server";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest
} from "@/lib/middleware";

/**
 * Tab CRUD API - Phase 4: DDD Foundation
 *
 * GET  /api/spaces/[spaceId]/tabs - List all tabs
 * POST /api/spaces/[spaceId]/tabs - Create a new tab
 */

const CreateTabSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['feed', 'widget', 'resource', 'custom']),
  isVisible: z.boolean().default(true),
  order: z.number().min(0).optional()
});

/**
 * GET /api/spaces/[spaceId]/tabs - List all tabs for a space
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Use DDD repository for space lookup
  const spaceRepo = getServerSpaceRepository();
  const result = await spaceRepo.findById(spaceId);

  if (result.isFailure) {
    return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const space = result.getValue();

  // Enforce campus isolation
  if (space.campusId.id !== CURRENT_CAMPUS_ID) {
    return respond.error("Access denied - campus mismatch", "FORBIDDEN", { status: 403 });
  }

  // Transform tabs to response format
  const tabs = space.tabs.map(tab => ({
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

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Use DDD SpaceManagementService for tab creation
    const spaceService = createServerSpaceManagementService(
      { userId, campusId: CURRENT_CAMPUS_ID }
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
