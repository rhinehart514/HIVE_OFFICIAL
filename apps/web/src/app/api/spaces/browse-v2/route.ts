/**
 * Spaces Browse API Route V2
 * Uses DDD repository layer for space discovery
 *
 * COLD START SIGNALS (Jan 2026):
 * Enriches browse results with:
 * - upcomingEventCount: Shows value without chat activity
 * - nextEvent: Creates urgency ("Tournament · Friday")
 * - mutualCount: Social proof ("2 friends are members")
 * - toolCount: Shows utility
 */

import { z } from 'zod';
import {
  getServerSpaceRepository,
  getServerProfileRepository,
  toSpaceBrowseDTOList,
  type SpaceBrowseEnrichment,
} from '@hive/core/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { withOptionalAuth } from '@/lib/middleware';
import { normalizeSpaceType } from '@/lib/space-rules-middleware';
import { getSpaceTypeRules } from '@/lib/space-type-rules';
import { isFeaturedSpace } from '@/lib/featured-spaces';

/**
 * Zod schema for browse query params validation
 * Supports cursor-based pagination via 'cursor' param
 * Supports full-text search via 'search' param
 */
const BrowseQuerySchema = z.object({
  category: z.string().max(50).default('all'),
  sort: z.enum(['trending', 'recommended', 'newest', 'popular']).default('trending'),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(), // Cursor for pagination (spaceId to start after)
  search: z.string().max(100).optional(), // Full-text search across name and description
  /** When true, show all spaces. Default false = only featured/curated spaces */
  showAll: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
});

/**
 * Fetch upcoming events for a set of spaces
 * Returns event counts and next event info per space
 */
async function fetchEventEnrichment(spaceIds: string[]): Promise<{
  eventCounts: Map<string, number>;
  nextEvents: Map<string, { title: string; startAt: Date }>;
}> {
  const eventCounts = new Map<string, number>();
  const nextEvents = new Map<string, { title: string; startAt: Date }>();

  if (spaceIds.length === 0) {
    return { eventCounts, nextEvents };
  }

  try {
    const now = new Date();

    // Query upcoming events for all visible spaces
    // Events are in flat 'events' collection with spaceId field
    const eventsSnapshot = await dbAdmin
      .collection('events')
      .where('spaceId', 'in', spaceIds.slice(0, 30)) // Firestore 'in' limit is 30
      .where('startAt', '>=', now)
      .where('status', '==', 'published')
      .orderBy('startAt', 'asc')
      .limit(100)
      .get();

    // Process events into maps
    for (const doc of eventsSnapshot.docs) {
      const data = doc.data();
      const spaceId = data.spaceId as string;
      const startAt = data.startAt?.toDate?.() ?? new Date(data.startAt);
      const title = data.title as string;

      // Increment count
      eventCounts.set(spaceId, (eventCounts.get(spaceId) ?? 0) + 1);

      // Set next event (first one wins due to orderBy)
      if (!nextEvents.has(spaceId)) {
        nextEvents.set(spaceId, { title, startAt });
      }
    }
  } catch (error) {
    logger.warn('Failed to fetch event enrichment', { error });
    // Non-fatal - return empty maps
  }

  return { eventCounts, nextEvents };
}

/**
 * Fetch mutual friends who are members of given spaces
 * Returns count and avatar URLs per space
 */
async function fetchMutualEnrichment(
  userId: string,
  spaceIds: string[]
): Promise<Map<string, { count: number; avatars: string[] }>> {
  const mutuals = new Map<string, { count: number; avatars: string[] }>();

  if (!userId || spaceIds.length === 0) {
    return mutuals;
  }

  try {
    // Step 1: Get user's connections (accepted)
    const [outgoing, incoming] = await Promise.all([
      dbAdmin
        .collection('connections')
        .where('fromProfileId', '==', userId)
        .where('status', '==', 'accepted')
        .get(),
      dbAdmin
        .collection('connections')
        .where('toProfileId', '==', userId)
        .where('status', '==', 'accepted')
        .get()
    ]);

    const connectionIds = new Set<string>();
    outgoing.docs.forEach(doc => {
      const toId = doc.data().toProfileId;
      if (toId) connectionIds.add(toId);
    });
    incoming.docs.forEach(doc => {
      const fromId = doc.data().fromProfileId;
      if (fromId) connectionIds.add(fromId);
    });

    if (connectionIds.size === 0) {
      return mutuals;
    }

    // Step 2: Find which connections are members of which spaces
    // Query spaceMembers for connection IDs
    const connectionIdArray = Array.from(connectionIds).slice(0, 30);
    const membershipsSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', 'in', connectionIdArray)
      .where('spaceId', 'in', spaceIds.slice(0, 10)) // Limit due to compound 'in' query
      .get();

    // Group by spaceId
    const spaceToMembers = new Map<string, { userId: string; avatarUrl?: string }[]>();
    for (const doc of membershipsSnapshot.docs) {
      const data = doc.data();
      const spaceId = data.spaceId as string;
      const userId = data.userId as string;

      if (!spaceToMembers.has(spaceId)) {
        spaceToMembers.set(spaceId, []);
      }
      spaceToMembers.get(spaceId)!.push({ userId, avatarUrl: data.avatarUrl });
    }

    // Step 3: Get avatar URLs for mutuals (up to 3 per space)
    for (const [spaceId, members] of spaceToMembers) {
      const avatars: string[] = [];
      for (const member of members.slice(0, 3)) {
        if (member.avatarUrl) {
          avatars.push(member.avatarUrl);
        } else {
          // Fetch from profile if not cached in membership
          try {
            const profileDoc = await dbAdmin.collection('profiles').doc(member.userId).get();
            const profileData = profileDoc.data();
            if (profileData?.avatarUrl) {
              avatars.push(profileData.avatarUrl);
            }
          } catch {
            // Skip if profile fetch fails
          }
        }
      }

      mutuals.set(spaceId, {
        count: members.length,
        avatars: avatars.slice(0, 3) // Max 3 avatars
      });
    }
  } catch (error) {
    logger.warn('Failed to fetch mutual enrichment', { error });
    // Non-fatal - return empty map
  }

  return mutuals;
}

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

  const { category, sort, limit, cursor, search, showAll } = parseResult.data;

  logger.info('Browse spaces request', {
    category,
    sort,
    limit,
    cursor,
    search,
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
  let visibleSpaces = spaces.filter(space => {
    const rawCategory =
      (space.category && 'value' in space.category
        ? String(space.category.value)
        : undefined) || 'hive_exclusive';
    const normalizedType = normalizeSpaceType(rawCategory);
    const discoverability = getSpaceTypeRules(normalizedType).visibility.spaceDiscoverable;
    const isMemberOrLeader = userSpaceIds.has(space.spaceId.value) || leaderSpaceIds.has(space.spaceId.value);
    if (!discoverability && !isMemberOrLeader) {
      return false;
    }

    if (space.isLive) return true;
    if (space.isStealth && leaderSpaceIds.has(space.spaceId.value)) return true;
    return false;
  });

  // Apply search filter if provided
  // Search across name and description (case-insensitive)
  if (search && search.trim().length > 0) {
    const searchLower = search.toLowerCase().trim();
    visibleSpaces = visibleSpaces.filter(space => {
      const name = space.name.value.toLowerCase();
      const description = space.description?.value?.toLowerCase() ?? '';
      return name.includes(searchLower) || description.includes(searchLower);
    });
  }

  // Featured filter: when not searching and not showAll, only show curated spaces
  // Search always shows all matching spaces (so users can find anything)
  if (!showAll && !search) {
    visibleSpaces = visibleSpaces.filter(space => {
      const slug = space.slug?.value;
      return isFeaturedSpace(slug);
    });
  }

  // Extract visible space IDs for enrichment queries
  const visibleSpaceIds = visibleSpaces.map(s => s.spaceId.value);

  // COLD START SIGNALS: Fetch event and mutual enrichment in parallel
  // These show value even when spaces have no chat activity
  const [eventEnrichment, mutualEnrichment] = await Promise.all([
    fetchEventEnrichment(visibleSpaceIds),
    userId ? fetchMutualEnrichment(userId, visibleSpaceIds) : Promise.resolve(new Map())
  ]);

  // Build enrichment object for presenter
  const enrichment: SpaceBrowseEnrichment = {
    eventCounts: eventEnrichment.eventCounts,
    nextEvents: eventEnrichment.nextEvents,
    mutuals: mutualEnrichment,
    toolCounts: new Map(), // Tool count comes from widgets, already in aggregate
  };

  // Transform spaces for API response using unified DTO presenter
  const transformedSpaces = toSpaceBrowseDTOList(visibleSpaces, userSpaceIds, enrichment);

  // Deduplicate by slug (handles multiple docs with same slug but different IDs)
  const seenSlugs = new Set<string>();
  const deduplicatedSpaces = transformedSpaces.filter(space => {
    const key = space.slug || space.id; // Fall back to id if no slug
    if (seenSlugs.has(key)) return false;
    seenSlugs.add(key);
    return true;
  });

  // Apply sorting based on sort parameter
  // This handles all sort types including when category filter is applied
  if (sort === 'newest') {
    deduplicatedSpaces.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sort === 'trending' || sort === 'popular') {
    // Sort by trending score (falls back to member count)
    deduplicatedSpaces.sort((a, b) => {
      // Primary: member count (proxy for trending/popular)
      const memberDiff = (b.memberCount || 0) - (a.memberCount || 0);
      if (memberDiff !== 0) return memberDiff;
      // Secondary: alphabetical
      return a.name.localeCompare(b.name);
    });
  }
  // 'recommended' sort is already handled by repository query

  // Apply cursor-based pagination
  let paginatedSpaces = deduplicatedSpaces;
  if (cursor) {
    const cursorIndex = deduplicatedSpaces.findIndex(s => s.id === cursor);
    if (cursorIndex !== -1) {
      paginatedSpaces = deduplicatedSpaces.slice(cursorIndex + 1);
    }
  }

  // Apply limit
  const resultSpaces = paginatedSpaces.slice(0, limit);
  const hasMore = paginatedSpaces.length > limit;
  const nextCursor = hasMore && resultSpaces.length > 0
    ? resultSpaces[resultSpaces.length - 1]?.id
    : undefined;

  // Create response with cache headers
  // Annotate spaces with isFeatured flag for client display
  const annotatedSpaces = resultSpaces.map(s => ({
    ...s,
    isFeatured: isFeaturedSpace(s.slug),
  }));

  const response = respond.success({
    spaces: annotatedSpaces,
    totalCount: deduplicatedSpaces.length,
    hasMore,
    nextCursor,
    /** True when showing only curated spaces (not searching, not showAll) */
    isCurated: !showAll && !search,
  });

  // Add cache headers for better performance
  // Cache for 60 seconds on edge, allow stale-while-revalidate for 5 minutes
  if (response instanceof Response) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  return response;
});
