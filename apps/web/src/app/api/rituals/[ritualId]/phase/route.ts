import { z } from "zod";
import { RitualEngineService, RitualPhase } from "@hive/core";
import { logger } from "@/lib/logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled } from "@/lib/feature-flags";
import { isAdmin as checkIsAdmin } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ ritualId: string }>;
}

const transitionPhaseSchema = z.object({
  phase: z.enum(["draft", "announced", "active", "cooldown", "ended"]),
  reason: z.enum(["manual", "scheduled", "auto"]).optional(),
  notes: z.string().max(500).optional(),
});

type TransitionPhaseData = z.infer<typeof transitionPhaseSchema>;

/**
 * POST /api/rituals/[ritualId]/phase - Transition ritual phase (admin only)
 *
 * Valid transitions:
 * - draft → announced, active
 * - announced → active, cooldown, ended
 * - active → cooldown, ended
 * - cooldown → ended
 * - ended → (none)
 */
export const POST = withAuthValidationAndErrors(
  transitionPhaseSchema,
  async (request, context: RouteParams, body: TransitionPhaseData, respond) => {
    const req = request as AuthenticatedRequest;
    const userId = getUserId(req);
    const campusId = getCampusId(req);
    const { ritualId } = await context.params;

    // Check feature flag
    const ritualsEnabled = await isRitualsEnabled({ userId, schoolId: campusId });
    if (!ritualsEnabled) {
      return respond.error("Rituals feature is not enabled", "FEATURE_DISABLED", {
        status: 403,
      });
    }

    // Check admin permission
    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) {
      return respond.error("Admin access required", "FORBIDDEN", { status: 403 });
    }

    try {
      const service = new RitualEngineService(undefined, { campusId });

      const result = await service.transitionPhase(ritualId, body.phase as RitualPhase, {
        reason: body.reason,
        notes: body.notes,
      });

      if (result.isFailure) {
        logger.warn("Invalid phase transition", {
          error: result.error,
          ritualId,
          targetPhase: body.phase,
          userId,
        });
        return respond.error(
          result.error as string,
          "INVALID_TRANSITION",
          { status: 400 }
        );
      }

      const ritual = result.getValue();

      logger.info("Transitioned ritual phase", {
        ritualId,
        newPhase: body.phase,
        reason: body.reason,
        userId,
        campusId,
      });

      return respond.success({ ritual });
    } catch (error) {
      logger.error("Error transitioning ritual phase", {
        error: error instanceof Error ? error.message : String(error),
        ritualId,
        userId,
      });
      return respond.error("Failed to transition phase", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);
