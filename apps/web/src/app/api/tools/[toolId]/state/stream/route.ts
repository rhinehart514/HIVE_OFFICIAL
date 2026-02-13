import { type NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger, logSecurityEvent } from '@/lib/structured-logger';
import { verifySession, type SessionData } from '@/lib/session';
import { sseConnectionRateLimit } from '@/lib/rate-limit-simple';

function readSessionCookie(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('hive_session');
  return sessionCookie?.value || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId } = await params;
  const url = new URL(request.url);
  const spaceId = url.searchParams.get('spaceId');

  if (!spaceId) {
    return new Response('spaceId is required', { status: 400 });
  }

  const sessionToken = readSessionCookie(request);
  if (!sessionToken) {
    return new Response('Unauthorized - no session cookie', { status: 401 });
  }

  let session: SessionData | null;
  try {
    session = await verifySession(sessionToken);
  } catch {
    return new Response('Unauthorized - invalid session', { status: 401 });
  }

  if (!session?.userId) {
    return new Response('Unauthorized - session expired', { status: 401 });
  }

  const userId = session.userId;
  const campusId = session.campusId;

  const rateLimitResult = sseConnectionRateLimit.check(userId);
  if (!rateLimitResult.success) {
    logSecurityEvent('rate_limit', {
      operation: 'tool_state_sse_blocked',
      tags: {
        userId,
        toolId,
        spaceId,
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

  // Campus and membership access checks
  const [toolDoc, spaceDoc, membershipSnapshot] = await Promise.all([
    dbAdmin.collection('tools').doc(toolId).get(),
    dbAdmin.collection('spaces').doc(spaceId).get(),
    dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('spaceId', '==', spaceId)
      .where('status', '==', 'active')
      .limit(1)
      .get(),
  ]);

  if (!toolDoc.exists || !spaceDoc.exists || membershipSnapshot.empty) {
    return new Response('Forbidden', { status: 403 });
  }

  if (
    campusId &&
    ((toolDoc.data()?.campusId && toolDoc.data()?.campusId !== campusId) ||
      (spaceDoc.data()?.campusId && spaceDoc.data()?.campusId !== campusId))
  ) {
    return new Response('Forbidden - campus mismatch', { status: 403 });
  }

  logger.info('Tool state SSE stream requested', {
    userId,
    toolId,
    spaceId,
  });

  const sharedStateDocId = `${toolId}_${spaceId}_shared`;
  const personalStateDocId = `${toolId}_${spaceId}_${userId}`;

  let isClosed = false;
  let unsubscribeShared: (() => void) | null = null;
  let unsubscribePersonal: (() => void) | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendMessage = (data: Record<string, unknown>) => {
        if (isClosed) return false;
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
          return true;
        } catch {
          isClosed = true;
          return false;
        }
      };

      sendMessage({
        type: 'connected',
        toolId,
        spaceId,
        timestamp: Date.now(),
      });

      unsubscribeShared = dbAdmin
        .collection('tool_states')
        .doc(sharedStateDocId)
        .onSnapshot(
          (snapshot) => {
            if (isClosed) return;
            if (!snapshot.exists) return;

            const raw = snapshot.data() || {};
            const {
              metadata: _metadata,
              toolId: _toolId,
              spaceId: _spaceId,
              campusId: _campusId,
              userId: _stateUserId,
              scope: _scope,
              ...state
            } = raw;
            if (!sendMessage({ type: 'shared_state', state, timestamp: Date.now() })) {
              unsubscribeShared?.();
              unsubscribePersonal?.();
            }
          },
          (error) => {
            logger.error('Shared state SSE snapshot error', {
              toolId,
              spaceId,
              userId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        );

      unsubscribePersonal = dbAdmin
        .collection('tool_states')
        .doc(personalStateDocId)
        .onSnapshot(
          (snapshot) => {
            if (isClosed) return;
            if (!snapshot.exists) return;

            const raw = snapshot.data() || {};
            const {
              metadata: _metadata,
              toolId: _toolId,
              spaceId: _spaceId,
              campusId: _campusId,
              userId: _stateUserId,
              scope: _scope,
              ...state
            } = raw;
            if (!sendMessage({ type: 'personal_state', state, timestamp: Date.now() })) {
              unsubscribeShared?.();
              unsubscribePersonal?.();
            }
          },
          (error) => {
            logger.error('Personal state SSE snapshot error', {
              toolId,
              spaceId,
              userId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        );

      heartbeatInterval = setInterval(() => {
        if (isClosed) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          return;
        }
        if (!sendMessage({ type: 'ping', timestamp: Date.now() })) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          unsubscribeShared?.();
          unsubscribePersonal?.();
        }
      }, 30000);
    },

    cancel() {
      isClosed = true;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      unsubscribeShared?.();
      unsubscribePersonal?.();

      logger.info('Tool state SSE stream closed', {
        userId,
        toolId,
        spaceId,
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
