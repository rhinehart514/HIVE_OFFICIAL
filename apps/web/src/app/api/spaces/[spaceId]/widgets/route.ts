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
 * Widget CRUD API - Phase 4: DDD Foundation
 *
 * GET  /api/spaces/[spaceId]/widgets - List all widgets
 * POST /api/spaces/[spaceId]/widgets - Create a new widget
 */

const CreateWidgetSchema = z.object({
  type: z.enum(['calendar', 'poll', 'links', 'files', 'rss', 'custom']),
  title: z.string().min(1).max(100),
  config: z.record(z.any()).default({}),
  order: z.number().min(0).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }).optional()
});

/**
 * GET /api/spaces/[spaceId]/widgets - List all widgets for a space
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

  // Transform widgets to response format
  const widgets = space.widgets.map(widget => ({
    id: widget.id,
    type: widget.type,
    title: widget.title,
    config: widget.config,
    isVisible: widget.isVisible,
    isEnabled: widget.isEnabled,
    order: widget.order,
    position: widget.position
  }));

  logger.info(`Widgets listed for space: ${spaceId}`, { spaceId, widgetCount: widgets.length });

  return respond.success({
    widgets,
    total: widgets.length
  });
});

/**
 * POST /api/spaces/[spaceId]/widgets - Create a new widget
 */
type CreateWidgetData = z.output<typeof CreateWidgetSchema>;

export const POST = withAuthValidationAndErrors(
  CreateWidgetSchema as z.ZodType<CreateWidgetData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: CreateWidgetData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Use DDD SpaceManagementService for widget creation
    const spaceService = createServerSpaceManagementService(
      { userId, campusId: CURRENT_CAMPUS_ID }
    );

    const result = await spaceService.addWidget(userId, {
      spaceId,
      type: data.type,
      title: data.title,
      config: data.config,
      order: data.order,
      position: data.position
    });

    if (result.isFailure) {
      const errorMessage = result.error ?? 'Unknown error';

      if (errorMessage.includes('not found')) {
        return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }
      if (errorMessage.includes('permission') || errorMessage.includes('leader')) {
        return respond.error("Only space leaders can create widgets", "FORBIDDEN", { status: 403 });
      }

      return respond.error(errorMessage, "CREATE_FAILED", { status: 400 });
    }

    const widget = result.getValue().data;

    logger.info(`Widget created: ${widget.widgetId} in space ${spaceId}`, {
      spaceId,
      widgetId: widget.widgetId,
      widgetType: widget.type,
      userId
    });

    return respond.success({
      message: "Widget created successfully",
      widget: {
        id: widget.widgetId,
        title: widget.title,
        type: widget.type
      }
    }, { status: 201 });
  }
);
