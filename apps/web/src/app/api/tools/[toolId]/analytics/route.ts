import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';
import admin from 'firebase-admin';

/**
 * GET /api/tools/[toolId]/analytics?range=7d|30d|90d
 * Returns analytics shaped for the analytics page:
 * { totalUsage, activeUsers, avgRating, thisWeek, dailyUsage[], feedback[] }
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { toolId } = await params;

  if (!toolId) {
    return respond.error('Tool ID is required', 'INVALID_INPUT', { status: 400 });
  }

  // Verify the tool exists and user has access
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  const toolData = toolDoc.data();
  if (toolData?.createdBy !== userId && toolData?.ownerId !== userId && toolData?.status !== 'published') {
    return respond.error('Not authorized to view analytics for this tool', 'FORBIDDEN', { status: 403 });
  }

  // Parse time range
  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '7d';
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[range] || 7;
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - days);

  // 7 days ago for "this week" stat
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Fetch data in parallel
  const [stateDoc, analyticsSnap, feedbackSnap] = await Promise.all([
    dbAdmin.collection('tool_states').doc(toolId).get(),
    dbAdmin.collection('analytics_events')
      .where('metadata.toolId', '==', toolId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(rangeStart))
      .orderBy('timestamp', 'desc')
      .limit(2000)
      .get(),
    dbAdmin.collection('tool_feedback')
      .where('toolId', '==', toolId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get(),
  ]);

  // Build daily usage from analytics events
  const dailyMap = new Map<string, number>();
  // Pre-fill all days in range with 0
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split('T')[0], 0);
  }

  let totalUsage = 0;
  let thisWeek = 0;
  const uniqueUsers = new Set<string>();

  for (const doc of analyticsSnap.docs) {
    const data = doc.data();
    const ts = data.timestamp?.toDate?.() ?? new Date(data.timestamp);
    const dateKey = ts.toISOString().split('T')[0];

    if (data.eventType === 'tool_viewed' || data.eventType === 'tool_opened' || data.eventType === 'tool_interacted') {
      totalUsage++;
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);

      if (ts >= weekAgo) {
        thisWeek++;
      }

      if (data.userId || data.metadata?.userId) {
        uniqueUsers.add(data.userId || data.metadata?.userId);
      }
    }
  }

  // Fall back to tool doc counts if analytics_events is empty
  if (totalUsage === 0) {
    totalUsage = (toolData?.useCount || 0) + (toolData?.viewCount || 0);
  }

  // Count interactions from tool_state
  let interactions = 0;
  if (stateDoc.exists) {
    const state = stateDoc.data();
    const sharedState = state?.sharedState;
    if (sharedState?.counters) {
      interactions = Object.values(sharedState.counters as Record<string, number>)
        .reduce((sum: number, val: number) => sum + (typeof val === 'number' ? val : 0), 0);
    }
    if (sharedState?.collections) {
      for (const key of Object.keys(sharedState.collections as Record<string, unknown[]>)) {
        const collection = (sharedState.collections as Record<string, unknown[]>)[key];
        if (Array.isArray(collection)) {
          interactions += collection.length;
        }
      }
    }
    if (sharedState?.timeline && Array.isArray(sharedState.timeline)) {
      interactions += sharedState.timeline.length;
    }
  }

  // Build dailyUsage array sorted by date
  const dailyUsage = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build feedback array
  const feedback = feedbackSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      rating: data.rating || 0,
      comment: data.comment || '',
      author: data.authorName || 'Anonymous',
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  });

  // Average rating
  const avgRating = feedback.length > 0
    ? Math.round((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length) * 10) / 10
    : 0;

  return respond.success({
    toolId,
    totalUsage: totalUsage + interactions,
    activeUsers: uniqueUsers.size || (totalUsage > 0 ? 1 : 0),
    avgRating,
    thisWeek,
    dailyUsage,
    feedback,
    lastUpdated: new Date().toISOString(),
  });
});

export const GET = withCache(_GET, 'SHORT');
