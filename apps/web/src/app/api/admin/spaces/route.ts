/**
 * Admin Spaces API Routes
 *
 * Platform-level space administration endpoints:
 * - GET: List all spaces with admin filters (includes disabled)
 * - No POST here - space creation is via /api/spaces
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { getAdminRecord, hasAdminRole } from '@/lib/admin-auth';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { SpaceManagementService, toSpaceBrowseDTO } from '@hive/core';
import { getServerSpaceRepository } from '@hive/core/server';

// Query params schema
const ListQuerySchema = z.object({
  includeDisabled: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  onlyUnverified: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  category: z.string().optional(),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

/**
 * GET /api/admin/spaces
 * List all spaces with admin-level filters
 */
export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);

  // Check admin permission
  const adminRecord = await getAdminRecord(adminId);
  if (!adminRecord || !hasAdminRole(adminRecord.role, 'moderator')) {
    return respond.error('Admin access required', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  const { searchParams } = new URL(request.url);
  const queryResult = ListQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Create service with admin context
    const spaceRepo = getServerSpaceRepository();
    const service = new SpaceManagementService(
      { campusId: CURRENT_CAMPUS_ID, userId: adminId },
      spaceRepo
    );

    const result = await service.adminListSpaces({
      includeDisabled: query.includeDisabled,
      onlyUnverified: query.onlyUnverified,
      category: query.category,
      limit: query.limit,
      offset: query.offset,
    });

    if (result.isFailure) {
      return respond.error(result.error ?? 'Failed to list spaces', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    const serviceResult = result.getValue();
    const spaces = serviceResult.data;

    // Transform to DTOs with admin metadata
    const spaceDTOs = spaces.map(space => ({
      ...toSpaceBrowseDTO(space, false), // isJoined=false for admin view
      isActive: space.isActive,
      moderationInfo: (space as any).props?.moderationInfo,
    }));

    return respond.success({
      spaces: spaceDTOs,
      summary: {
        total: spaceDTOs.length,
        disabled: spaceDTOs.filter(s => !s.isActive).length,
        verified: spaceDTOs.filter(s => s.isVerified).length,
        unverified: spaceDTOs.filter(s => !s.isVerified).length,
      },
      pagination: serviceResult.metadata,
    });
  } catch (error) {
    logger.error('Admin spaces list failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
    });
    return respond.error('Failed to list spaces', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
