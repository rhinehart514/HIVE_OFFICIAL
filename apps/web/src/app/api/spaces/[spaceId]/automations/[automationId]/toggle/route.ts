import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import { dbAdmin } from "@/lib/firebase-admin";

/**
 * Toggle Automation API - Quick enable/disable
 *
 * POST /api/spaces/[spaceId]/automations/[automationId]/toggle
 *
 * Toggles the enabled state of an automation without needing to send
 * the full automation object.
 */

export const POST = withAuthAndErrors(
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
    const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
    if (!permCheck.hasPermission) {
      return respond.error("Only space leaders can toggle automations", "FORBIDDEN", { status: 403 });
    }

    // Fetch current state
    const docRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .doc(automationId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return respond.error("Automation not found", "NOT_FOUND", { status: 404 });
    }

    const data = doc.data()!;
    const newEnabled = !data.enabled;

    // Update enabled state
    await docRef.update({
      enabled: newEnabled,
      updatedAt: new Date(),
    });

    logger.info('Automation toggled', {
      automationId,
      spaceId,
      userId,
      enabled: newEnabled,
    });

    return respond.success({
      automationId,
      enabled: newEnabled,
      message: newEnabled ? 'Automation enabled' : 'Automation disabled',
    });
  }
);
