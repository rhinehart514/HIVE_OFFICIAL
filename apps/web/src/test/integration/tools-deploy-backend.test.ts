import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Silence loggers FIRST
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/structured-logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

// Mock firebase-admin/auth for token verification
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: async (token: string) => {
      if (token.startsWith('dev_token_')) {
        const uid = token.replace('dev_token_', '').split('_')[0];
        // Use buffalo.edu email to match 'ub-buffalo' campus
        return { uid, email: `${uid}@buffalo.edu` };
      }
      throw new Error('Invalid token');
    }
  })
}));

// server-only shim
vi.mock('server-only', () => ({}));

// Mock notification service
vi.mock('@/lib/notification-service', () => ({
  notifyToolDeployment: vi.fn().mockResolvedValue(undefined),
}));

// Mock tool element validation
vi.mock('@hive/core/domain/creation/validate-tool-elements', () => ({
  validateToolElements: vi.fn().mockReturnValue({
    valid: true,
    errors: [],
    warnings: [],
    blockedElements: [],
    missingCapabilities: [],
    incompatibleElements: [],
    suggestedFixes: [],
  }),
}));

// In-memory Firestore Admin - import AFTER mocks are set up
import { dbAdminMock, adminMock, getCollection, resetCollections } from '../utils/inmemory-firestore';
vi.mock('@/lib/firebase-admin', () => ({ dbAdmin: dbAdminMock }));
vi.mock('firebase-admin', () => adminMock);

// Import route LAST, after all mocks
import * as DeployRoute from '@/app/api/tools/deploy/route';

const devAuth = (uid: string) => ({ authorization: `Bearer dev_token_${uid}` });

function makeReq(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers as any);
  // Add origin header to satisfy CSRF check in tests
  if (!headers.has('origin')) {
    const parsed = new URL(url);
    headers.set('origin', parsed.origin);
  }
  if (!headers.has('host')) {
    const parsed = new URL(url);
    headers.set('host', parsed.host);
  }
  const body = init?.body as any;
  const method = (init?.method || 'GET') as any;
  const req = new Request(url, { headers, method, body });
  return new NextRequest(req);
}

describe('Tools Deploy Backend', () => {
  beforeEach(() => {
    resetCollections();
    // Seed a user and a tool
    // Note: Use 'ub-buffalo' to match the auth middleware campus derived from buffalo.edu email
    getCollection('users').doc('test-user-id').set({ email: 'test@buffalo.edu' });
    getCollection('tools').doc('t1').set({ name: 'Poll Maker', ownerId: 'test-user-id', status: 'published', campusId: 'ub-buffalo', currentVersion: '1.0.0', elements: [] });
  });

  it('deploys a tool to profile', async () => {
    const body = { toolId: 't1', deployTo: 'profile', targetId: 'test-user-id', permissions: { canInteract: true, canView: true, canEdit: false }, settings: { showInDirectory: true, allowSharing: true, collectAnalytics: true, notifyOnInteraction: false } } as any;
    const res = await DeployRoute.POST(
      makeReq('http://localhost/api/tools/deploy', { method: 'POST', headers: { ...devAuth('test-user-id'), 'content-type': 'application/json' }, body: JSON.stringify(body) }) as any
    );
    // Route returns 201 Created for successful deployment
    expect(res.status).toBe(201);
  });

  it('rejects deployment when tool not found', async () => {
    const body = { toolId: 'nope', deployTo: 'profile', targetId: 'test-user-id', permissions: { canInteract: true, canView: true, canEdit: false }, settings: { showInDirectory: true, allowSharing: true, collectAnalytics: true, notifyOnInteraction: false } } as any;
    const res = await DeployRoute.POST(
      makeReq('http://localhost/api/tools/deploy', { method: 'POST', headers: { ...devAuth('test-user-id'), 'content-type': 'application/json' }, body: JSON.stringify(body) }) as any
    );
    expect(res.status).toBe(404);
  });
});
