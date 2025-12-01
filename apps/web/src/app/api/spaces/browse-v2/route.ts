/**
 * Spaces Browse API Route V2
 * Uses DDD repository layer for space discovery
 */

import {
  getServerSpaceRepository,
  getServerProfileRepository,
  toSpaceBrowseDTOList,
} from '@hive/core/server';
import { logger } from '@/lib/structured-logger';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';

// Using unified toSpaceBrowseDTOList from @hive/core/server

/**
 * GET /api/spaces/browse-v2 - Browse/discover spaces
 *
 * Query params:
 *   category: filter by category (or 'all')
 *   sort: 'trending' | 'recommended' | 'newest' | 'popular'
 *   limit: max results (default 20)
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'trending';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  logger.info('Browse spaces request', {
    category,
    sort,
    limit,
    userId,
    endpoint: '/api/spaces/browse-v2'
  });

  const spaceRepo = getServerSpaceRepository();
  const profileRepo = getServerProfileRepository();

  // Get spaces based on sort/filter
  let spacesResult;

  if (sort === 'trending') {
    spacesResult = await spaceRepo.findTrending(CURRENT_CAMPUS_ID, limit);
  } else if (sort === 'recommended') {
    // Get user profile for personalized recommendations
    const profileResult = await profileRepo.findById(userId);
    const interests: string[] = [];
    let major: string | undefined;

    if (profileResult.isSuccess) {
      const profile = profileResult.getValue();
      // Extract interests and major from profile
      // Note: Profile value objects may need accessors
    }

    spacesResult = await spaceRepo.findRecommended(CURRENT_CAMPUS_ID, interests, major);
  } else if (sort === 'newest') {
    // findByCampus orders by memberCount desc, but we want newest
    // For now, use findByCampus and sort client-side
    spacesResult = await spaceRepo.findByCampus(CURRENT_CAMPUS_ID, limit);
  } else if (category !== 'all') {
    spacesResult = await spaceRepo.findByCategory(category, CURRENT_CAMPUS_ID);
  } else {
    spacesResult = await spaceRepo.findByCampus(CURRENT_CAMPUS_ID, limit);
  }

  if (spacesResult.isFailure) {
    logger.error('Failed to browse spaces', { error: spacesResult.error });
    return respond.error('Failed to load spaces', 'INTERNAL_ERROR', { status: 500 });
  }

  const spaces = spacesResult.getValue();

  // Get user's joined spaces to mark them
  const userSpacesResult = await spaceRepo.findUserSpaces(userId);
  const userSpaceIds = new Set(
    userSpacesResult.isSuccess
      ? userSpacesResult.getValue().map(s => s.spaceId.value)
      : []
  );

  // Transform spaces for API response using unified DTO presenter
  const transformedSpaces = toSpaceBrowseDTOList(spaces, userSpaceIds);

  // Sort by newest if requested (repository doesn't support this sort)
  if (sort === 'newest') {
    transformedSpaces.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Create response with cache headers
  const response = respond.success({
    spaces: transformedSpaces.slice(0, limit),
    totalCount: transformedSpaces.length,
    hasMore: transformedSpaces.length === limit
  });

  // Add cache headers for better performance
  // Cache for 60 seconds on edge, allow stale-while-revalidate for 5 minutes
  if (response instanceof Response) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  return response;
});
