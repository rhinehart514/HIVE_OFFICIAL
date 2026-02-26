'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from '@hive/hooks';
import { logger } from '@/lib/structured-logger';
import { toast } from '@hive/ui';
import type { NotificationSettings, PrivacySettings, AccountSettings, CalendarStatus, ExportProgress } from '../types';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: {
    spaceInvites: true,
    eventReminders: true,
    toolUpdates: true,
    weeklyDigest: true,
    securityAlerts: true,
    directMessages: true,
    mentionsAndReplies: true,
    builderUpdates: false,
  },
  push: {
    spaceActivity: true,
    toolLaunches: true,
    eventReminders: true,
    directMessages: true,
    weeklyDigest: false,
    emergencyAlerts: true,
  },
  inApp: {
    realTimeNotifications: true,
    soundEffects: true,
    desktopNotifications: true,
    emailPreview: true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
  spaceSettings: {},
};

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'public',
  showActivity: true,
  showSpaces: true,
  showConnections: true,
  showOnlineStatus: true,
  allowDirectMessages: true,
  ghostMode: {
    enabled: false,
    level: 'moderate',
    duration: '1h',
    expiresAt: null,
  },
};

const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  theme: 'dark',
  emailFrequency: 'daily',
  dataRetention: {
    autoDelete: false,
    retentionDays: 365,
  },
};

export function useSettingsState(profile: unknown) {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(DEFAULT_ACCOUNT_SETTINGS);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [, setNotificationsLoaded] = useState(false);

  // Load notification settings from server on mount
  useEffect(() => {
    async function loadNotificationSettings() {
      try {
        const response = await fetch('/api/profile/notifications/preferences', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          // Map server format to local format
          if (data) {
            setNotificationSettings((prev) => ({
              ...prev,
              email: {
                ...prev.email,
                spaceInvites: data.email?.spaceInvites ?? data.categorySettings?.social?.enabled ?? prev.email.spaceInvites,
                eventReminders: data.email?.eventReminders ?? data.categorySettings?.reminder?.enabled ?? prev.email.eventReminders,
                toolUpdates: data.email?.toolUpdates ?? data.categorySettings?.tools?.enabled ?? prev.email.toolUpdates,
                weeklyDigest: data.email?.weeklyDigest ?? data.enableEmail ?? prev.email.weeklyDigest,
                securityAlerts: data.email?.securityAlerts ?? data.categorySettings?.system?.enabled ?? prev.email.securityAlerts,
                directMessages: data.email?.directMessages ?? data.categorySettings?.messaging?.enabled ?? prev.email.directMessages,
                mentionsAndReplies: data.email?.mentionsAndReplies ?? prev.email.mentionsAndReplies,
                builderUpdates: data.email?.builderUpdates ?? prev.email.builderUpdates,
              },
              push: {
                ...prev.push,
                spaceActivity: data.push?.spaceActivity ?? data.enablePush ?? prev.push.spaceActivity,
                toolLaunches: data.push?.toolLaunches ?? prev.push.toolLaunches,
                eventReminders: data.push?.eventReminders ?? prev.push.eventReminders,
                directMessages: data.push?.directMessages ?? prev.push.directMessages,
                emergencyAlerts: data.push?.emergencyAlerts ?? data.categorySettings?.system?.enabled ?? prev.push.emergencyAlerts,
              },
              inApp: {
                ...prev.inApp,
                realTimeNotifications: data.inApp?.realTimeNotifications ?? data.enableInApp ?? prev.inApp.realTimeNotifications,
                soundEffects: data.inApp?.soundEffects ?? prev.inApp.soundEffects,
                desktopNotifications: data.inApp?.desktopNotifications ?? data.enableDesktop ?? prev.inApp.desktopNotifications,
                emailPreview: data.inApp?.emailPreview ?? prev.inApp.emailPreview,
              },
              quietHours: data.quietHours ?? prev.quietHours,
              spaceSettings: data.spaceSettings ?? {},
            }));
          }
          setNotificationsLoaded(true);
        }
      } catch (error) {
        logger.error('Failed to load notification settings', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setNotificationsLoaded(true);
      }
    }
    loadNotificationSettings();
  }, []);

  // Debounced API save for notification settings
  const saveNotificationSettings = useDebouncedCallback(
    async (...args: unknown[]) => {
      const settings = args[0] as NotificationSettings;
      try {
        const response = await fetch('/api/profile/notifications/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            enableInApp: settings.inApp.realTimeNotifications,
            enablePush: settings.push.spaceActivity,
            enableEmail: settings.email.weeklyDigest,
            enableDesktop: settings.inApp.desktopNotifications,
            quietHours: settings.quietHours,
            email: {
              spaceInvites: settings.email.spaceInvites,
              eventReminders: settings.email.eventReminders,
              toolUpdates: settings.email.toolUpdates,
              weeklyDigest: settings.email.weeklyDigest,
              securityAlerts: settings.email.securityAlerts,
              directMessages: settings.email.directMessages,
              mentionsAndReplies: settings.email.mentionsAndReplies,
              builderUpdates: settings.email.builderUpdates,
            },
            push: {
              spaceActivity: settings.push.spaceActivity,
              toolLaunches: settings.push.toolLaunches,
              eventReminders: settings.push.eventReminders,
              directMessages: settings.push.directMessages,
              emergencyAlerts: settings.push.emergencyAlerts,
            },
            inApp: {
              realTimeNotifications: settings.inApp.realTimeNotifications,
              soundEffects: settings.inApp.soundEffects,
              desktopNotifications: settings.inApp.desktopNotifications,
              emailPreview: settings.inApp.emailPreview,
            },
            categorySettings: {
              social: { enabled: settings.email.spaceInvites, channels: ['in_app', 'push'], priority: 'medium' },
              reminder: { enabled: settings.email.eventReminders, channels: ['in_app', 'push', 'email'], priority: 'high' },
              system: { enabled: settings.email.securityAlerts, channels: ['in_app', 'push'], priority: 'high' },
              tools: { enabled: settings.email.toolUpdates, channels: ['in_app', 'email'], priority: 'low' },
              messaging: { enabled: settings.email.directMessages, channels: ['in_app', 'push', 'email'], priority: 'high' },
            },
            spaceSettings: settings.spaceSettings,
          }),
        });
        if (response.ok) {
          toast.success('Notification settings saved');
        } else {
          toast.error('Failed to save notification settings');
        }
      } catch (error) {
        logger.error('Failed to save notification settings', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        toast.error('Failed to save notification settings');
      }
    },
    500
  );

  // Populate privacy settings from profile
  useEffect(() => {
    if (!profile) return;
    const profileData = profile as { privacy?: Record<string, unknown> };
    if (!profileData.privacy) return;

    const privacy = profileData.privacy;
    setPrivacySettings((prev) => ({
      ...prev,
      profileVisibility: privacy.isPublic ? 'public' : 'private',
      showActivity: Boolean(privacy.showActivity ?? true),
      showSpaces: Boolean(privacy.showSpaces ?? true),
      showConnections: Boolean(privacy.showConnections ?? true),
      showOnlineStatus: Boolean(privacy.showOnlineStatus ?? true),
      allowDirectMessages: Boolean(privacy.allowDirectMessages ?? true),
      ghostMode: (privacy.ghostMode as PrivacySettings['ghostMode']) ?? prev.ghostMode,
    }));
  }, [profile]);

  // Calendar sync not yet available — skip network call
  const loadCalendarStatus = useCallback(async () => {
    setCalendarStatus({ available: false, connected: false });
    setIsCalendarLoading(false);
  }, []);

  const handleNotificationChange = useCallback(
    (category: keyof NotificationSettings, setting: string, value: boolean) => {
      setNotificationSettings((prev) => {
        const updated = {
          ...prev,
          [category]: { ...(prev[category] as Record<string, boolean>), [setting]: value },
        };
        saveNotificationSettings(updated);
        return updated;
      });
    },
    [saveNotificationSettings]
  );

  const handlePrivacyChange = useCallback((setting: keyof PrivacySettings, value: unknown) => {
    setPrivacySettings((prev) => ({ ...prev, [setting]: value }));
  }, []);

  const handleAccountChange = useCallback((setting: keyof AccountSettings, value: unknown) => {
    setAccountSettings((prev) => ({ ...prev, [setting]: value }));
  }, []);

  return {
    notificationSettings,
    setNotificationSettings,
    privacySettings,
    setPrivacySettings,
    accountSettings,
    setAccountSettings,
    calendarStatus,
    setCalendarStatus,
    isCalendarLoading,
    setIsCalendarLoading,
    exportProgress,
    setExportProgress,
    loadCalendarStatus,
    handleNotificationChange,
    handlePrivacyChange,
    handleAccountChange,
  };
}
