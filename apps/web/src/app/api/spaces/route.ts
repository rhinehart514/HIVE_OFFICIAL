import * as admin from 'firebase-admin';
import { unstable_cache } from 'next/cache';
import { z } from "zod";
import type { Space, SpaceType } from "@hive/core";
import { Result } from "@hive/core/domain";
import {
  createServerSpaceManagementService,
  getServerSpaceRepository,
  toSpaceBrowseDTOList,
  type SpaceMemberData
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { withAuthAndErrors, withAuthValidationAndErrors, getUserId, getUserEmail, type AuthenticatedRequest } from "@/lib/middleware";
import { addSecureCampusMetadata, CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
// SECURITY: Use centralized admin auth
import { isAdmin as checkIsAdmin } from "@/lib/admin-auth";

const createSpaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['student_org', 'residential', 'university_org', 'greek_life']),
  joinPolicy: z.enum(['open', 'approval', 'invite_only']),
  tags: z.array(z.string()),
  agreedToGuidelines: z.boolean(),
  visibility: z.enum(['public', 'members_only']).optional(),
  settings: z.object({
    maxPinnedPosts: z.number().optional(),
    autoArchiveDays: z.number().optional()
  }).optional()
});

/**
 * GET /api/spaces - List spaces with DDD repository
 * Supports filtering by type, search, and cursor-based pagination.
 * Uses unstable_cache for 5-minute caching.
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const filterType = searchParams.get("type") as SpaceType | "all" | null;
  const searchTerm = searchParams.get("q")?.toLowerCase() || null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    // In development, ensure sample spaces exist
    if (process.env.NODE_ENV === 'development') {
      await ensureSampleSpaces();
    }

    // Use DDD repository for space queries
    const spaceRepo = getServerSpaceRepository();

    const queryResult = await spaceRepo.findWithPagination({
      campusId: CURRENT_CAMPUS_ID,
      type: filterType === "all" ? undefined : filterType || undefined,
      searchTerm: searchTerm || undefined,
      limit,
      cursor,
      orderBy: searchTerm ? 'name_lowercase' : 'createdAt',
      orderDirection: searchTerm ? 'asc' : 'desc'
    });

    if (queryResult.isFailure) {
      logger.error('Failed to fetch spaces via DDD', { error: queryResult.error });
      return respond.error("Failed to fetch spaces", "INTERNAL_ERROR", { status: 500 });
    }

    const { spaces, hasMore, nextCursor } = queryResult.getValue();

    // Get user's joined spaces to mark them
    const userSpacesResult = await spaceRepo.findUserSpaces(userId);
    const userSpaceIds = new Set(
      userSpacesResult.isSuccess
        ? userSpacesResult.getValue().map(s => s.spaceId.value)
        : []
    );

    // Transform using unified DTOs
    const transformedSpaces = toSpaceBrowseDTOList(spaces, userSpaceIds);

    logger.info('Fetched spaces via DDD repository', {
      count: transformedSpaces.length,
      hasMore,
      filterType,
      searchTerm,
      endpoint: '/api/spaces'
    });

    return respond.success({
      spaces: transformedSpaces,
      pagination: {
        limit,
        hasMore,
        nextCursor,
        // For backwards compatibility with offset-based clients
        count: transformedSpaces.length
      }
    });
  } catch (error) {
    logger.error('Error fetching spaces', {
      error: error instanceof Error ? error.message : String(error),
      filterType: filterType || undefined,
      searchTerm: searchTerm || undefined,
      limit,
      cursor
    });
    return respond.error("Failed to fetch spaces", "INTERNAL_ERROR", { status: 500 });
  }
});

type CreateSpaceData = z.infer<typeof createSpaceSchema>;

export const POST = withAuthValidationAndErrors(
  createSpaceSchema,
  async (request, context, body: CreateSpaceData, respond) => {
  const { name, description, category, joinPolicy, tags, agreedToGuidelines, visibility, settings } = body;
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const userEmail = getUserEmail(req);

  // CHECK 1: Agreement to guidelines
  if (!agreedToGuidelines) {
    return respond.error("Must agree to community guidelines", "VALIDATION_ERROR", { status: 400 });
  }

  // CHECK 2: Get user data for permission checks
  const userDoc = await dbAdmin.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData) {
    return respond.error("User not found", "NOT_FOUND", { status: 404 });
  }

  // CHECK 3: Account age (7 days minimum)
  const accountCreated = userData.createdAt?.toDate() || new Date();
  const accountAge = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));
  // SECURITY: Use centralized admin check (checks custom claims + Firestore admins collection)
  const isAdmin = await checkIsAdmin(userId, req.user.decodedToken.email);

  if (accountAge < 7 && !isAdmin) {
    return respond.error(`Account must be at least 7 days old (current: ${accountAge} days)`, "PERMISSION_DENIED", { status: 403 });
  }

  // CHECK 4: Email verification
  const emailVerified = req.user.decodedToken.email_verified || false;
  if (!emailVerified && !isAdmin) {
    return respond.error("Email verification required", "PERMISSION_DENIED", { status: 403 });
  }

  // CHECK 5: Daily limit (3 spaces per day)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const spacesCreatedTodaySnapshot = await dbAdmin
    .collection('spaces')
    .where('createdBy', '==', userId)
    .where('createdAt', '>=', todayStart)
    .get();

  if (spacesCreatedTodaySnapshot.size >= 3 && !isAdmin) {
    return respond.error("Daily limit reached (3 spaces per day)", "RATE_LIMIT", { status: 429 });
  }

  // CHECK 6: Category restrictions
  if (category === 'university_org' && !isAdmin) {
    return respond.error("University organizations require admin approval", "PERMISSION_DENIED", { status: 403 });
  }

  if (category === 'greek_life' && !userData.greekLifeVerified && !isAdmin) {
    return respond.error("Greek Life spaces require verification", "PERMISSION_DENIED", { status: 403 });
  }

  // CHECK 7: Ban status
  if (userData.spaceBanned === true || userData.banned === true) {
    return respond.error("Your space creation privileges have been revoked", "PERMISSION_DENIED", { status: 403 });
  }

  // CHECK 8: Name uniqueness (use CURRENT_CAMPUS_ID instead of hardcoded)
  const existingSpaceSnapshot = await dbAdmin
    .collection('spaces')
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .where('name_lowercase', '==', name.toLowerCase())
    .limit(1)
    .get();

  if (!existingSpaceSnapshot.empty) {
    return respond.error("A space with this name already exists", "CONFLICT", { status: 409 });
  }

  // Create space member save callback for cross-collection write
  const saveSpaceMember = async (member: SpaceMemberData): Promise<Result<void>> => {
    try {
      const memberRef = dbAdmin.collection('spaceMembers').doc();
      await memberRef.set(addSecureCampusMetadata({
        spaceId: member.spaceId,
        userId: member.userId,
        role: member.role,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: member.isActive,
        permissions: member.permissions,
        joinMethod: member.joinMethod
      }));
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save space member: ${error}`);
    }
  };

  // Use DDD SpaceManagementService for space creation
  const spaceService = createServerSpaceManagementService(
    { userId, campusId: CURRENT_CAMPUS_ID },
    saveSpaceMember
  );

  const createResult = await spaceService.createSpace(userId, {
    name,
    description,
    category, // Service handles API→domain category mapping
    visibility: visibility === 'members_only' ? 'private' : 'public',
    settings: {
      allowInvites: true,
      requireApproval: joinPolicy === 'approval',
      allowRSS: false,
      maxMembers: undefined
    }
  });

  if (createResult.isFailure) {
    logger.error('Failed to create space via DDD service', {
      error: createResult.error,
      userId,
      spaceName: name
    });
    return respond.error(
      createResult.error || 'Failed to create space',
      'INTERNAL_ERROR',
      { status: 500 }
    );
  }

  const { space, slug } = createResult.getValue().data;
  const spaceId = space.spaceId.value;

  // Add audit log for space creation (kept separate from DDD for now)
  const now = admin.firestore.FieldValue.serverTimestamp();
  await dbAdmin.collection('audit_logs').doc().set({
    type: 'space_created',
    userId,
    userEmail,
    spaceId,
    spaceName: name,
    slug,
    category,
    joinPolicy,
    timestamp: now,
    metadata: {
      accountAge,
      emailVerified,
      spacesCreatedToday: spacesCreatedTodaySnapshot.size + 1,
      createdViaDDD: true
    }
  });

  logger.info('✅ Created space via DDD service', {
    category,
    userId,
    spaceId,
    spaceName: name,
    slug,
    endpoint: '/api/spaces'
  });

  // Map category to type for backward compatibility in response
  const typeMapping: Record<string, string> = {
    'student_org': 'student_organizations',
    'residential': 'residential_spaces',
    'university_org': 'university_organizations',
    'greek_life': 'greek_life_spaces'
  };

  return respond.success({
    space: {
      id: spaceId,
      name,
      name_lowercase: name.toLowerCase(),
      slug,
      description,
      category,
      type: typeMapping[category] || 'student_organizations',
      campusId: CURRENT_CAMPUS_ID,
      visibility: visibility || 'public',
      joinPolicy,
      tags: tags || [],
      createdBy: userId,
      memberCount: 1,
      isActive: true
    }
  }, { status: 201 });
  }
);

/**
 * Development helper to ensure sample spaces exist
 */
async function ensureSampleSpaces() {
  const sampleSpaces = [
    {
      id: 'ub-computer-science',
      name: 'UB Computer Science',
      description: 'Connect with CS majors, share projects, get study tips, and network with fellow programmers at UB. From algorithms to internships, we cover it all.',
      type: 'student_organizations' as SpaceType,
      isPrivate: false,
      tags: ['cs', 'programming', 'study-group']
    },
    {
      id: 'ub-engineering-hub',
      name: 'UB Engineering Hub',
      description: 'All engineering disciplines unite! Share resources, discuss projects, find lab partners, and get career advice from fellow UB engineers.',
      type: 'student_organizations' as SpaceType,
      isPrivate: false,
      tags: ['engineering', 'stem', 'projects']
    },
    {
      id: 'governors-residence-hall',
      name: 'Governors Residence Hall',
      description: 'For residents of Governors! Plan floor events, coordinate study sessions, share dining hall reviews, and stay connected with your neighbors.',
      type: 'residential_spaces' as SpaceType,
      isPrivate: false,
      tags: ['dorms', 'governors', 'residence-life']
    },
    {
      id: 'ub-pre-med-society',
      name: 'UB Pre-Med Society',
      description: 'Future doctors assemble! Study together for the MCAT, share volunteer opportunities, discuss med school applications, and support each other.',
      type: 'student_organizations' as SpaceType,
      isPrivate: false,
      tags: ['pre-med', 'mcat', 'healthcare']
    },
    {
      id: 'ub-business-network',
      name: 'UB Business Network',
      description: 'Business majors and entrepreneurs unite! Share internship opportunities, discuss case studies, network for future careers, and collaborate on ventures.',
      type: 'student_organizations' as SpaceType,
      isPrivate: false,
      tags: ['business', 'networking', 'internships']
    },
    {
      id: 'ub-gaming-community',
      name: 'UB Gaming Community',
      description: 'Gamers of UB unite! Organize tournaments, find teammates, discuss new releases, and plan LAN parties. All games and skill levels welcome.',
      type: 'student_organizations' as SpaceType,
      isPrivate: false,
      tags: ['gaming', 'esports', 'tournaments']
    }
  ];

  const batch = dbAdmin.batch();
  let spacesCreated = 0;

  for (const space of sampleSpaces) {
    const spaceRef = dbAdmin.collection('spaces').doc(space.id);
    const spaceDoc = await spaceRef.get();

    if (!spaceDoc.exists) {
      const spaceData = addSecureCampusMetadata({
        name: space.name,
        name_lowercase: space.name.toLowerCase(),
        description: space.description,
        type: space.type,
        subType: null,
        status: 'active',
        isActive: true,
        isPrivate: space.isPrivate,
        tags: space.tags.map(tag => ({ sub_type: tag })),
        createdBy: 'system',
        metrics: {
          memberCount: Math.floor(Math.random() * 150) + 10, // 10-160 members
          postCount: Math.floor(Math.random() * 25) + 2, // 2-27 posts
          eventCount: Math.floor(Math.random() * 8) + 1, // 1-9 events
          toolCount: Math.floor(Math.random() * 3) + 1, // 1-4 tools
          activeMembers: Math.floor(Math.random() * 40) + 5 // 5-45 active
        },
        bannerUrl: null
      });

      batch.set(spaceRef, spaceData);
      spacesCreated++;
    }
  }

  if (spacesCreated > 0) {
    await batch.commit();
    logger.info(`✅ Created ${spacesCreated} sample spaces for development`);
  }
}
