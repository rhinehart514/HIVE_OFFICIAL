import * as admin from 'firebase-admin';
import { z } from "zod";
import { Result } from "@hive/core/domain";
import { getTemplatesSuggestedFor } from "@hive/core";
import {
  createServerSpaceManagementService,
  getServerSpaceRepository,
  toSpaceBrowseDTOList,
  type SpaceMemberData
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { withAuthAndErrors, withAuthValidationAndErrors, getUserId, getUserEmail, type AuthenticatedRequest } from "@/lib/middleware";
import { addSecureCampusMetadata } from "@/lib/secure-firebase-queries";
import { getCampusId } from "@/lib/middleware";
// SECURITY: Use centralized admin auth
import { isAdmin as checkIsAdmin } from "@/lib/admin-auth";
// SECURITY: Import SecurityScanner for XSS protection
import { SecurityScanner } from "@/lib/secure-input-validation";
import { withCache } from '../../../lib/cache-headers';

/**
 * SECURITY: Enhanced space creation schema with XSS protection
 * Uses SecureSchemas.textContent to prevent script injection in name/description
 */
const createSpaceSchema = z.object({
  name: z.string()
    .min(1, 'Space name is required')
    .max(100, 'Space name must be 100 characters or less')
    .refine((name) => {
      // Check for XSS patterns using SecurityScanner
      const scan = SecurityScanner.scanInput(name, 'space_name');
      return scan.level !== 'dangerous';
    }, 'Space name contains invalid content'),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less')
    .refine((desc) => {
      // Check for XSS patterns using SecurityScanner
      const scan = SecurityScanner.scanInput(desc, 'space_description');
      return scan.level !== 'dangerous';
    }, 'Description contains invalid content'),
  category: z.enum(['student_organizations', 'university_organizations', 'greek_life', 'campus_living', 'hive_exclusive']),
  joinPolicy: z.enum(['open', 'approval', 'invite_only']),
  tags: z.array(z.string().max(50)).max(20),
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
const _GET = withAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);
  const { searchParams } = new URL(request.url);
  // Support both 'category' (new) and 'type' (legacy) params
  const filterCategory = searchParams.get("category") || searchParams.get("type");
  const searchTerm = searchParams.get("q")?.toLowerCase() || null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    // In development, ensure sample spaces exist
    if (process.env.NODE_ENV === 'development') {
      await ensureSampleSpaces(campusId);
    }

    // Use DDD repository for space queries
    const spaceRepo = getServerSpaceRepository();

    const queryResult = await spaceRepo.findWithPagination({
      campusId,
      type: filterCategory === "all" ? undefined : filterCategory || undefined,
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
      filterCategory,
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
      filterCategory: filterCategory || undefined,
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
  const { name, description, category, joinPolicy, tags, agreedToGuidelines, visibility, settings: _settings } = body;
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const userEmail = getUserEmail(req);
  const campusId = getCampusId(req);

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
  if (category === 'university_organizations' && !isAdmin) {
    return respond.error("University organizations require admin approval", "PERMISSION_DENIED", { status: 403 });
  }

  if (category === 'greek_life' && !userData.greekLifeVerified && !isAdmin) {
    return respond.error("Greek Life spaces require verification", "PERMISSION_DENIED", { status: 403 });
  }

  // CHECK 7: Ban status
  if (userData.spaceBanned === true || userData.banned === true) {
    return respond.error("Your space creation privileges have been revoked", "PERMISSION_DENIED", { status: 403 });
  }

  // CHECK 8: Name uniqueness within campus
  const existingSpaceSnapshot = await dbAdmin
    .collection('spaces')
    .where('campusId', '==', campusId)
    .where('name_lowercase', '==', name.toLowerCase())
    .limit(1)
    .get();

  if (!existingSpaceSnapshot.empty) {
    return respond.error("A space with this name already exists", "CONFLICT", { status: 409 });
  }

  // Create space member save callback for cross-collection write
  const saveSpaceMember = async (member: SpaceMemberData): Promise<Result<void>> => {
    try {
      // Use composite key for deduplication: {spaceId}_{userId}
      const compositeId = `${member.spaceId}_${member.userId}`;
      const memberRef = dbAdmin.collection('spaceMembers').doc(compositeId);
      await memberRef.set(addSecureCampusMetadata({
        spaceId: member.spaceId,
        userId: member.userId,
        role: member.role,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: member.isActive,
        permissions: member.permissions,
        joinMethod: member.joinMethod
      }, campusId));
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Failed to save space member: ${error}`);
    }
  };

  // Use DDD SpaceManagementService for space creation
  const spaceService = createServerSpaceManagementService(
    { userId, campusId },
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

  // Auto-deploy template based on category
  // This runs asynchronously and doesn't block the response
  autoDeployTemplate(spaceId, category, userId, campusId).catch(err => {
    logger.warn('Template auto-deploy failed (non-blocking)', {
      spaceId,
      category,
      error: err instanceof Error ? err.message : String(err)
    });
  });

  // Category and type are now unified - no mapping needed
  return respond.success({
    space: {
      id: spaceId,
      name,
      name_lowercase: name.toLowerCase(),
      slug,
      description,
      category,
      type: category, // Canonical values are the same
      campusId,
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
 * Uses canonical category values: student_organizations, campus_living, university_organizations, greek_life, hive_exclusive
 * @param campusId - Campus to create sample spaces for
 */
async function ensureSampleSpaces(campusId: string) {
  const sampleSpaces = [
    {
      id: 'ub-computer-science',
      name: 'UB Computer Science',
      description: 'Connect with CS majors, share projects, get study tips, and network with fellow programmers at UB. From algorithms to internships, we cover it all.',
      category: 'student_organizations',
      isPrivate: false,
      tags: ['cs', 'programming', 'study-group']
    },
    {
      id: 'ub-engineering-hub',
      name: 'UB Engineering Hub',
      description: 'All engineering disciplines unite! Share resources, discuss projects, find lab partners, and get career advice from fellow UB engineers.',
      category: 'student_organizations',
      isPrivate: false,
      tags: ['engineering', 'stem', 'projects']
    },
    {
      id: 'governors-residence-hall',
      name: 'Governors Residence Hall',
      description: 'For residents of Governors! Plan floor events, coordinate study sessions, share dining hall reviews, and stay connected with your neighbors.',
      category: 'campus_living',
      isPrivate: false,
      tags: ['dorms', 'governors', 'residence-life']
    },
    {
      id: 'ub-pre-med-society',
      name: 'UB Pre-Med Society',
      description: 'Future doctors assemble! Study together for the MCAT, share volunteer opportunities, discuss med school applications, and support each other.',
      category: 'student_organizations',
      isPrivate: false,
      tags: ['pre-med', 'mcat', 'healthcare']
    },
    {
      id: 'ub-business-network',
      name: 'UB Business Network',
      description: 'Business majors and entrepreneurs unite! Share internship opportunities, discuss case studies, network for future careers, and collaborate on ventures.',
      category: 'student_organizations',
      isPrivate: false,
      tags: ['business', 'networking', 'internships']
    },
    {
      id: 'ub-gaming-community',
      name: 'UB Gaming Community',
      description: 'Gamers of UB unite! Organize tournaments, find teammates, discuss new releases, and plan LAN parties. All games and skill levels welcome.',
      category: 'student_organizations',
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
        category: space.category,
        // Category and type are now unified
        type: space.category,
        subType: null,
        status: 'active',
        isActive: true,
        visibility: space.isPrivate ? 'private' : 'public',
        isPrivate: space.isPrivate,
        claimStatus: 'unclaimed',
        tags: space.tags.map(tag => ({ sub_type: tag })),
        createdBy: 'system',
        metrics: {
          memberCount: Math.floor(Math.random() * 150) + 10,
          postCount: Math.floor(Math.random() * 25) + 2,
          eventCount: Math.floor(Math.random() * 8) + 1,
          toolCount: Math.floor(Math.random() * 3) + 1,
          activeMembers: Math.floor(Math.random() * 40) + 5
        },
        bannerUrl: null
      }, campusId);

      batch.set(spaceRef, spaceData);
      spacesCreated++;
    }
  }

  if (spacesCreated > 0) {
    await batch.commit();
    logger.info(`✅ Created ${spacesCreated} sample spaces for development`);
  }
}

/**
 * Auto-deploy a template to a newly created space based on its category
 *
 * This creates default tabs and widgets so new spaces aren't empty.
 * Runs asynchronously and doesn't block space creation.
 *
 * @param spaceId - The newly created space ID
 * @param category - The space category (student_org, residential, etc.)
 * @param userId - The user who created the space
 * @param campusId - The campus ID
 */
async function autoDeployTemplate(
  spaceId: string,
  category: string,
  userId: string,
  campusId: string
): Promise<void> {
  // Map API categories to template suggestedFor values
  const categoryToTemplateSuggestion: Record<string, string> = {
    'student_organizations': 'student_org',
    'university_organizations': 'university_org',
    'greek_life': 'greek_life',
    'campus_living': 'residential',
    'hive_exclusive': 'student_org', // User-created spaces use student org templates
  };

  const templateSuggestion = categoryToTemplateSuggestion[category];
  if (!templateSuggestion) {
    logger.info('No template mapping for category', { category, spaceId });
    return;
  }

  // Get templates suggested for this category
  const suggestedTemplates = getTemplatesSuggestedFor(templateSuggestion);

  if (suggestedTemplates.length === 0) {
    logger.info('No templates found for category', { category, spaceId });
    return;
  }

  // Pick the first suggested template (usually the most appropriate)
  // Prefer 'starter' difficulty templates for auto-deployment
  const template = suggestedTemplates.find(t => t.metadata.difficulty === 'starter')
    || suggestedTemplates[0];

  const batch = dbAdmin.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const createdTabs: string[] = [];
  const createdWidgets: string[] = [];

  // Create tabs from template
  const tabIdMap = new Map<string, string>();

  for (const tabConfig of template.tabs) {
    const tabRef = dbAdmin.collection('spaces').doc(spaceId).collection('tabs').doc();
    const tabId = tabRef.id;
    tabIdMap.set(tabConfig.name, tabId);

    batch.set(tabRef, {
      name: tabConfig.name,
      type: tabConfig.type,
      isDefault: tabConfig.isDefault,
      order: tabConfig.order,
      widgets: [],
      isVisible: true,
      title: tabConfig.name,
      messageCount: 0,
      createdAt: now,
      isArchived: false,
      icon: tabConfig.icon,
      description: tabConfig.description,
      campusId,
    });

    createdTabs.push(tabId);
  }

  // Create widgets from template
  for (const widgetConfig of template.widgets) {
    const widgetRef = dbAdmin.collection('spaces').doc(spaceId).collection('widgets').doc();
    const widgetId = widgetRef.id;

    let targetTabId: string | null = null;
    if (widgetConfig.tabName && tabIdMap.has(widgetConfig.tabName)) {
      targetTabId = tabIdMap.get(widgetConfig.tabName) || null;
    }

    batch.set(widgetRef, {
      type: widgetConfig.type,
      title: widgetConfig.title,
      config: widgetConfig.config,
      isVisible: true,
      order: widgetConfig.order,
      position: { x: 0, y: 0, width: 300, height: 200 },
      isEnabled: true,
      tabId: targetTabId,
      createdAt: now,
      campusId,
    });

    createdWidgets.push(widgetId);

    // Add widget to tab's widgets array
    if (targetTabId) {
      const tabRef = dbAdmin.collection('spaces').doc(spaceId).collection('tabs').doc(targetTabId);
      batch.update(tabRef, {
        widgets: admin.firestore.FieldValue.arrayUnion(widgetId),
      });
    }
  }

  // Update space with template metadata
  const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
  batch.update(spaceRef, {
    templateId: template.metadata.id,
    templateAppliedAt: now,
    templateAppliedBy: 'system',
    autoTemplateApplied: true,
    updatedAt: now,
  });

  // Log activity
  const activityRef = dbAdmin.collection('spaces').doc(spaceId).collection('activity').doc();
  batch.set(activityRef, {
    type: 'template_auto_applied',
    performedBy: 'system',
    details: {
      templateId: template.metadata.id,
      templateName: template.metadata.name,
      tabsCreated: createdTabs.length,
      widgetsCreated: createdWidgets.length,
      category,
    },
    timestamp: now,
  });

  await batch.commit();

  logger.info('✅ Auto-deployed template to new space', {
    spaceId,
    category,
    templateId: template.metadata.id,
    templateName: template.metadata.name,
    tabsCreated: createdTabs.length,
    widgetsCreated: createdWidgets.length,
    endpoint: '/api/spaces'
  });
}

export const GET = withCache(_GET, 'SHORT');
