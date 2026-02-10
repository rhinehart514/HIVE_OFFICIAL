/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/structured-logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { dbAdminMock, adminMock, getCollection, resetCollections } from '../utils/inmemory-firestore';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => ({ dbAdmin: dbAdminMock, isFirebaseConfigured: true }));
vi.mock('firebase-admin', () => adminMock);

import * as CampusEventsRoute from '@/app/api/events/route';

function makeReq(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers as HeadersInit);
  const body = init?.body as BodyInit | null | undefined;
  const method = (init?.method || 'GET') as string;
  const req = new Request(url, { headers, method, body });
  return new NextRequest(req);
}

describe('Campus Events API (/api/events)', () => {
  beforeEach(() => {
    resetCollections();

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextHour = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    getCollection('spaces').doc('space1').set({
      name: 'UB Robotics Club',
      campusId: 'ub-buffalo',
      isPublic: true,
      category: 'student_org',
    });

    getCollection('events').doc('ub-imported').set({
      title: 'Imported UB Event',
      description: 'Comes from RSS import with startAt only',
      type: 'social',
      campusId: 'ub-buffalo',
      spaceId: 'space1',
      organizerId: 'u1',
      startAt: { toDate: () => tomorrow },
      endAt: { toDate: () => nextHour },
      source: { platform: 'campuslabs' },
      isHidden: false,
    });

    getCollection('events').doc('other-campus').set({
      title: 'Other Campus Event',
      type: 'social',
      campusId: 'other-campus',
      spaceId: 'space1',
      organizerId: 'u1',
      startAt: { toDate: () => tomorrow },
      isHidden: false,
    });
  });

  it('returns upcoming space events even when imported docs only have startAt', async () => {
    const res = await CampusEventsRoute.GET(
      makeReq('http://localhost/api/events?spaceId=space1&upcoming=true&limit=10'),
      {}
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.events)).toBe(true);
    expect(json.data.events.length).toBe(1);
    expect(json.data.events[0].id).toBe('ub-imported');
    expect(json.data.events[0].title).toBe('Imported UB Event');
    expect(typeof json.data.events[0].startTime).toBe('string');
  });
});
