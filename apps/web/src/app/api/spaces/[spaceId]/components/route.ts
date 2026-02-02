import { z } from "zod";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import { SecurityScanner } from "@/lib/secure-input-validation";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
  type InlineComponentType,
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";

/**
 * Inline Component Creation API
 *
 * POST /api/spaces/[spaceId]/components - Create a new inline component
 *
 * Creates a poll, countdown, RSVP, or custom component and sends it as a
 * chat message. Returns the component ID and message ID for real-time updates.
 */

const CreateComponentSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  type: z.enum(['poll', 'countdown', 'rsvp', 'custom']),
  content: z.string().optional().default(""),
  config: z.object({
    // Poll config
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    allowMultiple: z.boolean().optional(),
    showResults: z.enum(['always', 'after_vote', 'after_close']).optional(),
    closesAt: z.string().datetime().optional(),
    // Countdown config
    title: z.string().optional(),
    targetDate: z.string().datetime().optional(),
    // RSVP config
    eventId: z.string().optional(),
    eventTitle: z.string().optional(),
    eventDate: z.string().datetime().optional(),
    maxCapacity: z.number().positive().optional(),
    allowMaybe: z.boolean().optional(),
    // Custom config
    elementType: z.string().optional(),
    toolId: z.string().optional(),
    settings: z.record(z.unknown()).optional(),
  }),
});

type CreateComponentData = z.output<typeof CreateComponentSchema>;

/**
 * Map API type to domain InlineComponentType
 */
function mapComponentType(type: string): InlineComponentType {
  switch (type) {
    case 'poll': return 'poll';
    case 'countdown': return 'countdown';
    case 'rsvp': return 'rsvp';
    case 'custom': return 'custom';
    default: return 'poll';
  }
}

/**
 * Create permission check callback
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'admin' | 'owner' | 'read') => {
    if (requiredRole === 'read') {
      const memberCheck = await checkSpacePermission(spaceId, userId, 'member');
      if (memberCheck.hasPermission) {
        return { allowed: true, role: memberCheck.role };
      }
      const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
      if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
        return { allowed: true, role: 'guest' };
      }
      return { allowed: false };
    }
    const permCheck = await checkSpacePermission(spaceId, userId, requiredRole);
    if (!permCheck.hasPermission) {
      return { allowed: false };
    }
    return { allowed: true, role: permCheck.role };
  };
}

/**
 * Create user profile getter callback
 */
function createProfileGetter(): GetUserProfileFn {
  return async (userId: string) => {
    const userDoc = await dbAdmin.collection('profiles').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    const data = userDoc.data()!;
    return {
      displayName: data.displayName || data.name || 'Member',
      avatarUrl: data.avatarUrl || data.photoURL,
    };
  };
}

/**
 * POST /api/spaces/[spaceId]/components - Create inline component
 */
export const POST = withAuthValidationAndErrors(
  CreateComponentSchema as z.ZodType<CreateComponentData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: CreateComponentData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // SECURITY: Scan component fields for XSS/injection attacks
    const fieldsToScan: Array<{ name: string; value: string }> = [];

    if (data.content) {
      fieldsToScan.push({ name: 'content', value: data.content });
    }
    if (data.config.question) {
      fieldsToScan.push({ name: 'question', value: data.config.question });
    }
    if (data.config.title) {
      fieldsToScan.push({ name: 'title', value: data.config.title });
    }
    if (data.config.eventTitle) {
      fieldsToScan.push({ name: 'eventTitle', value: data.config.eventTitle });
    }
    if (data.config.options) {
      data.config.options.forEach((opt, i) => {
        fieldsToScan.push({ name: `option_${i}`, value: opt });
      });
    }

    for (const field of fieldsToScan) {
      const scan = SecurityScanner.scanInput(field.value);
      if (scan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in component creation", {
          userId,
          spaceId,
          field: field.name,
          threats: scan.threats,
        });
        return respond.error(`Component ${field.name} contains invalid content`, "INVALID_INPUT", { status: 400 });
      }
    }

    // Create the chat service with DDD repositories
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    // Map config based on type
    const componentConfig: Record<string, unknown> = {};

    if (data.type === 'poll') {
      componentConfig.question = data.config.question;
      componentConfig.options = data.config.options;
      componentConfig.allowMultiple = data.config.allowMultiple ?? false;
      componentConfig.showResults = data.config.showResults ?? 'after_vote';
      if (data.config.closesAt) {
        componentConfig.closesAt = new Date(data.config.closesAt);
      }
    } else if (data.type === 'countdown') {
      componentConfig.title = data.config.title;
      if (data.config.targetDate) {
        componentConfig.targetDate = new Date(data.config.targetDate);
      }
    } else if (data.type === 'rsvp') {
      componentConfig.eventId = data.config.eventId;
      componentConfig.eventTitle = data.config.eventTitle;
      if (data.config.eventDate) {
        componentConfig.eventDate = new Date(data.config.eventDate);
      }
      componentConfig.maxCapacity = data.config.maxCapacity;
      componentConfig.allowMaybe = data.config.allowMaybe ?? true;
    } else if (data.type === 'custom') {
      componentConfig.elementType = data.config.elementType;
      componentConfig.toolId = data.config.toolId;
      componentConfig.settings = data.config.settings;
    }

    const result = await chatService.createInlineComponent(userId, {
      spaceId,
      boardId: data.boardId,
      content: data.content,
      componentType: mapComponentType(data.type),
      componentConfig: componentConfig as {
        question?: string;
        options?: string[];
        allowMultiple?: boolean;
        showResults?: 'always' | 'after_vote' | 'after_close';
        closesAt?: Date;
        title?: string;
        targetDate?: Date;
        eventId?: string;
        eventTitle?: string;
        eventDate?: Date;
        maxCapacity?: number;
        allowMaybe?: boolean;
        elementType?: string;
        toolId?: string;
        settings?: Record<string, unknown>;
      },
    });

    if (result.isFailure) {
      const errorMsg = result.error ?? "Failed to create inline component";

      if (errorMsg.includes('not found')) {
        return respond.error(errorMsg, "NOT_FOUND", { status: 404 });
      }
      if (errorMsg.includes('members can') || errorMsg.includes('Access denied')) {
        return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
      }
      if (errorMsg.includes('locked')) {
        return respond.error(errorMsg, "BOARD_LOCKED", { status: 400 });
      }

      return respond.error(errorMsg, "CREATION_FAILED", { status: 500 });
    }

    const componentResult = result.getValue().data;

    logger.info('Inline component created', {
      spaceId,
      boardId: data.boardId,
      componentType: data.type,
      messageId: componentResult.messageId,
      componentId: componentResult.componentId,
      userId,
    });

    return respond.success({
      messageId: componentResult.messageId,
      componentId: componentResult.componentId,
      timestamp: componentResult.timestamp,
      message: "Component created successfully",
    });
  }
);
