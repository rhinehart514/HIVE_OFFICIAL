'use client';

/**
 * /notifications/settings — Notification Preferences
 *
 * Archetype: Orientation
 * Purpose: Configure notification preferences
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - Control push notification channels
 * - Email digest preferences
 * - Quiet hours settings
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Mail, Moon, Smartphone, MessageSquare, Calendar, Users, Zap } from 'lucide-react';
import { Text, Heading, Card, Button, Switch } from '@hive/ui/design-system/primitives';
import { useAuth } from '@hive/auth-logic';
import { useToast } from '@hive/ui';

interface NotificationPreferences {
  // Push notifications
  pushEnabled: boolean;
  pushMessages: boolean;
  pushMentions: boolean;
  pushEvents: boolean;
  pushSpaceActivity: boolean;

  // Email
  emailEnabled: boolean;
  emailDigestFrequency: 'daily' | 'weekly' | 'never';

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

// API schema for notification preferences
type Channel = 'in_app' | 'push' | 'email' | 'desktop';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface ApiNotificationPreferences {
  enableInApp: boolean;
  enablePush: boolean;
  enableEmail: boolean;
  enableDesktop: boolean;
  quietHours?: { enabled: boolean; start: string; end: string };
  categorySettings: Record<string, { enabled: boolean; channels: Channel[]; priority: Priority }>;
  spaceSettings: Record<string, { muted?: boolean; pinned?: boolean; channels?: Channel[] }>;
}

// Convert API schema to UI schema
function apiToUiPreferences(api: ApiNotificationPreferences): NotificationPreferences {
  const social = api.categorySettings?.social;
  const activity = api.categorySettings?.activity;
  const reminder = api.categorySettings?.reminder;

  return {
    pushEnabled: api.enablePush,
    pushMessages: social?.enabled && social?.channels?.includes('push') || false,
    pushMentions: social?.enabled && social?.channels?.includes('push') || false,
    pushEvents: reminder?.enabled && reminder?.channels?.includes('push') || false,
    pushSpaceActivity: activity?.enabled && activity?.channels?.includes('push') || false,

    emailEnabled: api.enableEmail,
    emailDigestFrequency: api.enableEmail ? 'weekly' : 'never',

    quietHoursEnabled: api.quietHours?.enabled || false,
    quietHoursStart: api.quietHours?.start || '22:00',
    quietHoursEnd: api.quietHours?.end || '08:00',
  };
}

// Convert UI schema to API schema
function uiToApiPreferences(ui: NotificationPreferences): Partial<ApiNotificationPreferences> {
  return {
    enablePush: ui.pushEnabled,
    enableEmail: ui.emailEnabled,
    enableInApp: true,
    enableDesktop: true,
    quietHours: {
      enabled: ui.quietHoursEnabled,
      start: ui.quietHoursStart,
      end: ui.quietHoursEnd,
    },
    categorySettings: {
      social: {
        enabled: ui.pushMessages || ui.pushMentions,
        channels: ui.pushEnabled ? ['in_app', 'push'] : ['in_app'],
        priority: 'medium' as Priority,
      },
      activity: {
        enabled: ui.pushSpaceActivity,
        channels: ui.pushSpaceActivity && ui.pushEnabled ? ['in_app', 'push'] : ['in_app'],
        priority: 'low' as Priority,
      },
      reminder: {
        enabled: ui.pushEvents,
        channels: ui.pushEvents && ui.pushEnabled
          ? (ui.emailEnabled ? ['in_app', 'push', 'email'] : ['in_app', 'push'])
          : ['in_app'],
        priority: 'high' as Priority,
      },
      system: {
        enabled: true,
        channels: ui.pushEnabled ? ['in_app', 'push'] : ['in_app'],
        priority: 'high' as Priority,
      },
      achievement: {
        enabled: true,
        channels: ui.pushEnabled ? ['in_app', 'push'] : ['in_app'],
        priority: 'high' as Priority,
      },
    },
  };
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [preferences, setPreferences] = React.useState<NotificationPreferences>({
    pushEnabled: true,
    pushMessages: true,
    pushMentions: true,
    pushEvents: true,
    pushSpaceActivity: false,

    emailEnabled: true,
    emailDigestFrequency: 'weekly',

    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = React.useState(true);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/enter?from=/notifications/settings');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load preferences from API
  React.useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/profile/notifications/preferences', {
          credentials: 'include',
        });

        if (response.ok) {
          const apiPrefs = await response.json();
          setPreferences(apiToUiPreferences(apiPrefs));
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoadingPrefs(false);
      }
    };

    loadPreferences();
  }, [isAuthenticated, authLoading]);

  // Toggle preference
  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save preferences to API
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiPrefs = uiToApiPreferences(preferences);

      const response = await fetch('/api/profile/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(apiPrefs),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Preferences saved', 'Your notification settings have been updated.');
      router.push('/notifications');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Save failed', 'Could not save your preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = authLoading || isLoadingPrefs;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/notifications"
            className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <Heading level={1} className="text-xl">
              Notification Settings
            </Heading>
            <Text size="sm" tone="muted">
              Control how you're notified
            </Text>
          </div>
        </div>

        {/* Push Notifications */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="h-4 w-4 text-white/40" />
            <Text weight="medium" className="uppercase text-xs tracking-wider text-white/40">
              Push Notifications
            </Text>
          </div>

          <Card className="divide-y divide-white/[0.04]">
            <SettingRow
              icon={Bell}
              title="Enable Push Notifications"
              description="Receive notifications on your device"
              checked={preferences.pushEnabled}
              onChange={() => togglePreference('pushEnabled')}
            />
            {preferences.pushEnabled && (
              <>
                <SettingRow
                  icon={MessageSquare}
                  title="Direct Messages"
                  description="When someone sends you a message"
                  checked={preferences.pushMessages}
                  onChange={() => togglePreference('pushMessages')}
                />
                <SettingRow
                  icon={Users}
                  title="Mentions"
                  description="When someone mentions you"
                  checked={preferences.pushMentions}
                  onChange={() => togglePreference('pushMentions')}
                />
                <SettingRow
                  icon={Calendar}
                  title="Events"
                  description="Event reminders and updates"
                  checked={preferences.pushEvents}
                  onChange={() => togglePreference('pushEvents')}
                />
                <SettingRow
                  icon={Zap}
                  title="Space Activity"
                  description="Posts and updates in your spaces"
                  checked={preferences.pushSpaceActivity}
                  onChange={() => togglePreference('pushSpaceActivity')}
                />
              </>
            )}
          </Card>
        </section>

        {/* Email */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-4 w-4 text-white/40" />
            <Text weight="medium" className="uppercase text-xs tracking-wider text-white/40">
              Email
            </Text>
          </div>

          <Card className="divide-y divide-white/[0.04]">
            <SettingRow
              icon={Mail}
              title="Email Notifications"
              description="Receive email updates"
              checked={preferences.emailEnabled}
              onChange={() => togglePreference('emailEnabled')}
            />
            {preferences.emailEnabled && (
              <div className="p-4">
                <Text weight="medium" size="sm" className="mb-2">Digest Frequency</Text>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'never'] as const).map(freq => (
                    <button
                      key={freq}
                      onClick={() => setPreferences(prev => ({ ...prev, emailDigestFrequency: freq }))}
                      className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                        preferences.emailDigestFrequency === freq
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* Quiet Hours */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="h-4 w-4 text-white/40" />
            <Text weight="medium" className="uppercase text-xs tracking-wider text-white/40">
              Quiet Hours
            </Text>
          </div>

          <Card className="divide-y divide-white/[0.04]">
            <SettingRow
              icon={Moon}
              title="Enable Quiet Hours"
              description="Pause notifications during set times"
              checked={preferences.quietHoursEnabled}
              onChange={() => togglePreference('quietHoursEnabled')}
            />
            {preferences.quietHoursEnabled && (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text size="xs" tone="muted" className="mb-1">Start</Text>
                    <input
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <Text size="xs" tone="muted" className="mb-1">End</Text>
                    <input
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* Save button */}
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/notifications')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-white/40" />
        <div>
          <Text weight="medium" size="sm">{title}</Text>
          <Text size="xs" tone="muted">{description}</Text>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
