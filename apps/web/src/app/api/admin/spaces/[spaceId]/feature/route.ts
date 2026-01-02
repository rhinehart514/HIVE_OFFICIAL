/**
 * Admin Space Feature API
 *
 * POST: Feature or unfeature a space for discovery
 *
 * This is a P0 cross-slice integration endpoint that connects Admin with Spaces/Discovery.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';

type RouteContext = { params: Promise<{ spaceId: string }> };

const FeatureSchema = z.object({
  featured: z.boolean(),
  featuredRank: z.number().int().min(1).max(100).optional(),
  featuredReason: z.string().max(200).optional(),
  featuredCategory: z.string().optional(),
  featuredUntil: z.string().datetime().optional(), // ISO date string
});

/**
 * POST /api/admin/spaces/[spaceId]/feature
 * Feature or unfeature a space
 */
export const POST = withAdminAuthAndErrors(async (request, context: RouteContext, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await context.params;

  try {
    const body = await request.json();
    const parseResult = FeatureSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const { featured, featuredRank, featuredReason, featuredCategory, featuredUntil } = parseResult.data;

    // Verify space exists
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    const spaceDoc = await spaceRef.get();

    if (!spaceDoc.exists) {
      return respond.error('Space not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const spaceData = spaceDoc.data();

    // Update the space
    const updateData: Record<string, unknown> = {
      isFeatured: featured,
      updatedAt: new Date(),
    };

    if (featured) {
      updateData.featuredAt = new Date();
      updateData.featuredBy = adminId;
      if (featuredRank !== undefined) updateData.featuredRank = featuredRank;
      if (featuredReason) updateData.featuredReason = featuredReason;
      if (featuredCategory) updateData.featuredCategory = featuredCategory;
      if (featuredUntil) updateData.featuredUntil = new Date(featuredUntil);
    } else {
      // Clear featured fields when unfeaturing
      updateData.featuredAt = null;
      updateData.featuredBy = null;
      updateData.featuredRank = null;
      updateData.featuredReason = null;
      updateData.featuredCategory = null;
      updateData.featuredUntil = null;
      updateData.unfeaturedAt = new Date();
      updateData.unfeaturedBy = adminId;
    }

    await spaceRef.update(updateData);

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: featured ? 'space_featured' : 'space_unfeatured',
      targetType: 'space',
      targetId: spaceId,
      details: {
        spaceName: spaceData?.name,
        spaceHandle: spaceData?.handle,
        featuredRank,
        featuredReason,
        featuredCategory,
        featuredUntil,
      },
    });

    logger.info(`Space ${featured ? 'featured' : 'unfeatured'}`, {
      adminId,
      spaceId,
      spaceName: spaceData?.name,
    });

    return respond.success({
      message: `Space ${featured ? 'featured' : 'unfeatured'} successfully`,
      space: {
        id: spaceId,
        name: spaceData?.name,
        handle: spaceData?.handle,
        isFeatured: featured,
        featuredRank: featured ? featuredRank : null,
      },
    });
  } catch (error) {
    logger.error('Failed to update space feature status', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      spaceId,
    });
    return respond.error('Failed to update space feature status', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
