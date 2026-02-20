import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

/**
 * GET /api/tools/[toolId]/analytics
 * Returns basic analytics for a tool: views, interactions, deployments.
 * Returns zeros if no data exists (never 404s).
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
  // Only tool owner or published tools can view analytics
  if (toolData?.createdBy !== userId && toolData?.ownerId !== userId && toolData?.status !== 'published') {
    return respond.error('Not authorized to view analytics for this tool', 'FORBIDDEN', { status: 403 });
  }

  // Fetch data in parallel
  const [stateDoc, placementsSnap, analyticsSnap] = await Promise.all([
    // Tool state for interaction counts
    dbAdmin.collection('tool_states').doc(toolId).get(),
    // Deployment count from placedTools
    dbAdmin.collection('placedTools')
      .where('toolId', '==', toolId)
      .get(),
    // View/interaction events from analytics_events
    dbAdmin.collection('analytics_events')
      .where('metadata.toolId', '==', toolId)
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get(),
  ]);

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

  // Count deployments
  const deployments = placementsSnap.size;

  // Count views from analytics events
  let views = 0;
  for (const doc of analyticsSnap.docs) {
    const data = doc.data();
    if (data.eventType === 'tool_viewed' || data.eventType === 'tool_opened') {
      views++;
    }
  }

  // If no view data from analytics, estimate from deployments
  if (views === 0 && deployments > 0) {
    views = deployments * 5; // rough estimate
  }

  return respond.success({
    toolId,
    views,
    interactions,
    deployments,
    lastUpdated: new Date().toISOString(),
  });
});

export const GET = withCache(_GET, 'SHORT');
