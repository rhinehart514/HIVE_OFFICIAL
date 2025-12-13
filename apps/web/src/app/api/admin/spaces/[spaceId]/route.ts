/**
 * Admin Space Operations API Routes
 *
 * Platform-level operations for a specific space:
 * - GET: Get full space details (admin view, includes moderation info)
 * - PATCH: Modify space (disable/enable, verify/unverify)
 * - DELETE: Permanently delete space (super_admin only)
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { getAdminRecord, hasAdminRole } from '@/lib/admin-auth';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { SpaceManagementService, toSpaceDetailDTO } from '@hive/core';
import { getServerSpaceRepository } from '@hive/core/server';

type RouteContext = { params: Promise<{ spaceId: string }> };

// PATCH body schema for admin actions
const AdminActionSchema = z.object({
  action: z.enum(['disable', 'enable', 'verify', 'unverify']),
  reason: z.string().optional(),
});

/**
 * GET /api/admin/spaces/[spaceId]
 * Get full space details with admin metadata
 */
export const GET = withAuthAndErrors(async (
  request,
  context: RouteContext,
  respond
) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await context.params;

  // Check admin permission (viewer level is sufficient for read)
  const adminRecord = await getAdminRecord(adminId);
  if (!adminRecord) {
    return respond.error('Admin access required', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  try {
    // Create service with admin context
    const spaceRepo = getServerSpaceRepository();
    const service = new SpaceManagementService(
      { campusId: CURRENT_CAMPUS_ID, userId: adminId },
      spaceRepo
    );

    const result = await service.adminGetSpace(spaceId);

    if (result.isFailure) {
      return respond.error(result.error ?? 'Space not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const serviceResult = result.getValue();
    const space = serviceResult.data;

    type SpaceWithModeration = { props?: { moderationInfo?: unknown } };
    const moderationInfo = (space as unknown as SpaceWithModeration).props?.moderationInfo;

    // Transform to DTO with admin metadata
    const spaceDTO = {
      ...toSpaceDetailDTO(space),
      isActive: space.isActive,
      moderationInfo,
      internalMetrics: {
        memberCount: space.memberCount,
        trendingScore: space.trendingScore,
        postCount: space.postCount,
      },
    };

    return respond.success({ space: spaceDTO });
  } catch (error) {
    logger.error('Admin get space failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      spaceId,
    });
    return respond.error('Failed to get space', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * PATCH /api/admin/spaces/[spaceId]
 * Perform admin action on space (disable, enable, verify, unverify)
 */
export const PATCH = withAuthValidationAndErrors(
  AdminActionSchema,
  async (
    request,
    context: RouteContext,
    body: z.infer<typeof AdminActionSchema>,
    respond
  ) => {
    const adminId = getUserId(request as AuthenticatedRequest);
    const { spaceId } = await context.params;

    // Check admin permission (moderator level required for actions)
    const adminRecord = await getAdminRecord(adminId);
    if (!adminRecord || !hasAdminRole(adminRecord.role, 'moderator')) {
      return respond.error('Moderator access required', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    const { action, reason } = body;

    try {
      // Create service with admin context
      const spaceRepo = getServerSpaceRepository();
      const service = new SpaceManagementService(
        { campusId: CURRENT_CAMPUS_ID, userId: adminId },
        spaceRepo
      );

      let result;

      switch (action) {
        case 'disable':
          result = await service.adminDisableSpace(adminId, spaceId, reason);
          break;
        case 'enable':
          result = await service.adminEnableSpace(adminId, spaceId);
          break;
        case 'verify':
          result = await service.adminVerifySpace(adminId, spaceId);
          break;
        case 'unverify':
          result = await service.adminUnverifySpace(adminId, spaceId, reason);
          break;
        default:
          return respond.error('Invalid action', 'VALIDATION_ERROR', {
            status: HttpStatus.BAD_REQUEST,
          });
      }

      if (result.isFailure) {
        return respond.error(result.error ?? 'Action failed', 'INTERNAL_ERROR', {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }

      const serviceResult = result.getValue();

      logger.info(`Admin ${action} space`, {
        spaceId,
        adminId,
        adminRole: adminRecord.role,
        reason,
      });

      return respond.success({
        message: `Space ${action}d successfully`,
        ...serviceResult.data,
      });
    } catch (error) {
      logger.error(`Admin ${action} space failed`, {
        error: error instanceof Error ? error.message : String(error),
        adminId,
        spaceId,
        action,
      });
      return respond.error('Action failed', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

/**
 * DELETE /api/admin/spaces/[spaceId]
 * Permanently delete a space (super_admin only, irreversible)
 */
export const DELETE = withAuthAndErrors(async (
  request,
  context: RouteContext,
  respond
) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { spaceId: _spaceId } = await context.params;

  // Check super_admin permission (permanent deletion requires highest level)
  const adminRecord = await getAdminRecord(adminId);
  if (!adminRecord || !hasAdminRole(adminRecord.role, 'super_admin')) {
    return respond.error('Super admin access required for permanent deletion', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  // For now, we only support soft delete via PATCH disable
  // Permanent deletion is a destructive operation that should be rare
  return respond.error(
    'Permanent deletion not implemented. Use PATCH with action=disable for soft delete.',
    'NOT_IMPLEMENTED',
    { status: HttpStatus.NOT_IMPLEMENTED }
  );
});
