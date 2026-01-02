/**
 * Spaces Browse API Route V2
 * Uses DDD repository layer for space discovery
 */

import { z } from 'zod';
import {
  getServerSpaceRepository,
  getServerProfileRepository,
  toSpaceBrowseDTOList,
} from '@hive/core/server';
import { logger } from '@/lib/structured-logger';
import { withOptionalAuth } from '@/lib/middleware';

// Using unified toSpaceBrowseDTOList from @hive/core/server

/**
 * Zod schema for browse query params validation
 * Supports cursor-based pagination via 'cursor' param
 */
const BrowseQuerySchema = z.object({
  category: z.string().max(50).default('all'),
  sort: z.enum(['trending', 'recommended', 'newest', 'popular']).default('trending'),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(), // Cursor for pagination (spaceId to start after)
});

/**
 * GET /api/spaces/browse-v2 - Browse/discover spaces
 *
 * Query params:
 *   category: filter by category (or 'all')
 *   sort: 'trending' | 'recommended' | 'newest' | 'popular'
 *   limit: max results (default 20)
 *
 * Note: This endpoint uses optional auth to support both authenticated
 * users and unauthenticated browsing (e.g., during onboarding).
 */
export const GET = withOptionalAuth(async (request, _context, respond) => {
  // Extract auth info if available (attached by withOptionalAuth)
  const user = (request as { user?: { uid?: string; campusId?: string } }).user;
  const userId = user?.uid || null;
  const campusId = user?.campusId || 'ub-buffalo'; // Default to UB for unauthenticated
  const { searchParams } = new URL(request.url);

  // Validate and parse query params
  const parseResult = BrowseQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );

  if (!parseResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: 400,
      details: parseResult.error.flatten()
    });
  }

  const { category, sort, limit, cursor } = parseResult.data;

  logger.info('Browse spaces request', {
    category,
    sort,
    limit,
    cursor,
    userId: userId ?? undefined,
    endpoint: '/api/spaces/browse-v2'
  });

  const spaceRepo = getServerSpaceRepository();
  const profileRepo = getServerProfileRepository();

  // Get spaces based on sort/filter
  // Strategy: Fetch spaces, then apply category filter + sort
  let spacesResult;

  // If filtering by category, use findByCategory (it's already optimized)
  // Then we'll sort the results client-side
  if (category !== 'all') {
    spacesResult = await spaceRepo.findByCategory(category, campusId);
  } else if (sort === 'recommended') {
    // Get user profile for personalized recommendations (if authenticated)
    const interests: string[] = [];
    let major: string | undefined;

    if (userId) {
      const profileResult = await profileRepo.findById(userId);
      if (profileResult.isSuccess) {
        // Extract interests and major from profile
        // Note: Profile value objects may need accessors
        // TODO: Implement when profile interest accessors are available
      }
    }

    spacesResult = await spaceRepo.findRecommended(campusId, interests, major);
  } else if (sort === 'trending') {
    // SCALING FIX: Removed 2x multiplier - fetch only what we need
    spacesResult = await spaceRepo.findTrending(campusId, Math.min(limit, 50));
  } else {
    // SCALING FIX: Removed 2x multiplier - fetch only what we need
    spacesResult = await spaceRepo.findByCampus(campusId, Math.min(limit, 50));
  }

  if (spacesResult.isFailure) {
    logger.error('Failed to browse spaces', { error: spacesResult.error });
    return respond.error('Failed to load spaces', 'INTERNAL_ERROR', { status: 500 });
  }

  const spaces = spacesResult.getValue();

  // Get user's joined spaces to mark them (only if authenticated)
  // SCALING FIX: Use lightweight membership query instead of loading full spaces
  // This prevents N+1: was loading 100 spaces × 500 members = 50K records
  // Now loads only 100 membership records (spaceId + role)
  const userSpaceIds = new Set<string>();
  const leaderSpaceIds = new Set<string>();

  if (userId) {
    const membershipsResult = await spaceRepo.findUserMemberships(userId);
    if (membershipsResult.isSuccess) {
      for (const membership of membershipsResult.getValue()) {
        userSpaceIds.add(membership.spaceId);
        // Check if user is a leader (owner or admin)
        if (membership.role === 'owner' || membership.role === 'admin') {
          leaderSpaceIds.add(membership.spaceId);
        }
      }
    }
  }

  // Filter spaces based on publish status:
  // - Show all 'live' spaces
  // - Only show 'stealth' spaces if user is a leader of that space
  // - Never show 'rejected' spaces in browse
  const visibleSpaces = spaces.filter(space => {
    if (space.isLive) return true;
    if (space.isStealth && leaderSpaceIds.has(space.spaceId.value)) return true;
    return false;
  });

  // Transform spaces for API response using unified DTO presenter
  const transformedSpaces = toSpaceBrowseDTOList(visibleSpaces, userSpaceIds);

  // Apply sorting based on sort parameter
  // This handles all sort types including when category filter is applied
  if (sort === 'newest') {
    transformedSpaces.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sort === 'trending' || sort === 'popular') {
    // Sort by trending score (falls back to member count)
    transformedSpaces.sort((a, b) => {
      // Primary: member count (proxy for trending/popular)
      const memberDiff = (b.memberCount || 0) - (a.memberCount || 0);
      if (memberDiff !== 0) return memberDiff;
      // Secondary: alphabetical
      return a.name.localeCompare(b.name);
    });
  }
  // 'recommended' sort is already handled by repository query

  // Apply cursor-based pagination
  let paginatedSpaces = transformedSpaces;
  if (cursor) {
    const cursorIndex = transformedSpaces.findIndex(s => s.id === cursor);
    if (cursorIndex !== -1) {
      paginatedSpaces = transformedSpaces.slice(cursorIndex + 1);
    }
  }

  // Apply limit
  const resultSpaces = paginatedSpaces.slice(0, limit);
  const hasMore = paginatedSpaces.length > limit;
  const nextCursor = hasMore && resultSpaces.length > 0
    ? resultSpaces[resultSpaces.length - 1]?.id
    : undefined;

  // Create response with cache headers
  const response = respond.success({
    spaces: resultSpaces,
    totalCount: transformedSpaces.length,
    hasMore,
    nextCursor
  });

  // Add cache headers for better performance
  // Cache for 60 seconds on edge, allow stale-while-revalidate for 5 minutes
  if (response instanceof Response) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  return response;
});
