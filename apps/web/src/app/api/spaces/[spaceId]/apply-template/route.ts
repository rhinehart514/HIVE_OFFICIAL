"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { getServerSpaceRepository } from "@hive/core/server";
import { getSpaceTemplateById } from "@hive/core";
import { logger } from "@/lib/logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { HttpStatus } from "@/lib/api-response-types";

const ApplyTemplateSchema = z.object({
  templateId: z.string().min(1),
  overwriteExisting: z.boolean().default(false),
});

/**
 * Validate space and check leader permissions
 */
async function validateSpaceAndLeaderPermission(spaceId: string, userId: string, campusId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
  }

  const membershipSnapshot = await dbAdmin
    .collection("spaceMembers")
    .where("spaceId", "==", spaceId)
    .where("userId", "==", userId)
    .where("isActive", "==", true)
    // campusId single-field index is exempted — skip Firestore filter
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
  }

  const membership = membershipSnapshot.docs[0].data();
  const role = membership.role;

  // Only owners and admins can apply templates
  if (!["owner", "admin"].includes(role)) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Only leaders can apply templates" };
  }

  return { ok: true as const, space, membership, role };
}

/**
 * POST /api/spaces/[spaceId]/apply-template
 *
 * Apply a template to an existing space
 * Creates tabs and widgets based on the template configuration
 */
export const POST = withAuthValidationAndErrors(
  ApplyTemplateSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId } = await params;

    const validation = await validateSpaceAndLeaderPermission(spaceId, userId, campusId);
    if (!validation.ok) {
      const code = validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    // Get template
    const template = getSpaceTemplateById(body.templateId);
    if (!template) {
      return respond.error("Template not found", "RESOURCE_NOT_FOUND", { status: HttpStatus.NOT_FOUND });
    }

    const batch = dbAdmin.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const createdTabs: string[] = [];
    const createdWidgets: string[] = [];

    // Check for existing tabs/widgets if not overwriting
    if (!body.overwriteExisting) {
      const existingTabsSnapshot = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("tabs")
        .limit(1)
        .get();

      if (!existingTabsSnapshot.empty) {
        return respond.error(
          "Space already has tabs configured. Set overwriteExisting: true to replace them.",
          "CONFLICT",
          { status: HttpStatus.CONFLICT }
        );
      }
    }

    // If overwriting, delete existing tabs and widgets
    if (body.overwriteExisting) {
      const existingTabs = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("tabs")
        .get();

      for (const doc of existingTabs.docs) {
        batch.delete(doc.ref);
      }

      const existingWidgets = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("widgets")
        .get();

      for (const doc of existingWidgets.docs) {
        batch.delete(doc.ref);
      }
    }

    // Create tabs from template
    const tabIdMap = new Map<string, string>(); // Map tab names to IDs

    for (const tabConfig of template.tabs) {
      const tabRef = dbAdmin.collection("spaces").doc(spaceId).collection("tabs").doc();
      const tabId = tabRef.id;
      tabIdMap.set(tabConfig.name, tabId);

      batch.set(tabRef, {
        name: tabConfig.name,
        type: tabConfig.type,
        isDefault: tabConfig.isDefault,
        order: tabConfig.order,
        widgets: [], // Will be populated when widgets are created
        isVisible: true,
        title: tabConfig.name,
        messageCount: 0,
        createdAt: now,
        isArchived: false,
        icon: tabConfig.icon,
        description: tabConfig.description,
        campusId,
      });

      createdTabs.push(tabId);
    }

    // Create widgets from template
    for (const widgetConfig of template.widgets) {
      const widgetRef = dbAdmin.collection("spaces").doc(spaceId).collection("widgets").doc();
      const widgetId = widgetRef.id;

      // Determine which tab to place the widget on
      let targetTabId: string | null = null;
      if (widgetConfig.tabName && tabIdMap.has(widgetConfig.tabName)) {
        targetTabId = tabIdMap.get(widgetConfig.tabName) || null;
      }

      batch.set(widgetRef, {
        type: widgetConfig.type,
        title: widgetConfig.title,
        config: widgetConfig.config,
        isVisible: true,
        order: widgetConfig.order,
        position: { x: 0, y: 0, width: 300, height: 200 },
        isEnabled: true,
        tabId: targetTabId,
        createdAt: now,
        campusId,
      });

      createdWidgets.push(widgetId);

      // If widget belongs to a tab, add it to the tab's widgets array
      if (targetTabId) {
        const tabRef = dbAdmin.collection("spaces").doc(spaceId).collection("tabs").doc(targetTabId);
        batch.update(tabRef, {
          widgets: admin.firestore.FieldValue.arrayUnion(widgetId),
        });
      }
    }

    // Update space with template settings
    const spaceRef = dbAdmin.collection("spaces").doc(spaceId);
    const settingsUpdate: Record<string, unknown> = {
      updatedAt: now,
      templateId: body.templateId,
      templateAppliedAt: now,
      templateAppliedBy: userId,
    };

    // Apply settings from template
    if (template.settings) {
      settingsUpdate["settings.allowInvites"] = template.settings.allowInvites;
      settingsUpdate["settings.requireApproval"] = template.settings.requireApproval;
      settingsUpdate["settings.allowRSS"] = template.settings.allowRSS;

      if (template.settings.maxMembers) {
        settingsUpdate["settings.maxMembers"] = template.settings.maxMembers;
      }
      if (template.settings.postApprovalRequired !== undefined) {
        settingsUpdate["settings.postApprovalRequired"] = template.settings.postApprovalRequired;
      }
      if (template.settings.eventApprovalRequired !== undefined) {
        settingsUpdate["settings.eventApprovalRequired"] = template.settings.eventApprovalRequired;
      }
    }

    // Add suggested tags if space doesn't have tags
    if (template.suggestedTags && template.suggestedTags.length > 0) {
      const spaceDoc = await spaceRef.get();
      const spaceData = spaceDoc.data();
      if (!spaceData?.tags || spaceData.tags.length === 0) {
        settingsUpdate.tags = template.suggestedTags.map((tag: string) => ({ sub_type: tag }));
      }
    }

    batch.update(spaceRef, settingsUpdate);

    // Log activity
    const activityRef = dbAdmin.collection("spaces").doc(spaceId).collection("activity").doc();
    batch.set(activityRef, {
      type: "template_applied",
      performedBy: userId,
      details: {
        templateId: body.templateId,
        templateName: template.metadata.name,
        tabsCreated: createdTabs.length,
        widgetsCreated: createdWidgets.length,
        overwriteExisting: body.overwriteExisting,
      },
      timestamp: now,
    });

    await batch.commit();

    logger.info("Template applied to space", {
      spaceId,
      userId,
      templateId: body.templateId,
      tabsCreated: createdTabs.length,
      widgetsCreated: createdWidgets.length,
      endpoint: "/api/spaces/[spaceId]/apply-template",
    });

    return respond.success({
      success: true,
      templateId: body.templateId,
      templateName: template.metadata.name,
      applied: {
        tabs: createdTabs.length,
        widgets: createdWidgets.length,
      },
      tabIds: createdTabs,
      widgetIds: createdWidgets,
    });
  }
);
