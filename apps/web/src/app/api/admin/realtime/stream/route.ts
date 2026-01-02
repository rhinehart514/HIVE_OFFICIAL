/**
 * Admin Real-Time SSE Stream
 *
 * GET: Server-Sent Events stream for live admin updates
 *
 * Events:
 * - user_signup: New user registered
 * - space_created: New space created
 * - report_filed: Content report submitted
 * - tool_deployed: Tool deployed to space
 * - error_spike: Error rate increased
 * - metric_update: Periodic metric refresh
 */

import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { dbAdmin } from '@/lib/firebase-admin';

interface AdminEvent {
  type: 'user_signup' | 'space_created' | 'report_filed' | 'tool_deployed' | 'error_spike' | 'metric_update';
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * GET /api/admin/realtime/stream
 * SSE endpoint for real-time admin updates
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);

  // Set up SSE headers
  const encoder = new TextEncoder();
  let isConnected = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      const connectEvent: AdminEvent = {
        type: 'metric_update',
        data: { connected: true, adminId },
        timestamp: new Date().toISOString(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectEvent)}\n\n`));

      // Fetch initial metrics
      const sendMetrics = async () => {
        if (!isConnected) return;

        try {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          // Parallel fetch of key metrics
          const [
            usersToday,
            spacesToday,
            pendingReports,
            pendingTools,
          ] = await Promise.all([
            dbAdmin
              .collection('profiles')
              .where('campusId', '==', CURRENT_CAMPUS_ID)
              .where('createdAt', '>=', today)
              .count()
              .get(),
            dbAdmin
              .collection('spaces')
              .where('campusId', '==', CURRENT_CAMPUS_ID)
              .where('createdAt', '>=', today)
              .count()
              .get(),
            dbAdmin
              .collection('contentReports')
              .where('campusId', '==', CURRENT_CAMPUS_ID)
              .where('status', '==', 'pending')
              .count()
              .get(),
            dbAdmin
              .collection('toolPublishRequests')
              .where('campusId', '==', CURRENT_CAMPUS_ID)
              .where('status', '==', 'pending')
              .count()
              .get(),
          ]);

          const metricsEvent: AdminEvent = {
            type: 'metric_update',
            data: {
              usersToday: usersToday.data().count,
              spacesToday: spacesToday.data().count,
              pendingReports: pendingReports.data().count,
              pendingTools: pendingTools.data().count,
              timestamp: now.toISOString(),
            },
            timestamp: now.toISOString(),
          };

          if (isConnected) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(metricsEvent)}\n\n`));
          }
        } catch (error) {
          logger.error('SSE metrics fetch failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      };

      // Send initial metrics
      await sendMetrics();

      // Set up Firestore listeners for real-time events
      const unsubscribers: (() => void)[] = [];

      // Listen for new users
      const usersUnsubscribe = dbAdmin
        .collection('profiles')
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && isConnected) {
              const data = change.doc.data();
              const event: AdminEvent = {
                type: 'user_signup',
                data: {
                  userId: change.doc.id,
                  displayName: data.displayName,
                  handle: data.handle,
                  userType: data.userType,
                },
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
          });
        });
      unsubscribers.push(usersUnsubscribe);

      // Listen for new spaces
      const spacesUnsubscribe = dbAdmin
        .collection('spaces')
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && isConnected) {
              const data = change.doc.data();
              const event: AdminEvent = {
                type: 'space_created',
                data: {
                  spaceId: change.doc.id,
                  name: data.name,
                  handle: data.handle,
                  category: data.category,
                },
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
          });
        });
      unsubscribers.push(spacesUnsubscribe);

      // Listen for new reports
      const reportsUnsubscribe = dbAdmin
        .collection('contentReports')
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && isConnected) {
              const data = change.doc.data();
              const event: AdminEvent = {
                type: 'report_filed',
                data: {
                  reportId: change.doc.id,
                  contentType: data.contentType,
                  reportType: data.reportType,
                  priority: data.priority,
                },
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
          });
        });
      unsubscribers.push(reportsUnsubscribe);

      // Periodic metric updates (every 30 seconds)
      const metricsInterval = setInterval(() => {
        if (isConnected) {
          sendMetrics();
        }
      }, 30000);

      // Heartbeat to keep connection alive (every 15 seconds)
      const heartbeatInterval = setInterval(() => {
        if (isConnected) {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        }
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        isConnected = false;
        clearInterval(metricsInterval);
        clearInterval(heartbeatInterval);
        unsubscribers.forEach(unsub => unsub());
        controller.close();
        logger.info('SSE connection closed', { adminId });
      });

      logger.info('SSE connection established', { adminId });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});
