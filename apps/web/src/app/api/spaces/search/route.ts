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
    const userSpacesResult = await spaceRepo.findUserSpaces(userId);
    const leaderSpaceIds = new Set<string>();
    if (userSpacesResult.isSuccess) {
      for (const space of userSpacesResult.getValue()) {
        const member = space.members.find(m => m.profileId.value === userId);
        if (member && (member.role === 'owner' || member.role === 'admin')) {
          leaderSpaceIds.add(space.spaceId.value);
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

    // Get user's memberships to mark joined spaces (reusing the earlier query)
    const userSpaceIds = new Set(
      userSpacesResult.isSuccess
        ? userSpacesResult.getValue().map(s => s.spaceId.value)
        : []
    );

    // Paginate
    const paginatedSpaces = scoredSpaces.slice(offset, offset + limit);

    // Fetch creator info for results (batch lookup)
    const creatorCache = new Map<string, { id: string; name: string; avatar: string | null }>();

    for (const { space } of paginatedSpaces) {
      const creatorId = space.owner.value;
      if (creatorId && !creatorCache.has(creatorId)) {
        try {
          const creatorDoc = await dbAdmin.collection('users').doc(creatorId).get();
          if (creatorDoc.exists) {
            const data = creatorDoc.data();
            creatorCache.set(creatorId, {
              id: creatorDoc.id,
              name: data?.fullName || data?.displayName || 'Unknown',
              avatar: data?.photoURL || null,
            });
          }
        } catch {
          // Ignore creator lookup failures
        }
      }
    }

    // Transform results
    const results = paginatedSpaces.map(({ space, score, highlights }) =>
      transformSearchResult(
        space,
        score,
        highlights,
        userSpaceIds.has(space.spaceId.value),
        creatorCache.get(space.owner.value) || null
      )
    );

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
    });
  }
);
