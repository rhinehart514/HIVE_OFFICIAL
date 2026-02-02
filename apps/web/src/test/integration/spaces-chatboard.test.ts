/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Logger silent
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/structured-logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

// In-memory Firestore Admin + admin FieldValue
import { dbAdminMock, adminMock, getCollection, resetCollections } from '../utils/inmemory-firestore';
// server-only shim for Next.js server directive
vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => ({ dbAdmin: dbAdminMock }));
vi.mock('firebase-admin', () => adminMock);
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => new Date(),
    increment: (n: number) => ({ __op: 'inc', value: n })
  }
}));

// Mock getAuth token verification
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: vi.fn(async (token: string) => {
      if (token.startsWith('dev_token_')) {
        const uid = token.replace('dev_token_', '').split('_')[0];
        return { uid, email: `${uid}@test.edu` } as any;
      }
      throw new Error('Invalid token');
    })
  })
}));

// Mock space permission middleware
vi.mock('@/lib/space-permission-middleware', () => ({
  checkSpacePermission: vi.fn(async (spaceId: string, userId: string, requiredRole: string) => {
    // Get the membership from the in-memory store
    const memberships = getCollection('spaceMembers');
    const compositeId = `${spaceId}_${userId}`;
    const membership = await memberships.doc(compositeId).get();

    if (!membership.exists) {
      // Check if space is public (allow guest access)
      const spaces = getCollection('spaces');
      const space = await spaces.doc(spaceId).get();
      if (space.exists && space.data()?.isPublic && requiredRole === 'guest') {
        return { hasPermission: true, role: 'guest', space: space.data() };
      }
      return { hasPermission: false };
    }

    const role = membership.data()?.role || 'member';
    // Valid roles: owner, admin, moderator, member, guest
    const roleHierarchy: Record<string, number> = {
      'owner': 4,
      'admin': 3,
      'moderator': 2,
      'member': 1,
      'guest': 0
    };

    const requiredLevel = roleHierarchy[requiredRole === 'leader' ? 'moderator' : requiredRole] || 0;
    const userLevel = roleHierarchy[role] || 0;

    return {
      hasPermission: userLevel >= requiredLevel,
      role,
      space: (await getCollection('spaces').doc(spaceId).get()).data()
    };
  })
}));

// Mock the DDD repositories with in-memory implementations
const boardStore = new Map<string, any>();
const messageStore = new Map<string, any>();
const inlineComponentStore = new Map<string, any>();

let boardIdCounter = 0;
let messageIdCounter = 0;

const mockBoardRepo = {
  findById: vi.fn(async (id: string) => {
    const board = boardStore.get(id);
    if (!board) return { isSuccess: false, isFailure: true, error: 'Board not found' };
    return { isSuccess: true, isFailure: false, getValue: () => ({
      id,
      toDTO: () => board,
    })};
  }),
  findBySpaceId: vi.fn(async (spaceId: string) => {
    const boards = Array.from(boardStore.entries())
      .filter(([_, b]) => b.spaceId === spaceId)
      .map(([id, b]) => ({
        id,
        toDTO: () => b,
      }));
    return { isSuccess: true, isFailure: false, getValue: () => boards };
  }),
  save: vi.fn(async (board: any) => {
    const id = board.id || `board_${++boardIdCounter}`;
    boardStore.set(id, { ...board, id });
    return { isSuccess: true, isFailure: false, getValue: () => ({ id }) };
  }),
  delete: vi.fn(async (id: string) => {
    boardStore.delete(id);
    return { isSuccess: true, isFailure: false };
  }),
};

const mockMessageRepo = {
  findById: vi.fn(async (id: string) => {
    const msg = messageStore.get(id);
    if (!msg) return { isSuccess: false, isFailure: true, error: 'Message not found' };
    return { isSuccess: true, isFailure: false, getValue: () => ({
      id,
      toDTO: () => msg,
    })};
  }),
  findByBoardId: vi.fn(async (boardId: string, options?: any) => {
    let messages = Array.from(messageStore.entries())
      .filter(([_, m]) => m.boardId === boardId && !m.isDeleted)
      .map(([id, m]) => ({
        id,
        toDTO: () => m,
      }));

    // Sort by timestamp descending
    messages.sort((a, b) => (b.toDTO().timestamp || 0) - (a.toDTO().timestamp || 0));

    const limit = options?.limit || 50;
    messages = messages.slice(0, limit);

    return {
      isSuccess: true,
      isFailure: false,
      getValue: () => ({
        messages,
        hasMore: messages.length >= limit
      })
    };
  }),
  save: vi.fn(async (message: any) => {
    const id = message.id || `msg_${++messageIdCounter}`;
    const timestamp = Date.now();
    messageStore.set(id, { ...message, id, timestamp });
    return { isSuccess: true, isFailure: false, getValue: () => ({ id, timestamp }) };
  }),
  update: vi.fn(async (id: string, updates: any) => {
    const existing = messageStore.get(id);
    if (!existing) return { isSuccess: false, isFailure: true, error: 'Message not found' };
    messageStore.set(id, { ...existing, ...updates });
    return { isSuccess: true, isFailure: false };
  }),
  delete: vi.fn(async (id: string) => {
    const existing = messageStore.get(id);
    if (existing) {
      messageStore.set(id, { ...existing, isDeleted: true });
    }
    return { isSuccess: true, isFailure: false };
  }),
};

const mockInlineComponentRepo = {
  findById: vi.fn(async (id: string) => {
    const component = inlineComponentStore.get(id);
    if (!component) return { isSuccess: false, isFailure: true, error: 'Component not found' };
    return { isSuccess: true, isFailure: false, getValue: () => component };
  }),
  save: vi.fn(async (component: any) => {
    inlineComponentStore.set(component.id, component);
    return { isSuccess: true, isFailure: false };
  }),
};

// Mock the SpaceChatService factory
vi.mock('@hive/core/server', () => ({
  createServerSpaceChatService: vi.fn((context, callbacks) => {
    return {
      listBoards: vi.fn(async (userId: string, spaceId: string) => {
        const permCheck = await callbacks.checkPermission(userId, spaceId, 'member');
        if (!permCheck.allowed) {
          return { isSuccess: false, isFailure: true, error: 'Access denied' };
        }

        const result = await mockBoardRepo.findBySpaceId(spaceId);
        return {
          isSuccess: true,
          isFailure: false,
          getValue: () => ({ data: result.getValue() })
        };
      }),

      createBoard: vi.fn(async (userId: string, input: any) => {
        const permCheck = await callbacks.checkPermission(userId, input.spaceId, 'leader');
        if (!permCheck.allowed) {
          return { isSuccess: false, isFailure: true, error: 'Only leaders can create boards' };
        }

        const boardData = {
          spaceId: input.spaceId,
          name: input.name,
          type: input.type,
          description: input.description,
          linkedEventId: input.linkedEventId,
          canPost: input.canPost || 'members',
          messageCount: 0,
          participantCount: 0,
          isDefault: false,
          isLocked: false,
          createdAt: new Date(),
          lastActivityAt: new Date(),
        };

        const result = await mockBoardRepo.save(boardData);
        const boardId = result.getValue().id;

        return {
          isSuccess: true,
          isFailure: false,
          getValue: () => ({
            data: { boardId, name: input.name, type: input.type }
          })
        };
      }),

      listMessages: vi.fn(async (userId: string, options: any) => {
        const permCheck = await callbacks.checkPermission(userId, options.spaceId, 'member');
        if (!permCheck.allowed) {
          return { isSuccess: false, isFailure: true, error: 'Access denied' };
        }

        const result = await mockMessageRepo.findByBoardId(options.boardId, { limit: options.limit });
        const { messages, hasMore } = result.getValue();

        return {
          isSuccess: true,
          isFailure: false,
          getValue: () => ({ data: { messages, hasMore } })
        };
      }),

      sendMessage: vi.fn(async (userId: string, input: any) => {
        const permCheck = await callbacks.checkPermission(userId, input.spaceId, 'member');
        if (!permCheck.allowed) {
          return { isSuccess: false, isFailure: true, error: 'Access denied' };
        }

        // Get user profile for author info
        const profile = await callbacks.getUserProfile(userId);

        const messageData = {
          boardId: input.boardId,
          spaceId: input.spaceId,
          authorId: userId,
          authorName: profile?.displayName || 'Member',
          authorAvatarUrl: profile?.avatarUrl,
          authorRole: permCheck.role,
          content: input.content,
          type: input.componentData ? 'inline_component' : 'text',
          componentData: input.componentData,
          replyToId: input.replyToId,
          reactions: [],
          isPinned: false,
          isDeleted: false,
          threadCount: 0,
        };

        const result = await mockMessageRepo.save(messageData);
        const { id: messageId, timestamp } = result.getValue();

        return {
          isSuccess: true,
          isFailure: false,
          getValue: () => ({
            data: { messageId, timestamp }
          })
        };
      }),

      deleteBoard: vi.fn(async (userId: string, spaceId: string, boardId: string) => {
        const permCheck = await callbacks.checkPermission(userId, spaceId, 'leader');
        if (!permCheck.allowed) {
          return { isSuccess: false, isFailure: true, error: 'Only leaders can delete boards' };
        }

        await mockBoardRepo.delete(boardId);
        return { isSuccess: true, isFailure: false, getValue: () => ({}) };
      }),
    };
  }),
  getServerSpaceRepository: vi.fn(() => ({
    findById: vi.fn(async (id: string) => {
      const space = await getCollection('spaces').doc(id).get();
      if (!space.exists) {
        return { isSuccess: false, isFailure: true, error: 'Space not found' };
      }
      return {
        isSuccess: true,
        isFailure: false,
        getValue: () => ({
          spaceId: { value: id },
          name: { value: space.data()?.name || 'Test Space' },
          campusId: { id: space.data()?.campusId || 'ub-buffalo' },
          category: { value: space.data()?.category || 'student_org' },
          isPublic: space.data()?.isPublic ?? true,
          slug: space.data()?.slug ? { value: space.data()?.slug } : undefined,
        })
      };
    }),
  })),
}));

// Import routes after mocks
import * as BoardsRoute from '@/app/api/spaces/[spaceId]/boards/route';
import * as ChatRoute from '@/app/api/spaces/[spaceId]/chat/route';

const devAuth = (uid: string) => ({ authorization: `Bearer dev_token_${uid}` });

function makeReq(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers as any);
  const body = init?.body as any;
  const method = (init?.method || 'GET') as any;
  const req = new Request(url, { headers, method, body });
  return new NextRequest(req);
}

describe('Spaces Chat Board Integration Tests', () => {
  const testSpaceId = 'test-space-1';
  const ownerId = 'u1';
  const memberId = 'u2';
  const nonMemberId = 'u3';

  beforeEach(() => {
    resetCollections();
    boardStore.clear();
    messageStore.clear();
    inlineComponentStore.clear();
    boardIdCounter = 0;
    messageIdCounter = 0;

    // Seed users
    const daysAgo = (d: number) => ({ toDate: () => new Date(Date.now() - d * 24 * 60 * 60 * 1000) });
    getCollection('users').doc(ownerId).set({
      fullName: 'Owner One', email: 'u1@buffalo.edu', role: 'student',
      createdAt: daysAgo(30), isAdmin: false
    });
    getCollection('users').doc(memberId).set({
      fullName: 'Member Two', email: 'u2@buffalo.edu', role: 'student',
      createdAt: daysAgo(30), isAdmin: false
    });
    getCollection('users').doc(nonMemberId).set({
      fullName: 'Non-Member Three', email: 'u3@buffalo.edu', role: 'student',
      createdAt: daysAgo(30), isAdmin: false
    });

    // Seed profiles for chat display names
    getCollection('profiles').doc(ownerId).set({
      displayName: 'Owner One', avatarUrl: null
    });
    getCollection('profiles').doc(memberId).set({
      displayName: 'Member Two', avatarUrl: null
    });

    // Seed a test space
    getCollection('spaces').doc(testSpaceId).set({
      name: 'Test Space',
      description: 'A test space',
      category: 'student_org',
      campusId: 'ub-buffalo',
      isPublic: false,
      memberCount: 2,
      createdAt: daysAgo(7)
    });

    // Seed memberships using composite keys
    getCollection('spaceMembers').doc(`${testSpaceId}_${ownerId}`).set({
      spaceId: testSpaceId,
      userId: ownerId,
      role: 'owner',
      campusId: 'ub-buffalo',
      isActive: true,
      joinedAt: daysAgo(7)
    });
    getCollection('spaceMembers').doc(`${testSpaceId}_${memberId}`).set({
      spaceId: testSpaceId,
      userId: memberId,
      role: 'member',
      campusId: 'ub-buffalo',
      isActive: true,
      joinedAt: daysAgo(3)
    });

    // Seed a default board
    const defaultBoard = {
      id: 'default-board',
      spaceId: testSpaceId,
      name: 'General',
      type: 'general',
      description: 'General discussion',
      canPost: 'members',
      messageCount: 0,
      participantCount: 0,
      isDefault: true,
      isLocked: false,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };
    boardStore.set('default-board', defaultBoard);
  });

  describe('GET /api/spaces/[spaceId]/boards', () => {
    it('should list boards for space members', async () => {
      const res = await BoardsRoute.GET(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/boards`, {
          headers: devAuth(memberId)
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.boards)).toBe(true);
      expect(json.data.boards.length).toBeGreaterThanOrEqual(1);
      expect(json.data.boards[0].name).toBe('General');
    });

    it('should deny access to non-members for private space', async () => {
      const res = await BoardsRoute.GET(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/boards`, {
          headers: devAuth(nonMemberId)
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(500); // Service returns error
      const json = await res.json();
      expect(json.success).toBe(false);
    });
  });

  describe('POST /api/spaces/[spaceId]/boards', () => {
    it('should allow owner to create a board', async () => {
      const res = await BoardsRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/boards`, {
          method: 'POST',
          headers: { ...devAuth(ownerId), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Study Group',
            type: 'topic',
            description: 'For study sessions',
            canPost: 'members'
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.board.name).toBe('Study Group');
      expect(json.data.board.type).toBe('topic');
    });

    it('should deny regular member from creating boards', async () => {
      const res = await BoardsRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/boards`, {
          method: 'POST',
          headers: { ...devAuth(memberId), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Unauthorized Board',
            type: 'topic',
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('should validate board creation input', async () => {
      const res = await BoardsRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/boards`, {
          method: 'POST',
          headers: { ...devAuth(ownerId), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: '', // Invalid: empty name
            type: 'invalid_type', // Invalid type
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      // Zod validation returns 400, but the withAuthValidationAndErrors wrapper may return 400 or 422
      expect([400, 422, 500]).toContain(res.status);
      const json = await res.json();
      expect(json.success).toBe(false);
    });
  });

  describe('GET /api/spaces/[spaceId]/chat', () => {
    it('should list messages for a board', async () => {
      // Add some test messages
      const boardId = 'default-board';
      messageStore.set('msg-1', {
        id: 'msg-1',
        boardId,
        spaceId: testSpaceId,
        authorId: ownerId,
        authorName: 'Owner One',
        content: 'Hello everyone!',
        type: 'text',
        timestamp: Date.now() - 1000,
        reactions: [],
        isPinned: false,
        isDeleted: false,
      });
      messageStore.set('msg-2', {
        id: 'msg-2',
        boardId,
        spaceId: testSpaceId,
        authorId: memberId,
        authorName: 'Member Two',
        content: 'Hey there!',
        type: 'text',
        timestamp: Date.now(),
        reactions: [],
        isPinned: false,
        isDeleted: false,
      });

      const res = await ChatRoute.GET(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/chat?boardId=${boardId}&limit=50`, {
          headers: devAuth(memberId)
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.messages)).toBe(true);
      expect(json.data.messages.length).toBe(2);
    });

    it('should require boardId parameter', async () => {
      const res = await ChatRoute.GET(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/chat`, {
          headers: devAuth(memberId)
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });
  });

  describe('POST /api/spaces/[spaceId]/chat', () => {
    it('should allow member to send a message', async () => {
      const boardId = 'default-board';

      const res = await ChatRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/chat`, {
          method: 'POST',
          headers: { ...devAuth(memberId), 'content-type': 'application/json' },
          body: JSON.stringify({
            boardId,
            content: 'This is a test message'
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.messageId).toBeDefined();
      expect(json.data.timestamp).toBeDefined();
    });

    it('should deny non-member from sending messages', async () => {
      const boardId = 'default-board';

      const res = await ChatRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/chat`, {
          method: 'POST',
          headers: { ...devAuth(nonMemberId), 'content-type': 'application/json' },
          body: JSON.stringify({
            boardId,
            content: 'Unauthorized message'
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('should validate message content', async () => {
      const boardId = 'default-board';

      const res = await ChatRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/chat`, {
          method: 'POST',
          headers: { ...devAuth(memberId), 'content-type': 'application/json' },
          body: JSON.stringify({
            boardId,
            content: '' // Invalid: empty content
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      // Zod validation returns 400, but the middleware may return 400 or 422
      expect([400, 422, 500]).toContain(res.status);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('should support inline components in messages', async () => {
      const boardId = 'default-board';

      const res = await ChatRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/chat`, {
          method: 'POST',
          headers: { ...devAuth(ownerId), 'content-type': 'application/json' },
          body: JSON.stringify({
            boardId,
            content: 'Check out this poll!',
            componentData: {
              elementType: 'poll',
              deploymentId: 'deploy-123',
              toolId: 'tool-456',
              state: { votes: {} },
              isActive: true
            }
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe('Role-based permissions', () => {
    it('should allow moderator to create boards', async () => {
      // Promote member to moderator
      getCollection('spaceMembers').doc(`${testSpaceId}_${memberId}`).set({
        spaceId: testSpaceId,
        userId: memberId,
        role: 'moderator',
        campusId: 'ub-buffalo',
        isActive: true,
        joinedAt: new Date()
      });

      const res = await BoardsRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/boards`, {
          method: 'POST',
          headers: { ...devAuth(memberId), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Mod Board',
            type: 'topic',
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(201);
    });

    it('should allow admin to create boards', async () => {
      // Create admin membership
      getCollection('spaceMembers').doc(`${testSpaceId}_admin1`).set({
        spaceId: testSpaceId,
        userId: 'admin1',
        role: 'admin',
        campusId: 'ub-buffalo',
        isActive: true,
        joinedAt: new Date()
      });
      getCollection('users').doc('admin1').set({
        fullName: 'Admin User', email: 'admin1@buffalo.edu', role: 'student',
        createdAt: new Date(), isAdmin: false
      });

      const res = await BoardsRoute.POST(
        makeReq(`http://localhost/api/spaces/${testSpaceId}/boards`, {
          method: 'POST',
          headers: { ...devAuth('admin1'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Admin Board',
            type: 'topic',
          })
        }) as any,
        { params: Promise.resolve({ spaceId: testSpaceId }) } as any
      );

      expect(res.status).toBe(201);
    });
  });

  describe('Public space guest access', () => {
    const publicSpaceId = 'public-space-1';

    beforeEach(() => {
      // Create a public space
      getCollection('spaces').doc(publicSpaceId).set({
        name: 'Public Space',
        description: 'A public space',
        category: 'student_org',
        campusId: 'ub-buffalo',
        isPublic: true,
        memberCount: 1,
        createdAt: new Date()
      });

      // Add owner
      getCollection('spaceMembers').doc(`${publicSpaceId}_${ownerId}`).set({
        spaceId: publicSpaceId,
        userId: ownerId,
        role: 'owner',
        campusId: 'ub-buffalo',
        isActive: true,
        joinedAt: new Date()
      });

      // Add a board
      boardStore.set('public-board', {
        id: 'public-board',
        spaceId: publicSpaceId,
        name: 'Public General',
        type: 'general',
        canPost: 'members',
        messageCount: 0,
        participantCount: 0,
        isDefault: true,
        isLocked: false,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      });
    });

    it('should allow guests to view boards in public spaces', async () => {
      const res = await BoardsRoute.GET(
        makeReq(`http://localhost/api/spaces/${publicSpaceId}/boards`, {
          headers: devAuth(nonMemberId)
        }) as any,
        { params: Promise.resolve({ spaceId: publicSpaceId }) } as any
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
