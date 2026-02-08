import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { dbAdmin as db } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

/**
 * DM Stream API - Server-Sent Events for real-time messages
 *
 * Follows the same pattern as space chat stream.
 */

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// ============================================================================
// GET /api/dm/conversations/[conversationId]/stream
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSession(request);
  if (!session?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { conversationId } = await params;
  const userId = session.userId;

  // Verify user is a participant
  const conversationDoc = await db
    .collection('dm_conversations')
    .doc(conversationId)
    .get();

  if (!conversationDoc.exists) {
    return new Response('Conversation not found', { status: 404 });
  }

  const conversationData = conversationDoc.data()!;
  if (!conversationData.participantIds?.includes(userId)) {
    return new Response('Not a participant', { status: 403 });
  }

  // Set up SSE
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send connected event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Set up Firestore listener for new messages
      const messagesRef = db
        .collection('dm_conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(1);

      unsubscribe = messagesRef.onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();

              // Only send if it's a new message (not from initial load)
              // Check if message was created in the last 5 seconds
              const timestamp = data.timestamp?.toDate?.();
              if (timestamp) {
                const age = Date.now() - timestamp.getTime();
                if (age < 5000) {
                  const message = {
                    id: change.doc.id,
                    senderId: data.senderId,
                    senderName: data.senderName || 'User',
                    senderHandle: data.senderHandle || '',
                    senderAvatarUrl: data.senderAvatarUrl,
                    content: data.content,
                    type: data.type || 'text',
                    timestamp: timestamp.toISOString(),
                    isDeleted: data.isDeleted || false,
                  };

                  try {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: 'message', data: message })}\n\n`
                      )
                    );
                  } catch {
                    // Stream closed
                  }
                }
              }
            }
          });
        },
        (error) => {
          logger.error('Firestore listener error', error instanceof Error ? error : new Error(String(error)));
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Connection error' })}\n\n`)
            );
          } catch {
            // Stream closed
          }
        }
      );

      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`)
          );
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        if (unsubscribe) {
          unsubscribe();
        }
        clearInterval(pingInterval);
      });
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
