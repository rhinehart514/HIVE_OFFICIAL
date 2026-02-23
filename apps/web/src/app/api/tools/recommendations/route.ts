/**
 * GET /api/tools/recommendations
 *
 * Returns trending and personalized tool recommendations.
 * Scoring: usage count + space membership overlap + interest match + recency.
 * Same pattern as /api/events/personalized.
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { type ResponseFormatter } from '@/lib/middleware/response';

// Interest keywords → tool category mapping (mirrors event personalization)
const INTEREST_TO_TOOL_TYPE: Record<string, string[]> = {
  academic: ['form', 'checklist', 'signup', 'timer', 'progress'],
  sports: ['leaderboard', 'counter', 'poll', 'timer', 'signup'],
  social: ['poll', 'rsvp', 'form', 'announcement', 'signup'],
  gaming: ['leaderboard', 'counter', 'poll', 'timer'],
  technology: ['form', 'checklist', 'counter', 'leaderboard'],
  music: ['poll', 'rsvp', 'counter', 'signup'],
  wellness: ['checklist', 'timer', 'progress', 'counter'],
  career: ['form', 'signup', 'checklist', 'announcement'],
  food: ['poll', 'rsvp', 'signup', 'form'],
};

interface ScoredTool {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type?: string;
  usageCount: number;
  activeUserCount: number;
  deploymentCount: number;
  relevanceScore: number;
  matchReasons: string[];
  createdAt?: string;
  ownerId?: string;
}

async function handler(
  request: AuthenticatedRequest,
  _context: unknown,
  respond: typeof ResponseFormatter
): Promise<Response> {
  const userId = getUserId(request);
  const campusId = getCampusId(request) || 'ub-buffalo';

  try {
    const { searchParams } = new URL(request.url);
    const maxItems = Math.min(Number(searchParams.get('maxItems') || 20), 50);

    // Fetch user data, memberships, and analytics in parallel
    const [userDoc, membershipsSnapshot, analyticsSnapshot, toolsSnapshot] = await Promise.all([
      dbAdmin.collection('users').doc(userId).get(),
      dbAdmin.collection('spaceMembers')
        .where('userId', '==', userId)
        .get()
        .catch(() => ({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] })),
      dbAdmin.collection('tool_analytics')
        .orderBy('usageCount', 'desc')
        .limit(200)
        .get()
        .catch(() => ({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] })),
      // campusId filter omitted — single-field index is exempted (FAILED_PRECONDITION).
      // Campus isolation enforced in-memory below.
      dbAdmin.collection('tools')
        .where('isPublic', '==', true)
        .limit(200)
        .get()
        .catch(() => ({ docs: [] as FirebaseFirestore.QueryDocumentSnapshot[] })),
    ]);

    const userData = userDoc.data() || {};
    const userInterests: string[] = (userData.interests || []).map((i: string) => i.toLowerCase());
    const userSpaceIds = new Set(membershipsSnapshot.docs.map(doc => doc.data().spaceId));

    // Build analytics lookup: toolId → aggregated stats
    const toolStats = new Map<string, { usageCount: number; activeUsers: number; spaceIds: Set<string> }>();
    for (const doc of analyticsSnapshot.docs) {
      const data = doc.data();
      const toolId = data.toolId as string;
      if (!toolId) continue;

      const existing = toolStats.get(toolId) || { usageCount: 0, activeUsers: 0, spaceIds: new Set<string>() };
      existing.usageCount += (data.usageCount as number) || 0;
      existing.activeUsers += Array.isArray(data.activeUsers) ? data.activeUsers.length : 0;
      if (data.spaceId) existing.spaceIds.add(data.spaceId as string);
      toolStats.set(toolId, existing);
    }

    // Score each public tool
    const scoredTools: ScoredTool[] = [];

    for (const doc of toolsSnapshot.docs) {
      const tool = doc.data();
      // In-memory campus isolation (campusId Firestore filter is exempted from index)
      if (tool.campusId && tool.campusId !== campusId) continue;
      // Skip user's own tools
      if (tool.ownerId === userId || tool.createdBy === userId) continue;

      const toolId = doc.id;
      const stats = toolStats.get(toolId) || { usageCount: 0, activeUsers: 0, spaceIds: new Set<string>() };

      let relevanceScore = 0;
      const matchReasons: string[] = [];

      // Usage popularity (0-40 points, log scale)
      if (stats.usageCount > 0) {
        const usageScore = Math.min(Math.log10(stats.usageCount + 1) * 15, 40);
        relevanceScore += usageScore;
        if (stats.usageCount >= 50) matchReasons.push('Popular tool');
      }

      // Active users (0-30 points)
      if (stats.activeUsers > 0) {
        const activeScore = Math.min(stats.activeUsers * 3, 30);
        relevanceScore += activeScore;
      }

      // Space membership overlap (0-25 points)
      let spaceOverlap = 0;
      for (const spaceId of stats.spaceIds) {
        if (userSpaceIds.has(spaceId)) spaceOverlap++;
      }
      if (spaceOverlap > 0) {
        relevanceScore += Math.min(spaceOverlap * 10, 25);
        matchReasons.push(`Used in ${spaceOverlap} of your space${spaceOverlap > 1 ? 's' : ''}`);
      }

      // Interest match (0-30 points)
      const toolName = ((tool.name || '') as string).toLowerCase();
      const toolDesc = ((tool.description || '') as string).toLowerCase();
      const toolType = ((tool.type || tool.toolType || '') as string).toLowerCase();
      const toolText = `${toolName} ${toolDesc} ${toolType}`;

      for (const interest of userInterests) {
        // Direct text match
        if (toolText.includes(interest)) {
          relevanceScore += 15;
          matchReasons.push(`Matches "${interest}"`);
          break;
        }
        // Category-based match
        const categoryTypes = INTEREST_TO_TOOL_TYPE[interest];
        if (categoryTypes && categoryTypes.some(t => toolText.includes(t))) {
          relevanceScore += 10;
          matchReasons.push(`Related to ${interest}`);
          break;
        }
      }

      // Recency bonus (0-15 points, tools created in last 7 days)
      const createdAt = tool.createdAt?.toDate?.() || (tool.createdAt ? new Date(tool.createdAt) : null);
      if (createdAt) {
        const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld <= 7) {
          relevanceScore += 15;
          matchReasons.push('New');
        } else if (daysOld <= 14) {
          relevanceScore += 8;
        }
      }

      // Deployment count as social proof
      const deploymentCount = stats.spaceIds.size;

      scoredTools.push({
        id: toolId,
        name: (tool.name || tool.title || 'Untitled Tool') as string,
        description: tool.description as string | undefined,
        icon: tool.icon as string | undefined,
        type: toolType || undefined,
        usageCount: stats.usageCount,
        activeUserCount: stats.activeUsers,
        deploymentCount,
        relevanceScore,
        matchReasons,
        createdAt: createdAt?.toISOString(),
        ownerId: (tool.ownerId || tool.createdBy) as string | undefined,
      });
    }

    // Sort by relevance, take top N
    scoredTools.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const trending = scoredTools.slice(0, maxItems);

    logger.info('Tool recommendations generated', {
      userId,
      campusId,
      totalCandidates: toolsSnapshot.docs.length,
      returned: trending.length,
    });

    return respond.success({
      trending,
      meta: {
        totalAvailable: scoredTools.length,
        returned: trending.length,
        userInterests: userInterests.slice(0, 5),
      },
    });
  } catch (error) {
    logger.error('Tool recommendations error', {}, error instanceof Error ? error : undefined);
    return respond.error('Failed to generate recommendations', 'INTERNAL_ERROR', { status: 500 });
  }
}

export const GET = withAuthAndErrors(handler);
