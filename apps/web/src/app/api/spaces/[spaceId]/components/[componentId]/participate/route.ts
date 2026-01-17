import { z } from "zod";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";

/**
 * Inline Component Participation API
 *
 * POST /api/spaces/[spaceId]/components/[componentId]/participate - Submit participation
 *
 * Handles:
 * - Poll votes (selectedOptions)
 * - RSVP responses (yes/no/maybe)
 * - Custom component data
 *
 * Returns updated component display state after participation.
 */

const ParticipationSchema = z.object({
  // For polls
  selectedOptions: z.array(z.string()).optional(),
  // For RSVP
  response: z.enum(['yes', 'no', 'maybe']).optional(),
  // For custom components
  data: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.selectedOptions || data.response || data.data,
  { message: "At least one participation field is required" }
);

/**
 * Create permission check callback
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'leader' | 'owner' | 'read') => {
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
 * POST /api/spaces/[spaceId]/components/[componentId]/participate - Submit participation
 */
type ParticipationData = z.output<typeof ParticipationSchema>;

export const POST = withAuthValidationAndErrors(
  ParticipationSchema as z.ZodType<ParticipationData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; componentId: string }> },
    data: ParticipationData,
    respond
  ) => {
    const { spaceId, componentId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId || !componentId) {
      return respond.error("Space ID and Component ID are required", "INVALID_INPUT", { status: 400 });
    }

    // Create the chat service with DDD repositories
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    const result = await chatService.submitParticipation(userId, {
      spaceId,
      componentId,
      participation: {
        selectedOptions: data.selectedOptions,
        response: data.response,
        data: data.data,
      },
    });

    if (result.isFailure) {
      const errorMsg = result.error ?? "Failed to submit participation";

      if (errorMsg.includes('not found')) {
        return respond.error(errorMsg, "NOT_FOUND", { status: 404 });
      }
      if (errorMsg.includes('members can participate') || errorMsg.includes('Access denied')) {
        return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
      }
      if (errorMsg.includes('active') || errorMsg.includes('closed') || errorMsg.includes('capacity')) {
        return respond.error(errorMsg, "COMPONENT_CLOSED", { status: 400 });
      }
      if (errorMsg.includes('No options') || errorMsg.includes('No response') || errorMsg.includes('only allows one')) {
        return respond.error(errorMsg, "VALIDATION_ERROR", { status: 400 });
      }

      return respond.error(errorMsg, "PARTICIPATION_FAILED", { status: 500 });
    }

    const displayState = result.getValue().data;

    logger.info('Participation submitted', {
      spaceId,
      componentId,
      userId,
      participationType: data.selectedOptions ? 'poll' : data.response ? 'rsvp' : 'custom',
    });

    return respond.success({
      component: displayState,
      message: "Participation recorded successfully",
    });
  }
);
