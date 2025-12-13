import { type NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { checkSpacePermission } from '@/lib/space-permission-middleware';
import { logger } from '@/lib/structured-logger';
import { verifySession, type SessionData } from '@/lib/session';

/**
 * SSE endpoint for real-time chat message streaming
 *
 * GET /api/spaces/[spaceId]/chat/stream?boardId=xxx
 *
 * Replaces polling with Server-Sent Events for chat messages.
 * Uses Firestore onSnapshot internally and pushes to SSE stream.
 *
 * IMPORTANT: EventSource doesn't support custom headers, so we must use
 * cookie-based authentication here instead of Bearer tokens.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const url = new URL(request.url);
  const boardId = url.searchParams.get('boardId');

  if (!boardId) {
    return new Response('boardId is required', { status: 400 });
  }

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

  // Create user object compatible with existing code
  const user = {
    uid: session.userId,
    email: session.email,
    campusId: session.campusId,
  };

  // Verify space access
  const permCheck = await checkSpacePermission(spaceId, user.uid, 'guest');
  if (!permCheck.hasPermission) {
    return new Response('Forbidden', { status: 403 });
  }

  logger.info('Chat SSE stream requested', {
    userId: user.uid,
    spaceId,
    boardId,
  });

  // Track last seen timestamp to only send new messages
  let lastTimestamp = Date.now();
  let unsubscribe: (() => void) | null = null;
  let isStreamClosed = false;

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

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        if (isStreamClosed) {
          clearInterval(heartbeat);
          return;
        }
        try {
          const ping = `data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`;
          controller.enqueue(new TextEncoder().encode(ping));
        } catch {
          isStreamClosed = true;
          clearInterval(heartbeat);
          if (unsubscribe) unsubscribe();
        }
      }, 30000);
    },

    cancel() {
      isStreamClosed = true;
      if (unsubscribe) {
        unsubscribe();
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
