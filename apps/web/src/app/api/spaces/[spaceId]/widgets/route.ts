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
 * Requires: guest access (public spaces) or member access (private spaces)
 */
export const GET = withAuthAndErrors(async (
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

  // Fetch full space data to get widgets
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  const spaceData = spaceDoc.data() || {};
  const spaceWidgets = spaceData.widgets || [];

  // Transform widgets to response format (only visible/enabled widgets for non-leaders)
  const isLeader = permCheck.role && ['owner', 'admin', 'moderator'].includes(permCheck.role);
  const widgets = spaceWidgets
    .filter((widget: { isVisible?: boolean; isEnabled?: boolean }) => isLeader || (widget.isVisible && widget.isEnabled))
    .map((widget: { id: string; type?: string; title?: string; config?: unknown; isVisible?: boolean; isEnabled?: boolean; order?: number; position?: unknown }) => ({
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
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // SECURITY: Scan widget title for XSS/injection attacks
    const titleScan = SecurityScanner.scanInput(data.title);
    if (titleScan.level === 'dangerous') {
      logger.warn("XSS attempt blocked in widget title", { userId, spaceId, threats: titleScan.threats });
      return respond.error("Widget title contains invalid content", "INVALID_INPUT", { status: 400 });
    }

    // Use DDD SpaceManagementService for widget creation
    const spaceService = createServerSpaceManagementService(
      { userId, campusId }
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
