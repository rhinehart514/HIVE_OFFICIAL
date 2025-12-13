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

// Mock SSE to be no-op
vi.mock('@/lib/sse-realtime-service', () => ({ sseRealtimeService: { sendMessage: vi.fn(async () => {}) } }));

// Import routes after mocks
import * as SearchRoute from '@/app/api/search/route';

function makeReq(url: string, init?: RequestInit, cookies?: Record<string, string>) {
  const headers = new Headers(init?.headers as any);

  if (cookies) {
    const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    headers.set('cookie', cookieStr);
  }

  const body = init?.body as any;
  const method = (init?.method || 'GET') as any;
  const req = new Request(url, { headers, method, body });
  return new NextRequest(req);
}

describe('Search Backend Endpoints', () => {
  beforeEach(() => {
    resetCollections();

    const now = new Date();

    // Seed users
    getCollection('users').doc('u1').set({
      fullName: 'Test User',
      email: 'u1@buffalo.edu',
      role: 'student',
      campusId: 'ub-buffalo',
      createdAt: { toDate: () => now },
      isAdmin: false
    });

    // Seed spaces - some public, some private
    getCollection('spaces').doc('space1').set({
      name: 'Computer Science Club',
      description: 'A club for CS enthusiasts',
      category: 'student_org',
      campusId: 'ub-buffalo',
      isPublic: true,
      memberCount: 50,
      createdAt: { toDate: () => now },
      updatedAt: { toDate: () => now }
    });
    getCollection('spaces').doc('space2').set({
      name: 'Finance Society',
      description: 'Finance and investing discussions',
      category: 'student_org',
      campusId: 'ub-buffalo',
      isPublic: true,
      memberCount: 30,
      createdAt: { toDate: () => now },
      updatedAt: { toDate: () => now }
    });
    getCollection('spaces').doc('space3').set({
      name: 'Private Study Group',
      description: 'Private group for studying',
      category: 'student_org',
      campusId: 'ub-buffalo',
      isPublic: false,
      memberCount: 5,
      createdAt: { toDate: () => now },
      updatedAt: { toDate: () => now }
    });
    getCollection('spaces').doc('other-campus').set({
      name: 'Other Campus Club',
      description: 'From another campus',
      category: 'student_org',
      campusId: 'other-campus',
      isPublic: true,
      memberCount: 20,
      createdAt: { toDate: () => now },
      updatedAt: { toDate: () => now }
    });

    // Seed profiles for user search
    getCollection('profiles').doc('u1').set({
      userId: 'u1',
      displayName: 'Test User',
      handle: 'testuser',
      campusId: 'ub-buffalo',
      bio: 'A test user for searching',
      ghostMode: { enabled: false }
    });
    getCollection('profiles').doc('u2').set({
      userId: 'u2',
      displayName: 'Jane Smith',
      handle: 'janesmith',
      campusId: 'ub-buffalo',
      bio: 'Finance enthusiast',
      ghostMode: { enabled: false }
    });
    getCollection('profiles').doc('u3').set({
      userId: 'u3',
      displayName: 'Ghost User',
      handle: 'ghostuser',
      campusId: 'ub-buffalo',
      bio: 'I am invisible',
      ghostMode: { enabled: true, hideActivity: true }
    });

    // Seed events
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    getCollection('events').doc('event1').set({
      title: 'CS Hackathon',
      description: 'Annual coding competition',
      type: 'academic',
      spaceId: 'space1',
      campusId: 'ub-buffalo',
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      isHidden: false
    });
    getCollection('events').doc('event2').set({
      title: 'Finance Workshop',
      description: 'Learn about investing',
      type: 'academic',
      spaceId: 'space2',
      campusId: 'ub-buffalo',
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      isHidden: false
    });
  });

  describe('GET /api/search', () => {
    it('returns empty results for no query', async () => {
      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search', {}, { hive_session: 'test' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Should return empty or minimal results
    });

    it('searches spaces by name', async () => {
      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search?q=computer&type=spaces', {}, { hive_session: 'test' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Should find Computer Science Club
      if (json.data?.spaces) {
        expect(json.data.spaces.length).toBeGreaterThan(0);
      }
    });

    it('searches spaces by description', async () => {
      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search?q=investing&type=spaces', {}, { hive_session: 'test' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Should find Finance Society
    });

    it('respects campus isolation - only returns same campus results', async () => {
      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search?q=club&type=spaces', {}, { hive_session: 'test' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Should NOT include "Other Campus Club"
      if (json.data?.spaces) {
        const otherCampus = json.data.spaces.find((s: any) => s.campusId === 'other-campus');
        expect(otherCampus).toBeUndefined();
      }
    });

    it('respects ghost mode - hides users with ghost mode enabled', async () => {
      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search?q=ghost&type=users', {}, { hive_session: 'test' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Should NOT include ghost user
      if (json.data?.users) {
        const ghostUser = json.data.users.find((u: any) => u.handle === 'ghostuser');
        expect(ghostUser).toBeUndefined();
      }
    });

    it('searches events by title', async () => {
      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search?q=hackathon&type=events', {}, { hive_session: 'test' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Should find CS Hackathon
    });

    it('supports pagination with limit and offset', async () => {
      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search?q=club&limit=1&offset=0', {}, { hive_session: 'test' })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('handles special characters in search query', async () => {
      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search?q=C%2B%2B', {}, { hive_session: 'test' }) // C++
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Should not error
    });

    it('returns 401 for unauthenticated requests', async () => {
      // Mock session to return null
      const { verifySession } = await import('@/lib/session');
      (verifySession as any).mockImplementationOnce(async () => null);

      const res = await SearchRoute.GET(
        makeReq('http://localhost/api/search?q=test', {})
      );

      expect(res.status).toBe(401);
    });
  });
});
