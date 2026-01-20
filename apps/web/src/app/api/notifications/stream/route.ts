import { type NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger, logSecurityEvent } from '@/lib/structured-logger';
import { verifySession, type SessionData } from '@/lib/session';
import { sseConnectionRateLimit } from '@/lib/rate-limit-simple';

/**
 * SSE endpoint for real-time notification streaming
 *
 * GET /api/notifications/stream
 *
 * Replaces 30-second polling with Server-Sent Events for notifications.
 * Uses Firestore onSnapshot to push new notifications instantly.
 *
 * IMPORTANT: EventSource doesn't support custom headers, so we must use
 * cookie-based authentication here instead of Bearer tokens.
 *
 * @version 1.0.0 - Spaces Perfection Plan Phase 1 (Jan 2026)
 */
export async function GET(request: NextRequest) {
  // Verify authentication via session cookie
  // NOTE: EventSource doesn't support custom headers, so we MUST use cookies
  const sessionCookie = request.cookies.get('hive_session');
  if (!sessionCookie?.value) {
    return new Response('Unauthorized - no session cookie', { status: 401 });
  }

  let session: SessionData | null;
  try {
    session = await verifySession(sessionCookie.value);
  } catch {
    return new Response('Unauthorized - invalid session', { status: 401 });
  }

  if (!session?.userId) {
    return new Response('Unauthorized - session expired', { status: 401 });
  }

  const userId = session.userId;

  // Rate limit SSE connections to prevent DoS
  const rateLimitResult = sseConnectionRateLimit.check(userId);
  if (!rateLimitResult.success) {
    logSecurityEvent('rate_limit', {
      operation: 'sse_notification_connection_blocked',
      tags: {
        userId,
        retryAfter: rateLimitResult.retryAfter?.toString() || '60',
      },
    });
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      },
    });
  }

  logger.info('Notification SSE stream requested', { userId });

  // Track state for the stream
  let unsubscribe: (() => void) | null = null;
  let isStreamClosed = false;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message with current unread count
      const sendMessage = (data: Record<string, unknown>) => {
        if (isStreamClosed) return false;
        try {
          const sseData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(sseData));
          return true;
        } catch {
          isStreamClosed = true;
          return false;
        }
      };

      // Send connected message
      sendMessage({ type: 'connected', timestamp: Date.now() });

      // Fetch initial unread count
      dbAdmin
        .collection('notifications')
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .count()
        .get()
        .then((snapshot) => {
          if (!isStreamClosed) {
            sendMessage({
              type: 'unread_count',
              count: snapshot.data().count,
              timestamp: Date.now(),
            });
          }
        })
        .catch((error) => {
          logger.warn('Failed to fetch initial unread count', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        });

      // Set up Firestore listener for new notifications
      // Listen for notifications created after connection time
      const connectionTime = new Date();

      unsubscribe = dbAdmin
        .collection('notifications')
        .where('userId', '==', userId)
        .where('timestamp', '>=', connectionTime.toISOString())
        .orderBy('timestamp', 'desc')
        .onSnapshot(
          (snapshot) => {
            if (isStreamClosed) return;

            for (const change of snapshot.docChanges()) {
              // New notification received
              if (change.type === 'added') {
                const data = change.doc.data();
                const notification = {
                  type: 'notification',
                  data: {
                    id: change.doc.id,
                    title: data.title,
                    body: data.body,
                    notificationType: data.type,
                    category: data.category,
                    isRead: data.isRead || false,
                    timestamp: data.timestamp,
                    actionUrl: data.actionUrl,
                    metadata: data.metadata,
                  },
                };

                if (!sendMessage(notification)) {
                  if (unsubscribe) unsubscribe();
                }
              }

              // Notification updated (e.g., marked as read)
              if (change.type === 'modified') {
                const data = change.doc.data();
                const update = {
                  type: 'notification_update',
                  data: {
                    id: change.doc.id,
                    isRead: data.isRead,
                    readAt: data.readAt,
                  },
                };

                if (!sendMessage(update)) {
                  if (unsubscribe) unsubscribe();
                }
              }

              // Notification deleted
              if (change.type === 'removed') {
                const deleteMsg = {
                  type: 'notification_delete',
                  data: { id: change.doc.id },
                };

                if (!sendMessage(deleteMsg)) {
                  if (unsubscribe) unsubscribe();
                }
              }
            }
          },
          (error) => {
            logger.error('Firestore notification snapshot error', {
              error: error instanceof Error ? error.message : String(error),
              userId,
            });
            isStreamClosed = true;
          }
        );

      // Also listen for read status changes on existing notifications
      // This helps sync unread count when user marks notifications as read elsewhere
      const existingNotificationsUnsubscribe = dbAdmin
        .collection('notifications')
        .where('userId', '==', userId)
        .where('isRead', '==', false)
        .onSnapshot(
          (snapshot) => {
            if (isStreamClosed) return;

            // Send updated unread count whenever it changes
            sendMessage({
              type: 'unread_count',
              count: snapshot.size,
              timestamp: Date.now(),
            });
          },
          (error) => {
            logger.warn('Firestore unread count listener error', {
              error: error instanceof Error ? error.message : String(error),
              userId,
            });
          }
        );

      // Store the original unsubscribe and add the new one
      const originalUnsubscribe = unsubscribe;
      unsubscribe = () => {
        originalUnsubscribe?.();
        existingNotificationsUnsubscribe?.();
      };

      // Send heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (isStreamClosed) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          return;
        }
        if (!sendMessage({ type: 'ping', timestamp: Date.now() })) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          if (unsubscribe) unsubscribe();
        }
      }, 30000);
    },

    cancel() {
      isStreamClosed = true;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
      logger.info('Notification SSE stream closed', { userId });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
