import { z } from "zod";
import {
  getServerSpaceRepository,
  createServerSpaceManagementService,
  toSpaceDetailDTO,
  toSpaceWithToolsDTO,
} from "@hive/core/server";
import { logger } from "@/lib/structured-logger";
import { withAuthAndErrors, withAuthValidationAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { SecurityScanner } from "@/lib/secure-input-validation";
import { checkSpacePermission, type SpaceRole } from "@/lib/space-permission-middleware";

const UpdateSpaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  bannerUrl: z.string().url().optional(),
  tags: z.array(z.object({
    type: z.string(),
    sub_type: z.string()
  })).optional(),
  settings: z.object({
    allowMemberPosts: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    allowGuestView: z.boolean().optional(),
    allowRSS: z.boolean().optional(),
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
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Use DDD repository for space lookup - load PlacedTools for full detail
  const spaceRepo = getServerSpaceRepository();
  const result = await spaceRepo.findById(spaceId, { loadPlacedTools: true });

  if (result.isFailure) {
    return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const space = result.getValue();

  // Enforce campus isolation
  if (space.campusId.id !== campusId) {
    return respond.error("Access denied - campus mismatch", "FORBIDDEN", { status: 403 });
  }

  // Fetch membership info for the current user using comprehensive permission check
  // This checks spaceMembers collection, leaders array, AND createdBy field
  let membership: {
    role: SpaceRole | undefined;
    status: 'active' | 'suspended' | 'inactive' | undefined;
    isActive: boolean;
    isLeader: boolean;
    joinedAt: Date | null;
  } | null = null;

  // DEBUG: Log userId before the check
  logger.info('[SPACE-ROUTE] Pre-membership check', { userId, spaceId, hasUserId: !!userId });

  if (userId) {
    // Use 'member' role to trigger the full membership lookup
    // If user doesn't have member role, we'll get hasPermission=false but still check for membership
    const permResult = await checkSpacePermission(spaceId, userId, 'member');

    // DEBUG: Log the full permission result to diagnose membership detection (v2)
    logger.info(`Permission check result for space ${spaceId}`, {
      userId,
      spaceId,
      hasPermission: permResult.hasPermission,
      code: permResult.code,
      error: permResult.error,
      hasMembershipData: !!permResult.membership,
      membershipRole: permResult.membership?.role,
      endpoint: "/api/spaces/[spaceId]"
    });

    // Check if user has membership data (even if not enough permission for 'member' role)
    if (permResult.membership) {
      const isLeaderRole = ['owner', 'admin', 'leader'].includes(permResult.membership.role);
      membership = {
        role: permResult.membership.role,
        status: permResult.membership.isSuspended ? 'suspended' : 'active',
        isActive: !permResult.membership.isSuspended,
        isLeader: isLeaderRole,
        joinedAt: permResult.membership.joinedAt,
      };
    } else if (permResult.hasPermission) {
      // User has permission (found via createdBy or leaders array) but no explicit membership doc
      // This means they're an owner/leader without a spaceMembers document
      membership = {
        role: 'owner' as SpaceRole,
        status: 'active',
        isActive: true,
        isLeader: true,
        joinedAt: null,
      };
    }

    // FALLBACK: If checkSpacePermission didn't find membership, check DDD space entity
    // This handles cases where Firestore data might be inconsistent with DDD model
    if (!membership) {
      const ownerId = space.owner.value;
      logger.info(`Fallback ownership check for space ${spaceId}`, {
        userId,
        ownerId,
        isOwner: ownerId === userId,
        endpoint: "/api/spaces/[spaceId]"
      });

      if (ownerId === userId) {
        membership = {
          role: 'owner' as SpaceRole,
          status: 'active',
          isActive: true,
          isLeader: true,
          joinedAt: null,
        };
      }
    }
  }

  logger.info(`Space fetched with tools: ${spaceId}`, {
    spaceId,
    toolCount: space.placedTools.length,
    hasMembership: !!membership,
    membershipRole: membership?.role,
    endpoint: "/api/spaces/[spaceId]"
  });

  // Return space data with membership info
  const spaceData = toSpaceWithToolsDTO(space);
  return respond.success({
    ...spaceData,
    membership,
    isMember: membership?.isActive ?? false,
    membershipRole: membership?.role,
  });
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
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    const updateKeys = Object.keys(updates);
    if (updateKeys.length === 0) {
      return respond.error("No updates provided", "INVALID_INPUT", { status: 400 });
    }

    // SECURITY: Scan name and description for XSS/injection attacks
    if (updates.name) {
      const nameScan = SecurityScanner.scanInput(updates.name);
      if (nameScan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in space name update", { userId, spaceId, threats: nameScan.threats });
        return respond.error("Space name contains invalid content", "INVALID_INPUT", { status: 400 });
      }
    }
    if (updates.description) {
      const descScan = SecurityScanner.scanInput(updates.description);
      if (descScan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in space description update", { userId, spaceId, threats: descScan.threats });
        return respond.error("Description contains invalid content", "INVALID_INPUT", { status: 400 });
      }
    }

    // Use DDD SpaceManagementService for space updates
    // This enforces business rules through the aggregate and emits domain events
    const spaceService = createServerSpaceManagementService(
      { userId, campusId }
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
        allowRSS: updates.settings.allowRSS,
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
