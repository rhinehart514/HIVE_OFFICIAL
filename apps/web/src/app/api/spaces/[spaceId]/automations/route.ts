import { z } from "zod";
import {
  withAuthValidationAndErrors,
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import { SecurityScanner } from "@/lib/secure-input-validation";
import { dbAdmin } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";

/**
 * Automations API - Phase 3 HiveLab
 *
 * POST /api/spaces/[spaceId]/automations - Create a new automation
 * GET /api/spaces/[spaceId]/automations - List automations for a space
 *
 * Automations enable space leaders to set up triggered workflows.
 */

// ============================================================================
// SCHEMAS
// ============================================================================

const TriggerSchema = z.discriminatedUnion('type', [
  // Member join trigger
  z.object({
    type: z.literal('member_join'),
    config: z.object({
      forRoles: z.array(z.string()).optional(),
      delayMs: z.number().min(0).max(86400000).optional(), // Max 24h delay
    }).default({}),
  }),
  // Event reminder trigger
  z.object({
    type: z.literal('event_reminder'),
    config: z.object({
      beforeMinutes: z.number().min(1).max(10080), // 1 min to 1 week
      eventTypes: z.array(z.string()).optional(),
    }),
  }),
  // Schedule trigger
  z.object({
    type: z.literal('schedule'),
    config: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      timezone: z.string().optional(),
    }),
  }),
  // Keyword trigger
  z.object({
    type: z.literal('keyword'),
    config: z.object({
      keywords: z.array(z.string()).min(1).max(10),
      matchType: z.enum(['exact', 'contains']),
      boardIds: z.array(z.string()).optional(),
      cooldownMs: z.number().min(0).max(86400000).optional(),
    }),
  }),
]);

const ActionSchema = z.discriminatedUnion('type', [
  // Send message action
  z.object({
    type: z.literal('send_message'),
    config: z.object({
      boardId: z.string().min(1),
      content: z.string().min(1).max(2000),
      asDm: z.boolean().optional(),
    }),
  }),
  // Create component action
  z.object({
    type: z.literal('create_component'),
    config: z.object({
      boardId: z.string().min(1),
      componentType: z.enum(['poll', 'countdown', 'rsvp', 'announcement']),
      componentConfig: z.object({
        // Poll
        question: z.string().optional(),
        options: z.array(z.string()).optional(),
        allowMultiple: z.boolean().optional(),
        // Countdown
        title: z.string().optional(),
        durationMinutes: z.number().optional(),
        // RSVP
        eventTitle: z.string().optional(),
        maxCapacity: z.number().optional(),
        // Announcement
        message: z.string().optional(),
        style: z.enum(['info', 'warning', 'success']).optional(),
      }),
    }),
  }),
  // Assign role action
  z.object({
    type: z.literal('assign_role'),
    config: z.object({
      roleId: z.string().min(1),
      target: z.enum(['triggering_user', 'specific']),
      userId: z.string().optional(),
    }),
  }),
  // Notify action
  z.object({
    type: z.literal('notify'),
    config: z.object({
      recipients: z.enum(['leaders', 'all_members', 'specific']),
      userIds: z.array(z.string()).optional(),
      title: z.string().min(1).max(100),
      body: z.string().min(1).max(500),
      link: z.string().url().optional(),
    }),
  }),
]);

const CreateAutomationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(500).optional(),
  trigger: TriggerSchema,
  action: ActionSchema,
  enabled: z.boolean().default(true),
  creationSource: z.enum(['chat_intent', 'slash_command', 'dashboard', 'template']).optional(),
  creationPrompt: z.string().optional(),
});

type CreateAutomationData = z.output<typeof CreateAutomationSchema>;

// ============================================================================
// POST - Create Automation
// ============================================================================

export const POST = withAuthValidationAndErrors(
  CreateAutomationSchema as z.ZodType<CreateAutomationData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: CreateAutomationData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Check leader permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
    if (!permCheck.hasPermission) {
      return respond.error("Only space leaders can create automations", "FORBIDDEN", { status: 403 });
    }

    // Security: Scan text fields for XSS/injection
    const fieldsToScan: Array<{ name: string; value: string }> = [
      { name: 'name', value: data.name },
    ];

    if (data.description) {
      fieldsToScan.push({ name: 'description', value: data.description });
    }

    // Scan action-specific fields
    if (data.action.type === 'send_message') {
      fieldsToScan.push({ name: 'content', value: data.action.config.content });
    } else if (data.action.type === 'notify') {
      fieldsToScan.push({ name: 'title', value: data.action.config.title });
      fieldsToScan.push({ name: 'body', value: data.action.config.body });
    }

    for (const field of fieldsToScan) {
      const scan = SecurityScanner.scanInput(field.value);
      if (scan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in automation creation", {
          userId,
          spaceId,
          field: field.name,
          threats: scan.threats,
        });
        return respond.error(`Field ${field.name} contains invalid content`, "INVALID_INPUT", { status: 400 });
      }
    }

    // Create the automation
    const automationId = uuidv4();
    const now = new Date();

    const automationDoc = {
      id: automationId,
      spaceId,
      campusId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      name: data.name,
      description: data.description || null,
      enabled: data.enabled,
      trigger: data.trigger,
      action: data.action,
      stats: {
        timesTriggered: 0,
        successCount: 0,
        failureCount: 0,
        lastTriggered: null,
      },
      creationSource: data.creationSource || 'dashboard',
      creationPrompt: data.creationPrompt || null,
    };

    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .doc(automationId)
      .set(automationDoc);

    logger.info('Automation created', {
      automationId,
      spaceId,
      userId,
      triggerType: data.trigger.type,
      actionType: data.action.type,
    });

    return respond.success({
      automation: {
        id: automationId,
        spaceId,
        createdBy: userId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        trigger: data.trigger,
        action: data.action,
        stats: {
          timesTriggered: 0,
          successCount: 0,
          failureCount: 0,
          lastTriggered: null,
        },
      },
      message: "Automation created successfully",
    });
  }
);

// ============================================================================
// GET - List Automations
// ============================================================================

export const GET = withAuthAndErrors(
  async (
    request: Request,
    { params }: { params: Promise<{ spaceId: string }> },
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Check member permission (leaders can manage, members can view)
    const permCheck = await checkSpacePermission(spaceId, userId, 'member');
    if (!permCheck.hasPermission) {
      return respond.error("Access denied", "FORBIDDEN", { status: 403 });
    }

    const isLeader = ['owner', 'admin', 'leader', 'moderator'].includes(permCheck.role || '');

    // Fetch automations
    const snapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const automations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        spaceId: data.spaceId,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        trigger: data.trigger,
        action: data.action,
        stats: {
          timesTriggered: data.stats?.timesTriggered || 0,
          successCount: data.stats?.successCount || 0,
          failureCount: data.stats?.failureCount || 0,
          lastTriggered: data.stats?.lastTriggered?.toDate?.()?.toISOString() || null,
        },
      };
    });

    return respond.success({
      automations,
      isLeader,
      total: automations.length,
    });
  }
);
