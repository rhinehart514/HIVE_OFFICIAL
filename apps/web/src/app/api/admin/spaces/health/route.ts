/**
 * Admin Space Health API
 *
 * GET: Fetch all spaces with health metrics and launch readiness scores
 *
 * This is a P0 cross-slice integration endpoint that connects Admin with Spaces.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';

const HealthQuerySchema = z.object({
  sortBy: z.enum(['readiness', 'activity', 'members', 'messages', 'name']).optional().default('readiness'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  minReadiness: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
  maxReadiness: z.string().optional().transform(v => v ? parseInt(v, 10) : 100),
  hasLeader: z.enum(['true', 'false', 'all']).optional().default('all'),
  category: z.string().optional(),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

interface SpaceHealthMetrics {
  id: string;
  name: string;
  handle: string;
  category: string;
  imageUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  isFeatured: boolean;

  // Core metrics
  memberCount: number;
  messageCount: number;
  toolCount: number;
  boardCount: number;

  // Activity metrics (last 7 days)
  messagesLast7d: number;
  activeMembers7d: number;
  newMembers7d: number;

  // Leader info
  leaderId?: string;
  leaderName?: string;
  leaderHandle?: string;
  leaderLastActive?: string;
  leaderResponseTime?: number; // avg hours to respond

  // Readiness score (0-100)
  readinessScore: number;
  readinessBreakdown: {
    hasLeader: boolean;
    hasDescription: boolean;
    hasImage: boolean;
    hasTools: boolean;
    hasMembers: boolean;
    hasRecentActivity: boolean;
  };

  // Flags
  needsAttention: boolean;
  attentionReasons: string[];

  createdAt: string;
  lastActivityAt?: string;
}

/**
 * Calculate launch readiness score for a space
 */
function calculateReadinessScore(space: {
  leaderId?: string;
  description?: string;
  imageUrl?: string;
  toolCount: number;
  memberCount: number;
  messagesLast7d: number;
}): { score: number; breakdown: SpaceHealthMetrics['readinessBreakdown'] } {
  const breakdown = {
    hasLeader: !!space.leaderId,
    hasDescription: !!space.description && space.description.length > 20,
    hasImage: !!space.imageUrl,
    hasTools: space.toolCount > 0,
    hasMembers: space.memberCount >= 3,
    hasRecentActivity: space.messagesLast7d > 0,
  };

  // Weight each factor
  const weights = {
    hasLeader: 25,
    hasDescription: 15,
    hasImage: 10,
    hasTools: 15,
    hasMembers: 20,
    hasRecentActivity: 15,
  };

  let score = 0;
  for (const [key, hasIt] of Object.entries(breakdown)) {
    if (hasIt) {
      score += weights[key as keyof typeof weights];
    }
  }

  return { score, breakdown };
}

/**
 * Identify attention reasons for a space
 */
function getAttentionReasons(metrics: {
  memberCount: number;
  messagesLast7d: number;
  leaderLastActive?: string;
  readinessScore: number;
  isVerified: boolean;
  toolCount: number;
}): string[] {
  const reasons: string[] = [];

  // Low readiness
  if (metrics.readinessScore < 50) {
    reasons.push('Low readiness score');
  }

  // No recent activity
  if (metrics.messagesLast7d === 0) {
    reasons.push('No messages in 7 days');
  }

  // Inactive leader
  if (metrics.leaderLastActive) {
    const lastActive = new Date(metrics.leaderLastActive);
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 7) {
      reasons.push('Leader inactive for 7+ days');
    }
  }

  // Low members
  if (metrics.memberCount < 3) {
    reasons.push('Fewer than 3 members');
  }

  // Verified but no tools
  if (metrics.isVerified && metrics.toolCount === 0) {
    reasons.push('Verified but no tools deployed');
  }

  return reasons;
}

/**
 * GET /api/admin/spaces/health
 * Fetch all spaces with health metrics for launch readiness
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = HealthQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Fetch all spaces
    let spacesQuery = dbAdmin
      .collection('spaces')
      .where('campusId', '==', campusId)
      .where('isActive', '==', true);

    if (query.category) {
      spacesQuery = spacesQuery.where('category', '==', query.category);
    }

    const spacesSnapshot = await spacesQuery.get();

    // Get message counts for activity analysis
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Process each space
    const healthMetrics: SpaceHealthMetrics[] = [];

    for (const spaceDoc of spacesSnapshot.docs) {
      const spaceData = spaceDoc.data();
      const spaceId = spaceDoc.id;

      // Count messages in last 7 days
      const recentMessagesSnapshot = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('messages')
        .where('createdAt', '>=', sevenDaysAgo)
        .count()
        .get();
      const messagesLast7d = recentMessagesSnapshot.data().count;

      // Get unique message authors in last 7 days (activeMembers7d)
      const recentMessagesForAuthors = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('messages')
        .where('createdAt', '>=', sevenDaysAgo)
        .select('authorId')
        .get();
      const uniqueAuthors = new Set(
        recentMessagesForAuthors.docs
          .map(doc => doc.data().authorId)
          .filter(Boolean)
      );
      const activeMembers7d = uniqueAuthors.size;

      // Count new members in last 7 days (newMembers7d)
      const newMembersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('campusId', '==', campusId)
        .where('joinedAt', '>=', sevenDaysAgo)
        .where('isActive', '==', true)
        .count()
        .get();
      const newMembers7d = newMembersSnapshot.data().count;

      // Count total messages
      const totalMessagesSnapshot = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('messages')
        .count()
        .get();
      const messageCount = totalMessagesSnapshot.data().count;

      // Count tools
      const toolsSnapshot = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('placedTools')
        .count()
        .get();
      const toolCount = toolsSnapshot.data().count;

      // Count boards
      const boardsSnapshot = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .count()
        .get();
      const boardCount = boardsSnapshot.data().count;

      // Get leader info if exists
      let leaderInfo: {
        leaderId?: string;
        leaderName?: string;
        leaderHandle?: string;
        leaderLastActive?: string;
      } = {};

      if (spaceData.leaderId) {
        const leaderDoc = await dbAdmin.collection('profiles').doc(spaceData.leaderId).get();
        if (leaderDoc.exists) {
          const leaderData = leaderDoc.data();
          leaderInfo = {
            leaderId: spaceData.leaderId,
            leaderName: leaderData?.displayName,
            leaderHandle: leaderData?.handle,
            leaderLastActive: leaderData?.lastActiveAt?.toDate?.()?.toISOString(),
          };
        }
      }

      // Calculate readiness score
      const { score: readinessScore, breakdown: readinessBreakdown } = calculateReadinessScore({
        leaderId: spaceData.leaderId,
        description: spaceData.description,
        imageUrl: spaceData.imageUrl,
        toolCount,
        memberCount: spaceData.memberCount || 0,
        messagesLast7d,
      });

      // Check attention reasons
      const attentionReasons = getAttentionReasons({
        memberCount: spaceData.memberCount || 0,
        messagesLast7d,
        leaderLastActive: leaderInfo.leaderLastActive,
        readinessScore,
        isVerified: spaceData.isVerified || false,
        toolCount,
      });

      const metrics: SpaceHealthMetrics = {
        id: spaceId,
        name: spaceData.name,
        handle: spaceData.handle || spaceId,
        category: spaceData.category || 'uncategorized',
        imageUrl: spaceData.imageUrl,
        isVerified: spaceData.isVerified || false,
        isActive: spaceData.isActive !== false,
        isFeatured: spaceData.isFeatured || false,

        memberCount: spaceData.memberCount || 0,
        messageCount,
        toolCount,
        boardCount,

        messagesLast7d,
        activeMembers7d,
        newMembers7d,

        ...leaderInfo,

        readinessScore,
        readinessBreakdown,

        needsAttention: attentionReasons.length > 0,
        attentionReasons,

        createdAt: spaceData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastActivityAt: spaceData.lastActivityAt?.toDate?.()?.toISOString(),
      };

      // Apply readiness filter
      if (readinessScore >= query.minReadiness && readinessScore <= query.maxReadiness) {
        // Apply leader filter
        if (query.hasLeader === 'all' ||
            (query.hasLeader === 'true' && metrics.leaderId) ||
            (query.hasLeader === 'false' && !metrics.leaderId)) {
          healthMetrics.push(metrics);
        }
      }
    }

    // Sort
    healthMetrics.sort((a, b) => {
      let comparison = 0;
      switch (query.sortBy) {
        case 'readiness':
          comparison = a.readinessScore - b.readinessScore;
          break;
        case 'activity':
          comparison = a.messagesLast7d - b.messagesLast7d;
          break;
        case 'members':
          comparison = a.memberCount - b.memberCount;
          break;
        case 'messages':
          comparison = a.messageCount - b.messageCount;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return query.sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate summary stats
    const stats = {
      total: healthMetrics.length,
      launchReady: healthMetrics.filter(m => m.readinessScore >= 80).length,
      almostReady: healthMetrics.filter(m => m.readinessScore >= 50 && m.readinessScore < 80).length,
      needsWork: healthMetrics.filter(m => m.readinessScore < 50).length,
      needsAttention: healthMetrics.filter(m => m.needsAttention).length,
      withLeaders: healthMetrics.filter(m => m.leaderId).length,
      verified: healthMetrics.filter(m => m.isVerified).length,
      avgReadiness: healthMetrics.length > 0
        ? Math.round(healthMetrics.reduce((sum, m) => sum + m.readinessScore, 0) / healthMetrics.length)
        : 0,
      totalMembers: healthMetrics.reduce((sum, m) => sum + m.memberCount, 0),
      totalMessages7d: healthMetrics.reduce((sum, m) => sum + m.messagesLast7d, 0),
    };

    // Apply pagination
    const total = healthMetrics.length;
    const paginatedMetrics = healthMetrics.slice(query.offset, query.offset + query.limit);

    logger.info('Space health metrics fetched', {
      total,
      filters: query,
    });

    return respond.success({
      spaces: paginatedMetrics,
      stats,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + paginatedMetrics.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch space health metrics', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch space health metrics', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
