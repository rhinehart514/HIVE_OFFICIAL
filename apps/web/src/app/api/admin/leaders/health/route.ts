/**
 * Admin Leader Health API
 *
 * GET /api/admin/leaders/health
 *
 * Returns leader health metrics for the admin dashboard:
 * - Setup completion rates
 * - Activity levels
 * - At-risk leaders
 *
 * @author HIVE Backend Team
 * @version 1.0.0
 */

import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { withCache } from '../../../../../lib/cache-headers';

interface LeaderHealthMetrics {
  totalVerified: number;
  setupComplete: { count: number; percentage: number };
  postedWelcome: { count: number; percentage: number };
  deployedTool: { count: number; percentage: number };
  fivePlusMembers: { count: number; percentage: number };
  atRiskLeaders: AtRiskLeader[];
  verifiedThisWeek: number;
  avgSetupTimeHours: number;
}

interface AtRiskLeader {
  userId: string;
  userName: string;
  userEmail: string;
  spaceName: string;
  spaceId: string;
  lastActiveAt: string | null;
  daysSinceActive: number;
  setupProgress: {
    welcomeMessage: boolean;
    toolDeployed: boolean;
    memberCount: number;
  };
}

const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  if (!isFirebaseConfigured) {
    return respond.error('Database not configured', 'SERVICE_UNAVAILABLE', { status: 503 });
  }

  const campusId = getCampusId(request as AuthenticatedRequest);

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all verified leader claims
    const claimsSnapshot = await dbAdmin
      .collection('builderRequests')
      .where('campusId', '==', campusId)
      .where('type', '==', 'claim')
      .where('status', '==', 'approved')
      .get();

    const verifiedLeaderIds = new Set<string>();
    const leaderSpaceMap = new Map<string, { spaceId: string; spaceName: string; verifiedAt: Date }>();

    claimsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      verifiedLeaderIds.add(data.userId);
      leaderSpaceMap.set(data.userId, {
        spaceId: data.spaceId,
        spaceName: data.spaceName || 'Unknown Space',
        verifiedAt: data.reviewedAt?.toDate() || data.submittedAt?.toDate() || now,
      });
    });

    const totalVerified = verifiedLeaderIds.size;

    if (totalVerified === 0) {
      // No verified leaders yet
      const emptyMetrics: LeaderHealthMetrics = {
        totalVerified: 0,
        setupComplete: { count: 0, percentage: 0 },
        postedWelcome: { count: 0, percentage: 0 },
        deployedTool: { count: 0, percentage: 0 },
        fivePlusMembers: { count: 0, percentage: 0 },
        atRiskLeaders: [],
        verifiedThisWeek: 0,
        avgSetupTimeHours: 0,
      };
      return respond.success(emptyMetrics);
    }

    // Fetch space data for all leader spaces
    const spaceIds = Array.from(leaderSpaceMap.values()).map((s) => s.spaceId);
    const uniqueSpaceIds = [...new Set(spaceIds)];

    // Batch fetch spaces (Firestore limits to 30 per in query)
    const spaceDataMap = new Map<string, {
      memberCount: number;
      hasWelcomeMessage: boolean;
      hasDeployedTool: boolean;
      lastActivity: Date | null;
    }>();

    const batchSize = 30;
    for (let i = 0; i < uniqueSpaceIds.length; i += batchSize) {
      const batch = uniqueSpaceIds.slice(i, i + batchSize);
      const spacesSnapshot = await dbAdmin
        .collection('spaces')
        .where('__name__', 'in', batch)
        .get();

      spacesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        spaceDataMap.set(doc.id, {
          memberCount: data.memberCount || 0,
          hasWelcomeMessage: !!data.welcomeMessage || !!data.setupProgress?.welcomeMessagePosted,
          hasDeployedTool: !!data.setupProgress?.firstToolDeployed || (data.placedTools?.length || 0) > 0,
          lastActivity: data.lastActivityAt?.toDate() || data.updatedAt?.toDate() || null,
        });
      });
    }

    // Calculate metrics
    let setupCompleteCount = 0;
    let postedWelcomeCount = 0;
    let deployedToolCount = 0;
    let fivePlusMembersCount = 0;
    let verifiedThisWeekCount = 0;
    let totalSetupTimeMs = 0;
    let setupTimeCount = 0;

    const atRiskLeaders: AtRiskLeader[] = [];

    // Fetch user data for names/emails
    const userIds = Array.from(verifiedLeaderIds);
    const userDataMap = new Map<string, { name: string; email: string }>();

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const usersSnapshot = await dbAdmin
        .collection('users')
        .where('__name__', 'in', batch)
        .get();

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        userDataMap.set(doc.id, {
          name: data.displayName || data.handle || 'Unknown',
          email: data.email || '',
        });
      });
    }

    // Process each leader
    for (const userId of verifiedLeaderIds) {
      const leaderInfo = leaderSpaceMap.get(userId);
      if (!leaderInfo) continue;

      const spaceData = spaceDataMap.get(leaderInfo.spaceId);
      const userData = userDataMap.get(userId);

      const hasWelcome = spaceData?.hasWelcomeMessage || false;
      const hasTool = spaceData?.hasDeployedTool || false;
      const memberCount = spaceData?.memberCount || 0;
      const hasFiveMembers = memberCount >= 5;

      // Setup complete = welcome + tool + 5 members
      const isSetupComplete = hasWelcome && hasTool && hasFiveMembers;

      if (isSetupComplete) setupCompleteCount++;
      if (hasWelcome) postedWelcomeCount++;
      if (hasTool) deployedToolCount++;
      if (hasFiveMembers) fivePlusMembersCount++;

      // Check if verified this week
      if (leaderInfo.verifiedAt >= oneWeekAgo) {
        verifiedThisWeekCount++;

        // Track setup time for avg calculation
        if (isSetupComplete && spaceData?.lastActivity) {
          const setupTime = spaceData.lastActivity.getTime() - leaderInfo.verifiedAt.getTime();
          if (setupTime > 0) {
            totalSetupTimeMs += setupTime;
            setupTimeCount++;
          }
        }
      }

      // Check for at-risk leaders (no activity in 7 days)
      const lastActive = spaceData?.lastActivity;
      const daysSinceActive = lastActive
        ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceActive >= 7) {
        atRiskLeaders.push({
          userId,
          userName: userData?.name || 'Unknown',
          userEmail: userData?.email || '',
          spaceName: leaderInfo.spaceName,
          spaceId: leaderInfo.spaceId,
          lastActiveAt: lastActive?.toISOString() || null,
          daysSinceActive,
          setupProgress: {
            welcomeMessage: hasWelcome,
            toolDeployed: hasTool,
            memberCount,
          },
        });
      }
    }

    // Sort at-risk leaders by days since active (most inactive first)
    atRiskLeaders.sort((a, b) => b.daysSinceActive - a.daysSinceActive);

    const calcPercentage = (count: number) =>
      totalVerified > 0 ? Math.round((count / totalVerified) * 100) : 0;

    const avgSetupTimeHours =
      setupTimeCount > 0
        ? Math.round(totalSetupTimeMs / setupTimeCount / (1000 * 60 * 60))
        : 0;

    const metrics: LeaderHealthMetrics = {
      totalVerified,
      setupComplete: { count: setupCompleteCount, percentage: calcPercentage(setupCompleteCount) },
      postedWelcome: { count: postedWelcomeCount, percentage: calcPercentage(postedWelcomeCount) },
      deployedTool: { count: deployedToolCount, percentage: calcPercentage(deployedToolCount) },
      fivePlusMembers: { count: fivePlusMembersCount, percentage: calcPercentage(fivePlusMembersCount) },
      atRiskLeaders: atRiskLeaders.slice(0, 20), // Limit to top 20
      verifiedThisWeek: verifiedThisWeekCount,
      avgSetupTimeHours,
    };

    logger.info('Leader health metrics fetched', {
      component: 'admin-leaders-health',
      totalVerified,
      atRiskCount: atRiskLeaders.length,
    });

    return respond.success(metrics);
  } catch (error) {
    logger.error('Failed to fetch leader health metrics', { component: 'admin-leaders-health' }, error instanceof Error ? error : undefined);
    return respond.error('Failed to fetch leader health metrics', 'INTERNAL_ERROR');
  }
});

export const GET = withCache(_GET, 'PRIVATE');
