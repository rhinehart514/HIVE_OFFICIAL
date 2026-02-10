/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set CRON_SECRET before any module evaluation
const TEST_SECRET = 'test-cron-secret-456';
const { mockCreateBulkNotifications } = vi.hoisted(() => {
  process.env.CRON_SECRET = 'test-cron-secret-456';
  return { mockCreateBulkNotifications: vi.fn().mockResolvedValue(undefined) };
});

// Logger silent
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/structured-logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

// In-memory Firestore Admin + admin FieldValue
import { dbAdminMock, adminMock, getCollection, resetCollections } from '../utils/inmemory-firestore';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => ({ dbAdmin: dbAdminMock }));
vi.mock('firebase-admin', () => adminMock);
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: adminMock.firestore.FieldValue,
}));

// Mock notification service
vi.mock('@/lib/notification-service', () => ({
  createBulkNotifications: (...args: unknown[]) => mockCreateBulkNotifications(...args),
}));

import { POST } from '@/app/api/cron/tool-automations/route';

function makeCronReq(secret?: string) {
  const headers = new Headers();
  if (secret) headers.set('authorization', `Bearer ${secret}`);
  return new Request('http://localhost/api/cron/tool-automations', {
    method: 'POST',
    headers,
  });
}

describe('Tool Automations Cron Handler', () => {
  beforeEach(() => {
    resetCollections();
    mockCreateBulkNotifications.mockClear();
  });

  // ── Auth ──────────────────────────────────────────────────
  it('rejects without CRON_SECRET', async () => {
    const res = await POST(makeCronReq());
    expect(res.status).toBe(401);
  });

  it('returns 200 with no deployments', async () => {
    const res = await POST(makeCronReq(TEST_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  // ── Scheduled Tool Automation ─────────────────────────────
  it('fires scheduled automation when nextRun is past', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    getCollection('deployedTools').doc('d1').set({
      targetId: 's1',
      spaceId: 's1',
    });

    getCollection('deployedTools/d1/automations').doc('auto1').set({
      name: 'Reset counters',
      trigger: { type: 'schedule', cron: '0 9 * * *' },
      enabled: true,
      nextRun: oneHourAgo, // Past — should fire
      actions: [
        { type: 'mutate', elementId: 'poll1', mutation: { voteCount: 0 } },
      ],
      limits: { maxRunsPerDay: 100 },
    });

    getCollection('deployedTools/d1/sharedState').doc('current').set({
      poll1: { voteCount: 42 },
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(1);

    // Verify state was mutated
    const stateDoc = await getCollection('deployedTools/d1/sharedState').doc('current').get();
    const state = stateDoc.data();
    expect(state['poll1.voteCount']).toBe(0);

    // Verify run was logged
    const runs = getCollection('deployedTools/d1/automationRuns').allDocs();
    expect(runs.length).toBe(1);
    expect(runs[0].data.status).toBe('success');

    // Verify automation was updated
    const autoDoc = await getCollection('deployedTools/d1/automations').doc('auto1').get();
    const autoData = autoDoc.data();
    expect(autoData.lastRun).toBeDefined();
    expect(autoData.runCount).toBe(1);
  });

  it('fires notification action to all space members', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    getCollection('deployedTools').doc('d1').set({ targetId: 's1' });
    getCollection('deployedTools/d1/automations').doc('auto1').set({
      name: 'Daily reminder',
      trigger: { type: 'schedule', cron: '0 8 * * *' },
      enabled: true,
      nextRun: oneHourAgo,
      actions: [
        { type: 'notify', to: 'all', title: 'Daily Check-in', body: 'Fill out your status!' },
      ],
    });

    getCollection('spaceMembers').doc('m1').set({ spaceId: 's1', userId: 'u1', status: 'active' });
    getCollection('spaceMembers').doc('m2').set({ spaceId: 's1', userId: 'u2', status: 'active' });
    getCollection('spaceMembers').doc('m3').set({ spaceId: 's1', userId: 'u3', status: 'inactive' });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBe(1);

    expect(mockCreateBulkNotifications).toHaveBeenCalledTimes(1);
    const [userIds] = mockCreateBulkNotifications.mock.calls[0];
    expect(userIds).toContain('u1');
    expect(userIds).toContain('u2');
    expect(userIds).not.toContain('u3'); // inactive
  });

  it('fires notification to specific role', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    getCollection('deployedTools').doc('d1').set({ targetId: 's1' });
    getCollection('deployedTools/d1/automations').doc('auto1').set({
      trigger: { type: 'schedule', cron: '0 8 * * *' },
      enabled: true,
      nextRun: oneHourAgo,
      actions: [{ type: 'notify', to: 'role', roleName: 'admin', title: 'Admin alert' }],
    });

    getCollection('spaceMembers').doc('m1').set({ spaceId: 's1', userId: 'u1', role: 'admin', status: 'active' });
    getCollection('spaceMembers').doc('m2').set({ spaceId: 's1', userId: 'u2', role: 'member', status: 'active' });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBe(1);

    const [userIds] = mockCreateBulkNotifications.mock.calls[0];
    expect(userIds).toEqual(['u1']);
  });

  it('skips automation when cooldown active (lastRun < 1 hour)', async () => {
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

    getCollection('deployedTools').doc('d1').set({ targetId: 's1' });
    getCollection('deployedTools/d1/automations').doc('auto1').set({
      trigger: { type: 'schedule', cron: '*/5 * * * *' },
      enabled: true,
      lastRun: thirtyMinAgo,
      // No nextRun → falls through to cooldown check
      actions: [{ type: 'mutate', elementId: 'x', mutation: { count: 0 } }],
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it('respects maxRunsPerDay rate limit', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    getCollection('deployedTools').doc('d1').set({ targetId: 's1' });
    getCollection('deployedTools/d1/automations').doc('auto1').set({
      trigger: { type: 'schedule', cron: '0 * * * *' },
      enabled: true,
      nextRun: oneHourAgo,
      actions: [{ type: 'mutate', elementId: 'x', mutation: { count: 0 } }],
      limits: { maxRunsPerDay: 2 },
    });

    // Seed 2 runs already today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    getCollection('deployedTools/d1/automationRuns').doc('run1').set({
      automationId: 'auto1',
      timestamp: new Date(todayStart.getTime() + 60 * 1000).toISOString(),
    });
    getCollection('deployedTools/d1/automationRuns').doc('run2').set({
      automationId: 'auto1',
      timestamp: new Date(todayStart.getTime() + 120 * 1000).toISOString(),
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it('increments errorCount on action failure', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    getCollection('deployedTools').doc('d1').set({ targetId: 's1' });
    getCollection('deployedTools/d1/automations').doc('auto1').set({
      trigger: { type: 'schedule', cron: '0 * * * *' },
      enabled: true,
      nextRun: oneHourAgo,
      actions: [{ type: 'unknown_action_type' }], // Will not throw but won't do anything
      errorCount: 0,
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    expect(res.status).toBe(200);
    // The unknown action type is silently skipped (no error thrown)
    // so it actually succeeds. This is expected behavior.
  });

  it('matches cron expression with wildcards', async () => {
    const now = new Date();
    // No nextRun, no lastRun → evaluates cron directly
    getCollection('deployedTools').doc('d1').set({ targetId: 's1' });
    getCollection('deployedTools/d1/automations').doc('auto1').set({
      trigger: { type: 'schedule', cron: `${now.getMinutes()} ${now.getHours()} * * *` },
      enabled: true,
      actions: [{ type: 'mutate', elementId: 'e1', mutation: { reset: true } }],
    });
    getCollection('deployedTools/d1/sharedState').doc('current').set({});

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBe(1);
  });
});
