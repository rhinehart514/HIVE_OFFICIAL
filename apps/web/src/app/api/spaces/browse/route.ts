/**
 * Spaces Browse API
 *
 * Serves category-specific browse experiences with personalization.
 * Maps UI quadrants to data categories with rich metadata.
 *
 * Categories:
 * - major: Profile-driven, grouped by AcademicSchool
 * - interests: student_organizations + university_organizations
 * - home: campus_living
 * - greek: greek_life
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
  getServerSpaceRepository,
  getServerProfileRepository,
  toSpaceBrowseDTOList,
  type SpaceBrowseEnrichment,
} from '@hive/core/server';
import { AcademicSchool, MAJOR_CATALOG } from '@hive/core/domain/profile/value-objects/major';
import { SPACE_TYPE } from '@hive/core/domain/spaces/constants/space-categories';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import { withOptionalAuth } from '@/lib/middleware';

// ============================================================
// Types & Validation
// ============================================================

const BrowseQuerySchema = z.object({
  category: z.enum(['major', 'interests', 'home', 'greek']),
  q: z.string().max(100).optional(),
  school: z.string().max(100).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

type BrowseCategory = z.infer<typeof BrowseQuerySchema>['category'];

// Manifesto copy for each category
const CATEGORY_COPY = {
  major: {
    hero: 'Your academic home',
    fragment: 'Every major is a community waiting to form. Yours might already be here.',
  },
  interests: {
    hero: 'Where passions become communities',
    fragment: 'Clubs, resources, and everything in between. Find what moves you.',
  },
  home: {
    hero: 'Your floor, your building, your neighbors',
    fragment: 'The people you live with become the people you build with.',
  },
  greek: {
    hero: 'Letters that last',
    fragment: 'Brotherhood and sisterhood, organized for the first time.',
  },
};

// Map browse category to space types
const CATEGORY_TO_SPACE_TYPES: Record<BrowseCategory, string[]> = {
  major: [], // Handled specially via profile + major matching
  interests: [SPACE_TYPE.STUDENT_ORGANIZATIONS, SPACE_TYPE.UNIVERSITY_ORGANIZATIONS],
  home: [SPACE_TYPE.CAMPUS_LIVING],
  greek: [SPACE_TYPE.GREEK_LIFE],
};

// ============================================================
// Helpers
// ============================================================

/**
 * Get user's major space (if they have a major set in profile)
 */
async function getUserMajorSpace(
  userId: string,
  campusId: string,
  spaceRepo: ReturnType<typeof getServerSpaceRepository>
): Promise<{ space: any; major: string; school: AcademicSchool } | null> {
  try {
    // Get user's profile
    const profileDoc = await dbAdmin.collection('profiles').doc(userId).get();
    const profileData = profileDoc.data();

    if (!profileData?.major) {
      return null;
    }

    const userMajor = profileData.major;

    // Look up the school for this major
    const catalogEntry = MAJOR_CATALOG[userMajor];
    const school = catalogEntry?.school || AcademicSchool.OTHER;

    // Find a space that matches this major (by name matching)
    const spacesResult = await spaceRepo.findByCampus(campusId, 100);
    if (spacesResult.isFailure) return null;

    const spaces = spacesResult.getValue();
    const majorSpace = spaces.find(
      (s) => s.name.value.toLowerCase().includes(userMajor.toLowerCase())
    );

    if (!majorSpace) return null;

    return { space: majorSpace, major: userMajor, school };
  } catch (error) {
    logger.warn('Failed to get user major space', { error, userId });
    return null;
  }
}

/**
 * Group spaces by academic school for major browse
 */
function groupSpacesBySchool(
  spaces: any[],
  excludeSpaceId?: string
): Record<string, any[]> {
  const groups: Record<string, any[]> = {};

  // Initialize all schools
  for (const school of Object.values(AcademicSchool)) {
    groups[school] = [];
  }

  for (const space of spaces) {
    if (excludeSpaceId && space.spaceId?.value === excludeSpaceId) {
      continue;
    }

    // Try to determine school from space name/tags matching major catalog
    const spaceName = space.name?.value || '';
    let matchedSchool = AcademicSchool.OTHER;

    // Check if space name matches any major
    for (const [majorName, data] of Object.entries(MAJOR_CATALOG)) {
      if (
        spaceName.toLowerCase().includes(majorName.toLowerCase()) ||
        data.aliases.some((alias) => spaceName.toLowerCase().includes(alias.toLowerCase()))
      ) {
        matchedSchool = data.school;
        break;
      }
    }

    groups[matchedSchool].push(space);
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([, spaces]) => spaces.length > 0)
  );
}

/**
 * Fetch event enrichment for cold start signals
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
    const eventsSnapshot = await dbAdmin
      .collection('events')
      .where('spaceId', 'in', spaceIds.slice(0, 30))
      .where('startAt', '>=', now)
      .where('status', '==', 'published')
      .orderBy('startAt', 'asc')
      .limit(100)
      .get();

    for (const doc of eventsSnapshot.docs) {
      const data = doc.data();
      const spaceId = data.spaceId as string;
      const startAt = data.startAt?.toDate?.() ?? new Date(data.startAt);
      const title = data.title as string;

      eventCounts.set(spaceId, (eventCounts.get(spaceId) ?? 0) + 1);

      if (!nextEvents.has(spaceId)) {
        nextEvents.set(spaceId, { title, startAt });
      }
    }
  } catch (error) {
    logger.warn('Failed to fetch event enrichment', { error });
  }

  return { eventCounts, nextEvents };
}

// ============================================================
// Route Handler
// ============================================================

export const GET = withOptionalAuth(async (request, _context, respond) => {
  const user = (request as { user?: { uid?: string; campusId?: string } }).user;
  const userId = user?.uid || null;
  const campusId = user?.campusId || 'ub-buffalo';
  const { searchParams } = new URL(request.url);

  // Validate params
  const parseResult = BrowseQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );

  if (!parseResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: 400,
      details: parseResult.error.flatten(),
    });
  }

  const { category, q, school: schoolFilter, limit, cursor } = parseResult.data;

  logger.info('Browse spaces request', {
    category,
    search: q,
    schoolFilter,
    userId: userId ?? undefined,
    endpoint: '/api/spaces/browse',
  });

  const spaceRepo = getServerSpaceRepository();

  // ============================================================
  // Handle Major Category
  // ============================================================
  if (category === 'major') {
    // Get all spaces to find major-related ones
    const spacesResult = await spaceRepo.findByCampus(campusId, 200);
    if (spacesResult.isFailure) {
      return respond.error('Failed to load spaces', 'INTERNAL_ERROR', { status: 500 });
    }

    let spaces = spacesResult.getValue();

    // Filter to only live spaces
    spaces = spaces.filter((s) => s.isLive);

    // Get user's major if authenticated
    let userMajorData: { space: any; major: string; school: AcademicSchool } | null = null;
    if (userId) {
      userMajorData = await getUserMajorSpace(userId, campusId, spaceRepo);
    }

    // Apply search filter
    if (q && q.trim().length > 0) {
      const searchLower = q.toLowerCase().trim();
      spaces = spaces.filter((s) => {
        const name = s.name.value.toLowerCase();
        const desc = s.description?.value?.toLowerCase() || '';
        return name.includes(searchLower) || desc.includes(searchLower);
      });
    }

    // Apply school filter
    if (schoolFilter) {
      spaces = spaces.filter((s) => {
        const name = s.name.value.toLowerCase();
        // Check if space name matches any major in the filtered school
        for (const [majorName, data] of Object.entries(MAJOR_CATALOG)) {
          if (data.school === schoolFilter) {
            if (name.includes(majorName.toLowerCase())) {
              return true;
            }
          }
        }
        return false;
      });
    }

    // Group by school
    const groupedBySchool = groupSpacesBySchool(
      spaces,
      userMajorData?.space?.spaceId?.value
    );

    // Get enrichment data
    const spaceIds = spaces.map((s) => s.spaceId.value);
    const eventEnrichment = await fetchEventEnrichment(spaceIds);

    const enrichment: SpaceBrowseEnrichment = {
      eventCounts: eventEnrichment.eventCounts,
      nextEvents: eventEnrichment.nextEvents,
      mutuals: new Map(),
      toolCounts: new Map(),
    };

    // Transform user major space if exists
    const userMajorSpaceDTO = userMajorData?.space
      ? toSpaceBrowseDTOList([userMajorData.space], new Set([userMajorData.space.spaceId.value]), enrichment)[0]
      : null;

    // Transform grouped spaces
    const sections = Object.entries(groupedBySchool).map(([schoolName, schoolSpaces]) => ({
      name: schoolName,
      spaces: toSpaceBrowseDTOList(schoolSpaces, new Set(), enrichment),
    }));

    return NextResponse.json({
      category: 'major',
      userMajor: userMajorSpaceDTO
        ? {
            space: userMajorSpaceDTO,
            majorName: userMajorData!.major,
            school: userMajorData!.school,
          }
        : null,
      sections,
      copy: CATEGORY_COPY.major,
      totalCount: spaces.length,
    });
  }

  // ============================================================
  // Handle Other Categories (interests, home, greek)
  // ============================================================
  const spaceTypes = CATEGORY_TO_SPACE_TYPES[category];
  const allSpaces: any[] = [];

  // Fetch spaces for each mapped type
  for (const spaceType of spaceTypes) {
    const result = await spaceRepo.findByCategory(spaceType, campusId);
    if (result.isSuccess) {
      allSpaces.push(...result.getValue());
    }
  }

  // Filter to only live spaces
  let filteredSpaces = allSpaces.filter((s) => s.isLive);

  // Apply search filter
  if (q && q.trim().length > 0) {
    const searchLower = q.toLowerCase().trim();
    filteredSpaces = filteredSpaces.filter((s) => {
      const name = s.name.value.toLowerCase();
      const desc = s.description?.value?.toLowerCase() || '';
      return name.includes(searchLower) || desc.includes(searchLower);
    });
  }

  // Sort by member count (trending)
  filteredSpaces.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));

  // Apply pagination
  let paginatedSpaces = filteredSpaces;
  if (cursor) {
    const cursorIndex = filteredSpaces.findIndex((s) => s.spaceId.value === cursor);
    if (cursorIndex !== -1) {
      paginatedSpaces = filteredSpaces.slice(cursorIndex + 1);
    }
  }

  const resultSpaces = paginatedSpaces.slice(0, limit);
  const hasMore = paginatedSpaces.length > limit;
  const nextCursor = hasMore && resultSpaces.length > 0
    ? resultSpaces[resultSpaces.length - 1]?.spaceId?.value
    : undefined;

  // Get enrichment data
  const spaceIds = resultSpaces.map((s) => s.spaceId.value);
  const eventEnrichment = await fetchEventEnrichment(spaceIds);

  const enrichment: SpaceBrowseEnrichment = {
    eventCounts: eventEnrichment.eventCounts,
    nextEvents: eventEnrichment.nextEvents,
    mutuals: new Map(),
    toolCounts: new Map(),
  };

  // Transform to DTOs
  const spaceDTOs = toSpaceBrowseDTOList(resultSpaces, new Set(), enrichment);

  return NextResponse.json({
    category,
    spaces: spaceDTOs,
    copy: CATEGORY_COPY[category],
    totalCount: filteredSpaces.length,
    hasMore,
    nextCursor,
  });
});
