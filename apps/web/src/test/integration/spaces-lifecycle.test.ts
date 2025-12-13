/**
 * Spaces Lifecycle Integration Tests
 *
 * Tests the complete lifecycle of a space from creation to deletion,
 * including all major state transitions and membership operations.
 *
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Logger silent
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/structured-logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

// In-memory Firestore Admin + admin FieldValue
import { dbAdminMock, adminMock, getCollection, resetCollections } from '../utils/inmemory-firestore';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => ({ dbAdmin: dbAdminMock }));
vi.mock('firebase-admin', () => adminMock);

// Mock getAuth token verification
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: vi.fn(async (token: string) => {
      if (token.startsWith('dev_token_')) {
        const uid = token.replace('dev_token_', '').split('_')[0];
        return { uid, email: `${uid}@buffalo.edu` } as any;
      }
      throw new Error('Invalid token');
    })
  })
}));

// Mock SSE to be no-op
vi.mock('@/lib/sse-realtime-service', () => ({ sseRealtimeService: { sendMessage: vi.fn(async () => {}) } }));

// Import routes after mocks
import * as SpacesRoot from '@/app/api/spaces/route';
import * as SpacesJoin from '@/app/api/spaces/join/route';
import * as SpacesLeave from '@/app/api/spaces/leave/route';
import * as SpaceDetail from '@/app/api/spaces/[spaceId]/route';
import * as Members from '@/app/api/spaces/[spaceId]/members/route';
import * as MemberId from '@/app/api/spaces/[spaceId]/members/[memberId]/route';
import * as SpacesMy from '@/app/api/spaces/my/route';

const devAuth = (uid: string) => ({ authorization: `Bearer dev_token_${uid}` });

function makeReq(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers as any);
  const body = init?.body as any;
  const method = (init?.method || 'GET') as any;
  const req = new Request(url, { headers, method, body });
  return new NextRequest(req);
}

describe('Spaces Lifecycle', () => {
  const daysAgo = (d: number) => ({ toDate: () => new Date(Date.now() - d * 24 * 60 * 60 * 1000) });

  beforeEach(() => {
    resetCollections();
    // Seed users
    getCollection('users').doc('owner').set({
      fullName: 'Space Owner',
      email: 'owner@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(30),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
    getCollection('users').doc('member1').set({
      fullName: 'Member One',
      email: 'member1@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(20),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
    getCollection('users').doc('member2').set({
      fullName: 'Member Two',
      email: 'member2@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(15),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
    getCollection('users').doc('lurker').set({
      fullName: 'Lurker User',
      email: 'lurker@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(10),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
  });

  describe('Space Creation', () => {
    it('creates a public open space with correct defaults', async () => {
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Computer Science Club',
            description: 'For CS students at UB',
            category: 'student_org',
            joinPolicy: 'open',
            tags: ['cs', 'programming'],
            agreedToGuidelines: true
          })
        }) as any,
        {} as any
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data?.space?.name || json.space?.name).toBe('Computer Science Club');

      // Verify space in Firestore
      const spaces = await getCollection('spaces').get();
      expect(spaces.docs.length).toBe(1);
      const spaceData = spaces.docs[0].data();
      expect(spaceData.name).toBe('Computer Science Club');
      expect(spaceData.joinPolicy).toBe('open');
      expect(spaceData.isVerified).toBe(false);

      // Verify owner membership
      const members = await getCollection('spaceMembers').get();
      expect(members.docs.length).toBe(1);
      expect(members.docs[0].data().role).toBe('owner');
      expect(members.docs[0].data().userId).toBe('owner');
    });

    it('creates a private approval-required space', async () => {
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Executive Board',
            description: 'Private leadership group',
            category: 'student_org',
            joinPolicy: 'approval',
            isPublic: false,
            tags: ['leadership'],
            agreedToGuidelines: true
          })
        }) as any,
        {} as any
      );

      expect(res.status).toBe(201);
      const spaces = await getCollection('spaces').get();
      expect(spaces.docs[0].data().joinPolicy).toBe('approval');
    });

    it('rejects space creation without agreed guidelines', async () => {
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Unauthorized Space',
            description: 'Should fail',
            category: 'student_org',
            joinPolicy: 'open',
            tags: []
            // Missing agreedToGuidelines
          })
        }) as any,
        {} as any
      );

      expect(res.status).toBe(400);
    });
  });

  describe('Membership Lifecycle', () => {
    let spaceId: string;

    beforeEach(async () => {
      // Create a space for membership tests
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Membership Test Space',
            description: 'Testing membership operations',
            category: 'student_org',
            joinPolicy: 'open',
            tags: ['test'],
            agreedToGuidelines: true
          })
        }) as any,
        {} as any
      );
      const json = await res.json();
      spaceId = json.data?.space?.id || json.space?.id;
    });

    it('allows user to join open space', async () => {
      const res = await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId, joinMethod: 'manual' })
        }) as any,
        {} as any
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.membership.role).toBe('member');

      // Verify membership in Firestore
      const members = await getCollection('spaceMembers').get();
      const member1Doc = members.docs.find(d => d.data().userId === 'member1');
      expect(member1Doc).toBeDefined();
      expect(member1Doc?.data().isActive).toBe(true);
    });

    it('idempotent join returns existing membership', async () => {
      // First join
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      // Second join - should return conflict or existing membership
      const res2 = await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      // Should either be 200 (reactivation) or 409 (conflict)
      expect([200, 409]).toContain(res2.status);

      // Should not create duplicate membership
      const members = await getCollection('spaceMembers').get();
      const member1Docs = members.docs.filter(d => d.data().userId === 'member1' && d.data().spaceId === spaceId);
      expect(member1Docs.length).toBeLessThanOrEqual(1);
    });

    it('allows user to leave space', async () => {
      // Join first
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      // Leave
      const res = await SpacesLeave.POST(
        makeReq('http://localhost/api/spaces/leave', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      expect(res.status).toBe(200);

      // Verify membership is inactive
      const members = await getCollection('spaceMembers').get();
      const member1Doc = members.docs.find(d => d.data().userId === 'member1');
      // Either deleted or marked inactive
      if (member1Doc) {
        expect(member1Doc.data().isActive).toBe(false);
      }
    });

    it('prevents owner from leaving as last owner', async () => {
      const res = await SpacesLeave.POST(
        makeReq('http://localhost/api/spaces/leave', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      // Should fail because owner is the only owner
      expect(res.status).toBe(409);
    });

    it('allows rejoin after leaving (reactivation)', async () => {
      // Join
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      // Leave
      await SpacesLeave.POST(
        makeReq('http://localhost/api/spaces/leave', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      // Rejoin
      const res = await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      // Should indicate reactivation if previously left
      expect(json.success).toBe(true);
    });
  });

  describe('Space Discovery', () => {
    beforeEach(async () => {
      // Create multiple spaces for discovery tests
      await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Public Club A',
            description: 'A public club',
            category: 'student_org',
            joinPolicy: 'open',
            tags: ['public'],
            agreedToGuidelines: true
          })
        }) as any,
        {} as any
      );

      await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Public Club B',
            description: 'Another public club',
            category: 'student_org',
            joinPolicy: 'open',
            tags: ['public'],
            agreedToGuidelines: true
          })
        }) as any,
        {} as any
      );
    });

    it('lists user spaces via /my endpoint', async () => {
      const res = await SpacesMy.GET(
        makeReq('http://localhost/api/spaces/my', {
          headers: devAuth('owner')
        }) as any,
        {} as any
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.spaces.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Role Management', () => {
    let spaceId: string;

    beforeEach(async () => {
      // Create space
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Role Test Space',
            description: 'Testing role management',
            category: 'student_org',
            joinPolicy: 'open',
            tags: [],
            agreedToGuidelines: true
          })
        }) as any,
        {} as any
      );
      const json = await res.json();
      spaceId = json.data?.space?.id || json.space?.id;

      // Add member1
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      // Add member2
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member2'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );
    });

    it('owner can promote member to moderator', async () => {
      const res = await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/member1`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'moderator' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'member1' }) } as any
      );

      expect(res.status).toBe(200);

      // Verify role change
      const members = await getCollection('spaceMembers').get();
      const member1Doc = members.docs.find(d => d.data().userId === 'member1');
      expect(member1Doc?.data().role).toBe('moderator');
    });

    it('owner can promote member to admin', async () => {
      const res = await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/member1`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'admin' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'member1' }) } as any
      );

      expect(res.status).toBe(200);
    });

    it('member cannot promote other members', async () => {
      const res = await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/member2`, {
          method: 'PATCH',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'moderator' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'member2' }) } as any
      );

      expect(res.status).toBe(403);
    });

    it('owner can remove member', async () => {
      const res = await MemberId.DELETE(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/member1`, {
          method: 'DELETE',
          headers: devAuth('owner')
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'member1' }) } as any
      );

      expect(res.status).toBe(200);
    });

    it('member cannot remove other members', async () => {
      const res = await MemberId.DELETE(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/member2`, {
          method: 'DELETE',
          headers: devAuth('member1')
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'member2' }) } as any
      );

      expect(res.status).toBe(403);
    });
  });

  describe('Space Updates', () => {
    let spaceId: string;

    beforeEach(async () => {
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Update Test Space',
            description: 'Original description',
            category: 'student_org',
            joinPolicy: 'open',
            tags: ['original'],
            agreedToGuidelines: true
          })
        }) as any,
        {} as any
      );
      const json = await res.json();
      spaceId = json.data?.space?.id || json.space?.id;
    });

    it('owner can update space description', async () => {
      const res = await SpaceDetail.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ description: 'Updated description' })
        }) as any,
        { params: Promise.resolve({ spaceId }) } as any
      );

      expect(res.status).toBe(200);

      // Verify update
      const spaces = await getCollection('spaces').get();
      const space = spaces.docs.find(d => d.id === spaceId);
      expect(space?.data().description).toBe('Updated description');
    });

    it('owner can update space name', async () => {
      const res = await SpaceDetail.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'Renamed Space' })
        }) as any,
        { params: Promise.resolve({ spaceId }) } as any
      );

      expect(res.status).toBe(200);
    });

    it('non-owner cannot update space', async () => {
      // Join first
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );

      const res = await SpaceDetail.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}`, {
          method: 'PATCH',
          headers: { ...devAuth('member1'), 'content-type': 'application/json' },
          body: JSON.stringify({ description: 'Hacked!' })
        }) as any,
        { params: Promise.resolve({ spaceId }) } as any
      );

      expect(res.status).toBe(403);
    });
  });
});
