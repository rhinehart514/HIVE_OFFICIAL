import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { getServerProfileRepository, ProfilePrivacy, PrivacyLevel } from '@hive/core/server';

// Shared privacy settings shape (kept compatible with /api/privacy)
interface PrivacySettings {
  userId: string;
  ghostMode: {
    enabled: boolean;
    level: 'invisible' | 'minimal' | 'selective' | 'normal';
    hideFromDirectory: boolean;
    hideActivity: boolean;
    hideSpaceMemberships: boolean;
    hideLastSeen: boolean;
    hideOnlineStatus: boolean;
  };
  profileVisibility: {
    showToSpaceMembers: boolean;
    showToFollowers: boolean;
    showToPublic: boolean;
    hideProfilePhoto: boolean;
    hideHandle: boolean;
    hideInterests: boolean;
  };
  activitySharing: {
    shareActivityData: boolean;
    shareSpaceActivity: boolean;
    shareToolUsage: boolean;
    shareContentCreation: boolean;
    allowAnalytics: boolean;
  };
  notifications: {
    enableActivityNotifications: boolean;
    enableSpaceNotifications: boolean;
    enableToolNotifications: boolean;
    enableRitualNotifications: boolean;
  };
  dataRetention: {
    retainActivityData: boolean;
    retentionPeriod: number; // days
    autoDeleteInactiveData: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const defaultPrivacy: Omit<PrivacySettings, 'userId' | 'createdAt' | 'updatedAt'> = {
  ghostMode: {
    enabled: false,
    level: 'normal',
    hideFromDirectory: false,
    hideActivity: false,
    hideSpaceMemberships: false,
    hideLastSeen: false,
    hideOnlineStatus: false,
  },
  profileVisibility: {
    showToSpaceMembers: true,
    showToFollowers: true,
    showToPublic: false,
    hideProfilePhoto: false,
    hideHandle: false,
    hideInterests: false,
  },
  activitySharing: {
    shareActivityData: false,
    shareSpaceActivity: true,
    shareToolUsage: false,
    shareContentCreation: true,
    allowAnalytics: true,
  },
  notifications: {
    enableActivityNotifications: true,
    enableSpaceNotifications: true,
    enableToolNotifications: true,
    enableRitualNotifications: true,
  },
  dataRetention: {
    retainActivityData: true,
    retentionPeriod: 365,
    autoDeleteInactiveData: false,
  },
};

/**
 * GET /api/profile/privacy
 * Returns privacy settings including DDD profile-level privacy
 */
export const GET = withAuthAndErrors(async (request, _ctx, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  try {
    // Try to get DDD profile privacy first
    const profileRepository = getServerProfileRepository();
    const profileResult = await profileRepository.findById(userId);

    let dddPrivacy: {
      level: PrivacyLevel;
      showEmail: boolean;
      showPhone: boolean;
      showDorm: boolean;
      showSchedule: boolean;
      showActivity: boolean;
    } | null = null;

    if (profileResult.isSuccess) {
      const profile = profileResult.getValue();
      const privacy = profile.privacy;
      dddPrivacy = {
        level: privacy.level,
        showEmail: privacy.showEmail,
        showPhone: privacy.showPhone,
        showDorm: privacy.showDorm,
        showSchedule: privacy.showSchedule,
        showActivity: privacy.showActivity,
      };
    }

    // Get granular settings from Firestore
    const ref = dbAdmin.collection('privacySettings').doc(userId);
    const snap = await ref.get();

    if (!snap.exists) {
      const now = new Date().toISOString();
      const settings: PrivacySettings = {
        userId,
        ...defaultPrivacy,
        createdAt: now,
        updatedAt: now,
      };
      await ref.set({ ...settings, campusId: CURRENT_CAMPUS_ID } as Record<string, unknown>);

      return respond.success({
        privacy: settings,
        profilePrivacy: dddPrivacy || {
          level: PrivacyLevel.CAMPUS_ONLY,
          showEmail: false,
          showPhone: false,
          showDorm: true,
          showSchedule: false,
          showActivity: true,
        },
      });
    }

    const settings = snap.data() as (PrivacySettings & { campusId?: string });
    if (settings?.campusId && settings.campusId !== CURRENT_CAMPUS_ID) {
      return respond.error('Access denied for this campus', 'FORBIDDEN', { status: 403 });
    }

    return respond.success({
      privacy: settings,
      profilePrivacy: dddPrivacy || {
        level: PrivacyLevel.CAMPUS_ONLY,
        showEmail: false,
        showPhone: false,
        showDorm: true,
        showSchedule: false,
        showActivity: true,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch privacy via /api/profile/privacy', { error: error instanceof Error ? error.message : String(error) });
    return respond.error('Failed to fetch privacy settings', 'INTERNAL_ERROR', { status: 500 });
  }
});

/**
 * PATCH /api/profile/privacy
 * Updates privacy settings and syncs with DDD profile privacy
 */
export const PATCH = withAuthAndErrors(async (request, _ctx, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  try {
    const updates = await request.json();
    const ref = dbAdmin.collection('privacySettings').doc(userId);
    const snap = await ref.get();
    const now = new Date().toISOString();

    // Check for profile-level privacy updates that should sync to DDD
    const profilePrivacyUpdate = updates.profilePrivacy as {
      level?: string;
      showEmail?: boolean;
      showPhone?: boolean;
      showDorm?: boolean;
      showSchedule?: boolean;
      showActivity?: boolean;
    } | undefined;

    // Sync to DDD if profile-level privacy is being updated
    if (profilePrivacyUpdate) {
      const profileRepository = getServerProfileRepository();
      const profileResult = await profileRepository.findById(userId);

      if (profileResult.isSuccess) {
        const profile = profileResult.getValue();
        const currentPrivacy = profile.privacy;

        // Map level string to enum
        let newLevel = currentPrivacy.level;
        if (profilePrivacyUpdate.level) {
          switch (profilePrivacyUpdate.level) {
            case 'public':
              newLevel = PrivacyLevel.PUBLIC;
              break;
            case 'campus_only':
            case 'campus':
              newLevel = PrivacyLevel.CAMPUS_ONLY;
              break;
            case 'connections_only':
            case 'connections':
              newLevel = PrivacyLevel.CONNECTIONS_ONLY;
              break;
            case 'private':
              newLevel = PrivacyLevel.PRIVATE;
              break;
          }
        }

        const newPrivacyResult = ProfilePrivacy.create({
          level: newLevel,
          showEmail: profilePrivacyUpdate.showEmail ?? currentPrivacy.showEmail,
          showPhone: profilePrivacyUpdate.showPhone ?? currentPrivacy.showPhone,
          showDorm: profilePrivacyUpdate.showDorm ?? currentPrivacy.showDorm,
          showSchedule: profilePrivacyUpdate.showSchedule ?? currentPrivacy.showSchedule,
          showActivity: profilePrivacyUpdate.showActivity ?? currentPrivacy.showActivity,
        });

        if (newPrivacyResult.isSuccess) {
          profile.updatePrivacy(newPrivacyResult.getValue());
          const saveResult = await profileRepository.save(profile);

          if (saveResult.isSuccess) {
            logger.info('Profile privacy updated via DDD', { userId });
          } else {
            logger.warn('DDD save failed for privacy update', { userId, error: saveResult.error });
          }
        }
      }
    }

    // Update granular settings in Firestore
    let merged: PrivacySettings;
    if (!snap.exists) {
      merged = {
        userId,
        ...defaultPrivacy,
        ...updates,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      const existing = snap.data() as (PrivacySettings & { campusId?: string });
      if (existing?.campusId && existing.campusId !== CURRENT_CAMPUS_ID) {
        return respond.error('Access denied for this campus', 'FORBIDDEN', { status: 403 });
      }
      merged = {
        ...existing,
        ghostMode: { ...existing.ghostMode, ...(updates.ghostMode || {}) },
        profileVisibility: { ...existing.profileVisibility, ...(updates.profileVisibility || {}) },
        activitySharing: { ...existing.activitySharing, ...(updates.activitySharing || {}) },
        notifications: { ...existing.notifications, ...(updates.notifications || {}) },
        dataRetention: { ...existing.dataRetention, ...(updates.dataRetention || {}) },
        updatedAt: now,
      };
    }

    await ref.set({ ...merged, campusId: (snap.data() as Record<string, unknown>)?.campusId || CURRENT_CAMPUS_ID } as Record<string, unknown>);
    return respond.success({ privacy: merged, message: 'Privacy settings updated' });
  } catch (error) {
    logger.error('Failed to update privacy via /api/profile/privacy', { error: error instanceof Error ? error.message : String(error) });
    return respond.error('Failed to update privacy settings', 'INTERNAL_ERROR', { status: 500 });
  }
});
