import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { getServerProfileRepository } from '@hive/core/server';
import { withCache } from '../../../../../lib/cache-headers';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Channel = 'in_app' | 'push' | 'email' | 'desktop';

interface NotificationPreferences {
  enableInApp: boolean;
  enablePush: boolean;
  enableEmail: boolean;
  enableDesktop: boolean;
  quietHours?: { enabled: boolean; start: string; end: string };
  categorySettings: Record<string, { enabled: boolean; channels: Channel[]; priority: Priority }>;
  spaceSettings: Record<string, { muted?: boolean; pinned?: boolean; channels?: Channel[] }>;
}

const defaultPreferences: NotificationPreferences = {
  enableInApp: true,
  enablePush: true,
  enableEmail: false,
  enableDesktop: true,
  categorySettings: {
    social: { enabled: true, channels: ['in_app', 'push'], priority: 'medium' },
    activity: { enabled: true, channels: ['in_app'], priority: 'low' },
    system: { enabled: true, channels: ['in_app', 'push'], priority: 'high' },
    achievement: { enabled: true, channels: ['in_app', 'push'], priority: 'high' },
    reminder: { enabled: true, channels: ['in_app', 'push', 'email'], priority: 'high' },
  },
  spaceSettings: {},
};

// GET /api/profile/notifications/preferences?userId=... -> returns raw preferences object
const _GET = withAuthAndErrors(async (request, _ctx, respond) => {
  const currentUserId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId') || currentUserId;

  try {
    // Only allow reading own preferences for now
    if (targetUserId !== currentUserId) {
      return respond.error('Forbidden', 'FORBIDDEN', { status: 403 });
    }

    const ref = dbAdmin.collection('notificationPreferences').doc(targetUserId);
    const userDoc = await dbAdmin.collection('users').doc(targetUserId).get();
    const userCampus = (userDoc.exists ? userDoc.data()?.campusId : null) || campusId;
    const snap = await ref.get();
    if (!snap.exists) {
      const prefs = { ...defaultPreferences, campusId: userCampus };
      await ref.set(prefs);
      // Return raw JSON, not wrapped, to match callers
      return new Response(JSON.stringify(prefs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prefs = snap.data() as (NotificationPreferences & { campusId?: string });
    if (prefs?.campusId && prefs.campusId !== userCampus) {
      return new Response(JSON.stringify({ error: 'Access denied for this campus' }), { status: 403 });
    }

    // Get DDD profile data for space notification context
    let profileContext: {
      spaces: string[];
      connectionCount: number;
    } | null = null;

    try {
      const profileRepository = getServerProfileRepository();
      const profileResult = await profileRepository.findById(targetUserId);
      if (profileResult.isSuccess) {
        const profile = profileResult.getValue();
        profileContext = {
          spaces: profile.spaces,
          connectionCount: profile.connectionCount,
        };
      }
    } catch {
      // Non-fatal: continue without profile context
    }

    return new Response(JSON.stringify({ ...prefs, profile: profileContext }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Failed to fetch notification preferences', { error: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: 'Failed to fetch preferences' }), { status: 500 });
  }
});

// PUT /api/profile/notifications/preferences -> updates own preferences (partial)
export const PUT = withAuthAndErrors(async (request, _ctx, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  try {
    const body = await request.json();
    const { preferences } = body || {};
    const updates: Partial<NotificationPreferences> = preferences || body || {};

    const ref = dbAdmin.collection('notificationPreferences').doc(userId);
    const snap = await ref.get();
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    const userCampus = (userDoc.exists ? userDoc.data()?.campusId : null) || campusId;
    if (!snap.exists) {
      const merged = { ...defaultPreferences, ...updates, campusId: userCampus };
      await ref.set(merged);
    } else {
      const existing = snap.data() as (NotificationPreferences & { campusId?: string });
      if (existing?.campusId && existing.campusId !== userCampus) {
        return respond.error('Access denied for this campus', 'FORBIDDEN', { status: 403 });
      }
      const merged: NotificationPreferences = {
        ...existing,
        ...updates,
        categorySettings: {
          ...existing.categorySettings,
          ...(updates.categorySettings || {}),
        },
        spaceSettings: {
          ...existing.spaceSettings,
          ...(updates.spaceSettings || {}),
        },
      };
      await ref.set({ ...merged, campusId: existing?.campusId || userCampus });
    }

    // Return 200 OK with no body required; callers only check .ok
    return new Response(null, { status: 200 });
  } catch (error) {
    logger.error('Failed to update notification preferences', { error: error instanceof Error ? error.message : String(error) });
    return respond.error('Failed to update preferences', 'INTERNAL_ERROR', { status: 500 });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
