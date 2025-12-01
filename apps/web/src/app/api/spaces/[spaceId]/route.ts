import { z } from "zod";
import {
  getServerSpaceRepository,
  createServerSpaceManagementService,
  toSpaceDetailDTO,
} from "@hive/core/server";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { logger } from "@/lib/structured-logger";
import { withAuthAndErrors, withAuthValidationAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";

const UpdateSpaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  bannerUrl: z.string().url().optional(),
  tags: z.array(z.object({
    type: z.string(),
    sub_type: z.string()
  })).optional(),
  settings: z.object({
    allowMemberPosts: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    allowGuestView: z.boolean().optional(),
    maxMembers: z.number().min(1).max(10000).optional()
  }).optional()
});

// Using unified toSpaceDetailDTO from @hive/core/server

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

  logger.info(`Space fetched: ${spaceId}`, { spaceId, endpoint: "/api/spaces/[spaceId]" });

  return respond.success(toSpaceDetailDTO(space));
});

// PATCH /api/spaces/[spaceId] - Update space settings
// Now uses DDD SpaceManagementService for all mutations
type UpdateSpaceData = z.infer<typeof UpdateSpaceSchema>;

export const PATCH = withAuthValidationAndErrors(
  UpdateSpaceSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    updates: UpdateSpaceData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    const updateKeys = Object.keys(updates);
    if (updateKeys.length === 0) {
      return respond.error("No updates provided", "INVALID_INPUT", { status: 400 });
    }

    // Use DDD SpaceManagementService for space updates
    // This enforces business rules through the aggregate and emits domain events
    const spaceService = createServerSpaceManagementService(
      { userId, campusId: CURRENT_CAMPUS_ID }
    );

    // Map incoming request to service input
    // Note: bannerUrl and tags are not yet supported in DDD - they would need
    // to be added to the aggregate if needed
    const result = await spaceService.updateSpace(userId, {
      spaceId,
      name: updates.name,
      description: updates.description,
      settings: updates.settings ? {
        allowInvites: undefined, // Not in current schema
        requireApproval: updates.settings.requireApproval,
        allowRSS: undefined, // Not in current schema
        maxMembers: updates.settings.maxMembers
      } : undefined
    });

    if (result.isFailure) {
      // Map DDD error messages to appropriate HTTP status codes
      const errorMessage = result.error ?? 'Unknown error';

      if (errorMessage.includes('not found')) {
        return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
      }
      if (errorMessage.includes('permission') || errorMessage.includes('leader')) {
        return respond.error("Insufficient permissions to update space", "FORBIDDEN", { status: 403 });
      }
      if (errorMessage.includes('Invalid')) {
        return respond.error(errorMessage, "INVALID_INPUT", { status: 400 });
      }

      return respond.error(errorMessage, "UPDATE_FAILED", { status: 500 });
    }

    const space = result.getValue().data;

    logger.info(`Space updated via DDD: ${spaceId} by ${userId}`, { updates: updateKeys });

    return respond.success({
      message: "Space updated successfully",
      space: toSpaceDetailDTO(space),
      updates: updateKeys
    });
  }
);
