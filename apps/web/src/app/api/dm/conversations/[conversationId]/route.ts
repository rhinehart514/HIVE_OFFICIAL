import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { dbAdmin as db } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

/**
 * DM Conversation Detail API
 *
 * GET - Get conversation details
 */

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// ============================================================================
// GET /api/dm/conversations/[conversationId]
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const userId = session.userId;

    // Get conversation
    const conversationDoc = await db
      .collection('dm_conversations')
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const data = conversationDoc.data()!;

    // Verify user is a participant
    if (!data.participantIds?.includes(userId)) {
      return NextResponse.json(
        { error: 'Not a participant in this conversation' },
        { status: 403 }
      );
    }

    const readState = data.readState?.[userId] || {};

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversationId,
        participants: data.participants || {},
        participantIds: data.participantIds || [],
        lastMessage: data.lastMessage
          ? {
              content: data.lastMessage.content,
              senderId: data.lastMessage.senderId,
              timestamp: data.lastMessage.timestamp?.toDate?.()?.toISOString() || null,
            }
          : undefined,
        unreadCount: readState.unreadCount || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch conversation', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
