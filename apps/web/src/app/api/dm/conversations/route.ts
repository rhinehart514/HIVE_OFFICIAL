import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { dbAdmin as db } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { isDMsEnabled } from '@/lib/feature-flags';

// Zod schema for conversation creation
const CreateConversationSchema = z.object({
  recipientId: z.string().min(1, 'recipientId is required'),
});

/**
 * DM Conversations API
 *
 * GET  - List user's DM conversations
 * POST - Create or get existing conversation with a recipient
 */

// ============================================================================
// Types
// ============================================================================

interface Participant {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}

interface ConversationResponse {
  id: string;
  participants: Record<string, Participant>;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate deterministic conversation ID for a DM between two users
 */
function getDMConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

/**
 * Fetch user data for participants
 */
async function fetchUserData(userId: string): Promise<Participant | null> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return null;

  const data = userDoc.data()!;
  return {
    id: userId,
    name: [data.firstName, data.lastName].filter(Boolean).join(' ') || data.handle || 'User',
    handle: data.handle || userId.slice(0, 8),
    avatarUrl: data.profilePhoto || undefined,
  };
}

// ============================================================================
// GET /api/dm/conversations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check feature flag
    const dmsEnabled = await isDMsEnabled({ userId: session.userId, schoolId: session.campusId });
    if (!dmsEnabled) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 403 });
    }

    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const cursor = searchParams.get('cursor');

    // Query conversations where user is a participant
    let query = db
      .collection('dm_conversations')
      .where('participantIds', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .limit(limit + 1); // Fetch one extra to check for more

    if (cursor) {
      const cursorDoc = await db.collection('dm_conversations').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

    const conversations: ConversationResponse[] = docs.map((doc) => {
      const data = doc.data();
      const readState = data.readState?.[userId] || {};

      return {
        id: doc.id,
        participants: data.participants || {},
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
      };
    });

    return NextResponse.json({
      success: true,
      conversations,
      nextCursor: hasMore ? docs[docs.length - 1].id : null,
    });
  } catch (error) {
    logger.error('Failed to fetch DM conversations', {
      action: 'dm_conversations_list',
      endpoint: '/api/dm/conversations',
    }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/dm/conversations
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check feature flag
    const dmsEnabled = await isDMsEnabled({ userId: session.userId, schoolId: session.campusId });
    if (!dmsEnabled) {
      return NextResponse.json({ error: 'Feature not available' }, { status: 403 });
    }

    const { recipientId } = CreateConversationSchema.parse(await request.json());

    const currentUserId = session.userId;

    if (recipientId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot start conversation with yourself' },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    if (!recipientDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate deterministic conversation ID
    const conversationId = getDMConversationId(currentUserId, recipientId);

    // Check if conversation already exists
    const existingConvo = await db.collection('dm_conversations').doc(conversationId).get();

    if (existingConvo.exists) {
      const data = existingConvo.data()!;
      const readState = data.readState?.[currentUserId] || {};

      return NextResponse.json({
        success: true,
        conversation: {
          id: conversationId,
          participants: data.participants || {},
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
        isNew: false,
      });
    }

    // Fetch participant data
    const [currentUserData, recipientData] = await Promise.all([
      fetchUserData(currentUserId),
      fetchUserData(recipientId),
    ]);

    if (!currentUserData || !recipientData) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Create new conversation
    const participantIds = [currentUserId, recipientId].sort();
    const participants: Record<string, Participant> = {
      [currentUserId]: currentUserData,
      [recipientId]: recipientData,
    };

    const now = FieldValue.serverTimestamp();
    const conversationData = {
      participantIds,
      participants,
      lastMessage: null,
      readState: {
        [currentUserId]: { lastReadAt: now, unreadCount: 0 },
        [recipientId]: { lastReadAt: null, unreadCount: 0 },
      },
      campusId: session.campusId || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('dm_conversations').doc(conversationId).set(conversationData);

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversationId,
        participants,
        lastMessage: undefined,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isNew: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid input' }, { status: 400 });
    }
    logger.error('Failed to create DM conversation', {
      action: 'dm_conversation_create',
      endpoint: '/api/dm/conversations',
    }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
