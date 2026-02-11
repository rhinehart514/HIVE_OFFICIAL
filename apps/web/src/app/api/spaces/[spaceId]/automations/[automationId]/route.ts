import { z } from "zod";
import {
  withAuthValidationAndErrors,
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import { SecurityScanner } from "@/lib/secure-input-validation";
import { dbAdmin } from "@/lib/firebase-admin";
import { withCache } from '../../../../../../lib/cache-headers';

/**
 * Individual Automation API - Phase 3 HiveLab
 *
 * GET /api/spaces/[spaceId]/automations/[automationId] - Get automation details
 * PATCH /api/spaces/[spaceId]/automations/[automationId] - Update automation
 * DELETE /api/spaces/[spaceId]/automations/[automationId] - Delete automation
 */

// ============================================================================
// SCHEMAS
// ============================================================================

const TriggerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('member_join'),
    config: z.object({
      forRoles: z.array(z.string()).optional(),
      delayMs: z.number().min(0).max(86400000).optional(),
    }).default({}),
  }),
  z.object({
    type: z.literal('event_reminder'),
    config: z.object({
      beforeMinutes: z.number().min(1).max(10080),
      eventTypes: z.array(z.string()).optional(),
    }),
  }),
  z.object({
    type: z.literal('schedule'),
    config: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      timezone: z.string().optional(),
    }),
  }),
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
  z.object({
    type: z.literal('send_message'),
    config: z.object({
      boardId: z.string().min(1),
      content: z.string().min(1).max(2000),
      asDm: z.boolean().optional(),
    }),
  }),
  z.object({
    type: z.literal('create_component'),
    config: z.object({
      boardId: z.string().min(1),
      componentType: z.enum(['poll', 'countdown', 'rsvp', 'announcement']),
      componentConfig: z.object({
        question: z.string().optional(),
        options: z.array(z.string()).optional(),
        allowMultiple: z.boolean().optional(),
        title: z.string().optional(),
        durationMinutes: z.number().optional(),
        eventTitle: z.string().optional(),
        maxCapacity: z.number().optional(),
        message: z.string().optional(),
        style: z.enum(['info', 'warning', 'success']).optional(),
      }),
    }),
  }),
  z.object({
    type: z.literal('assign_role'),
    config: z.object({
      roleId: z.string().min(1),
      target: z.enum(['triggering_user', 'specific']),
      userId: z.string().optional(),
    }),
  }),
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

const UpdateAutomationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  enabled: z.boolean().optional(),
  trigger: TriggerSchema.optional(),
  action: ActionSchema.optional(),
});

type UpdateAutomationData = z.output<typeof UpdateAutomationSchema>;

// ============================================================================
// GET - Get Single Automation
// ============================================================================

const _GET = withAuthAndErrors(
  async (
    request: Request,
    { params }: { params: Promise<{ spaceId: string; automationId: string }> },
    respond
  ) => {
    const { spaceId, automationId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId || !automationId) {
      return respond.error("Space ID and Automation ID are required", "INVALID_INPUT", { status: 400 });
    }

    // Check member permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'member');
    if (!permCheck.hasPermission) {
      return respond.error("Access denied", "FORBIDDEN", { status: 403 });
    }

    // Fetch automation
    const doc = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .doc(automationId)
      .get();

    if (!doc.exists) {
      return respond.error("Automation not found", "NOT_FOUND", { status: 404 });
    }

    const data = doc.data()!;

    return respond.success({
      automation: {
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
        creationSource: data.creationSource,
        creationPrompt: data.creationPrompt,
      },
    });
  }
);

// ============================================================================
// PATCH - Update Automation
// ============================================================================

export const PATCH = withAuthValidationAndErrors(
  UpdateAutomationSchema as z.ZodType<UpdateAutomationData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; automationId: string }> },
    data: UpdateAutomationData,
    respond
  ) => {
    const { spaceId, automationId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId || !automationId) {
      return respond.error("Space ID and Automation ID are required", "INVALID_INPUT", { status: 400 });
    }

    // Check leader permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'admin');
    if (!permCheck.hasPermission) {
      return respond.error("Only space leaders can update automations", "FORBIDDEN", { status: 403 });
    }

    // Fetch existing automation
    const docRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .doc(automationId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return respond.error("Automation not found", "NOT_FOUND", { status: 404 });
    }

    // Security: Scan text fields
    const fieldsToScan: Array<{ name: string; value: string }> = [];

    if (data.name) {
      fieldsToScan.push({ name: 'name', value: data.name });
    }
    if (data.description) {
      fieldsToScan.push({ name: 'description', value: data.description });
    }
    if (data.action?.type === 'send_message') {
      fieldsToScan.push({ name: 'content', value: data.action.config.content });
    } else if (data.action?.type === 'notify') {
      fieldsToScan.push({ name: 'title', value: data.action.config.title });
      fieldsToScan.push({ name: 'body', value: data.action.config.body });
    }

    for (const field of fieldsToScan) {
      const scan = SecurityScanner.scanInput(field.value);
      if (scan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in automation update", {
          userId,
          spaceId,
          automationId,
          field: field.name,
          threats: scan.threats,
        });
        return respond.error(`Field ${field.name} contains invalid content`, "INVALID_INPUT", { status: 400 });
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updates.name = data.name;
    }
    if (data.description !== undefined) {
      updates.description = data.description;
    }
    if (data.enabled !== undefined) {
      updates.enabled = data.enabled;
    }
    if (data.trigger !== undefined) {
      updates.trigger = data.trigger;
    }
    if (data.action !== undefined) {
      updates.action = data.action;
    }

    await docRef.update(updates);

    // Fetch updated doc
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data()!;

    logger.info('Automation updated', {
      automationId,
      spaceId,
      userId,
      updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt'),
    });

    return respond.success({
      automation: {
        id: automationId,
        spaceId: updatedData.spaceId,
        createdBy: updatedData.createdBy,
        createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
        updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt,
        name: updatedData.name,
        description: updatedData.description,
        enabled: updatedData.enabled,
        trigger: updatedData.trigger,
        action: updatedData.action,
        stats: {
          timesTriggered: updatedData.stats?.timesTriggered || 0,
          successCount: updatedData.stats?.successCount || 0,
          failureCount: updatedData.stats?.failureCount || 0,
          lastTriggered: updatedData.stats?.lastTriggered?.toDate?.()?.toISOString() || null,
        },
      },
      message: "Automation updated successfully",
    });
  }
);

// ============================================================================
// DELETE - Delete Automation
// ============================================================================

export const DELETE = withAuthAndErrors(
  async (
    request: Request,
    { params }: { params: Promise<{ spaceId: string; automationId: string }> },
    respond
  ) => {
    const { spaceId, automationId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId || !automationId) {
      return respond.error("Space ID and Automation ID are required", "INVALID_INPUT", { status: 400 });
    }

    // Check leader permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'admin');
    if (!permCheck.hasPermission) {
      return respond.error("Only space leaders can delete automations", "FORBIDDEN", { status: 403 });
    }

    // Check automation exists
    const docRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .doc(automationId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return respond.error("Automation not found", "NOT_FOUND", { status: 404 });
    }

    // Delete the automation
    await docRef.delete();

    logger.info('Automation deleted', {
      automationId,
      spaceId,
      userId,
    });

    return respond.success({
      deleted: true,
      automationId,
      message: "Automation deleted successfully",
    });
  }
);

export const GET = withCache(_GET, 'SHORT');
