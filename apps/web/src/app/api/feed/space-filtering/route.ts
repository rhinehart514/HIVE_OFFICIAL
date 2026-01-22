import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/logger";
import { withAuthAndErrors, getUserId, getCampusId } from "@/lib/middleware";
import type * as admin from 'firebase-admin';

// Space-aware filtering interfaces
interface SpaceVisibilityRules {
  spaceId: string;
  spaceName: string;
  spaceType: string;
  visibility: 'public' | 'members_only' | 'private';
  contentSharing: {
    allowCrossSpaceSharing: boolean;
    shareToParentSpaces: boolean;
    shareToChildSpaces: boolean;
    allowedTargetSpaces: string[];
  };
  membershipRequirements: {
    minimumRole: 'member' | 'builder' | 'moderator' | 'admin';
    minimumEngagement: number; // 0-100
    minimumDuration: number; // days since joining
  };
  contentFilters: {
    allowedContentTypes: string[];
    blockedUsers: string[];
    moderationLevel: 'strict' | 'moderate' | 'relaxed';
  };
}

interface UserSpaceContext {
  userId: string;
  spaceId: string;
  role: 'member' | 'builder' | 'moderator' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  lastActivity: string;
  engagementLevel: number; // 0-100
  permissions: {
    canViewContent: boolean;
    canInteractWithTools: boolean;
    canCreateContent: boolean;
    canModerateContent: boolean;
  };
}

interface FilteredFeedResult {
  spaceId: string;
  spaceName: string;
  content: Array<Record<string, unknown>>;
  accessReason: string;
  visibilityLevel: 'full' | 'limited' | 'preview';
  contentCount: number;
  filteredCount: number;
}

// POST - Get space-filtered feed content
export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  const body = await request.json();
  const {
    targetSpaces = [], // Specific spaces to filter, empty = all accessible spaces
    contentTypes = ['tool_generated', 'tool_enhanced', 'space_event'],
    includePreview = false, // Include preview content from non-member spaces
    maxContentPerSpace = 10,
    sortBy = 'relevance', // 'relevance', 'recency', 'engagement'
    timeRange = '24h'
  } = body;

  // Get user's space contexts
  const userSpaceContexts = await getUserSpaceContexts(userId, campusId);

  if (userSpaceContexts.length === 0 && !includePreview) {
    return respond.success({
      results: [],
      metadata: {
        accessibleSpaces: 0,
        totalContent: 0,
        filteringApplied: false
      }
    });
  }

  // Get space visibility rules for accessible spaces
  const spaceIds = targetSpaces.length > 0
    ? targetSpaces.filter((id: string) => userSpaceContexts.some(ctx => ctx.spaceId === id))
    : userSpaceContexts.map(ctx => ctx.spaceId);

  const visibilityRules = await getSpaceVisibilityRules(spaceIds, campusId);

  // Apply space-aware filtering
  const filteredResults = await applySpaceAwareFiltering({
    userId,
    userSpaceContexts,
    visibilityRules,
    contentTypes,
    includePreview,
    maxContentPerSpace,
    sortBy,
    timeRange,
    campusId
  });

  // Calculate filtering statistics
  const totalContent = filteredResults.reduce((sum, result) => sum + result.contentCount, 0);
  const filteredContent = filteredResults.reduce((sum, result) => sum + result.filteredCount, 0);

  return respond.success({
    results: filteredResults,
    metadata: {
      accessibleSpaces: userSpaceContexts.length,
      totalContent,
      filteredContent,
      filteringApplied: filteredContent < totalContent,
      filterEfficiency: totalContent > 0 ? ((totalContent - filteredContent) / totalContent) * 100 : 0
    }
  });
});

// GET - Get user's space access information
export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  const { searchParams } = new URL(request.url);
  const includePreview = searchParams.get('includePreview') === 'true';
  const spaceId = searchParams.get('spaceId');

  if (spaceId) {
    // Get specific space access info
    const spaceAccess = await getSpaceAccessInfo(userId, spaceId, includePreview, campusId);
    return respond.success(spaceAccess);
  } else {
    // Get all accessible spaces
    const userSpaceContexts = await getUserSpaceContexts(userId, campusId);
    const accessibleSpaces = await Promise.all(
      userSpaceContexts.map(ctx => getSpaceAccessInfo(userId, ctx.spaceId, includePreview, campusId))
    );

    return respond.success({
      accessibleSpaces,
      totalCount: accessibleSpaces.length
    });
  }
});

// Helper function to get user's space contexts
async function getUserSpaceContexts(userId: string, campusId: string): Promise<UserSpaceContext[]> {
  try {
    const membershipsSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('status', 'in', ['active', 'inactive'])
      .where('campusId', '==', campusId)
      .get();
    const contexts: UserSpaceContext[] = [];

    for (const memberDoc of membershipsSnapshot.docs) {
      const memberData = memberDoc.data();

      // Calculate engagement level
      const engagementLevel = await calculateUserEngagementInSpace(userId, memberData.spaceId, campusId);

      // Determine permissions based on role and status
      const permissions = determineUserPermissions(memberData.role, memberData.status, engagementLevel);

      contexts.push({
        userId,
        spaceId: memberData.spaceId,
        role: memberData.role || 'member',
        status: memberData.status || 'active',
        joinedAt: memberData.joinedAt || new Date().toISOString(),
        lastActivity: memberData.lastActivity || new Date().toISOString(),
        engagementLevel,
        permissions
      });
    }

    return contexts;
  } catch (error) {
    logger.error(
      `Error getting user space contexts at /api/feed/space-filtering`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return [];
  }
}

// Helper function to get space visibility rules
async function getSpaceVisibilityRules(spaceIds: string[], campusId: string): Promise<Map<string, SpaceVisibilityRules>> {
  const rulesMap = new Map<string, SpaceVisibilityRules>();

  try {
    for (const spaceId of spaceIds) {
      const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
      if (!spaceDoc.exists) continue;

      const spaceData = spaceDoc.data();
      if (!spaceData) {
        continue;
      }
      // Enforce campus isolation: skip spaces from other campuses
      if (spaceData.campusId && spaceData.campusId !== campusId) {
        continue;
      }

      // Get or create visibility rules
      const visibilityRulesDoc = await dbAdmin.collection('spaceVisibilityRules').doc(spaceId).get();
      let visibilityRules: SpaceVisibilityRules;

      if (visibilityRulesDoc.exists) {
        visibilityRules = visibilityRulesDoc.data() as SpaceVisibilityRules;
      } else {
        // Create default rules based on space type
        visibilityRules = createDefaultVisibilityRules(spaceId, spaceData);
      }

      rulesMap.set(spaceId, visibilityRules);
    }

    return rulesMap;
  } catch (error) {
    logger.error(
      `Error getting space visibility rules at /api/feed/space-filtering`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return rulesMap;
  }
}

// Helper function to create default visibility rules
function createDefaultVisibilityRules(spaceId: string, spaceData: Record<string, unknown>): SpaceVisibilityRules {
  const spaceType = typeof spaceData.type === 'string' ? spaceData.type : 'general';

  return {
    spaceId,
    spaceName: typeof spaceData.name === 'string' ? spaceData.name : 'Unknown Space',
    spaceType,
    visibility: spaceType === 'private' ? 'private' : 'members_only',
    contentSharing: {
      allowCrossSpaceSharing: spaceType !== 'private',
      shareToParentSpaces: false,
      shareToChildSpaces: false,
      allowedTargetSpaces: []
    },
    membershipRequirements: {
      minimumRole: 'member',
      minimumEngagement: 10,
      minimumDuration: 0
    },
    contentFilters: {
      allowedContentTypes: ['tool_generated', 'tool_enhanced', 'space_event', 'builder_announcement'],
      blockedUsers: [],
      moderationLevel: 'moderate'
    }
  };
}

// Helper function to apply space-aware filtering
async function applySpaceAwareFiltering(params: {
  userId: string;
  userSpaceContexts: UserSpaceContext[];
  visibilityRules: Map<string, SpaceVisibilityRules>;
  contentTypes: string[];
  includePreview: boolean;
  maxContentPerSpace: number;
  sortBy: string;
  timeRange: string;
  campusId: string;
}): Promise<FilteredFeedResult[]> {
  const { userId: _userId, userSpaceContexts, visibilityRules, contentTypes, maxContentPerSpace, sortBy, timeRange, campusId } = params;

  const results: FilteredFeedResult[] = [];

  // Calculate time range
  const timeRangeHours = timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - timeRangeHours);

  for (const spaceContext of userSpaceContexts) {
    const rules = visibilityRules.get(spaceContext.spaceId);
    if (!rules) continue;

    // Check if user meets membership requirements
    const meetsRequirements = checkMembershipRequirements(spaceContext, rules);
    if (!meetsRequirements && !spaceContext.permissions.canViewContent) {
      continue;
    }

    // Get space content
    const spaceContent = await getSpaceContent(
      spaceContext.spaceId,
      contentTypes,
      maxContentPerSpace * 2, // Get more for filtering
      cutoffTime,
      campusId
    );

    // Apply content filtering
    const filteredContent = await filterSpaceContent(
      spaceContent,
      spaceContext,
      rules,
      contentTypes
    );

    // Apply sorting
    const sortedContent = sortContent(filteredContent, sortBy, spaceContext);

    // Limit results
    const finalContent = sortedContent.slice(0, maxContentPerSpace);

    // Determine visibility level
    const visibilityLevel = determineVisibilityLevel(spaceContext, rules);

    results.push({
      spaceId: spaceContext.spaceId,
      spaceName: rules.spaceName,
      content: finalContent,
      accessReason: generateAccessReason(spaceContext, rules),
      visibilityLevel,
      contentCount: spaceContent.length,
      filteredCount: finalContent.length
    });
  }

  return results;
}

// Helper function to check membership requirements
function checkMembershipRequirements(context: UserSpaceContext, rules: SpaceVisibilityRules): boolean {
  // Check minimum role
  const roleHierarchy = { member: 1, builder: 2, moderator: 3, admin: 4 };
  const userRoleLevel = roleHierarchy[context.role] || 0;
  const requiredRoleLevel = roleHierarchy[rules.membershipRequirements.minimumRole] || 1;

  if (userRoleLevel < requiredRoleLevel) {
    return false;
  }

  // Check minimum engagement
  if (context.engagementLevel < rules.membershipRequirements.minimumEngagement) {
    return false;
  }

  // Check minimum duration
  const joinedDate = new Date(context.joinedAt);
  const daysSinceJoined = (Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceJoined < rules.membershipRequirements.minimumDuration) {
    return false;
  }

  return true;
}

// Helper function to get space content
async function getSpaceContent(
  spaceId: string,
  contentTypes: string[],
  limit: number,
  cutoffTime: Date,
  campusId: string
): Promise<Array<Record<string, unknown>>> {
  try {
    const postsQuery: admin.firestore.Query<admin.firestore.DocumentData> = dbAdmin
      .collection('posts')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .where('status', '==', 'published')
      .where('createdAt', '>=', cutoffTime.toISOString())
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const postsSnapshot = await postsQuery.get();
    return postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error(
      `Error getting space content at /api/feed/space-filtering`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return [];
  }
}

// Helper function to filter space content
async function filterSpaceContent(
  content: Array<Record<string, unknown>>,
  context: UserSpaceContext,
  rules: SpaceVisibilityRules,
  allowedContentTypes: string[]
): Promise<Array<Record<string, unknown>>> {
  return content.filter(item => {
    // Filter by content type
    const itemType = determineContentType(item);
    if (!allowedContentTypes.includes(itemType) || !rules.contentFilters.allowedContentTypes.includes(itemType)) {
      return false;
    }

    // Filter blocked users
    const authorId = 'authorId' in item && typeof item.authorId === 'string' ? item.authorId : '';
    if (rules.contentFilters.blockedUsers.includes(authorId)) {
      return false;
    }

    // Filter based on user permissions
    if (!context.permissions.canViewContent) {
      return false;
    }

    // Additional moderation level filtering
    if (rules.contentFilters.moderationLevel === 'strict') {
      // Only allow high-quality tool-generated content
      const qualityScore = 'qualityScore' in item && typeof item.qualityScore === 'number' ? item.qualityScore : 0;
      return itemType === 'tool_generated' && qualityScore >= 80;
    }

    return true;
  });
}

// Helper function to sort content
function sortContent(content: Array<Record<string, unknown>>, sortBy: string, context: UserSpaceContext): Array<Record<string, unknown>> {
  switch (sortBy) {
    case 'recency':
      return content.sort((a, b) => {
        const aTime = 'createdAt' in a && typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
        const bTime = 'createdAt' in b && typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

    case 'engagement':
      return content.sort((a, b) => {
        const aEngagement = ('engagement' in a && typeof a.engagement === 'object' && a.engagement !== null
          ? ((a.engagement as Record<string, unknown>).likes as number || 0) + ((a.engagement as Record<string, unknown>).comments as number || 0) * 2
          : 0);
        const bEngagement = ('engagement' in b && typeof b.engagement === 'object' && b.engagement !== null
          ? ((b.engagement as Record<string, unknown>).likes as number || 0) + ((b.engagement as Record<string, unknown>).comments as number || 0) * 2
          : 0);
        return bEngagement - aEngagement;
      });

    case 'relevance':
    default:
      return content.sort((a, b) => {
        const aRelevance = calculateContentRelevance(a, context);
        const bRelevance = calculateContentRelevance(b, context);
        return bRelevance - aRelevance;
      });
  }
}

// Helper function to calculate content relevance
function calculateContentRelevance(content: Record<string, unknown>, context: UserSpaceContext): number {
  let relevance = 50; // Base relevance

  // Tool-generated content gets higher relevance
  const contentType = determineContentType(content);
  if (contentType === 'tool_generated') relevance += 30;
  else if (contentType === 'tool_enhanced') relevance += 20;

  // Recent content gets higher relevance
  const createdAt = 'createdAt' in content && typeof content.createdAt === 'string' ? content.createdAt : new Date().toISOString();
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  relevance += Math.max(0, 20 - ageHours);

  // User's engagement level affects relevance
  relevance += context.engagementLevel * 0.2;

  // Quality score affects relevance
  const qualityScore = 'qualityScore' in content && typeof content.qualityScore === 'number' ? content.qualityScore : 50;
  relevance += qualityScore * 0.1;

  return Math.min(100, relevance);
}

// Helper function to determine content type
function determineContentType(content: Record<string, unknown>): string {
  const hasToolId = 'toolId' in content;
  const type = 'type' in content && typeof content.type === 'string' ? content.type : '';
  const hasEventDate = 'eventDate' in content;
  const source = 'source' in content && typeof content.source === 'string' ? content.source : '';
  const metadata = 'metadata' in content && typeof content.metadata === 'object' && content.metadata !== null ? content.metadata as Record<string, unknown> : null;
  const enhancedByTool = metadata && 'enhancedByTool' in metadata;

  if (hasToolId || type === 'tool_generated') return 'tool_generated';
  if (type === 'tool_enhanced' || enhancedByTool) return 'tool_enhanced';
  if (type === 'event' || hasEventDate) return 'space_event';
  if (type === 'announcement') return 'builder_announcement';
  if (source === 'rss') return 'rss_import';
  return 'other';
}

// Helper function to determine user permissions
function determineUserPermissions(role: string, status: string, engagementLevel: number): UserSpaceContext['permissions'] {
  const isActive = status === 'active';
  const isEngaged = engagementLevel >= 20;

  return {
    canViewContent: isActive,
    canInteractWithTools: isActive && isEngaged,
    canCreateContent: isActive && (role !== 'member' || engagementLevel >= 30),
    canModerateContent: isActive && ['moderator', 'admin'].includes(role)
  };
}

// Helper function to calculate user engagement in space
async function calculateUserEngagementInSpace(userId: string, spaceId: string, campusId: string): Promise<number> {
  try {
    // Get recent activity in this space
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityQuery: admin.firestore.Query<admin.firestore.DocumentData> = dbAdmin
      .collection('activityEvents')
      .where('userId', '==', userId)
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .where('date', '>=', thirtyDaysAgo.toISOString().split('T')[0])
      .limit(100);

    const activitySnapshot = await activityQuery.get();
    const activities = activitySnapshot.docs.map(doc => doc.data());

    let engagement = 20; // Base engagement

    // Activity frequency
    const uniqueDays = new Set(activities.map(a => a.date)).size;
    engagement += Math.min(30, uniqueDays * 2);

    // Activity types
    const toolInteractions = activities.filter(a => a.type === 'tool_interaction').length;
    const socialInteractions = activities.filter(a => a.type === 'social_interaction').length;
    const contentCreation = activities.filter(a => a.type === 'content_creation').length;

    engagement += Math.min(20, toolInteractions);
    engagement += Math.min(15, socialInteractions);
    engagement += contentCreation * 3;

    return Math.min(100, engagement);
  } catch (error) {
    logger.error(
      `Error calculating engagement at /api/feed/space-filtering`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return 20;
  }
}

// Helper function to determine visibility level
function determineVisibilityLevel(context: UserSpaceContext, rules: SpaceVisibilityRules): 'full' | 'limited' | 'preview' {
  if (!context.permissions.canViewContent) return 'preview';

  if (checkMembershipRequirements(context, rules) && context.status === 'active') {
    return 'full';
  }

  return 'limited';
}

// Helper function to generate access reason
function generateAccessReason(context: UserSpaceContext, rules: SpaceVisibilityRules): string {
  if (context.status !== 'active') return 'Inactive membership';
  if (!context.permissions.canViewContent) return 'Insufficient permissions';
  if (!checkMembershipRequirements(context, rules)) return 'Does not meet membership requirements';
  return `${context.role} in ${rules.spaceName}`;
}

// Helper function to get space access info
async function getSpaceAccessInfo(userId: string, spaceId: string, includePreview: boolean, campusId: string): Promise<Record<string, unknown>> {
  try {
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return { spaceId, accessible: false, reason: 'Space not found' };
    }

    const spaceData = spaceDoc.data();
    if (!spaceData) {
      return { spaceId, accessible: false, reason: 'Space data not found' };
    }
    // Enforce campus isolation strictly
    if (spaceData.campusId && spaceData.campusId !== campusId) {
      return { spaceId, accessible: false, reason: 'Access denied - campus mismatch' };
    }

    // Check membership
    const memberQuery: admin.firestore.Query<admin.firestore.DocumentData> = dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId);

    const memberSnapshot = await memberQuery.get();

    if (memberSnapshot.empty) {
      return {
        spaceId,
        spaceName: spaceData.name,
        accessible: includePreview,
        reason: includePreview ? 'Preview access' : 'Not a member',
        accessLevel: 'preview'
      };
    }

    const memberData = memberSnapshot.docs[0].data();
    const engagementLevel = await calculateUserEngagementInSpace(userId, spaceId, campusId);
    const permissions = determineUserPermissions(memberData.role, memberData.status, engagementLevel);

    return {
      spaceId,
      spaceName: spaceData.name,
      accessible: true,
      reason: `${memberData.role} member`,
      accessLevel: memberData.status === 'active' ? 'full' : 'limited',
      role: memberData.role,
      status: memberData.status,
      engagementLevel,
      permissions,
      joinedAt: memberData.joinedAt,
      lastActivity: memberData.lastActivity
    };
  } catch (error) {
    logger.error(
      `Error getting space access info at /api/feed/space-filtering`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return { spaceId, accessible: false, reason: 'Error checking access' };
  }
}
