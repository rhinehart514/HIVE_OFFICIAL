/**
 * Admin Space Activity API
 *
 * GET: Fetch recent activity for a space
 *
 * Returns:
 * - recentMessages: last 50 messages
 * - recentEvents: upcoming and recent events
 * - recentTools: recently deployed tools
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';

type RouteContext = { params: Promise<{ spaceId: string }> };

const ActivityQuerySchema = z.object({
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
});

interface ActivityMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  createdAt: string;
  type: 'text' | 'image' | 'file' | 'system';
}

interface ActivityEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  creatorId: string;
  creatorName: string;
  attendeeCount: number;
}

interface ActivityTool {
  id: string;
  name: string;
  type: string;
  deployedAt: string;
  deployedBy: string;
  deployedByName: string;
}

interface SpaceActivity {
  space: {
    id: string;
    name: string;
  };
  recentMessages: ActivityMessage[];
  recentEvents: ActivityEvent[];
  recentTools: ActivityTool[];
  stats: {
    totalMessages: number;
    totalEvents: number;
    totalTools: number;
  };
}

/**
 * GET /api/admin/spaces/[spaceId]/activity
 * Fetch recent activity for a space
 */
export const GET = withAdminAuthAndErrors(async (request, context: RouteContext, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await context.params;
  const { searchParams } = new URL(request.url);
  const queryResult = ActivityQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const { limit } = queryResult.data;

  try {
    // Verify space exists and belongs to campus
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return respond.error('Space not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const spaceData = spaceDoc.data();
    if (spaceData?.campusId !== campusId) {
      return respond.error('Access denied', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    // 1. Fetch recent messages
    const messagesSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const recentMessages: ActivityMessage[] = [];
    const authorIds = new Set<string>();

    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.authorId) authorIds.add(data.authorId);
      recentMessages.push({
        id: doc.id,
        content: data.content || '',
        authorId: data.authorId || '',
        authorName: '', // Will be filled in
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        type: data.type || 'text',
      });
    });

    // Fetch author profiles
    const authorProfiles = new Map<string, { displayName: string; handle?: string }>();
    for (const authorId of authorIds) {
      const profileDoc = await dbAdmin.collection('profiles').doc(authorId).get();
      if (profileDoc.exists) {
        const data = profileDoc.data();
        authorProfiles.set(authorId, {
          displayName: data?.displayName || 'Unknown',
          handle: data?.handle,
        });
      }
    }

    // Fill in author names
    recentMessages.forEach(msg => {
      const profile = authorProfiles.get(msg.authorId);
      msg.authorName = profile?.displayName || 'Unknown';
      msg.authorHandle = profile?.handle;
    });

    // 2. Fetch events (from events subcollection or placedTools)
    const recentEvents: ActivityEvent[] = [];
    const eventsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('events')
      .orderBy('startAt', 'desc')
      .limit(20)
      .get();

    const eventCreatorIds = new Set<string>();
    eventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.creatorId) eventCreatorIds.add(data.creatorId);
    });

    // Fetch event creator profiles
    const eventCreatorProfiles = new Map<string, string>();
    for (const creatorId of eventCreatorIds) {
      const profileDoc = await dbAdmin.collection('profiles').doc(creatorId).get();
      if (profileDoc.exists) {
        const data = profileDoc.data();
        eventCreatorProfiles.set(creatorId, data?.displayName || 'Unknown');
      }
    }

    eventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      recentEvents.push({
        id: doc.id,
        title: data.title || 'Untitled Event',
        description: data.description,
        startAt: data.startAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        endAt: data.endAt?.toDate?.()?.toISOString(),
        creatorId: data.creatorId || '',
        creatorName: eventCreatorProfiles.get(data.creatorId) || 'Unknown',
        attendeeCount: data.attendeeCount || 0,
      });
    });

    // 3. Fetch placed tools
    const recentTools: ActivityTool[] = [];
    const toolsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('placedTools')
      .orderBy('deployedAt', 'desc')
      .limit(20)
      .get();

    const toolDeployerIds = new Set<string>();
    toolsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.deployedBy) toolDeployerIds.add(data.deployedBy);
    });

    // Fetch tool deployer profiles
    const toolDeployerProfiles = new Map<string, string>();
    for (const deployerId of toolDeployerIds) {
      const profileDoc = await dbAdmin.collection('profiles').doc(deployerId).get();
      if (profileDoc.exists) {
        const data = profileDoc.data();
        toolDeployerProfiles.set(deployerId, data?.displayName || 'Unknown');
      }
    }

    toolsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      recentTools.push({
        id: doc.id,
        name: data.name || 'Unknown Tool',
        type: data.type || 'tool',
        deployedAt: data.deployedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        deployedBy: data.deployedBy || '',
        deployedByName: toolDeployerProfiles.get(data.deployedBy) || 'Unknown',
      });
    });

    // 4. Get total counts
    const [totalMsgCount, totalEventCount, totalToolCount] = await Promise.all([
      dbAdmin.collection('spaces').doc(spaceId).collection('messages').count().get(),
      dbAdmin.collection('spaces').doc(spaceId).collection('events').count().get(),
      dbAdmin.collection('spaces').doc(spaceId).collection('placedTools').count().get(),
    ]);

    const activity: SpaceActivity = {
      space: {
        id: spaceId,
        name: spaceData?.name || 'Unknown Space',
      },
      recentMessages,
      recentEvents,
      recentTools,
      stats: {
        totalMessages: totalMsgCount.data().count,
        totalEvents: totalEventCount.data().count,
        totalTools: totalToolCount.data().count,
      },
    };

    logger.info('Space activity fetched', {
      spaceId,
      messageCount: recentMessages.length,
      eventCount: recentEvents.length,
      toolCount: recentTools.length,
    });

    return respond.success(activity);
  } catch (error) {
    logger.error('Failed to fetch space activity', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
    });
    return respond.error('Failed to fetch space activity', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
