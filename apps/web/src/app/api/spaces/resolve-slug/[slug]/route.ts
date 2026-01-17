/**
 * Resolve Slug API - GET endpoint to resolve space slug to ID
 *
 * Public endpoint with rate limiting for URL resolution:
 * - GET: Resolve slug or legacy ID to space ID
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { getServerSpaceRepository } from '@hive/core/server';
import { logger } from '@/lib/structured-logger';
import { withErrors } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { getDefaultCampusId } from '@/lib/campus-context';

// ============================================================
// GET - Resolve slug to space ID (public with rate limiting)
// ============================================================

export const GET = withErrors(async (
  request,
  { params }: { params: Promise<{ slug: string }> },
  respond,
) => {
  const { slug } = await params;

  if (!slug) {
    return respond.error('Slug parameter is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Note: This is a public endpoint, so we use the default campus for now
  // In a multi-campus scenario, we'd need to pass the campus in the request or infer from domain
  const campusId = getDefaultCampusId();

  try {
    const spaceRepo = getServerSpaceRepository();

    // First try to resolve as a slug
    const slugResult = await spaceRepo.findBySlug(slug, campusId);

    if (slugResult.isSuccess) {
      const space = slugResult.getValue();
      return respond.success({
        spaceId: space.spaceId.value,
        slug: space.slug?.value || slug,
        found: true,
      });
    }

    // If no slug match, try to resolve as legacy space ID
    // This handles the case where old URLs with IDs are redirected here
    const idResult = await spaceRepo.findById(slug);

    if (idResult.isSuccess) {
      const space = idResult.getValue();
      // Verify campus isolation (handle legacy spaces without campusId)
      const spaceCampusId = space.campusId?.id;
      if (!spaceCampusId || spaceCampusId === campusId) {
        // Log warning for spaces missing campusId
        if (!spaceCampusId) {
          logger.warn('Space found without campusId - legacy data', {
            spaceId: space.spaceId.value,
            slug,
          });
        }
        return respond.success({
          spaceId: space.spaceId.value,
          slug: space.slug?.value || slug,
          found: true,
          isLegacyId: true,
        });
      }
    }

    // Space not found
    return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
  } catch (error) {
    logger.error('Error resolving space slug', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      endpoint: '/api/spaces/resolve-slug/[slug]',
    });
    return respond.error('Failed to resolve slug', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

// Handle legacy space ID redirects too
export const POST = withErrors(async (
  request,
  { params }: { params: Promise<{ slug: string }> },
  respond,
) => {
  // Delegate to GET handler logic
  const { slug } = await params;

  if (!slug) {
    return respond.error('Slug parameter is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  const campusId = getDefaultCampusId();

  try {
    const spaceRepo = getServerSpaceRepository();

    const slugResult = await spaceRepo.findBySlug(slug, campusId);
    if (slugResult.isSuccess) {
      const space = slugResult.getValue();
      return respond.success({
        spaceId: space.spaceId.value,
        slug: space.slug?.value || slug,
        found: true,
      });
    }

    const idResult = await spaceRepo.findById(slug);
    if (idResult.isSuccess) {
      const space = idResult.getValue();
      // Handle legacy spaces without campusId
      const spaceCampusId = space.campusId?.id;
      if (!spaceCampusId || spaceCampusId === campusId) {
        return respond.success({
          spaceId: space.spaceId.value,
          slug: space.slug?.value || slug,
          found: true,
          isLegacyId: true,
        });
      }
    }

    return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
  } catch (error) {
    logger.error('Error resolving space slug', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      endpoint: '/api/spaces/resolve-slug/[slug]',
    });
    return respond.error('Failed to resolve slug', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});
