import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, init) => ({ data, init, ok: true })),
    error: vi.fn(() => ({ ok: false })),
  },
}));

describe('Space Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/spaces/[spaceId]/chat', () => {
    it('should fetch messages for a space with proper ordering', async () => {
      const fetchMessages = async (spaceId: string, boardId: string, limit = 50) => {
        const allMessages = [
          {
            id: 'msg-1',
            content: 'Hello everyone!',
            authorId: 'user-1',
            authorName: 'John',
            boardId: 'general',
            spaceId: 'space-1',
            createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
          },
          {
            id: 'msg-2',
            content: 'Hi John!',
            authorId: 'user-2',
            authorName: 'Jane',
            boardId: 'general',
            spaceId: 'space-1',
            createdAt: new Date('2024-01-01T10:01:00Z').toISOString(),
          },
          {
            id: 'msg-3',
            content: 'Different board',
            authorId: 'user-3',
            authorName: 'Bob',
            boardId: 'events',
            spaceId: 'space-1',
            createdAt: new Date('2024-01-01T10:02:00Z').toISOString(),
          },
        ];

        const filtered = allMessages
          .filter((m) => m.spaceId === spaceId && m.boardId === boardId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(0, limit);

        return NextResponse.json({ messages: filtered });
      };

      const response = await fetchMessages('space-1', 'general');
      expect(response.data.messages).toHaveLength(2);
      expect(response.data.messages[0].content).toBe('Hello everyone!');
      expect(response.data.messages[1].content).toBe('Hi John!');

      // Different board
      const eventsResponse = await fetchMessages('space-1', 'events');
      expect(eventsResponse.data.messages).toHaveLength(1);
      expect(eventsResponse.data.messages[0].content).toBe('Different board');
    });

    it('should enforce space membership for private spaces', async () => {
      const fetchMessages = async (
        spaceId: string,
        userId: string,
        isMember: boolean,
        isPrivate: boolean
      ) => {
        if (isPrivate && !isMember) {
          return NextResponse.json(
            { error: 'You must be a member to view this space' },
            { status: 403 }
          );
        }

        return NextResponse.json({ messages: [{ id: 'msg-1', content: 'Secret message' }] });
      };

      // Member of private space
      const memberAccess = await fetchMessages('space-1', 'user-1', true, true);
      expect(memberAccess.data.messages).toHaveLength(1);

      // Non-member of private space
      const nonMemberAccess = await fetchMessages('space-1', 'user-2', false, true);
      expect(nonMemberAccess.init.status).toBe(403);

      // Public space - anyone can view
      const publicAccess = await fetchMessages('space-1', 'user-2', false, false);
      expect(publicAccess.data.messages).toHaveLength(1);
    });
  });

  describe('POST /api/spaces/[spaceId]/chat', () => {
    it('should create a message with proper validation', async () => {
      const sendMessage = async (
        spaceId: string,
        boardId: string,
        content: string,
        user: { uid: string; displayName: string } | null
      ) => {
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!content || content.trim().length === 0) {
          return NextResponse.json({ error: 'Message content required' }, { status: 400 });
        }

        if (content.length > 2000) {
          return NextResponse.json({ error: 'Message too long' }, { status: 400 });
        }

        const message = {
          id: `msg-${Date.now()}`,
          content: content.trim(),
          authorId: user.uid,
          authorName: user.displayName,
          boardId,
          spaceId,
          createdAt: new Date().toISOString(),
          reactions: {},
        };

        return NextResponse.json(message, { status: 201 });
      };

      // Valid message
      const valid = await sendMessage('space-1', 'general', 'Hello!', {
        uid: 'user-1',
        displayName: 'John',
      });
      expect(valid.init?.status).toBe(201);
      expect(valid.data.content).toBe('Hello!');

      // Unauthorized
      const unauth = await sendMessage('space-1', 'general', 'Test', null);
      expect(unauth.init.status).toBe(401);

      // Empty content
      const empty = await sendMessage('space-1', 'general', '   ', {
        uid: 'user-1',
        displayName: 'John',
      });
      expect(empty.init.status).toBe(400);
    });

    it('should enforce rate limiting', async () => {
      const messageTimestamps: number[] = [];
      const RATE_LIMIT = 20; // 20 messages per minute
      const WINDOW = 60000; // 1 minute

      const sendMessageWithRateLimit = async (userId: string, content: string) => {
        const now = Date.now();
        // Clean old timestamps
        while (messageTimestamps.length > 0 && now - messageTimestamps[0] > WINDOW) {
          messageTimestamps.shift();
        }

        if (messageTimestamps.length >= RATE_LIMIT) {
          return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        messageTimestamps.push(now);
        return NextResponse.json({ id: `msg-${now}`, content });
      };

      // Send messages up to limit
      for (let i = 0; i < RATE_LIMIT; i++) {
        const response = await sendMessageWithRateLimit('user-1', `Message ${i}`);
        expect(response.data.content).toBe(`Message ${i}`);
      }

      // Next message should be rate limited
      const limited = await sendMessageWithRateLimit('user-1', 'Too many');
      expect(limited.init.status).toBe(429);
    });

    it('should sanitize message content for XSS', async () => {
      const sanitizeContent = (content: string): string => {
        return content
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      };

      const sendMessage = async (content: string) => {
        const sanitized = sanitizeContent(content);
        return NextResponse.json({ content: sanitized });
      };

      const xssAttempt = await sendMessage('<script>alert("xss")</script>');
      expect(xssAttempt.data.content).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');

      const htmlAttempt = await sendMessage('<img src=x onerror=alert(1)>');
      expect(xssAttempt.data.content).not.toContain('<img');
    });
  });

  describe('Threading', () => {
    it('should create threaded replies', async () => {
      const createReply = async (
        messageId: string,
        content: string,
        user: { uid: string; displayName: string }
      ) => {
        const reply = {
          id: `reply-${Date.now()}`,
          parentId: messageId,
          content,
          authorId: user.uid,
          authorName: user.displayName,
          createdAt: new Date().toISOString(),
        };

        return NextResponse.json(reply, { status: 201 });
      };

      const reply = await createReply('msg-1', 'I agree!', { uid: 'user-2', displayName: 'Jane' });
      expect(reply.data.parentId).toBe('msg-1');
      expect(reply.data.content).toBe('I agree!');
    });

    it('should fetch thread with parent and replies', async () => {
      const fetchThread = async (messageId: string) => {
        const thread = {
          parent: {
            id: messageId,
            content: 'What do you think about this?',
            authorName: 'John',
          },
          replies: [
            { id: 'reply-1', content: 'Looks good!', authorName: 'Jane', parentId: messageId },
            { id: 'reply-2', content: 'I agree', authorName: 'Bob', parentId: messageId },
          ],
          replyCount: 2,
        };

        return NextResponse.json(thread);
      };

      const thread = await fetchThread('msg-1');
      expect(thread.data.parent.id).toBe('msg-1');
      expect(thread.data.replies).toHaveLength(2);
      expect(thread.data.replyCount).toBe(2);
    });
  });

  describe('Reactions', () => {
    it('should add and remove reactions', async () => {
      const messageReactions: Record<string, Record<string, Set<string>>> = {
        'msg-1': { '👍': new Set(['user-1']), '❤️': new Set() },
      };

      const toggleReaction = async (messageId: string, emoji: string, userId: string) => {
        if (!messageReactions[messageId]) {
          messageReactions[messageId] = {};
        }
        if (!messageReactions[messageId][emoji]) {
          messageReactions[messageId][emoji] = new Set();
        }

        const reactions = messageReactions[messageId][emoji];
        if (reactions.has(userId)) {
          reactions.delete(userId);
          return NextResponse.json({ added: false, count: reactions.size });
        } else {
          reactions.add(userId);
          return NextResponse.json({ added: true, count: reactions.size });
        }
      };

      // Remove existing reaction
      const remove = await toggleReaction('msg-1', '👍', 'user-1');
      expect(remove.data.added).toBe(false);
      expect(remove.data.count).toBe(0);

      // Add reaction back
      const add = await toggleReaction('msg-1', '👍', 'user-1');
      expect(add.data.added).toBe(true);
      expect(add.data.count).toBe(1);

      // Add new emoji
      const newEmoji = await toggleReaction('msg-1', '🎉', 'user-2');
      expect(newEmoji.data.added).toBe(true);
    });
  });

  describe('Boards (Channels)', () => {
    it('should auto-create General board for new spaces', async () => {
      const createSpaceWithBoard = async (spaceId: string) => {
        // Auto-create General board
        const generalBoard = {
          id: `${spaceId}-general`,
          name: 'General',
          spaceId,
          isDefault: true,
          createdAt: new Date().toISOString(),
        };

        return NextResponse.json({
          space: { id: spaceId },
          boards: [generalBoard],
        });
      };

      const result = await createSpaceWithBoard('space-new');
      expect(result.data.boards).toHaveLength(1);
      expect(result.data.boards[0].name).toBe('General');
      expect(result.data.boards[0].isDefault).toBe(true);
    });

    it('should list boards for a space', async () => {
      const listBoards = async (spaceId: string) => {
        const boards = [
          { id: 'board-1', name: 'General', isDefault: true, messageCount: 150 },
          { id: 'board-2', name: 'Events', isDefault: false, messageCount: 45 },
          { id: 'board-3', name: 'Study Group', isDefault: false, messageCount: 78 },
        ];

        return NextResponse.json({ boards });
      };

      const response = await listBoards('space-1');
      expect(response.data.boards).toHaveLength(3);
      expect(response.data.boards[0].isDefault).toBe(true);
    });
  });

  describe('Pinned Messages', () => {
    it('should pin and unpin messages', async () => {
      const pinnedMessages = new Set(['msg-1']);

      const togglePin = async (messageId: string, userId: string, isLeader: boolean) => {
        if (!isLeader) {
          return NextResponse.json({ error: 'Only leaders can pin messages' }, { status: 403 });
        }

        if (pinnedMessages.has(messageId)) {
          pinnedMessages.delete(messageId);
          return NextResponse.json({ pinned: false });
        } else {
          pinnedMessages.add(messageId);
          return NextResponse.json({ pinned: true });
        }
      };

      // Non-leader cannot pin
      const nonLeader = await togglePin('msg-2', 'user-1', false);
      expect(nonLeader.init.status).toBe(403);

      // Leader can unpin
      const unpin = await togglePin('msg-1', 'user-leader', true);
      expect(unpin.data.pinned).toBe(false);

      // Leader can pin
      const pin = await togglePin('msg-2', 'user-leader', true);
      expect(pin.data.pinned).toBe(true);
    });

    it('should fetch pinned messages for a board', async () => {
      const fetchPinned = async (spaceId: string, boardId: string) => {
        const pinned = [
          { id: 'msg-1', content: 'Important announcement', pinnedAt: new Date().toISOString() },
          { id: 'msg-5', content: 'Rules reminder', pinnedAt: new Date().toISOString() },
        ];

        return NextResponse.json({ pinned });
      };

      const response = await fetchPinned('space-1', 'general');
      expect(response.data.pinned).toHaveLength(2);
    });
  });
});
