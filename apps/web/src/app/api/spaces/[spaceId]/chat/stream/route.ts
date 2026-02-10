/**
 * SSE endpoint for real-time chat message streaming
 *
 * GET /api/spaces/[spaceId]/chat/stream?boardId=xxx
 *
 * Replaces polling with Server-Sent Events for chat messages.
 * Uses Firestore onSnapshot internally and pushes to SSE stream.
 *
 * IMPORTANT: This route CANNOT use withAuthAndErrors middleware because:
 * 1. SSE requires text/event-stream content type, not JSON
 * 2. EventSource API doesn't support custom headers (Bearer tokens)
 * 3. Must use cookie-based authentication
 * 4. Returns a ReadableStream, not a standard Response
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventSource
 */

import { type NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { checkSpacePermission } from '@/lib/space-permission-middleware';
import { logger, logSecurityEvent } from '@/lib/structured-logger';
import { verifySession, type SessionData } from '@/lib/session';
import { sseConnectionRateLimit } from '@/lib/rate-limit-simple';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const url = new URL(request.url);
  const boardId = url.searchParams.get('boardId') || 'main';

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

  // Create user object for permission checks and logging
  const user = {
    uid: session.userId,
    email: session.email,
    campusId: session.campusId,
  };

  // Rate limit SSE connections to prevent DoS
  const rateLimitResult = sseConnectionRateLimit.check(user.uid);
  if (!rateLimitResult.success) {
    logSecurityEvent('rate_limit', {
      operation: 'sse_connection_blocked',
      tags: {
        userId: user.uid,
        spaceId,
        boardId: boardId || 'unknown',
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

  // Verify space access
  const permCheck = await checkSpacePermission(spaceId, user.uid, 'guest');
  if (!permCheck.hasPermission) {
    return new Response('Forbidden', { status: 403 });
  }

  // SECURITY: Enforce campus isolation - user can only access spaces in their campus
  if (permCheck.space?.campusId && user.campusId && permCheck.space.campusId !== user.campusId) {
    logSecurityEvent('auth', {
      operation: 'cross_campus_access_blocked',
      tags: {
        userId: user.uid,
        userCampusId: user.campusId,
        spaceCampusId: permCheck.space.campusId,
        spaceId,
      },
    });
    return new Response('Forbidden - campus mismatch', { status: 403 });
  }

  logger.info('Chat SSE stream requested', {
    userId: user.uid,
    spaceId,
    boardId,
  });

  // Track last seen timestamp to only send new messages
  let lastTimestamp = Date.now();
  let unsubscribe: (() => void) | null = null;
  let unsubscribeComponents: (() => void) | null = null;
  let isStreamClosed = false;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMsg = `data: ${JSON.stringify({ type: 'connected', boardId, timestamp: Date.now() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectMsg));

      // Set up Firestore listener for new messages
      const messagesRef = dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .doc(boardId)
        .collection('messages');

      // Listen for messages newer than connection time
      unsubscribe = messagesRef
        .where('timestamp', '>', lastTimestamp)
        .orderBy('timestamp', 'asc')
        .onSnapshot(
          (snapshot) => {
            if (isStreamClosed) return;

            for (const change of snapshot.docChanges()) {
              if (change.type === 'added') {
                const data = change.doc.data();
                // Update last timestamp
                if (data.timestamp > lastTimestamp) {
                  lastTimestamp = data.timestamp;
                }

                const message = {
                  type: 'message',
                  data: {
                    id: change.doc.id,
                    boardId: data.boardId,
                    type: data.type || 'text',
                    authorId: data.authorId,
                    authorName: data.authorName,
                    authorAvatarUrl: data.authorAvatarUrl,
                    authorRole: data.authorRole,
                    content: data.content,
                    componentData: data.componentData,
                    timestamp: data.timestamp,
                    editedAt: data.editedAt,
                    isDeleted: data.isDeleted || false,
                    isPinned: data.isPinned || false,
                    reactions: (data.reactions || []).map((r: { emoji: string; count: number; userIds: string[] }) => ({
                      emoji: r.emoji,
                      count: r.count,
                      hasReacted: r.userIds?.includes(user.uid) || false,
                    })),
                    replyToId: data.replyToId,
                    replyToPreview: data.replyToPreview,
                    threadCount: data.threadCount || 0,
                  },
                };

                try {
                  const sseData = `data: ${JSON.stringify(message)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(sseData));
                } catch {
                  // Stream closed
                  isStreamClosed = true;
                  if (unsubscribe) unsubscribe();
                }
              }

              // Handle message updates (edits, reactions, pins)
              if (change.type === 'modified') {
                const data = change.doc.data();
                const update = {
                  type: 'update',
                  data: {
                    id: change.doc.id,
                    content: data.content,
                    editedAt: data.editedAt,
                    isDeleted: data.isDeleted,
                    isPinned: data.isPinned,
                    reactions: (data.reactions || []).map((r: { emoji: string; count: number; userIds: string[] }) => ({
                      emoji: r.emoji,
                      count: r.count,
                      hasReacted: r.userIds?.includes(user.uid) || false,
                    })),
                  },
                };

                try {
                  const sseData = `data: ${JSON.stringify(update)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(sseData));
                } catch {
                  isStreamClosed = true;
                  if (unsubscribe) unsubscribe();
                }
              }

              // Handle message deletes
              if (change.type === 'removed') {
                const deleteMsg = {
                  type: 'delete',
                  data: { id: change.doc.id },
                };

                try {
                  const sseData = `data: ${JSON.stringify(deleteMsg)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(sseData));
                } catch {
                  isStreamClosed = true;
                  if (unsubscribe) unsubscribe();
                }
              }
            }
          },
          (error) => {
            logger.error('Firestore snapshot error', {
              error: error instanceof Error ? error.message : String(error),
              spaceId,
              boardId,
            });
            isStreamClosed = true;
          }
        );

      // Also listen for inline component state updates (poll votes, RSVP changes)
      const componentsRef = dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .doc(boardId)
        .collection('inline_components');

      unsubscribeComponents = componentsRef.onSnapshot(
        (snapshot) => {
          if (isStreamClosed) return;

          for (const change of snapshot.docChanges()) {
            // Only send modified components (state updates from participation)
            if (change.type === 'modified') {
              const data = change.doc.data();
              const componentUpdate = {
                type: 'component_update',
                data: {
                  componentId: change.doc.id,
                  elementType: data.elementType,
                  sharedState: data.sharedState,
                  isActive: data.isActive,
                  version: data.version,
                  updatedAt: data.updatedAt,
                },
              };

              try {
                const sseData = `data: ${JSON.stringify(componentUpdate)}\n\n`;
                controller.enqueue(new TextEncoder().encode(sseData));
              } catch {
                isStreamClosed = true;
                if (unsubscribe) unsubscribe();
                if (unsubscribeComponents) unsubscribeComponents();
              }
            }
          }
        },
        (error) => {
          logger.error('Firestore inline_components snapshot error', {
            error: error instanceof Error ? error.message : String(error),
            spaceId,
            boardId,
          });
        }
      );

      // Send heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (isStreamClosed) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          return;
        }
        try {
          const ping = `data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`;
          controller.enqueue(new TextEncoder().encode(ping));
        } catch {
          isStreamClosed = true;
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          if (unsubscribe) unsubscribe();
          if (unsubscribeComponents) unsubscribeComponents();
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
      if (unsubscribeComponents) {
        unsubscribeComponents();
      }
      logger.info('Chat SSE stream closed', { userId: user.uid, spaceId, boardId });
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
