import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { getServerSpaceRepository, type EnhancedSpace } from "@hive/core/server";
import { logger } from "@/lib/structured-logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";

const SearchSpacesSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  // Use canonical categories: student_org, university_org, greek_life, residential
  category: z
    .enum(["student_org", "university_org", "greek_life", "residential"])
    .optional(),
  verified: z.coerce.boolean().optional(),
  minMembers: z.coerce.number().min(0).optional(),
  maxMembers: z.coerce.number().min(0).optional(),
  sortBy: z
    .enum(["relevance", "members", "activity", "created"])
    .default("relevance"),
});

/**
 * Calculate relevance score for a space based on search query
 */
function calculateRelevance(
  space: EnhancedSpace,
  queryLower: string
): { score: number; highlights: { name: string[]; description: string[]; tags: string[] } } {
  const name = space.name.value.toLowerCase();
  const description = space.description.value.toLowerCase();

  const nameMatch = name.includes(queryLower);
  const descriptionMatch = description.includes(queryLower);

  let score = 0;
  const highlights = { name: [] as string[], description: [] as string[], tags: [] as string[] };

  if (nameMatch) {
    score += name === queryLower ? 100 : 80;
    highlights.name = [space.name.value];
  }

  if (descriptionMatch) {
    score += 60;
    // Extract context around match
    const matchIndex = description.indexOf(queryLower);
    if (matchIndex >= 0) {
      const start = Math.max(0, matchIndex - 30);
      const end = Math.min(description.length, matchIndex + queryLower.length + 30);
      highlights.description = [space.description.value.substring(start, end)];
    }
  }

  // Verified spaces get a boost
  if (space.isVerified) {
    score += 20;
  }

  // Member count gives a small boost
  score += Math.min(20, space.memberCount / 10);

  return { score, highlights };
}

/**
 * Transform EnhancedSpace to search result format
 */
function transformSearchResult(
  space: EnhancedSpace,
  relevanceScore: number,
  highlights: { name: string[]; description: string[]; tags: string[] },
  isMember: boolean,
  creator: { id: string; name: string; avatar: string | null } | null
) {
  return {
    id: space.spaceId.value,
    name: space.name.value,
    slug: space.slug?.value,
    description: space.description.value,
    type: space.category.value,
    tags: [], // Tags not currently on aggregate
    memberCount: space.memberCount,
    isVerified: space.isVerified,
    isPrivate: !space.isPublic,
    createdAt: space.createdAt.toISOString(),
    creator,
    isMember,
    relevanceScore,
    highlights,
  };
}

/**
 * POST /api/spaces/search - Search spaces with advanced filtering
 *
 * Uses DDD repository's searchSpaces as base, then applies
 * additional filtering and relevance scoring.
 */
export const POST = withAuthValidationAndErrors(
  SearchSpacesSchema,
  async (request, _context, searchParams, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const {
      query,
      limit = 20,
      offset = 0,
      category,
      verified,
      minMembers,
      maxMembers,
      sortBy,
    } = searchParams;

    logger.info('Space search request', {
      query,
      limit,
      offset,
      category,
      sortBy,
      userId,
      endpoint: '/api/spaces/search'
    });

    const spaceRepo = getServerSpaceRepository();
    const queryLower = query.toLowerCase();

    // Use repository search as base
    const searchResult = await spaceRepo.searchSpaces(query, campusId);

    if (searchResult.isFailure) {
      logger.error('Search failed', { error: searchResult.error });
      return respond.error('Failed to search spaces', 'INTERNAL_ERROR', { status: 500 });
    }

    let spaces = searchResult.getValue();

    // Get user's spaces to check if they're a leader (for stealth mode visibility)
    // SCALING FIX: Use lightweight membership query instead of loading full spaces
    const membershipsResult = await spaceRepo.findUserMemberships(userId);
    const leaderSpaceIds = new Set<string>();
    const userSpaceIds = new Set<string>();
    if (membershipsResult.isSuccess) {
      for (const membership of membershipsResult.getValue()) {
        userSpaceIds.add(membership.spaceId);
        if (membership.role === 'owner' || membership.role === 'admin') {
          leaderSpaceIds.add(membership.spaceId);
        }
      }
    }

    // Filter out stealth spaces (unless user is a leader of that space)
    spaces = spaces.filter(space => {
      if (space.isLive) return true;
      if (space.isStealth && leaderSpaceIds.has(space.spaceId.value)) return true;
      return false;
    });

    // Apply additional filters
    if (category) {
      spaces = spaces.filter(s => s.category.value === category);
    }

    if (verified !== undefined) {
      spaces = spaces.filter(s => s.isVerified === verified);
    }

    if (minMembers !== undefined) {
      spaces = spaces.filter(s => s.memberCount >= minMembers);
    }

    if (maxMembers !== undefined) {
      spaces = spaces.filter(s => s.memberCount <= maxMembers);
    }

    // Calculate relevance scores
    const scoredSpaces = spaces.map(space => {
      const { score, highlights } = calculateRelevance(space, queryLower);
      return { space, score, highlights };
    });

    // Sort based on sortBy param
    scoredSpaces.sort((a, b) => {
      switch (sortBy) {
        case "members":
          return b.space.memberCount - a.space.memberCount;
        case "activity":
          return b.space.lastActivityAt.getTime() - a.space.lastActivityAt.getTime();
        case "created":
          return b.space.createdAt.getTime() - a.space.createdAt.getTime();
        case "relevance":
        default:
          return b.score - a.score;
      }
    });

    // NOTE: userSpaceIds is now computed above with membershipsResult

    // Paginate
    const paginatedSpaces = scoredSpaces.slice(offset, offset + limit);

    // SCALING FIX: Batch fetch creator info instead of N+1 queries
    // Collect unique creator IDs first, then batch fetch
    const creatorIds = [...new Set(
      paginatedSpaces
        .map(({ space }) => space.owner?.value)
        .filter((id): id is string => !!id)
    )];

    const creatorCache = new Map<string, { id: string; name: string; avatar: string | null }>();

    if (creatorIds.length > 0) {
      try {
        // Batch fetch all creators in one query
        const creatorRefs = creatorIds.map(id => dbAdmin.collection('users').doc(id));
        const creatorDocs = await dbAdmin.getAll(...creatorRefs);

        for (const doc of creatorDocs) {
          if (doc.exists) {
            const data = doc.data();
            creatorCache.set(doc.id, {
              id: doc.id,
              name: data?.fullName || data?.displayName || 'Unknown',
              avatar: data?.photoURL || null,
            });
          }
        }
      } catch {
        // Ignore creator lookup failures - cache will be empty
      }
    }

    // Transform results
    const results = paginatedSpaces.map(({ space, score, highlights }) =>
      transformSearchResult(
        space,
        score,
        highlights,
        userSpaceIds.has(space.spaceId.value),
        (space.owner?.value ? creatorCache.get(space.owner.value) : null) || null
      )
    );

    // SCALING FIX: Add cache headers for Vercel Edge caching
    // Search results are cacheable for 60s with stale-while-revalidate for 5 minutes
    return respond.success({
      spaces: results,
      total: scoredSpaces.length,
      hasMore: scoredSpaces.length > offset + limit,
      pagination: {
        limit,
        offset,
        nextOffset: scoredSpaces.length > offset + limit ? offset + limit : null,
      },
      query: {
        ...searchParams,
        executedAt: new Date().toISOString(),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  }
);
