import { dbAdmin as adminDb } from '@/lib/firebase-admin';
import { logger } from "@/lib/structured-logger";
import type * as admin from 'firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { withCache } from '../../../../lib/cache-headers';

// Type definition for tool data from Firestore
interface ToolData {
  id: string;
  toolId?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  stats?: {
    rating?: number;
    downloads?: number;
  };
  ownerId?: string;
  ownerName?: string;
  pricing?: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
  };
  verified?: boolean;
  featured?: boolean;
  screenshots?: string[];
  targetAudience?: string[];
  campusId?: string;
}

// Helper to safely build a ToolRecommendation from ToolData
function buildRecommendation(
  tool: ToolData,
  reason: string,
  score: number
): ToolRecommendation {
  return {
    toolId: tool.toolId || tool.id,
    name: tool.name || 'Unknown Tool',
    description: tool.description || '',
    category: tool.category || 'uncategorized',
    tags: tool.tags || [],
    rating: tool.stats?.rating ?? 0,
    downloads: tool.stats?.downloads ?? 0,
    ownerId: tool.ownerId || '',
    ownerName: tool.ownerName || 'Unknown',
    pricing: tool.pricing || { type: 'free' },
    recommendationReason: reason,
    relevanceScore: score,
    isVerified: tool.verified ?? false,
    isFeatured: tool.featured ?? false,
    screenshots: tool.screenshots,
  };
}

interface RecommendationContext {
  userId: string;
  userType?: string;
  institution?: string;
  interests?: string[];
  spaceIds?: string[];
  recentActivity?: string[];
  installedToolIds?: string[];
}

interface ToolRecommendation {
  toolId: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  ownerId: string;
  ownerName: string;
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
  };
  recommendationReason: string;
  relevanceScore: number;
  isVerified: boolean;
  isFeatured: boolean;
  screenshots?: string[];
}

interface RecommendationResponse {
  recommendations: ToolRecommendation[];
  categories: Array<{
    category: string;
    title: string;
    tools: ToolRecommendation[];
  }>;
  trending: ToolRecommendation[];
  personalized: ToolRecommendation[];
  metadata: {
    totalRecommendations: number;
    algorithmsUsed: string[];
    lastUpdated: string;
  };
}

// GET - Get personalized tool recommendations
const _GET = withAuthAndErrors(async (
  request,
  _context,
  respond
) => {
  try {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest) || '';

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') ?? undefined;
    const limit_param = parseInt(searchParams.get('limit') ?? '20');
    const includeInstalled = searchParams.get('includeInstalled') === 'true';

    // Get user context
    const context = await buildUserContext(userId, campusId);

    // Generate recommendations
    const recommendations = await generateRecommendations(context, campusId, {
      category,
      limit: limit_param,
      includeInstalled
    });

    return respond.success(recommendations);

  } catch (error) {
    logger.error(
      `Error generating recommendations at /api/tools/recommendations`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return respond.error("Failed to generate recommendations", "INTERNAL_ERROR", { status: 500 });
  }
});

// Helper function to build user context
async function buildUserContext(userId: string, campusId: string): Promise<RecommendationContext> {
  // Get user profile
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  if (!userData) {
    return {
      userId,
      userType: undefined,
      institution: undefined,
      interests: [],
      spaceIds: [],
      recentActivity: [],
      installedToolIds: []
    };
  }

  // Get user's spaces
  const spaceMembershipsSnapshot = await adminDb
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const spaceIds = [] as string[];
  for (const doc of spaceMembershipsSnapshot.docs) {
    const sid = doc.data().spaceId;
    const sDoc = await adminDb.collection('spaces').doc(sid).get();
    if (sDoc.exists && (sDoc.data()?.campusId === campusId)) {
      spaceIds.push(sid);
    }
  }

  // Get installed tools
  const installationsSnapshot = await adminDb
    .collection('toolInstallations')
    .where('installerId', '==', userId)
    .where('campusId', '==', campusId)
    .where('status', '==', 'active')
    .get();

  const installedToolIds = installationsSnapshot.docs.map(doc => doc.data().toolId);

  // Get recent activity
  const recentActivitySnapshot = await adminDb
    .collection('analytics_events')
    .where('userId', '==', userId)
    .where('eventType', 'in', ['tool_interaction', 'tool_installed', 'tool_reviewed'])
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  const recentActivity = recentActivitySnapshot.docs.map(doc => {
    const data = doc.data();
    return `${data.eventType}:${data.toolId || 'unknown'}`;
  });

  return {
    userId,
    userType: userData?.userType,
    institution: userData?.institution,
    interests: userData?.interests || [],
    spaceIds,
    recentActivity,
    installedToolIds
  };
}

// Main recommendation generation function
async function generateRecommendations(
  context: RecommendationContext,
  campusId: string,
  options: { category?: string; limit: number; includeInstalled?: boolean }
): Promise<RecommendationResponse> {
  const { category, limit, includeInstalled = false } = options;

  // Get all marketplace tools
  let marketplaceQuery: admin.firestore.Query<admin.firestore.DocumentData> = adminDb.collection('marketplace');

  if (category) {
    marketplaceQuery = marketplaceQuery.where('category', '==', category);
  }

  const marketplaceSnapshot = await marketplaceQuery.get();
  const allToolsRaw = marketplaceSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Filter to current campus by checking underlying tool's campusId
  const allTools: ToolData[] = [];
  for (const t of allToolsRaw) {
    const toolData = t as ToolData;
    if (!toolData.toolId) continue;
    const tDoc = await adminDb.collection('tools').doc(toolData.toolId).get();
    if (tDoc.exists && (tDoc.data()?.campusId === campusId)) {
      allTools.push(toolData);
    }
  }

  // Filter out installed tools if requested
  const availableTools = includeInstalled 
    ? allTools 
    : allTools.filter(tool => tool.toolId && !context.installedToolIds?.includes(tool.toolId));

  // Generate different types of recommendations
  const contentBasedRecs = await generateContentBasedRecommendations(context, availableTools);
  const collaborativeRecs = await generateCollaborativeRecommendations(context, availableTools);
  const trendingRecs = await generateTrendingRecommendations(availableTools);
  const categoryRecs = await generateCategoryRecommendations(context, availableTools);

  // Combine and rank recommendations
  const combinedRecs = combineRecommendations([
    ...contentBasedRecs.map(tool => ({ ...tool, algorithm: 'content-based' })),
    ...collaborativeRecs.map(tool => ({ ...tool, algorithm: 'collaborative' })),
    ...trendingRecs.map(tool => ({ ...tool, algorithm: 'trending' })),
    ...categoryRecs.map(tool => ({ ...tool, algorithm: 'category-based' }))
  ]);

  // Sort by relevance score and limit results
  const topRecommendations = combinedRecs
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  // Group by categories
  const categories = groupByCategories(topRecommendations);

  // Get trending tools (separate from personalized)
  const trending = trendingRecs.slice(0, 10);

  // Get personalized recommendations (content + collaborative)
  const personalized = [...contentBasedRecs, ...collaborativeRecs]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);

  return {
    recommendations: topRecommendations,
    categories,
    trending,
    personalized,
    metadata: {
      totalRecommendations: topRecommendations.length,
      algorithmsUsed: ['content-based', 'collaborative', 'trending', 'category-based'],
      lastUpdated: new Date().toISOString()
    }
  };
}

// Content-based recommendations (based on user interests and activity)
async function generateContentBasedRecommendations(
  context: RecommendationContext,
  tools: ToolData[]
): Promise<ToolRecommendation[]> {
  const recommendations: ToolRecommendation[] = [];

  for (const tool of tools) {
    let score = 0;
    const reasons = [];

    // Score based on user interests
    if (context.interests?.length && tool.tags?.length) {
      const interestMatches = tool.tags.filter((tag: string) =>
        context.interests!.some(interest =>
          interest.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(interest.toLowerCase())
        )
      ).length;

      if (interestMatches > 0) {
        score += interestMatches * 20;
        reasons.push(`Matches your interests: ${tool.tags.slice(0, 2).join(', ')}`);
      }
    }

    // Score based on category preferences from recent activity
    const categoryActivity = context.recentActivity?.filter(activity => 
      activity.includes('tool_interaction') || activity.includes('tool_installed')
    ).length || 0;
    
    if (categoryActivity > 0) {
      score += Math.min(categoryActivity * 5, 25);
      reasons.push('Similar to tools you\'ve used recently');
    }

    // Score based on user type compatibility
    if (context.userType && tool.targetAudience?.includes(context.userType)) {
      score += 15;
      reasons.push(`Designed for ${context.userType}s`);
    }

    // Score based on institution popularity
    if (context.institution) {
      // This would require tracking institution-specific tool usage
      score += 5;
    }

    // Bonus for high-quality tools
    if ((tool.stats?.rating ?? 0) >= 4.5) {
      score += 10;
      reasons.push('Highly rated by users');
    }

    if (tool.verified) {
      score += 5;
      reasons.push('Verified by HIVE');
    }

    if (score > 10) {
      recommendations.push(buildRecommendation(tool, reasons[0] || 'Recommended for you', score));
    }
  }

  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Collaborative filtering recommendations (based on similar users)
async function generateCollaborativeRecommendations(
  context: RecommendationContext,
  tools: ToolData[]
): Promise<ToolRecommendation[]> {
  // Find users with similar tool usage patterns
  const similarUsers = await findSimilarUsers(context);
  
  // Get tools used by similar users that current user hasn't installed
  const collaborativeTools = new Map<string, { tool: ToolData; score: number; userCount: number }>();

  for (const similarUser of similarUsers) {
    const userInstallationsSnapshot = await adminDb
      .collection('toolInstallations')
      .where('installerId', '==', similarUser.userId)
      .where('status', '==', 'active')
      .get();

    const userToolIds = userInstallationsSnapshot.docs.map(doc => doc.data().toolId);

    for (const toolId of userToolIds) {
      if (!context.installedToolIds?.includes(toolId)) {
        const tool = tools.find(t => t.toolId === toolId);
        if (tool) {
          const existing = collaborativeTools.get(toolId);
          if (existing) {
            existing.score += similarUser.similarity * 10;
            existing.userCount++;
          } else {
            collaborativeTools.set(toolId, {
              tool,
              score: similarUser.similarity * 10,
              userCount: 1
            });
          }
        }
      }
    }
  }

  // Convert to recommendations
  const recommendations: ToolRecommendation[] = [];

  for (const [_toolId, data] of collaborativeTools) {
    const { tool, score, userCount } = data;

    if (score > 5 && userCount >= 2) {
      recommendations.push(buildRecommendation(
        tool,
        `Used by ${userCount} similar users`,
        score + (userCount * 5)
      ));
    }
  }

  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Trending recommendations (based on recent popularity)
async function generateTrendingRecommendations(tools: ToolData[]): Promise<ToolRecommendation[]> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get recent installation events
  const recentInstallsSnapshot = await adminDb
    .collection('analytics_events')
    .where('eventType', '==', 'tool_installed')
    .where('timestamp', '>=', weekAgo.toISOString())
    .get();

  const installCounts = recentInstallsSnapshot.docs.reduce((acc, doc) => {
    const toolId = doc.data().toolId;
    acc[toolId] = (acc[toolId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Score tools based on recent activity
  const trendingTools = tools
    .map(tool => {
      const toolId = tool.toolId || tool.id;
      const recentInstalls = installCounts[toolId] || 0;
      const trendScore = recentInstalls * 10 + ((tool.stats?.rating ?? 0) * 5);

      return buildRecommendation(
        tool,
        `Trending with ${recentInstalls} recent installs`,
        trendScore
      );
    })
    .filter(tool => tool.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return trendingTools;
}

// Category-based recommendations
async function generateCategoryRecommendations(
  context: RecommendationContext,
  tools: ToolData[]
): Promise<ToolRecommendation[]> {
  // Determine user's preferred categories based on installed tools
  const categoryPreferences = new Map<string, number>();
  
  for (const toolId of context.installedToolIds || []) {
    const tool = tools.find(t => t.toolId === toolId);
    if (tool && tool.category) {
      const count = categoryPreferences.get(tool.category) || 0;
      categoryPreferences.set(tool.category, count + 1);
    }
  }

  // Get top tools from preferred categories
  const recommendations: ToolRecommendation[] = [];

  for (const [category, preference] of categoryPreferences) {
    const categoryTools = tools
      .filter(tool => tool.category === category)
      .filter(tool => {
        const tid = tool.toolId || tool.id;
        return !context.installedToolIds?.includes(tid);
      })
      .sort((a, b) => (b.stats?.rating ?? 0) - (a.stats?.rating ?? 0))
      .slice(0, 5);

    for (const tool of categoryTools) {
      const score = preference * 10 + (tool.stats?.rating ?? 0) * 5;
      recommendations.push(buildRecommendation(tool, `Top-rated ${category} tool`, score));
    }
  }

  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Helper function to find similar users
async function findSimilarUsers(context: RecommendationContext): Promise<Array<{ userId: string; similarity: number }>> {
  // Get users from same institution
  const similarUsersSnapshot = await adminDb
    .collection('users')
    .where('institution', '==', context.institution)
    .limit(100)
    .get();

  const similarUsers = [];

  for (const doc of similarUsersSnapshot.docs) {
    const userData = doc.data();
    if (userData.id === context.userId) continue;

    // Calculate similarity based on shared interests and spaces
    let similarity = 0;
    
    // Shared interests
    const sharedInterests = (userData.interests || []).filter((interest: string) =>
      context.interests?.includes(interest)
    ).length;
    similarity += sharedInterests * 0.3;

    // Shared spaces
    const userSpacesSnapshot = await adminDb
      .collection('spaceMembers')
      .where('userId', '==', userData.id)
      .where('status', '==', 'active')
      .get();
    
    const userSpaceIds = userSpacesSnapshot.docs.map(doc => doc.data().spaceId);
    const sharedSpaces = userSpaceIds.filter(spaceId => context.spaceIds?.includes(spaceId)).length;
    similarity += sharedSpaces * 0.2;

    if (similarity > 0.5) {
      similarUsers.push({
        userId: userData.id,
        similarity
      });
    }
  }

  return similarUsers.sort((a, b) => b.similarity - a.similarity).slice(0, 20);
}

// Helper function to combine recommendations and remove duplicates
function combineRecommendations(recommendations: Array<ToolRecommendation & { algorithm: string }>): ToolRecommendation[] {
  const toolMap = new Map<string, ToolRecommendation>();

  for (const rec of recommendations) {
    const existing = toolMap.get(rec.toolId);
    if (existing) {
      // Combine scores and update reason if score is higher
      if (rec.relevanceScore > existing.relevanceScore) {
        toolMap.set(rec.toolId, {
          ...rec,
          relevanceScore: (existing.relevanceScore + rec.relevanceScore) * 0.6
        });
      }
    } else {
      toolMap.set(rec.toolId, rec);
    }
  }

  return Array.from(toolMap.values());
}

// Helper function to group recommendations by category
function groupByCategories(recommendations: ToolRecommendation[]) {
  const categories = new Map<string, ToolRecommendation[]>();

  for (const rec of recommendations) {
    const existing = categories.get(rec.category) || [];
    existing.push(rec);
    categories.set(rec.category, existing);
  }

  return Array.from(categories.entries()).map(([category, tools]) => ({
    category,
    title: category.charAt(0).toUpperCase() + category.slice(1),
    tools: tools.slice(0, 6) // Limit to 6 tools per category
  }));
}

export const GET = withCache(_GET, 'SHORT');
