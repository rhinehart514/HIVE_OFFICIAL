import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';
import { dbAdmin as db } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

/**
 * DM Messages API
 *
 * GET  - List messages in a conversation (marks as read)
 * POST - Send a message
 */

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// ============================================================================
// Types
// ============================================================================

interface MessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  senderHandle: string;
  senderAvatarUrl?: string;
  content: string;
  type: 'text';
  timestamp: string;
  isDeleted: boolean;
}

// ============================================================================
// GET /api/dm/conversations/[conversationId]/messages
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const cursor = searchParams.get('cursor');

    // Verify user is a participant
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

    const conversationData = conversationDoc.data()!;
    if (!conversationData.participantIds?.includes(userId)) {
      return NextResponse.json(
        { error: 'Not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get messages
    let query = db
      .collection('dm_conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorDoc = await db
        .collection('dm_conversations')
        .doc(conversationId)
        .collection('messages')
        .doc(cursor)
        .get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

    const messages: MessageResponse[] = docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId,
        senderName: data.senderName || 'User',
        senderHandle: data.senderHandle || '',
        senderAvatarUrl: data.senderAvatarUrl,
        content: data.content,
        type: data.type || 'text',
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        isDeleted: data.isDeleted || false,
      };
    });

    // Mark as read (reset unread count)
    await db
      .collection('dm_conversations')
      .doc(conversationId)
      .update({
        [`readState.${userId}.lastReadAt`]: FieldValue.serverTimestamp(),
        [`readState.${userId}.unreadCount`]: 0,
      });

    // Reverse to get chronological order
    messages.reverse();

    return NextResponse.json({
      success: true,
      messages,
      nextCursor: hasMore ? docs[docs.length - 1].id : null,
    });
  } catch (error) {
    logger.error('Failed to fetch DM messages', {
      action: 'dm_messages_list',
      endpoint: '/api/dm/conversations/[conversationId]/messages',
    }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/dm/conversations/[conversationId]/messages
// ============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const userId = session.userId;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 4000) {
      return NextResponse.json(
        { error: 'Message too long (max 4000 characters)' },
        { status: 400 }
      );
    }

    // Verify user is a participant and get conversation data
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

    const conversationData = conversationDoc.data()!;
    if (!conversationData.participantIds?.includes(userId)) {
      return NextResponse.json(
        { error: 'Not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get sender info from participants or fetch if needed
    const senderInfo = conversationData.participants?.[userId] || {};
    const senderName = senderInfo.name || 'User';
    const senderHandle = senderInfo.handle || '';
    const senderAvatarUrl = senderInfo.avatarUrl;

    // Get the other participant ID
    const otherParticipantId = conversationData.participantIds.find(
      (id: string) => id !== userId
    );

    const now = FieldValue.serverTimestamp();
    const messageId = db
      .collection('dm_conversations')
      .doc(conversationId)
      .collection('messages')
      .doc().id;

    const messageData = {
      senderId: userId,
      senderName,
      senderHandle,
      senderAvatarUrl: senderAvatarUrl || null,
      content: trimmedContent,
      type: 'text',
      timestamp: now,
      isDeleted: false,
    };

    // Create message and update conversation in a batch
    const batch = db.batch();

    // Add message
    const messageRef = db
      .collection('dm_conversations')
      .doc(conversationId)
      .collection('messages')
      .doc(messageId);
    batch.set(messageRef, messageData);

    // Update conversation with last message and increment other user's unread count
    const conversationRef = db.collection('dm_conversations').doc(conversationId);
    const updateData: Record<string, unknown> = {
      lastMessage: {
        content: trimmedContent.slice(0, 100), // Store preview only
        senderId: userId,
        timestamp: now,
      },
      updatedAt: now,
    };

    // Increment unread count for the other participant
    if (otherParticipantId) {
      updateData[`readState.${otherParticipantId}.unreadCount`] = FieldValue.increment(1);
    }

    batch.update(conversationRef, updateData);

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        senderId: userId,
        senderName,
        senderHandle,
        senderAvatarUrl,
        content: trimmedContent,
        type: 'text',
        timestamp: new Date().toISOString(),
        isDeleted: false,
      },
    });
  } catch (error) {
    logger.error('Failed to send DM message', {
      action: 'dm_message_send',
      endpoint: '/api/dm/conversations/[conversationId]/messages',
    }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
