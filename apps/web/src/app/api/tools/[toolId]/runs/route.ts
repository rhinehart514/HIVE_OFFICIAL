/**
 * Tool Run History API
 *
 * GET /api/tools/[toolId]/runs - Get execution history for a tool
 */

import { withAuthAndErrors, type AuthenticatedRequest, getUserId, getCampusId } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';

interface RunEntry {
  id: string;
  status: 'success' | 'failed' | 'pending';
  startedAt: string;
  completedAt?: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  action?: string;
  elementType?: string;
  inputSummary?: string;
  outputSummary?: string;
  duration?: number;
}

// GET /api/tools/[toolId]/runs
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;

  // Ensure tool exists and campus matches
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }
  const tool = toolDoc.data();
  if (tool?.campusId && tool.campusId !== campusId) {
    return respond.error('Access denied for this campus', 'FORBIDDEN', { status: 403 });
  }

  // Permission check: only tool owner or admins can view runs
  const isOwner = tool?.ownerId === userId || tool?.createdBy === userId;
  if (!isOwner) {
    const userDoc = await dbAdmin.collection('profiles').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isAdmin = userData?.isAdmin === true || userData?.role === 'admin';

    if (!isAdmin) {
      return respond.error('You do not have permission to view runs for this tool', 'FORBIDDEN', { status: 403 });
    }
  }

  // Parse query params
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);
  const status = url.searchParams.get('status'); // 'completed', 'failed', 'all'

  // Fetch analytics events for this tool (these represent "runs")
  const query = dbAdmin
    .collection('analytics_events')
    .where('toolId', '==', toolId)
    .orderBy('timestamp', 'desc')
    .limit(limit);

  const eventsSnapshot = await query.get();
  const events = eventsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    timestamp?: string | Date | { toDate?: () => Date };
    userId?: string;
    action?: string;
    feature?: string;
    elementType?: string;
    metadata?: Record<string, unknown>;
    status?: string;
    duration?: number;
  }>;

  // Get unique user IDs to fetch names
  const userIds = [...new Set(events.map(e => e.userId).filter(Boolean))] as string[];
  const userMap = new Map<string, { displayName?: string; avatarUrl?: string }>();

  if (userIds.length > 0) {
    // Batch fetch user profiles (max 30 at a time due to Firestore limits)
    for (let i = 0; i < userIds.length; i += 30) {
      const batch = userIds.slice(i, i + 30);
      const profilesSnapshot = await dbAdmin
        .collection('profiles')
        .where('__name__', 'in', batch)
        .get();

      for (const doc of profilesSnapshot.docs) {
        const data = doc.data();
        userMap.set(doc.id, {
          displayName: data.displayName || data.name,
          avatarUrl: data.avatarUrl || data.photoURL,
        });
      }
    }
  }

  // Transform events to run format
  const runs: RunEntry[] = events.map(event => {
    // Handle Firestore Timestamp
    let startedAt: string;
    if (event.timestamp) {
      if (typeof event.timestamp === 'string') {
        startedAt = event.timestamp;
      } else if (event.timestamp instanceof Date) {
        startedAt = event.timestamp.toISOString();
      } else if (typeof event.timestamp === 'object' && 'toDate' in event.timestamp && typeof event.timestamp.toDate === 'function') {
        startedAt = event.timestamp.toDate().toISOString();
      } else {
        startedAt = new Date().toISOString();
      }
    } else {
      startedAt = new Date().toISOString();
    }

    const user = event.userId ? userMap.get(event.userId) : undefined;
    const metadata = event.metadata || {};

    // Determine status from event data
    // Use 'success' to match the client-side ToolRun interface
    let runStatus: 'success' | 'failed' | 'pending' = 'success';
    if (event.status === 'failed' || metadata.error) {
      runStatus = 'failed';
    } else if (event.status === 'pending') {
      runStatus = 'pending';
    }

    // Build input summary from available data
    const inputParts: string[] = [];
    if (event.action || event.feature) {
      inputParts.push(event.action || event.feature || '');
    }
    if (event.elementType) {
      inputParts.push(`(${event.elementType})`);
    }
    if (metadata.inputSummary && typeof metadata.inputSummary === 'string') {
      inputParts.push(metadata.inputSummary);
    }

    return {
      id: event.id,
      status: runStatus,
      startedAt,
      completedAt: startedAt, // Analytics events are logged after completion
      userId: event.userId || 'unknown',
      userName: user?.displayName || 'Unknown User',
      userAvatar: user?.avatarUrl,
      action: event.action || event.feature,
      elementType: event.elementType || (metadata.elementType as string),
      inputSummary: inputParts.join(' ') || undefined,
      outputSummary: (metadata.outputSummary as string) || undefined,
      duration: event.duration || (metadata.duration as number),
    };
  });

  // Filter by status if requested (accept 'completed' as alias for 'success')
  const normalizedStatus = status === 'completed' ? 'success' : status;
  const filteredRuns = normalizedStatus && normalizedStatus !== 'all'
    ? runs.filter(r => r.status === normalizedStatus)
    : runs;

  // Calculate summary stats
  const completed = runs.filter(r => r.status === 'success').length;
  const failed = runs.filter(r => r.status === 'failed').length;
  const avgDuration = runs.length > 0
    ? Math.round(runs.reduce((sum, r) => sum + (r.duration || 0), 0) / runs.length)
    : 0;

  return respond.success({
    runs: filteredRuns,
    summary: {
      total: runs.length,
      completed,
      failed,
      successRate: runs.length > 0 ? Math.round((completed / runs.length) * 100) : 0,
      avgDuration,
    },
  });
});
