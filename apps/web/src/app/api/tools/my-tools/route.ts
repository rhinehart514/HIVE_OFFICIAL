import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';

// GET /api/tools/my-tools — Creator dashboard: user's tools with aggregated stats
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);

  // Fetch user's tools
  const toolsSnapshot = await dbAdmin
    .collection('tools')
    .where('campusId', '==', campusId)
    .where('ownerId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .get();

  if (toolsSnapshot.empty) {
    return respond.success({
      tools: [],
      stats: { totalTools: 0, totalUsers: 0, weeklyInteractions: 0 },
    });
  }

  const toolIds = toolsSnapshot.docs.map((doc) => doc.id);

  // Batch fetch deployments for all tools
  const deploymentsMap = new Map<string, number>();
  const chunks: string[][] = [];
  for (let i = 0; i < toolIds.length; i += 30) {
    chunks.push(toolIds.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const depSnap = await dbAdmin
      .collection('deployedTools')
      .where('toolId', 'in', chunk)
      .where('status', '==', 'active')
      .get();

    for (const doc of depSnap.docs) {
      const data = doc.data();
      const toolId = data.toolId as string;
      deploymentsMap.set(toolId, (deploymentsMap.get(toolId) || 0) + 1);
    }
  }

  // Fetch analytics events from the last 7 days for weekly stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyEventsMap = new Map<string, { interactions: number; users: Set<string> }>();
  const allTimeUsersMap = new Map<string, Set<string>>();

  for (const chunk of chunks) {
    try {
      const eventsSnap = await dbAdmin
        .collection('analytics_events')
        .where('toolId', 'in', chunk)
        .where('timestamp', '>=', weekAgo)
        .get();

      for (const doc of eventsSnap.docs) {
        const ev = doc.data();
        const toolId = ev.toolId as string;
        if (!weeklyEventsMap.has(toolId)) {
          weeklyEventsMap.set(toolId, { interactions: 0, users: new Set() });
        }
        const bucket = weeklyEventsMap.get(toolId)!;
        bucket.interactions += 1;
        if (ev.userId && typeof ev.userId === 'string') {
          bucket.users.add(ev.userId);
        }
      }
    } catch {
      // Analytics events collection may not exist yet - graceful degradation
    }
  }

  // Aggregate per-tool users from sharedState counters
  for (const chunk of chunks) {
    try {
      const stateSnap = await dbAdmin
        .collection('toolSharedState')
        .where('toolId', 'in', chunk)
        .get();

      for (const doc of stateSnap.docs) {
        const data = doc.data();
        const toolId = data.toolId as string;
        if (!allTimeUsersMap.has(toolId)) {
          allTimeUsersMap.set(toolId, new Set());
        }
        // Count unique participants from state
        const participants = data.participants as Record<string, unknown> | undefined;
        if (participants) {
          for (const uid of Object.keys(participants)) {
            allTimeUsersMap.get(toolId)!.add(uid);
          }
        }
      }
    } catch {
      // Shared state may not exist - graceful degradation
    }
  }

  // Build tool list with stats
  let totalUsers = 0;
  let weeklyInteractions = 0;

  const tools = toolsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const toolId = doc.id;

    const deployments = deploymentsMap.get(toolId) || 0;
    const weeklyStats = weeklyEventsMap.get(toolId);
    const wau = weeklyStats?.users.size || 0;
    const weeklyCount = weeklyStats?.interactions || 0;
    const allTimeUsers = allTimeUsersMap.get(toolId)?.size || 0;
    const userCount = Math.max(wau, allTimeUsers, data.useCount || 0);

    totalUsers += userCount;
    weeklyInteractions += weeklyCount;

    // Determine effective status
    let status: 'draft' | 'published' | 'pending_review' | 'deployed' = data.status || 'draft';
    if (deployments > 0 && status !== 'draft') {
      status = 'deployed';
    }

    return {
      id: toolId,
      name: data.name || 'Untitled Tool',
      description: data.description || '',
      status,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || new Date().toISOString(),
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
      useCount: data.useCount || 0,
      deployments,
      wau,
      weeklyInteractions: weeklyCount,
      templateId: data.metadata?.templateId || data.templateId || null,
    };
  });

  return respond.success({
    tools,
    stats: {
      totalTools: tools.length,
      totalUsers,
      weeklyInteractions,
    },
  });
});
