import { z } from "zod";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { logger } from "@/lib/structured-logger";
import { dbAdmin } from "@/lib/firebase-admin";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import {
  getTemplateById,
  createFromTemplate,
} from "@hive/core/domain/hivelab/automation-templates";

/**
 * POST /api/spaces/[spaceId]/automations/from-template
 *
 * Create an automation from a template.
 * Only space admins/owners can create automations.
 */

const ApplyTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  customValues: z.record(z.unknown()).optional(),
});

type ApplyTemplateData = z.output<typeof ApplyTemplateSchema>;

export const POST = withAuthValidationAndErrors(
  ApplyTemplateSchema as z.ZodType<ApplyTemplateData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: ApplyTemplateData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Check permission (must be admin or owner)
    const permCheck = await checkSpacePermission(spaceId, userId, "admin");
    if (!permCheck.hasPermission) {
      return respond.error(
        "You must be an admin to create automations",
        "PERMISSION_DENIED",
        { status: 403 }
      );
    }

    // Get the template
    const template = getTemplateById(data.templateId);
    if (!template) {
      return respond.error("Template not found", "NOT_FOUND", { status: 404 });
    }

    // Create automation config from template
    const automationConfig = createFromTemplate(
      template,
      data.customValues || {},
      data.name
    );

    // Create the automation document
    const automationRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .doc();

    const now = new Date();
    const automationData = {
      id: automationRef.id,
      spaceId,
      campusId,
      name: automationConfig.name,
      description: template.description,
      trigger: automationConfig.trigger,
      action: automationConfig.action,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      stats: {
        timesTriggered: 0,
        successCount: 0,
        failureCount: 0,
        lastTriggered: null,
      },
      metadata: {
        fromTemplate: template.id,
        templateName: template.name,
      },
    };

    await automationRef.set(automationData);

    logger.info("Automation created from template", {
      automationId: automationRef.id,
      templateId: template.id,
      spaceId,
      userId,
    });

    return respond.success({
      automation: automationData,
      message: `${template.name} automation enabled`,
    });
  }
);
