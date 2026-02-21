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
                spaceInvites: data.categorySettings?.social?.enabled ?? true,
                eventReminders: data.categorySettings?.reminder?.enabled ?? true,
                securityAlerts: data.categorySettings?.system?.enabled ?? true,
              },
              push: {
                ...prev.push,
                spaceActivity: data.enablePush ?? true,
                emergencyAlerts: data.categorySettings?.system?.enabled ?? true,
              },
              inApp: {
                ...prev.inApp,
                realTimeNotifications: data.enableInApp ?? true,
                desktopNotifications: data.enableDesktop ?? true,
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
            categorySettings: {
              social: { enabled: settings.email.spaceInvites, channels: ['in_app', 'push'], priority: 'medium' },
              reminder: { enabled: settings.email.eventReminders, channels: ['in_app', 'push', 'email'], priority: 'high' },
              system: { enabled: settings.email.securityAlerts, channels: ['in_app', 'push'], priority: 'high' },
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
