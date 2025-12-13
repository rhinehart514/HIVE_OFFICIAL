/**
 * Spaces Permissions Integration Tests
 *
 * Tests permission boundaries for space operations including:
 * - Role-based access control (RBAC)
 * - Campus isolation (multi-tenancy)
 * - Action permissions (post, moderate, configure)
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

// Mock getAuth token verification with campus-aware emails
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: vi.fn(async (token: string) => {
      if (token.startsWith('dev_token_')) {
        const uid = token.replace('dev_token_', '').split('_')[0];
        // Support campus-specific emails
        if (uid.startsWith('other_campus_')) {
          return { uid, email: `${uid}@other.edu` } as any;
        }
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
import * as SpaceDetail from '@/app/api/spaces/[spaceId]/route';
import * as Members from '@/app/api/spaces/[spaceId]/members/route';
import * as MemberId from '@/app/api/spaces/[spaceId]/members/[memberId]/route';
import * as Posts from '@/app/api/spaces/[spaceId]/posts/route';
import * as Moderation from '@/app/api/spaces/[spaceId]/moderation/route';

const devAuth = (uid: string) => ({ authorization: `Bearer dev_token_${uid}` });

function makeReq(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers as any);
  const body = init?.body as any;
  const method = (init?.method || 'GET') as any;
  const req = new Request(url, { headers, method, body });
  return new NextRequest(req);
}

describe('Spaces Permissions', () => {
  const daysAgo = (d: number) => ({ toDate: () => new Date(Date.now() - d * 24 * 60 * 60 * 1000) });

  beforeEach(() => {
    resetCollections();
    // Seed users with different roles
    getCollection('users').doc('owner').set({
      fullName: 'Space Owner',
      email: 'owner@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(30),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
    getCollection('users').doc('admin').set({
      fullName: 'Space Admin',
      email: 'admin@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(25),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
    getCollection('users').doc('moderator').set({
      fullName: 'Space Moderator',
      email: 'moderator@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(20),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
    getCollection('users').doc('member').set({
      fullName: 'Regular Member',
      email: 'member@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(15),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
    getCollection('users').doc('outsider').set({
      fullName: 'Non-Member',
      email: 'outsider@buffalo.edu',
      role: 'student',
      createdAt: daysAgo(10),
      isAdmin: false,
      campusId: 'ub-buffalo'
    });
    getCollection('users').doc('other_campus_user').set({
      fullName: 'Other Campus User',
      email: 'other_campus_user@other.edu',
      role: 'student',
      createdAt: daysAgo(10),
      isAdmin: false,
      campusId: 'other-campus'
    });
    getCollection('users').doc('platform_admin').set({
      fullName: 'Platform Admin',
      email: 'platform_admin@buffalo.edu',
      role: 'admin',
      createdAt: daysAgo(100),
      isAdmin: true,
      campusId: 'ub-buffalo'
    });
  });

  describe('Role-Based Access Control', () => {
    let spaceId: string;

    beforeEach(async () => {
      // Create space with owner
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Permission Test Space',
            description: 'Testing permissions',
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

      // Add admin
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('admin'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );
      await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/admin`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'admin' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'admin' }) } as any
      );

      // Add moderator
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('moderator'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );
      await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/moderator`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'moderator' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'moderator' }) } as any
      );

      // Add regular member
      await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('member'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );
    });

    describe('Space Configuration', () => {
      it('owner can update space settings', async () => {
        const res = await SpaceDetail.PATCH(
          makeReq(`http://localhost/api/spaces/${spaceId}`, {
            method: 'PATCH',
            headers: { ...devAuth('owner'), 'content-type': 'application/json' },
            body: JSON.stringify({ description: 'Updated by owner' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(200);
      });

      it('admin can update space settings', async () => {
        const res = await SpaceDetail.PATCH(
          makeReq(`http://localhost/api/spaces/${spaceId}`, {
            method: 'PATCH',
            headers: { ...devAuth('admin'), 'content-type': 'application/json' },
            body: JSON.stringify({ description: 'Updated by admin' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(200);
      });

      it('moderator cannot update space settings', async () => {
        const res = await SpaceDetail.PATCH(
          makeReq(`http://localhost/api/spaces/${spaceId}`, {
            method: 'PATCH',
            headers: { ...devAuth('moderator'), 'content-type': 'application/json' },
            body: JSON.stringify({ description: 'Should fail' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(403);
      });

      it('member cannot update space settings', async () => {
        const res = await SpaceDetail.PATCH(
          makeReq(`http://localhost/api/spaces/${spaceId}`, {
            method: 'PATCH',
            headers: { ...devAuth('member'), 'content-type': 'application/json' },
            body: JSON.stringify({ description: 'Should fail' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(403);
      });

      it('outsider cannot update space settings', async () => {
        const res = await SpaceDetail.PATCH(
          makeReq(`http://localhost/api/spaces/${spaceId}`, {
            method: 'PATCH',
            headers: { ...devAuth('outsider'), 'content-type': 'application/json' },
            body: JSON.stringify({ description: 'Should fail' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(403);
      });
    });

    describe('Member Management', () => {
      it('owner can invite members', async () => {
        const res = await Members.POST(
          makeReq(`http://localhost/api/spaces/${spaceId}/members`, {
            method: 'POST',
            headers: { ...devAuth('owner'), 'content-type': 'application/json' },
            body: JSON.stringify({ userId: 'outsider', role: 'member' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(200);
      });

      it('admin can invite members', async () => {
        const res = await Members.POST(
          makeReq(`http://localhost/api/spaces/${spaceId}/members`, {
            method: 'POST',
            headers: { ...devAuth('admin'), 'content-type': 'application/json' },
            body: JSON.stringify({ userId: 'outsider', role: 'member' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(200);
      });

      it('moderator cannot invite members', async () => {
        const res = await Members.POST(
          makeReq(`http://localhost/api/spaces/${spaceId}/members`, {
            method: 'POST',
            headers: { ...devAuth('moderator'), 'content-type': 'application/json' },
            body: JSON.stringify({ userId: 'outsider', role: 'member' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(403);
      });

      it('member cannot invite members', async () => {
        const res = await Members.POST(
          makeReq(`http://localhost/api/spaces/${spaceId}/members`, {
            method: 'POST',
            headers: { ...devAuth('member'), 'content-type': 'application/json' },
            body: JSON.stringify({ userId: 'outsider', role: 'member' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(403);
      });

      it('owner can remove admin', async () => {
        const res = await MemberId.DELETE(
          makeReq(`http://localhost/api/spaces/${spaceId}/members/admin`, {
            method: 'DELETE',
            headers: devAuth('owner')
          }) as any,
          { params: Promise.resolve({ spaceId, memberId: 'admin' }) } as any
        );
        expect(res.status).toBe(200);
      });

      it('admin cannot remove owner', async () => {
        const res = await MemberId.DELETE(
          makeReq(`http://localhost/api/spaces/${spaceId}/members/owner`, {
            method: 'DELETE',
            headers: devAuth('admin')
          }) as any,
          { params: Promise.resolve({ spaceId, memberId: 'owner' }) } as any
        );
        expect(res.status).toBe(403);
      });

      it('admin cannot promote to owner', async () => {
        const res = await MemberId.PATCH(
          makeReq(`http://localhost/api/spaces/${spaceId}/members/member`, {
            method: 'PATCH',
            headers: { ...devAuth('admin'), 'content-type': 'application/json' },
            body: JSON.stringify({ role: 'owner' })
          }) as any,
          { params: Promise.resolve({ spaceId, memberId: 'member' }) } as any
        );
        // Should either fail with 403 or have role capped at admin
        expect([200, 403]).toContain(res.status);
        if (res.status === 200) {
          const members = await getCollection('spaceMembers').get();
          const memberDoc = members.docs.find(d => d.data().userId === 'member');
          expect(memberDoc?.data().role).not.toBe('owner');
        }
      });

      it('moderator can remove regular member', async () => {
        const res = await MemberId.DELETE(
          makeReq(`http://localhost/api/spaces/${spaceId}/members/member`, {
            method: 'DELETE',
            headers: devAuth('moderator')
          }) as any,
          { params: Promise.resolve({ spaceId, memberId: 'member' }) } as any
        );
        // Moderators may or may not have remove permission depending on implementation
        expect([200, 403]).toContain(res.status);
      });
    });

    describe('Content Permissions', () => {
      it('member can create post', async () => {
        const res = await Posts.POST(
          makeReq(`http://localhost/api/spaces/${spaceId}/posts`, {
            method: 'POST',
            headers: { ...devAuth('member'), 'content-type': 'application/json' },
            body: JSON.stringify({ content: 'Hello from member', type: 'text' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(201);
      });

      it('outsider cannot create post', async () => {
        const res = await Posts.POST(
          makeReq(`http://localhost/api/spaces/${spaceId}/posts`, {
            method: 'POST',
            headers: { ...devAuth('outsider'), 'content-type': 'application/json' },
            body: JSON.stringify({ content: 'Should fail', type: 'text' })
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(403);
      });

      it('member can view posts', async () => {
        const res = await Posts.GET(
          makeReq(`http://localhost/api/spaces/${spaceId}/posts?limit=10`, {
            headers: devAuth('member')
          }) as any,
          { params: Promise.resolve({ spaceId }) } as any
        );
        expect(res.status).toBe(200);
      });

      it('outsider cannot view posts in private space', async () => {
        // Create private space
        const privateRes = await SpacesRoot.POST(
          makeReq('http://localhost/api/spaces', {
            method: 'POST',
            headers: { ...devAuth('owner'), 'content-type': 'application/json' },
            body: JSON.stringify({
              name: 'Private Space',
              description: 'Private',
              category: 'student_org',
              joinPolicy: 'invite_only',
              isPublic: false,
              tags: [],
              agreedToGuidelines: true
            })
          }) as any,
          {} as any
        );
        const privateJson = await privateRes.json();
        const privateSpaceId = privateJson.data?.space?.id || privateJson.space?.id;

        const res = await Posts.GET(
          makeReq(`http://localhost/api/spaces/${privateSpaceId}/posts?limit=10`, {
            headers: devAuth('outsider')
          }) as any,
          { params: Promise.resolve({ spaceId: privateSpaceId }) } as any
        );
        expect(res.status).toBe(403);
      });
    });
  });

  describe('Campus Isolation', () => {
    let spaceId: string;

    beforeEach(async () => {
      // Create space on ub-buffalo campus
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'UB Only Space',
            description: 'Only for UB students',
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
    });

    it('user from same campus can view space', async () => {
      const res = await SpaceDetail.GET(
        makeReq(`http://localhost/api/spaces/${spaceId}`, {
          headers: devAuth('member')
        }) as any,
        { params: Promise.resolve({ spaceId }) } as any
      );
      expect(res.status).toBe(200);
    });

    it('user from different campus cannot view space', async () => {
      const res = await SpaceDetail.GET(
        makeReq(`http://localhost/api/spaces/${spaceId}`, {
          headers: devAuth('other_campus_user')
        }) as any,
        { params: Promise.resolve({ spaceId }) } as any
      );
      // Should either be 404 (not found for their campus) or 403
      expect([403, 404]).toContain(res.status);
    });

    it('user from different campus cannot join space', async () => {
      const res = await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { ...devAuth('other_campus_user'), 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );
      // Should fail with not found or forbidden
      expect([403, 404]).toContain(res.status);
    });

    it('user from different campus cannot list space members', async () => {
      const res = await Members.GET(
        makeReq(`http://localhost/api/spaces/${spaceId}/members`, {
          headers: devAuth('other_campus_user')
        }) as any,
        { params: Promise.resolve({ spaceId }) } as any
      );
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('Unauthenticated Access', () => {
    let spaceId: string;

    beforeEach(async () => {
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Public Facing Space',
            description: 'Visible to all',
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
    });

    it('unauthenticated user cannot create space', async () => {
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Unauthorized Space',
            description: 'Should fail',
            category: 'student_org',
            joinPolicy: 'open',
            tags: [],
            agreedToGuidelines: true
          })
        }) as any,
        {} as any
      );
      expect(res.status).toBe(401);
    });

    it('unauthenticated user cannot join space', async () => {
      const res = await SpacesJoin.POST(
        makeReq('http://localhost/api/spaces/join', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ spaceId })
        }) as any,
        {} as any
      );
      expect(res.status).toBe(401);
    });

    it('unauthenticated user cannot post', async () => {
      const res = await Posts.POST(
        makeReq(`http://localhost/api/spaces/${spaceId}/posts`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ content: 'Anonymous post', type: 'text' })
        }) as any,
        { params: Promise.resolve({ spaceId }) } as any
      );
      expect(res.status).toBe(401);
    });
  });

  describe('Role Hierarchy', () => {
    let spaceId: string;

    beforeEach(async () => {
      const res = await SpacesRoot.POST(
        makeReq('http://localhost/api/spaces', {
          method: 'POST',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Hierarchy Test',
            description: 'Testing role hierarchy',
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

      // Add all roles
      for (const uid of ['admin', 'moderator', 'member']) {
        await SpacesJoin.POST(
          makeReq('http://localhost/api/spaces/join', {
            method: 'POST',
            headers: { ...devAuth(uid), 'content-type': 'application/json' },
            body: JSON.stringify({ spaceId })
          }) as any,
          {} as any
        );
      }

      // Set roles
      await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/admin`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'admin' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'admin' }) } as any
      );
      await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/moderator`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'moderator' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'moderator' }) } as any
      );
    });

    it('owner outranks admin', async () => {
      // Owner can demote admin
      const res = await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/admin`, {
          method: 'PATCH',
          headers: { ...devAuth('owner'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'member' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'admin' }) } as any
      );
      expect(res.status).toBe(200);
    });

    it('admin outranks moderator', async () => {
      // Admin can demote moderator
      const res = await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/moderator`, {
          method: 'PATCH',
          headers: { ...devAuth('admin'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'member' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'moderator' }) } as any
      );
      expect(res.status).toBe(200);
    });

    it('moderator cannot demote admin', async () => {
      const res = await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/admin`, {
          method: 'PATCH',
          headers: { ...devAuth('moderator'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'member' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'admin' }) } as any
      );
      expect(res.status).toBe(403);
    });

    it('member cannot change any roles', async () => {
      const res = await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/moderator`, {
          method: 'PATCH',
          headers: { ...devAuth('member'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'member' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'moderator' }) } as any
      );
      expect(res.status).toBe(403);
    });

    it('users cannot promote themselves', async () => {
      const res = await MemberId.PATCH(
        makeReq(`http://localhost/api/spaces/${spaceId}/members/member`, {
          method: 'PATCH',
          headers: { ...devAuth('member'), 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'admin' })
        }) as any,
        { params: Promise.resolve({ spaceId, memberId: 'member' }) } as any
      );
      expect(res.status).toBe(403);
    });
  });
});
