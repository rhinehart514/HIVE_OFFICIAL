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
vi.mock('@/lib/firebase-admin', () => ({ dbAdmin: dbAdminMock, isFirebaseConfigured: true }));
vi.mock('firebase-admin', () => adminMock);

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

// Mock session verification
vi.mock('@/lib/session', () => ({
  verifySession: vi.fn(async () => ({
    userId: 'u1',
    email: 'u1@buffalo.edu',
    campusId: 'ub-buffalo',
    isAdmin: false,
    verifiedAt: new Date().toISOString(),
    sessionId: 'test-session'
  }))
}));

// Mock event-board auto-link (since it uses SpaceChatService which is complex)
vi.mock('@/lib/event-board-auto-link', () => ({
  autoLinkEventToBoard: vi.fn(async () => ({ success: true, boardId: 'board_1', boardName: 'Test Event Board' })),
  findEventBoard: vi.fn(async () => null),
  unlinkEventBoard: vi.fn(async () => ({ success: true }))
}));

// Mock space permission middleware
vi.mock('@/lib/space-permission-middleware', () => ({
  checkSpacePermission: vi.fn(async (spaceId: string, userId: string, requiredRole: string) => {
    const space = await getCollection('spaces').doc(spaceId).get();
    if (!space.exists) {
      return { hasPermission: false, code: 'NOT_FOUND', error: 'Space not found' };
    }
    const spaceData = space.data();

    // Check membership
    const memberDoc = await getCollection('spaceMembers').doc(`${spaceId}_${userId}`).get();
    const membership = memberDoc.exists ? memberDoc.data() : null;

    // Guest access for public spaces
    if (!membership && spaceData.isPublic && requiredRole === 'guest') {
      return { hasPermission: true, space: spaceData, membership: null, role: 'guest' };
    }

    // Member access
    if (membership) {
      const roleHierarchy: Record<string, number> = { owner: 5, admin: 4, moderator: 3, member: 2, guest: 1 };
      const userRole = membership.role || 'member';
      const requiredLevel = roleHierarchy[requiredRole] || 1;
      const userLevel = roleHierarchy[userRole] || 1;

      if (userLevel >= requiredLevel) {
        return { hasPermission: true, space: spaceData, membership, role: userRole };
      }
    }

    return { hasPermission: false, code: 'FORBIDDEN', error: 'Insufficient permissions' };
  })
}));

// Import routes after mocks
import * as EventsRoute from '@/app/api/spaces/[spaceId]/events/route';

function makeReq(url: string, init?: RequestInit, cookies?: Record<string, string>) {
  const headers = new Headers(init?.headers as any);

  // Add cookie header if cookies provided
  if (cookies) {
    const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    headers.set('cookie', cookieStr);
  }

  const body = init?.body as any;
  const method = (init?.method || 'GET') as any;
  const req = new Request(url, { headers, method, body });
  return new NextRequest(req);
}

describe('Events Backend Endpoints', () => {
  beforeEach(() => {
    resetCollections();

    // Seed users
    const now = new Date();
    getCollection('users').doc('u1').set({
      fullName: 'Leader User',
      email: 'u1@buffalo.edu',
      role: 'student',
      campusId: 'ub-buffalo',
      createdAt: { toDate: () => now },
      isAdmin: false
    });
    getCollection('users').doc('u2').set({
      fullName: 'Member User',
      email: 'u2@buffalo.edu',
      role: 'student',
      campusId: 'ub-buffalo',
      createdAt: { toDate: () => now },
      isAdmin: false
    });

    // Seed a space
    getCollection('spaces').doc('space1').set({
      name: 'Test Space',
      description: 'A test space',
      category: 'student_org',
      campusId: 'ub-buffalo',
      isPublic: true,
      createdAt: { toDate: () => now },
      updatedAt: { toDate: () => now },
      memberCount: 2
    });

    // Seed memberships using composite key format
    getCollection('spaceMembers').doc('space1_u1').set({
      spaceId: 'space1',
      userId: 'u1',
      role: 'owner',
      joinedAt: { toDate: () => now },
      campusId: 'ub-buffalo'
    });
    getCollection('spaceMembers').doc('space1_u2').set({
      spaceId: 'space1',
      userId: 'u2',
      role: 'member',
      joinedAt: { toDate: () => now },
      campusId: 'ub-buffalo'
    });

    // Seed profiles for ghost mode checks
    getCollection('profiles').doc('u1').set({
      userId: 'u1',
      displayName: 'Leader User',
      campusId: 'ub-buffalo',
      ghostMode: { enabled: false }
    });
  });

  describe('GET /api/spaces/[spaceId]/events', () => {
    it('returns empty list when no events exist', async () => {
      const res = await EventsRoute.GET(
        makeReq('http://localhost/api/spaces/space1/events', {}, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.events).toEqual([]);
      expect(json.data.hasMore).toBe(false);
    });

    it('returns upcoming events sorted by date', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Seed events
      getCollection('events').doc('event1').set({
        title: 'Tomorrow Event',
        description: 'Happening tomorrow',
        type: 'social',
        spaceId: 'space1',
        campusId: 'ub-buffalo',
        organizerId: 'u1',
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        status: 'scheduled',
        isHidden: false
      });
      getCollection('events').doc('event2').set({
        title: 'Next Week Event',
        description: 'Happening next week',
        type: 'academic',
        spaceId: 'space1',
        campusId: 'ub-buffalo',
        organizerId: 'u1',
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000),
        status: 'scheduled',
        isHidden: false
      });

      const res = await EventsRoute.GET(
        makeReq('http://localhost/api/spaces/space1/events?upcoming=true', {}, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.events.length).toBe(2);
    });

    it('includes imported events that only have startAt/endAt fields', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      getCollection('events').doc('imported-startAt').set({
        title: 'Imported RSS Event',
        description: 'CampusLabs imported event',
        type: 'social',
        spaceId: 'space1',
        campusId: 'ub-buffalo',
        organizerId: 'u1',
        startAt: { toDate: () => tomorrow },
        endAt: { toDate: () => new Date(tomorrow.getTime() + 60 * 60 * 1000) },
        source: { platform: 'campuslabs' },
        isHidden: false,
      });

      const res = await EventsRoute.GET(
        makeReq('http://localhost/api/spaces/space1/events?upcoming=true', {}, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.events.length).toBe(1);
      expect(json.data.events[0].title).toBe('Imported RSS Event');
    });

    it('filters hidden events from results', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      getCollection('events').doc('visible').set({
        title: 'Visible Event',
        description: 'This is visible',
        type: 'social',
        spaceId: 'space1',
        campusId: 'ub-buffalo',
        organizerId: 'u1',
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        status: 'scheduled',
        isHidden: false
      });
      getCollection('events').doc('hidden').set({
        title: 'Hidden Event',
        description: 'This is hidden',
        type: 'social',
        spaceId: 'space1',
        campusId: 'ub-buffalo',
        organizerId: 'u1',
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        status: 'scheduled',
        isHidden: true
      });

      const res = await EventsRoute.GET(
        makeReq('http://localhost/api/spaces/space1/events', {}, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.events.length).toBe(1);
      expect(json.data.events[0].title).toBe('Visible Event');
    });

    it('filters events from other campuses', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      getCollection('events').doc('same-campus').set({
        title: 'Same Campus Event',
        type: 'social',
        spaceId: 'space1',
        campusId: 'ub-buffalo',
        organizerId: 'u1',
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        isHidden: false
      });
      getCollection('events').doc('other-campus').set({
        title: 'Other Campus Event',
        type: 'social',
        spaceId: 'space1',
        campusId: 'other-campus',
        organizerId: 'u1',
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        isHidden: false
      });

      const res = await EventsRoute.GET(
        makeReq('http://localhost/api/spaces/space1/events', {}, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.events.length).toBe(1);
      expect(json.data.events[0].title).toBe('Same Campus Event');
    });

    it('returns 404 for non-existent space', async () => {
      const res = await EventsRoute.GET(
        makeReq('http://localhost/api/spaces/nonexistent/events', {}, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'nonexistent' }) }
      );

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/spaces/[spaceId]/events', () => {
    it('creates event with valid data (leader only)', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const eventData = {
        title: 'New Test Event',
        description: 'A great event for testing',
        type: 'social',
        startDate: tomorrow.toISOString(),
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Student Union',
        tags: ['test', 'social']
      };

      const res = await EventsRoute.POST(
        makeReq('http://localhost/api/spaces/space1/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(eventData)
        }, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.event.title).toBe('New Test Event');
      expect(json.data.event.id).toBeDefined();

      // Should have linked board (from mock)
      expect(json.data.event.linkedBoard).toBeDefined();
      expect(json.data.event.linkedBoard.id).toBe('board_1');
    });

    it('rejects event with end date before start date', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const eventData = {
        title: 'Invalid Event',
        description: 'End date is before start date',
        type: 'social',
        startDate: tomorrow.toISOString(),
        endDate: new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000).toISOString() // Before start
      };

      const res = await EventsRoute.POST(
        makeReq('http://localhost/api/spaces/space1/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(eventData)
        }, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('rejects event with missing required fields', async () => {
      const eventData = {
        title: 'Incomplete Event'
        // Missing: description, type, startDate, endDate
      };

      const res = await EventsRoute.POST(
        makeReq('http://localhost/api/spaces/space1/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(eventData)
        }, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(400);
    });

    it('rejects creation from non-leader member', async () => {
      // Update mock to simulate u2 (member, not leader)
      const { checkSpacePermission } = await import('@/lib/space-permission-middleware');
      (checkSpacePermission as any).mockImplementationOnce(async () => ({
        hasPermission: false,
        code: 'FORBIDDEN',
        error: 'Leaders only can create events'
      }));

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const eventData = {
        title: 'Member Event',
        description: 'Member trying to create',
        type: 'social',
        startDate: tomorrow.toISOString(),
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString()
      };

      const res = await EventsRoute.POST(
        makeReq('http://localhost/api/spaces/space1/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(eventData)
        }, { hive_session: 'test' }),
        { params: Promise.resolve({ spaceId: 'space1' }) }
      );

      expect(res.status).toBe(403);
    });
  });
});
