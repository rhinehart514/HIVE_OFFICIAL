/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set CRON_SECRET before any module evaluation
const TEST_SECRET = 'test-cron-secret-789';
const { mockCreateBulkNotifications } = vi.hoisted(() => {
  process.env.CRON_SECRET = 'test-cron-secret-789';
  return { mockCreateBulkNotifications: vi.fn().mockResolvedValue(undefined) };
});

// Logger silent
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/structured-logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

// In-memory Firestore Admin
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

import { POST } from '@/app/api/cron/setup-orchestration/route';

function makeCronReq(secret?: string) {
  const headers = new Headers();
  if (secret) headers.set('authorization', `Bearer ${secret}`);
  return new Request('http://localhost/api/cron/setup-orchestration', {
    method: 'POST',
    headers,
  });
}

describe('Setup Orchestration Cron Handler', () => {
  beforeEach(() => {
    resetCollections();
    mockCreateBulkNotifications.mockClear();
  });

  // ── Auth ──────────────────────────────────────────────────
  it('rejects without CRON_SECRET', async () => {
    const res = await POST(makeCronReq());
    expect(res.status).toBe(401);
  });

  it('returns 200 with no active deployments', async () => {
    const res = await POST(makeCronReq(TEST_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  // ── Time-Relative Triggers ────────────────────────────────
  it('fires time_relative trigger within 5-minute window', async () => {
    const now = new Date();
    // Reference is 30 minutes from now, offset is -30 → trigger now
    const referenceTime = new Date(now.getTime() + 30 * 60 * 1000);

    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { eventDate: referenceTime.toISOString() },
      orchestrationRules: [
        {
          id: 'rule1',
          name: 'Pre-event visibility',
          trigger: { type: 'time_relative', referenceField: 'eventDate', offsetMinutes: -30 },
          actions: [{ type: 'visibility', targetSlotId: 'slot1', visible: true }],
        },
      ],
      orchestrationState: {},
      tools: [{ slotId: 'slot1', toolId: 't1', deploymentId: 'dep1' }],
    });

    getCollection('placedTools').doc('dep1').set({ visible: false });

    const res = await POST(makeCronReq(TEST_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(1);

    // Verify tool was made visible
    const placed = await getCollection('placedTools').doc('dep1').get();
    expect(placed.data().visible).toBe(true);

    // Verify orchestration state was updated
    const sd = await getCollection('setupDeployments').doc('sd1').get();
    const state = sd.data().orchestrationState || {};
    expect(state.lastTriggered?.rule1).toBeDefined();
  });

  it('skips time_relative trigger outside 5-minute window', async () => {
    const now = new Date();
    // Reference 2 hours from now, offset -30 → trigger in 90 minutes (too far)
    const referenceTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { eventDate: referenceTime.toISOString() },
      orchestrationRules: [
        {
          id: 'rule1',
          name: 'Too early',
          trigger: { type: 'time_relative', referenceField: 'eventDate', offsetMinutes: -30 },
          actions: [{ type: 'visibility', targetSlotId: 'slot1', visible: true }],
        },
      ],
      orchestrationState: {},
      tools: [],
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it('respects runOnce — does not re-trigger executed rules', async () => {
    const now = new Date();
    const referenceTime = new Date(now.getTime() + 30 * 60 * 1000);

    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { eventDate: referenceTime.toISOString() },
      orchestrationRules: [
        {
          id: 'rule1',
          name: 'One-time reveal',
          runOnce: true,
          trigger: { type: 'time_relative', referenceField: 'eventDate', offsetMinutes: -30 },
          actions: [{ type: 'state', updates: { revealed: true } }],
        },
      ],
      orchestrationState: { executedRules: ['rule1'] }, // Already executed
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it('enforces 1-hour cooldown on time_relative triggers', async () => {
    const now = new Date();
    const referenceTime = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { eventDate: referenceTime.toISOString() },
      orchestrationRules: [
        {
          id: 'rule1',
          name: 'Repeatable',
          trigger: { type: 'time_relative', referenceField: 'eventDate', offsetMinutes: -30 },
          actions: [{ type: 'state', updates: { pinged: true } }],
        },
      ],
      orchestrationState: { lastTriggered: { rule1: thirtyMinAgo } },
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  // ── Data Condition Triggers ───────────────────────────────
  it('fires data_condition trigger when condition met (eq)', async () => {
    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { phase: 'voting' },
      orchestrationRules: [
        {
          id: 'rule2',
          name: 'Voting phase actions',
          trigger: { type: 'data_condition', dataPath: 'phase', operator: 'eq', value: 'voting' },
          actions: [{ type: 'state', updates: { votingOpen: true } }],
        },
      ],
      orchestrationState: {},
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBe(1);

    const sd = await getCollection('setupDeployments').doc('sd1').get();
    expect(sd.data().sharedData?.votingOpen).toBe(true);
  });

  it('fires data_condition trigger with gt operator', async () => {
    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { signupCount: 25 },
      orchestrationRules: [
        {
          id: 'rule3',
          name: 'Capacity reached',
          trigger: { type: 'data_condition', dataPath: 'signupCount', operator: 'gt', value: 20 },
          actions: [{ type: 'state', updates: { capacityReached: true } }],
        },
      ],
      orchestrationState: {},
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBe(1);
  });

  it('skips data_condition when condition not met', async () => {
    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { signupCount: 5 },
      orchestrationRules: [
        {
          id: 'rule3',
          name: 'Capacity reached',
          trigger: { type: 'data_condition', dataPath: 'signupCount', operator: 'gt', value: 20 },
          actions: [{ type: 'state', updates: { capacityReached: true } }],
        },
      ],
      orchestrationState: {},
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it('sends notification with template interpolation', async () => {
    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { eventName: 'Hackathon 2026', signupCount: 50 },
      orchestrationRules: [
        {
          id: 'rule4',
          name: 'Milestone notification',
          trigger: { type: 'data_condition', dataPath: 'signupCount', operator: 'gte', value: 50 },
          actions: [
            {
              type: 'notification',
              recipients: 'all',
              title: '{eventName} hit {signupCount} signups!',
              body: 'Incredible momentum for {eventName}.',
            },
          ],
        },
      ],
      orchestrationState: {},
    });

    getCollection('spaceMembers').doc('m1').set({ spaceId: 's1', userId: 'u1', isActive: true });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBe(1);

    expect(mockCreateBulkNotifications).toHaveBeenCalledTimes(1);
    const [userIds, notification] = mockCreateBulkNotifications.mock.calls[0];
    expect(userIds).toContain('u1');
    expect(notification.title).toBe('Hackathon 2026 hit 50 signups!');
    expect(notification.body).toContain('Hackathon 2026');
  });

  it('executes data_flow action (copies between shared data fields)', async () => {
    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { source: { value: 42 }, phase: 'ready' },
      orchestrationRules: [
        {
          id: 'rule5',
          name: 'Copy data',
          trigger: { type: 'data_condition', dataPath: 'phase', operator: 'eq', value: 'ready' },
          actions: [{ type: 'data_flow', sourceField: 'source.value', targetField: 'destination.value' }],
        },
      ],
      orchestrationState: {},
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBe(1);

    const sd = await getCollection('setupDeployments').doc('sd1').get();
    // The update uses dot-notation key `sharedData.destination.value` which
    // the in-memory mock stores as a nested path
    expect(sd.data().sharedData?.destination?.value).toBe(42);
  });

  it('updates config on placed tool', async () => {
    getCollection('setupDeployments').doc('sd1').set({
      status: 'active',
      spaceId: 's1',
      sharedData: { phase: 'active' },
      orchestrationRules: [
        {
          id: 'rule6',
          name: 'Update tool config',
          trigger: { type: 'data_condition', dataPath: 'phase', operator: 'eq', value: 'active' },
          actions: [
            { type: 'config', targetSlotId: 'slot1', config: { maxVotes: 5, showResults: true } },
          ],
        },
      ],
      orchestrationState: {},
      tools: [{ slotId: 'slot1', toolId: 't1', deploymentId: 'dep1' }],
    });

    getCollection('placedTools').doc('dep1').set({ config: { maxVotes: 3 } });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBe(1);

    const placed = await getCollection('placedTools').doc('dep1').get();
    const data = placed.data();
    expect(data.config?.maxVotes).toBe(5);
    expect(data.config?.showResults).toBe(true);
  });

  it('skips inactive deployments', async () => {
    getCollection('setupDeployments').doc('sd1').set({
      status: 'completed', // Not active
      spaceId: 's1',
      sharedData: { phase: 'done' },
      orchestrationRules: [
        {
          id: 'rule7',
          trigger: { type: 'data_condition', dataPath: 'phase', operator: 'eq', value: 'done' },
          actions: [{ type: 'state', updates: { final: true } }],
        },
      ],
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });
});
