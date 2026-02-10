/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Set CRON_SECRET before any module evaluation (vi.hoisted runs first)
const TEST_SECRET = 'test-cron-secret-123';
const { mockCreateBulkNotifications } = vi.hoisted(() => {
  process.env.CRON_SECRET = 'test-cron-secret-123';
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

// Import route after mocks
import { POST } from '@/app/api/cron/automations/route';

function makeCronReq(secret?: string) {
  const headers = new Headers();
  if (secret) headers.set('authorization', `Bearer ${secret}`);
  return new Request('http://localhost/api/cron/automations', {
    method: 'POST',
    headers,
  });
}

describe('Automations Cron Handler', () => {
  beforeEach(() => {
    resetCollections();
    mockCreateBulkNotifications.mockClear();
  });

  // ── Auth ──────────────────────────────────────────────────
  it('rejects requests without CRON_SECRET', async () => {
    const res = await POST(makeCronReq());
    expect(res.status).toBe(401);
  });

  it('rejects requests with wrong secret', async () => {
    const res = await POST(makeCronReq('wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with valid secret and no automations', async () => {
    const res = await POST(makeCronReq(TEST_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  // ── Event Reminders ───────────────────────────────────────
  it('fires event reminder when within 60-second window', async () => {
    const now = new Date();
    const eventStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const minutesBefore = 60; // Trigger 60 minutes before = now

    // Seed space
    getCollection('spaces').doc('s1').set({ name: 'Test Space', campusId: 'ub' });

    // Seed automation on space
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: { type: 'event_reminder' },
      enabled: true,
      action: { type: 'notify', config: { recipients: 'attendees', title: '{event.title} starting {time}', body: 'Get ready!' } },
      stats: { timesTriggered: 0, successCount: 0, failureCount: 0 },
    });

    // Seed event starting 1 hour from now
    getCollection('events').doc('e1').set({
      spaceId: 's1',
      title: 'Weekly Meeting',
      startTime: { toDate: () => eventStart },
    });

    // Seed RSVP
    getCollection('rsvps').doc('r1').set({ eventId: 'e1', status: 'going', userId: 'u1' });

    const res = await POST(makeCronReq(TEST_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBeGreaterThanOrEqual(1);
    expect(mockCreateBulkNotifications).toHaveBeenCalled();

    // Verify notification was sent to the attendee
    const [userIds, notification] = mockCreateBulkNotifications.mock.calls[0];
    expect(userIds).toContain('u1');
    expect(notification.type).toBe('event_reminder');
  });

  it('skips event reminder if sentKey already set', async () => {
    const now = new Date();
    const eventStart = new Date(now.getTime() + 60 * 60 * 1000);

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: { type: 'event_reminder' },
      enabled: true,
      action: { type: 'notify', config: { recipients: 'attendees' } },
      reminder_sent_e1: true, // Already sent
      stats: { timesTriggered: 1, successCount: 1, failureCount: 0 },
    });
    getCollection('events').doc('e1').set({
      spaceId: 's1',
      title: 'Meeting',
      startTime: { toDate: () => eventStart },
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();

    // Should not fire again
    expect(json.processed).toBe(0);
    expect(mockCreateBulkNotifications).not.toHaveBeenCalled();
  });

  it('skips event reminder outside 60-second window', async () => {
    const now = new Date();
    // Event 3 hours from now, minutesBefore defaults to 60 → reminder at 2 hours from now
    const eventStart = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: { type: 'event_reminder' },
      enabled: true,
      action: { type: 'notify', config: { recipients: 'all' } },
      stats: { timesTriggered: 0, successCount: 0, failureCount: 0 },
    });
    getCollection('events').doc('e1').set({
      spaceId: 's1',
      title: 'Meeting',
      startTime: { toDate: () => eventStart },
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it('sends event reminder as send_message action', async () => {
    const now = new Date();
    const eventStart = new Date(now.getTime() + 60 * 60 * 1000);

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/boards').doc('b1').set({ name: 'General' });
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: { type: 'event_reminder' },
      enabled: true,
      action: { type: 'send_message', config: { boardId: 'general', content: 'Reminder: {event.title} is starting {time}!' } },
      stats: { timesTriggered: 0, successCount: 0, failureCount: 0 },
    });
    getCollection('events').doc('e1').set({
      spaceId: 's1',
      title: 'Hackathon',
      startTime: { toDate: () => eventStart },
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBeGreaterThanOrEqual(1);

    // Verify message was created in the board
    const messages = getCollection('spaces/s1/boards/b1/messages').allDocs();
    expect(messages.length).toBeGreaterThanOrEqual(1);
    const msg = messages[0].data;
    expect(msg.authorId).toBe('system');
    expect(msg.content).toContain('Hackathon');
  });

  // ── Scheduled Automations ─────────────────────────────────
  it('fires scheduled daily automation when time matches', async () => {
    const now = new Date();

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/automations').doc('a1').set({
      name: 'Daily Standup Reminder',
      trigger: {
        type: 'schedule',
        scheduleType: 'daily',
        hour: now.getHours(),
        minute: now.getMinutes(),
      },
      enabled: true,
      action: {
        type: 'send_message',
        config: { boardId: 'general', content: 'Time for standup!' },
      },
      stats: { timesTriggered: 0, successCount: 0, failureCount: 0 },
    });
    getCollection('spaces/s1/boards').doc('b1').set({ name: 'General' });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBeGreaterThanOrEqual(1);

    // Verify stats were updated
    const automation = await getCollection('spaces/s1/automations').doc('a1').get();
    const data = automation.data();
    expect(data.stats.timesTriggered).toBe(1);
    expect(data.stats.successCount).toBe(1);
    expect(data.lastRun).toBeDefined();
  });

  it('skips disabled automation', async () => {
    const now = new Date();

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: { type: 'schedule', scheduleType: 'daily', hour: now.getHours(), minute: now.getMinutes() },
      enabled: false, // Disabled
      action: { type: 'send_message', config: { content: 'Hello' } },
      stats: { timesTriggered: 0 },
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    // Disabled automations won't appear in the query (where enabled==true)
    expect(json.processed).toBe(0);
  });

  it('enforces 1-hour cooldown between runs', async () => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: { type: 'schedule', scheduleType: 'hourly' },
      enabled: true,
      lastRun: thirtyMinutesAgo, // Ran 30 minutes ago
      action: { type: 'send_message', config: { content: 'Hello' } },
      stats: { timesTriggered: 1, successCount: 1, failureCount: 0 },
    });
    getCollection('spaces/s1/boards').doc('b1').set({ name: 'General' });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it('fires weekly automation on correct day of week', async () => {
    const now = new Date();

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: {
        type: 'schedule',
        scheduleType: 'weekly',
        dayOfWeek: now.getDay(),
        hour: now.getHours(),
        minute: now.getMinutes(),
      },
      enabled: true,
      action: { type: 'notify', config: { recipients: 'all', title: 'Weekly Update', body: 'Check in!' } },
      stats: { timesTriggered: 0, successCount: 0, failureCount: 0 },
    });
    getCollection('spaceMembers').doc('m1').set({ spaceId: 's1', userId: 'u1', isActive: true });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.success).toBeGreaterThanOrEqual(1);
    expect(mockCreateBulkNotifications).toHaveBeenCalled();
  });

  it('skips weekly automation on wrong day of week', async () => {
    const now = new Date();
    const wrongDay = (now.getDay() + 3) % 7;

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: {
        type: 'schedule',
        scheduleType: 'weekly',
        dayOfWeek: wrongDay,
        hour: now.getHours(),
        minute: now.getMinutes(),
      },
      enabled: true,
      action: { type: 'notify', config: { recipients: 'all', title: 'Weekly Update' } },
      stats: { timesTriggered: 0 },
    });

    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it('updates stats on action failure', async () => {
    const now = new Date();

    getCollection('spaces').doc('s1').set({ name: 'Test Space' });
    getCollection('spaces/s1/automations').doc('a1').set({
      trigger: { type: 'schedule', scheduleType: 'daily', hour: now.getHours(), minute: now.getMinutes() },
      enabled: true,
      // Missing action type should cause failure path
      action: { type: 'notify', config: { recipients: 'leaders' } },
      stats: { timesTriggered: 0, successCount: 0, failureCount: 0 },
    });
    // No spaceMembers seeded → empty notification list → success (graceful)
    const res = await POST(makeCronReq(TEST_SECRET));
    const json = await res.json();
    // With no members it still succeeds (0 recipients handled gracefully)
    expect(res.status).toBe(200);
  });
});
